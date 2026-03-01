import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Generate unique fis no: DVR-YYYYMMDD-XXXX
async function generateFisNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `DVR-${dateStr}-`;

    const last = await prisma.devirFisi.findFirst({
        where: { fisNo: { startsWith: prefix } },
        orderBy: { fisNo: "desc" },
        select: { fisNo: true },
    });

    let seq = 1;
    if (last) {
        const lastSeq = parseInt(last.fisNo.split("-").pop() || "0");
        seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(4, "0")}`;
}

// GET all devir fisleri
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const durum = searchParams.get("durum");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where: Record<string, unknown> = {};

    // Non-admin users: show only transfers involving their library
    if (session.role !== "ADMIN") {
        if (!session.kutuphaneId) {
            return NextResponse.json({ data: [], total: 0, page: 1, pageSize, stats: { total: 0 } });
        }
        where.OR = [
            { cikisKutuphaneId: session.kutuphaneId },
            { girisKutuphaneId: session.kutuphaneId },
        ];
    }

    if (durum && durum !== "all") where.durum = durum;
    if (search) {
        // Need to combine with existing OR
        const searchConditions = [
            { fisNo: { contains: search, mode: "insensitive" as const } },
            { aciklama: { contains: search, mode: "insensitive" as const } },
        ];

        if (where.OR) {
            // Already have library filter, wrap in AND
            where.AND = [
                { OR: where.OR as Record<string, unknown>[] },
                { OR: searchConditions },
            ];
            delete where.OR;
        } else {
            where.OR = searchConditions;
        }
    }

    // Stats - base filter without search/status
    const baseWhere: Record<string, unknown> = {};
    if (session.role !== "ADMIN" && session.kutuphaneId) {
        baseWhere.OR = [
            { cikisKutuphaneId: session.kutuphaneId },
            { girisKutuphaneId: session.kutuphaneId },
        ];
    }

    const [devirler, total, statsResult] = await Promise.all([
        prisma.devirFisi.findMany({
            where,
            include: {
                cikisKutuphane: { select: { id: true, adi: true, kodu: true } },
                girisKutuphane: { select: { id: true, adi: true, kodu: true } },
                teslimEden: { select: { id: true, firstName: true, lastName: true } },
                teslimAlan: { select: { id: true, firstName: true, lastName: true } },
                onaylayan: { select: { id: true, firstName: true, lastName: true } },
                olusturan: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { kitaplar: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.devirFisi.count({ where }),
        prisma.devirFisi.groupBy({
            by: ["durum"],
            where: baseWhere,
            _count: { id: true },
        }),
    ]);

    const statusCounts: Record<string, number> = {};
    let totalAll = 0;
    for (const s of statsResult) {
        statusCounts[s.durum] = s._count.id;
        totalAll += s._count.id;
    }

    return NextResponse.json({
        data: devirler,
        total,
        page,
        pageSize,
        stats: { total: totalAll, ...statusCounts },
    });
}

// POST create devir fisi
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const {
            cikisKutuphaneId,
            girisKutuphaneId,
            teslimEdenId,
            teslimAlanId,
            onaylayanId,
            aciklama,
            notlar,
            kitapIds,
        } = body;

        if (!cikisKutuphaneId || !girisKutuphaneId || !teslimEdenId || !teslimAlanId || !onaylayanId) {
            return NextResponse.json(
                { error: "Çıkış/giriş kütüphanesi, teslim eden, teslim alan ve onaylayan zorunludur" },
                { status: 400 }
            );
        }

        if (cikisKutuphaneId === girisKutuphaneId) {
            return NextResponse.json(
                { error: "Çıkış ve giriş kütüphanesi aynı olamaz" },
                { status: 400 }
            );
        }

        if (!kitapIds || kitapIds.length === 0) {
            return NextResponse.json(
                { error: "En az bir kitap eklemelisiniz" },
                { status: 400 }
            );
        }

        // Validate books are MEVCUT and belong to cikis kutuphane
        const kitaplar = await prisma.kitap.findMany({
            where: { id: { in: kitapIds } },
            select: { id: true, baslik: true, durum: true, kutuphaneId: true },
        });

        for (const kitap of kitaplar) {
            if (kitap.durum !== "MEVCUT") {
                return NextResponse.json(
                    { error: `"${kitap.baslik}" kitabı mevcut durumda değil, devir yapılamaz` },
                    { status: 400 }
                );
            }
            if (kitap.kutuphaneId !== cikisKutuphaneId) {
                return NextResponse.json(
                    { error: `"${kitap.baslik}" kitabı çıkış kütüphanesine ait değil` },
                    { status: 400 }
                );
            }
        }

        const fisNo = await generateFisNo();

        const devirFisi = await prisma.devirFisi.create({
            data: {
                fisNo,
                aciklama: aciklama || null,
                notlar: notlar || null,
                cikisKutuphaneId,
                girisKutuphaneId,
                teslimEdenId,
                teslimAlanId,
                onaylayanId,
                olusturanId: session.id,
                kitaplar: {
                    create: kitapIds.map((kitapId: string, index: number) => ({
                        kitapId,
                        sira: index,
                    })),
                },
            },
            include: {
                cikisKutuphane: { select: { id: true, adi: true, kodu: true } },
                girisKutuphane: { select: { id: true, adi: true, kodu: true } },
                teslimEden: { select: { id: true, firstName: true, lastName: true } },
                teslimAlan: { select: { id: true, firstName: true, lastName: true } },
                onaylayan: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { kitaplar: true } },
            },
        });

        return NextResponse.json(devirFisi, { status: 201 });
    } catch (error) {
        console.error("Devir fisi creation error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
