"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, Library, Users, TrendingUp } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    trendUp?: boolean;
    color: string;
    percentage: number;
}

const statCards: StatCardProps[] = [
    {
        title: "Toplam Kitap",
        value: "24.856",
        description: "Bu ay 142 yeni kitap",
        icon: BookOpen,
        trend: "+12%",
        trendUp: true,
        color: "text-emerald-500",
        percentage: 85,
    },
    {
        title: "Aktif Üye",
        value: "3.248",
        description: "Bu ay 48 yeni üye",
        icon: Users,
        trend: "+8%",
        trendUp: true,
        color: "text-blue-500",
        percentage: 72,
    },
    {
        title: "Kütüphane Sayısı",
        value: "12",
        description: "5 ilçede aktif",
        icon: Library,
        trend: "+2",
        trendUp: true,
        color: "text-orange-500",
        percentage: 60,
    },
    {
        title: "Ödünç Verme",
        value: "1.842",
        description: "Bu ayki ödünç işlemleri",
        icon: TrendingUp,
        trend: "+21%",
        trendUp: true,
        color: "text-purple-500",
        percentage: 68,
    },
];

function CircleProgress({
    percentage,
    color,
}: {
    percentage: number;
    color: string;
}) {
    const circumference = 2 * Math.PI * 28;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 64 64">
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-muted/30"
                />
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={color}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-[10px] font-bold", color)}>
                    %{percentage}
                </span>
            </div>
        </div>
    );
}

export function StatsCards() {
    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
                <Card key={stat.title} className="overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <CircleProgress
                                percentage={stat.percentage}
                                color={stat.color}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {stat.title}
                                </p>
                                <p className="text-2xl font-bold tracking-tight">
                                    {stat.value}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-xs">
                                    <span className="font-medium text-emerald-500">
                                        {stat.trend}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {stat.description}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
