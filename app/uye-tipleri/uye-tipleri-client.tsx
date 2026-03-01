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
    Users,
    BookOpen,
    Clock,
    Loader2,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface UyeTipi {
    id: string;
    adi: string;
    aciklama: string | null;
    maksimumKitap: number;
    oduncSuresi: number;
    gunlukCeza: string;
    aktif: boolean;
    createdAt: string;
    _count: { uyeler: number };
}

const emptyForm = {
    adi: "",
    aciklama: "",
    maksimumKitap: "3",
    oduncSuresi: "15",
    gunlukCeza: "1.00",
};

export default function UyeTipleriClient({ user }: { user: SessionUser }) {
    const [uyeTipleri, setUyeTipleri] = React.useState<UyeTipi[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<UyeTipi | null>(null);
    const [deleting, setDeleting] = React.useState<UyeTipi | null>(null);
    const [form, setForm] = React.useState(emptyForm);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");

    const isAdmin = user.role === "ADMIN";

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);

            const res = await fetch(`/api/uye-tipleri?${params}`);
            if (res.ok) setUyeTipleri(await res.json());
        } finally {
            setLoading(false);
        }
    }, [search]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setError("");
        setDialogOpen(true);
    };

    const openEdit = (ut: UyeTipi) => {
        setEditing(ut);
        setForm({
            adi: ut.adi,
            aciklama: ut.aciklama || "",
            maksimumKitap: ut.maksimumKitap.toString(),
            oduncSuresi: ut.oduncSuresi.toString(),
            gunlukCeza: ut.gunlukCeza,
        });
        setError("");
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const url = editing
                ? `/api/uye-tipleri/${editing.id}`
                : "/api/uye-tipleri";
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
            const res = await fetch(`/api/uye-tipleri/${deleting.id}`, {
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

    const stats = {
        total: uyeTipleri.length,
        aktif: uyeTipleri.filter((ut) => ut.aktif).length,
        toplamUye: uyeTipleri.reduce((sum, ut) => sum + ut._count.uyeler, 0),
    };

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Üye Tipleri
                        </h1>
                        <p className="text-muted-foreground">
                            Üye tiplerini ve ödünç verme kurallarını yönetin
                        </p>
                    </div>
                    {isAdmin && (
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Yeni Üye Tipi
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Toplam Tip
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Aktif Tipler
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.aktif}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Toplam Üye
                            </CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.toplamUye}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>Üye Tipi Listesi</CardTitle>
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
                        ) : uyeTipleri.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                {search
                                    ? "Arama sonucu bulunamadı"
                                    : "Henüz üye tipi eklenmemiş"}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tip Adı</TableHead>
                                        <TableHead className="hidden md:table-cell">
                                            Açıklama
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Maks. Kitap
                                        </TableHead>
                                        <TableHead className="hidden sm:table-cell text-center">
                                            Ödünç Süresi
                                        </TableHead>
                                        <TableHead className="hidden lg:table-cell text-center">
                                            Günlük Ceza
                                        </TableHead>
                                        <TableHead className="text-center">Üye Sayısı</TableHead>
                                        <TableHead>Durum</TableHead>
                                        {isAdmin && (
                                            <TableHead className="text-right">
                                                İşlemler
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {uyeTipleri.map((ut) => (
                                        <TableRow key={ut.id}>
                                            <TableCell>
                                                <div className="font-medium">{ut.adi}</div>
                                            </TableCell>
                                            <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                                                {ut.aciklama || (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {ut.maksimumKitap}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-center">
                                                {ut.oduncSuresi} gün
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-center">
                                                ₺{parseFloat(ut.gunlukCeza).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {ut._count.uyeler}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        ut.aktif ? "default" : "secondary"
                                                    }
                                                >
                                                    {ut.aktif ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(ut)}
                                                            className="h-8 w-8"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setDeleting(ut);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
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
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Üye Tipi Düzenle" : "Yeni Üye Tipi"}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? "Üye tipi bilgilerini güncelleyin"
                                : "Yeni bir üye tipi tanımlayın"}
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="adi">Tip Adı *</Label>
                            <Input
                                id="adi"
                                value={form.adi}
                                onChange={(e) =>
                                    setForm({ ...form, adi: e.target.value })
                                }
                                placeholder="Örn: Öğrenci, Akademisyen"
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
                        <div className="space-y-2">
                            <Label htmlFor="maksimumKitap">Maksimum Kitap</Label>
                            <Input
                                id="maksimumKitap"
                                type="number"
                                min="1"
                                value={form.maksimumKitap}
                                onChange={(e) =>
                                    setForm({ ...form, maksimumKitap: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="oduncSuresi">
                                Ödünç Süresi (gün)
                            </Label>
                            <Input
                                id="oduncSuresi"
                                type="number"
                                min="1"
                                value={form.oduncSuresi}
                                onChange={(e) =>
                                    setForm({ ...form, oduncSuresi: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gunlukCeza">
                                Günlük Ceza (₺)
                            </Label>
                            <Input
                                id="gunlukCeza"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.gunlukCeza}
                                onChange={(e) =>
                                    setForm({ ...form, gunlukCeza: e.target.value })
                                }
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
                        <DialogTitle>Üye Tipi Sil</DialogTitle>
                        <DialogDescription>
                            <strong>{deleting?.adi}</strong> üye tipini silmek
                            istediğinize emin misiniz? Bu işlem geri alınamaz.
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
