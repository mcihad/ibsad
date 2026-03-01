import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST: Change devir fisi status
// Actions: gonder, teslimAl, onayla, iadeEt
export async function POST(
    request: NextRequest,
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
            kitaplar: {
                include: {
                    kitap: { select: { id: true, baslik: true, durum: true } },
                },
            },
        },
    });

    if (!devirFisi) {
        return NextResponse.json({ error: "Devir fişi bulunamadı" }, { status: 404 });
    }

    try {
        const body = await request.json();
        const { action, iadenedeni } = body;

        switch (action) {
            // TASLAK → TESLIM_BEKLIYOR
            case "gonder": {
                if (devirFisi.durum !== "TASLAK") {
                    return NextResponse.json(
                        { error: "Sadece taslak durumundaki fişler gönderilebilir" },
                        { status: 400 }
                    );
                }

                // Only creator or admin can submit
                if (session.role !== "ADMIN" && devirFisi.olusturanId !== session.id) {
                    return NextResponse.json(
                        { error: "Sadece oluşturan kişi fişi gönderebilir" },
                        { status: 403 }
                    );
                }

                if (devirFisi.kitaplar.length === 0) {
                    return NextResponse.json(
                        { error: "En az bir kitap eklenmeli" },
                        { status: 400 }
                    );
                }

                // Re-check all books are still MEVCUT
                for (const dk of devirFisi.kitaplar) {
                    if (dk.kitap.durum !== "MEVCUT") {
                        return NextResponse.json(
                            { error: `"${dk.kitap.baslik}" artık mevcut durumda değil` },
                            { status: 400 }
                        );
                    }
                }

                const updated = await prisma.devirFisi.update({
                    where: { id },
                    data: { durum: "TESLIM_BEKLIYOR" },
                });

                return NextResponse.json(updated);
            }

            // TESLIM_BEKLIYOR → ONAY_BEKLIYOR
            case "teslimAl": {
                if (devirFisi.durum !== "TESLIM_BEKLIYOR") {
                    return NextResponse.json(
                        { error: "Bu fiş teslim alınabilir durumda değil" },
                        { status: 400 }
                    );
                }

                const updated = await prisma.devirFisi.update({
                    where: { id },
                    data: {
                        durum: "ONAY_BEKLIYOR",
                        teslimTarihi: new Date(),
                    },
                });

                return NextResponse.json(updated);
            }

            // ONAY_BEKLIYOR → ONAYLANDI (books transfer!)
            case "onayla": {
                if (devirFisi.durum !== "ONAY_BEKLIYOR") {
                    return NextResponse.json(
                        { error: "Bu fiş onaylanabilir durumda değil" },
                        { status: 400 }
                    );
                }

                // Transfer books to target library + update devir fisi
                const kitapIdler = devirFisi.kitaplar.map((dk) => dk.kitapId);

                await prisma.$transaction([
                    prisma.kitap.updateMany({
                        where: { id: { in: kitapIdler } },
                        data: { kutuphaneId: devirFisi.girisKutuphaneId },
                    }),
                    prisma.devirFisi.update({
                        where: { id },
                        data: {
                            durum: "ONAYLANDI",
                            onayTarihi: new Date(),
                        },
                    }),
                ]);

                const result = await prisma.devirFisi.findUnique({
                    where: { id },
                });

                return NextResponse.json(result);
            }

            // TESLIM_BEKLIYOR/ONAY_BEKLIYOR → IADE_EDILDI
            case "iadeEt": {
                if (
                    devirFisi.durum !== "TESLIM_BEKLIYOR" &&
                    devirFisi.durum !== "ONAY_BEKLIYOR"
                ) {
                    return NextResponse.json(
                        { error: "Bu fiş iade edilebilir durumda değil" },
                        { status: 400 }
                    );
                }

                if (!iadenedeni || iadenedeni.trim() === "") {
                    return NextResponse.json(
                        { error: "İade nedeni zorunludur" },
                        { status: 400 }
                    );
                }

                const updated = await prisma.devirFisi.update({
                    where: { id },
                    data: {
                        durum: "IADE_EDILDI",
                        iadenedeni,
                    },
                });

                return NextResponse.json(updated);
            }

            default:
                return NextResponse.json(
                    { error: "Geçersiz işlem" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Devir durum change error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
