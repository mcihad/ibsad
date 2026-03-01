import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import KitaplarClient from "./kitaplar-client";

export default async function KitaplarPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    return <KitaplarClient user={session} />;
}
