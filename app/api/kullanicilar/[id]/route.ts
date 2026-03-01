import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashSync, compareSync } from "bcryptjs";

// GET single user
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    // Non-admins can only view themselves
    if (session.role !== "ADMIN" && session.id !== id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            tcKimlikNo: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            birthDate: true,
            department: true,
            title: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            kutuphaneId: true,
            kutuphane: { select: { id: true, adi: true, kodu: true } },
        },
    });

    if (!user) {
        return NextResponse.json(
            { error: "Kullanıcı bulunamadı" },
            { status: 404 }
        );
    }

    return NextResponse.json(user);
}

// PUT update user
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = await params;

    // Non-admins can only edit themselves
    if (session.role !== "ADMIN" && session.id !== id) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const updateData: Record<string, unknown> = {};

        // Admin can update everything
        if (session.role === "ADMIN") {
            if (body.firstName) updateData.firstName = body.firstName;
            if (body.lastName) updateData.lastName = body.lastName;
            if (body.email) updateData.email = body.email;
            if (body.tcKimlikNo) updateData.tcKimlikNo = body.tcKimlikNo;
            if (body.phone !== undefined) updateData.phone = body.phone || null;
            if (body.gender !== undefined) updateData.gender = body.gender || null;
            if (body.department !== undefined) updateData.department = body.department || null;
            if (body.title !== undefined) updateData.title = body.title || null;
            if (body.role) updateData.role = body.role;
            if (body.isActive !== undefined) updateData.isActive = body.isActive;
            if (body.kutuphaneId !== undefined) updateData.kutuphaneId = body.kutuphaneId || null;
            if (body.password) updateData.password = hashSync(body.password, 10);
        } else {
            // Non-admin can only update limited fields
            if (body.phone !== undefined) updateData.phone = body.phone || null;
            if (body.password) {
                // Non-admin must provide current password to change it
                if (!body.currentPassword) {
                    return NextResponse.json({ error: "Mevcut şifre gereklidir" }, { status: 400 });
                }
                const currentUser = await prisma.user.findUnique({ where: { id }, select: { password: true } });
                if (!currentUser || !compareSync(body.currentPassword, currentUser.password)) {
                    return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 400 });
                }
                updateData.password = hashSync(body.password, 10);
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("User update error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}

// DELETE user (admin only)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id } = await params;

    if (session.id === id) {
        return NextResponse.json(
            { error: "Kendi hesabınızı silemezsiniz" },
            { status: 400 }
        );
    }

    try {
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("User delete error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}
