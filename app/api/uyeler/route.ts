import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET all uyeler (admin: all with optional filter, others: only their library's members)
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kutuphaneId = searchParams.get("kutuphaneId");
    const uyeTipiId = searchParams.get("uyeTipiId");
    const search = searchParams.get("search");
    const aktif = searchParams.get("aktif");

    const where: Record<string, unknown> = {};

    // Non-admin users can only see their library's members
    if (session.role !== "ADMIN") {
        if (!session.kutuphaneId) {
            return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50, stats: { total: 0, aktif: 0, pasif: 0 } });
        }
        where.kutuphaneId = session.kutuphaneId;
    } else if (kutuphaneId) {
        where.kutuphaneId = kutuphaneId;
    }

    if (uyeTipiId) where.uyeTipiId = uyeTipiId;
    if (aktif === "true") where.aktif = true;
    if (aktif === "false") where.aktif = false;

    if (search) {
        where.OR = [
            { adi: { contains: search, mode: "insensitive" } },
            { soyadi: { contains: search, mode: "insensitive" } },
            { tcKimlikNo: { contains: search, mode: "insensitive" } },
            { kartNumarasi: { contains: search, mode: "insensitive" } },
            { eposta: { contains: search, mode: "insensitive" } },
        ];
    }

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    // Base filter (library scope only, not search/type filtered) for stats
    const baseWhere: Record<string, unknown> = {};
    if (session.role !== "ADMIN") {
        baseWhere.kutuphaneId = session.kutuphaneId;
    } else if (kutuphaneId) {
        baseWhere.kutuphaneId = kutuphaneId;
    }

    const [uyeler, total, totalAll, aktifCount] = await Promise.all([
        prisma.uye.findMany({
            where,
            include: {
                uyeTipi: { select: { id: true, adi: true, maksimumKitap: true, oduncSuresi: true } },
                kutuphane: { select: { id: true, adi: true, kodu: true } },
                _count: { select: { oduncler: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.uye.count({ where }),
        prisma.uye.count({ where: baseWhere }),
        prisma.uye.count({ where: { ...baseWhere, aktif: true } }),
    ]);

    return NextResponse.json({
        data: uyeler,
        total,
        page,
        pageSize,
        stats: { total: totalAll, aktif: aktifCount, pasif: totalAll - aktifCount },
    });
}

// POST create uye
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Non-admin users can only add members to their own library
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

        if (!body.adi || !body.soyadi || !body.uyeTipiId || !kutuphaneId) {
            return NextResponse.json(
                { error: "Ad, soyad, üye tipi ve kütüphane zorunludur" },
                { status: 400 }
            );
        }

        const uye = await prisma.uye.create({
            data: {
                adi: body.adi,
                soyadi: body.soyadi,
                tcKimlikNo: body.tcKimlikNo || null,
                kartNumarasi: body.kartNumarasi || null,
                eposta: body.eposta || null,
                telefon: body.telefon || null,
                adres: body.adres || null,
                bitisTarihi: body.bitisTarihi ? new Date(body.bitisTarihi) : null,
                notlar: body.notlar || null,
                aktif: body.aktif !== undefined ? body.aktif : true,
                uyeTipiId: body.uyeTipiId,
                kutuphaneId,
                olusturanId: session.id,
            },
            include: {
                uyeTipi: { select: { id: true, adi: true } },
                kutuphane: { select: { id: true, adi: true, kodu: true } },
            },
        });

        return NextResponse.json(uye, { status: 201 });
    } catch (error) {
        console.error("Uye creation error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
