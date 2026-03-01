import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET single kutuphane
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const kutuphane = await prisma.kutuphane.findUnique({
        where: { id },
        include: {
            _count: { select: { kitaplar: true, kullanicilar: true } },
        },
    });

    if (!kutuphane) {
        return NextResponse.json(
            { error: "Kütüphane bulunamadı" },
            { status: 404 }
        );
    }

    return NextResponse.json(kutuphane);
}

// PUT update kutuphane (admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const kutuphane = await prisma.kutuphane.update({
            where: { id },
            data: {
                adi: body.adi,
                kodu: body.kodu,
                aciklama: body.aciklama || null,
                adres: body.adres || null,
                telefon: body.telefon || null,
                eposta: body.eposta || null,
                webSitesi: body.webSitesi || null,
                aktif: body.aktif ?? true,
            },
        });

        return NextResponse.json(kutuphane);
    } catch (error) {
        console.error("Kutuphane update error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}

// DELETE kutuphane (admin only)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id } = await params;

    try {
        await prisma.kutuphane.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Kutuphane delete error:", error);
        return NextResponse.json(
            { error: "Bu kütüphaneye bağlı kitaplar var" },
            { status: 400 }
        );
    }
}
