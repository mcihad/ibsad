import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashSync } from "bcryptjs";

// GET all users (admin only)
export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            tcKimlikNo: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            department: true,
            title: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            kutuphaneId: true,
            kutuphane: { select: { id: true, adi: true, kodu: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
}

// POST create user (admin only)
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const {
            tcKimlikNo,
            email,
            password,
            firstName,
            lastName,
            phone,
            gender,
            department,
            title,
            role,
            kutuphaneId,
        } = body;

        if (!tcKimlikNo || !email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { error: "Zorunlu alanlar eksik" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { tcKimlikNo }] },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Bu e-posta veya TC Kimlik No zaten kayıtlı" },
                { status: 409 }
            );
        }

        const user = await prisma.user.create({
            data: {
                tcKimlikNo,
                email,
                password: hashSync(password, 10),
                firstName,
                lastName,
                phone: phone || null,
                gender: gender || null,
                department: department || null,
                title: title || null,
                role: role || "MEMUR",
                kutuphaneId: kutuphaneId || null,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("User creation error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
