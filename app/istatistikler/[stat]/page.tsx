import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import IstatistikDetayClient from "./istatistik-detay-client";

interface Props {
    params: Promise<{ stat: string }>;
}

export default async function IstatistikDetayPage({ params }: Props) {
    const session = await getSession();
    if (!session) redirect("/login");
    if (session.role !== "ADMIN") redirect("/");

    const { stat } = await params;

    return <IstatistikDetayClient user={session} stat={stat} />;
}
