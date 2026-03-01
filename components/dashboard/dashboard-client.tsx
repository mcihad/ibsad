"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EChart } from "@/components/charts/echart";
import { cn } from "@/lib/utils";
import {
    BookOpen, Users, Library, TrendingUp, AlertTriangle,
    Clock, BookX, Loader2, ArrowRightLeft,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import type { EChartsOption } from "echarts";

interface DashboardData {
    stats: {
        toplamKitap: number;
        mevcutKitap: number;
        oduncKitap: number;
        kayipKitap: number;
        toplamUye: number;
        aktifUye: number;
        toplamOdunc: number;
        aktifOdunc: number;
        gecikmisSayisi: number;
        toplamKutuphane: number;
    };
    aylikTrend: { ay: string; odunc: number; iade: number }[];
    durumDagilimi: { durum: string; sayi: number }[];
    sonEklenenKitaplar: {
        id: string;
        baslik: string;
        yazarlar: string | null;
        isbn: string | null;
        durum: string;
        createdAt: string;
        kutuphane: { adi: string; kodu: string };
    }[];
    sonOduncler: {
        id: string;
        kitapBaslik: string;
        kitapYazar: string | null;
        uyeAdi: string;
        kutuphane: string;
        oduncTarihi: string;
        sonIadeTarihi: string;
        iadeTarihi: string | null;
        durum: string;
    }[];
}

const durumLabels: Record<string, string> = {
    MEVCUT: "Mevcut", ODUNC: "Ödünç", KAYIP: "Kayıp", HASARLI: "Hasarlı", AYIKLANDI: "Ayıklandı",
};
const durumColors: Record<string, string> = {
    MEVCUT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    ODUNC: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    KAYIP: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    HASARLI: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    AYIKLANDI: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400",
};
const oduncDurumLabels: Record<string, string> = {
    AKTIF: "Aktif", IADE_EDILDI: "İade Edildi", GECIKMIS: "Gecikmiş", KAYIP: "Kayıp", IPTAL: "İptal",
};
const oduncDurumColors: Record<string, string> = {
    AKTIF: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    IADE_EDILDI: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    GECIKMIS: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    KAYIP: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    IPTAL: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400",
};

function CircleProgress({ percentage, color }: { percentage: number; color: string }) {
    const circumference = 2 * Math.PI * 28;
    const offset = circumference - (percentage / 100) * circumference;
    return (
        <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/30" />
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={color} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-[10px] font-bold", color)}>%{percentage}</span>
            </div>
        </div>
    );
}

export default function DashboardClient({ user }: { user: SessionUser }) {
    const [data, setData] = React.useState<DashboardData | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetch("/api/dashboard")
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <DashboardLayout user={user}>
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout user={user}>
                <div className="py-24 text-center text-muted-foreground">
                    Veriler yüklenemedi.
                </div>
            </DashboardLayout>
        );
    }

    const s = data.stats;
    const mevcutYuzde = s.toplamKitap > 0 ? Math.round((s.mevcutKitap / s.toplamKitap) * 100) : 0;
    const aktifUyeYuzde = s.toplamUye > 0 ? Math.round((s.aktifUye / s.toplamUye) * 100) : 0;

    const statCards = [
        {
            title: "Toplam Kitap",
            value: s.toplamKitap.toLocaleString("tr-TR"),
            desc: `${s.mevcutKitap} mevcut`,
            icon: BookOpen,
            color: "text-emerald-500",
            percentage: mevcutYuzde,
        },
        {
            title: "Aktif Üye",
            value: s.aktifUye.toLocaleString("tr-TR"),
            desc: `${s.toplamUye} toplam üye`,
            icon: Users,
            color: "text-blue-500",
            percentage: aktifUyeYuzde,
        },
        ...(user.role === "ADMIN" ? [{
            title: "Kütüphane",
            value: s.toplamKutuphane.toString(),
            desc: "Aktif kütüphane",
            icon: Library,
            color: "text-orange-500",
            percentage: 100,
        }] : []),
        {
            title: "Aktif Ödünç",
            value: s.aktifOdunc.toLocaleString("tr-TR"),
            desc: `${s.toplamOdunc} toplam işlem`,
            icon: ArrowRightLeft,
            color: "text-purple-500",
            percentage: s.toplamOdunc > 0 ? Math.round((s.aktifOdunc / s.toplamOdunc) * 100) : 0,
        },
        {
            title: "Geciken",
            value: s.gecikmisSayisi.toString(),
            desc: "Gecikmiş ödünç",
            icon: AlertTriangle,
            color: s.gecikmisSayisi > 0 ? "text-red-500" : "text-emerald-500",
            percentage: s.aktifOdunc > 0 ? Math.min(100, Math.round((s.gecikmisSayisi / s.aktifOdunc) * 100)) : 0,
        },
        {
            title: "Ödünç Kitap",
            value: s.oduncKitap.toLocaleString("tr-TR"),
            desc: `${s.kayipKitap} kayıp`,
            icon: BookX,
            color: "text-amber-500",
            percentage: s.toplamKitap > 0 ? Math.round((s.oduncKitap / s.toplamKitap) * 100) : 0,
        },
    ];

    // Ödünç trend grafiği
    const trendOption: EChartsOption = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(0,0,0,0.8)",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
        },
        legend: { data: ["Ödünç", "İade"], bottom: 0, textStyle: { fontSize: 11 } },
        grid: { top: 20, right: 20, bottom: 40, left: 50 },
        xAxis: {
            type: "category",
            data: data.aylikTrend.map(t => t.ay),
            axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 11 },
        },
        yAxis: {
            type: "value",
            axisLine: { show: false }, axisTick: { show: false },
            splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } }, axisLabel: { fontSize: 11 },
        },
        series: [
            {
                name: "Ödünç", type: "bar",
                data: data.aylikTrend.map(t => t.odunc),
                itemStyle: { color: "#f59e0b", borderRadius: [4, 4, 0, 0] },
                barWidth: "35%",
            },
            {
                name: "İade", type: "bar",
                data: data.aylikTrend.map(t => t.iade),
                itemStyle: { color: "#10b981", borderRadius: [4, 4, 0, 0] },
                barWidth: "35%",
            },
        ],
    };

    // Durum dağılımı
    const durumColorMap: Record<string, string> = {
        MEVCUT: "#10b981", ODUNC: "#3b82f6", KAYIP: "#ef4444", HASARLI: "#f59e0b", AYIKLANDI: "#6b7280",
    };
    const durumOption: EChartsOption = {
        tooltip: {
            trigger: "item",
            backgroundColor: "rgba(0,0,0,0.8)",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
        },
        legend: { bottom: 0, textStyle: { fontSize: 11 } },
        series: [{
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: true,
            padAngle: 3,
            itemStyle: { borderRadius: 6, borderColor: "transparent", borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 13, fontWeight: "bold" } },
            data: data.durumDagilimi.map(d => ({
                name: durumLabels[d.durum] || d.durum,
                value: d.sayi,
                itemStyle: { color: durumColorMap[d.durum] || "#6b7280" },
            })),
        }],
    };

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ana Sayfa</h1>
                    <p className="text-muted-foreground">
                        {user.role === "ADMIN"
                            ? "Tüm kütüphanelerin genel durumu"
                            : "Kütüphanenizin genel durumu"}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                    {statCards.map((stat) => (
                        <Card key={stat.title} className="overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <CircleProgress percentage={stat.percentage} color={stat.color} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">{stat.desc}</p>
                                    </div>
                                    <stat.icon className={cn("h-5 w-5 shrink-0", stat.color)} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Ödünç/İade Trendi</CardTitle>
                            <CardDescription>Son 6 aylık ödünç ve iade sayıları</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <EChart option={trendOption} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Kitap Durumu</CardTitle>
                            <CardDescription>Durum bazlı dağılım</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <EChart option={durumOption} />
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Lists */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Son Eklenen Kitaplar */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-base">Son Eklenen Kitaplar</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {data.sonEklenenKitaplar.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Henüz kitap eklenmemiş</p>
                                ) : data.sonEklenenKitaplar.map((k) => (
                                    <div key={k.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{k.baslik}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {k.yazarlar || "—"} · {k.kutuphane.kodu}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", durumColors[k.durum])}>
                                                {durumLabels[k.durum]}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(k.createdAt).toLocaleDateString("tr-TR")}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Son Ödünç İşlemleri */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-base">Son Ödünç İşlemleri</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {data.sonOduncler.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Henüz ödünç işlemi yapılmamış</p>
                                ) : data.sonOduncler.map((o) => {
                                    const gecikmi = o.durum === "AKTIF" && new Date(o.sonIadeTarihi) < new Date();
                                    return (
                                        <div key={o.id} className={cn(
                                            "flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30",
                                            gecikmi && "border-red-200 dark:border-red-800/50"
                                        )}>
                                            <div className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                                gecikmi
                                                    ? "bg-red-50 dark:bg-red-900/30"
                                                    : "bg-purple-50 dark:bg-purple-900/30"
                                            )}>
                                                {gecikmi
                                                    ? <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                    : <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{o.kitapBaslik}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {o.uyeAdi} · {o.kutuphane}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                                    gecikmi
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                                        : oduncDurumColors[o.durum]
                                                )}>
                                                    {gecikmi ? "Gecikmiş" : oduncDurumLabels[o.durum]}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(o.oduncTarihi).toLocaleDateString("tr-TR")}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
