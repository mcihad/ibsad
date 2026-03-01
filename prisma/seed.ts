import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashSync } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...");

    // Create kutuphaneler
    const merkezKutuphane = await prisma.kutuphane.upsert({
        where: { kodu: "MRK001" },
        update: {},
        create: {
            adi: "Merkez Kütüphane",
            kodu: "MRK001",
            aciklama: "Cumhuriyet Üniversitesi Merkez Kütüphanesi",
            adres: "Sivas Cumhuriyet Üniversitesi Kampüsü, Sivas",
            telefon: "0346 219 10 10",
            eposta: "kutuphane@cumhuriyet.edu.tr",
            webSitesi: "https://kutuphane.cumhuriyet.edu.tr",
        },
    });

    const tipKutuphane = await prisma.kutuphane.upsert({
        where: { kodu: "TIP001" },
        update: {},
        create: {
            adi: "Tıp Fakültesi Kütüphanesi",
            kodu: "TIP001",
            aciklama: "Tıp Fakültesi bünyesindeki kütüphane",
            adres: "Tıp Fakültesi Binası, Sivas",
            telefon: "0346 219 20 20",
            eposta: "tip.kutuphane@cumhuriyet.edu.tr",
        },
    });

    const muhKutuphane = await prisma.kutuphane.upsert({
        where: { kodu: "MUH001" },
        update: {},
        create: {
            adi: "Mühendislik Fakültesi Kütüphanesi",
            kodu: "MUH001",
            aciklama: "Mühendislik Fakültesi bünyesindeki kütüphane",
            adres: "Mühendislik Fakültesi Binası, Sivas",
            telefon: "0346 219 30 30",
        },
    });

    // Create admin user (no library assigned)
    const admin = await prisma.user.upsert({
        where: { email: "admin@ibsad.com" },
        update: {},
        create: {
            tcKimlikNo: "10000000000",
            email: "admin@ibsad.com",
            password: hashSync("admin123", 10),
            firstName: "Admin",
            lastName: "Yönetici",
            phone: "05551234567",
            gender: "ERKEK",
            department: "Bilgi İşlem",
            title: "Sistem Yöneticisi",
            role: "ADMIN",
            isActive: true,
        },
    });

    // Create kutuphaneci user (assigned to Merkez Kütüphane)
    const kutuphaneci = await prisma.user.upsert({
        where: { email: "kutuphaneci@ibsad.com" },
        update: { kutuphaneId: merkezKutuphane.id },
        create: {
            tcKimlikNo: "20000000000",
            email: "kutuphaneci@ibsad.com",
            password: hashSync("kutuphaneci123", 10),
            firstName: "Ayşe",
            lastName: "Kütüphaneci",
            phone: "05559876543",
            gender: "KADIN",
            department: "Kütüphane",
            title: "Kütüphaneci",
            role: "KUTUPHANECI",
            isActive: true,
            kutuphaneId: merkezKutuphane.id,
        },
    });

    // Create memur user (assigned to Tıp Kütüphanesi)
    const memur = await prisma.user.upsert({
        where: { email: "memur@ibsad.com" },
        update: { kutuphaneId: tipKutuphane.id },
        create: {
            tcKimlikNo: "30000000000",
            email: "memur@ibsad.com",
            password: hashSync("memur123", 10),
            firstName: "Mehmet",
            lastName: "Memur",
            phone: "05551112233",
            gender: "ERKEK",
            department: "İdari İşler",
            title: "Memur",
            role: "MEMUR",
            isActive: true,
            kutuphaneId: tipKutuphane.id,
        },
    });

    // Create sample books for Merkez Kütüphane
    const merkezKitaplar = [
        {
            baslik: "Nutuk",
            yazarlar: "Mustafa Kemal Atatürk",
            isbn: "9789750719387",
            yayinevi: "Yapı Kredi Yayınları",
            dil: "Türkçe",
            yayinYili: 2023,
            sayfaSayisi: 624,
            durum: "MEVCUT" as const,
            fizikselDurum: "COK_IYI" as const,
            demirbasNo: "MRK-0001",
            barkod: "1000000001",
        },
        {
            baslik: "Suç ve Ceza",
            yazarlar: "Fyodor Dostoyevski",
            isbn: "9789750726446",
            yayinevi: "İş Bankası Kültür Yayınları",
            dil: "Türkçe",
            yayinYili: 2020,
            sayfaSayisi: 687,
            durum: "ODUNC" as const,
            fizikselDurum: "IYI" as const,
            demirbasNo: "MRK-0002",
            barkod: "1000000002",
        },
        {
            baslik: "Sefiller",
            yazarlar: "Victor Hugo",
            isbn: "9789750738609",
            yayinevi: "İş Bankası Kültür Yayınları",
            dil: "Türkçe",
            yayinYili: 2021,
            sayfaSayisi: 1520,
            durum: "MEVCUT" as const,
            fizikselDurum: "MUKEMMEL" as const,
            demirbasNo: "MRK-0003",
            barkod: "1000000003",
        },
        {
            baslik: "1984",
            yazarlar: "George Orwell",
            isbn: "9789750718533",
            yayinevi: "Can Yayınları",
            dil: "Türkçe",
            yayinYili: 2022,
            sayfaSayisi: 352,
            durum: "MEVCUT" as const,
            fizikselDurum: "IYI" as const,
            demirbasNo: "MRK-0004",
            barkod: "1000000004",
        },
        {
            baslik: "Kürk Mantolu Madonna",
            yazarlar: "Sabahattin Ali",
            isbn: "9789750719066",
            yayinevi: "Yapı Kredi Yayınları",
            dil: "Türkçe",
            yayinYili: 2023,
            sayfaSayisi: 160,
            durum: "KAYIP" as const,
            fizikselDurum: "ORTA" as const,
            demirbasNo: "MRK-0005",
            barkod: "1000000005",
        },
    ];

    // Delete existing data in correct FK order
    await prisma.etiketListesiKitap.deleteMany({});
    await prisma.etiketListesi.deleteMany({});
    await prisma.etiketTasarimi.deleteMany({});
    await prisma.odunc.deleteMany({});
    await prisma.kitap.deleteMany({});

    await prisma.kitap.createMany({
        data: merkezKitaplar.map((k) => ({ ...k, kutuphaneId: merkezKutuphane.id })),
    });

    // Create sample books for Tıp Kütüphanesi
    const tipKitaplar = [
        {
            baslik: "Guyton Tıbbi Fizyoloji",
            yazarlar: "Arthur C. Guyton, John E. Hall",
            isbn: "9786054499694",
            yayinevi: "Nobel Tıp Kitabevleri",
            dil: "Türkçe",
            yayinYili: 2021,
            sayfaSayisi: 1152,
            durum: "MEVCUT" as const,
            fizikselDurum: "COK_IYI" as const,
            demirbasNo: "TIP-0001",
            barkod: "2000000001",
        },
        {
            baslik: "Robbins Temel Patoloji",
            yazarlar: "Vinay Kumar, Abul K. Abbas",
            isbn: "9786054499830",
            yayinevi: "Nobel Tıp Kitabevleri",
            dil: "Türkçe",
            yayinYili: 2020,
            sayfaSayisi: 952,
            durum: "ODUNC" as const,
            fizikselDurum: "IYI" as const,
            demirbasNo: "TIP-0002",
            barkod: "2000000002",
        },
        {
            baslik: "Netter İnsan Anatomisi Atlası",
            yazarlar: "Frank H. Netter",
            isbn: "9786054499700",
            yayinevi: "Nobel Tıp Kitabevleri",
            dil: "Türkçe",
            yayinYili: 2022,
            sayfaSayisi: 640,
            durum: "MEVCUT" as const,
            fizikselDurum: "MUKEMMEL" as const,
            demirbasNo: "TIP-0003",
            barkod: "2000000003",
        },
    ];

    await prisma.kitap.createMany({
        data: tipKitaplar.map((k) => ({ ...k, kutuphaneId: tipKutuphane.id })),
    });

    // Create sample books for Mühendislik Kütüphanesi
    const muhKitaplar = [
        {
            baslik: "Introduction to Algorithms",
            yazarlar: "Thomas H. Cormen, Charles E. Leiserson",
            isbn: "9780262046305",
            yayinevi: "MIT Press",
            dil: "İngilizce",
            yayinYili: 2022,
            sayfaSayisi: 1312,
            durum: "MEVCUT" as const,
            fizikselDurum: "COK_IYI" as const,
            demirbasNo: "MUH-0001",
            barkod: "3000000001",
        },
        {
            baslik: "Clean Code",
            yazarlar: "Robert C. Martin",
            isbn: "9780132350884",
            yayinevi: "Pearson",
            dil: "İngilizce",
            yayinYili: 2019,
            sayfaSayisi: 464,
            durum: "MEVCUT" as const,
            fizikselDurum: "IYI" as const,
            demirbasNo: "MUH-0002",
            barkod: "3000000002",
        },
    ];

    await prisma.kitap.createMany({
        data: muhKitaplar.map((k) => ({ ...k, kutuphaneId: muhKutuphane.id })),
    });

    // ===== UYE TİPLERİ =====
    // Delete existing data in order (respect FK constraints)
    await prisma.uye.deleteMany({});
    await prisma.uyeTipi.deleteMany({});

    const ogrenciTipi = await prisma.uyeTipi.create({
        data: {
            adi: "Öğrenci",
            aciklama: "Lisans ve lisansüstü öğrencileri",
            maksimumKitap: 3,
            oduncSuresi: 15,
            gunlukCeza: 1.0,
        },
    });

    const akademisyenTipi = await prisma.uyeTipi.create({
        data: {
            adi: "Akademisyen",
            aciklama: "Öğretim üyeleri ve görevlileri",
            maksimumKitap: 10,
            oduncSuresi: 30,
            gunlukCeza: 0.5,
        },
    });

    const personelTipi = await prisma.uyeTipi.create({
        data: {
            adi: "Personel",
            aciklama: "Üniversite idari personeli",
            maksimumKitap: 5,
            oduncSuresi: 15,
            gunlukCeza: 1.0,
        },
    });

    // ===== ÜYELER =====
    const uye1 = await prisma.uye.create({
        data: {
            adi: "Ali",
            soyadi: "Yılmaz",
            tcKimlikNo: "11111111110",
            kartNumarasi: "UYE-0001",
            eposta: "ali.yilmaz@cumhuriyet.edu.tr",
            telefon: "05551110001",
            uyeTipiId: ogrenciTipi.id,
            kutuphaneId: merkezKutuphane.id,
            olusturanId: kutuphaneci.id,
        },
    });

    const uye2 = await prisma.uye.create({
        data: {
            adi: "Fatma",
            soyadi: "Demir",
            tcKimlikNo: "22222222220",
            kartNumarasi: "UYE-0002",
            eposta: "fatma.demir@cumhuriyet.edu.tr",
            telefon: "05551110002",
            uyeTipiId: akademisyenTipi.id,
            kutuphaneId: merkezKutuphane.id,
            olusturanId: kutuphaneci.id,
        },
    });

    const uye3 = await prisma.uye.create({
        data: {
            adi: "Hasan",
            soyadi: "Kara",
            tcKimlikNo: "33333333330",
            kartNumarasi: "UYE-0003",
            eposta: "hasan.kara@cumhuriyet.edu.tr",
            telefon: "05551110003",
            uyeTipiId: personelTipi.id,
            kutuphaneId: tipKutuphane.id,
            olusturanId: memur.id,
        },
    });

    await prisma.uye.create({
        data: {
            adi: "Zeynep",
            soyadi: "Çelik",
            tcKimlikNo: "44444444440",
            kartNumarasi: "UYE-0004",
            eposta: "zeynep.celik@cumhuriyet.edu.tr",
            telefon: "05551110004",
            uyeTipiId: ogrenciTipi.id,
            kutuphaneId: tipKutuphane.id,
            olusturanId: memur.id,
        },
    });

    // ===== ÖDÜNÇ İŞLEMLERİ =====
    // Etiket verilerini temizle (FK sırasına dikkat)
    // (Already cleaned above before kitaplar deletion)

    // ===== ETİKET TASARIMLARI =====
    const sirtEtiketi = await prisma.etiketTasarimi.create({
        data: {
            adi: "Sırt Etiketi (70×30mm)",
            aciklama: "Kitap sırtına yapıştırılacak standart etiket",
            etiketGenislik: 70,
            etiketYukseklik: 30,
            yaziciTuru: "ETIKET_YAZICI",
            varsayilan: true,
            olusturanId: admin.id,
            sablon: JSON.stringify([
                {
                    id: "el-1", type: "text", x: 2, y: 2, width: 66, height: 5,
                    content: "{kutuphaneAdi}", fontSize: 7, fontWeight: "bold",
                    textAlign: "center", color: "#000000",
                },
                {
                    id: "el-2", type: "barcode", x: 5, y: 8, width: 60, height: 12,
                    content: "{barkod}", barcodeFormat: "CODE128",
                    showText: true, color: "#000000",
                },
                {
                    id: "el-3", type: "text", x: 2, y: 22, width: 40, height: 5,
                    content: "{demirbasNo}", fontSize: 7, fontWeight: "normal",
                    textAlign: "left", color: "#333333",
                },
                {
                    id: "el-4", type: "text", x: 42, y: 22, width: 26, height: 5,
                    content: "{isbn}", fontSize: 6, fontWeight: "normal",
                    textAlign: "right", color: "#666666",
                },
            ]),
        },
    });

    await prisma.etiketTasarimi.create({
        data: {
            adi: "QR Kodlu Etiket (50×25mm)",
            aciklama: "QR kod içeren kompakt etiket",
            etiketGenislik: 50,
            etiketYukseklik: 25,
            yaziciTuru: "ETIKET_YAZICI",
            olusturanId: admin.id,
            sablon: JSON.stringify([
                {
                    id: "el-1", type: "qrcode", x: 2, y: 2, width: 21, height: 21,
                    content: "{barkod}", color: "#000000",
                },
                {
                    id: "el-2", type: "text", x: 25, y: 2, width: 23, height: 5,
                    content: "{baslik|truncate:30}", fontSize: 6, fontWeight: "bold",
                    textAlign: "left", color: "#000000",
                },
                {
                    id: "el-3", type: "text", x: 25, y: 8, width: 23, height: 4,
                    content: "{yazarlar|truncate:25}", fontSize: 5, fontWeight: "normal",
                    textAlign: "left", color: "#555555",
                },
                {
                    id: "el-4", type: "line", x: 25, y: 13, width: 23, height: 0,
                    color: "#cccccc",
                },
                {
                    id: "el-5", type: "text", x: 25, y: 15, width: 23, height: 4,
                    content: "{demirbasNo}", fontSize: 6, fontWeight: "normal",
                    textAlign: "left", color: "#333333",
                },
                {
                    id: "el-6", type: "text", x: 25, y: 20, width: 23, height: 4,
                    content: "{kutuphaneKodu}", fontSize: 5, fontWeight: "normal",
                    textAlign: "left", color: "#888888",
                },
            ]),
        },
    });

    const a4Tasarim = await prisma.etiketTasarimi.create({
        data: {
            adi: "A4 Sayfa Etiketi (Avery L7160)",
            aciklama: "21 adet/sayfa — A4 kağıda baskı için uyumlu",
            etiketGenislik: 63.5,
            etiketYukseklik: 38.1,
            yaziciTuru: "A4",
            sayfaGenislik: 210,
            sayfaYukseklik: 297,
            satirSayisi: 7,
            sutunSayisi: 3,
            sayfaKenarUst: 15.1,
            sayfaKenarAlt: 15.1,
            sayfaKenarSol: 7.2,
            sayfaKenarSag: 7.2,
            satirAraligi: 0,
            sutunAraligi: 2.5,
            olusturanId: admin.id,
            sablon: JSON.stringify([
                {
                    id: "el-1", type: "text", x: 2, y: 2, width: 59, height: 5,
                    content: "{baslik|truncate:40}", fontSize: 7, fontWeight: "bold",
                    textAlign: "left", color: "#000000",
                },
                {
                    id: "el-2", type: "text", x: 2, y: 8, width: 59, height: 4,
                    content: "{yazarlar|truncate:35}", fontSize: 6, fontWeight: "normal",
                    textAlign: "left", color: "#444444",
                },
                {
                    id: "el-3", type: "barcode", x: 2, y: 14, width: 40, height: 12,
                    content: "{barkod}", barcodeFormat: "CODE128",
                    showText: true, color: "#000000",
                },
                {
                    id: "el-4", type: "text", x: 2, y: 28, width: 30, height: 5,
                    content: "{demirbasNo}", fontSize: 7, fontWeight: "normal",
                    textAlign: "left", color: "#333333",
                },
                {
                    id: "el-5", type: "text", x: 32, y: 28, width: 27, height: 5,
                    content: "{kutuphaneKodu}", fontSize: 7, fontWeight: "normal",
                    textAlign: "right", color: "#666666",
                },
            ]),
        },
    });

    // ===== ETİKET LİSTELERİ =====
    const merkezListe = await prisma.etiketListesi.create({
        data: {
            adi: "Merkez Yeni Kitaplar",
            aciklama: "Merkez Kütüphane yeni gelen kitaplar etiket listesi",
            tasarimId: sirtEtiketi.id,
            kutuphaneId: merkezKutuphane.id,
            olusturanId: kutuphaneci.id,
        },
    });

    // Merkez kitaplarını listeye ekle
    const merkezKitaplarDb2 = await prisma.kitap.findMany({
        where: { kutuphaneId: merkezKutuphane.id },
        take: 3,
    });
    for (let i = 0; i < merkezKitaplarDb2.length; i++) {
        await prisma.etiketListesiKitap.create({
            data: {
                listeId: merkezListe.id,
                kitapId: merkezKitaplarDb2[i].id,
                adet: 1,
                sira: i,
            },
        });
    }

    await prisma.etiketListesi.create({
        data: {
            adi: "Tıp A4 Baskı Listesi",
            aciklama: "Tıp Fakültesi kitapları için A4 etiket baskısı",
            tasarimId: a4Tasarim.id,
            kutuphaneId: tipKutuphane.id,
            olusturanId: memur.id,
        },
    });

    // Get some books for loan records
    const merkezKitaplarDb = await prisma.kitap.findMany({
        where: { kutuphaneId: merkezKutuphane.id, durum: "ODUNC" },
        take: 1,
    });
    const tipKitaplarDb = await prisma.kitap.findMany({
        where: { kutuphaneId: tipKutuphane.id, durum: "ODUNC" },
        take: 1,
    });

    // Active loan for "Suç ve Ceza" (already marked as ODUNC in seed)
    if (merkezKitaplarDb.length > 0) {
        const sonIadeTarihi = new Date();
        sonIadeTarihi.setDate(sonIadeTarihi.getDate() + 10);
        await prisma.odunc.create({
            data: {
                kitapId: merkezKitaplarDb[0].id,
                uyeId: uye1.id,
                kutuphaneId: merkezKutuphane.id,
                sonIadeTarihi,
                olusturanId: kutuphaneci.id,
            },
        });
    }

    // Active loan for Tıp book (already marked as ODUNC in seed)
    if (tipKitaplarDb.length > 0) {
        const sonIadeTarihi = new Date();
        sonIadeTarihi.setDate(sonIadeTarihi.getDate() - 3); // 3 gün gecikmiş
        await prisma.odunc.create({
            data: {
                kitapId: tipKitaplarDb[0].id,
                uyeId: uye3.id,
                kutuphaneId: tipKutuphane.id,
                sonIadeTarihi,
                olusturanId: memur.id,
            },
        });
    }

    // A returned loan
    const birKitap = await prisma.kitap.findFirst({
        where: { kutuphaneId: merkezKutuphane.id, durum: "MEVCUT" },
    });
    if (birKitap) {
        const oduncTarihi = new Date();
        oduncTarihi.setDate(oduncTarihi.getDate() - 20);
        const sonIadeTarihi = new Date();
        sonIadeTarihi.setDate(sonIadeTarihi.getDate() - 5);
        const iadeTarihi = new Date();
        iadeTarihi.setDate(iadeTarihi.getDate() - 6);
        await prisma.odunc.create({
            data: {
                kitapId: birKitap.id,
                uyeId: uye2.id,
                kutuphaneId: merkezKutuphane.id,
                oduncTarihi,
                sonIadeTarihi,
                iadeTarihi,
                durum: "IADE_EDILDI",
                olusturanId: kutuphaneci.id,
            },
        });
    }

    console.log("✅ Seed completed!");
    console.log("📚 Kütüphaneler:", merkezKutuphane.adi, tipKutuphane.adi, muhKutuphane.adi);
    console.log("👤 Kullanıcılar:", admin.email, kutuphaneci.email, memur.email);
    console.log("📖 Kitaplar: Merkez(5) + Tıp(3) + Mühendislik(2) = 10");
    console.log("🏷️ Üye Tipleri:", ogrenciTipi.adi, akademisyenTipi.adi, personelTipi.adi);
    console.log("👥 Üyeler:", uye1.adi, uye2.adi, uye3.adi);
    console.log("📋 Ödünç kayıtları oluşturuldu");
    console.log("🏷️ Etiket tasarımları: 3 (sırt, QR, A4)");
    console.log("📃 Etiket listeleri: 2 (Merkez + Tıp)");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
