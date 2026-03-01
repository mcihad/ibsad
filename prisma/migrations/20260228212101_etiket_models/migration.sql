-- CreateEnum
CREATE TYPE "YaziciTuru" AS ENUM ('ETIKET_YAZICI', 'A4');

-- CreateEnum
CREATE TYPE "BarkodFormati" AS ENUM ('CODE128', 'CODE39', 'EAN13', 'EAN8', 'QR');

-- CreateTable
CREATE TABLE "etiket_tasarimlari" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "adi" TEXT NOT NULL,
    "aciklama" TEXT,
    "etiket_genislik" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "etiket_yukseklik" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "yazici_turu" "YaziciTuru" NOT NULL DEFAULT 'ETIKET_YAZICI',
    "sayfa_genislik" DOUBLE PRECISION DEFAULT 210,
    "sayfa_yukseklik" DOUBLE PRECISION DEFAULT 297,
    "satir_sayisi" INTEGER DEFAULT 10,
    "sutun_sayisi" INTEGER DEFAULT 3,
    "sayfa_kenar_ust" DOUBLE PRECISION DEFAULT 10,
    "sayfa_kenar_alt" DOUBLE PRECISION DEFAULT 10,
    "sayfa_kenar_sol" DOUBLE PRECISION DEFAULT 5,
    "sayfa_kenar_sag" DOUBLE PRECISION DEFAULT 5,
    "satir_araligi" DOUBLE PRECISION DEFAULT 0,
    "sutun_araligi" DOUBLE PRECISION DEFAULT 0,
    "sablon" TEXT NOT NULL,
    "varsayilan" BOOLEAN NOT NULL DEFAULT false,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturan_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etiket_tasarimlari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etiket_listeleri" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "adi" TEXT NOT NULL,
    "aciklama" TEXT,
    "tasarim_id" TEXT NOT NULL,
    "kutuphane_id" TEXT NOT NULL,
    "olusturan_id" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etiket_listeleri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etiket_listesi_kitaplar" (
    "id" TEXT NOT NULL,
    "liste_id" TEXT NOT NULL,
    "kitap_id" TEXT NOT NULL,
    "adet" INTEGER NOT NULL DEFAULT 1,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etiket_listesi_kitaplar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "etiket_tasarimlari_uuid_key" ON "etiket_tasarimlari"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "etiket_listeleri_uuid_key" ON "etiket_listeleri"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "etiket_listesi_kitaplar_liste_id_kitap_id_key" ON "etiket_listesi_kitaplar"("liste_id", "kitap_id");

-- AddForeignKey
ALTER TABLE "etiket_tasarimlari" ADD CONSTRAINT "etiket_tasarimlari_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiket_listeleri" ADD CONSTRAINT "etiket_listeleri_tasarim_id_fkey" FOREIGN KEY ("tasarim_id") REFERENCES "etiket_tasarimlari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiket_listeleri" ADD CONSTRAINT "etiket_listeleri_kutuphane_id_fkey" FOREIGN KEY ("kutuphane_id") REFERENCES "kutuphaneler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiket_listeleri" ADD CONSTRAINT "etiket_listeleri_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiket_listesi_kitaplar" ADD CONSTRAINT "etiket_listesi_kitaplar_liste_id_fkey" FOREIGN KEY ("liste_id") REFERENCES "etiket_listeleri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiket_listesi_kitaplar" ADD CONSTRAINT "etiket_listesi_kitaplar_kitap_id_fkey" FOREIGN KEY ("kitap_id") REFERENCES "kitaplar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
