"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Users,
    Shield,
    BookOpen,
    UserCog,
    Loader2,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface User {
    id: string;
    tcKimlikNo: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    gender: string | null;
    department: string | null;
    title: string | null;
    role: string;
    isActive: boolean;
    kutuphaneId: string | null;
    kutuphane: { id: string; adi: string } | null;
    createdAt: string;
    lastLoginAt: string | null;
}

interface Kutuphane {
    id: string;
    adi: string;
    kodu: string;
}

const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    KUTUPHANECI: "Kütüphaneci",
    MEMUR: "Memur",
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
    ADMIN: "default",
    KUTUPHANECI: "secondary",
    MEMUR: "outline",
};

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    ADMIN: Shield,
    KUTUPHANECI: BookOpen,
    MEMUR: UserCog,
};

const emptyForm = {
    tcKimlikNo: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    department: "",
    title: "",
    role: "MEMUR",
    kutuphaneId: "",
};

export default function KullanicilarClient({ user }: { user: SessionUser }) {
    const [users, setUsers] = React.useState<User[]>([]);
    const [kutuphaneler, setKutuphaneler] = React.useState<Kutuphane[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [deletingUser, setDeletingUser] = React.useState<User | null>(null);
    const [form, setForm] = React.useState(emptyForm);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, kutRes] = await Promise.all([
                fetch("/api/kullanicilar"),
                fetch("/api/kutuphaneler"),
            ]);
            if (usersRes.ok) setUsers(await usersRes.json());
            if (kutRes.ok) setKutuphaneler(await kutRes.json());
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredUsers = users.filter((u) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            u.firstName.toLowerCase().includes(s) ||
            u.lastName.toLowerCase().includes(s) ||
            u.email.toLowerCase().includes(s) ||
            u.tcKimlikNo.includes(s) ||
            (u.department && u.department.toLowerCase().includes(s))
        );
    });

    const openCreate = () => {
        setEditingUser(null);
        setForm(emptyForm);
        setError("");
        setDialogOpen(true);
    };

    const openEdit = (u: User) => {
        setEditingUser(u);
        setForm({
            tcKimlikNo: u.tcKimlikNo,
            email: u.email,
            password: "",
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone || "",
            gender: u.gender || "",
            department: u.department || "",
            title: u.title || "",
            role: u.role,
            kutuphaneId: u.kutuphaneId || "",
        });
        setError("");
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const url = editingUser
                ? `/api/kullanicilar/${editingUser.id}`
                : "/api/kullanicilar";
            const method = editingUser ? "PUT" : "POST";

            const body: Record<string, unknown> = { ...form };
            if (!body.kutuphaneId) body.kutuphaneId = null;
            if (!body.gender) body.gender = null;
            if (editingUser && !body.password) delete body.password;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
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
        if (!deletingUser) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/kullanicilar/${deletingUser.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setDeleteDialogOpen(false);
                setDeletingUser(null);
                fetchData();
            }
        } finally {
            setSaving(false);
        }
    };

    const stats = {
        total: users.length,
        admin: users.filter((u) => u.role === "ADMIN").length,
        kutuphaneci: users.filter((u) => u.role === "KUTUPHANECI").length,
        memur: users.filter((u) => u.role === "MEMUR").length,
    };

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Kullanıcılar</h1>
                        <p className="text-muted-foreground">
                            Sistem kullanıcılarını yönetin
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni Kullanıcı
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Admin</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.admin}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kütüphaneci</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.kutuphaneci}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Memur</CardTitle>
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.memur}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>Kullanıcı Listesi</CardTitle>
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
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                {search ? "Arama sonucu bulunamadı" : "Henüz kullanıcı yok"}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ad Soyad</TableHead>
                                        <TableHead className="hidden md:table-cell">E-posta</TableHead>
                                        <TableHead className="hidden lg:table-cell">TC Kimlik</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead className="hidden lg:table-cell">Kütüphane</TableHead>
                                        <TableHead className="hidden md:table-cell">Durum</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((u) => {
                                        const RoleIcon = roleIcons[u.role] || UserCog;
                                        return (
                                            <TableRow key={u.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {u.firstName} {u.lastName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground md:hidden">
                                                        {u.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {u.email}
                                                </TableCell>
                                                <TableCell className="hidden font-mono text-xs lg:table-cell">
                                                    {u.tcKimlikNo}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={roleBadgeVariants[u.role]}
                                                        className="gap-1"
                                                    >
                                                        <RoleIcon className="h-3 w-3" />
                                                        {roleLabels[u.role]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {u.kutuphane?.adi || (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge
                                                        variant={u.isActive ? "default" : "destructive"}
                                                        className="text-[10px]"
                                                    >
                                                        {u.isActive ? "Aktif" : "Pasif"}
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
                                                                setDeletingUser(u);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            disabled={u.id === user.id}
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
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
                            {editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Kullanıcı bilgilerini güncelleyin"
                                : "Yeni bir kullanıcı oluşturun"}
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Ad *</Label>
                            <Input
                                id="firstName"
                                value={form.firstName}
                                onChange={(e) =>
                                    setForm({ ...form, firstName: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Soyad *</Label>
                            <Input
                                id="lastName"
                                value={form.lastName}
                                onChange={(e) =>
                                    setForm({ ...form, lastName: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tcKimlikNo">TC Kimlik No *</Label>
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
                            <Label htmlFor="email">E-posta *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Şifre {editingUser ? "(boş bırakırsa değişmez)" : "*"}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({ ...form, password: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input
                                id="phone"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Cinsiyet</Label>
                            <Select
                                value={form.gender}
                                onValueChange={(v) => setForm({ ...form, gender: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ERKEK">Erkek</SelectItem>
                                    <SelectItem value="KADIN">Kadın</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Rol *</Label>
                            <Select
                                value={form.role}
                                onValueChange={(v) => setForm({ ...form, role: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="KUTUPHANECI">Kütüphaneci</SelectItem>
                                    <SelectItem value="MEMUR">Memur</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Departman</Label>
                            <Input
                                id="department"
                                value={form.department}
                                onChange={(e) =>
                                    setForm({ ...form, department: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Ünvan</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Kütüphane</Label>
                            <Select
                                value={form.kutuphaneId}
                                onValueChange={(v) => setForm({ ...form, kutuphaneId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seçiniz (opsiyonel)" />
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
                            {editingUser ? "Güncelle" : "Oluştur"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kullanıcı Sil</DialogTitle>
                        <DialogDescription>
                            <strong>
                                {deletingUser?.firstName} {deletingUser?.lastName}
                            </strong>{" "}
                            adlı kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri
                            alınamaz.
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
