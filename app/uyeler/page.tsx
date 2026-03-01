import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import UyelerClient from "./uyeler-client";

export default async function UyelerPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    return <UyelerClient user={session} />;
}
