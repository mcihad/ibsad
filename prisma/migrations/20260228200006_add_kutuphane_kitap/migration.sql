-- CreateEnum
CREATE TYPE "KitapDurumu" AS ENUM ('MEVCUT', 'ODUNC', 'KAYIP', 'HASARLI', 'AYIKLANDI');

-- CreateEnum
CREATE TYPE "KitapFizikselDurum" AS ENUM ('MUKEMMEL', 'COK_IYI', 'IYI', 'ORTA', 'KOTU');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kutuphane_id" TEXT;

-- CreateTable
CREATE TABLE "kutuphaneler" (
    "id" TEXT NOT NULL,
    "adi" TEXT NOT NULL,
    "kodu" TEXT NOT NULL,
    "aciklama" TEXT,
    "adres" TEXT,
    "telefon" TEXT,
    "eposta" TEXT,
    "web_sitesi" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kutuphaneler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitaplar" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "isbn" TEXT,
    "baslik" TEXT NOT NULL,
    "demirbas_no" TEXT,
    "barkod" TEXT,
    "yayinevi" TEXT,
    "dil" TEXT,
    "yayin_yili" INTEGER,
    "sayfa_sayisi" INTEGER,
    "kapak_resmi" TEXT,
    "durum" "KitapDurumu" NOT NULL DEFAULT 'MEVCUT',
    "fiziksel_durum" "KitapFizikselDurum" NOT NULL DEFAULT 'IYI',
    "ozet" TEXT,
    "notlar" TEXT,
    "yazarlar" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "kutuphane_id" TEXT NOT NULL,

    CONSTRAINT "kitaplar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kutuphaneler_kodu_key" ON "kutuphaneler"("kodu");

-- CreateIndex
CREATE UNIQUE INDEX "kitaplar_uuid_key" ON "kitaplar"("uuid");

-- CreateIndex
CREATE INDEX "kitaplar_isbn_idx" ON "kitaplar"("isbn");

-- CreateIndex
CREATE INDEX "kitaplar_barkod_idx" ON "kitaplar"("barkod");

-- CreateIndex
CREATE INDEX "kitaplar_durum_idx" ON "kitaplar"("durum");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_kutuphane_id_fkey" FOREIGN KEY ("kutuphane_id") REFERENCES "kutuphaneler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitaplar" ADD CONSTRAINT "kitaplar_kutuphane_id_fkey" FOREIGN KEY ("kutuphane_id") REFERENCES "kutuphaneler"("id") ON DELETE CASCADE ON UPDATE CASCADE;
