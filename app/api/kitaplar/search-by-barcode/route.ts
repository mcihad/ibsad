import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Search for a book by barcode
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const barkod = searchParams.get("barkod");

    if (!barkod || !barkod.trim()) {
        return NextResponse.json({ error: "Barkod gereklidir" }, { status: 400 });
    }

    const kitap = await prisma.kitap.findFirst({
        where: { barkod: barkod.trim() },
        include: {
            kutuphane: { select: { id: true, adi: true, kodu: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    if (!kitap) {
        return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, kitap });
}
