"use client";

import * as React from "react";
import {
    Tags, Plus, Pencil, Trash2, Copy, Star, Printer,
    Type, BarChart3, QrCode, Minus, Square,
    ChevronUp, ChevronDown, GripVertical, Eye, Settings2, Layers,
    AlertCircle, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/dashboard-layout";
import { cn } from "@/lib/utils";
import {
    type LabelElement, type PrinterType,
    BOOK_FIELDS, SAMPLE_BOOK, LABEL_PRESETS, A4_PRESETS,
    defaultTextElement, defaultBarcodeElement, defaultQRElement,
    defaultLineElement, defaultRectangleElement,
} from "@/lib/etiket-types";
import { processTemplate, mmToPx } from "@/lib/etiket-utils";

// ══════════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════════

interface SessionUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    kutuphaneId?: string | null;
}

interface Tasarim {
    id: string;
    uuid: string;
    adi: string;
    aciklama: string | null;
    etiketGenislik: number;
    etiketYukseklik: number;
    yaziciTuru: PrinterType;
    sayfaGenislik: number | null;
    sayfaYukseklik: number | null;
    satirSayisi: number | null;
    sutunSayisi: number | null;
    sayfaKenarUst: number | null;
    sayfaKenarAlt: number | null;
    sayfaKenarSol: number | null;
    sayfaKenarSag: number | null;
    satirAraligi: number | null;
    sutunAraligi: number | null;
    sablon: string;
    varsayilan: boolean;
    aktif: boolean;
    olusturan?: { id: string; firstName: string; lastName: string } | null;
    createdAt: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Barcode / QR Preview Components
// ══════════════════════════════════════════════════════════════════════════════

function BarcodePreview({ value, format, width, height, showText, scale, rotation }: {
    value: string; format: string; width: number; height: number; showText?: boolean; scale: number; rotation?: 0 | 90;
}) {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const isVertical = rotation === 90;
    // For vertical barcodes, generate barcode using swapped dimensions
    const barcodeW = isVertical ? height : width;
    const barcodeH = isVertical ? width : height;

    React.useEffect(() => {
        if (!svgRef.current || !value) return;
        import("jsbarcode").then((JsBarcode) => {
            try {
                JsBarcode.default(svgRef.current!, value, {
                    format,
                    width: Math.max(1, scale * 0.8),
                    height: mmToPx(barcodeH, scale) * 0.7,
                    displayValue: showText ?? true,
                    fontSize: Math.max(8, 10 * scale),
                    margin: 0,
                    background: "transparent",
                });
            } catch {
                if (svgRef.current) svgRef.current.innerHTML = "";
            }
        });
    }, [value, format, barcodeW, barcodeH, showText, scale]);

    return (
        <svg
            ref={svgRef}
            style={{
                width: mmToPx(barcodeW, scale),
                height: mmToPx(barcodeH, scale),
                overflow: "hidden",
                ...(isVertical ? {
                    transform: "rotate(90deg)",
                    transformOrigin: "top left",
                    position: "absolute" as const,
                    left: mmToPx(width, scale),
                    top: 0,
                } : {}),
            }}
        />
    );
}

function QRPreview({ value, size, scale, errorLevel }: {
    value: string; size: number; scale: number; errorLevel?: string;
}) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (!canvasRef.current || !value) return;
        import("qrcode").then((QRCode) => {
            QRCode.toCanvas(canvasRef.current!, value, {
                width: mmToPx(size, scale),
                margin: 0,
                errorCorrectionLevel: (errorLevel as "L" | "M" | "Q" | "H") || "M",
                color: { dark: "#000000", light: "#ffffff" },
            }).catch(() => { /* ignore */ });
        });
    }, [value, size, scale, errorLevel]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: mmToPx(size, scale),
                height: mmToPx(size, scale),
            }}
        />
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// Label Preview — tek etiket önizleme
// ══════════════════════════════════════════════════════════════════════════════

function LabelPreview({ elements, labelW, labelH, bookData, scale, selected, onSelect, showBorder = true }: {
    elements: LabelElement[];
    labelW: number;
    labelH: number;
    bookData: Record<string, string>;
    scale: number;
    selected?: string | null;
    onSelect?: (id: string) => void;
    showBorder?: boolean;
}) {
    return (
        <div
            className={cn("relative bg-white", showBorder && "border border-gray-300 shadow-sm")}
            style={{
                width: mmToPx(labelW, scale),
                height: mmToPx(labelH, scale),
                overflow: "hidden",
            }}
        >
            {elements.map((el) => {
                const isSelected = selected === el.id;
                const x = mmToPx(el.x, scale);
                const y = mmToPx(el.y, scale);
                const w = mmToPx(el.width, scale);
                const h = mmToPx(el.height, scale);

                return (
                    <div
                        key={el.id}
                        onClick={(e) => { e.stopPropagation(); onSelect?.(el.id); }}
                        className={cn(
                            "absolute cursor-pointer",
                            isSelected && "ring-2 ring-blue-500 ring-offset-1"
                        )}
                        style={{ left: x, top: y, width: w, height: h }}
                    >
                        {el.type === "text" && (
                            <div
                                className="leading-tight overflow-hidden"
                                style={{
                                    fontSize: (el.fontSize ?? 8) * scale,
                                    fontWeight: el.fontWeight === "bold" ? 700 : 400,
                                    fontStyle: el.fontStyle === "italic" ? "italic" : "normal",
                                    textAlign: el.textAlign ?? "left",
                                    color: el.color ?? "#000",
                                    width: w,
                                    height: h,
                                    display: "-webkit-box",
                                    WebkitLineClamp: el.maxLines ?? 999,
                                    WebkitBoxOrient: "vertical",
                                }}
                            >
                                {processTemplate(el.content ?? "", bookData)}
                            </div>
                        )}

                        {el.type === "barcode" && (
                            <BarcodePreview
                                value={processTemplate(el.content ?? "", bookData)}
                                format={el.barcodeFormat ?? "CODE128"}
                                width={el.width}
                                height={el.height}
                                showText={el.showText}
                                scale={scale}
                                rotation={el.barcodeRotation}
                            />
                        )}

                        {el.type === "qrcode" && (
                            <QRPreview
                                value={processTemplate(el.content ?? "", bookData)}
                                size={Math.min(el.width, el.height)}
                                scale={scale}
                                errorLevel={el.errorLevel}
                            />
                        )}

                        {el.type === "line" && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: el.direction === "vertical" ? 0 : "50%",
                                    width: el.direction === "vertical" ? (el.lineWidth ?? 0.3) * scale * 3 : "100%",
                                    height: el.direction === "vertical" ? "100%" : (el.lineWidth ?? 0.3) * scale * 3,
                                    backgroundColor: el.lineColor ?? "#000",
                                }}
                            />
                        )}

                        {el.type === "rectangle" && (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    border: `${(el.borderWidth ?? 0.3) * scale}px solid ${el.borderColor ?? "#000"}`,
                                    backgroundColor: el.backgroundColor === "transparent" ? "transparent" : (el.backgroundColor ?? "transparent"),
                                    boxSizing: "border-box",
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// A4 Sheet Preview
// ══════════════════════════════════════════════════════════════════════════════

function A4Preview({ elements, design, bookData, scale }: {
    elements: LabelElement[];
    design: Partial<Tasarim>;
    bookData: Record<string, string>;
    scale: number;
}) {
    const pageW = design.sayfaGenislik ?? 210;
    const pageH = design.sayfaYukseklik ?? 297;
    const rows = design.satirSayisi ?? 10;
    const cols = design.sutunSayisi ?? 3;
    const mTop = design.sayfaKenarUst ?? 10;
    const mLeft = design.sayfaKenarSol ?? 5;
    const rowGap = design.satirAraligi ?? 0;
    const colGap = design.sutunAraligi ?? 0;
    const labelW = design.etiketGenislik ?? 70;
    const labelH = design.etiketYukseklik ?? 30;

    const labelScale = scale * 0.35;

    return (
        <div
            className="relative bg-white border border-gray-300 shadow-md mx-auto"
            style={{
                width: mmToPx(pageW, labelScale),
                height: mmToPx(pageH, labelScale),
            }}
        >
            {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => (
                    <div
                        key={`${r}-${c}`}
                        className="absolute"
                        style={{
                            left: mmToPx(mLeft + c * (labelW + colGap), labelScale),
                            top: mmToPx(mTop + r * (labelH + rowGap), labelScale),
                        }}
                    >
                        <LabelPreview
                            elements={elements}
                            labelW={labelW}
                            labelH={labelH}
                            bookData={bookData}
                            scale={labelScale}
                            showBorder={false}
                        />
                    </div>
                ))
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// Element Editor Panel
// ══════════════════════════════════════════════════════════════════════════════

function ElementEditor({ element, onChange, labelW, labelH }: {
    element: LabelElement;
    onChange: (el: LabelElement) => void;
    labelW: number;
    labelH: number;
}) {
    const update = (patch: Partial<LabelElement>) => onChange({ ...element, ...patch });

    const numInput = (label: string, field: keyof LabelElement, min = 0, max = 999, step = 0.5) => (
        <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground w-20 shrink-0">{label}</label>
            <input
                type="number"
                value={element[field] as number ?? 0}
                onChange={(e) => update({ [field]: parseFloat(e.target.value) || 0 })}
                min={min}
                max={max}
                step={step}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
            />
        </div>
    );

    return (
        <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Konum & Boyut (mm)</h4>
            <div className="grid grid-cols-2 gap-2">
                {numInput("X", "x", 0, labelW)}
                {numInput("Y", "y", 0, labelH)}
                {numInput("Genişlik", "width", 0.5, labelW)}
                {numInput("Yükseklik", "height", 0, labelH)}
            </div>

            {(element.type === "text" || element.type === "barcode" || element.type === "qrcode") && (
                <>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">İçerik</h4>
                    <div className="space-y-2">
                        <input
                            value={element.content ?? ""}
                            onChange={(e) => update({ content: e.target.value })}
                            placeholder="{baslik}"
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm font-mono"
                        />
                        <div className="flex flex-wrap gap-1">
                            {BOOK_FIELDS.map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => update({ content: (element.content ?? "") + `{${f.key}}` })}
                                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium hover:bg-muted/80 transition-colors"
                                    title={f.example}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {element.type === "text" && (
                <>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Metin Ayarları</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {numInput("Font (pt)", "fontSize", 4, 72, 1)}
                        {numInput("Maks. Satır", "maxLines", 1, 20, 1)}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <Select value={element.fontWeight ?? "normal"} onValueChange={(v) => update({ fontWeight: v as "normal" | "bold" })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Kalın</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={element.fontStyle ?? "normal"} onValueChange={(v) => update({ fontStyle: v as "normal" | "italic" })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="italic">İtalik</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={element.textAlign ?? "left"} onValueChange={(v) => update({ textAlign: v as "left" | "center" | "right" })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="left">Sol</SelectItem>
                                <SelectItem value="center">Orta</SelectItem>
                                <SelectItem value="right">Sağ</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-20 shrink-0">Renk</label>
                        <input
                            type="color"
                            value={element.color ?? "#000000"}
                            onChange={(e) => update({ color: e.target.value })}
                            className="h-8 w-10 rounded border border-input cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground">{element.color ?? "#000000"}</span>
                    </div>
                </>
            )}

            {element.type === "barcode" && (
                <>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Barkod Ayarları</h4>
                    <Select value={element.barcodeFormat ?? "CODE128"} onValueChange={(v) => update({ barcodeFormat: v as LabelElement["barcodeFormat"] })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CODE128">CODE128</SelectItem>
                            <SelectItem value="CODE39">CODE39</SelectItem>
                            <SelectItem value="EAN13">EAN13</SelectItem>
                            <SelectItem value="EAN8">EAN8</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={String(element.barcodeRotation ?? 0)} onValueChange={(v) => update({ barcodeRotation: parseInt(v) as 0 | 90 })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Yatay</SelectItem>
                            <SelectItem value="90">Dikey</SelectItem>
                        </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={element.showText ?? true}
                            onChange={(e) => update({ showText: e.target.checked })}
                            className="rounded"
                        />
                        Değeri göster
                    </label>
                </>
            )}

            {element.type === "qrcode" && (
                <>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">QR Kod Ayarları</h4>
                    <Select value={element.errorLevel ?? "M"} onValueChange={(v) => update({ errorLevel: v as "L" | "M" | "Q" | "H" })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="L">Düşük (L - %7)</SelectItem>
                            <SelectItem value="M">Orta (M - %15)</SelectItem>
                            <SelectItem value="Q">Yüksek (Q - %25)</SelectItem>
                            <SelectItem value="H">Çok Yüksek (H - %30)</SelectItem>
                        </SelectContent>
                    </Select>
                </>
            )}

            {element.type === "line" && (
                <>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Çizgi Ayarları</h4>
                    <Select value={element.direction ?? "horizontal"} onValueChange={(v) => update({ direction: v as "horizontal" | "vertical" })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="horizontal">Yatay</SelectItem>
                            <SelectItem value="vertical">Dikey</SelectItem>
                        </SelectContent>
                    </Select>
                    {numInput("Kalınlık", "lineWidth", 0.1, 5, 0.1)}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-20 shrink-0">Renk</label>
                        <input
                            type="color"
                            value={element.lineColor ?? "#000000"}
                            onChange={(e) => update({ lineColor: e.target.value })}
                            className="h-8 w-10 rounded border border-input cursor-pointer"
                        />
                    </div>
                </>
            )}

            {element.type === "rectangle" && (
                <>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Dikdörtgen Ayarları</h4>
                    {numInput("Kenarlık", "borderWidth", 0, 5, 0.1)}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-20 shrink-0">Kenarlık Renk</label>
                        <input
                            type="color"
                            value={element.borderColor ?? "#000000"}
                            onChange={(e) => update({ borderColor: e.target.value })}
                            className="h-8 w-10 rounded border border-input cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-20 shrink-0">Arka Plan</label>
                        <input
                            type="color"
                            value={element.backgroundColor === "transparent" ? "#ffffff" : (element.backgroundColor ?? "#ffffff")}
                            onChange={(e) => update({ backgroundColor: e.target.value })}
                            className="h-8 w-10 rounded border border-input cursor-pointer"
                        />
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                                type="checkbox"
                                checked={element.backgroundColor === "transparent"}
                                onChange={(e) => update({ backgroundColor: e.target.checked ? "transparent" : "#ffffff" })}
                                className="rounded"
                            />
                            Saydam
                        </label>
                    </div>
                </>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// Helper — element type label + icon
// ══════════════════════════════════════════════════════════════════════════════

const ELEMENT_TYPE_INFO: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    text: { label: "Metin", icon: Type },
    barcode: { label: "Barkod", icon: BarChart3 },
    qrcode: { label: "QR Kod", icon: QrCode },
    line: { label: "Çizgi", icon: Minus },
    rectangle: { label: "Dikdörtgen", icon: Square },
};

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════

export default function EtiketTasarimlariClient({ user }: { user: SessionUser }) {
    const isAdmin = user.role === "ADMIN";

    const [tasarimlar, setTasarimlar] = React.useState<Tasarim[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Designer dialog state
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<Tasarim | null>(null);

    // Form state
    const [formAdi, setFormAdi] = React.useState("");
    const [formAciklama, setFormAciklama] = React.useState("");
    const [formYaziciTuru, setFormYaziciTuru] = React.useState<PrinterType>("ETIKET_YAZICI");
    const [formLabelW, setFormLabelW] = React.useState(70);
    const [formLabelH, setFormLabelH] = React.useState(30);
    const [formPageW, setFormPageW] = React.useState(210);
    const [formPageH, setFormPageH] = React.useState(297);
    const [formRows, setFormRows] = React.useState(10);
    const [formCols, setFormCols] = React.useState(3);
    const [formMTop, setFormMTop] = React.useState(10);
    const [formMBot, setFormMBot] = React.useState(10);
    const [formMLeft, setFormMLeft] = React.useState(5);
    const [formMRight, setFormMRight] = React.useState(5);
    const [formRowGap, setFormRowGap] = React.useState(0);
    const [formColGap, setFormColGap] = React.useState(0);
    const [formVarsayilan, setFormVarsayilan] = React.useState(false);

    // Elements state
    const [elements, setElements] = React.useState<LabelElement[]>([]);
    const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);

    // Designer tabs
    const [designerTab, setDesignerTab] = React.useState<"settings" | "elements" | "preview">("elements");

    const selectedElement = elements.find((e) => e.id === selectedElementId) ?? null;

    // ── Fetch ───────────────────────────────────────────────────────────────

    const fetchTasarimlar = React.useCallback(async () => {
        try {
            const res = await fetch("/api/etiket-tasarimlari");
            if (res.ok) setTasarimlar(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchTasarimlar();
    }, [fetchTasarimlar]);

    // ── Dialog helpers ──────────────────────────────────────────────────────

    const openNew = () => {
        setEditing(null);
        setFormAdi("");
        setFormAciklama("");
        setFormYaziciTuru("ETIKET_YAZICI");
        setFormLabelW(70);
        setFormLabelH(30);
        setFormPageW(210);
        setFormPageH(297);
        setFormRows(10);
        setFormCols(3);
        setFormMTop(10);
        setFormMBot(10);
        setFormMLeft(5);
        setFormMRight(5);
        setFormRowGap(0);
        setFormColGap(0);
        setFormVarsayilan(false);
        setElements([]);
        setSelectedElementId(null);
        setDesignerTab("settings");
        setDialogOpen(true);
    };

    const openEdit = (t: Tasarim) => {
        setEditing(t);
        setFormAdi(t.adi);
        setFormAciklama(t.aciklama ?? "");
        setFormYaziciTuru(t.yaziciTuru);
        setFormLabelW(t.etiketGenislik);
        setFormLabelH(t.etiketYukseklik);
        setFormPageW(t.sayfaGenislik ?? 210);
        setFormPageH(t.sayfaYukseklik ?? 297);
        setFormRows(t.satirSayisi ?? 10);
        setFormCols(t.sutunSayisi ?? 3);
        setFormMTop(t.sayfaKenarUst ?? 10);
        setFormMBot(t.sayfaKenarAlt ?? 10);
        setFormMLeft(t.sayfaKenarSol ?? 5);
        setFormMRight(t.sayfaKenarSag ?? 5);
        setFormRowGap(t.satirAraligi ?? 0);
        setFormColGap(t.sutunAraligi ?? 0);
        setFormVarsayilan(t.varsayilan);
        try {
            setElements(JSON.parse(t.sablon) || []);
        } catch {
            setElements([]);
        }
        setSelectedElementId(null);
        setDesignerTab("elements");
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formAdi.trim()) return;
        setSaving(true);

        const payload = {
            adi: formAdi.trim(),
            aciklama: formAciklama.trim() || null,
            yaziciTuru: formYaziciTuru,
            etiketGenislik: formLabelW,
            etiketYukseklik: formLabelH,
            sayfaGenislik: formPageW,
            sayfaYukseklik: formPageH,
            satirSayisi: formRows,
            sutunSayisi: formCols,
            sayfaKenarUst: formMTop,
            sayfaKenarAlt: formMBot,
            sayfaKenarSol: formMLeft,
            sayfaKenarSag: formMRight,
            satirAraligi: formRowGap,
            sutunAraligi: formColGap,
            sablon: JSON.stringify(elements),
            varsayilan: formVarsayilan,
        };

        try {
            const res = editing
                ? await fetch(`/api/etiket-tasarimlari/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                : await fetch("/api/etiket-tasarimlari", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

            if (res.ok) {
                setDialogOpen(false);
                fetchTasarimlar();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu tasarımı silmek istediğinize emin misiniz?")) return;
        const res = await fetch(`/api/etiket-tasarimlari/${id}`, { method: "DELETE" });
        if (res.ok) fetchTasarimlar();
    };

    const handleDuplicate = (t: Tasarim) => {
        openEdit({ ...t, id: "", adi: `${t.adi} (Kopya)`, varsayilan: false });
        setEditing(null); // Force create mode
    };

    // ── Element management ──────────────────────────────────────────────────

    const addElement = (creator: () => LabelElement) => {
        const el = creator();
        setElements((prev) => [...prev, el]);
        setSelectedElementId(el.id);
    };

    const updateElement = (updated: LabelElement) => {
        setElements((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    };

    const removeElement = (id: string) => {
        setElements((prev) => prev.filter((e) => e.id !== id));
        if (selectedElementId === id) setSelectedElementId(null);
    };

    const moveElement = (id: string, dir: -1 | 1) => {
        setElements((prev) => {
            const idx = prev.findIndex((e) => e.id === id);
            if (idx < 0) return prev;
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= prev.length) return prev;
            const arr = [...prev];
            [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
            return arr;
        });
    };

    // ── Preview scale ───────────────────────────────────────────────────────

    const previewScale = React.useMemo(() => {
        const maxW = 420;
        const maxH = 300;
        const scaleW = maxW / mmToPx(formLabelW, 1);
        const scaleH = maxH / mmToPx(formLabelH, 1);
        return Math.min(scaleW, scaleH, 3);
    }, [formLabelW, formLabelH]);

    // ── A4 preset apply ─────────────────────────────────────────────────────

    const applyA4Preset = (preset: typeof A4_PRESETS[0]) => {
        setFormRows(preset.rows);
        setFormCols(preset.cols);
        setFormLabelW(preset.labelW);
        setFormLabelH(preset.labelH);
        setFormMTop(preset.top);
        setFormMLeft(preset.left);
        setFormRowGap(preset.rowGap);
        setFormColGap(preset.colGap);
    };

    const applyLabelPreset = (preset: typeof LABEL_PRESETS[0]) => {
        setFormLabelW(preset.width);
        setFormLabelH(preset.height);
    };

    // ── Design object for preview ───────────────────────────────────────────

    const designForPreview: Partial<Tasarim> = {
        etiketGenislik: formLabelW,
        etiketYukseklik: formLabelH,
        yaziciTuru: formYaziciTuru,
        sayfaGenislik: formPageW,
        sayfaYukseklik: formPageH,
        satirSayisi: formRows,
        sutunSayisi: formCols,
        sayfaKenarUst: formMTop,
        sayfaKenarAlt: formMBot,
        sayfaKenarSol: formMLeft,
        sayfaKenarSag: formMRight,
        satirAraligi: formRowGap,
        sutunAraligi: formColGap,
    };

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════════════

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Tags className="h-6 w-6" />
                            Etiket Tasarımları
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kitap etiketleri için tasarım şablonları oluşturun ve yönetin
                        </p>
                    </div>
                    {isAdmin && (
                        <Button onClick={openNew} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Yeni Tasarım
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tasarım</TableHead>
                                <TableHead>Yazıcı</TableHead>
                                <TableHead>Etiket Boyutu</TableHead>
                                <TableHead>Eleman</TableHead>
                                <TableHead>Oluşturan</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Yükleniyor...
                                    </TableCell>
                                </TableRow>
                            ) : tasarimlar.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Henüz tasarım bulunmuyor
                                    </TableCell>
                                </TableRow>
                            ) : tasarimlar.map((t) => {
                                let elCount = 0;
                                try { elCount = JSON.parse(t.sablon).length; } catch { /* */ }
                                return (
                                    <TableRow key={t.id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{t.adi}</span>
                                                {t.varsayilan && (
                                                    <Badge variant="secondary" className="gap-1 text-[10px]">
                                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                        Varsayılan
                                                    </Badge>
                                                )}
                                            </div>
                                            {t.aciklama && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{t.aciklama}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={t.yaziciTuru === "A4" ? "outline" : "secondary"}>
                                                <Printer className="h-3 w-3 mr-1" />
                                                {t.yaziciTuru === "A4" ? "A4 Sayfa" : "Etiket Yazıcı"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {t.etiketGenislik} × {t.etiketYukseklik} mm
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{elCount} eleman</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {t.olusturan ? `${t.olusturan.firstName} ${t.olusturan.lastName}` : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
                                                                {isAdmin ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{isAdmin ? "Düzenle" : "Görüntüle"}</TooltipContent>
                                                    </Tooltip>
                                                    {isAdmin && (
                                                        <>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDuplicate(t)}>
                                                                        <Copy className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Kopyala</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(t.id)}>
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Sil</TooltipContent>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* ════════════════════════════════════════════════════════════════ */}
                {/* DESIGNER DIALOG                                                */}
                {/* ════════════════════════════════════════════════════════════════ */}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] flex flex-col p-0">
                        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
                            <DialogTitle className="flex items-center gap-2">
                                <Tags className="h-5 w-5" />
                                {editing ? "Tasarımı Düzenle" : "Yeni Etiket Tasarımı"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 flex overflow-hidden">
                            {/* ── LEFT PANEL: Settings + Elements ──────────────── */}
                            <div className="w-[380px] shrink-0 border-r flex flex-col overflow-hidden">
                                {/* Tabs */}
                                <div className="flex border-b shrink-0">
                                    {([
                                        { key: "settings", label: "Ayarlar", icon: Settings2 },
                                        { key: "elements", label: "Elemanlar", icon: Layers },
                                    ] as const).map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setDesignerTab(tab.key)}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2",
                                                designerTab === tab.key
                                                    ? "border-blue-500 text-blue-600"
                                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <tab.icon className="h-4 w-4" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {designerTab === "settings" && (
                                        <>
                                            {/* Name */}
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium">Tasarım Adı *</label>
                                                <input
                                                    value={formAdi}
                                                    onChange={(e) => setFormAdi(e.target.value)}
                                                    placeholder="Standart Kitap Etiketi"
                                                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                                    disabled={!isAdmin}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium">Açıklama</label>
                                                <textarea
                                                    value={formAciklama}
                                                    onChange={(e) => setFormAciklama(e.target.value)}
                                                    placeholder="İsteğe bağlı açıklama"
                                                    rows={2}
                                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                                                    disabled={!isAdmin}
                                                />
                                            </div>

                                            {/* Printer Type */}
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium">Yazıcı Türü</label>
                                                <Select value={formYaziciTuru} onValueChange={(v) => setFormYaziciTuru(v as PrinterType)} disabled={!isAdmin}>
                                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ETIKET_YAZICI">Etiket Yazıcı</SelectItem>
                                                        <SelectItem value="A4">A4 Yazıcı</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Label Size */}
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium">Etiket Boyutu (mm)</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Genişlik</label>
                                                        <input type="number" value={formLabelW} onChange={(e) => setFormLabelW(parseFloat(e.target.value) || 0)} min={10} max={300} step={0.1} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" disabled={!isAdmin} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Yükseklik</label>
                                                        <input type="number" value={formLabelH} onChange={(e) => setFormLabelH(parseFloat(e.target.value) || 0)} min={5} max={300} step={0.1} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" disabled={!isAdmin} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1 pt-1">
                                                    {LABEL_PRESETS.map((p) => (
                                                        <button key={p.name} onClick={() => applyLabelPreset(p)} className="rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium hover:bg-muted transition-colors" disabled={!isAdmin}>
                                                            {p.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* A4 Settings */}
                                            {formYaziciTuru === "A4" && (
                                                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                                                    <h4 className="text-sm font-semibold flex items-center gap-1">
                                                        <Printer className="h-4 w-4" />
                                                        A4 Sayfa Ayarları
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {A4_PRESETS.map((p) => (
                                                            <button key={p.name} onClick={() => applyA4Preset(p)} className="rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium hover:bg-muted transition-colors" disabled={!isAdmin}>
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-xs text-muted-foreground">Satır</label>
                                                            <input type="number" value={formRows} onChange={(e) => setFormRows(parseInt(e.target.value) || 1)} min={1} max={30} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={!isAdmin} />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-muted-foreground">Sütun</label>
                                                            <input type="number" value={formCols} onChange={(e) => setFormCols(parseInt(e.target.value) || 1)} min={1} max={10} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={!isAdmin} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <div><label className="text-[10px] text-muted-foreground">Üst</label><input type="number" value={formMTop} onChange={(e) => setFormMTop(parseFloat(e.target.value) || 0)} min={0} step={0.5} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={!isAdmin} /></div>
                                                        <div><label className="text-[10px] text-muted-foreground">Alt</label><input type="number" value={formMBot} onChange={(e) => setFormMBot(parseFloat(e.target.value) || 0)} min={0} step={0.5} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={!isAdmin} /></div>
                                                        <div><label className="text-[10px] text-muted-foreground">Sol</label><input type="number" value={formMLeft} onChange={(e) => setFormMLeft(parseFloat(e.target.value) || 0)} min={0} step={0.5} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={!isAdmin} /></div>
                                                        <div><label className="text-[10px] text-muted-foreground">Sağ</label><input type="number" value={formMRight} onChange={(e) => setFormMRight(parseFloat(e.target.value) || 0)} min={0} step={0.5} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={!isAdmin} /></div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-xs text-muted-foreground">Satır Aralığı</label>
                                                            <input type="number" value={formRowGap} onChange={(e) => setFormRowGap(parseFloat(e.target.value) || 0)} min={0} step={0.5} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={!isAdmin} />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-muted-foreground">Sütun Aralığı</label>
                                                            <input type="number" value={formColGap} onChange={(e) => setFormColGap(parseFloat(e.target.value) || 0)} min={0} step={0.5} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm" disabled={!isAdmin} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Default toggle */}
                                            {isAdmin && (
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={formVarsayilan} onChange={(e) => setFormVarsayilan(e.target.checked)} className="rounded" />
                                                    <span className="text-sm">Varsayılan tasarım olarak ayarla</span>
                                                </label>
                                            )}
                                        </>
                                    )}

                                    {designerTab === "elements" && (
                                        <>
                                            {/* Add buttons */}
                                            {isAdmin && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => addElement(defaultTextElement)}>
                                                        <Type className="h-3.5 w-3.5" /> Metin
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => addElement(defaultBarcodeElement)}>
                                                        <BarChart3 className="h-3.5 w-3.5" /> Barkod
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => addElement(defaultQRElement)}>
                                                        <QrCode className="h-3.5 w-3.5" /> QR Kod
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => addElement(defaultLineElement)}>
                                                        <Minus className="h-3.5 w-3.5" /> Çizgi
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => addElement(defaultRectangleElement)}>
                                                        <Square className="h-3.5 w-3.5" /> Dikdörtgen
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Element list */}
                                            {elements.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                                    <p className="text-sm text-muted-foreground">Henüz eleman eklenmemiş</p>
                                                    {isAdmin && <p className="text-xs text-muted-foreground mt-1">Yukarıdaki butonlardan eleman ekleyin</p>}
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {elements.map((el, idx) => {
                                                        const info = ELEMENT_TYPE_INFO[el.type];
                                                        const Icon = info?.icon ?? Type;
                                                        const isSelected = selectedElementId === el.id;
                                                        return (
                                                            <div
                                                                key={el.id}
                                                                onClick={() => setSelectedElementId(isSelected ? null : el.id)}
                                                                className={cn(
                                                                    "flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-all",
                                                                    isSelected
                                                                        ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30"
                                                                        : "border-border hover:bg-muted/50"
                                                                )}
                                                            >
                                                                <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium truncate">{info?.label ?? el.type}</p>
                                                                    <p className="text-[10px] text-muted-foreground truncate font-mono">
                                                                        {el.content || `${el.width}×${el.height}mm`}
                                                                    </p>
                                                                </div>
                                                                {isAdmin && (
                                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                                        <button onClick={(e) => { e.stopPropagation(); moveElement(el.id, -1); }} disabled={idx === 0} className="p-0.5 rounded hover:bg-muted disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                                                                        <button onClick={(e) => { e.stopPropagation(); moveElement(el.id, 1); }} disabled={idx === elements.length - 1} className="p-0.5 rounded hover:bg-muted disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                                                                        <button onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-500"><Trash2 className="h-3 w-3" /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Selected element editor */}
                                            {selectedElement && isAdmin && (
                                                <div className="border-t pt-3 mt-3">
                                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                        <Settings2 className="h-4 w-4" />
                                                        Eleman Özellikleri
                                                    </h4>
                                                    <ElementEditor
                                                        element={selectedElement}
                                                        onChange={updateElement}
                                                        labelW={formLabelW}
                                                        labelH={formLabelH}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ── RIGHT PANEL: Preview ────────────────────────── */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Önizleme</span>
                                    <Badge variant="outline" className="ml-auto text-[10px]">
                                        {formLabelW} × {formLabelH} mm
                                    </Badge>
                                    {formYaziciTuru === "A4" && (
                                        <Badge variant="outline" className="text-[10px]">
                                            A4 — {formRows}×{formCols}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex-1 overflow-auto flex items-center justify-center p-6">
                                    <div className="space-y-6">
                                        {/* Single label */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground text-center">Tek Etiket</p>
                                            <div className="flex justify-center">
                                                <LabelPreview
                                                    elements={elements}
                                                    labelW={formLabelW}
                                                    labelH={formLabelH}
                                                    bookData={SAMPLE_BOOK}
                                                    scale={previewScale}
                                                    selected={selectedElementId}
                                                    onSelect={setSelectedElementId}
                                                />
                                            </div>
                                        </div>

                                        {/* A4 page preview */}
                                        {formYaziciTuru === "A4" && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground text-center">A4 Sayfa Düzeni</p>
                                                <A4Preview
                                                    elements={elements}
                                                    design={designForPreview}
                                                    bookData={SAMPLE_BOOK}
                                                    scale={previewScale}
                                                />
                                            </div>
                                        )}

                                        {/* Sample data info */}
                                        <div className="rounded-lg border bg-background p-3 max-w-sm mx-auto">
                                            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Örnek Veri</p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                                {BOOK_FIELDS.slice(0, 8).map((f) => (
                                                    <div key={f.key} className="flex justify-between text-[10px]">
                                                        <span className="text-muted-foreground">{f.label}:</span>
                                                        <span className="font-mono truncate ml-1">{f.example}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        {isAdmin && (
                            <DialogFooter className="px-6 py-3 border-t shrink-0">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                                <Button onClick={handleSave} disabled={saving || !formAdi.trim()} className="gap-2">
                                    {saving ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    {editing ? "Güncelle" : "Kaydet"}
                                </Button>
                            </DialogFooter>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
