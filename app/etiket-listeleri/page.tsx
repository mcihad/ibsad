import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import EtiketListeleriClient from "./etiket-listeleri-client";

export default async function EtiketListeleriPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    // Sadece ADMIN ve KUTUPHANECI erişebilir
    if (session.role === "MEMUR") redirect("/");

    return <EtiketListeleriClient user={session} />;
}
