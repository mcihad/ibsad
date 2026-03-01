import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET — tüm etiket tasarımları (herkes görebilir)
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const tasarimlar = await prisma.etiketTasarimi.findMany({
        where: { aktif: true },
        include: {
            olusturan: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ varsayilan: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasarimlar);
}

// POST — yeni etiket tasarımı (sadece ADMIN)
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
        return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    try {
        const body = await request.json();

        if (!body.adi) {
            return NextResponse.json({ error: "Tasarım adı zorunludur" }, { status: 400 });
        }

        // Varsayılan yapılıyorsa diğerlerini kaldır
        if (body.varsayilan) {
            await prisma.etiketTasarimi.updateMany({
                where: { varsayilan: true },
                data: { varsayilan: false },
            });
        }

        const tasarim = await prisma.etiketTasarimi.create({
            data: {
                adi: body.adi,
                aciklama: body.aciklama || null,
                etiketGenislik: body.etiketGenislik ?? 70,
                etiketYukseklik: body.etiketYukseklik ?? 30,
                yaziciTuru: body.yaziciTuru || "ETIKET_YAZICI",
                sayfaGenislik: body.sayfaGenislik ?? 210,
                sayfaYukseklik: body.sayfaYukseklik ?? 297,
                satirSayisi: body.satirSayisi ?? 10,
                sutunSayisi: body.sutunSayisi ?? 3,
                sayfaKenarUst: body.sayfaKenarUst ?? 10,
                sayfaKenarAlt: body.sayfaKenarAlt ?? 10,
                sayfaKenarSol: body.sayfaKenarSol ?? 5,
                sayfaKenarSag: body.sayfaKenarSag ?? 5,
                satirAraligi: body.satirAraligi ?? 0,
                sutunAraligi: body.sutunAraligi ?? 0,
                sablon: body.sablon || "[]",
                varsayilan: body.varsayilan ?? false,
                olusturanId: session.id,
            },
            include: {
                olusturan: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        return NextResponse.json(tasarim, { status: 201 });
    } catch (error) {
        console.error("Etiket tasarımı oluşturma hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
