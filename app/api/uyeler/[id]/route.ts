import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET single uye
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const uye = await prisma.uye.findUnique({
        where: { id },
        include: {
            uyeTipi: { select: { id: true, adi: true, maksimumKitap: true, oduncSuresi: true } },
            kutuphane: { select: { id: true, adi: true, kodu: true } },
            _count: { select: { oduncler: true } },
        },
    });

    if (!uye) {
        return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });
    }

    // Non-admin can only see members from their library
    if (session.role !== "ADMIN" && uye.kutuphaneId !== session.kutuphaneId) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    return NextResponse.json(uye);
}

// PUT update uye
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.uye.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });
    }

    // Non-admin can only edit members from their library
    if (session.role !== "ADMIN" && existing.kutuphaneId !== session.kutuphaneId) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    try {
        const body = await request.json();

        const uye = await prisma.uye.update({
            where: { id },
            data: {
                adi: body.adi ?? existing.adi,
                soyadi: body.soyadi ?? existing.soyadi,
                tcKimlikNo: body.tcKimlikNo ?? existing.tcKimlikNo,
                kartNumarasi: body.kartNumarasi ?? existing.kartNumarasi,
                eposta: body.eposta ?? existing.eposta,
                telefon: body.telefon ?? existing.telefon,
                adres: body.adres ?? existing.adres,
                bitisTarihi: body.bitisTarihi !== undefined
                    ? (body.bitisTarihi ? new Date(body.bitisTarihi) : null)
                    : existing.bitisTarihi,
                notlar: body.notlar ?? existing.notlar,
                aktif: body.aktif ?? existing.aktif,
                uyeTipiId: body.uyeTipiId ?? existing.uyeTipiId,
                kutuphaneId: session.role === "ADMIN"
                    ? (body.kutuphaneId ?? existing.kutuphaneId)
                    : existing.kutuphaneId,
            },
        });

        return NextResponse.json(uye);
    } catch (error) {
        console.error("Uye update error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}

// DELETE uye
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.uye.findUnique({
        where: { id },
        include: { _count: { select: { oduncler: true } } },
    });

    if (!existing) {
        return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });
    }

    if (session.role !== "ADMIN" && existing.kutuphaneId !== session.kutuphaneId) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    // Check for active loans
    const activeLoans = await prisma.odunc.count({
        where: { uyeId: id, durum: "AKTIF" },
    });

    if (activeLoans > 0) {
        return NextResponse.json(
            { error: `Bu üyenin ${activeLoans} adet aktif ödünç kaydı bulunmaktadır. Önce iade işlemlerini tamamlayın.` },
            { status: 400 }
        );
    }

    try {
        await prisma.uye.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Uye delete error:", error);
        return NextResponse.json(
            { error: "Bu üyeye bağlı kayıtlar bulunmaktadır. Silme işlemi yapılamaz." },
            { status: 400 }
        );
    }
}
