import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET single kitap with full details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include"); // "oduncler" | "benzerYayinevi" | "benzerYazar"

    // Base kitap query
    if (!include) {
        const kitap = await prisma.kitap.findUnique({
            where: { id },
            include: {
                kutuphane: { select: { id: true, adi: true, kodu: true } },
            },
        });

        if (!kitap) {
            return NextResponse.json({ error: "Kitap bulunamadı" }, { status: 404 });
        }

        if (session.role !== "ADMIN" && kitap.kutuphaneId !== session.kutuphaneId) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        return NextResponse.json(kitap);
    }

    // Validate book exists and user has access
    const kitap = await prisma.kitap.findUnique({
        where: { id },
        select: { id: true, kutuphaneId: true, yayinevi: true, yazarlar: true },
    });

    if (!kitap) {
        return NextResponse.json({ error: "Kitap bulunamadı" }, { status: 404 });
    }

    if (session.role !== "ADMIN" && kitap.kutuphaneId !== session.kutuphaneId) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    // Lazy-loaded tab data
    if (include === "oduncler") {
        const oduncler = await prisma.odunc.findMany({
            where: { kitapId: id },
            include: {
                uye: { select: { id: true, adi: true, soyadi: true, kartNumarasi: true } },
                olusturan: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { oduncTarihi: "desc" },
        });
        return NextResponse.json(oduncler);
    }

    if (include === "benzerYayinevi") {
        if (!kitap.yayinevi) return NextResponse.json([]);
        const benzer = await prisma.kitap.findMany({
            where: {
                yayinevi: kitap.yayinevi,
                id: { not: id },
                kutuphaneId: kitap.kutuphaneId,
            },
            select: { id: true, baslik: true, yazarlar: true, yayinYili: true, durum: true, isbn: true },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
        return NextResponse.json(benzer);
    }

    if (include === "benzerYazar") {
        if (!kitap.yazarlar) return NextResponse.json([]);
        // Search for books by any of this book's authors
        const authorNames = kitap.yazarlar.split(",").map((a) => a.trim()).filter(Boolean);
        if (authorNames.length === 0) return NextResponse.json([]);

        const benzer = await prisma.kitap.findMany({
            where: {
                id: { not: id },
                kutuphaneId: kitap.kutuphaneId,
                OR: authorNames.map((name) => ({
                    yazarlar: { contains: name, mode: "insensitive" as const },
                })),
            },
            select: { id: true, baslik: true, yazarlar: true, yayinYili: true, durum: true, isbn: true },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
        return NextResponse.json(benzer);
    }

    return NextResponse.json({ error: "Geçersiz include parametresi" }, { status: 400 });
}

// PUT update kitap
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.kitap.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Kitap bulunamadı" }, { status: 404 });
    }

    // Non-admin can only edit books from their library
    if (
        session.role !== "ADMIN" &&
        existing.kutuphaneId !== session.kutuphaneId
    ) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    try {
        const body = await request.json();

        const kitap = await prisma.kitap.update({
            where: { id },
            data: {
                isbn: body.isbn ?? existing.isbn,
                baslik: body.baslik ?? existing.baslik,
                demirbasNo: body.demirbasNo ?? existing.demirbasNo,
                barkod: body.barkod ?? existing.barkod,
                yayinevi: body.yayinevi ?? existing.yayinevi,
                dil: body.dil ?? existing.dil,
                yayinYili: body.yayinYili !== undefined
                    ? (body.yayinYili ? parseInt(body.yayinYili) : null)
                    : existing.yayinYili,
                sayfaSayisi: body.sayfaSayisi !== undefined
                    ? (body.sayfaSayisi ? parseInt(body.sayfaSayisi) : null)
                    : existing.sayfaSayisi,
                durum: body.durum ?? existing.durum,
                fizikselDurum: body.fizikselDurum ?? existing.fizikselDurum,
                ozet: body.ozet ?? existing.ozet,
                notlar: body.notlar ?? existing.notlar,
                yazarlar: body.yazarlar ?? existing.yazarlar,
                aktif: body.aktif ?? existing.aktif,
                kutuphaneId: session.role === "ADMIN"
                    ? (body.kutuphaneId ?? existing.kutuphaneId)
                    : existing.kutuphaneId,
            },
        });

        return NextResponse.json(kitap);
    } catch (error) {
        console.error("Kitap update error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}

// DELETE kitap
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.kitap.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Kitap bulunamadı" }, { status: 404 });
    }

    if (
        session.role !== "ADMIN" &&
        existing.kutuphaneId !== session.kutuphaneId
    ) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    try {
        await prisma.kitap.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Kitap delete error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
