import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET single devir fisi
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const devirFisi = await prisma.devirFisi.findUnique({
        where: { id },
        include: {
            cikisKutuphane: { select: { id: true, adi: true, kodu: true } },
            girisKutuphane: { select: { id: true, adi: true, kodu: true } },
            teslimEden: { select: { id: true, firstName: true, lastName: true } },
            teslimAlan: { select: { id: true, firstName: true, lastName: true } },
            onaylayan: { select: { id: true, firstName: true, lastName: true } },
            olusturan: { select: { id: true, firstName: true, lastName: true } },
            kitaplar: {
                include: {
                    kitap: {
                        select: {
                            id: true,
                            baslik: true,
                            yazarlar: true,
                            isbn: true,
                            barkod: true,
                            demirbasNo: true,
                            durum: true,
                            yayinevi: true,
                            yayinYili: true,
                        },
                    },
                },
                orderBy: { sira: "asc" },
            },
        },
    });

    if (!devirFisi) {
        return NextResponse.json({ error: "Devir fişi bulunamadı" }, { status: 404 });
    }

    // Auth check: non-admin can only access transfers involving their library
    if (session.role !== "ADMIN" && session.kutuphaneId) {
        if (
            devirFisi.cikisKutuphaneId !== session.kutuphaneId &&
            devirFisi.girisKutuphaneId !== session.kutuphaneId
        ) {
            return NextResponse.json({ error: "Bu devir fişine erişim yetkiniz yok" }, { status: 403 });
        }
    }

    return NextResponse.json(devirFisi);
}

// PUT update devir fisi (only TASLAK)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.devirFisi.findUnique({
        where: { id },
        select: { durum: true, olusturanId: true, cikisKutuphaneId: true, girisKutuphaneId: true },
    });

    if (!existing) {
        return NextResponse.json({ error: "Devir fişi bulunamadı" }, { status: 404 });
    }

    if (existing.durum !== "TASLAK") {
        return NextResponse.json(
            { error: "Sadece taslak durumundaki devir fişleri düzenlenebilir" },
            { status: 400 }
        );
    }

    // Only creator or admin can edit
    if (session.role !== "ADMIN" && existing.olusturanId !== session.id) {
        return NextResponse.json({ error: "Bu devir fişini düzenleme yetkiniz yok" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const {
            cikisKutuphaneId,
            girisKutuphaneId,
            teslimEdenId,
            teslimAlanId,
            onaylayanId,
            aciklama,
            notlar,
            kitapIds,
        } = body;

        if (cikisKutuphaneId && girisKutuphaneId && cikisKutuphaneId === girisKutuphaneId) {
            return NextResponse.json(
                { error: "Çıkış ve giriş kütüphanesi aynı olamaz" },
                { status: 400 }
            );
        }

        const targetCikisId = cikisKutuphaneId || existing.cikisKutuphaneId;

        // Validate books if kitapIds provided
        if (kitapIds && kitapIds.length > 0) {
            const kitaplar = await prisma.kitap.findMany({
                where: { id: { in: kitapIds } },
                select: { id: true, baslik: true, durum: true, kutuphaneId: true },
            });

            for (const kitap of kitaplar) {
                if (kitap.durum !== "MEVCUT") {
                    return NextResponse.json(
                        { error: `"${kitap.baslik}" kitabı mevcut durumda değil` },
                        { status: 400 }
                    );
                }
                if (kitap.kutuphaneId !== targetCikisId) {
                    return NextResponse.json(
                        { error: `"${kitap.baslik}" kitabı çıkış kütüphanesine ait değil` },
                        { status: 400 }
                    );
                }
            }
        }

        const updateData: Record<string, unknown> = {};
        if (cikisKutuphaneId) updateData.cikisKutuphaneId = cikisKutuphaneId;
        if (girisKutuphaneId) updateData.girisKutuphaneId = girisKutuphaneId;
        if (teslimEdenId) updateData.teslimEdenId = teslimEdenId;
        if (teslimAlanId) updateData.teslimAlanId = teslimAlanId;
        if (onaylayanId) updateData.onaylayanId = onaylayanId;
        if (aciklama !== undefined) updateData.aciklama = aciklama || null;
        if (notlar !== undefined) updateData.notlar = notlar || null;

        // Update books if provided
        if (kitapIds) {
            // Delete existing and recreate
            await prisma.devirFisiKitap.deleteMany({ where: { devirFisiId: id } });
            updateData.kitaplar = {
                create: kitapIds.map((kitapId: string, index: number) => ({
                    kitapId,
                    sira: index,
                })),
            };
        }

        const updated = await prisma.devirFisi.update({
            where: { id },
            data: updateData,
            include: {
                cikisKutuphane: { select: { id: true, adi: true, kodu: true } },
                girisKutuphane: { select: { id: true, adi: true, kodu: true } },
                teslimEden: { select: { id: true, firstName: true, lastName: true } },
                teslimAlan: { select: { id: true, firstName: true, lastName: true } },
                onaylayan: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { kitaplar: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Devir fisi update error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}

// DELETE devir fisi (only TASLAK)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.devirFisi.findUnique({
        where: { id },
        select: { durum: true, olusturanId: true },
    });

    if (!existing) {
        return NextResponse.json({ error: "Devir fişi bulunamadı" }, { status: 404 });
    }

    if (existing.durum !== "TASLAK") {
        return NextResponse.json(
            { error: "Sadece taslak durumundaki devir fişleri silinebilir" },
            { status: 400 }
        );
    }

    if (session.role !== "ADMIN" && existing.olusturanId !== session.id) {
        return NextResponse.json({ error: "Bu devir fişini silme yetkiniz yok" }, { status: 403 });
    }

    // Delete kitaplar first (cascade should handle, but be explicit)
    await prisma.devirFisiKitap.deleteMany({ where: { devirFisiId: id } });
    await prisma.devirFisi.delete({ where: { id } });

    return NextResponse.json({ message: "Devir fişi silindi" });
}
