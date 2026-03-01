import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface Params {
    params: Promise<{ id: string }>;
}

// GET — tek etiket listesi (kitaplarıyla birlikte)
export async function GET(_request: NextRequest, { params }: Params) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const liste = await prisma.etiketListesi.findUnique({
        where: { id },
        include: {
            tasarim: true,
            kutuphane: { select: { id: true, adi: true, kodu: true } },
            olusturan: { select: { id: true, firstName: true, lastName: true } },
            kitaplar: {
                include: {
                    kitap: {
                        include: {
                            kutuphane: { select: { id: true, adi: true, kodu: true } },
                        },
                    },
                },
                orderBy: { sira: "asc" },
            },
        },
    });

    if (!liste) {
        return NextResponse.json({ error: "Liste bulunamadı" }, { status: 404 });
    }

    // Yetki kontrolü
    if (session.role !== "ADMIN" && liste.kutuphaneId !== session.kutuphaneId) {
        return NextResponse.json({ error: "Bu listeye erişim yetkiniz yok" }, { status: 403 });
    }

    return NextResponse.json(liste);
}

// PUT — güncelle
export async function PUT(request: NextRequest, { params }: Params) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const existing = await prisma.etiketListesi.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Liste bulunamadı" }, { status: 404 });
        }
        if (session.role !== "ADMIN" && existing.kutuphaneId !== session.kutuphaneId) {
            return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
        }

        const body = await request.json();

        const liste = await prisma.etiketListesi.update({
            where: { id },
            data: {
                adi: body.adi,
                aciklama: body.aciklama,
                tasarimId: body.tasarimId,
                aktif: body.aktif,
            },
            include: {
                tasarim: { select: { id: true, adi: true, yaziciTuru: true, etiketGenislik: true, etiketYukseklik: true } },
                kutuphane: { select: { id: true, adi: true, kodu: true } },
                olusturan: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { kitaplar: true } },
            },
        });

        return NextResponse.json(liste);
    } catch (error) {
        console.error("Etiket listesi güncelleme hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// DELETE — sil
export async function DELETE(_request: NextRequest, { params }: Params) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const existing = await prisma.etiketListesi.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Liste bulunamadı" }, { status: 404 });
        }
        if (session.role !== "ADMIN" && existing.kutuphaneId !== session.kutuphaneId) {
            return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
        }

        await prisma.etiketListesi.delete({ where: { id } });
        return NextResponse.json({ message: "Liste silindi" });
    } catch (error) {
        console.error("Etiket listesi silme hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
