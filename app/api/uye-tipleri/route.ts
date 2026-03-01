import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET all uye tipleri (everyone can view)
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (search) {
        where.OR = [
            { adi: { contains: search, mode: "insensitive" } },
            { aciklama: { contains: search, mode: "insensitive" } },
        ];
    }

    const uyeTipleri = await prisma.uyeTipi.findMany({
        where,
        include: {
            _count: { select: { uyeler: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(uyeTipleri);
}

// POST create uye tipi (admin only)
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
            return NextResponse.json(
                { error: "Üye tipi adı zorunludur" },
                { status: 400 }
            );
        }

        const uyeTipi = await prisma.uyeTipi.create({
            data: {
                adi: body.adi,
                aciklama: body.aciklama || null,
                maksimumKitap: body.maksimumKitap ? parseInt(body.maksimumKitap) : 3,
                oduncSuresi: body.oduncSuresi ? parseInt(body.oduncSuresi) : 15,
                gunlukCeza: body.gunlukCeza ? parseFloat(body.gunlukCeza) : 1.0,
                aktif: body.aktif !== undefined ? body.aktif : true,
            },
        });

        return NextResponse.json(uyeTipi, { status: 201 });
    } catch (error) {
        console.error("UyeTipi creation error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
