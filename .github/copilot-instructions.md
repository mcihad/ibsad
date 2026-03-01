# İBSAD - İlçe Bilgi Sistemleri Arşiv Düzeni

## Proje Hakkında
Bu proje Sivas Cumhuriyet Üniversitesi Kütüphane ve Dökümantasyon Daire Başkanlığı için geliştirilmekte olan bir **kütüphane otomasyon sistemi**dir. Kullanıcılar devlet memurlarıdır ve sisteme TC Kimlik No ile kayıt olurlar.

## Teknoloji Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui bileşenleri + Radix UI primitives
- **İkonlar:** Lucide React
- **Grafikler:** Apache ECharts (echarts + custom wrapper)
- **Veritabanı:** PostgreSQL (localhost:5432, db: ibsad, user: ibsad)
- **ORM:** Prisma 7 (adapter-pg ile)
- **Auth:** jose (JWT, httpOnly cookie "ibsad-token", 24 saat)
- **Tema:** next-themes (varsayılan: light, dark mod desteği)
- **Diğer:** bcryptjs (şifre hashleme), clsx + tailwind-merge (class birleştirme), jspdf (PDF üretimi), jsbarcode (barkod oluşturma), qrcode (QR kod oluşturma)

## Roller
Sistemde 3 temel rol bulunur:
1. **ADMIN** - Tam yetki: Kullanıcı CRUD, kütüphane CRUD, tüm kitapları görüntüleme/yönetme
2. **KUTUPHANECI** - Kütüphane işlemleri: Kendi kütüphanesindeki kitapları yönetme, üye, ödünç verme
3. **MEMUR** - Temel işlemler: Kendi kütüphanesindeki kitapları görüntüleme, kendi bilgilerini düzenleme, şifre değiştirme

Her kullanıcı kendi profilini düzenleyebilir ve şifresini değiştirebilir.

## Kimlik Doğrulama (Auth)
- JWT tabanlı kimlik doğrulama (`jose` kütüphanesi)
- Token httpOnly cookie olarak saklanır ("ibsad-token", 24 saat)
- Middleware tüm rotaları korur (`/login` ve `/api/auth/login` hariç)
- `lib/auth.ts` → `SessionUser` interface, `createToken()`, `verifyToken()`, `getSession()`, `setSessionCookie()`, `deleteSessionCookie()`
- Login: `/app/login/page.tsx` (email + şifre formu)
- API: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`

## Proje Yapısı
```
app/                          # Next.js App Router
  layout.tsx                  # Root layout (ThemeProvider ile)
  page.tsx                    # Dashboard ana sayfa (server component, auth kontrollü)
  globals.css                 # Tailwind + shadcn tema değişkenleri + custom scrollbar
  login/page.tsx              # Giriş sayfası
  generated/prisma/           # Prisma Client (otomatik üretilir)
  kullanicilar/               # Kullanıcı CRUD sayfası (admin only)
    page.tsx                  # Server component (auth + role check)
    kullanicilar-client.tsx   # Client component (tablo, dialog, CRUD)
  kutuphaneler/               # Kütüphane CRUD sayfası (admin only)
    page.tsx
    kutuphaneler-client.tsx
  kitaplar/                   # Kitap CRUD sayfası (rol bazlı erişim)
    page.tsx
    kitaplar-client.tsx       # MARC yapıştırma desteği dahil, sayfalama, admin kütüphane filtresi
    [id]/                     # Kitap detay sayfası
      page.tsx
      kitap-detay-client.tsx  # Tam kimlik, ödünç geçmişi, düzenle, benzer kitaplar (pills tabs, lazy load)
  uye-tipleri/                # Üye Tipi CRUD sayfası (herkes görür, ADMIN CRUD)
    page.tsx
    uye-tipleri-client.tsx
  uyeler/                     # Üye CRUD sayfası (kütüphane bazlı erişim)
    page.tsx
    uyeler-client.tsx
  odunc-islemleri/             # Ödünç İşlemleri sayfası (kütüphane bazlı)
    page.tsx
    odunc-islemleri-client.tsx # İade, uzatma, iptal, kayıp işlemleri
  devir-islemleri/              # Devir İşlemleri sayfası (kütüphaneler arası kitap devri)
    page.tsx
    devir-islemleri-client.tsx  # Devir fişi CRUD, kitap arama, workflow, PDF çıktısı
  etiket-tasarimlari/          # Etiket Tasarımları sayfası (herkes görür, ADMIN CRUD)
    page.tsx
    etiket-tasarimlari-client.tsx # Görsel etiket tasarımcısı, önizleme, A4 layout
  etiket-listeleri/            # Etiket Listeleri sayfası (ADMIN+KUTUPHANECI)
    page.tsx
    etiket-listeleri-client.tsx # Liste yönetimi, kitap ekleme, PDF dışa aktarma
  api/
    auth/login/route.ts       # POST: email/şifre ile giriş
    auth/logout/route.ts      # POST: çıkış
    auth/me/route.ts          # GET: oturum bilgisi
    kullanicilar/route.ts     # GET: liste, POST: oluştur (admin only)
    kullanicilar/[id]/route.ts # GET/PUT/DELETE (admin + self-edit)
    kutuphaneler/route.ts     # GET: liste, POST: oluştur (admin only)
    kutuphaneler/[id]/route.ts # GET/PUT/DELETE (admin only)
    kitaplar/route.ts         # GET: liste (rol filtreli), POST: oluştur
    kitaplar/[id]/route.ts    # GET/PUT/DELETE (kütüphane bazlı yetki)
    uye-tipleri/route.ts      # GET: liste (herkes), POST: oluştur (admin only)
    uye-tipleri/[id]/route.ts # GET/PUT/DELETE (admin only)
    uyeler/route.ts           # GET: liste (kütüphane filtreli), POST: oluştur
    uyeler/[id]/route.ts      # GET/PUT/DELETE (kütüphane bazlı yetki)
    odunc-islemleri/route.ts  # GET: liste (kütüphane filtreli), POST: ödünç ver
    odunc-islemleri/[id]/route.ts # GET/PUT/DELETE (iade, uzatma, iptal, kayıp)
    etiket-tasarimlari/route.ts  # GET: liste (herkes), POST: oluştur (admin only)
    etiket-tasarimlari/[id]/route.ts # GET/PUT/DELETE (admin only)
    etiket-listeleri/route.ts    # GET: liste (kütüphane filtreli), POST: oluştur
    etiket-listeleri/[id]/route.ts # GET/PUT/DELETE (kütüphane bazlı yetki)
    etiket-listeleri/[id]/kitaplar/route.ts # POST: kitap ekle, DELETE: kitap çıkar
    devir-islemleri/route.ts     # GET: liste (kütüphane filtreli, sayfalı), POST: oluştur
    devir-islemleri/[id]/route.ts # GET/PUT/DELETE (taslak düzenle/sil)
    devir-islemleri/[id]/durum/route.ts # POST: durum değiştir (gonder, teslimAl, onayla, iadeEt)
components/
  ui/                         # shadcn/ui bileşenleri
  charts/                     # ECharts wrapper bileşeni
  dashboard/                  # Dashboard'a özel bileşenler (stats-cards, charts, dashboard-client)
  app-sidebar.tsx             # Ana sidebar navigasyon (collapse + drawer)
  dashboard-layout.tsx        # Dashboard layout (sidebar + header + content)
  theme-provider.tsx          # next-themes provider
  theme-toggle.tsx            # Gece/gündüz tema değiştirici
lib/
  utils.ts                    # cn() helper (clsx + tailwind-merge)
  prisma.ts                   # Prisma client singleton (adapter-pg ile)
  auth.ts                     # JWT auth utilities
  etiket-types.ts             # Etiket sistemi tipleri, sabitleri, preset'ler
  etiket-utils.ts             # Template processing, placeholder dönüştürme
proxy.ts                     # Route koruması (tüm rotalar auth gerektirir, Next.js 16 proxy convention)
prisma/
  schema.prisma               # Veritabanı şeması
  seed.ts                     # Başlangıç verileri (3 kütüphane, 3 kullanıcı, 10 kitap, 3 üye tipi, 4 üye, 3 ödünç, 3 etiket tasarımı, 2 etiket listesi)
  migrations/                 # DB migration dosyaları
```

## shadcn/ui Bileşenleri
`components/ui/` altında: button, card, avatar, tooltip, separator, dropdown-menu, collapsible, input, label, dialog, badge, select, table, textarea

## Sidebar Menü Yapısı
- **ANA MENÜ:** Dashboard
- **KÜTÜPHANE:** Kitaplar, Kütüphaneler
- **ÜYE YÖNETİMİ:** Üyeler, Üye Tipleri
- **ETİKETLER:** Etiket Tasarımları, Etiket Listeleri
- **İŞLEMLER:** Ödünç İşlemleri, Devir İşlemleri
- **YÖNETİM:** Kullanıcılar
- **Alt Kısım:** Tema toggle + Collapse toggle + Kullanıcı bilgileri + Çıkış butonu

## Veritabanı Modelleri

### User (users tablosu)
- `id` (cuid, PK)
- `tcKimlikNo` (unique)
- `email` (unique)
- `password` (bcrypt hash)
- `firstName`, `lastName`
- `phone`, `gender` (ERKEK/KADIN), `birthDate`
- `department`, `title`
- `role` (ADMIN/KUTUPHANECI/MEMUR, default: MEMUR)
- `avatar`
- `isActive` (default: true)
- `kutuphaneId` (nullable FK → Kutuphane)
- `lastLoginAt`, `createdAt`, `updatedAt`

### Kutuphane (kutuphaneler tablosu)
- `id` (cuid, PK)
- `adi`, `kodu` (unique)
- `aciklama`, `adres`, `telefon`, `eposta`, `webSitesi`
- `aktif` (default: true)
- `createdAt`, `updatedAt`
- İlişkiler: `kitaplar` (Kitap[]), `kullanicilar` (User[]), `cikisDevirleri` (DevirFisi[]), `girisDevirleri` (DevirFisi[])

### Kitap (kitaplar tablosu)
- `id` (cuid, PK), `uuid` (unique, auto)
- `isbn`, `baslik`, `demirbasNo`, `barkod`
- `yayinevi`, `dil`, `yayinYili`, `sayfaSayisi`, `kapakResmi`
- `durum` (KitapDurumu: MEVCUT/ODUNC/KAYIP/HASARLI/AYIKLANDI)
- `fizikselDurum` (KitapFizikselDurum: MUKEMMEL/COK_IYI/IYI/ORTA/KOTU)
- `ozet`, `notlar`, `yazarlar`
- `aktif` (default: true)
- `kutuphaneId` (required FK → Kutuphane, cascade delete)
- `createdAt`, `updatedAt`
- İlişkiler: `oduncler` (Odunc[]), `etiketListesiKitaplar` (EtiketListesiKitap[]), `devirFisiKitaplar` (DevirFisiKitap[])

### UyeTipi (uye_tipleri tablosu)
- `id` (cuid, PK)
- `adi`, `aciklama`
- `maksimumKitap` (Int, default: 3) - üyenin aynı anda alabilceği kitap sayısı
- `oduncSuresi` (Int, default: 15) - gün cinsinden ödünç süresi
- `gunlukCeza` (Decimal(10,2), default: 1.00) - günlük gecikme cezası (₺)
- `aktif` (default: true)
- `createdAt`, `updatedAt`
- İlişkiler: `uyeler` (Uye[])

### Uye (uyeler tablosu)
- `id` (cuid, PK), `uuid` (unique, auto)
- `adi`, `soyadi`, `tcKimlikNo`, `kartNumarasi`
- `eposta`, `telefon`, `adres`
- `kayitTarihi` (default: now), `bitisTarihi` (nullable)
- `notlar`, `aktif` (default: true)
- `uyeTipiId` (required FK → UyeTipi, RESTRICT)
- `kutuphaneId` (required FK → Kutuphane, RESTRICT)
- `olusturanId` (nullable FK → User, SET_NULL)
- `createdAt`
- İlişkiler: `oduncler` (Odunc[])

### Odunc (odunc_islemleri tablosu)
- `id` (cuid, PK), `uuid` (unique, auto)
- `oduncTarihi` (default: now), `sonIadeTarihi`, `iadeTarihi` (nullable)
- `uzatmaSayisi` (Int, default: 0), `maksimumUzatma` (Int, default: 2)
- `durum` (OduncDurumu: AKTIF/IADE_EDILDI/GECIKMIS/KAYIP/IPTAL, default: AKTIF)
- `gecikmeCezasi` (Decimal(10,2), nullable) - otomatik hesaplanır
- `cezaOdendi` (Boolean, default: false)
- `notlar`
- `kitapId` (required FK → Kitap, RESTRICT)
- `uyeId` (required FK → Uye, RESTRICT)
- `kutuphaneId` (required FK → Kutuphane, RESTRICT)
- `olusturanId` (nullable FK → User, SET_NULL)
- `createdAt`, `updatedAt`

## Ödünç İşlem Mantığı
- **Ödünç Verme:** Kitap MEVCUT olmalı, üye aktif olmalı, üye limit aşmamalı, gecikmiş ödüncü olmamalı
- **İade:** Gecikme varsa ceza otomatik hesaplanır (gün × günlükCeza), kitap durumu MEVCUT'a döner
- **Uzatma:** Sadece aktif ve gecikmeyen kayıtlar uzatılabilir, maks. uzatma sayısı kontrol edilir
- **İptal:** Aktif kayıtlar iptal edilebilir, kitap MEVCUT'a döner
- **Kayıp:** Kitap durumu KAYIP olarak güncellenir
- **Ceza Ödeme:** Gecikme cezası ödendi olarak işaretlenir

## Devir İşlemleri (Kütüphaneler Arası Kitap Devri)

### DevirFisi (devir_fisleri tablosu)
- `id` (cuid, PK), `uuid` (unique, auto)
- `fisNo` (unique, auto: DVR-YYYYMMDD-XXXX)
- `aciklama`, `notlar`
- `durum` (DevirDurumu: TASLAK/TESLIM_BEKLIYOR/ONAY_BEKLIYOR/ONAYLANDI/IADE_EDILDI, default: TASLAK)
- `iadenedeni` (nullable, iade/red nedeni)
- `teslimTarihi` (nullable), `onayTarihi` (nullable)
- `cikisKutuphaneId` (required FK → Kutuphane, RESTRICT)
- `girisKutuphaneId` (required FK → Kutuphane, RESTRICT)
- `olusturanId` (nullable FK → User, SET_NULL)
- `teslimEdenId` (required FK → User, RESTRICT)
- `teslimAlanId` (required FK → User, RESTRICT)
- `onaylayanId` (required FK → User, RESTRICT)
- `createdAt`, `updatedAt`
- İlişkiler: `kitaplar` (DevirFisiKitap[])

### DevirFisiKitap (devir_fisi_kitaplar tablosu)
- `id` (cuid, PK)
- `devirFisiId` (FK → DevirFisi, CASCADE)
- `kitapId` (FK → Kitap, RESTRICT)
- `sira` (Int, default: 0)
- `createdAt`
- Unique: [devirFisiId, kitapId]

### Devir Workflow
- **TASLAK:** Oluşturuldu, düzenlenebilir, silinebilir. Kitaplar MEVCUT olmalı ve çıkış kütüphanesine ait olmalı.
- **TESLIM_BEKLIYOR:** Gönderildi, düzenlenemez. Teslim alan kişi kabul etmelidir.
- **ONAY_BEKLIYOR:** Teslim alındı, onaylayan kişi onaylamalıdır.
- **ONAYLANDI:** Onaylandı, kitapların `kutuphaneId`'si giriş kütüphanesine devredilir (transaction).
- **IADE_EDILDI:** Reddedildi, `iadenedeni` zorunlu.
- İade: TESLIM_BEKLIYOR veya ONAY_BEKLIYOR → IADE_EDILDI

## Etiket Sistemi

### EtiketTasarimi (etiket_tasarimlari tablosu)
- `id` (cuid, PK), `uuid` (unique, auto)
- `adi`, `aciklama`
- `etiketGenislik`, `etiketYukseklik` (Float, mm cinsinden)
- `yaziciTuru` (YaziciTuru: ETIKET_YAZICI/A4)
- A4 ayarları: `sayfaGenislik`, `sayfaYukseklik`, `satirSayisi`, `sutunSayisi`, `sayfaKenarUst/Alt/Sol/Sag`, `satirAraligi`, `sutunAraligi`
- `sablon` (Text, JSON — LabelElement[] dizisi)
- `varsayilan` (Boolean), `aktif` (Boolean)
- `olusturanId` (nullable FK → User)
- İlişkiler: `etiketListeleri` (EtiketListesi[])

### EtiketListesi (etiket_listeleri tablosu)
- `id` (cuid, PK), `uuid` (unique, auto)
- `adi`, `aciklama`
- `tasarimId` (required FK → EtiketTasarimi, RESTRICT)
- `kutuphaneId` (required FK → Kutuphane, RESTRICT)
- `olusturanId` (nullable FK → User)
- `aktif` (Boolean)
- İlişkiler: `kitaplar` (EtiketListesiKitap[])

### EtiketListesiKitap (etiket_listesi_kitaplar tablosu)
- `id` (cuid, PK)
- `listeId` (FK → EtiketListesi, CASCADE)
- `kitapId` (FK → Kitap, CASCADE)
- `adet` (Int, default: 1), `sira` (Int, default: 0)
- Unique: [listeId, kitapId]

### Etiket Şablon Yapısı (LabelElement)
Her etiket, JSON formatında `LabelElement[]` dizisi içerir:
- **type:** text | barcode | qrcode | line | rectangle
- **Konum:** x, y, width, height (mm cinsinden)
- **Text özellikleri:** content (placeholder template), fontSize, fontWeight, textAlign, color
- **Barcode:** barcodeFormat (CODE128/CODE39/EAN13/EAN8), showText
- **QR:** content (placeholder template), color

### Placeholder Sistemi
Şablon içeriğinde `{alan}` formatında yer tutucular kullanılır:
- Alanlar: `baslik`, `yazarlar`, `isbn`, `barkod`, `demirbasNo`, `yayinevi`, `yayinYili`, `dil`, `sayfaSayisi`, `kutuphaneAdi`, `kutuphaneKodu`, `durum`
- Transform fonksiyonları: `{alan|upper}`, `{alan|lower}`, `{alan|truncate:20}`, `{alan|split:0}`, `{alan|splitBy(-):1}`, `{alan|first:3}`, `{alan|last:5}`, `{alan|initials}`, `{alan|trim}`

### PDF Dışa Aktarma
- **jspdf** ile PDF üretimi
- **jsbarcode** ile barkod (SVG/Canvas) oluşturma
- **qrcode** ile QR kod oluşturma
- A4 yazıcı: Sayfa üzerine satır/sütun grid yerleşimi
- Etiket yazıcı: Her etiket ayrı sayfa olarak

## MARC Desteği
Kitap ekleme/düzenleme dialogunda **MARC Yapıştır** butonu bulunur. MARC21 formatındaki kayıtlar yapıştırılarak form alanları otomatik doldurulur.

Desteklenen MARC alanları:
| MARC Tag | Alt Alan | Karşılan Alan |
|----------|----------|---------------|
| 020 | $a | ISBN |
| 041 | $a | Dil |
| 100 | $a | Yazar (birincil) |
| 245 | $a, $b | Başlık |
| 260/264 | $b | Yayınevi |
| 260/264 | $c | Yayın Yılı |
| 300 | $a | Sayfa Sayısı |
| 500 | $a | Notlar |
| 520 | $a | Özet |
| 700 | $a | Ek Yazarlar |

Desteklenen formatlar: MarcEdit (`=TAG  \\$a...`) ve standart metin (`TAG IND $a...`)

## Erişim Kontrolleri
| Sayfa | ADMIN | KUTUPHANECI | MEMUR |
|-------|-------|-------------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Kullanıcılar | ✅ | ❌ redirect | ❌ redirect |
| Kütüphaneler | ✅ | ❌ redirect | ❌ redirect |
| Kitaplar | Tüm kitaplar | Kendi kütüphanesi | Kendi kütüphanesi |
| Üye Tipleri | CRUD | Sadece görüntüleme | Sadece görüntüleme |
| Üyeler | Tüm üyeler (filtreli) | Kendi kütüphanesi | Kendi kütüphanesi |
| Ödünç İşlemleri | Tüm kayıtlar (filtreli) | Kendi kütüphanesi | Kendi kütüphanesi |
| Etiket Tasarımları | CRUD | Sadece görüntüleme | Sadece görüntüleme |
| Etiket Listeleri | Tüm listeler (filtreli) | Kendi kütüphanesi | ❌ redirect |
| Devir İşlemleri | Tüm kayıtlar (filtreli) | Kendi kütüphanesi | Kendi kütüphanesi |

## Tasarım Kuralları
1. **Mobile-first** yaklaşım, responsive tasarım
2. **Gece/Gündüz modu** - varsayılan gündüz (light)
3. shadcn/ui CSS değişkenleri ile tema yönetimi (globals.css)
4. Sidebar daraltılabilir (collapsed) + mobilde drawer, **her zaman koyu tema** (`bg-slate-900`)
5. Tüm bileşenler Türkçe
6. Grafikler Apache ECharts ile (custom `<EChart>` wrapper)
7. Kartlarda dairesel ilerleme göstergeleri
8. Modern, temiz ve profesyonel görünüm
9. **Custom scrollbar** - ince, yarı saydam, hover'da belirginleşen (globals.css)
10. CRUD sayfaları: Server page (auth check) → Client component (tablo + dialog)
11. **Logo:** `public/logo.png` — doğrudan `<Image src="/logo.png">` ile kullanılır. `brightness-0 invert` gibi filtreler KULLANILMAZ, logo orijinal haliyle gösterilir. Sidebar ve login sayfasında referans boyut: `width={34-38} height={34-38}`, `rounded-lg` ile yuvarlatılır.
12. **Yumuşak renkler:** Sidebar ve login koyu panelinde `bg-slate-900` kullanılır (saf siyah `#0f1117` KULLANILMAZ). Kenarlıklar `border-slate-700/50`, aktif öğeler `bg-blue-600/90` veya `bg-blue-500/15`, metin `text-slate-100`/`text-slate-400` tonlarıyla yumuşak kontrast sağlanır.
13. **Stat Kartları (İstatistik Kutucukları):** Tüm sayfalarda aynı tasarım kullanılır. Renkli arka plan + ikon + metin yapısı:
    ```tsx
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Başlık", value: 123, icon: IconComponent, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50", border: "border-blue-100 dark:border-blue-900/50" },
        // ... diğer kartlar: emerald (yeşil), amber (turuncu), rose (kırmızı)
      ].map((stat) => (
        <Card key={stat.label} className={`border ${stat.border} ${stat.bg} shadow-none`}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value.toLocaleString("tr-TR")}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    ```
    - Renk paleti: `blue` (genel/toplam), `emerald` (olumlu/aktif), `amber` (uyarı/ödünç), `rose` (tehlike/kayıp)
    - Her kart: `shadow-none`, renkli `border`, hafif renkli arka plan
    - İkon: 12x12 kutu içinde 6x6 ikon, `rounded-xl`
    - Değer: `text-2xl font-bold tracking-tight`, sayı formatı `toLocaleString("tr-TR")`
14. **InfoItem Pattern:** Detay sayfalarında bilgi gösterimi (profil, kitap detay vb.):
    ```tsx
    function InfoItem({ icon: Icon, label, value }) {
      return (
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value || "—"}</p>
          </div>
        </div>
      );
    }
    ```
15. **Pills Sekmeler:** Detay sayfalarındaki alt bölümlerde pills tarzı sekmeler kullanılır:
    ```tsx
    <button className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
      active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
    }`}>
      {label}
      {count !== undefined && <span className="... rounded-full px-1.5 text-xs">{count}</span>}
    </button>
    ```
    - Lazy load: Sekme verileri sadece tıklandığında yüklenir
    - Count badge: Veri yüklendikten sonra gösterilir
16. **Sayfalama (Pagination):** Tablo listelerinde sayfalama yapısı:
    - Varsayılan sayfa boyutu: 50
    - API: `page`, `pageSize` parametreleri, yanıt: `{ data, total, page, pageSize }`
    - UI: Alt kısımda "Toplam X kayıt · Sayfa Y / Z" + sayfa numaraları (maks. 5 görünür) + ilk/önceki/sonraki/son butonları

## Geliştirme Komutları
```bash
pnpm dev          # Geliştirme sunucusu
pnpm build        # Production build
pnpm db:migrate   # Prisma migration
pnpm db:seed      # Veritabanı seed
pnpm db:studio    # Prisma Studio
pnpm db:generate  # Prisma Client generate
```

## Test Kullanıcıları
| Rol | Email | Şifre | Kütüphane |
|-----|-------|-------|-----------|
| Admin | admin@ibsad.com | admin123 | — |
| Kütüphaneci | kutuphaneci@ibsad.com | kutuphaneci123 | Merkez Kütüphane |
| Memur | memur@ibsad.com | memur123 | Tıp Fakültesi Kütüphanesi |

## Seed Verileri
- **3 Kütüphane:** Merkez (MRK001), Tıp Fakültesi (TIP001), Mühendislik Fakültesi (MUH001)
- **3 Kullanıcı:** admin, kütüphaneci (Merkez'e atanmış), memur (Tıp'a atanmış)
- **10 Kitap:** Merkez(5) + Tıp(3) + Mühendislik(2)
- **3 Üye Tipi:** Öğrenci (3 kitap/15 gün), Akademisyen (10 kitap/30 gün), Personel (5 kitap/15 gün)
- **4 Üye:** Ali Yılmaz (öğrenci, Merkez), Fatma Demir (akademisyen, Merkez), Hasan Kara (personel, Tıp), Zeynep Çelik (öğrenci, Tıp)
- **3 Ödünç:** 1 aktif (Merkez), 1 gecikmiş (Tıp), 1 iade edilmiş (Merkez)
- **3 Etiket Tasarımı:** Sırt Etiketi (70×30mm, varsayılan), QR Kodlu (50×25mm), A4 Sayfa (Avery L7160)
- **2 Etiket Listesi:** Merkez Yeni Kitaplar (3 kitap), Tıp A4 Baskı Listesi

## Kodlama Kuralları
- Tüm bileşenler TypeScript ile yazılır
- Dosya isimleri kebab-case (örn: `app-sidebar.tsx`)
- Component isimleri PascalCase (örn: `AppSidebar`)
- `cn()` helper ile Tailwind sınıf birleştirme
- Server Components tercih edilir (gerekmedikçe `"use client"` kullanılmaz)
- Prisma Client her zaman `lib/prisma.ts` üzerinden import edilir
- shadcn/ui bileşenleri `components/ui/` altında tutulur
- CRUD sayfaları pattern: `page.tsx` (server, auth) + `*-client.tsx` (client, UI)
- API rotaları `getSession()` ile auth kontrolü yapar
- Prisma 7 adapter pattern kullanır (PrismaPg + Pool)