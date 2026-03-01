import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import IstatistiklerClient from "./istatistikler-client";

export default async function IstatistiklerPage() {
    const session = await getSession();
    if (!session) redirect("/login");
    if (session.role !== "ADMIN") redirect("/");

    return <IstatistiklerClient user={session} />;
}
