import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "ibsad-default-secret-key"
);

const COOKIE_NAME = "ibsad-token";

export interface SessionUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "ADMIN" | "KUTUPHANECI" | "MEMUR";
    kutuphaneId: string | null;
}

export async function createToken(user: SessionUser): Promise<string> {
    return new SignJWT({ user })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .setIssuedAt()
        .sign(JWT_SECRET);
}

export async function verifyToken(
    token: string
): Promise<SessionUser | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return (payload as { user: SessionUser }).user;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
    });
}

export async function deleteSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
