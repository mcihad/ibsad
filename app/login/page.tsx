"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LogIn, Loader2, Mail, Lock } from "lucide-react";

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
            {/* Left panel — immersive visual */}
            <div className="relative hidden w-1/2 overflow-hidden lg:flex xl:w-[55%]">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(30,64,175,0.2),transparent_60%)]" />

                {/* Floating geometric shapes */}
                <div className="absolute left-[15%] top-[20%] h-64 w-64 rounded-full bg-white/[0.07] blur-xl animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute right-[10%] bottom-[30%] h-48 w-48 rounded-full bg-white/[0.05] blur-xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
                <div className="absolute left-[40%] bottom-[10%] h-32 w-32 rounded-full bg-blue-400/[0.06] blur-xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '4s' }} />

                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt="İBSAD Logo"
                            width={40}
                            height={40}
                            className="rounded-xl shadow-lg shadow-black/20"
                        />
                        <span className="text-xl font-bold text-white tracking-wide">İBSAD</span>
                    </div>

                    {/* Center — Hero text */}
                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-[3.5rem] font-extrabold leading-[1.1] text-white drop-shadow-sm">
                            Kütüphane
                            <br />
                            <span className="text-blue-200/70">Otomasyon</span>
                            <br />
                            <span className="bg-gradient-to-r from-blue-300 to-sky-300 bg-clip-text text-transparent">
                                Sistemi
                            </span>
                        </h1>
                        <p className="text-lg text-white/60 leading-relaxed max-w-sm">
                            İlçe Bilgi Sistemleri Arşiv Düzeni ile kütüphane yönetimini dijitalleştirin.
                        </p>

                        {/* Stats row */}
                        <div className="flex gap-8 pt-4">
                            {[
                                { value: "∞", label: "Kitap Kapasitesi" },
                                { value: "7/24", label: "Erişim" },
                                { value: "100%", label: "Dijital" },
                            ].map((s) => (
                                <div key={s.label}>
                                    <p className="text-3xl font-bold text-white">{s.value}</p>
                                    <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-xs text-white/30">
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
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
