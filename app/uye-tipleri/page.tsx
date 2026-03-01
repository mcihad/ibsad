import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import UyeTipleriClient from "./uye-tipleri-client";

export default async function UyeTipleriPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    return <UyeTipleriClient user={session} />;
}
