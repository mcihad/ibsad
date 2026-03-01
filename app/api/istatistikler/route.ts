import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const stat = searchParams.get("stat");

    try {
        switch (stat) {
            case "kutuphane-kitap": return NextResponse.json(await kutuphaneKitapSayilari());
            case "kutuphane-odunc": return NextResponse.json(await kutuphaneOduncSayilari());
            case "kutuphane-uye": return NextResponse.json(await kutuphaneUyeSayilari());
            case "en-cok-odunc-alan-uyeler": return NextResponse.json(await enCokOduncAlanUyeler());
            case "gunluk-odunc": return NextResponse.json(await gunlukOdunc());
            case "haftalik-odunc": return NextResponse.json(await haftalikOdunc());
            case "aylik-odunc": return NextResponse.json(await aylikOdunc());
            case "kitap-durum-dagilimi": return NextResponse.json(await kitapDurumDagilimi());
            case "uye-tipi-dagilimi": return NextResponse.json(await uyeTipiDagilimi());
            case "en-cok-okunan-kitaplar": return NextResponse.json(await enCokOkunanKitaplar());
            case "geciken-oduncler": return NextResponse.json(await gecikenOduncler());
            case "yayinevi-dagilimi": return NextResponse.json(await yayineviDagilimi());
            case "dil-dagilimi": return NextResponse.json(await dilDagilimi());
            case "odunc-iade-oranlari": return NextResponse.json(await oduncIadeOranlari());
            case "kayip-hasarli-kitaplar": return NextResponse.json(await kayipHasarliKitaplar());
            case "uye-kayit-trendi": return NextResponse.json(await uyeKayitTrendi());
            case "ceza-istatistikleri": return NextResponse.json(await cezaIstatistikleri());
            default:
                return NextResponse.json({ error: "Geçersiz istatistik" }, { status: 400 });
        }
    } catch (error) {
        console.error("İstatistik API hatası:", error);
        return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
}

// 1. Kütüphanelere göre kitap sayıları
async function kutuphaneKitapSayilari() {
    const data = await prisma.kutuphane.findMany({
        where: { aktif: true },
        select: {
            adi: true,
            kodu: true,
            _count: { select: { kitaplar: true } },
        },
        orderBy: { adi: "asc" },
    });
    return {
        title: "Kütüphanelere Göre Kitap Sayıları",
        chartType: "bar",
        labels: data.map(d => d.adi),
        datasets: [{ label: "Kitap Sayısı", data: data.map(d => d._count.kitaplar) }],
        rows: data.map(d => ({ Kütüphane: d.adi, Kod: d.kodu, "Kitap Sayısı": d._count.kitaplar })),
    };
}

// 2. Kütüphanelere göre ödünç sayıları
async function kutuphaneOduncSayilari() {
    const data = await prisma.kutuphane.findMany({
        where: { aktif: true },
        select: {
            adi: true,
            kodu: true,
            _count: { select: { oduncler: true } },
        },
    });
    return {
        title: "Kütüphanelere Göre Ödünç Sayıları",
        chartType: "bar",
        labels: data.map(d => d.adi),
        datasets: [{ label: "Ödünç Sayısı", data: data.map(d => d._count.oduncler) }],
        rows: data.map(d => ({ Kütüphane: d.adi, Kod: d.kodu, "Ödünç Sayısı": d._count.oduncler })),
    };
}

// 3. Kütüphanelere göre üye sayıları
async function kutuphaneUyeSayilari() {
    const data = await prisma.kutuphane.findMany({
        where: { aktif: true },
        select: {
            adi: true,
            kodu: true,
            _count: { select: { uyeler: true } },
        },
    });
    return {
        title: "Kütüphanelere Göre Üye Sayıları",
        chartType: "bar",
        labels: data.map(d => d.adi),
        datasets: [{ label: "Üye Sayısı", data: data.map(d => d._count.uyeler) }],
        rows: data.map(d => ({ Kütüphane: d.adi, Kod: d.kodu, "Üye Sayısı": d._count.uyeler })),
    };
}

// 4. En çok ödünç alan üyeler
async function enCokOduncAlanUyeler() {
    const data = await prisma.uye.findMany({
        where: { aktif: true },
        select: {
            adi: true,
            soyadi: true,
            kartNumarasi: true,
            kutuphane: { select: { adi: true } },
            uyeTipi: { select: { adi: true } },
            _count: { select: { oduncler: true } },
        },
        orderBy: { oduncler: { _count: "desc" } },
        take: 20,
    });
    return {
        title: "En Çok Ödünç Alan Üyeler",
        chartType: "horizontalBar",
        labels: data.map(d => `${d.adi} ${d.soyadi}`),
        datasets: [{ label: "Ödünç Sayısı", data: data.map(d => d._count.oduncler) }],
        rows: data.map(d => ({
            "Üye Adı": `${d.adi} ${d.soyadi}`,
            "Kart No": d.kartNumarasi || "-",
            "Üye Tipi": d.uyeTipi.adi,
            Kütüphane: d.kutuphane.adi,
            "Ödünç Sayısı": d._count.oduncler,
        })),
    };
}

// 5. Günlük ödünç (son 30 gün)
async function gunlukOdunc() {
    const rows = [];
    const labels = [];
    const oduncData = [];
    const iadeData = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
        const gun = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const gunBitis = new Date(gun.getFullYear(), gun.getMonth(), gun.getDate(), 23, 59, 59);
        const label = gun.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
        labels.push(label);

        const [odunc, iade] = await Promise.all([
            prisma.odunc.count({ where: { oduncTarihi: { gte: gun, lte: gunBitis } } }),
            prisma.odunc.count({ where: { iadeTarihi: { gte: gun, lte: gunBitis } } }),
        ]);
        oduncData.push(odunc);
        iadeData.push(iade);
        rows.push({ Tarih: label, "Ödünç": odunc, "İade": iade });
    }

    return {
        title: "Günlük Ödünç/İade (Son 30 Gün)",
        chartType: "line",
        labels,
        datasets: [
            { label: "Ödünç", data: oduncData },
            { label: "İade", data: iadeData },
        ],
        rows,
    };
}

// 6. Haftalık ödünç (son 12 hafta)
async function haftalikOdunc() {
    const rows = [];
    const labels = [];
    const oduncData = [];
    const iadeData = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
        const haftaBas = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7) - 6);
        const haftaSon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7), 23, 59, 59);
        const label = `${haftaBas.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}-${haftaSon.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}`;
        labels.push(label);

        const [odunc, iade] = await Promise.all([
            prisma.odunc.count({ where: { oduncTarihi: { gte: haftaBas, lte: haftaSon } } }),
            prisma.odunc.count({ where: { iadeTarihi: { gte: haftaBas, lte: haftaSon } } }),
        ]);
        oduncData.push(odunc);
        iadeData.push(iade);
        rows.push({ Hafta: label, "Ödünç": odunc, "İade": iade });
    }

    return {
        title: "Haftalık Ödünç/İade (Son 12 Hafta)",
        chartType: "line",
        labels,
        datasets: [
            { label: "Ödünç", data: oduncData },
            { label: "İade", data: iadeData },
        ],
        rows,
    };
}

// 7. Aylık ödünç (son 12 ay) — kütüphane bazlı
async function aylikOdunc() {
    const kutuphaneler = await prisma.kutuphane.findMany({ where: { aktif: true }, select: { id: true, adi: true } });
    const now = new Date();
    const labels = [];
    const datasets: { label: string; data: number[] }[] = kutuphaneler.map(k => ({ label: k.adi, data: [] }));
    const rows = [];

    for (let i = 11; i >= 0; i--) {
        const ay = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ayBitis = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const label = ay.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
        labels.push(label);

        const row: Record<string, string | number> = { Ay: label };
        for (let ki = 0; ki < kutuphaneler.length; ki++) {
            const count = await prisma.odunc.count({
                where: { oduncTarihi: { gte: ay, lte: ayBitis }, kutuphaneId: kutuphaneler[ki].id },
            });
            datasets[ki].data.push(count);
            row[kutuphaneler[ki].adi] = count;
        }
        rows.push(row);
    }

    return {
        title: "Aylık Ödünç Sayıları (Kütüphane Bazlı)",
        chartType: "line",
        labels,
        datasets,
        rows,
    };
}

// 8. Kitap durum dağılımı
async function kitapDurumDagilimi() {
    const durumLabels: Record<string, string> = {
        MEVCUT: "Mevcut", ODUNC: "Ödünç", KAYIP: "Kayıp", HASARLI: "Hasarlı", AYIKLANDI: "Ayıklandı",
    };
    const data = await prisma.kitap.groupBy({
        by: ["durum"],
        where: { aktif: true },
        _count: { id: true },
    });
    return {
        title: "Kitap Durum Dağılımı",
        chartType: "pie",
        labels: data.map(d => durumLabels[d.durum] || d.durum),
        datasets: [{ label: "Kitap Sayısı", data: data.map(d => d._count.id) }],
        rows: data.map(d => ({ Durum: durumLabels[d.durum] || d.durum, Sayı: d._count.id })),
    };
}

// 9. Üye tipi dağılımı
async function uyeTipiDagilimi() {
    const data = await prisma.uyeTipi.findMany({
        where: { aktif: true },
        select: {
            adi: true,
            maksimumKitap: true,
            oduncSuresi: true,
            _count: { select: { uyeler: true } },
        },
    });
    return {
        title: "Üye Tipi Dağılımı",
        chartType: "pie",
        labels: data.map(d => d.adi),
        datasets: [{ label: "Üye Sayısı", data: data.map(d => d._count.uyeler) }],
        rows: data.map(d => ({
            "Üye Tipi": d.adi,
            "Üye Sayısı": d._count.uyeler,
            "Maks. Kitap": d.maksimumKitap,
            "Ödünç Süresi (Gün)": d.oduncSuresi,
        })),
    };
}

// 10. En çok okunan kitaplar
async function enCokOkunanKitaplar() {
    const data = await prisma.kitap.findMany({
        where: { aktif: true },
        select: {
            baslik: true,
            yazarlar: true,
            isbn: true,
            kutuphane: { select: { adi: true } },
            _count: { select: { oduncler: true } },
        },
        orderBy: { oduncler: { _count: "desc" } },
        take: 20,
    });
    return {
        title: "En Çok Okunan Kitaplar",
        chartType: "horizontalBar",
        labels: data.map(d => d.baslik.length > 30 ? d.baslik.slice(0, 30) + "…" : d.baslik),
        datasets: [{ label: "Ödünç Sayısı", data: data.map(d => d._count.oduncler) }],
        rows: data.map(d => ({
            Başlık: d.baslik,
            Yazar: d.yazarlar || "-",
            ISBN: d.isbn || "-",
            Kütüphane: d.kutuphane.adi,
            "Ödünç Sayısı": d._count.oduncler,
        })),
    };
}

// 11. Geciken ödünçler
async function gecikenOduncler() {
    const data = await prisma.odunc.findMany({
        where: {
            durum: "AKTIF",
            sonIadeTarihi: { lt: new Date() },
        },
        include: {
            kitap: { select: { baslik: true, yazarlar: true } },
            uye: { select: { adi: true, soyadi: true, kartNumarasi: true } },
            kutuphane: { select: { adi: true } },
        },
        orderBy: { sonIadeTarihi: "asc" },
    });

    const now = new Date();
    return {
        title: "Geciken Ödünçler",
        chartType: "table",
        labels: [],
        datasets: [],
        rows: data.map(d => {
            const gecikmeGun = Math.ceil((now.getTime() - new Date(d.sonIadeTarihi).getTime()) / (1000 * 60 * 60 * 24));
            return {
                Kitap: d.kitap.baslik,
                Yazar: d.kitap.yazarlar || "-",
                Üye: `${d.uye.adi} ${d.uye.soyadi}`,
                "Kart No": d.uye.kartNumarasi || "-",
                Kütüphane: d.kutuphane.adi,
                "Son İade": new Date(d.sonIadeTarihi).toLocaleDateString("tr-TR"),
                "Gecikme (Gün)": gecikmeGun,
            };
        }),
    };
}

// 12. Yayınevi dağılımı
async function yayineviDagilimi() {
    const data = await prisma.kitap.groupBy({
        by: ["yayinevi"],
        where: { aktif: true, yayinevi: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 15,
    });
    return {
        title: "Yayınevi Dağılımı (İlk 15)",
        chartType: "horizontalBar",
        labels: data.map(d => d.yayinevi || "Bilinmiyor"),
        datasets: [{ label: "Kitap Sayısı", data: data.map(d => d._count.id) }],
        rows: data.map(d => ({ Yayınevi: d.yayinevi || "Bilinmiyor", "Kitap Sayısı": d._count.id })),
    };
}

// 13. Dil dağılımı
async function dilDagilimi() {
    const data = await prisma.kitap.groupBy({
        by: ["dil"],
        where: { aktif: true, dil: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
    });
    return {
        title: "Dil Dağılımı",
        chartType: "pie",
        labels: data.map(d => d.dil || "Belirtilmemiş"),
        datasets: [{ label: "Kitap Sayısı", data: data.map(d => d._count.id) }],
        rows: data.map(d => ({ Dil: d.dil || "Belirtilmemiş", "Kitap Sayısı": d._count.id })),
    };
}

// 14. Ödünç/İade oranları (kütüphane bazlı)
async function oduncIadeOranlari() {
    const kutuphaneler = await prisma.kutuphane.findMany({
        where: { aktif: true },
        select: { id: true, adi: true },
    });

    const rows = [];
    const labels = [];
    const oduncData = [];
    const iadeData = [];

    for (const k of kutuphaneler) {
        const toplam = await prisma.odunc.count({ where: { kutuphaneId: k.id } });
        const iade = await prisma.odunc.count({ where: { kutuphaneId: k.id, durum: "IADE_EDILDI" } });
        const aktif = await prisma.odunc.count({ where: { kutuphaneId: k.id, durum: "AKTIF" } });
        labels.push(k.adi);
        oduncData.push(toplam);
        iadeData.push(iade);
        rows.push({
            Kütüphane: k.adi,
            "Toplam Ödünç": toplam,
            "İade Edilen": iade,
            "Aktif Ödünç": aktif,
            "İade Oranı": toplam > 0 ? `%${Math.round((iade / toplam) * 100)}` : "-",
        });
    }

    return {
        title: "Ödünç/İade Oranları",
        chartType: "bar",
        labels,
        datasets: [
            { label: "Toplam Ödünç", data: oduncData },
            { label: "İade Edilen", data: iadeData },
        ],
        rows,
    };
}

// 15. Kayıp/Hasarlı kitaplar
async function kayipHasarliKitaplar() {
    const data = await prisma.kitap.findMany({
        where: { aktif: true, durum: { in: ["KAYIP", "HASARLI"] } },
        select: {
            baslik: true,
            yazarlar: true,
            isbn: true,
            demirbasNo: true,
            durum: true,
            kutuphane: { select: { adi: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    const durumLabels: Record<string, string> = { KAYIP: "Kayıp", HASARLI: "Hasarlı" };
    return {
        title: "Kayıp / Hasarlı Kitaplar",
        chartType: "table",
        labels: [],
        datasets: [],
        rows: data.map(d => ({
            Başlık: d.baslik,
            Yazar: d.yazarlar || "-",
            ISBN: d.isbn || "-",
            "Demirbaş No": d.demirbasNo || "-",
            Durum: durumLabels[d.durum] || d.durum,
            Kütüphane: d.kutuphane.adi,
        })),
    };
}

// 16. Üye kayıt trendi (son 12 ay)
async function uyeKayitTrendi() {
    const now = new Date();
    const labels = [];
    const kayitData = [];
    const rows = [];

    for (let i = 11; i >= 0; i--) {
        const ay = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ayBitis = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const label = ay.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
        labels.push(label);

        const count = await prisma.uye.count({
            where: { kayitTarihi: { gte: ay, lte: ayBitis } },
        });
        kayitData.push(count);
        rows.push({ Ay: label, "Yeni Üye": count });
    }

    return {
        title: "Aylık Üye Kayıt Trendi",
        chartType: "line",
        labels,
        datasets: [{ label: "Yeni Üye", data: kayitData }],
        rows,
    };
}

// 17. Ceza istatistikleri
async function cezaIstatistikleri() {
    const kutuphaneler = await prisma.kutuphane.findMany({
        where: { aktif: true },
        select: { id: true, adi: true },
    });

    const rows = [];
    const labels = [];
    const toplamCezaData: number[] = [];
    const odenmisData: number[] = [];

    for (const k of kutuphaneler) {
        const cezaliOduncler = await prisma.odunc.findMany({
            where: { kutuphaneId: k.id, gecikmeCezasi: { not: null, gt: 0 } },
            select: { gecikmeCezasi: true, cezaOdendi: true },
        });

        const toplamCeza = cezaliOduncler.reduce((sum, o) => sum + Number(o.gecikmeCezasi || 0), 0);
        const odenmis = cezaliOduncler.filter(o => o.cezaOdendi).reduce((sum, o) => sum + Number(o.gecikmeCezasi || 0), 0);

        labels.push(k.adi);
        toplamCezaData.push(toplamCeza);
        odenmisData.push(odenmis);
        rows.push({
            Kütüphane: k.adi,
            "Toplam Ceza (₺)": toplamCeza.toFixed(2),
            "Ödenen (₺)": odenmis.toFixed(2),
            "Bekleyen (₺)": (toplamCeza - odenmis).toFixed(2),
            "Cezalı Kayıt": cezaliOduncler.length,
        });
    }

    return {
        title: "Ceza İstatistikleri",
        chartType: "bar",
        labels,
        datasets: [
            { label: "Toplam Ceza (₺)", data: toplamCezaData },
            { label: "Ödenen (₺)", data: odenmisData },
        ],
        rows,
    };
}
