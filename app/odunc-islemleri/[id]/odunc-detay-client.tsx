"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
    ArrowLeft, BookOpen, User, Library, Calendar, Clock, RefreshCw,
    AlertTriangle, CheckCircle2, XCircle, Ban, Loader2, ArrowRightLeft,
    CreditCard, StickyNote,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface OduncData {
    id: string;
    uuid: string;
    oduncTarihi: string;
    sonIadeTarihi: string;
    iadeTarihi: string | null;
    uzatmaSayisi: number;
    maksimumUzatma: number;
    durum: string;
    gecikmeCezasi: string | null;
    cezaOdendi: boolean;
    notlar: string | null;
    kitap: { id: string; baslik: string; isbn: string | null; barkod: string | null };
    uye: {
        id: string; adi: string; soyadi: string; kartNumarasi: string | null;
        uyeTipi: { gunlukCeza: number; oduncSuresi: number };
    };
    kutuphane: { id: string; adi: string; kodu: string };
    createdAt: string;
}

const durumLabels: Record<string, string> = {
    AKTIF: "Aktif", IADE_EDILDI: "İade Edildi", GECIKMIS: "Gecikmiş", KAYIP: "Kayıp", IPTAL: "İptal",
};

const durumStyles: Record<string, string> = {
    AKTIF: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    IADE_EDILDI: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    GECIKMIS: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    KAYIP: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    IPTAL: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400",
};

const durumIcons: Record<string, React.ElementType> = {
    AKTIF: Clock,
    IADE_EDILDI: CheckCircle2,
    GECIKMIS: AlertTriangle,
    KAYIP: XCircle,
    IPTAL: Ban,
};

function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium mt-0.5">{value}</p>
            </div>
        </div>
    );
}

export default function OduncDetayClient({ user, oduncId }: { user: SessionUser; oduncId: string }) {
    const router = useRouter();
    const [data, setData] = React.useState<OduncData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    // Action dialog
    const [actionDialog, setActionDialog] = React.useState<{ type: string; title: string } | null>(null);
    const [actionNotes, setActionNotes] = React.useState("");
    const [actionLoading, setActionLoading] = React.useState(false);
    const [actionError, setActionError] = React.useState("");

    const fetchData = React.useCallback(async () => {
        try {
            const res = await fetch(`/api/odunc-islemleri/${oduncId}`);
            if (!res.ok) {
                setError("Ödünç kaydı bulunamadı");
                return;
            }
            setData(await res.json());
        } catch {
            setError("Veri yüklenirken hata oluştu");
        } finally {
            setLoading(false);
        }
    }, [oduncId]);

    React.useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async () => {
        if (!actionDialog || !data) return;
        setActionLoading(true);
        setActionError("");
        try {
            const res = await fetch(`/api/odunc-islemleri/${data.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: actionDialog.type, notlar: actionNotes || undefined }),
            });
            if (!res.ok) {
                const err = await res.json();
                setActionError(err.error || "İşlem sırasında hata oluştu");
                return;
            }
            setActionDialog(null);
            setActionNotes("");
            fetchData();
        } catch {
            setActionError("Bir hata oluştu");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout user={user}>
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout user={user}>
                <div className="py-24 text-center">
                    <p className="text-muted-foreground">{error || "Veri bulunamadı"}</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Geri Dön
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const isOverdue = data.durum === "AKTIF" && new Date(data.sonIadeTarihi) < new Date();
    const displayDurum = isOverdue ? "GECIKMIS" : data.durum;
    const DurumIcon = durumIcons[displayDurum] || Clock;
    const daysOverdue = isOverdue
        ? Math.ceil((new Date().getTime() - new Date(data.sonIadeTarihi).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <Button variant="outline" size="icon" className="shrink-0 mt-1" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight">Ödünç Detayı</h1>
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                                    durumStyles[displayDurum]
                                )}>
                                    <DurumIcon className="h-3.5 w-3.5" />
                                    {durumLabels[displayDurum]}
                                </span>
                            </div>
                            <p className="text-muted-foreground mt-1">#{data.uuid?.slice(0, 8) || data.id.slice(0, 8)}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {(data.durum === "AKTIF") && (
                            <>
                                <Button
                                    className="gap-2"
                                    onClick={() => { setActionDialog({ type: "iade", title: "İade Et" }); setActionError(""); setActionNotes(""); }}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    İade Et
                                </Button>
                                {!isOverdue && (
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => { setActionDialog({ type: "uzat", title: "Süre Uzat" }); setActionError(""); setActionNotes(""); }}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Uzat ({data.uzatmaSayisi}/{data.maksimumUzatma})
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="gap-2 text-amber-600 hover:text-amber-700"
                                    onClick={() => { setActionDialog({ type: "kayip", title: "Kayıp İşaretle" }); setActionError(""); setActionNotes(""); }}
                                >
                                    <XCircle className="h-4 w-4" />
                                    Kayıp
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2 text-red-600 hover:text-red-700"
                                    onClick={() => { setActionDialog({ type: "iptal", title: "İptal Et" }); setActionError(""); setActionNotes(""); }}
                                >
                                    <Ban className="h-4 w-4" />
                                    İptal
                                </Button>
                            </>
                        )}
                        {data.durum === "IADE_EDILDI" && data.gecikmeCezasi && !data.cezaOdendi && (
                            <Button
                                className="gap-2"
                                onClick={() => { setActionDialog({ type: "ceza_odendi", title: "Ceza Ödendi" }); setActionError(""); setActionNotes(""); }}
                            >
                                <CreditCard className="h-4 w-4" />
                                Ceza Ödendi
                            </Button>
                        )}
                    </div>
                </div>

                {/* Overdue Warning */}
                {isOverdue && (
                    <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-4 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                {daysOverdue} gün gecikmiş!
                            </p>
                            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                                Son iade tarihi: {formatDate(data.sonIadeTarihi)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Info Cards */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Kitap Bilgileri */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold">Kitap Bilgileri</h3>
                            </div>
                            <div className="divide-y">
                                <InfoItem icon={BookOpen} label="Kitap" value={
                                    <Link href={`/kitaplar/${data.kitap.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                        {data.kitap.baslik}
                                    </Link>
                                } />
                                {data.kitap.isbn && <InfoItem icon={StickyNote} label="ISBN" value={data.kitap.isbn} />}
                                {data.kitap.barkod && <InfoItem icon={StickyNote} label="Barkod" value={data.kitap.barkod} />}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Üye Bilgileri */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold">Üye Bilgileri</h3>
                            </div>
                            <div className="divide-y">
                                <InfoItem icon={User} label="Üye" value={`${data.uye.adi} ${data.uye.soyadi}`} />
                                {data.uye.kartNumarasi && <InfoItem icon={CreditCard} label="Kart No" value={data.uye.kartNumarasi} />}
                                <InfoItem icon={Library} label="Kütüphane" value={`${data.kutuphane.adi} (${data.kutuphane.kodu})`} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ödünç Bilgileri */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold">Ödünç Bilgileri</h3>
                            </div>
                            <div className="divide-y">
                                <InfoItem icon={Calendar} label="Ödünç Tarihi" value={formatDate(data.oduncTarihi)} />
                                <InfoItem icon={Clock} label="Son İade Tarihi" value={formatDate(data.sonIadeTarihi)} />
                                <InfoItem icon={CheckCircle2} label="İade Tarihi" value={data.iadeTarihi ? formatDate(data.iadeTarihi) : "Henüz iade edilmedi"} />
                                <InfoItem icon={RefreshCw} label="Uzatma" value={`${data.uzatmaSayisi} / ${data.maksimumUzatma}`} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ceza & Notlar */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold">Ceza & Notlar</h3>
                            </div>
                            <div className="divide-y">
                                <InfoItem
                                    icon={CreditCard}
                                    label="Gecikme Cezası"
                                    value={
                                        data.gecikmeCezasi
                                            ? <span className="flex items-center gap-2">
                                                ₺{parseFloat(data.gecikmeCezasi).toFixed(2)}
                                                {data.cezaOdendi
                                                    ? <Badge variant="secondary" className="text-[10px]">Ödendi</Badge>
                                                    : <Badge variant="destructive" className="text-[10px]">Ödenmedi</Badge>
                                                }
                                            </span>
                                            : "Yok"
                                    }
                                />
                                <InfoItem icon={StickyNote} label="Notlar" value={data.notlar || "—"} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Action Dialog */}
            <Dialog open={!!actionDialog} onOpenChange={(open) => { if (!open) setActionDialog(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{actionDialog?.title}</DialogTitle>
                        <DialogDescription>
                            {actionDialog?.type === "iade" && "Bu kitabı iade etmek istediğinize emin misiniz?"}
                            {actionDialog?.type === "uzat" && "Ödünç süresini uzatmak istediğinize emin misiniz?"}
                            {actionDialog?.type === "kayip" && "Bu kitabı kayıp olarak işaretlemek istediğinize emin misiniz?"}
                            {actionDialog?.type === "iptal" && "Bu ödünç işlemini iptal etmek istediğinize emin misiniz?"}
                            {actionDialog?.type === "ceza_odendi" && "Gecikme cezasını ödendi olarak işaretlemek istediğinize emin misiniz?"}
                        </DialogDescription>
                    </DialogHeader>
                    {actionDialog?.type !== "ceza_odendi" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Not (isteğe bağlı)</label>
                            <Textarea
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                                placeholder="İşlemle ilgili not ekleyin..."
                                rows={3}
                            />
                        </div>
                    )}
                    {actionError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {actionError}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)} disabled={actionLoading}>
                            İptal
                        </Button>
                        <Button onClick={handleAction} disabled={actionLoading} className="gap-2">
                            {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Onayla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
