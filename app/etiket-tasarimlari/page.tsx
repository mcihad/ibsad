import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import EtiketTasarimlariClient from "./etiket-tasarimlari-client";

export default async function EtiketTasarimlariPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    return <EtiketTasarimlariClient user={session} />;
}
