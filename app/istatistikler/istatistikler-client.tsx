"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
    Library,
    BookOpen,
    Users,
    TrendingUp,
    Calendar,
    CalendarDays,
    CalendarRange,
    PieChart,
    BarChart3,
    AlertTriangle,
    Building2,
    Globe,
    ArrowRightLeft,
    BookX,
    UserPlus,
    Banknote,
    Star,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

interface StatCard {
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
}

const statCards: StatCard[] = [
    {
        title: "Kütüphane Kitap Sayıları",
        description: "Her kütüphanedeki toplam kitap sayısı",
        href: "/istatistikler/kutuphane-kitap",
        icon: Library,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
        title: "Kütüphane Ödünç Sayıları",
        description: "Kütüphanelere göre ödünç işlem sayıları",
        href: "/istatistikler/kutuphane-odunc",
        icon: ArrowRightLeft,
        color: "text-violet-600 dark:text-violet-400",
        bgColor: "bg-violet-50 dark:bg-violet-900/30",
    },
    {
        title: "Kütüphane Üye Sayıları",
        description: "Her kütüphanedeki kayıtlı üye sayısı",
        href: "/istatistikler/kutuphane-uye",
        icon: Users,
        color: "text-teal-600 dark:text-teal-400",
        bgColor: "bg-teal-50 dark:bg-teal-900/30",
    },
    {
        title: "En Çok Ödünç Alan Üyeler",
        description: "En aktif okuyucuların sıralaması",
        href: "/istatistikler/en-cok-odunc-alan-uyeler",
        icon: Star,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/30",
    },
    {
        title: "Günlük Ödünç Trendi",
        description: "Son 30 günlük günlük ödünç verileri",
        href: "/istatistikler/gunluk-odunc",
        icon: Calendar,
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-50 dark:bg-rose-900/30",
    },
    {
        title: "Haftalık Ödünç Trendi",
        description: "Son 12 haftalık ödünç verileri",
        href: "/istatistikler/haftalik-odunc",
        icon: CalendarDays,
        color: "text-sky-600 dark:text-sky-400",
        bgColor: "bg-sky-50 dark:bg-sky-900/30",
    },
    {
        title: "Aylık Ödünç Trendi",
        description: "Son 12 aylık kütüphane bazlı ödünç verileri",
        href: "/istatistikler/aylik-odunc",
        icon: CalendarRange,
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-50 dark:bg-indigo-900/30",
    },
    {
        title: "Kitap Durum Dağılımı",
        description: "Kitapların mevcut/ödünç/kayıp durumları",
        href: "/istatistikler/kitap-durum-dagilimi",
        icon: PieChart,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
    },
    {
        title: "Üye Tipi Dağılımı",
        description: "Üyelerin tipine göre dağılımı",
        href: "/istatistikler/uye-tipi-dagilimi",
        icon: PieChart,
        color: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-50 dark:bg-cyan-900/30",
    },
    {
        title: "En Çok Okunan Kitaplar",
        description: "En fazla ödünç verilen kitapların sıralaması",
        href: "/istatistikler/en-cok-okunan-kitaplar",
        icon: BookOpen,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-900/30",
    },
    {
        title: "Geciken Ödünçler",
        description: "İade süresi geçmiş aktif ödünç kayıtları",
        href: "/istatistikler/geciken-oduncler",
        icon: AlertTriangle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/30",
    },
    {
        title: "Yayınevi Dağılımı",
        description: "En çok kitabı olan yayınevleri",
        href: "/istatistikler/yayinevi-dagilimi",
        icon: Building2,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/30",
    },
    {
        title: "Dil Dağılımı",
        description: "Kitapların dile göre dağılımı",
        href: "/istatistikler/dil-dagilimi",
        icon: Globe,
        color: "text-lime-600 dark:text-lime-400",
        bgColor: "bg-lime-50 dark:bg-lime-900/30",
    },
    {
        title: "Ödünç/İade Oranları",
        description: "Kütüphane bazlı ödünç ve iade oranları",
        href: "/istatistikler/odunc-iade-oranlari",
        icon: BarChart3,
        color: "text-fuchsia-600 dark:text-fuchsia-400",
        bgColor: "bg-fuchsia-50 dark:bg-fuchsia-900/30",
    },
    {
        title: "Kayıp & Hasarlı Kitaplar",
        description: "Kayıp ve hasarlı kitapların listesi",
        href: "/istatistikler/kayip-hasarli-kitaplar",
        icon: BookX,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/30",
    },
    {
        title: "Üye Kayıt Trendi",
        description: "Son 12 aylık yeni üye kayıt sayıları",
        href: "/istatistikler/uye-kayit-trendi",
        icon: UserPlus,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/30",
    },
    {
        title: "Ceza İstatistikleri",
        description: "Kütüphane bazlı gecikme cezaları",
        href: "/istatistikler/ceza-istatistikleri",
        icon: Banknote,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/30",
    },
];

export default function IstatistiklerClient({ user }: { user: SessionUser }) {
    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">İstatistikler</h1>
                    <p className="text-muted-foreground">
                        Detaylı istatistik ve raporlara erişin
                    </p>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {statCards.map((card) => (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 dark:hover:shadow-black/20"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.bgColor}`}>
                                    <card.icon className={`h-5 w-5 ${card.color}`} />
                                </div>
                                <TrendingUp className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">{card.title}</h3>
                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
