"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EChart } from "@/components/charts/echart";
import type { EChartsOption } from "echarts";

const months = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
];

export function BorrowingTrendChart() {
    const option: EChartsOption = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(0,0,0,0.8)",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
        },
        legend: {
            data: ["Ödünç Verme", "İade"],
            bottom: 0,
            textStyle: { fontSize: 11 },
        },
        grid: {
            top: 20,
            right: 20,
            bottom: 40,
            left: 50,
        },
        xAxis: {
            type: "category",
            data: months,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 11 },
        },
        yAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
            axisLabel: { fontSize: 11 },
        },
        series: [
            {
                name: "Ödünç Verme",
                type: "line",
                smooth: true,
                data: [320, 280, 350, 410, 380, 420, 390, 440, 480, 520, 450, 500],
                itemStyle: { color: "#f59e0b" },
                areaStyle: {
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: "rgba(245,158,11,0.3)" },
                            { offset: 1, color: "rgba(245,158,11,0.02)" },
                        ],
                    },
                },
                lineStyle: { width: 2 },
                symbol: "none",
            },
            {
                name: "İade",
                type: "line",
                smooth: true,
                data: [280, 250, 310, 370, 340, 380, 350, 400, 430, 470, 410, 460],
                itemStyle: { color: "#10b981" },
                areaStyle: {
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: "rgba(16,185,129,0.3)" },
                            { offset: 1, color: "rgba(16,185,129,0.02)" },
                        ],
                    },
                },
                lineStyle: { width: 2 },
                symbol: "none",
            },
        ],
    };

    return (
        <Card className="col-span-1">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Ödünç Verme Trendi</CardTitle>
                        <CardDescription>Ödünç verme ve iade işlemleri</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <EChart option={option} />
            </CardContent>
        </Card>
    );
}

export function MonthlyComparisonChart() {
    const option: EChartsOption = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(0,0,0,0.8)",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
        },
        legend: {
            data: ["Ödünç Verme", "İade"],
            bottom: 0,
            textStyle: { fontSize: 11 },
        },
        grid: {
            top: 20,
            right: 20,
            bottom: 40,
            left: 50,
        },
        xAxis: {
            type: "category",
            data: months,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 11 },
        },
        yAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
            axisLabel: { fontSize: 11 },
        },
        series: [
            {
                name: "Ödünç Verme",
                type: "bar",
                data: [420, 380, 450, 510, 480, 520, 490, 540, 580, 620, 550, 600],
                itemStyle: {
                    color: "#f59e0b",
                    borderRadius: [4, 4, 0, 0],
                },
                barWidth: "35%",
            },
            {
                name: "İade",
                type: "bar",
                data: [380, 340, 410, 470, 440, 480, 450, 500, 530, 570, 510, 560],
                itemStyle: {
                    color: "#10b981",
                    borderRadius: [4, 4, 0, 0],
                },
                barWidth: "35%",
            },
        ],
    };

    return (
        <Card className="col-span-1">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Aylık Karşılaştırma</CardTitle>
                        <CardDescription>Ödünç verme ve iade işlemleri</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <EChart option={option} />
            </CardContent>
        </Card>
    );
}

export function BookCategoryChart() {
    const option: EChartsOption = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(0,0,0,0.8)",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
        },
        legend: {
            data: ["Bu Yıl", "Geçen Yıl"],
            bottom: 0,
            textStyle: { fontSize: 11 },
        },
        grid: {
            top: 20,
            right: 20,
            bottom: 40,
            left: 50,
        },
        xAxis: {
            type: "category",
            data: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 11 },
        },
        yAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
            axisLabel: { fontSize: 11, formatter: "₺{value}" },
        },
        series: [
            {
                name: "Bu Yıl",
                type: "bar",
                data: [1200, 1800, 2400, 3200, 2800, 1500, 2100, 2600, 3100, 2900, 3400, 3800],
                itemStyle: {
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: "#f59e0b" },
                            { offset: 1, color: "#d97706" },
                        ],
                    },
                    borderRadius: [4, 4, 0, 0],
                },
                barWidth: "50%",
            },
            {
                name: "Geçen Yıl",
                type: "line",
                smooth: true,
                data: [1000, 1500, 2000, 2800, 2400, 1200, 1800, 2200, 2700, 2500, 3000, 3400],
                itemStyle: { color: "#6b7280" },
                lineStyle: { width: 2, type: "dashed" },
                symbol: "circle",
                symbolSize: 6,
            },
        ],
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Kitap Alım Bütçesi</CardTitle>
                        <CardDescription>Yıllar arası karşılaştırma</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <EChart option={option} />
            </CardContent>
        </Card>
    );
}

export function VisitorAnalyticsChart() {
    const hours = [
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
    ];

    const option: EChartsOption = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(0,0,0,0.8)",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
        },
        legend: {
            data: ["Öğrenci", "Akademisyen", "Personel", "Misafir"],
            bottom: 0,
            textStyle: { fontSize: 11 },
        },
        grid: {
            top: 20,
            right: 20,
            bottom: 40,
            left: 50,
        },
        xAxis: {
            type: "category",
            data: hours,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 11 },
        },
        yAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
            axisLabel: { fontSize: 11 },
        },
        series: [
            {
                name: "Öğrenci",
                type: "line",
                stack: "total",
                smooth: true,
                areaStyle: { opacity: 0.8 },
                data: [80, 150, 200, 250, 180, 220, 280, 320, 260, 180],
                itemStyle: { color: "#10b981" },
                symbol: "none",
            },
            {
                name: "Akademisyen",
                type: "line",
                stack: "total",
                smooth: true,
                areaStyle: { opacity: 0.8 },
                data: [40, 80, 100, 120, 90, 110, 130, 140, 120, 80],
                itemStyle: { color: "#8b5cf6" },
                symbol: "none",
            },
            {
                name: "Personel",
                type: "line",
                stack: "total",
                smooth: true,
                areaStyle: { opacity: 0.8 },
                data: [20, 40, 60, 70, 50, 60, 80, 90, 70, 40],
                itemStyle: { color: "#f59e0b" },
                symbol: "none",
            },
            {
                name: "Misafir",
                type: "line",
                stack: "total",
                smooth: true,
                areaStyle: { opacity: 0.8 },
                data: [10, 20, 30, 35, 25, 30, 40, 45, 35, 20],
                itemStyle: { color: "#3b82f6" },
                symbol: "none",
            },
        ],
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Ziyaretçi Analizi</CardTitle>
                        <CardDescription>Saatlik ziyaretçi dağılımı</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <EChart option={option} />
            </CardContent>
        </Card>
    );
}

export function PerformanceMetricsChart() {
    const option: EChartsOption = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(0,0,0,0.8)",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
        },
        legend: {
            data: ["Masaüstü"],
            bottom: 0,
            textStyle: { fontSize: 11 },
        },
        grid: {
            top: 20,
            right: 20,
            bottom: 40,
            left: 50,
        },
        xAxis: {
            type: "category",
            data: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran"],
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 11 },
        },
        yAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
            axisLabel: { fontSize: 11 },
        },
        series: [
            {
                name: "Masaüstü",
                type: "bar",
                data: [180, 250, 200, 300, 150, 280],
                itemStyle: {
                    color: (params: { dataIndex: number }) => {
                        const colors = [
                            "#f59e0b",
                            "#10b981",
                            "#f59e0b",
                            "#10b981",
                            "#f59e0b",
                            "#10b981",
                        ];
                        return colors[params.dataIndex % colors.length];
                    },
                    borderRadius: [4, 4, 0, 0],
                },
                barWidth: "50%",
            },
        ],
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Performans Metrikleri</CardTitle>
                        <CardDescription>Son 6 ay</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <EChart option={option} />
            </CardContent>
        </Card>
    );
}

export function SystemPerformanceChart() {
    const option: EChartsOption = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(0,0,0,0.8)",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
        },
        legend: {
            data: ["CPU Kullanımı"],
            bottom: 0,
            textStyle: { fontSize: 11 },
        },
        grid: {
            top: 20,
            right: 20,
            bottom: 40,
            left: 50,
        },
        xAxis: {
            type: "category",
            data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, interval: 3 },
        },
        yAxis: {
            type: "value",
            max: 100,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
            axisLabel: { fontSize: 11, formatter: "%{value}" },
        },
        series: [
            {
                name: "CPU Kullanımı",
                type: "line",
                smooth: true,
                data: [
                    12, 10, 8, 7, 6, 8, 15, 35, 55, 62, 58, 65, 45, 52, 60, 68, 55,
                    42, 35, 28, 22, 18, 15, 13,
                ],
                itemStyle: { color: "#f59e0b" },
                areaStyle: {
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: "rgba(245,158,11,0.4)" },
                            { offset: 1, color: "rgba(245,158,11,0.02)" },
                        ],
                    },
                },
                lineStyle: { width: 2 },
                symbol: "none",
            },
        ],
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Sistem Performansı</CardTitle>
                        <CardDescription>Son 24 saat</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <EChart option={option} />
            </CardContent>
        </Card>
    );
}

export function RevenueMonitoringChart() {
    const option: EChartsOption = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(0,0,0,0.8)",
            borderColor: "transparent",
            textStyle: { color: "#fff", fontSize: 12 },
        },
        legend: {
            data: ["Masaüstü", "Mobil"],
            bottom: 0,
            textStyle: { fontSize: 11 },
        },
        grid: {
            top: 20,
            right: 20,
            bottom: 40,
            left: 50,
        },
        xAxis: {
            type: "category",
            data: months,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 11 },
        },
        yAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
            axisLabel: { fontSize: 11 },
        },
        series: [
            {
                name: "Masaüstü",
                type: "line",
                smooth: true,
                data: [120, 180, 240, 320, 280, 350, 310, 380, 420, 460, 400, 450],
                itemStyle: { color: "#3b82f6" },
                lineStyle: { width: 2 },
                symbol: "circle",
                symbolSize: 6,
            },
            {
                name: "Mobil",
                type: "line",
                smooth: true,
                data: [80, 120, 160, 220, 190, 250, 210, 280, 310, 340, 290, 330],
                itemStyle: { color: "#10b981" },
                lineStyle: { width: 2 },
                symbol: "circle",
                symbolSize: 6,
            },
        ],
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Kullanım İzleme</CardTitle>
                        <CardDescription>Platform bazlı kullanım</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <EChart option={option} />
            </CardContent>
        </Card>
    );
}
