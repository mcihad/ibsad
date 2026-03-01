import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET all kutuphaneler
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const kutuphaneler = await prisma.kutuphane.findMany({
        include: {
            _count: { select: { kitaplar: true, kullanicilar: true } },
        },
        orderBy: { adi: "asc" },
    });

    return NextResponse.json(kutuphaneler);
}

// POST create kutuphane (admin only)
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { adi, kodu, aciklama, adres, telefon, eposta, webSitesi } = body;

        if (!adi || !kodu) {
            return NextResponse.json(
                { error: "Kütüphane adı ve kodu zorunludur" },
                { status: 400 }
            );
        }

        const existing = await prisma.kutuphane.findUnique({ where: { kodu } });
        if (existing) {
            return NextResponse.json(
                { error: "Bu kütüphane kodu zaten kullanılıyor" },
                { status: 409 }
            );
        }

        const kutuphane = await prisma.kutuphane.create({
            data: {
                adi,
                kodu,
                aciklama: aciklama || null,
                adres: adres || null,
                telefon: telefon || null,
                eposta: eposta || null,
                webSitesi: webSitesi || null,
            },
        });

        return NextResponse.json(kutuphane, { status: 201 });
    } catch (error) {
        console.error("Kutuphane creation error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
