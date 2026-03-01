import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface Params {
    params: Promise<{ id: string }>;
}

// POST — listeye kitap ekle
export async function POST(request: NextRequest, { params }: Params) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id: listeId } = await params;

    try {
        const liste = await prisma.etiketListesi.findUnique({ where: { id: listeId } });
        if (!liste) {
            return NextResponse.json({ error: "Liste bulunamadı" }, { status: 404 });
        }
        if (session.role !== "ADMIN" && liste.kutuphaneId !== session.kutuphaneId) {
            return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
        }

        const body = await request.json();

        // Tek kitap veya çoklu kitap desteği
        const kitapIds: string[] = Array.isArray(body.kitapIds)
            ? body.kitapIds
            : body.kitapId
                ? [body.kitapId]
                : [];

        if (kitapIds.length === 0) {
            return NextResponse.json({ error: "En az bir kitap ID gerekli" }, { status: 400 });
        }

        const adet = body.adet ?? 1;

        // Mevcut en yüksek sıra numarasını al
        const maxSira = await prisma.etiketListesiKitap.findFirst({
            where: { listeId },
            orderBy: { sira: "desc" },
            select: { sira: true },
        });
        let nextSira = (maxSira?.sira ?? -1) + 1;

        const results = [];
        for (const kitapId of kitapIds) {
            try {
                const item = await prisma.etiketListesiKitap.upsert({
                    where: { listeId_kitapId: { listeId, kitapId } },
                    update: { adet },
                    create: { listeId, kitapId, adet, sira: nextSira++ },
                    include: {
                        kitap: {
                            include: {
                                kutuphane: { select: { id: true, adi: true, kodu: true } },
                            },
                        },
                    },
                });
                results.push(item);
            } catch {
                // Kitap bulunamadı veya başka hata — atla
            }
        }

        return NextResponse.json(results, { status: 201 });
    } catch (error) {
        console.error("Kitap ekleme hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// DELETE — listeden kitap çıkar
export async function DELETE(request: NextRequest, { params }: Params) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id: listeId } = await params;

    try {
        const liste = await prisma.etiketListesi.findUnique({ where: { id: listeId } });
        if (!liste) {
            return NextResponse.json({ error: "Liste bulunamadı" }, { status: 404 });
        }
        if (session.role !== "ADMIN" && liste.kutuphaneId !== session.kutuphaneId) {
            return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const kitapId = searchParams.get("kitapId");
        const itemId = searchParams.get("itemId");

        if (itemId) {
            await prisma.etiketListesiKitap.delete({ where: { id: itemId } });
        } else if (kitapId) {
            await prisma.etiketListesiKitap.delete({
                where: { listeId_kitapId: { listeId, kitapId } },
            });
        } else {
            return NextResponse.json({ error: "kitapId veya itemId gerekli" }, { status: 400 });
        }

        return NextResponse.json({ message: "Kitap listeden çıkarıldı" });
    } catch (error) {
        console.error("Kitap çıkarma hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
