import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import KullanicilarClient from "./kullanicilar-client";

export default async function KullanicilarPage() {
    const session = await getSession();
    if (!session) redirect("/login");
    if (session.role !== "ADMIN") redirect("/");

    return <KullanicilarClient user={session} />;
}
