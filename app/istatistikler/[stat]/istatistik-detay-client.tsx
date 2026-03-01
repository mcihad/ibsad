"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EChart } from "@/components/charts/echart";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Download,
    Loader2,
    Table as TableIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import type { EChartsOption } from "echarts";

interface StatData {
    title: string;
    chartType: "bar" | "horizontalBar" | "line" | "pie" | "table";
    labels: string[];
    datasets: { label: string; data: number[] }[];
    rows: Record<string, string | number>[];
}

const CHART_COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
    "#14b8a6", "#e11d48", "#a855f7", "#0ea5e9", "#22c55e",
];

function buildChartOption(data: StatData): EChartsOption | null {
    const { chartType, labels, datasets } = data;

    if (chartType === "table") return null;

    const tooltip: EChartsOption["tooltip"] = {
        trigger: chartType === "pie" ? "item" : "axis",
        backgroundColor: "rgba(0,0,0,0.8)",
        borderColor: "transparent",
        textStyle: { color: "#fff", fontSize: 12 },
    };

    if (chartType === "pie") {
        return {
            tooltip,
            legend: { bottom: 0, textStyle: { fontSize: 11 } },
            series: [{
                type: "pie",
                radius: ["35%", "65%"],
                padAngle: 3,
                itemStyle: { borderRadius: 6, borderColor: "transparent", borderWidth: 2 },
                label: { show: true, fontSize: 11, formatter: "{b}: {c} ({d}%)" },
                emphasis: { label: { show: true, fontSize: 13, fontWeight: "bold" } },
                data: labels.map((name, i) => ({
                    name,
                    value: datasets[0]?.data[i] ?? 0,
                    itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
                })),
            }],
        };
    }

    if (chartType === "horizontalBar") {
        return {
            tooltip,
            grid: { top: 10, right: 30, bottom: 30, left: 160 },
            xAxis: {
                type: "value",
                axisLine: { show: false }, axisTick: { show: false },
                splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
                axisLabel: { fontSize: 11 },
            },
            yAxis: {
                type: "category",
                data: [...labels].reverse(),
                axisLine: { show: false }, axisTick: { show: false },
                axisLabel: { fontSize: 11 },
            },
            series: datasets.map((ds, i) => ({
                name: ds.label,
                type: "bar" as const,
                data: [...ds.data].reverse(),
                itemStyle: {
                    color: CHART_COLORS[i % CHART_COLORS.length],
                    borderRadius: [0, 4, 4, 0],
                },
                barWidth: datasets.length > 1 ? "40%" : "50%",
            })),
            ...(datasets.length > 1 ? { legend: { bottom: 0, textStyle: { fontSize: 11 } } } : {}),
        };
    }

    if (chartType === "line") {
        return {
            tooltip,
            legend: datasets.length > 1 ? { bottom: 0, textStyle: { fontSize: 11 } } : undefined,
            grid: { top: 20, right: 20, bottom: datasets.length > 1 ? 50 : 30, left: 50 },
            xAxis: {
                type: "category",
                data: labels,
                axisLine: { show: false }, axisTick: { show: false },
                axisLabel: { fontSize: 10, rotate: labels.length > 15 ? 45 : 0 },
            },
            yAxis: {
                type: "value",
                axisLine: { show: false }, axisTick: { show: false },
                splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
                axisLabel: { fontSize: 11 },
            },
            series: datasets.map((ds, i) => ({
                name: ds.label,
                type: "line" as const,
                data: ds.data,
                smooth: true,
                symbol: "circle",
                symbolSize: 6,
                lineStyle: { width: 2.5, color: CHART_COLORS[i % CHART_COLORS.length] },
                itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
                areaStyle: datasets.length === 1 ? {
                    color: {
                        type: "linear" as const,
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: CHART_COLORS[i % CHART_COLORS.length] + "40" },
                            { offset: 1, color: CHART_COLORS[i % CHART_COLORS.length] + "05" },
                        ],
                    },
                } : undefined,
            })),
        };
    }

    // bar (vertical)
    return {
        tooltip,
        legend: datasets.length > 1 ? { bottom: 0, textStyle: { fontSize: 11 } } : undefined,
        grid: { top: 20, right: 20, bottom: datasets.length > 1 ? 50 : 30, left: 50 },
        xAxis: {
            type: "category",
            data: labels,
            axisLine: { show: false }, axisTick: { show: false },
            axisLabel: { fontSize: 10, rotate: labels.length > 8 ? 30 : 0 },
        },
        yAxis: {
            type: "value",
            axisLine: { show: false }, axisTick: { show: false },
            splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
            axisLabel: { fontSize: 11 },
        },
        series: datasets.map((ds, i) => ({
            name: ds.label,
            type: "bar" as const,
            data: ds.data,
            itemStyle: {
                color: CHART_COLORS[i % CHART_COLORS.length],
                borderRadius: [4, 4, 0, 0],
            },
            barWidth: datasets.length > 1 ? "35%" : "50%",
        })),
    };
}

async function exportToExcel(title: string, rows: Record<string, string | number>[]) {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Veri");
    XLSX.writeFile(wb, `${title.replace(/[^a-zA-Z0-9ğüşöçıĞÜŞÖÇİ\s-]/g, "").replace(/\s+/g, "_")}.xlsx`);
}

export default function IstatistikDetayClient({ user, stat }: { user: SessionUser; stat: string }) {
    const [data, setData] = React.useState<StatData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        fetch(`/api/istatistikler?stat=${stat}`)
            .then(async (r) => {
                if (!r.ok) throw new Error("Veri yüklenemedi");
                return r.json();
            })
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [stat]);

    if (loading) {
        return (
            <DashboardLayout user={user}>
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout user={user}>
                <div className="space-y-4">
                    <Link href="/istatistikler" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" /> İstatistiklere dön
                    </Link>
                    <div className="py-24 text-center text-muted-foreground">
                        {error || "Veriler yüklenemedi."}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const chartOption = buildChartOption(data);
    const columns = data.rows.length > 0 ? Object.keys(data.rows[0]) : [];

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <Link href="/istatistikler" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
                            <ArrowLeft className="h-4 w-4" /> İstatistiklere dön
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToExcel(data.title, data.rows)}
                        className="gap-2 self-start"
                    >
                        <Download className="h-4 w-4" />
                        Excel İndir
                    </Button>
                </div>

                {/* Chart */}
                {chartOption && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className={cn(
                                "w-full",
                                data.chartType === "horizontalBar"
                                    ? "h-[400px]"
                                    : data.chartType === "pie"
                                        ? "h-[380px]"
                                        : "h-[350px]"
                            )}>
                                <EChart option={chartOption} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Data Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <TableIcon className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-base">Veri Seti</CardTitle>
                        </div>
                        <CardDescription>{data.rows.length} kayıt</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                                        {columns.map((col) => (
                                            <th key={col} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.rows.map((row, i) => (
                                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                                            {columns.map((col) => (
                                                <td key={col} className="px-4 py-2.5 whitespace-nowrap">
                                                    {typeof row[col] === "number"
                                                        ? row[col].toLocaleString("tr-TR")
                                                        : row[col]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {data.rows.length === 0 && (
                                        <tr>
                                            <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                                                Veri bulunamadı
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
