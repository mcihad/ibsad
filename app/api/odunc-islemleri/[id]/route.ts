import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET single odunc
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const odunc = await prisma.odunc.findUnique({
        where: { id },
        include: {
            kitap: { select: { id: true, baslik: true, isbn: true, barkod: true } },
            uye: {
                select: {
                    id: true, adi: true, soyadi: true, kartNumarasi: true,
                    uyeTipi: { select: { gunlukCeza: true, oduncSuresi: true } },
                },
            },
            kutuphane: { select: { id: true, adi: true, kodu: true } },
        },
    });

    if (!odunc) {
        return NextResponse.json({ error: "Ödünç kaydı bulunamadı" }, { status: 404 });
    }

    // Non-admin can only see loans from their library
    if (session.role !== "ADMIN" && odunc.kutuphaneId !== session.kutuphaneId) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    return NextResponse.json(odunc);
}

// PUT update odunc (return, extend, cancel, update notes)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.odunc.findUnique({
        where: { id },
        include: {
            uye: {
                include: { uyeTipi: true },
            },
        },
    });

    if (!existing) {
        return NextResponse.json({ error: "Ödünç kaydı bulunamadı" }, { status: 404 });
    }

    // Non-admin can only edit loans from their library
    if (session.role !== "ADMIN" && existing.kutuphaneId !== session.kutuphaneId) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const action = body.action as string | undefined;

        // RETURN action
        if (action === "iade") {
            if (existing.durum === "IADE_EDILDI") {
                return NextResponse.json(
                    { error: "Bu kitap zaten iade edilmiş" },
                    { status: 400 }
                );
            }

            const iadeTarihi = new Date();
            let gecikmeCezasi: number | null = null;

            // Calculate late fee if overdue
            if (iadeTarihi > existing.sonIadeTarihi) {
                const diffTime = iadeTarihi.getTime() - existing.sonIadeTarihi.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const gunlukCeza = parseFloat(existing.uye.uyeTipi.gunlukCeza.toString());
                gecikmeCezasi = diffDays * gunlukCeza;
            }

            const odunc = await prisma.$transaction(async (tx) => {
                const updated = await tx.odunc.update({
                    where: { id },
                    data: {
                        durum: "IADE_EDILDI",
                        iadeTarihi,
                        gecikmeCezasi,
                        notlar: body.notlar ?? existing.notlar,
                    },
                });

                // Update book status back to MEVCUT
                await tx.kitap.update({
                    where: { id: existing.kitapId },
                    data: { durum: "MEVCUT" },
                });

                return updated;
            });

            return NextResponse.json(odunc);
        }

        // EXTEND action
        if (action === "uzat") {
            if (existing.durum !== "AKTIF") {
                return NextResponse.json(
                    { error: "Sadece aktif ödünç kayıtları uzatılabilir" },
                    { status: 400 }
                );
            }

            if (existing.uzatmaSayisi >= existing.maksimumUzatma) {
                return NextResponse.json(
                    { error: `Maksimum uzatma sayısına (${existing.maksimumUzatma}) ulaşılmıştır` },
                    { status: 400 }
                );
            }

            // Can't extend if overdue
            if (new Date() > existing.sonIadeTarihi) {
                return NextResponse.json(
                    { error: "Gecikmiş ödünç kayıtları uzatılamaz. Lütfen önce iade edin." },
                    { status: 400 }
                );
            }

            const yeniSonIadeTarihi = new Date(existing.sonIadeTarihi);
            yeniSonIadeTarihi.setDate(
                yeniSonIadeTarihi.getDate() + existing.uye.uyeTipi.oduncSuresi
            );

            const odunc = await prisma.odunc.update({
                where: { id },
                data: {
                    sonIadeTarihi: yeniSonIadeTarihi,
                    uzatmaSayisi: existing.uzatmaSayisi + 1,
                },
            });

            return NextResponse.json(odunc);
        }

        // CANCEL action
        if (action === "iptal") {
            if (existing.durum === "IADE_EDILDI" || existing.durum === "IPTAL") {
                return NextResponse.json(
                    { error: "Bu kayıt iptal edilemez" },
                    { status: 400 }
                );
            }

            const odunc = await prisma.$transaction(async (tx) => {
                const updated = await tx.odunc.update({
                    where: { id },
                    data: {
                        durum: "IPTAL",
                        notlar: body.notlar ?? existing.notlar,
                    },
                });

                // Update book status back to MEVCUT
                await tx.kitap.update({
                    where: { id: existing.kitapId },
                    data: { durum: "MEVCUT" },
                });

                return updated;
            });

            return NextResponse.json(odunc);
        }

        // MARK AS LOST action
        if (action === "kayip") {
            if (existing.durum !== "AKTIF" && existing.durum !== "GECIKMIS") {
                return NextResponse.json(
                    { error: "Bu kayıt kayıp olarak işaretlenemez" },
                    { status: 400 }
                );
            }

            const odunc = await prisma.$transaction(async (tx) => {
                const updated = await tx.odunc.update({
                    where: { id },
                    data: {
                        durum: "KAYIP",
                        notlar: body.notlar ?? existing.notlar,
                    },
                });

                await tx.kitap.update({
                    where: { id: existing.kitapId },
                    data: { durum: "KAYIP" },
                });

                return updated;
            });

            return NextResponse.json(odunc);
        }

        // MARK PENALTY PAID
        if (action === "ceza_odendi") {
            const odunc = await prisma.odunc.update({
                where: { id },
                data: { cezaOdendi: true },
            });
            return NextResponse.json(odunc);
        }

        // General update (notes only)
        const odunc = await prisma.odunc.update({
            where: { id },
            data: {
                notlar: body.notlar ?? existing.notlar,
            },
        });

        return NextResponse.json(odunc);
    } catch (error) {
        console.error("Odunc update error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}

// DELETE odunc (admin only, for cleanup)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
        return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.odunc.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Ödünç kaydı bulunamadı" }, { status: 404 });
    }

    // Only allow deleting cancelled or returned loans
    if (existing.durum === "AKTIF") {
        return NextResponse.json(
            { error: "Aktif ödünç kayıtları silinemez. Önce iade veya iptal edin." },
            { status: 400 }
        );
    }

    try {
        await prisma.odunc.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Odunc delete error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
