"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    User,
    Mail,
    Phone,
    Shield,
    Building2,
    Calendar,
    Lock,
    Save,
    Loader2,
    CheckCircle2,
    Eye,
    EyeOff,
    IdCard,
    Briefcase,
    KeyRound,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface UserData {
    id: string;
    tcKimlikNo: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    gender: string | null;
    birthDate: string | null;
    department: string | null;
    title: string | null;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    kutuphane: { id: string; adi: string; kodu: string } | null;
}

const roleBadge: Record<string, { label: string; color: string; bg: string }> = {
    ADMIN: { label: "Admin", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/40" },
    KUTUPHANECI: { label: "Kütüphaneci", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/40" },
    MEMUR: { label: "Memur", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
};

function InfoItem({ icon: Icon, label, value, badge }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; badge?: { color: string; bg: string } }) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{label}</p>
                {badge ? (
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium mt-0.5", badge.color, badge.bg)}>
                        {value}
                    </span>
                ) : (
                    <p className="text-sm font-medium truncate">{value}</p>
                )}
            </div>
        </div>
    );
}

const inputClass = "flex h-10 w-full rounded-lg border border-border/60 bg-muted/30 pl-10 pr-4 text-sm transition-all placeholder:text-muted-foreground/50 hover:border-border focus:border-ring focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/20";

export default function ProfilClient({ user }: { user: SessionUser }) {
    const [userData, setUserData] = React.useState<UserData | null>(null);
    const [loading, setLoading] = React.useState(true);

    const [phone, setPhone] = React.useState("");
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
    const [showNewPassword, setShowNewPassword] = React.useState(false);

    const [saving, setSaving] = React.useState(false);
    const [savingPassword, setSavingPassword] = React.useState(false);
    const [success, setSuccess] = React.useState("");
    const [error, setError] = React.useState("");
    const [passwordSuccess, setPasswordSuccess] = React.useState("");
    const [passwordError, setPasswordError] = React.useState("");

    React.useEffect(() => {
        fetch(`/api/kullanicilar/${user.id}`)
            .then((r) => r.json())
            .then((data) => {
                setUserData(data);
                setPhone(data.phone || "");
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user.id]);

    const handleSaveInfo = async () => {
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetch(`/api/kullanicilar/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Güncelleme başarısız");
            }
            setSuccess("Bilgileriniz güncellendi");
            setTimeout(() => setSuccess(""), 3000);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Bir hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError("");
        setPasswordSuccess("");

        if (!currentPassword) {
            setPasswordError("Mevcut şifrenizi girin");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Yeni şifre en az 6 karakter olmalıdır");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Yeni şifreler eşleşmiyor");
            return;
        }

        setSavingPassword(true);
        try {
            const res = await fetch(`/api/kullanicilar/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, password: newPassword }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Şifre değiştirme başarısız");
            }
            setPasswordSuccess("Şifreniz başarıyla değiştirildi");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordSuccess(""), 3000);
        } catch (e) {
            setPasswordError(e instanceof Error ? e.message : "Bir hata oluştu");
        } finally {
            setSavingPassword(false);
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

    if (!userData) {
        return (
            <DashboardLayout user={user}>
                <div className="py-24 text-center text-muted-foreground">
                    Kullanıcı bilgileri yüklenemedi.
                </div>
            </DashboardLayout>
        );
    }

    const badge = roleBadge[userData.role] || { label: userData.role, color: "text-gray-700", bg: "bg-gray-100" };

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Profilim</h1>
                    <p className="text-muted-foreground">
                        Kişisel bilgilerinizi görüntüleyin ve düzenleyin
                    </p>
                </div>

                {/* Top: User header card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                <User className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-semibold truncate">
                                    {userData.firstName} {userData.lastName}
                                </h2>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", badge.color, badge.bg)}>
                                        {badge.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{userData.email}</span>
                                </div>
                            </div>
                            {userData.kutuphane && (
                                <div className="hidden sm:flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs font-medium">{userData.kutuphane.adi}</p>
                                        <p className="text-[10px] text-muted-foreground">{userData.kutuphane.kodu}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Two-column: Info + Contact/Password */}
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Left column — Personal info (wider) */}
                    <Card className="lg:col-span-3">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Kişisel Bilgiler</CardTitle>
                            <CardDescription>Hesap bilgileriniz</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-x-6 sm:grid-cols-2">
                                <InfoItem icon={IdCard} label="TC Kimlik No" value={userData.tcKimlikNo} />
                                <InfoItem icon={Mail} label="E-posta" value={userData.email} />
                                <InfoItem icon={Shield} label="Rol" value={badge.label} badge={{ color: badge.color, bg: badge.bg }} />
                                <InfoItem icon={Building2} label="Kütüphane" value={userData.kutuphane?.adi || "—"} />
                                <InfoItem icon={Briefcase} label="Birim / Unvan" value={[userData.department, userData.title].filter(Boolean).join(" / ") || "—"} />
                                <InfoItem icon={Phone} label="Telefon" value={userData.phone || "—"} />
                                <InfoItem icon={Calendar} label="Kayıt Tarihi" value={new Date(userData.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} />
                                <InfoItem icon={Calendar} label="Son Giriş" value={userData.lastLoginAt ? new Date(userData.lastLoginAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right column — Edit phone */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">İletişim</CardTitle>
                            <CardDescription>Telefon numaranızı güncelleyin</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Telefon</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="05XX XXX XX XX"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                                {success && (
                                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {success}
                                    </div>
                                )}

                                <Button onClick={handleSaveInfo} disabled={saving} size="sm" className="gap-2 w-full">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Kaydet
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Password */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-base">Şifre Değiştir</CardTitle>
                        </div>
                        <CardDescription>Güvenliğiniz için mevcut şifrenizi doğrulamanız gerekir</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Mevcut Şifre</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Mevcut şifreniz"
                                        className={cn(inputClass, "pr-11")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Yeni Şifre</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="En az 6 karakter"
                                        className={cn(inputClass, "pr-11")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Yeni Şifre (Tekrar)</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Şifreyi tekrar girin"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                            <Button
                                onClick={handleChangePassword}
                                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                                size="sm"
                                variant="outline"
                                className="gap-2"
                            >
                                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                Şifreyi Değiştir
                            </Button>
                            {passwordError && <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>}
                            {passwordSuccess && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {passwordSuccess}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
