"use client";

import React, { useRef, useEffect } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { useTheme } from "next-themes";

interface EChartProps {
    option: EChartsOption;
    className?: string;
    style?: React.CSSProperties;
}

export function EChart({ option, className, style }: EChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!chartRef.current) return;

        if (chartInstance.current) {
            chartInstance.current.dispose();
        }

        const chart = echarts.init(
            chartRef.current,
            theme === "dark" ? "dark" : undefined
        );
        chartInstance.current = chart;

        const mergedOption: EChartsOption = {
            ...option,
            backgroundColor: "transparent",
        };

        chart.setOption(mergedOption);

        const handleResize = () => chart.resize();
        window.addEventListener("resize", handleResize);

        const resizeObserver = new ResizeObserver(() => chart.resize());
        resizeObserver.observe(chartRef.current);

        return () => {
            window.removeEventListener("resize", handleResize);
            resizeObserver.disconnect();
            chart.dispose();
        };
    }, [option, theme]);

    return (
        <div
            ref={chartRef}
            className={className}
            style={{ width: "100%", height: "100%", minHeight: 300, ...style }}
        />
    );
}
