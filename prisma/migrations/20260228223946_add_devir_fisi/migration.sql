-- CreateEnum
CREATE TYPE "DevirDurumu" AS ENUM ('TASLAK', 'TESLIM_BEKLIYOR', 'ONAY_BEKLIYOR', 'ONAYLANDI', 'IADE_EDILDI');

-- CreateTable
CREATE TABLE "devir_fisleri" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "fis_no" TEXT NOT NULL,
    "aciklama" TEXT,
    "durum" "DevirDurumu" NOT NULL DEFAULT 'TASLAK',
    "notlar" TEXT,
    "iade_nedeni" TEXT,
    "teslim_tarihi" TIMESTAMP(3),
    "onay_tarihi" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cikis_kutuphane_id" TEXT NOT NULL,
    "giris_kutuphane_id" TEXT NOT NULL,
    "olusturan_id" TEXT,
    "teslim_eden_id" TEXT NOT NULL,
    "teslim_alan_id" TEXT NOT NULL,
    "onaylayan_id" TEXT NOT NULL,

    CONSTRAINT "devir_fisleri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devir_fisi_kitaplar" (
    "id" TEXT NOT NULL,
    "devir_fisi_id" TEXT NOT NULL,
    "kitap_id" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devir_fisi_kitaplar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devir_fisleri_uuid_key" ON "devir_fisleri"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "devir_fisleri_fis_no_key" ON "devir_fisleri"("fis_no");

-- CreateIndex
CREATE INDEX "devir_fisleri_durum_idx" ON "devir_fisleri"("durum");

-- CreateIndex
CREATE INDEX "devir_fisleri_fis_no_idx" ON "devir_fisleri"("fis_no");

-- CreateIndex
CREATE UNIQUE INDEX "devir_fisi_kitaplar_devir_fisi_id_kitap_id_key" ON "devir_fisi_kitaplar"("devir_fisi_id", "kitap_id");

-- AddForeignKey
ALTER TABLE "devir_fisleri" ADD CONSTRAINT "devir_fisleri_cikis_kutuphane_id_fkey" FOREIGN KEY ("cikis_kutuphane_id") REFERENCES "kutuphaneler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devir_fisleri" ADD CONSTRAINT "devir_fisleri_giris_kutuphane_id_fkey" FOREIGN KEY ("giris_kutuphane_id") REFERENCES "kutuphaneler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devir_fisleri" ADD CONSTRAINT "devir_fisleri_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devir_fisleri" ADD CONSTRAINT "devir_fisleri_teslim_eden_id_fkey" FOREIGN KEY ("teslim_eden_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devir_fisleri" ADD CONSTRAINT "devir_fisleri_teslim_alan_id_fkey" FOREIGN KEY ("teslim_alan_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devir_fisleri" ADD CONSTRAINT "devir_fisleri_onaylayan_id_fkey" FOREIGN KEY ("onaylayan_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devir_fisi_kitaplar" ADD CONSTRAINT "devir_fisi_kitaplar_devir_fisi_id_fkey" FOREIGN KEY ("devir_fisi_id") REFERENCES "devir_fisleri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devir_fisi_kitaplar" ADD CONSTRAINT "devir_fisi_kitaplar_kitap_id_fkey" FOREIGN KEY ("kitap_id") REFERENCES "kitaplar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
