"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    BookOpen,
    Pencil,
    Loader2,
    BookText,
    Barcode,
    Hash,
    Building2,
    Globe,
    Calendar,
    FileText,
    StickyNote,
    Users,
    Library,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Ban,
    Search as SearchIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface Kitap {
    id: string;
    isbn: string | null;
    baslik: string;
    demirbasNo: string | null;
    barkod: string | null;
    yayinevi: string | null;
    dil: string | null;
    yayinYili: number | null;
    sayfaSayisi: number | null;
    durum: string;
    fizikselDurum: string;
    ozet: string | null;
    notlar: string | null;
    yazarlar: string | null;
    aktif: boolean;
    kutuphaneId: string;
    kutuphane: { id: string; adi: string; kodu: string };
    createdAt: string;
}

interface Kutuphane {
    id: string;
    adi: string;
    kodu: string;
}

interface OduncKaydi {
    id: string;
    oduncTarihi: string;
    sonIadeTarihi: string;
    iadeTarihi: string | null;
    uzatmaSayisi: number;
    durum: string;
    gecikmeCezasi: string | null;
    cezaOdendi: boolean;
    notlar: string | null;
    uye: { id: string; adi: string; soyadi: string; kartNumarasi: string | null };
    olusturan: { id: string; firstName: string; lastName: string } | null;
}

interface BenzerKitap {
    id: string;
    baslik: string;
    yazarlar: string | null;
    yayinYili: number | null;
    durum: string;
    isbn: string | null;
}

const durumLabels: Record<string, string> = {
    MEVCUT: "Mevcut",
    ODUNC: "Ödünç",
    KAYIP: "Kayıp",
    HASARLI: "Hasarlı",
    AYIKLANDI: "Ayıklandı",
};

const durumColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    MEVCUT: "default",
    ODUNC: "secondary",
    KAYIP: "destructive",
    HASARLI: "destructive",
    AYIKLANDI: "outline",
};

const fizikselDurumLabels: Record<string, string> = {
    MUKEMMEL: "Mükemmel",
    COK_IYI: "Çok İyi",
    IYI: "İyi",
    ORTA: "Orta",
    KOTU: "Kötü",
};

const oduncDurumLabels: Record<string, string> = {
    AKTIF: "Aktif",
    IADE_EDILDI: "İade Edildi",
    GECIKMIS: "Gecikmiş",
    KAYIP: "Kayıp",
    IPTAL: "İptal",
};

const oduncDurumIcons: Record<string, React.ElementType> = {
    AKTIF: Clock,
    IADE_EDILDI: CheckCircle2,
    GECIKMIS: AlertTriangle,
    KAYIP: SearchIcon,
    IPTAL: Ban,
};

const oduncDurumColors: Record<string, string> = {
    AKTIF: "text-blue-600 dark:text-blue-400",
    IADE_EDILDI: "text-emerald-600 dark:text-emerald-400",
    GECIKMIS: "text-amber-600 dark:text-amber-400",
    KAYIP: "text-rose-600 dark:text-rose-400",
    IPTAL: "text-gray-500 dark:text-gray-400",
};

type TabKey = "oduncler" | "benzerYayinevi" | "benzerYazar";

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value || <span className="text-muted-foreground">—</span>}</p>
            </div>
        </div>
    );
}

export default function KitapDetayClient({ user, kitapId }: { user: SessionUser; kitapId: string }) {
    const router = useRouter();
    const [kitap, setKitap] = React.useState<Kitap | null>(null);
    const [kutuphaneler, setKutuphaneler] = React.useState<Kutuphane[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    // Tab state
    const [activeTab, setActiveTab] = React.useState<TabKey>("oduncler");
    const [tabData, setTabData] = React.useState<Record<string, unknown[]>>({});
    const [tabLoading, setTabLoading] = React.useState<Record<string, boolean>>({});
    const [tabLoaded, setTabLoaded] = React.useState<Record<string, boolean>>({});

    // Edit dialog
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [form, setForm] = React.useState({
        isbn: "", baslik: "", demirbasNo: "", barkod: "", yayinevi: "", dil: "",
        yayinYili: "", sayfaSayisi: "", durum: "MEVCUT", fizikselDurum: "IYI",
        ozet: "", notlar: "", yazarlar: "", kutuphaneId: "",
    });
    const [saving, setSaving] = React.useState(false);
    const [saveError, setSaveError] = React.useState("");

    // Fetch book data
    React.useEffect(() => {
        const fetchBook = async () => {
            setLoading(true);
            try {
                const [kitapRes, kutRes] = await Promise.all([
                    fetch(`/api/kitaplar/${kitapId}`),
                    user.role === "ADMIN" ? fetch("/api/kutuphaneler") : Promise.resolve(null),
                ]);

                if (!kitapRes.ok) {
                    setError("Kitap bulunamadı");
                    return;
                }
                const data = await kitapRes.json();
                setKitap(data);

                if (kutRes && kutRes.ok) {
                    setKutuphaneler(await kutRes.json());
                }
            } catch {
                setError("Bir hata oluştu");
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [kitapId, user.role]);

    // Lazy load tab data
    const loadTab = React.useCallback(async (tab: TabKey) => {
        if (tabLoaded[tab] || tabLoading[tab]) return;

        setTabLoading((prev) => ({ ...prev, [tab]: true }));
        try {
            const res = await fetch(`/api/kitaplar/${kitapId}?include=${tab}`);
            if (res.ok) {
                const data = await res.json();
                setTabData((prev) => ({ ...prev, [tab]: data }));
                setTabLoaded((prev) => ({ ...prev, [tab]: true }));
            }
        } finally {
            setTabLoading((prev) => ({ ...prev, [tab]: false }));
        }
    }, [kitapId, tabLoaded, tabLoading]);

    // Load first tab on mount
    React.useEffect(() => {
        if (kitap) loadTab("oduncler");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kitap]);

    // Load tab data when switching
    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        loadTab(tab);
    };

    const openEditDialog = () => {
        if (!kitap) return;
        setForm({
            isbn: kitap.isbn || "",
            baslik: kitap.baslik,
            demirbasNo: kitap.demirbasNo || "",
            barkod: kitap.barkod || "",
            yayinevi: kitap.yayinevi || "",
            dil: kitap.dil || "",
            yayinYili: kitap.yayinYili?.toString() || "",
            sayfaSayisi: kitap.sayfaSayisi?.toString() || "",
            durum: kitap.durum,
            fizikselDurum: kitap.fizikselDurum,
            ozet: kitap.ozet || "",
            notlar: kitap.notlar || "",
            yazarlar: kitap.yazarlar || "",
            kutuphaneId: kitap.kutuphaneId,
        });
        setSaveError("");
        setEditDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError("");
        try {
            const res = await fetch(`/api/kitaplar/${kitapId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                setSaveError(data.error || "Bir hata oluştu");
                return;
            }

            const updated = await res.json();
            // Refetch full book data with kutuphane
            const fullRes = await fetch(`/api/kitaplar/${kitapId}`);
            if (fullRes.ok) {
                setKitap(await fullRes.json());
            } else {
                setKitap({ ...kitap!, ...updated });
            }
            setEditDialogOpen(false);
            // Reset similar book cache since data might have changed
            setTabLoaded({});
            setTabData({});
        } catch {
            setSaveError("Bir hata oluştu");
        } finally {
            setSaving(false);
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

    if (error || !kitap) {
        return (
            <DashboardLayout user={user}>
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                    <XCircle className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">{error || "Kitap bulunamadı"}</p>
                    <Button variant="outline" onClick={() => router.push("/kitaplar")} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Kitaplara Dön
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const oduncler = (tabData.oduncler || []) as OduncKaydi[];
    const benzerYayinevi = (tabData.benzerYayinevi || []) as BenzerKitap[];
    const benzerYazar = (tabData.benzerYazar || []) as BenzerKitap[];

    const tabs: { key: TabKey; label: string; count?: number }[] = [
        { key: "oduncler", label: "Ödünç Geçmişi", count: tabLoaded.oduncler ? oduncler.length : undefined },
        { key: "benzerYayinevi", label: "Aynı Yayınevi", count: tabLoaded.benzerYayinevi ? benzerYayinevi.length : undefined },
        { key: "benzerYazar", label: "Aynı Yazar", count: tabLoaded.benzerYazar ? benzerYazar.length : undefined },
    ];

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/kitaplar")} className="shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{kitap.baslik}</h1>
                            <p className="text-sm text-muted-foreground">
                                {kitap.yazarlar || "Bilinmeyen yazar"} &middot; {kitap.kutuphane?.adi}
                            </p>
                        </div>
                    </div>
                    {user.role !== "MEMUR" && (
                        <Button onClick={openEditDialog} className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Düzenle
                        </Button>
                    )}
                </div>

                {/* Book Identity Card */}
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Main Info */}
                    <Card className="lg:col-span-3">
                        <CardContent className="p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold">Kitap Kimliği</h2>
                                    <p className="text-xs text-muted-foreground">Temel bilgiler</p>
                                </div>
                                <Badge variant={durumColors[kitap.durum]} className="ml-auto">
                                    {durumLabels[kitap.durum]}
                                </Badge>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <InfoItem icon={BookText} label="Başlık" value={kitap.baslik} />
                                <InfoItem icon={Users} label="Yazarlar" value={kitap.yazarlar} />
                                <InfoItem icon={Barcode} label="ISBN" value={kitap.isbn} />
                                <InfoItem icon={Hash} label="Demirbaş No" value={kitap.demirbasNo} />
                                <InfoItem icon={Barcode} label="Barkod" value={kitap.barkod} />
                                <InfoItem icon={Building2} label="Yayınevi" value={kitap.yayinevi} />
                                <InfoItem icon={Globe} label="Dil" value={kitap.dil} />
                                <InfoItem icon={Calendar} label="Yayın Yılı" value={kitap.yayinYili?.toString()} />
                                <InfoItem icon={FileText} label="Sayfa Sayısı" value={kitap.sayfaSayisi?.toString()} />
                                <InfoItem icon={Library} label="Kütüphane" value={kitap.kutuphane?.adi} />
                                <InfoItem icon={BookOpen} label="Fiziksel Durum" value={fizikselDurumLabels[kitap.fizikselDurum]} />
                                <InfoItem icon={Calendar} label="Kayıt Tarihi" value={new Date(kitap.createdAt).toLocaleDateString("tr-TR")} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary & Notes */}
                    <Card className="lg:col-span-2">
                        <CardContent className="p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                                    <StickyNote className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold">Özet & Notlar</h2>
                                    <p className="text-xs text-muted-foreground">Açıklama bilgileri</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Özet</p>
                                    <p className="text-sm leading-relaxed text-foreground/80">
                                        {kitap.ozet || <span className="italic text-muted-foreground">Özet bilgisi eklenmemiş</span>}
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Notlar</p>
                                    <p className="text-sm leading-relaxed text-foreground/80">
                                        {kitap.notlar || <span className="italic text-muted-foreground">Not eklenmemiş</span>}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Section */}
                <Card>
                    <CardContent className="p-0">
                        {/* Pills Tabs */}
                        <div className="border-b px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.key
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        {tab.label}
                                        {tab.count !== undefined && (
                                            <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${activeTab === tab.key
                                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                                    : "bg-background text-muted-foreground"
                                                }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {tabLoading[activeTab] ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : activeTab === "oduncler" ? (
                                <OdunclerTab oduncler={oduncler} />
                            ) : activeTab === "benzerYayinevi" ? (
                                <BenzerKitaplarTab kitaplar={benzerYayinevi} label="yayınevi" yayinevi={kitap.yayinevi} />
                            ) : activeTab === "benzerYazar" ? (
                                <BenzerKitaplarTab kitaplar={benzerYazar} label="yazar" yazar={kitap.yazarlar} />
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Kitap Düzenle</DialogTitle>
                        <DialogDescription>Kitap bilgilerini güncelleyin</DialogDescription>
                    </DialogHeader>

                    {saveError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {saveError}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="edit-baslik">Kitap Başlığı *</Label>
                            <Input id="edit-baslik" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="edit-yazarlar">Yazarlar</Label>
                            <Input id="edit-yazarlar" value={form.yazarlar} onChange={(e) => setForm({ ...form, yazarlar: e.target.value })} placeholder="Virgülle ayırarak yazınız" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-isbn">ISBN</Label>
                            <Input id="edit-isbn" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-barkod">Barkod</Label>
                            <Input id="edit-barkod" value={form.barkod} onChange={(e) => setForm({ ...form, barkod: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-demirbasNo">Demirbaş No</Label>
                            <Input id="edit-demirbasNo" value={form.demirbasNo} onChange={(e) => setForm({ ...form, demirbasNo: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-yayinevi">Yayınevi</Label>
                            <Input id="edit-yayinevi" value={form.yayinevi} onChange={(e) => setForm({ ...form, yayinevi: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-dil">Dil</Label>
                            <Input id="edit-dil" value={form.dil} onChange={(e) => setForm({ ...form, dil: e.target.value })} placeholder="Örn: Türkçe" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-yayinYili">Yayın Yılı</Label>
                            <Input id="edit-yayinYili" type="number" value={form.yayinYili} onChange={(e) => setForm({ ...form, yayinYili: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-sayfaSayisi">Sayfa Sayısı</Label>
                            <Input id="edit-sayfaSayisi" type="number" value={form.sayfaSayisi} onChange={(e) => setForm({ ...form, sayfaSayisi: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Durum</Label>
                            <Select value={form.durum} onValueChange={(v) => setForm({ ...form, durum: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MEVCUT">Mevcut</SelectItem>
                                    <SelectItem value="ODUNC">Ödünç</SelectItem>
                                    <SelectItem value="KAYIP">Kayıp</SelectItem>
                                    <SelectItem value="HASARLI">Hasarlı</SelectItem>
                                    <SelectItem value="AYIKLANDI">Ayıklandı</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Fiziksel Durum</Label>
                            <Select value={form.fizikselDurum} onValueChange={(v) => setForm({ ...form, fizikselDurum: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MUKEMMEL">Mükemmel</SelectItem>
                                    <SelectItem value="COK_IYI">Çok İyi</SelectItem>
                                    <SelectItem value="IYI">İyi</SelectItem>
                                    <SelectItem value="ORTA">Orta</SelectItem>
                                    <SelectItem value="KOTU">Kötü</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {user.role === "ADMIN" && (
                            <div className="space-y-2">
                                <Label>Kütüphane *</Label>
                                <Select value={form.kutuphaneId} onValueChange={(v) => setForm({ ...form, kutuphaneId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Kütüphane seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {kutuphaneler.map((k) => (
                                            <SelectItem key={k.id} value={k.id}>{k.adi}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="edit-ozet">Özet</Label>
                            <Textarea id="edit-ozet" value={form.ozet} onChange={(e) => setForm({ ...form, ozet: e.target.value })} rows={3} />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="edit-notlar">Notlar</Label>
                            <Textarea id="edit-notlar" value={form.notlar} onChange={(e) => setForm({ ...form, notlar: e.target.value })} rows={2} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                            İptal
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Güncelle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

// --- Sub-components ---

function OdunclerTab({ oduncler }: { oduncler: OduncKaydi[] }) {
    if (oduncler.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="mb-3 h-10 w-10" />
                <p>Bu kitap için ödünç kaydı bulunmuyor</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Üye</TableHead>
                    <TableHead>Ödünç Tarihi</TableHead>
                    <TableHead className="hidden md:table-cell">Son İade</TableHead>
                    <TableHead className="hidden md:table-cell">İade Tarihi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="hidden lg:table-cell">Ceza</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {oduncler.map((o) => {
                    const DurumIcon = oduncDurumIcons[o.durum] || Clock;
                    return (
                        <TableRow key={o.id}>
                            <TableCell>
                                <div className="font-medium text-sm">{o.uye.adi} {o.uye.soyadi}</div>
                                {o.uye.kartNumarasi && (
                                    <div className="text-xs text-muted-foreground">{o.uye.kartNumarasi}</div>
                                )}
                            </TableCell>
                            <TableCell className="text-sm">
                                {new Date(o.oduncTarihi).toLocaleDateString("tr-TR")}
                            </TableCell>
                            <TableCell className="hidden text-sm md:table-cell">
                                {new Date(o.sonIadeTarihi).toLocaleDateString("tr-TR")}
                            </TableCell>
                            <TableCell className="hidden text-sm md:table-cell">
                                {o.iadeTarihi ? new Date(o.iadeTarihi).toLocaleDateString("tr-TR") : "—"}
                            </TableCell>
                            <TableCell>
                                <div className={`flex items-center gap-1.5 text-sm font-medium ${oduncDurumColors[o.durum]}`}>
                                    <DurumIcon className="h-3.5 w-3.5" />
                                    {oduncDurumLabels[o.durum]}
                                </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                                {o.gecikmeCezasi ? (
                                    <span className={o.cezaOdendi ? "text-emerald-600" : "text-rose-600"}>
                                        ₺{parseFloat(o.gecikmeCezasi).toFixed(2)}
                                        {o.cezaOdendi && " ✓"}
                                    </span>
                                ) : "—"}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function BenzerKitaplarTab({
    kitaplar,
    label,
    yayinevi,
    yazar,
}: {
    kitaplar: BenzerKitap[];
    label: string;
    yayinevi?: string | null;
    yazar?: string | null;
}) {
    if (kitaplar.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookOpen className="mb-3 h-10 w-10" />
                <p>Aynı {label} ile eşleşen başka kitap bulunamadı</p>
                {label === "yayınevi" && yayinevi && (
                    <p className="mt-1 text-xs">{yayinevi}</p>
                )}
                {label === "yazar" && yazar && (
                    <p className="mt-1 text-xs">{yazar}</p>
                )}
            </div>
        );
    }

    return (
        <div>
            <p className="mb-4 text-sm text-muted-foreground">
                {label === "yayınevi" && yayinevi && <>
                    <strong>{yayinevi}</strong> yayınevinden {kitaplar.length} kitap
                </>}
                {label === "yazar" && yazar && <>
                    <strong>{yazar}</strong> yazarından {kitaplar.length} kitap
                </>}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
                {kitaplar.map((k) => (
                    <Link
                        key={k.id}
                        href={`/kitaplar/${k.id}`}
                        className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight group-hover:text-primary">
                                {k.baslik}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {k.yazarlar || "Bilinmeyen yazar"}
                                {k.yayinYili && <> &middot; {k.yayinYili}</>}
                            </p>
                        </div>
                        <Badge variant={durumColors[k.durum]} className="shrink-0 text-[10px]">
                            {durumLabels[k.durum]}
                        </Badge>
                    </Link>
                ))}
            </div>
        </div>
    );
}
