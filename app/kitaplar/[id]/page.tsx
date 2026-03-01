import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import KitapDetayClient from "./kitap-detay-client";

export default async function KitapDetayPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getSession();
    if (!session) redirect("/login");

    const { id } = await params;

    return <KitapDetayClient user={session} kitapId={id} />;
}
