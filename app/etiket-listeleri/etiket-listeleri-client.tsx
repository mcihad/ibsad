"use client";

import * as React from "react";
import {
    List, Plus, Pencil, Trash2, FileDown, BookOpen, Eye,
    ChevronRight, Minus as MinusIcon, Plus as PlusIcon,
    Check, X, Loader2, Printer, Search,
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
import { DashboardLayout } from "@/components/dashboard-layout";
import { cn } from "@/lib/utils";
import { type LabelElement, SAMPLE_BOOK, BOOK_FIELDS } from "@/lib/etiket-types";
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

interface Kutuphane {
    id: string;
    adi: string;
    kodu: string;
}

interface Tasarim {
    id: string;
    adi: string;
    yaziciTuru: string;
    etiketGenislik: number;
    etiketYukseklik: number;
    sablon?: string;
    sayfaGenislik?: number | null;
    sayfaYukseklik?: number | null;
    satirSayisi?: number | null;
    sutunSayisi?: number | null;
    sayfaKenarUst?: number | null;
    sayfaKenarAlt?: number | null;
    sayfaKenarSol?: number | null;
    sayfaKenarSag?: number | null;
    satirAraligi?: number | null;
    sutunAraligi?: number | null;
}

interface ListeKitap {
    id: string;
    adet: number;
    sira: number;
    kitap: {
        id: string;
        uuid: string;
        baslik: string;
        yazarlar: string | null;
        isbn: string | null;
        barkod: string | null;
        demirbasNo: string | null;
        yayinevi: string | null;
        yayinYili: number | null;
        dil: string | null;
        sayfaSayisi: number | null;
        kutuphane: Kutuphane;
    };
}

interface Liste {
    id: string;
    uuid: string;
    adi: string;
    aciklama: string | null;
    tasarim: Tasarim;
    kutuphane: Kutuphane;
    olusturan?: { id: string; firstName: string; lastName: string } | null;
    _count: { kitaplar: number };
    kitaplar?: ListeKitap[];
    createdAt: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Inline barcode/QR preview (reused from tasarimlar)
// ══════════════════════════════════════════════════════════════════════════════

function BarcodePreviewMini({ value, format, width, height, showText, scale, rotation }: {
    value: string; format: string; width: number; height: number; showText?: boolean; scale: number; rotation?: 0 | 90;
}) {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const isVertical = rotation === 90;
    const barcodeW = isVertical ? height : width;
    const barcodeH = isVertical ? width : height;

    React.useEffect(() => {
        if (!svgRef.current || !value) return;
        import("jsbarcode").then((JsBarcode) => {
            try {
                JsBarcode.default(svgRef.current!, value, {
                    format, width: Math.max(1, scale * 0.8), height: mmToPx(barcodeH, scale) * 0.7,
                    displayValue: showText ?? true, fontSize: Math.max(8, 10 * scale), margin: 0, background: "transparent",
                });
            } catch { if (svgRef.current) svgRef.current.innerHTML = ""; }
        });
    }, [value, format, barcodeW, barcodeH, showText, scale]);

    return <svg ref={svgRef} style={{
        width: mmToPx(barcodeW, scale), height: mmToPx(barcodeH, scale), overflow: "hidden",
        ...(isVertical ? {
            transform: "rotate(90deg)", transformOrigin: "top left",
            position: "absolute" as const, left: mmToPx(width, scale), top: 0,
        } : {}),
    }} />;
}

function QRPreviewMini({ value, size, scale, errorLevel }: {
    value: string; size: number; scale: number; errorLevel?: string;
}) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    React.useEffect(() => {
        if (!canvasRef.current || !value) return;
        import("qrcode").then((QRCode) => {
            QRCode.toCanvas(canvasRef.current!, value, {
                width: mmToPx(size, scale), margin: 0,
                errorCorrectionLevel: (errorLevel as "L" | "M" | "Q" | "H") || "M",
                color: { dark: "#000000", light: "#ffffff" },
            }).catch(() => { });
        });
    }, [value, size, scale, errorLevel]);
    return <canvas ref={canvasRef} style={{ width: mmToPx(size, scale), height: mmToPx(size, scale) }} />;
}

function LabelPreviewMini({ elements, labelW, labelH, bookData, scale }: {
    elements: LabelElement[]; labelW: number; labelH: number; bookData: Record<string, string>; scale: number;
}) {
    return (
        <div className="relative bg-white border border-gray-200" style={{ width: mmToPx(labelW, scale), height: mmToPx(labelH, scale), overflow: "hidden" }}>
            {elements.map((el) => (
                <div key={el.id} className="absolute" style={{ left: mmToPx(el.x, scale), top: mmToPx(el.y, scale), width: mmToPx(el.width, scale), height: mmToPx(el.height, scale) }}>
                    {el.type === "text" && (
                        <div className="leading-tight overflow-hidden" style={{
                            fontSize: (el.fontSize ?? 8) * scale, fontWeight: el.fontWeight === "bold" ? 700 : 400,
                            fontStyle: el.fontStyle === "italic" ? "italic" : "normal", textAlign: (el.textAlign ?? "left") as CanvasTextAlign,
                            color: el.color ?? "#000", width: mmToPx(el.width, scale), height: mmToPx(el.height, scale),
                            display: "-webkit-box", WebkitLineClamp: el.maxLines ?? 999, WebkitBoxOrient: "vertical",
                        }}>
                            {processTemplate(el.content ?? "", bookData)}
                        </div>
                    )}
                    {el.type === "barcode" && <BarcodePreviewMini value={processTemplate(el.content ?? "", bookData)} format={el.barcodeFormat ?? "CODE128"} width={el.width} height={el.height} showText={el.showText} scale={scale} rotation={el.barcodeRotation} />}
                    {el.type === "qrcode" && <QRPreviewMini value={processTemplate(el.content ?? "", bookData)} size={Math.min(el.width, el.height)} scale={scale} errorLevel={el.errorLevel} />}
                    {el.type === "line" && <div style={{ position: "absolute", left: 0, top: el.direction === "vertical" ? 0 : "50%", width: el.direction === "vertical" ? (el.lineWidth ?? 0.3) * scale * 3 : "100%", height: el.direction === "vertical" ? "100%" : (el.lineWidth ?? 0.3) * scale * 3, backgroundColor: el.lineColor ?? "#000" }} />}
                    {el.type === "rectangle" && <div style={{ width: "100%", height: "100%", border: `${(el.borderWidth ?? 0.3) * scale}px solid ${el.borderColor ?? "#000"}`, backgroundColor: el.backgroundColor === "transparent" ? "transparent" : (el.backgroundColor ?? "transparent"), boxSizing: "border-box" }} />}
                </div>
            ))}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// PDF Export
// ══════════════════════════════════════════════════════════════════════════════

function bookToData(kitap: ListeKitap["kitap"]): Record<string, string> {
    return {
        baslik: kitap.baslik ?? "", yazarlar: kitap.yazarlar ?? "", isbn: kitap.isbn ?? "",
        barkod: kitap.barkod ?? "", demirbasNo: kitap.demirbasNo ?? "", yayinevi: kitap.yayinevi ?? "",
        yayinYili: String(kitap.yayinYili ?? ""), dil: kitap.dil ?? "", sayfaSayisi: String(kitap.sayfaSayisi ?? ""),
        kutuphaneAdi: kitap.kutuphane?.adi ?? "", kutuphaneKodu: kitap.kutuphane?.kodu ?? "", uuid: kitap.uuid ?? "",
    };
}

async function generateBarcodeDataUrl(value: string, format: string, _w: number, h: number, showText: boolean = false): Promise<{ dataUrl: string; naturalWidth: number; naturalHeight: number }> {
    const canvas = document.createElement("canvas");
    const JsBarcode = (await import("jsbarcode")).default;
    try {
        JsBarcode(canvas, value, { format, width: 2, height: h, displayValue: showText, margin: 0 });
    } catch {
        canvas.width = _w;
        canvas.height = h;
    }
    return { dataUrl: canvas.toDataURL("image/png"), naturalWidth: canvas.width, naturalHeight: canvas.height };
}

async function generateQRDataUrl(value: string, size: number, errorLevel: string = "M"): Promise<string> {
    const QRCode = await import("qrcode");
    return QRCode.toDataURL(value, { width: size, margin: 0, errorCorrectionLevel: errorLevel as "L" | "M" | "Q" | "H" });
}

async function exportPDF(
    tasarim: Tasarim,
    kitaplar: ListeKitap[],
) {
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.jsPDF;

    let elements: LabelElement[] = [];
    try { elements = JSON.parse(tasarim.sablon ?? "[]"); } catch { /* */ }

    const labelW = tasarim.etiketGenislik;
    const labelH = tasarim.etiketYukseklik;

    // Build flat list of books (respecting adet = quantity)
    const allBooks: ListeKitap["kitap"][] = [];
    for (const lk of kitaplar) {
        for (let i = 0; i < (lk.adet || 1); i++) {
            allBooks.push(lk.kitap);
        }
    }

    if (allBooks.length === 0) return;

    if (tasarim.yaziciTuru === "A4") {
        const pageW = tasarim.sayfaGenislik ?? 210;
        const pageH = tasarim.sayfaYukseklik ?? 297;
        const rows = tasarim.satirSayisi ?? 10;
        const cols = tasarim.sutunSayisi ?? 3;
        const mTop = tasarim.sayfaKenarUst ?? 10;
        const mLeft = tasarim.sayfaKenarSol ?? 5;
        const rowGap = tasarim.satirAraligi ?? 0;
        const colGap = tasarim.sutunAraligi ?? 0;

        const labelsPerPage = rows * cols;
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageW, pageH] });

        for (let i = 0; i < allBooks.length; i++) {
            if (i > 0 && i % labelsPerPage === 0) pdf.addPage();
            const posOnPage = i % labelsPerPage;
            const row = Math.floor(posOnPage / cols);
            const col = posOnPage % cols;
            const x = mLeft + col * (labelW + colGap);
            const y = mTop + row * (labelH + rowGap);

            await renderLabelToPDF(pdf, elements, bookToData(allBooks[i]), x, y, labelW, labelH);
        }

        pdf.save("etiketler.pdf");
    } else {
        // Label printer: each book = separate page
        const pdf = new jsPDF({ orientation: labelW > labelH ? "landscape" : "portrait", unit: "mm", format: [labelW, labelH] });

        for (let i = 0; i < allBooks.length; i++) {
            if (i > 0) pdf.addPage([labelW, labelH]);
            await renderLabelToPDF(pdf, elements, bookToData(allBooks[i]), 0, 0, labelW, labelH);
        }

        pdf.save("etiketler.pdf");
    }
}

async function renderLabelToPDF(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdf: any,
    elements: LabelElement[],
    bookData: Record<string, string>,
    offsetX: number,
    offsetY: number,
    _labelW: number,
    _labelH: number,
) {
    for (const el of elements) {
        const x = offsetX + el.x;
        const y = offsetY + el.y;

        if (el.type === "text") {
            const text = processTemplate(el.content ?? "", bookData);
            const fontSize = el.fontSize ?? 8;
            pdf.setFontSize(fontSize);
            if (el.fontWeight === "bold") pdf.setFont("helvetica", "bold");
            else pdf.setFont("helvetica", "normal");
            pdf.setTextColor(el.color ?? "#000000");

            const align = el.textAlign ?? "left";
            let textX = x;
            if (align === "center") textX = x + el.width / 2;
            else if (align === "right") textX = x + el.width;

            const lines = pdf.splitTextToSize(text, el.width);
            const maxLines = el.maxLines ?? 999;
            const trimmed = lines.slice(0, maxLines);
            pdf.text(trimmed, textX, y + fontSize * 0.35, { align, maxWidth: el.width });
        }

        if (el.type === "barcode") {
            const value = processTemplate(el.content ?? "", bookData);
            if (value) {
                try {
                    const isVertical = el.barcodeRotation === 90;
                    const showText = el.showText ?? true;

                    if (isVertical) {
                        // Generate barcode in horizontal orientation with swapped dimensions
                        const { dataUrl, naturalWidth, naturalHeight } = await generateBarcodeDataUrl(
                            value, el.barcodeFormat ?? "CODE128", el.height * 3, el.width * 3, showText
                        );
                        // Rotate on canvas
                        const tmpImg = new window.Image();
                        tmpImg.src = dataUrl;
                        await new Promise<void>((resolve) => { tmpImg.onload = () => resolve(); });
                        const rotCanvas = document.createElement("canvas");
                        rotCanvas.width = naturalHeight;
                        rotCanvas.height = naturalWidth;
                        const rotCtx = rotCanvas.getContext("2d")!;
                        rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
                        rotCtx.rotate(Math.PI / 2);
                        rotCtx.drawImage(tmpImg, -naturalWidth / 2, -naturalHeight / 2);
                        const rotatedDataUrl = rotCanvas.toDataURL("image/png");
                        // Fit rotated image into el.width × el.height preserving aspect ratio
                        const rotAspect = rotCanvas.width / rotCanvas.height;
                        const boxAspect = el.width / el.height;
                        let finalW = el.width;
                        let finalH = el.height;
                        if (rotAspect > boxAspect) {
                            finalH = el.width / rotAspect;
                        } else {
                            finalW = el.height * rotAspect;
                        }
                        const offsetX = (el.width - finalW) / 2;
                        const offsetY = (el.height - finalH) / 2;
                        pdf.addImage(rotatedDataUrl, "PNG", x + offsetX, y + offsetY, finalW, finalH);
                    } else {
                        const { dataUrl, naturalWidth, naturalHeight } = await generateBarcodeDataUrl(
                            value, el.barcodeFormat ?? "CODE128", el.width * 3, el.height * 3, showText
                        );
                        // Fit into el.width × el.height preserving aspect ratio
                        const barcodeAspect = naturalWidth / naturalHeight;
                        const boxAspect = el.width / el.height;
                        let imgW = el.width;
                        let imgH = el.height;
                        if (barcodeAspect > boxAspect) {
                            imgH = el.width / barcodeAspect;
                        } else {
                            imgW = el.height * barcodeAspect;
                        }
                        const imgX = (el.width - imgW) / 2;
                        const imgY = (el.height - imgH) / 2;
                        pdf.addImage(dataUrl, "PNG", x + imgX, y + imgY, imgW, imgH);
                    }
                } catch { /* ignore */ }
            }
        }

        if (el.type === "qrcode") {
            const value = processTemplate(el.content ?? "", bookData);
            if (value) {
                try {
                    const size = Math.min(el.width, el.height);
                    const dataUrl = await generateQRDataUrl(value, size * 10, el.errorLevel);
                    pdf.addImage(dataUrl, "PNG", x, y, size, size);
                } catch { /* ignore */ }
            }
        }

        if (el.type === "line") {
            pdf.setDrawColor(el.lineColor ?? "#000000");
            pdf.setLineWidth(el.lineWidth ?? 0.3);
            if (el.direction === "vertical") {
                pdf.line(x, y, x, y + el.height);
            } else {
                pdf.line(x, y, x + el.width, y);
            }
        }

        if (el.type === "rectangle") {
            pdf.setDrawColor(el.borderColor ?? "#000000");
            pdf.setLineWidth(el.borderWidth ?? 0.3);
            if (el.backgroundColor && el.backgroundColor !== "transparent") {
                pdf.setFillColor(el.backgroundColor);
                pdf.rect(x, y, el.width, el.height, "FD");
            } else {
                pdf.rect(x, y, el.width, el.height, "S");
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════

export default function EtiketListeleriClient({ user }: { user: SessionUser }) {
    const isAdmin = user.role === "ADMIN";

    const [listeler, setListeler] = React.useState<Liste[]>([]);
    const [tasarimlar, setTasarimlar] = React.useState<Tasarim[]>([]);
    const [kutuphaneler, setKutuphaneler] = React.useState<Kutuphane[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Create/Edit dialog
    const [dlgOpen, setDlgOpen] = React.useState(false);
    const [editingListe, setEditingListe] = React.useState<Liste | null>(null);
    const [formAdi, setFormAdi] = React.useState("");
    const [formAciklama, setFormAciklama] = React.useState("");
    const [formTasarimId, setFormTasarimId] = React.useState("");
    const [formKutuphaneId, setFormKutuphaneId] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    // Detail/preview dialog
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [detailListe, setDetailListe] = React.useState<Liste | null>(null);
    const [detailLoading, setDetailLoading] = React.useState(false);
    const [exporting, setExporting] = React.useState(false);

    // Book search for adding to list
    const [searchQuery, setSearchQuery] = React.useState("");
    const [searchResults, setSearchResults] = React.useState<ListeKitap["kitap"][]>([]);
    const [searchLoading, setSearchLoading] = React.useState(false);

    // ── Fetch ───────────────────────────────────────────────────────────────

    const fetchAll = React.useCallback(async () => {
        try {
            const [listRes, tasRes, kutRes] = await Promise.all([
                fetch("/api/etiket-listeleri"),
                fetch("/api/etiket-tasarimlari"),
                isAdmin ? fetch("/api/kutuphaneler") : Promise.resolve(null),
            ]);
            if (listRes.ok) setListeler(await listRes.json());
            if (tasRes.ok) setTasarimlar(await tasRes.json());
            if (kutRes?.ok) setKutuphaneler(await kutRes.json());
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    React.useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ── Create/Edit ─────────────────────────────────────────────────────────

    const openNew = () => {
        setEditingListe(null);
        setFormAdi("");
        setFormAciklama("");
        setFormTasarimId(tasarimlar[0]?.id ?? "");
        setFormKutuphaneId(user.kutuphaneId ?? kutuphaneler[0]?.id ?? "");
        setDlgOpen(true);
    };

    const openEdit = (l: Liste) => {
        setEditingListe(l);
        setFormAdi(l.adi);
        setFormAciklama(l.aciklama ?? "");
        setFormTasarimId(l.tasarim.id);
        setFormKutuphaneId(l.kutuphane.id);
        setDlgOpen(true);
    };

    const handleSave = async () => {
        if (!formAdi.trim() || !formTasarimId) return;
        setSaving(true);
        try {
            const payload = { adi: formAdi.trim(), aciklama: formAciklama.trim() || null, tasarimId: formTasarimId, kutuphaneId: formKutuphaneId || undefined };
            const res = editingListe
                ? await fetch(`/api/etiket-listeleri/${editingListe.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                : await fetch("/api/etiket-listeleri", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (res.ok) { setDlgOpen(false); fetchAll(); }
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu listeyi silmek istediğinize emin misiniz?")) return;
        const res = await fetch(`/api/etiket-listeleri/${id}`, { method: "DELETE" });
        if (res.ok) fetchAll();
    };

    // ── Detail / Preview ────────────────────────────────────────────────────

    const openDetail = async (l: Liste) => {
        setDetailLoading(true);
        setDetailOpen(true);
        setSearchQuery("");
        setSearchResults([]);
        try {
            const res = await fetch(`/api/etiket-listeleri/${l.id}`);
            if (res.ok) setDetailListe(await res.json());
        } finally {
            setDetailLoading(false);
        }
    };

    const refreshDetail = async () => {
        if (!detailListe) return;
        const res = await fetch(`/api/etiket-listeleri/${detailListe.id}`);
        if (res.ok) {
            setDetailListe(await res.json());
            fetchAll(); // refresh counts in main list
        }
    };

    // ── Add/remove books ────────────────────────────────────────────────────

    const searchBooks = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        try {
            const res = await fetch(`/api/kitaplar?search=${encodeURIComponent(searchQuery)}`);
            if (res.ok) setSearchResults(await res.json());
        } finally {
            setSearchLoading(false);
        }
    };

    const addBookToList = async (kitapId: string) => {
        if (!detailListe) return;
        await fetch(`/api/etiket-listeleri/${detailListe.id}/kitaplar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kitapId }),
        });
        refreshDetail();
    };

    const removeBookFromList = async (itemId: string) => {
        if (!detailListe) return;
        await fetch(`/api/etiket-listeleri/${detailListe.id}/kitaplar?itemId=${itemId}`, { method: "DELETE" });
        refreshDetail();
    };

    const updateQty = async (lk: ListeKitap, delta: number) => {
        if (!detailListe) return;
        const newAdet = Math.max(1, lk.adet + delta);
        await fetch(`/api/etiket-listeleri/${detailListe.id}/kitaplar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kitapId: lk.kitap.id, adet: newAdet }),
        });
        refreshDetail();
    };

    // ── Export PDF ──────────────────────────────────────────────────────────

    const handleExportPDF = async () => {
        if (!detailListe?.kitaplar || !detailListe.tasarim) return;
        setExporting(true);
        try {
            // Fetch full tasarim data for sablon
            const res = await fetch(`/api/etiket-tasarimlari/${detailListe.tasarim.id}`);
            if (!res.ok) return;
            const fullTasarim = await res.json();
            await exportPDF(fullTasarim, detailListe.kitaplar);
        } finally {
            setExporting(false);
        }
    };

    // ── Preview data ────────────────────────────────────────────────────────

    const detailElements: LabelElement[] = React.useMemo(() => {
        if (!detailListe?.tasarim?.sablon) return [];
        try { return JSON.parse(detailListe.tasarim.sablon); } catch { return []; }
    }, [detailListe]);

    const previewScale = React.useMemo(() => {
        if (!detailListe?.tasarim) return 1;
        const maxW = 300;
        return maxW / mmToPx(detailListe.tasarim.etiketGenislik, 1);
    }, [detailListe]);

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
                            <List className="h-6 w-6" />
                            Etiket Listeleri
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Yazdırılacak kitap etiket listelerini oluşturun ve yönetin
                        </p>
                    </div>
                    <Button onClick={openNew} className="gap-2" disabled={tasarimlar.length === 0}>
                        <Plus className="h-4 w-4" />
                        Yeni Liste
                    </Button>
                </div>

                {tasarimlar.length === 0 && !loading && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-sm text-amber-700 dark:text-amber-400">
                        Etiket listesi oluşturmak için önce en az bir etiket tasarımı gereklidir.
                    </div>
                )}

                {/* Table */}
                <div className="rounded-xl border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Liste</TableHead>
                                <TableHead>Tasarım</TableHead>
                                <TableHead>Kütüphane</TableHead>
                                <TableHead>Kitap</TableHead>
                                <TableHead>Oluşturan</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Yükleniyor...</TableCell></TableRow>
                            ) : listeler.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Henüz liste bulunmuyor</TableCell></TableRow>
                            ) : listeler.map((l) => (
                                <TableRow key={l.id} className="group cursor-pointer" onClick={() => openDetail(l)}>
                                    <TableCell>
                                        <div className="font-medium">{l.adi}</div>
                                        {l.aciklama && <p className="text-xs text-muted-foreground mt-0.5">{l.aciklama}</p>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="gap-1">
                                            <Printer className="h-3 w-3" />
                                            {l.tasarim.adi}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{l.kutuphane.adi}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            {l._count.kitaplar} kitap
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {l.olusturan ? `${l.olusturan.firstName} ${l.olusturan.lastName}` : "—"}
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDetail(l)}>
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(l)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(l.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* ════════════════════════════════════════════════════════════════ */}
                {/* CREATE / EDIT DIALOG                                           */}
                {/* ════════════════════════════════════════════════════════════════ */}

                <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingListe ? "Listeyi Düzenle" : "Yeni Etiket Listesi"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Liste Adı *</label>
                                <input value={formAdi} onChange={(e) => setFormAdi(e.target.value)} placeholder="Merkez Kütüphane — Mart 2026" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Açıklama</label>
                                <input value={formAciklama} onChange={(e) => setFormAciklama(e.target.value)} placeholder="İsteğe bağlı" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Etiket Tasarımı *</label>
                                <Select value={formTasarimId} onValueChange={setFormTasarimId}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Tasarım seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {tasarimlar.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.adi} — {t.etiketGenislik}×{t.etiketYukseklik}mm ({t.yaziciTuru === "A4" ? "A4" : "Etiket"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {isAdmin && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Kütüphane *</label>
                                    <Select value={formKutuphaneId} onValueChange={setFormKutuphaneId}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Kütüphane seçin" /></SelectTrigger>
                                        <SelectContent>
                                            {kutuphaneler.map((k) => (
                                                <SelectItem key={k.id} value={k.id}>{k.adi}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDlgOpen(false)}>İptal</Button>
                            <Button onClick={handleSave} disabled={saving || !formAdi.trim() || !formTasarimId} className="gap-2">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                {editingListe ? "Güncelle" : "Oluştur"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ════════════════════════════════════════════════════════════════ */}
                {/* DETAIL / PREVIEW DIALOG                                        */}
                {/* ════════════════════════════════════════════════════════════════ */}

                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="max-w-[90vw] w-[1000px] h-[85vh] flex flex-col p-0">
                        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
                            <DialogTitle className="flex items-center gap-2">
                                <List className="h-5 w-5" />
                                {detailListe?.adi ?? "Etiket Listesi"}
                                {detailListe?.tasarim && (
                                    <Badge variant="secondary" className="ml-2 gap-1">
                                        <Printer className="h-3 w-3" />
                                        {detailListe.tasarim.adi}
                                    </Badge>
                                )}
                            </DialogTitle>
                        </DialogHeader>

                        {detailLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : detailListe ? (
                            <div className="flex-1 flex overflow-hidden">
                                {/* Left: book list + search */}
                                <div className="w-[55%] flex flex-col overflow-hidden border-r">
                                    {/* Search bar */}
                                    <div className="p-3 border-b shrink-0">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && searchBooks()}
                                                    placeholder="Kitap ara (başlık, ISBN, barkod...)"
                                                    className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
                                                />
                                            </div>
                                            <Button size="sm" variant="outline" onClick={searchBooks} disabled={searchLoading} className="h-9">
                                                {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                            </Button>
                                        </div>

                                        {/* Search results */}
                                        {searchResults.length > 0 && (
                                            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border bg-muted/30">
                                                {searchResults.map((book) => {
                                                    const alreadyAdded = detailListe.kitaplar?.some((lk) => lk.kitap.id === book.id);
                                                    return (
                                                        <div key={book.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 text-sm border-b last:border-b-0">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{book.baslik}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{book.yazarlar || "—"} · {book.barkod || book.isbn || "—"}</p>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant={alreadyAdded ? "secondary" : "default"}
                                                                className="h-7 text-xs shrink-0 gap-1"
                                                                onClick={() => addBookToList(book.id)}
                                                                disabled={alreadyAdded}
                                                            >
                                                                {alreadyAdded ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                                                {alreadyAdded ? "Eklendi" : "Ekle"}
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Book list */}
                                    <div className="flex-1 overflow-y-auto">
                                        {!detailListe.kitaplar || detailListe.kitaplar.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                                <p className="text-sm text-muted-foreground">Listede kitap bulunmuyor</p>
                                                <p className="text-xs text-muted-foreground mt-1">Yukarıdan arama yaparak kitap ekleyin</p>
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-8">#</TableHead>
                                                        <TableHead>Kitap</TableHead>
                                                        <TableHead className="w-28 text-center">Adet</TableHead>
                                                        <TableHead className="w-10"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {detailListe.kitaplar.map((lk, idx) => (
                                                        <TableRow key={lk.id}>
                                                            <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                                                            <TableCell>
                                                                <p className="text-sm font-medium truncate max-w-[250px]">{lk.kitap.baslik}</p>
                                                                <p className="text-xs text-muted-foreground">{lk.kitap.barkod || lk.kitap.isbn || lk.kitap.demirbasNo || "—"}</p>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button onClick={() => updateQty(lk, -1)} className="h-6 w-6 rounded border flex items-center justify-center hover:bg-muted"><MinusIcon className="h-3 w-3" /></button>
                                                                    <span className="w-8 text-center text-sm font-medium">{lk.adet}</span>
                                                                    <button onClick={() => updateQty(lk, 1)} className="h-6 w-6 rounded border flex items-center justify-center hover:bg-muted"><PlusIcon className="h-3 w-3" /></button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <button onClick={() => removeBookFromList(lk.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-500">
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                </div>

                                {/* Right: preview + export */}
                                <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
                                    <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Önizleme</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleExportPDF}
                                            disabled={exporting || !detailListe.kitaplar?.length}
                                            className="gap-1.5 h-8"
                                        >
                                            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                                            PDF İndir
                                        </Button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto flex flex-col items-center p-6 gap-4">
                                        {detailListe.kitaplar && detailListe.kitaplar.length > 0 ? (
                                            <>
                                                <p className="text-xs text-muted-foreground">İlk 6 etiket önizlemesi</p>
                                                <div className="flex flex-wrap gap-3 justify-center">
                                                    {detailListe.kitaplar.slice(0, 6).map((lk) => (
                                                        <div key={lk.id} className="space-y-1">
                                                            <LabelPreviewMini
                                                                elements={detailElements}
                                                                labelW={detailListe.tasarim.etiketGenislik}
                                                                labelH={detailListe.tasarim.etiketYukseklik}
                                                                bookData={bookToData(lk.kitap)}
                                                                scale={previewScale}
                                                            />
                                                            <p className="text-[9px] text-muted-foreground text-center truncate max-w-[150px]">{lk.kitap.baslik}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 rounded-lg border bg-background p-3 text-center">
                                                    <p className="text-sm font-medium">Toplam: {detailListe.kitaplar.reduce((s, lk) => s + lk.adet, 0)} etiket</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {detailListe.kitaplar.length} farklı kitap · {detailListe.tasarim.yaziciTuru === "A4" ? "A4 sayfa" : "Etiket yazıcı"}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center">
                                                <p className="text-sm text-muted-foreground">Kitap ekleyerek önizlemeyi görün</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
