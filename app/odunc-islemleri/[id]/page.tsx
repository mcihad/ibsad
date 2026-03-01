import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import OduncDetayClient from "./odunc-detay-client";

export default async function OduncDetayPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getSession();
    if (!session) redirect("/login");

    const { id } = await params;

    return <OduncDetayClient user={session} oduncId={id} />;
}
