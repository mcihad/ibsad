import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const isAdmin = session.role === "ADMIN";
    const kutuphaneId = session.kutuphaneId;
    const kutuphaneFilter = isAdmin ? {} : { kutuphaneId: kutuphaneId! };

    try {
        // Stats
        const [
            toplamKitap,
            mevcutKitap,
            oduncKitap,
            kayipKitap,
            toplamUye,
            aktifUye,
            toplamOdunc,
            aktifOdunc,
            gecikmisList,
            toplamKutuphane,
            sonEklenenKitaplar,
            sonOduncler,
        ] = await Promise.all([
            prisma.kitap.count({ where: { aktif: true, ...kutuphaneFilter } }),
            prisma.kitap.count({ where: { aktif: true, durum: "MEVCUT", ...kutuphaneFilter } }),
            prisma.kitap.count({ where: { aktif: true, durum: "ODUNC", ...kutuphaneFilter } }),
            prisma.kitap.count({ where: { aktif: true, durum: "KAYIP", ...kutuphaneFilter } }),
            prisma.uye.count({ where: { ...kutuphaneFilter } }),
            prisma.uye.count({ where: { aktif: true, ...kutuphaneFilter } }),
            prisma.odunc.count({ where: { ...kutuphaneFilter } }),
            prisma.odunc.count({ where: { durum: "AKTIF", ...kutuphaneFilter } }),
            prisma.odunc.findMany({
                where: { durum: "AKTIF", sonIadeTarihi: { lt: new Date() }, ...kutuphaneFilter },
                select: { id: true },
            }),
            isAdmin ? prisma.kutuphane.count({ where: { aktif: true } }) : Promise.resolve(0),
            // Son eklenen kitaplar
            prisma.kitap.findMany({
                where: { aktif: true, ...kutuphaneFilter },
                orderBy: { createdAt: "desc" },
                take: 8,
                select: {
                    id: true,
                    baslik: true,
                    yazarlar: true,
                    isbn: true,
                    durum: true,
                    createdAt: true,
                    kutuphane: { select: { adi: true, kodu: true } },
                },
            }),
            // Son ödünç işlemleri
            prisma.odunc.findMany({
                where: { ...kutuphaneFilter },
                orderBy: { oduncTarihi: "desc" },
                take: 8,
                include: {
                    kitap: { select: { id: true, baslik: true, yazarlar: true } },
                    uye: { select: { id: true, adi: true, soyadi: true } },
                    kutuphane: { select: { adi: true, kodu: true } },
                },
            }),
        ]);

        const gecikmisSayisi = gecikmisList.length;

        // Ödünç trend — son 6 ay, aylık ödünç ve iade sayıları
        const now = new Date();
        const aylikTrend = [];
        for (let i = 5; i >= 0; i--) {
            const ay = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const ayBitis = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const ayAdi = ay.toLocaleDateString("tr-TR", { month: "short" });

            const [oduncSayisi, iadeSayisi] = await Promise.all([
                prisma.odunc.count({
                    where: {
                        oduncTarihi: { gte: ay, lte: ayBitis },
                        ...kutuphaneFilter,
                    },
                }),
                prisma.odunc.count({
                    where: {
                        iadeTarihi: { gte: ay, lte: ayBitis },
                        ...kutuphaneFilter,
                    },
                }),
            ]);
            aylikTrend.push({ ay: ayAdi, odunc: oduncSayisi, iade: iadeSayisi });
        }

        // Kitap durum dağılımı
        const durumDagilimi = await prisma.kitap.groupBy({
            by: ["durum"],
            where: { aktif: true, ...kutuphaneFilter },
            _count: { id: true },
        });

        return NextResponse.json({
            stats: {
                toplamKitap,
                mevcutKitap,
                oduncKitap,
                kayipKitap,
                toplamUye,
                aktifUye,
                toplamOdunc,
                aktifOdunc,
                gecikmisSayisi,
                toplamKutuphane,
            },
            aylikTrend,
            durumDagilimi: durumDagilimi.map((d) => ({
                durum: d.durum,
                sayi: d._count.id,
            })),
            sonEklenenKitaplar,
            sonOduncler: sonOduncler.map((o) => ({
                id: o.id,
                kitapBaslik: o.kitap.baslik,
                kitapYazar: o.kitap.yazarlar,
                uyeAdi: `${o.uye.adi} ${o.uye.soyadi}`,
                kutuphane: o.kutuphane.adi,
                oduncTarihi: o.oduncTarihi,
                sonIadeTarihi: o.sonIadeTarihi,
                iadeTarihi: o.iadeTarihi,
                durum: o.durum,
            })),
        });
    } catch (error) {
        console.error("Dashboard API hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}
