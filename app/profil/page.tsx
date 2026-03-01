import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProfilClient from "./profil-client";

export default async function ProfilPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    return <ProfilClient user={session} />;
}
