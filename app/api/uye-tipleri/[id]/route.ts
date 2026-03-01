import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET single uye tipi
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const uyeTipi = await prisma.uyeTipi.findUnique({
        where: { id },
        include: {
            _count: { select: { uyeler: true } },
        },
    });

    if (!uyeTipi) {
        return NextResponse.json({ error: "Üye tipi bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(uyeTipi);
}

// PUT update uye tipi (admin only)
export async function PUT(
    request: NextRequest,
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

    const existing = await prisma.uyeTipi.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Üye tipi bulunamadı" }, { status: 404 });
    }

    try {
        const body = await request.json();

        const uyeTipi = await prisma.uyeTipi.update({
            where: { id },
            data: {
                adi: body.adi ?? existing.adi,
                aciklama: body.aciklama ?? existing.aciklama,
                maksimumKitap: body.maksimumKitap !== undefined
                    ? parseInt(body.maksimumKitap)
                    : existing.maksimumKitap,
                oduncSuresi: body.oduncSuresi !== undefined
                    ? parseInt(body.oduncSuresi)
                    : existing.oduncSuresi,
                gunlukCeza: body.gunlukCeza !== undefined
                    ? parseFloat(body.gunlukCeza)
                    : existing.gunlukCeza,
                aktif: body.aktif ?? existing.aktif,
            },
        });

        return NextResponse.json(uyeTipi);
    } catch (error) {
        console.error("UyeTipi update error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}

// DELETE uye tipi (admin only)
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

    const existing = await prisma.uyeTipi.findUnique({
        where: { id },
        include: { _count: { select: { uyeler: true } } },
    });

    if (!existing) {
        return NextResponse.json({ error: "Üye tipi bulunamadı" }, { status: 404 });
    }

    if (existing._count.uyeler > 0) {
        return NextResponse.json(
            { error: `Bu üye tipine bağlı ${existing._count.uyeler} üye bulunmaktadır. Önce üyeleri başka bir tipe aktarın.` },
            { status: 400 }
        );
    }

    try {
        await prisma.uyeTipi.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("UyeTipi delete error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
