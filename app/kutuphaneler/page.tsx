import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import KutuphanelerClient from "./kutuphaneler-client";

export default async function KutuphanelerPage() {
    const session = await getSession();
    if (!session) redirect("/login");
    if (session.role !== "ADMIN") redirect("/");

    return <KutuphanelerClient user={session} />;
}
