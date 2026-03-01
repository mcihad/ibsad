import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import OduncIslemleriClient from "./odunc-islemleri-client";

export default async function OduncIslemleriPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    return <OduncIslemleriClient user={session} />;
}
