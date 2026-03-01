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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Library,
    BookOpen,
    Users,
    Loader2,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface Kutuphane {
    id: string;
    adi: string;
    kodu: string;
    aciklama: string | null;
    adres: string | null;
    telefon: string | null;
    eposta: string | null;
    webSitesi: string | null;
    aktif: boolean;
    _count: { users: number; kitaplar: number };
    createdAt: string;
}

const emptyForm = {
    adi: "",
    kodu: "",
    aciklama: "",
    adres: "",
    telefon: "",
    eposta: "",
    webSitesi: "",
};

export default function KutuphanelerClient({ user }: { user: SessionUser }) {
    const [kutuphaneler, setKutuphaneler] = React.useState<Kutuphane[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<Kutuphane | null>(null);
    const [deleting, setDeleting] = React.useState<Kutuphane | null>(null);
    const [form, setForm] = React.useState(emptyForm);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/kutuphaneler");
            if (res.ok) setKutuphaneler(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filtered = kutuphaneler.filter((k) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            k.adi.toLowerCase().includes(s) ||
            k.kodu.toLowerCase().includes(s) ||
            (k.adres && k.adres.toLowerCase().includes(s))
        );
    });

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setError("");
        setDialogOpen(true);
    };

    const openEdit = (k: Kutuphane) => {
        setEditing(k);
        setForm({
            adi: k.adi,
            kodu: k.kodu,
            aciklama: k.aciklama || "",
            adres: k.adres || "",
            telefon: k.telefon || "",
            eposta: k.eposta || "",
            webSitesi: k.webSitesi || "",
        });
        setError("");
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const url = editing
                ? `/api/kutuphaneler/${editing.id}`
                : "/api/kutuphaneler";
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
        try {
            const res = await fetch(`/api/kutuphaneler/${deleting.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setDeleteDialogOpen(false);
                setDeleting(null);
                fetchData();
            }
        } finally {
            setSaving(false);
        }
    };

    const totalBooks = kutuphaneler.reduce(
        (acc, k) => acc + (k._count?.kitaplar || 0),
        0
    );
    const totalUsers = kutuphaneler.reduce(
        (acc, k) => acc + (k._count?.users || 0),
        0
    );

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Kütüphaneler</h1>
                        <p className="text-muted-foreground">
                            Kütüphane şubelerini yönetin
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni Kütüphane
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Toplam Kütüphane
                            </CardTitle>
                            <Library className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kutuphaneler.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Toplam Kitap
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalBooks}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Atanmış Personel
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalUsers}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>Kütüphane Listesi</CardTitle>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Ara..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                {search
                                    ? "Arama sonucu bulunamadı"
                                    : "Henüz kütüphane eklenmemiş"}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kütüphane Adı</TableHead>
                                        <TableHead className="hidden md:table-cell">Kodu</TableHead>
                                        <TableHead className="hidden lg:table-cell">Adres</TableHead>
                                        <TableHead className="hidden md:table-cell">Telefon</TableHead>
                                        <TableHead className="text-center">Kitap</TableHead>
                                        <TableHead className="text-center">Personel</TableHead>
                                        <TableHead className="hidden md:table-cell">Durum</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((k) => (
                                        <TableRow key={k.id}>
                                            <TableCell>
                                                <div className="font-medium">{k.adi}</div>
                                                <div className="text-xs text-muted-foreground md:hidden">
                                                    {k.kodu}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden font-mono text-xs md:table-cell">
                                                {k.kodu}
                                            </TableCell>
                                            <TableCell className="hidden max-w-[200px] truncate lg:table-cell">
                                                {k.adres || (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {k.telefon || (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">
                                                    {k._count?.kitaplar || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">
                                                    {k._count?.users || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge
                                                    variant={k.aktif ? "default" : "destructive"}
                                                    className="text-[10px]"
                                                >
                                                    {k.aktif ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEdit(k)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setDeleting(k);
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
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Kütüphane Düzenle" : "Yeni Kütüphane"}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? "Kütüphane bilgilerini güncelleyin"
                                : "Yeni bir kütüphane şubesi oluşturun"}
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="adi">Kütüphane Adı *</Label>
                            <Input
                                id="adi"
                                value={form.adi}
                                onChange={(e) => setForm({ ...form, adi: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kodu">Kodu *</Label>
                            <Input
                                id="kodu"
                                value={form.kodu}
                                onChange={(e) =>
                                    setForm({ ...form, kodu: e.target.value.toUpperCase() })
                                }
                                placeholder="Örn: KUT001"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telefon">Telefon</Label>
                            <Input
                                id="telefon"
                                value={form.telefon}
                                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="eposta">E-posta</Label>
                            <Input
                                id="eposta"
                                type="email"
                                value={form.eposta}
                                onChange={(e) => setForm({ ...form, eposta: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="webSitesi">Web Sitesi</Label>
                            <Input
                                id="webSitesi"
                                value={form.webSitesi}
                                onChange={(e) =>
                                    setForm({ ...form, webSitesi: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="adres">Adres</Label>
                            <Textarea
                                id="adres"
                                value={form.adres}
                                onChange={(e) => setForm({ ...form, adres: e.target.value })}
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="aciklama">Açıklama</Label>
                            <Textarea
                                id="aciklama"
                                value={form.aciklama}
                                onChange={(e) =>
                                    setForm({ ...form, aciklama: e.target.value })
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
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
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
                        <DialogTitle>Kütüphane Sil</DialogTitle>
                        <DialogDescription>
                            <strong>{deleting?.adi}</strong> kütüphanesini silmek
                            istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
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
