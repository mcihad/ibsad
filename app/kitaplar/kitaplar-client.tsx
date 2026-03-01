"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    BookOpen,
    BookCheck,
    BookX,
    AlertTriangle,
    Loader2,
    ClipboardPaste,
    Tags,
    Check,
    Eye,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Kitap {
    id: string;
    isbn: string | null;
    baslik: string;
    demirbasNo: string | null;
    barkod: string | null;
    yayinevi: string | null;
    dil: string | null;
    yayinYili: number | null;
    sayfaSayisi: number | null;
    durum: string;
    fizikselDurum: string;
    ozet: string | null;
    notlar: string | null;
    yazarlar: string | null;
    aktif: boolean;
    kutuphaneId: string;
    kutuphane: { id: string; adi: string; kodu: string };
    createdAt: string;
}

interface Kutuphane {
    id: string;
    adi: string;
    kodu: string;
}

const durumLabels: Record<string, string> = {
    MEVCUT: "Mevcut",
    ODUNC: "Ödünç",
    KAYIP: "Kayıp",
    HASARLI: "Hasarlı",
    AYIKLANDI: "Ayıklandı",
};

const durumColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    MEVCUT: "default",
    ODUNC: "secondary",
    KAYIP: "destructive",
    HASARLI: "destructive",
    AYIKLANDI: "outline",
};

const fizikselDurumLabels: Record<string, string> = {
    MUKEMMEL: "Mükemmel",
    COK_IYI: "Çok İyi",
    IYI: "İyi",
    ORTA: "Orta",
    KOTU: "Kötü",
};

const emptyForm = {
    isbn: "",
    baslik: "",
    demirbasNo: "",
    barkod: "",
    yayinevi: "",
    dil: "",
    yayinYili: "",
    sayfaSayisi: "",
    durum: "MEVCUT",
    fizikselDurum: "IYI",
    ozet: "",
    notlar: "",
    yazarlar: "",
    kutuphaneId: "",
};

// ── Autocomplete Input ──────────────────────────────────────────────────────
function AutocompleteInput({ value, onChange, field, placeholder }: {
    value: string;
    onChange: (v: string) => void;
    field: "yazarlar" | "yayinevi";
    placeholder?: string;
}) {
    const [suggestions, setSuggestions] = React.useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const fetchSuggestions = React.useCallback(async (q: string) => {
        if (q.length < 3) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/kitaplar/autocomplete?field=${field}&q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(Array.isArray(data) ? data : []);
                setShowSuggestions(true);
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [field]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fetchSuggestions(val), 300);
    };

    const handleSelect = (item: string) => {
        onChange(item);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // Close dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    value={value}
                    onChange={handleChange}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    placeholder={placeholder}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95">
                    {suggestions.map((item, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer truncate"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function KitaplarClient({ user }: { user: SessionUser }) {
    const [kitaplar, setKitaplar] = React.useState<Kitap[]>([]);
    const [kutuphaneler, setKutuphaneler] = React.useState<Kutuphane[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [filterDurum, setFilterDurum] = React.useState("");
    const [filterKutuphane, setFilterKutuphane] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [pageSize] = React.useState(50);
    const [total, setTotal] = React.useState(0);
    const [stats, setStats] = React.useState<Record<string, number>>({ total: 0 });
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<Kitap | null>(null);
    const [deleting, setDeleting] = React.useState<Kitap | null>(null);
    const [form, setForm] = React.useState(emptyForm);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [marcDialogOpen, setMarcDialogOpen] = React.useState(false);
    const [marcText, setMarcText] = React.useState("");
    const [marcError, setMarcError] = React.useState("");

    // Etiket Listesi entegrasyonu
    const [etiketListeleri, setEtiketListeleri] = React.useState<{ id: string; adi: string; _count: { kitaplar: number } }[]>([]);
    const [etiketDialogOpen, setEtiketDialogOpen] = React.useState(false);
    const [etiketKitapId, setEtiketKitapId] = React.useState<string | null>(null);
    const [etiketAdding, setEtiketAdding] = React.useState(false);
    const [etiketSuccess, setEtiketSuccess] = React.useState<string | null>(null);

    // Barcode lookup state
    const [barcodeSearching, setBarcodeSearching] = React.useState(false);
    const [barcodeMessage, setBarcodeMessage] = React.useState<string | null>(null);

    // Etiket listelerini yükle
    const fetchEtiketListeleri = React.useCallback(async () => {
        try {
            const res = await fetch("/api/etiket-listeleri");
            if (res.ok) {
                const data = await res.json();
                setEtiketListeleri(data);
            }
        } catch { /* ignore */ }
    }, []);

    React.useEffect(() => {
        if (user.role !== "MEMUR") fetchEtiketListeleri();
    }, [fetchEtiketListeleri, user.role]);

    const handleAddToEtiketListesi = async (listeId: string) => {
        if (!etiketKitapId) return;
        setEtiketAdding(true);
        try {
            const res = await fetch(`/api/etiket-listeleri/${listeId}/kitaplar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kitapId: etiketKitapId }),
            });
            if (res.ok) {
                setEtiketDialogOpen(false);
                setEtiketKitapId(null);
                setEtiketSuccess("Kitap etiket listesine eklendi");
                setTimeout(() => setEtiketSuccess(null), 3000);
                fetchEtiketListeleri();
            }
        } finally {
            setEtiketAdding(false);
        }
    };

    const openEtiketDialog = (kitapId: string) => {
        setEtiketKitapId(kitapId);
        if (etiketListeleri.length === 1) {
            // Tek liste varsa direkt ekle
            handleAddToEtiketListesi_single(etiketListeleri[0].id, kitapId);
        } else if (etiketListeleri.length > 1) {
            setEtiketDialogOpen(true);
        }
    };

    const handleAddToEtiketListesi_single = async (listeId: string, kitapId: string) => {
        setEtiketAdding(true);
        try {
            const res = await fetch(`/api/etiket-listeleri/${listeId}/kitaplar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kitapId }),
            });
            if (res.ok) {
                setEtiketSuccess("Kitap etiket listesine eklendi");
                setTimeout(() => setEtiketSuccess(null), 3000);
                fetchEtiketListeleri();
            }
        } finally {
            setEtiketAdding(false);
        }
    };

    // MARC record parser - supports common MARC21 text formats
    const parseMarcRecord = (text: string) => {
        const lines = text.trim().split("\n");
        const fields: Record<string, string[]> = {};

        for (const line of lines) {
            // Format: "TAG IND DATA" e.g. "245 10 $a Title $b subtitle"
            // or "=TAG  \\IND$a Data" (MarcEdit format)
            // or "TAG    DATA"
            let tag = "";
            let data = "";

            // MarcEdit format: =TAG  ...$a
            const marcEditMatch = line.match(/^=(\d{3})\s+(.*)$/);
            if (marcEditMatch) {
                tag = marcEditMatch[1];
                data = marcEditMatch[2];
            } else {
                // Standard text format: TAG IND $a Data or just TAG data
                const stdMatch = line.match(/^(\d{3})\s+(.*)$/);
                if (stdMatch) {
                    tag = stdMatch[1];
                    data = stdMatch[2];
                }
            }

            if (!tag) continue;

            // Extract subfield values
            const subfieldMap: Record<string, string> = {};
            const subfieldRegex = /\$([a-z0-9])\s*([^$]*)/g;
            let match;
            while ((match = subfieldRegex.exec(data)) !== null) {
                subfieldMap[match[1]] = match[2].trim();
            }

            // If no subfields found, use raw data
            if (Object.keys(subfieldMap).length === 0) {
                // Remove indicators (first 2 chars if they look like indicators)
                const cleaned = data.replace(/^[0-9\\]{0,2}\s*/, "").trim();
                if (cleaned) subfieldMap["_raw"] = cleaned;
            }

            if (!fields[tag]) fields[tag] = [];
            fields[tag].push(JSON.stringify(subfieldMap));
        }

        // Extract values from parsed fields
        const getSubfield = (tag: string, subfield: string): string => {
            const entries = fields[tag];
            if (!entries) return "";
            for (const entry of entries) {
                const parsed = JSON.parse(entry);
                if (parsed[subfield]) return parsed[subfield].replace(/\s*[/:;,.]$/, "");
                if (parsed["_raw"]) return parsed["_raw"].replace(/\s*[/:;,.]$/, "");
            }
            return "";
        };

        const getAllSubfields = (tags: string[], subfield: string): string[] => {
            const results: string[] = [];
            for (const tag of tags) {
                const entries = fields[tag];
                if (!entries) continue;
                for (const entry of entries) {
                    const parsed = JSON.parse(entry);
                    const val = parsed[subfield] || parsed["_raw"];
                    if (val) results.push(val.replace(/\s*[,.]$/, ""));
                }
            }
            return results;
        };

        // ISBN (020 $a)
        const isbn = getSubfield("020", "a").replace(/[^0-9Xx-]/g, "");

        // Title (245 $a + $b)
        let baslik = getSubfield("245", "a");
        const subtitle = getSubfield("245", "b");
        if (subtitle) baslik = `${baslik}: ${subtitle}`;
        baslik = baslik.replace(/\s*[/:;,.]$/, "");

        // Authors (100 $a, 700 $a)
        const authors = getAllSubfields(["100", "700"], "a");

        // Publisher (260 $b or 264 $b)
        const yayinevi = getSubfield("260", "b") || getSubfield("264", "b");

        // Year (260 $c or 264 $c)
        const yearRaw = getSubfield("260", "c") || getSubfield("264", "c");
        const yearMatch = yearRaw.match(/(\d{4})/);
        const yayinYili = yearMatch ? yearMatch[1] : "";

        // Language (041 $a or 008 positions 35-37)
        const langCode = getSubfield("041", "a").toLowerCase();
        const langMap: Record<string, string> = {
            tur: "Türkçe", tr: "Türkçe",
            eng: "İngilizce", en: "İngilizce",
            ger: "Almanca", de: "Almanca",
            fre: "Fransızca", fr: "Fransızca",
            ara: "Arapça", ar: "Arapça",
            rus: "Rusça", ru: "Rusça",
        };
        const dil = langMap[langCode] || langCode;

        // Physical description (300 $a)
        const physRaw = getSubfield("300", "a");
        const pageMatch = physRaw.match(/(\d+)/);
        const sayfaSayisi = pageMatch ? pageMatch[1] : "";

        // Summary (520 $a)
        const ozet = getSubfield("520", "a");

        // Notes (500 $a)
        const notlar = getSubfield("500", "a");

        return {
            isbn,
            baslik,
            yazarlar: authors.join(", "),
            yayinevi,
            yayinYili,
            dil,
            sayfaSayisi,
            ozet,
            notlar,
        };
    };

    const handleMarcPaste = () => {
        if (!marcText.trim()) {
            setMarcError("Lütfen MARC verisi yapıştırın");
            return;
        }

        const parsed = parseMarcRecord(marcText);

        if (!parsed.baslik && !parsed.isbn && !parsed.yazarlar) {
            setMarcError("Geçerli bir MARC kaydı bulunamadı. Lütfen formatı kontrol edin.");
            return;
        }

        setForm((prev) => ({
            ...prev,
            isbn: parsed.isbn || prev.isbn,
            baslik: parsed.baslik || prev.baslik,
            yazarlar: parsed.yazarlar || prev.yazarlar,
            yayinevi: parsed.yayinevi || prev.yayinevi,
            yayinYili: parsed.yayinYili || prev.yayinYili,
            dil: parsed.dil || prev.dil,
            sayfaSayisi: parsed.sayfaSayisi || prev.sayfaSayisi,
            ozet: parsed.ozet || prev.ozet,
            notlar: parsed.notlar || prev.notlar,
        }));

        setMarcDialogOpen(false);
        setMarcText("");
        setMarcError("");
    };

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (filterDurum && filterDurum !== "all") params.set("durum", filterDurum);
            if (filterKutuphane && filterKutuphane !== "all") params.set("kutuphaneId", filterKutuphane);
            params.set("page", page.toString());
            params.set("pageSize", pageSize.toString());

            const [kitapRes, kutRes] = await Promise.all([
                fetch(`/api/kitaplar?${params}`),
                // Only admin needs kutuphane list for assignment
                user.role === "ADMIN"
                    ? fetch("/api/kutuphaneler")
                    : Promise.resolve(null),
            ]);

            if (kitapRes.ok) {
                const result = await kitapRes.json();
                setKitaplar(result.data);
                setTotal(result.total);
                if (result.stats) setStats(result.stats);
            }
            if (kutRes && kutRes.ok) setKutuphaneler(await kutRes.json());
        } finally {
            setLoading(false);
        }
    }, [search, filterDurum, filterKutuphane, page, pageSize, user.role]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page when filters change
    React.useEffect(() => {
        setPage(1);
    }, [search, filterDurum, filterKutuphane]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const openCreate = () => {
        setEditing(null);
        setForm({
            ...emptyForm,
            kutuphaneId: user.kutuphaneId || "",
        });
        setError("");
        setBarcodeMessage(null);
        setDialogOpen(true);
    };

    const openEdit = (k: Kitap) => {
        setEditing(k);
        setForm({
            isbn: k.isbn || "",
            baslik: k.baslik,
            demirbasNo: k.demirbasNo || "",
            barkod: k.barkod || "",
            yayinevi: k.yayinevi || "",
            dil: k.dil || "",
            yayinYili: k.yayinYili?.toString() || "",
            sayfaSayisi: k.sayfaSayisi?.toString() || "",
            durum: k.durum,
            fizikselDurum: k.fizikselDurum,
            ozet: k.ozet || "",
            notlar: k.notlar || "",
            yazarlar: k.yazarlar || "",
            kutuphaneId: k.kutuphaneId,
        });
        setError("");
        setBarcodeMessage(null);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const url = editing ? `/api/kitaplar/${editing.id}` : "/api/kitaplar";
            const method = editing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Bir hata oluştu");
                return;
            }

            setDialogOpen(false);
            fetchData();
        } catch {
            setError("Bir hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/kitaplar/${deleting.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setDeleteDialogOpen(false);
                setDeleting(null);
                fetchData();
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Barcode lookup on Enter ──────────────────────────────────────────
    const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const barkod = form.barkod.trim();
        if (!barkod) return;

        setBarcodeSearching(true);
        setBarcodeMessage(null);
        try {
            const res = await fetch(`/api/kitaplar/search-by-barcode?barkod=${encodeURIComponent(barkod)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.found && data.kitap) {
                    const k = data.kitap;
                    setForm((prev) => ({
                        ...prev,
                        isbn: k.isbn || prev.isbn,
                        baslik: k.baslik || prev.baslik,
                        // demirbasNo is always entered manually
                        barkod: k.barkod || prev.barkod,
                        yayinevi: k.yayinevi || prev.yayinevi,
                        dil: k.dil || prev.dil,
                        yayinYili: k.yayinYili?.toString() || prev.yayinYili,
                        sayfaSayisi: k.sayfaSayisi?.toString() || prev.sayfaSayisi,
                        durum: prev.durum,
                        fizikselDurum: prev.fizikselDurum,
                        ozet: k.ozet || prev.ozet,
                        notlar: k.notlar || prev.notlar,
                        yazarlar: k.yazarlar || prev.yazarlar,
                        kutuphaneId: prev.kutuphaneId,
                    }));
                    setBarcodeMessage(`"${k.baslik}" kitabının bilgileri dolduruldu`);
                } else {
                    setBarcodeMessage("Bu barkoda ait kitap bulunamadı, veri girişine devam edin");
                }
            }
        } catch {
            // ignore
        } finally {
            setBarcodeSearching(false);
            setTimeout(() => setBarcodeMessage(null), 4000);
        }
    };

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Kitaplar</h1>
                        <p className="text-muted-foreground">
                            {user.role === "ADMIN"
                                ? "Tüm kütüphanelerdeki kitapları yönetin"
                                : "Kütüphanenize ait kitapları yönetin"}
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni Kitap
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: "Toplam Kitap", value: stats.total || 0, icon: BookOpen, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50", border: "border-blue-100 dark:border-blue-900/50" },
                        { label: "Mevcut", value: stats.MEVCUT || 0, icon: BookCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50", border: "border-emerald-100 dark:border-emerald-900/50" },
                        { label: "Ödünç Verilen", value: stats.ODUNC || 0, icon: BookX, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50", border: "border-amber-100 dark:border-amber-900/50" },
                        { label: "Kayıp / Hasarlı", value: (stats.KAYIP || 0) + (stats.HASARLI || 0), icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/50", border: "border-rose-100 dark:border-rose-900/50" },
                    ].map((stat) => (
                        <Card key={stat.label} className={`border ${stat.border} ${stat.bg} shadow-none`}>
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <p className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value.toLocaleString("tr-TR")}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters & Table */}
                <Card>
                    <div className="border-b px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-base font-semibold">Kitap Listesi</h3>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                {user.role === "ADMIN" && (
                                    <Select
                                        value={filterKutuphane}
                                        onValueChange={setFilterKutuphane}
                                    >
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Tüm Kütüphaneler" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tüm Kütüphaneler</SelectItem>
                                            {kutuphaneler.map((k) => (
                                                <SelectItem key={k.id} value={k.id}>
                                                    {k.adi}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Select
                                    value={filterDurum}
                                    onValueChange={setFilterDurum}
                                >
                                    <SelectTrigger className="w-full sm:w-40">
                                        <SelectValue placeholder="Tüm Durumlar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Durumlar</SelectItem>
                                        <SelectItem value="MEVCUT">Mevcut</SelectItem>
                                        <SelectItem value="ODUNC">Ödünç</SelectItem>
                                        <SelectItem value="KAYIP">Kayıp</SelectItem>
                                        <SelectItem value="HASARLI">Hasarlı</SelectItem>
                                        <SelectItem value="AYIKLANDI">Ayıklandı</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Başlık, ISBN, yazar, demirbaş..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : kitaplar.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                {search || filterDurum || filterKutuphane
                                    ? "Arama sonucu bulunamadı"
                                    : "Henüz kitap eklenmemiş"}
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Başlık</TableHead>
                                            <TableHead className="hidden md:table-cell">Yazar</TableHead>
                                            <TableHead className="hidden lg:table-cell">Demirbaş No</TableHead>
                                            <TableHead className="hidden lg:table-cell">ISBN</TableHead>
                                            <TableHead className="hidden lg:table-cell">Yayınevi</TableHead>
                                            {user.role === "ADMIN" && (
                                                <TableHead className="hidden md:table-cell">
                                                    Kütüphane
                                                </TableHead>
                                            )}
                                            <TableHead>Durum</TableHead>
                                            <TableHead className="text-right">İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {kitaplar.map((k) => (
                                            <TableRow key={k.id}>
                                                <TableCell>
                                                    <Link href={`/kitaplar/${k.id}`} className="font-medium hover:text-primary hover:underline transition-colors">
                                                        {k.baslik}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground md:hidden">
                                                        {k.yazarlar || "—"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden max-w-[150px] truncate md:table-cell">
                                                    {k.yazarlar || (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden font-mono text-xs lg:table-cell">
                                                    {k.demirbasNo || (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden font-mono text-xs lg:table-cell">
                                                    {k.isbn || (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {k.yayinevi || (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                {user.role === "ADMIN" && (
                                                    <TableCell className="hidden md:table-cell">
                                                        <span className="text-xs">
                                                            {k.kutuphane?.adi}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <Badge variant={durumColors[k.durum]}>
                                                        {durumLabels[k.durum]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <TooltipProvider delayDuration={300}>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        asChild
                                                                        className="h-8 w-8"
                                                                    >
                                                                        <Link href={`/kitaplar/${k.id}`}>
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                        </Link>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Detay</TooltipContent>
                                                            </Tooltip>
                                                            {user.role !== "MEMUR" && etiketListeleri.length > 0 && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => openEtiketDialog(k.id)}
                                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                                            disabled={etiketAdding}
                                                                        >
                                                                            <Tags className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Etiket Listesine Ekle</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => openEdit(k)}
                                                                        className="h-8 w-8"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Düzenle</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            setDeleting(k);
                                                                            setDeleteDialogOpen(true);
                                                                        }}
                                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Sil</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TooltipProvider>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                <div className="flex items-center justify-between border-t px-6 py-4">
                                    <p className="text-sm text-muted-foreground">
                                        Toplam <strong>{total.toLocaleString("tr-TR")}</strong> kitap
                                        {total > pageSize && (
                                            <> &middot; Sayfa <strong>{page}</strong> / {totalPages}</>
                                        )}
                                    </p>
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPage(1)}
                                                disabled={page === 1}
                                            >
                                                <ChevronsLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum: number;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (page >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = page - 2 + i;
                                                }
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={page === pageNum ? "default" : "outline"}
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => setPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setPage(totalPages)}
                                                disabled={page === totalPages}
                                            >
                                                <ChevronsRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Etiket Success Toast */}
            {etiketSuccess && (
                <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    <Check className="h-4 w-4" />
                    {etiketSuccess}
                </div>
            )}

            {/* Etiket Listesi Seçim Dialog */}
            <Dialog open={etiketDialogOpen} onOpenChange={setEtiketDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tags className="h-5 w-5" />
                            Etiket Listesi Seçin
                        </DialogTitle>
                        <DialogDescription>
                            Kitabı eklemek istediğiniz etiket listesini seçin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {etiketListeleri.map((l) => (
                            <button
                                key={l.id}
                                onClick={() => handleAddToEtiketListesi(l.id)}
                                disabled={etiketAdding}
                                className="w-full flex items-center justify-between rounded-lg border p-3 text-left hover:bg-accent transition-colors disabled:opacity-50"
                            >
                                <div>
                                    <div className="font-medium text-sm">{l.adi}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {l._count.kitaplar} kitap
                                    </div>
                                </div>
                                <Tags className="h-4 w-4 text-muted-foreground" />
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-6">
                            <div>
                                <DialogTitle>
                                    {editing ? "Kitap Düzenle" : "Yeni Kitap"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editing
                                        ? "Kitap bilgilerini güncelleyin"
                                        : "Kütüphaneye yeni bir kitap ekleyin"}
                                </DialogDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 shrink-0"
                                onClick={() => {
                                    setMarcText("");
                                    setMarcError("");
                                    setMarcDialogOpen(true);
                                }}
                            >
                                <ClipboardPaste className="h-4 w-4" />
                                MARC Yapıştır
                            </Button>
                        </div>
                    </DialogHeader>

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="baslik">Kitap Başlığı *</Label>
                            <Input
                                id="baslik"
                                value={form.baslik}
                                onChange={(e) => setForm({ ...form, baslik: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="yazarlar">Yazarlar</Label>
                            <AutocompleteInput
                                value={form.yazarlar}
                                onChange={(v) => setForm({ ...form, yazarlar: v })}
                                field="yazarlar"
                                placeholder="Virgülle ayırarak yazınız"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="isbn">ISBN</Label>
                            <Input
                                id="isbn"
                                value={form.isbn}
                                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="barkod">Barkod</Label>
                            <div className="relative">
                                <Input
                                    id="barkod"
                                    value={form.barkod}
                                    onChange={(e) => setForm({ ...form, barkod: e.target.value })}
                                    onKeyDown={handleBarcodeKeyDown}
                                    placeholder="Barkod girip Enter'a basın"
                                    disabled={barcodeSearching}
                                />
                                {barcodeSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            {barcodeMessage && (
                                <p className={cn(
                                    "text-xs",
                                    barcodeMessage.includes("bulunamadı") ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                )}>
                                    {barcodeMessage}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="demirbasNo">Demirbaş No <span className="text-xs text-muted-foreground">(elle girilir)</span></Label>
                            <Input
                                id="demirbasNo"
                                value={form.demirbasNo}
                                onChange={(e) =>
                                    setForm({ ...form, demirbasNo: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="yayinevi">Yayınevi</Label>
                            <AutocompleteInput
                                value={form.yayinevi}
                                onChange={(v) => setForm({ ...form, yayinevi: v })}
                                field="yayinevi"
                                placeholder="Yayınevi adı"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dil">Dil</Label>
                            <Input
                                id="dil"
                                value={form.dil}
                                onChange={(e) => setForm({ ...form, dil: e.target.value })}
                                placeholder="Örn: Türkçe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="yayinYili">Yayın Yılı</Label>
                            <Input
                                id="yayinYili"
                                type="number"
                                value={form.yayinYili}
                                onChange={(e) =>
                                    setForm({ ...form, yayinYili: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sayfaSayisi">Sayfa Sayısı</Label>
                            <Input
                                id="sayfaSayisi"
                                type="number"
                                value={form.sayfaSayisi}
                                onChange={(e) =>
                                    setForm({ ...form, sayfaSayisi: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Durum</Label>
                            <Select
                                value={form.durum}
                                onValueChange={(v) => setForm({ ...form, durum: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MEVCUT">Mevcut</SelectItem>
                                    <SelectItem value="ODUNC">Ödünç</SelectItem>
                                    <SelectItem value="KAYIP">Kayıp</SelectItem>
                                    <SelectItem value="HASARLI">Hasarlı</SelectItem>
                                    <SelectItem value="AYIKLANDI">Ayıklandı</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Fiziksel Durum</Label>
                            <Select
                                value={form.fizikselDurum}
                                onValueChange={(v) => setForm({ ...form, fizikselDurum: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MUKEMMEL">Mükemmel</SelectItem>
                                    <SelectItem value="COK_IYI">Çok İyi</SelectItem>
                                    <SelectItem value="IYI">İyi</SelectItem>
                                    <SelectItem value="ORTA">Orta</SelectItem>
                                    <SelectItem value="KOTU">Kötü</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {user.role === "ADMIN" && (
                            <div className="space-y-2">
                                <Label>Kütüphane *</Label>
                                <Select
                                    value={form.kutuphaneId}
                                    onValueChange={(v) => setForm({ ...form, kutuphaneId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kütüphane seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kutuphaneler.map((k) => (
                                            <SelectItem key={k.id} value={k.id}>
                                                {k.adi}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="ozet">Özet</Label>
                            <Textarea
                                id="ozet"
                                value={form.ozet}
                                onChange={(e) => setForm({ ...form, ozet: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="notlar">Notlar</Label>
                            <Textarea
                                id="notlar"
                                value={form.notlar}
                                onChange={(e) => setForm({ ...form, notlar: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            İptal
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editing ? "Güncelle" : "Oluştur"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kitap Sil</DialogTitle>
                        <DialogDescription>
                            <strong>{deleting?.baslik}</strong> kitabını silmek istediğinize
                            emin misiniz? Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={saving}
                        >
                            İptal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={saving}
                            className="gap-2"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* MARC Paste Dialog */}
            <Dialog open={marcDialogOpen} onOpenChange={setMarcDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>MARC Kaydı Yapıştır</DialogTitle>
                        <DialogDescription>
                            MARC21 formatındaki kaydı aşağıya yapıştırın. Desteklenen alanlar:
                            020 (ISBN), 041 (Dil), 100/700 (Yazar), 245 (Başlık), 260/264
                            (Yayıncı/Yıl), 300 (Sayfa), 500 (Not), 520 (Özet)
                        </DialogDescription>
                    </DialogHeader>

                    {marcError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {marcError}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Textarea
                            value={marcText}
                            onChange={(e) => {
                                setMarcText(e.target.value);
                                setMarcError("");
                            }}
                            placeholder={`Örnek MARC formatı:\n=020  \\\\$a9789750719387\n=041  \\\\$atur\n=100  1\\$aMustafa Kemal Atatürk\n=245  10$aNutuk$byüce önder Atatürk'ün\n=260  \\\\$aİstanbul$bYapı Kredi Yayınları$c2023\n=300  \\\\$a624 s.`}
                            rows={10}
                            className="font-mono text-xs leading-relaxed"
                        />
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                            <p className="text-[11px] text-muted-foreground">
                                <strong>İpucu:</strong> MARC verisi, kütüphane katalog
                                sistemlerinden (YORDAM, Koha, vb.) veya Z39.50 protokolü
                                üzerinden alınabilir.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setMarcDialogOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button onClick={handleMarcPaste} className="gap-2">
                            <ClipboardPaste className="h-4 w-4" />
                            Alanları Doldur
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
