import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET all kitaplar (admin: all, others: only their library's books)
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kutuphaneId = searchParams.get("kutuphaneId");
    const durum = searchParams.get("durum");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where: Record<string, unknown> = {};

    // Non-admin users can only see their library's books
    if (session.role !== "ADMIN") {
        if (!session.kutuphaneId) {
            return NextResponse.json({ data: [], total: 0, page: 1, pageSize });
        }
        where.kutuphaneId = session.kutuphaneId;
    } else if (kutuphaneId) {
        where.kutuphaneId = kutuphaneId;
    }

    if (durum) where.durum = durum;
    if (search) {
        where.OR = [
            { baslik: { contains: search, mode: "insensitive" } },
            { isbn: { contains: search, mode: "insensitive" } },
            { yazarlar: { contains: search, mode: "insensitive" } },
            { barkod: { contains: search, mode: "insensitive" } },
            { demirbasNo: { contains: search, mode: "insensitive" } },
        ];
    }

    // Base filter (library scope only, not search/status filtered)
    const baseWhere: Record<string, unknown> = {};
    if (session.role !== "ADMIN") {
        baseWhere.kutuphaneId = session.kutuphaneId;
    } else if (kutuphaneId) {
        baseWhere.kutuphaneId = kutuphaneId;
    }

    const [kitaplar, total, stats] = await Promise.all([
        prisma.kitap.findMany({
            where,
            include: {
                kutuphane: { select: { id: true, adi: true, kodu: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.kitap.count({ where }),
        prisma.kitap.groupBy({
            by: ["durum"],
            where: baseWhere,
            _count: { id: true },
        }),
    ]);

    const statusCounts: Record<string, number> = {};
    let totalAll = 0;
    for (const s of stats) {
        statusCounts[s.durum] = s._count.id;
        totalAll += s._count.id;
    }

    return NextResponse.json({ data: kitaplar, total, page, pageSize, stats: { total: totalAll, ...statusCounts } });
}

// POST create kitap
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Non-admin users can only add books to their own library
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

        if (!body.baslik || !kutuphaneId) {
            return NextResponse.json(
                { error: "Başlık ve kütüphane zorunludur" },
                { status: 400 }
            );
        }

        const kitap = await prisma.kitap.create({
            data: {
                isbn: body.isbn || null,
                baslik: body.baslik,
                demirbasNo: body.demirbasNo || null,
                barkod: body.barkod || null,
                yayinevi: body.yayinevi || null,
                dil: body.dil || null,
                yayinYili: body.yayinYili ? parseInt(body.yayinYili) : null,
                sayfaSayisi: body.sayfaSayisi ? parseInt(body.sayfaSayisi) : null,
                durum: body.durum || "MEVCUT",
                fizikselDurum: body.fizikselDurum || "IYI",
                ozet: body.ozet || null,
                notlar: body.notlar || null,
                yazarlar: body.yazarlar || null,
                kutuphaneId,
            },
        });

        return NextResponse.json(kitap, { status: 201 });
    } catch (error) {
        console.error("Kitap creation error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
