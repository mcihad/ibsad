import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET — etiket listeleri (kütüphane bazlı filtreleme)
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kutuphaneId = searchParams.get("kutuphaneId");

    const where: Record<string, unknown> = { aktif: true };

    if (session.role !== "ADMIN") {
        if (!session.kutuphaneId) return NextResponse.json([]);
        where.kutuphaneId = session.kutuphaneId;
    } else if (kutuphaneId) {
        where.kutuphaneId = kutuphaneId;
    }

    const listeler = await prisma.etiketListesi.findMany({
        where,
        include: {
            tasarim: { select: { id: true, adi: true, yaziciTuru: true, etiketGenislik: true, etiketYukseklik: true } },
            kutuphane: { select: { id: true, adi: true, kodu: true } },
            olusturan: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { kitaplar: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(listeler);
}

// POST — yeni etiket listesi
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const body = await request.json();

        if (!body.adi || !body.tasarimId) {
            return NextResponse.json(
                { error: "Liste adı ve tasarım zorunludur" },
                { status: 400 }
            );
        }

        let kutuphaneId = body.kutuphaneId;
        if (session.role !== "ADMIN") {
            if (!session.kutuphaneId) {
                return NextResponse.json(
                    { error: "Bir kütüphaneye atanmamışsınız" },
                    { status: 403 }
                );
            }
            kutuphaneId = session.kutuphaneId;
        }

        if (!kutuphaneId) {
            return NextResponse.json({ error: "Kütüphane zorunludur" }, { status: 400 });
        }

        const liste = await prisma.etiketListesi.create({
            data: {
                adi: body.adi,
                aciklama: body.aciklama || null,
                tasarimId: body.tasarimId,
                kutuphaneId,
                olusturanId: session.id,
            },
            include: {
                tasarim: { select: { id: true, adi: true, yaziciTuru: true, etiketGenislik: true, etiketYukseklik: true } },
                kutuphane: { select: { id: true, adi: true, kodu: true } },
                olusturan: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { kitaplar: true } },
            },
        });

        return NextResponse.json(liste, { status: 201 });
    } catch (error) {
        console.error("Etiket listesi oluşturma hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
