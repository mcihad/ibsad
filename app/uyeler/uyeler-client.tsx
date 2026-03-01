"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
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
import { Card, CardContent } from "@/components/ui/card";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Users,
    UserCheck,
    UserX,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface Uye {
    id: string;
    uuid: string;
    adi: string;
    soyadi: string;
    tcKimlikNo: string | null;
    kartNumarasi: string | null;
    eposta: string | null;
    telefon: string | null;
    adres: string | null;
    kayitTarihi: string;
    bitisTarihi: string | null;
    notlar: string | null;
    aktif: boolean;
    uyeTipiId: string;
    uyeTipi: { id: string; adi: string; maksimumKitap: number; oduncSuresi: number };
    kutuphaneId: string;
    kutuphane: { id: string; adi: string; kodu: string };
    _count: { oduncler: number };
    createdAt: string;
}

interface UyeTipi {
    id: string;
    adi: string;
    aktif: boolean;
}

interface Kutuphane {
    id: string;
    adi: string;
    kodu: string;
}

const emptyForm = {
    adi: "",
    soyadi: "",
    tcKimlikNo: "",
    kartNumarasi: "",
    eposta: "",
    telefon: "",
    adres: "",
    bitisTarihi: "",
    notlar: "",
    uyeTipiId: "",
    kutuphaneId: "",
};

export default function UyelerClient({ user }: { user: SessionUser }) {
    const [uyeler, setUyeler] = React.useState<Uye[]>([]);
    const [uyeTipleri, setUyeTipleri] = React.useState<UyeTipi[]>([]);
    const [kutuphaneler, setKutuphaneler] = React.useState<Kutuphane[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [filterUyeTipi, setFilterUyeTipi] = React.useState("");
    const [filterKutuphane, setFilterKutuphane] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [pageSize] = React.useState(50);
    const [total, setTotal] = React.useState(0);
    const [stats, setStats] = React.useState<Record<string, number>>({ total: 0, aktif: 0, pasif: 0 });
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<Uye | null>(null);
    const [deleting, setDeleting] = React.useState<Uye | null>(null);
    const [form, setForm] = React.useState(emptyForm);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");

    const isAdmin = user.role === "ADMIN";

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (filterUyeTipi && filterUyeTipi !== "all") params.set("uyeTipiId", filterUyeTipi);
            if (filterKutuphane && filterKutuphane !== "all") params.set("kutuphaneId", filterKutuphane);
            params.set("page", page.toString());
            params.set("pageSize", pageSize.toString());

            const [uyeRes, tipRes, kutRes] = await Promise.all([
                fetch(`/api/uyeler?${params}`),
                fetch("/api/uye-tipleri"),
                isAdmin ? fetch("/api/kutuphaneler") : Promise.resolve(null),
            ]);

            if (uyeRes.ok) {
                const result = await uyeRes.json();
                setUyeler(result.data);
                setTotal(result.total);
                if (result.stats) setStats(result.stats);
            }
            if (tipRes.ok) setUyeTipleri(await tipRes.json());
            if (kutRes && kutRes.ok) setKutuphaneler(await kutRes.json());
        } finally {
            setLoading(false);
        }
    }, [search, filterUyeTipi, filterKutuphane, page, pageSize, isAdmin]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page when filters change
    React.useEffect(() => {
        setPage(1);
    }, [search, filterUyeTipi, filterKutuphane]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const openCreate = () => {
        setEditing(null);
        setForm({
            ...emptyForm,
            kutuphaneId: user.kutuphaneId || "",
        });
        setError("");
        setDialogOpen(true);
    };

    const openEdit = (u: Uye) => {
        setEditing(u);
        setForm({
            adi: u.adi,
            soyadi: u.soyadi,
            tcKimlikNo: u.tcKimlikNo || "",
            kartNumarasi: u.kartNumarasi || "",
            eposta: u.eposta || "",
            telefon: u.telefon || "",
            adres: u.adres || "",
            bitisTarihi: u.bitisTarihi
                ? new Date(u.bitisTarihi).toISOString().split("T")[0]
                : "",
            notlar: u.notlar || "",
            uyeTipiId: u.uyeTipiId,
            kutuphaneId: u.kutuphaneId,
        });
        setError("");
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const url = editing ? `/api/uyeler/${editing.id}` : "/api/uyeler";
            const method = editing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Bir hata oluştu");
                return;
            }

            setDialogOpen(false);
            fetchData();
        } catch {
            setError("Bir hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/uyeler/${deleting.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setDeleteDialogOpen(false);
                setDeleting(null);
                fetchData();
            } else {
                const data = await res.json();
                setError(data.error || "Bir hata oluştu");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Üyeler</h1>
                        <p className="text-muted-foreground">
                            {isAdmin
                                ? "Tüm kütüphanelerdeki üyeleri yönetin"
                                : "Kütüphanenize kayıtlı üyeleri yönetin"}
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni Üye
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        { label: "Toplam Üye", value: stats.total || 0, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50", border: "border-blue-100 dark:border-blue-900/50" },
                        { label: "Aktif Üyeler", value: stats.aktif || 0, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50", border: "border-emerald-100 dark:border-emerald-900/50" },
                        { label: "Pasif Üyeler", value: stats.pasif || 0, icon: UserX, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/50", border: "border-rose-100 dark:border-rose-900/50" },
                    ].map((stat) => (
                        <Card key={stat.label} className={`border ${stat.border} ${stat.bg} shadow-none`}>
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <p className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value.toLocaleString("tr-TR")}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters & Table */}
                <Card>
                    <div className="border-b px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-base font-semibold">Üye Listesi</h3>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                {isAdmin && (
                                    <Select
                                        value={filterKutuphane}
                                        onValueChange={setFilterKutuphane}
                                    >
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Tüm Kütüphaneler" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tüm Kütüphaneler</SelectItem>
                                            {kutuphaneler.map((k) => (
                                                <SelectItem key={k.id} value={k.id}>
                                                    {k.adi}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Select
                                    value={filterUyeTipi}
                                    onValueChange={setFilterUyeTipi}
                                >
                                    <SelectTrigger className="w-full sm:w-44">
                                        <SelectValue placeholder="Tüm Tipler" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Tipler</SelectItem>
                                        {uyeTipleri.map((ut) => (
                                            <SelectItem key={ut.id} value={ut.id}>
                                                {ut.adi}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Ad, TC, kart no..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : uyeler.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                {search || filterUyeTipi || filterKutuphane
                                    ? "Arama sonucu bulunamadı"
                                    : "Henüz üye kaydı bulunmuyor"}
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ad Soyad</TableHead>
                                            <TableHead className="hidden md:table-cell">
                                                TC Kimlik No
                                            </TableHead>
                                            <TableHead className="hidden lg:table-cell">
                                                Kart No
                                            </TableHead>
                                            <TableHead>Üye Tipi</TableHead>
                                            {isAdmin && (
                                                <TableHead className="hidden md:table-cell">
                                                    Kütüphane
                                                </TableHead>
                                            )}
                                            <TableHead className="hidden sm:table-cell text-center">
                                                Ödünç
                                            </TableHead>
                                            <TableHead>Durum</TableHead>
                                            <TableHead className="text-right">İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {uyeler.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {u.adi} {u.soyadi}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground md:hidden">
                                                        {u.tcKimlikNo || "—"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden font-mono text-xs md:table-cell">
                                                    {u.tcKimlikNo || (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-xs">
                                                    {u.kartNumarasi || (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {u.uyeTipi.adi}
                                                    </Badge>
                                                </TableCell>
                                                {isAdmin && (
                                                    <TableCell className="hidden md:table-cell">
                                                        <span className="text-xs">
                                                            {u.kutuphane?.adi}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                <TableCell className="hidden sm:table-cell text-center">
                                                    {u._count.oduncler}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            u.aktif ? "default" : "secondary"
                                                        }
                                                    >
                                                        {u.aktif ? "Aktif" : "Pasif"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(u)}
                                                            className="h-8 w-8"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setDeleting(u);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                <div className="flex items-center justify-between border-t px-6 py-4">
                                    <p className="text-sm text-muted-foreground">
                                        Toplam <strong>{total.toLocaleString("tr-TR")}</strong> üye
                                        {total > pageSize && (
                                            <> &middot; Sayfa <strong>{page}</strong> / {totalPages}</>
                                        )}
                                    </p>
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPage(1)}
                                                disabled={page === 1}
                                            >
                                                <ChevronsLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum: number;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (page >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = page - 2 + i;
                                                }
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={page === pageNum ? "default" : "outline"}
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => setPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPage(totalPages)}
                                                disabled={page === totalPages}
                                            >
                                                <ChevronsRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Üye Düzenle" : "Yeni Üye"}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? "Üye bilgilerini güncelleyin"
                                : "Kütüphaneye yeni bir üye kaydedin"}
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="adi">Ad *</Label>
                            <Input
                                id="adi"
                                value={form.adi}
                                onChange={(e) =>
                                    setForm({ ...form, adi: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="soyadi">Soyad *</Label>
                            <Input
                                id="soyadi"
                                value={form.soyadi}
                                onChange={(e) =>
                                    setForm({ ...form, soyadi: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tcKimlikNo">TC Kimlik No</Label>
                            <Input
                                id="tcKimlikNo"
                                value={form.tcKimlikNo}
                                onChange={(e) =>
                                    setForm({ ...form, tcKimlikNo: e.target.value })
                                }
                                maxLength={11}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kartNumarasi">Kart Numarası</Label>
                            <Input
                                id="kartNumarasi"
                                value={form.kartNumarasi}
                                onChange={(e) =>
                                    setForm({ ...form, kartNumarasi: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="eposta">E-posta</Label>
                            <Input
                                id="eposta"
                                type="email"
                                value={form.eposta}
                                onChange={(e) =>
                                    setForm({ ...form, eposta: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telefon">Telefon</Label>
                            <Input
                                id="telefon"
                                value={form.telefon}
                                onChange={(e) =>
                                    setForm({ ...form, telefon: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Üye Tipi *</Label>
                            <Select
                                value={form.uyeTipiId}
                                onValueChange={(v) =>
                                    setForm({ ...form, uyeTipiId: v })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Üye tipi seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uyeTipleri
                                        .filter((ut) => ut.aktif)
                                        .map((ut) => (
                                            <SelectItem key={ut.id} value={ut.id}>
                                                {ut.adi}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {isAdmin && (
                            <div className="space-y-2">
                                <Label>Kütüphane *</Label>
                                <Select
                                    value={form.kutuphaneId}
                                    onValueChange={(v) =>
                                        setForm({ ...form, kutuphaneId: v })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kütüphane seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kutuphaneler.map((k) => (
                                            <SelectItem key={k.id} value={k.id}>
                                                {k.adi}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="bitisTarihi">
                                Üyelik Bitiş Tarihi
                            </Label>
                            <Input
                                id="bitisTarihi"
                                type="date"
                                value={form.bitisTarihi}
                                onChange={(e) =>
                                    setForm({ ...form, bitisTarihi: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="adres">Adres</Label>
                            <Textarea
                                id="adres"
                                value={form.adres}
                                onChange={(e) =>
                                    setForm({ ...form, adres: e.target.value })
                                }
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="notlar">Notlar</Label>
                            <Textarea
                                id="notlar"
                                value={form.notlar}
                                onChange={(e) =>
                                    setForm({ ...form, notlar: e.target.value })
                                }
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editing ? "Güncelle" : "Oluştur"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Üye Sil</DialogTitle>
                        <DialogDescription>
                            <strong>
                                {deleting?.adi} {deleting?.soyadi}
                            </strong>{" "}
                            üyesini silmek istediğinize emin misiniz? Bu işlem geri
                            alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setError("");
                            }}
                            disabled={saving}
                        >
                            İptal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={saving}
                            className="gap-2"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
