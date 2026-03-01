import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DevirIslemleriClient from "./devir-islemleri-client";

export default async function DevirIslemleriPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    return <DevirIslemleriClient user={session} />;
}
