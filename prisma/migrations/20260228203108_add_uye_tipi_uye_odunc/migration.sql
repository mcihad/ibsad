-- CreateEnum
CREATE TYPE "OduncDurumu" AS ENUM ('AKTIF', 'IADE_EDILDI', 'GECIKMIS', 'KAYIP', 'IPTAL');

-- CreateTable
CREATE TABLE "uye_tipleri" (
    "id" TEXT NOT NULL,
    "adi" TEXT NOT NULL,
    "aciklama" TEXT,
    "maksimum_kitap" INTEGER NOT NULL DEFAULT 3,
    "odunc_suresi" INTEGER NOT NULL DEFAULT 15,
    "gunluk_ceza" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uye_tipleri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uyeler" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "adi" TEXT NOT NULL,
    "soyadi" TEXT NOT NULL,
    "tc_kimlik_no" TEXT,
    "kart_numarasi" TEXT,
    "eposta" TEXT,
    "telefon" TEXT,
    "adres" TEXT,
    "kayit_tarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bitis_tarihi" TIMESTAMP(3),
    "notlar" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uye_tipi_id" TEXT NOT NULL,
    "kutuphane_id" TEXT NOT NULL,
    "olusturan_id" TEXT,

    CONSTRAINT "uyeler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odunc_islemleri" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "odunc_tarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "son_iade_tarihi" TIMESTAMP(3) NOT NULL,
    "iade_tarihi" TIMESTAMP(3),
    "uzatma_sayisi" INTEGER NOT NULL DEFAULT 0,
    "maksimum_uzatma" INTEGER NOT NULL DEFAULT 2,
    "durum" "OduncDurumu" NOT NULL DEFAULT 'AKTIF',
    "gecikme_cezasi" DECIMAL(10,2),
    "ceza_odendi" BOOLEAN NOT NULL DEFAULT false,
    "notlar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "kitap_id" TEXT NOT NULL,
    "uye_id" TEXT NOT NULL,
    "kutuphane_id" TEXT NOT NULL,
    "olusturan_id" TEXT,

    CONSTRAINT "odunc_islemleri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uyeler_uuid_key" ON "uyeler"("uuid");

-- CreateIndex
CREATE INDEX "uyeler_tc_kimlik_no_idx" ON "uyeler"("tc_kimlik_no");

-- CreateIndex
CREATE INDEX "uyeler_kart_numarasi_idx" ON "uyeler"("kart_numarasi");

-- CreateIndex
CREATE UNIQUE INDEX "odunc_islemleri_uuid_key" ON "odunc_islemleri"("uuid");

-- CreateIndex
CREATE INDEX "odunc_islemleri_durum_idx" ON "odunc_islemleri"("durum");

-- CreateIndex
CREATE INDEX "odunc_islemleri_son_iade_tarihi_idx" ON "odunc_islemleri"("son_iade_tarihi");

-- AddForeignKey
ALTER TABLE "uyeler" ADD CONSTRAINT "uyeler_uye_tipi_id_fkey" FOREIGN KEY ("uye_tipi_id") REFERENCES "uye_tipleri"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uyeler" ADD CONSTRAINT "uyeler_kutuphane_id_fkey" FOREIGN KEY ("kutuphane_id") REFERENCES "kutuphaneler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uyeler" ADD CONSTRAINT "uyeler_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odunc_islemleri" ADD CONSTRAINT "odunc_islemleri_kitap_id_fkey" FOREIGN KEY ("kitap_id") REFERENCES "kitaplar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odunc_islemleri" ADD CONSTRAINT "odunc_islemleri_uye_id_fkey" FOREIGN KEY ("uye_id") REFERENCES "uyeler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odunc_islemleri" ADD CONSTRAINT "odunc_islemleri_kutuphane_id_fkey" FOREIGN KEY ("kutuphane_id") REFERENCES "kutuphaneler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odunc_islemleri" ADD CONSTRAINT "odunc_islemleri_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
