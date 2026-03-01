import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface Params {
    params: Promise<{ id: string }>;
}

// GET — tek etiket tasarımı
export async function GET(_request: NextRequest, { params }: Params) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const tasarim = await prisma.etiketTasarimi.findUnique({
        where: { id },
        include: {
            olusturan: { select: { id: true, firstName: true, lastName: true } },
        },
    });

    if (!tasarim) {
        return NextResponse.json({ error: "Tasarım bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(tasarim);
}

// PUT — güncelle (sadece ADMIN)
export async function PUT(request: NextRequest, { params }: Params) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
        return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        // Varsayılan yapılıyorsa diğerlerini kaldır
        if (body.varsayilan) {
            await prisma.etiketTasarimi.updateMany({
                where: { varsayilan: true, id: { not: id } },
                data: { varsayilan: false },
            });
        }

        const tasarim = await prisma.etiketTasarimi.update({
            where: { id },
            data: {
                adi: body.adi,
                aciklama: body.aciklama,
                etiketGenislik: body.etiketGenislik,
                etiketYukseklik: body.etiketYukseklik,
                yaziciTuru: body.yaziciTuru,
                sayfaGenislik: body.sayfaGenislik,
                sayfaYukseklik: body.sayfaYukseklik,
                satirSayisi: body.satirSayisi,
                sutunSayisi: body.sutunSayisi,
                sayfaKenarUst: body.sayfaKenarUst,
                sayfaKenarAlt: body.sayfaKenarAlt,
                sayfaKenarSol: body.sayfaKenarSol,
                sayfaKenarSag: body.sayfaKenarSag,
                satirAraligi: body.satirAraligi,
                sutunAraligi: body.sutunAraligi,
                sablon: body.sablon,
                varsayilan: body.varsayilan,
                aktif: body.aktif,
            },
            include: {
                olusturan: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        return NextResponse.json(tasarim);
    } catch (error) {
        console.error("Etiket tasarımı güncelleme hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// DELETE — sil (sadece ADMIN)
export async function DELETE(_request: NextRequest, { params }: Params) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
        return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    const { id } = await params;

    try {
        // Bağlı etiket listesi var mı kontrol et
        const listCount = await prisma.etiketListesi.count({
            where: { tasarimId: id },
        });

        if (listCount > 0) {
            // Soft-delete
            await prisma.etiketTasarimi.update({
                where: { id },
                data: { aktif: false },
            });
            return NextResponse.json({ message: "Tasarım pasif yapıldı (bağlı listeler mevcut)" });
        }

        await prisma.etiketTasarimi.delete({ where: { id } });
        return NextResponse.json({ message: "Tasarım silindi" });
    } catch (error) {
        console.error("Etiket tasarımı silme hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
