"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LogIn, Loader2, BookOpen, Users, Library, Mail, Lock } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Giriş başarısız");
                return;
            }

            router.push("/");
            router.refresh();
        } catch {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left panel — branding / illustration */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-10 lg:flex xl:w-[55%]">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/8 blur-3xl" />
                <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="İBSAD Logo"
                        width={38}
                        height={38}
                        className="rounded-lg"
                    />
                    <span className="text-lg font-bold text-slate-100 tracking-wide">İBSAD</span>
                </div>

                {/* Center content */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold leading-tight text-slate-100 xl:text-5xl">
                            Kütüphane
                            <br />
                            <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                                Otomasyon Sistemi
                            </span>
                        </h1>
                        <p className="max-w-md text-lg text-slate-400">
                            İlçe Bilgi Sistemleri Arşiv Düzeni ile kütüphane yönetimini
                            dijitalleştirin.
                        </p>
                    </div>

                    {/* Feature cards */}
                    <div className="grid max-w-md gap-3">
                        {[
                            {
                                icon: BookOpen,
                                title: "Kitap Yönetimi",
                                desc: "MARC desteği ile kataloglama",
                                accent: "from-blue-500/20 to-blue-600/5",
                                iconColor: "text-blue-400",
                            },
                            {
                                icon: Users,
                                title: "Üye Takibi",
                                desc: "Ödünç, iade ve ceza işlemleri",
                                accent: "from-emerald-500/20 to-emerald-600/5",
                                iconColor: "text-emerald-400",
                            },
                            {
                                icon: Library,
                                title: "Çoklu Kütüphane",
                                desc: "Merkezi yönetim altyapısı",
                                accent: "from-violet-500/20 to-violet-600/5",
                                iconColor: "text-violet-400",
                            },
                        ].map((f) => (
                            <div
                                key={f.title}
                                className="flex items-center gap-4 rounded-xl border border-slate-700/20 bg-gradient-to-r p-4"
                                style={{
                                    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                                }}
                            >
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${f.accent}`}>
                                    <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{f.title}</p>
                                    <p className="text-xs text-slate-500">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-xs text-slate-600">
                        Sivas Cumhuriyet Üniversitesi
                        <br />
                        Kütüphane ve Dökümantasyon Daire Başkanlığı
                    </p>
                </div>
            </div>

            {/* Right panel — login form */}
            <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-10">
                <div className="w-full max-w-[380px]">
                    {/* Mobile only logo */}
                    <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
                        <Image
                            src="/logo.png"
                            alt="İBSAD Logo"
                            width={38}
                            height={38}
                            className="rounded-lg"
                        />
                        <span className="text-lg font-bold text-foreground tracking-wide">İBSAD</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground">
                            Hoş Geldiniz
                        </h2>
                        <p className="mt-2 text-[15px] text-muted-foreground">
                            Devam etmek için hesabınıza giriş yapın
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2.5 rounded-lg border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
                                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium text-foreground"
                            >
                                E-posta
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@ibsad.com"
                                    required
                                    autoFocus
                                    className="flex h-11 w-full rounded-lg border border-border/60 bg-muted/30 pl-10 pr-4 text-[15px] transition-all placeholder:text-muted-foreground/50 hover:border-border focus:border-ring focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-foreground"
                            >
                                Şifre
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="flex h-11 w-full rounded-lg border border-border/60 bg-muted/30 pl-10 pr-11 text-[15px] transition-all placeholder:text-muted-foreground/50 hover:border-border focus:border-ring focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="h-11 w-full gap-2 text-[15px] font-medium"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogIn className="h-4 w-4" />
                            )}
                            Giriş Yap
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
                        Sivas Cumhuriyet Üniversitesi
                        <br />
                        Kütüphane ve Dökümantasyon Daire Başkanlığı
                    </p>
                </div>
            </div>
        </div>
    );
}
