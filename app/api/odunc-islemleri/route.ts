import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET odunc records with pagination and stats
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kutuphaneId = searchParams.get("kutuphaneId");
    const durum = searchParams.get("durum");
    const search = searchParams.get("search");
    const uyeId = searchParams.get("uyeId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where: Record<string, unknown> = {};

    // Non-admin users can only see their library's loans
    if (session.role !== "ADMIN") {
        if (!session.kutuphaneId) {
            return NextResponse.json({
                data: [],
                total: 0,
                page: 1,
                pageSize,
                stats: { total: 0 },
            });
        }
        where.kutuphaneId = session.kutuphaneId;
    } else if (kutuphaneId && kutuphaneId !== "all") {
        where.kutuphaneId = kutuphaneId;
    }

    if (durum && durum !== "all") where.durum = durum;
    if (uyeId) where.uyeId = uyeId;

    if (search) {
        where.OR = [
            { uye: { adi: { contains: search, mode: "insensitive" } } },
            { uye: { soyadi: { contains: search, mode: "insensitive" } } },
            { kitap: { baslik: { contains: search, mode: "insensitive" } } },
            { kitap: { isbn: { contains: search, mode: "insensitive" } } },
            { kitap: { barkod: { contains: search, mode: "insensitive" } } },
        ];
    }

    // Base where for stats (without search/durum filter)
    const baseWhere: Record<string, unknown> = {};
    if (session.role !== "ADMIN" && session.kutuphaneId) {
        baseWhere.kutuphaneId = session.kutuphaneId;
    } else if (session.role === "ADMIN" && kutuphaneId && kutuphaneId !== "all") {
        baseWhere.kutuphaneId = kutuphaneId;
    }

    const [oduncler, total, statsResult, overdueCount] = await Promise.all([
        prisma.odunc.findMany({
            where,
            include: {
                kitap: {
                    select: {
                        id: true,
                        baslik: true,
                        isbn: true,
                        barkod: true,
                        demirbasNo: true,
                    },
                },
                uye: {
                    select: {
                        id: true,
                        adi: true,
                        soyadi: true,
                        kartNumarasi: true,
                    },
                },
                kutuphane: { select: { id: true, adi: true, kodu: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.odunc.count({ where }),
        prisma.odunc.groupBy({
            by: ["durum"],
            where: baseWhere,
            _count: { id: true },
        }),
        prisma.odunc.count({
            where: {
                ...baseWhere,
                durum: "AKTIF",
                sonIadeTarihi: { lt: new Date() },
            },
        }),
    ]);

    const statusCounts: Record<string, number> = {};
    let totalAll = 0;
    for (const s of statsResult) {
        statusCounts[s.durum] = s._count.id;
        totalAll += s._count.id;
    }

    return NextResponse.json({
        data: oduncler,
        total,
        page,
        pageSize,
        stats: {
            total: totalAll,
            ...statusCounts,
            GECIKMIS: overdueCount,
        },
    });
}

// POST create odunc (loan a book)
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Non-admin users can only create loans for their own library
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

        if (!body.kitapId || !body.uyeId || !kutuphaneId) {
            return NextResponse.json(
                { error: "Kitap, üye ve kütüphane zorunludur" },
                { status: 400 }
            );
        }

        // Check if book is available
        const kitap = await prisma.kitap.findUnique({ where: { id: body.kitapId } });
        if (!kitap) {
            return NextResponse.json({ error: "Kitap bulunamadı" }, { status: 404 });
        }
        if (kitap.durum !== "MEVCUT") {
            return NextResponse.json(
                { error: "Bu kitap şu an ödünç verilebilir durumda değil" },
                { status: 400 }
            );
        }

        // Check if member is active and not over limit
        const uye = await prisma.uye.findUnique({
            where: { id: body.uyeId },
            include: { uyeTipi: true },
        });
        if (!uye) {
            return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });
        }
        if (!uye.aktif) {
            return NextResponse.json({ error: "Bu üye aktif değil" }, { status: 400 });
        }

        // Check member's active loan count
        const activeLoans = await prisma.odunc.count({
            where: { uyeId: uye.id, durum: "AKTIF" },
        });
        if (activeLoans >= uye.uyeTipi.maksimumKitap) {
            return NextResponse.json(
                { error: `Bu üye en fazla ${uye.uyeTipi.maksimumKitap} kitap ödünç alabilir. Şu an ${activeLoans} aktif ödüncü var.` },
                { status: 400 }
            );
        }

        // Check if member has overdue loans
        const overdueLoans = await prisma.odunc.count({
            where: {
                uyeId: uye.id,
                durum: "AKTIF",
                sonIadeTarihi: { lt: new Date() },
            },
        });
        if (overdueLoans > 0) {
            return NextResponse.json(
                { error: "Bu üyenin gecikmiş ödünç kayıtları bulunmaktadır. Önce iade işlemlerini tamamlayın." },
                { status: 400 }
            );
        }

        // Calculate due date from member type's loan period
        const oduncTarihi = body.oduncTarihi ? new Date(body.oduncTarihi) : new Date();
        const sonIadeTarihi = new Date(oduncTarihi);
        sonIadeTarihi.setDate(sonIadeTarihi.getDate() + uye.uyeTipi.oduncSuresi);

        // Create loan and update book status in a transaction
        const odunc = await prisma.$transaction(async (tx) => {
            const loan = await tx.odunc.create({
                data: {
                    kitapId: body.kitapId,
                    uyeId: body.uyeId,
                    kutuphaneId,
                    oduncTarihi,
                    sonIadeTarihi,
                    notlar: body.notlar || null,
                    olusturanId: session.id,
                },
                include: {
                    kitap: { select: { id: true, baslik: true } },
                    uye: { select: { id: true, adi: true, soyadi: true } },
                    kutuphane: { select: { id: true, adi: true } },
                },
            });

            // Update book status to ODUNC
            await tx.kitap.update({
                where: { id: body.kitapId },
                data: { durum: "ODUNC" },
            });

            return loan;
        });

        return NextResponse.json(odunc, { status: 201 });
    } catch (error) {
        console.error("Odunc creation error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
