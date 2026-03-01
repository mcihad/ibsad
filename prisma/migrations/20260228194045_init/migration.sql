-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'KUTUPHANECI', 'MEMUR');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('ERKEK', 'KADIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tc_kimlik_no" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "gender" "Gender",
    "birth_date" TIMESTAMP(3),
    "department" TEXT,
    "title" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMUR',
    "avatar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_tc_kimlik_no_key" ON "users"("tc_kimlik_no");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
