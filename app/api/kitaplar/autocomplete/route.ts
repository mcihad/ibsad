import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Autocomplete for yazarlar or yayinevi fields
// Usage: /api/kitaplar/autocomplete?field=yazarlar&q=tols
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const field = searchParams.get("field");
    const q = searchParams.get("q");

    if (!field || !q || q.length < 3) {
        return NextResponse.json([]);
    }

    if (field !== "yazarlar" && field !== "yayinevi") {
        return NextResponse.json({ error: "Geçersiz alan" }, { status: 400 });
    }

    // Query distinct values matching the search term
    const results = await prisma.kitap.findMany({
        where: {
            [field]: {
                contains: q,
                mode: "insensitive" as const,
                not: null,
            },
        },
        select: {
            [field]: true,
        },
        distinct: [field],
        take: 10,
        orderBy: {
            [field]: "asc",
        },
    });

    // Extract unique values
    const values = results
        .map((r: Record<string, unknown>) => r[field] as string)
        .filter(Boolean);

    return NextResponse.json(values);
}
