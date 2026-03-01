"use client";

import * as React from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Search,
    Plus,
    Repeat,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Send,
    PackageCheck,
    ShieldCheck,
    Undo2,
    Trash2,
    Pencil,
    Eye,
    BookOpen,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    AlertTriangle,
    FileDown,
    ArrowRight,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

// ─── Types ─────────────────────────────────────────────────────────────

interface Kutuphane {
    id: string;
    adi: string;
    kodu: string;
}

interface UserMini {
    id: string;
    firstName: string;
    lastName: string;
}

interface KitapMini {
    id: string;
    baslik: string;
    yazarlar: string | null;
    isbn: string | null;
    barkod: string | null;
    demirbasNo: string | null;
    durum: string;
    yayinevi: string | null;
    yayinYili: number | null;
}

interface DevirFisi {
    id: string;
    uuid: string;
    fisNo: string;
    aciklama: string | null;
    durum: string;
    notlar: string | null;
    iadenedeni: string | null;
    teslimTarihi: string | null;
    onayTarihi: string | null;
    createdAt: string;
    updatedAt: string;
    cikisKutuphaneId: string;
    cikisKutuphane: Kutuphane;
    girisKutuphaneId: string;
    girisKutuphane: Kutuphane;
    olusturanId: string | null;
    olusturan: UserMini | null;
    teslimEdenId: string;
    teslimEden: UserMini;
    teslimAlanId: string;
    teslimAlan: UserMini;
    onaylayanId: string;
    onaylayan: UserMini;
    _count: { kitaplar: number };
    kitaplar?: { id: string; kitap: KitapMini; sira: number }[];
}

// ─── Helpers ───────────────────────────────────────────────────────────

const durumLabels: Record<string, string> = {
    TASLAK: "Taslak",
    TESLIM_BEKLIYOR: "Teslim Bekliyor",
    ONAY_BEKLIYOR: "Onay Bekliyor",
    ONAYLANDI: "Onaylandı",
    IADE_EDILDI: "İade Edildi",
};

const durumColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    TASLAK: "outline",
    TESLIM_BEKLIYOR: "default",
    ONAY_BEKLIYOR: "secondary",
    ONAYLANDI: "default",
    IADE_EDILDI: "destructive",
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function fullName(user: UserMini | null) {
    return user ? `${user.firstName} ${user.lastName}` : "—";
}

// ─── Main Component ────────────────────────────────────────────────────

export default function DevirIslemleriClient({ user }: { user: SessionUser }) {
    // ─── List state ────────────────────────────────────────────────────
    const [devirler, setDevirler] = React.useState<DevirFisi[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [filterDurum, setFilterDurum] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [pageSize] = React.useState(50);
    const [total, setTotal] = React.useState(0);
    const [stats, setStats] = React.useState<Record<string, number>>({ total: 0 });

    // ─── Dialog state ──────────────────────────────────────────────────
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<DevirFisi | null>(null);
    const [viewing, setViewing] = React.useState<DevirFisi | null>(null);
    const [deleting, setDeleting] = React.useState<DevirFisi | null>(null);

    // Action for workflow
    const [actionType, setActionType] = React.useState("");
    const [actionTarget, setActionTarget] = React.useState<DevirFisi | null>(null);
    const [actionReason, setActionReason] = React.useState("");

    // ─── Form state ────────────────────────────────────────────────────
    const [cikisKutuphaneId, setCikisKutuphaneId] = React.useState("");
    const [girisKutuphaneId, setGirisKutuphaneId] = React.useState("");
    const [teslimEdenId, setTeslimEdenId] = React.useState("");
    const [teslimAlanId, setTeslimAlanId] = React.useState("");
    const [onaylayanId, setOnaylayanId] = React.useState("");
    const [aciklama, setAciklama] = React.useState("");
    const [notlar, setNotlar] = React.useState("");
    const [selectedBooks, setSelectedBooks] = React.useState<KitapMini[]>([]);

    // ─── Book search ───────────────────────────────────────────────────
    const [bookSearchInput, setBookSearchInput] = React.useState("");
    const [bookSearchResults, setBookSearchResults] = React.useState<KitapMini[]>([]);
    const [bookSearchFocused, setBookSearchFocused] = React.useState(false);
    const [bookSearchLoading, setBookSearchLoading] = React.useState(false);
    const bookSearchRef = React.useRef<HTMLInputElement>(null);

    // ─── Lookup data ───────────────────────────────────────────────────
    const [kutuphaneler, setKutuphaneler] = React.useState<Kutuphane[]>([]);
    const [kullanicilar, setKullanicilar] = React.useState<UserMini[]>([]);

    // ─── General ───────────────────────────────────────────────────────
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");

    const isAdmin = user.role === "ADMIN";

    // ─── Fetch list ────────────────────────────────────────────────────
    const fetchDevirler = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("pageSize", pageSize.toString());
            if (search) params.set("search", search);
            if (filterDurum && filterDurum !== "all") params.set("durum", filterDurum);

            const res = await fetch(`/api/devir-islemleri?${params}`);
            if (res.ok) {
                const data = await res.json();
                setDevirler(data.data);
                setTotal(data.total);
                setStats(data.stats);
            }
        } finally {
            setLoading(false);
        }
    }, [search, filterDurum, page, pageSize]);

    const fetchLookupData = React.useCallback(async () => {
        const [kutRes, kulRes] = await Promise.all([
            fetch("/api/kutuphaneler"),
            fetch("/api/kullanicilar"),
        ]);
        if (kutRes.ok) {
            const data = await kutRes.json();
            setKutuphaneler(Array.isArray(data) ? data : data.data || []);
        }
        if (kulRes.ok) {
            const data = await kulRes.json();
            setKullanicilar(
                (Array.isArray(data) ? data : data.data || []).map(
                    (u: { id: string; firstName: string; lastName: string }) => ({
                        id: u.id,
                        firstName: u.firstName,
                        lastName: u.lastName,
                    })
                )
            );
        }
    }, []);

    React.useEffect(() => {
        fetchDevirler();
    }, [fetchDevirler]);

    React.useEffect(() => {
        fetchLookupData();
    }, [fetchLookupData]);

    // Reset page on filter/search change
    React.useEffect(() => {
        setPage(1);
    }, [search, filterDurum]);

    // ─── Book search ───────────────────────────────────────────────────
    const bookSearchTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    React.useEffect(() => {
        if (!bookSearchInput.trim() || !cikisKutuphaneId) {
            setBookSearchResults([]);
            return;
        }

        clearTimeout(bookSearchTimeout.current);
        bookSearchTimeout.current = setTimeout(async () => {
            setBookSearchLoading(true);
            try {
                const params = new URLSearchParams();
                params.set("search", bookSearchInput.trim());
                params.set("pageSize", "20");
                params.set("kutuphaneId", cikisKutuphaneId);
                params.set("durum", "MEVCUT");

                const res = await fetch(`/api/kitaplar?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    const books: KitapMini[] = (data.data || data).filter(
                        (k: KitapMini) => !selectedBooks.some((sb) => sb.id === k.id)
                    );
                    setBookSearchResults(books.slice(0, 10));
                }
            } finally {
                setBookSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(bookSearchTimeout.current);
    }, [bookSearchInput, cikisKutuphaneId, selectedBooks]);

    // ─── Open create/edit dialog ───────────────────────────────────────
    const resetForm = () => {
        setCikisKutuphaneId(user.kutuphaneId || "");
        setGirisKutuphaneId("");
        setTeslimEdenId("");
        setTeslimAlanId("");
        setOnaylayanId("");
        setAciklama("");
        setNotlar("");
        setSelectedBooks([]);
        setBookSearchInput("");
        setBookSearchResults([]);
        setError("");
    };

    const openCreate = () => {
        setEditing(null);
        resetForm();
        setDialogOpen(true);
    };

    const openEdit = async (devir: DevirFisi) => {
        setEditing(devir);
        setCikisKutuphaneId(devir.cikisKutuphaneId);
        setGirisKutuphaneId(devir.girisKutuphaneId);
        setTeslimEdenId(devir.teslimEdenId);
        setTeslimAlanId(devir.teslimAlanId);
        setOnaylayanId(devir.onaylayanId);
        setAciklama(devir.aciklama || "");
        setNotlar(devir.notlar || "");
        setError("");

        // Fetch full details with books
        try {
            const res = await fetch(`/api/devir-islemleri/${devir.id}`);
            if (res.ok) {
                const detail = await res.json();
                setSelectedBooks(
                    detail.kitaplar?.map((dk: { kitap: KitapMini }) => dk.kitap) || []
                );
            }
        } catch {
            setSelectedBooks([]);
        }

        setDialogOpen(true);
    };

    const openDetail = async (devir: DevirFisi) => {
        try {
            const res = await fetch(`/api/devir-islemleri/${devir.id}`);
            if (res.ok) {
                const detail = await res.json();
                setViewing(detail);
                setDetailDialogOpen(true);
            }
        } catch {
            /* ignore */
        }
    };

    // ─── Save ──────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!cikisKutuphaneId || !girisKutuphaneId) {
            setError("Çıkış ve giriş kütüphanesi seçilmelidir");
            return;
        }
        if (cikisKutuphaneId === girisKutuphaneId) {
            setError("Çıkış ve giriş kütüphanesi aynı olamaz");
            return;
        }
        if (!teslimEdenId || !teslimAlanId || !onaylayanId) {
            setError("Teslim eden, teslim alan ve onaylayan seçilmelidir");
            return;
        }
        if (selectedBooks.length === 0) {
            setError("En az bir kitap eklenmelidir");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const payload = {
                cikisKutuphaneId,
                girisKutuphaneId,
                teslimEdenId,
                teslimAlanId,
                onaylayanId,
                aciklama: aciklama || undefined,
                notlar: notlar || undefined,
                kitapIds: selectedBooks.map((b) => b.id),
            };

            const url = editing
                ? `/api/devir-islemleri/${editing.id}`
                : "/api/devir-islemleri";
            const method = editing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Bir hata oluştu");
                return;
            }

            setDialogOpen(false);
            fetchDevirler();
        } catch {
            setError("Bir hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    // ─── Delete ────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleting) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/devir-islemleri/${deleting.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Bir hata oluştu");
                return;
            }
            setDeleteDialogOpen(false);
            setDeleting(null);
            fetchDevirler();
        } catch {
            setError("Bir hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    // ─── Workflow actions ──────────────────────────────────────────────
    const openAction = (devir: DevirFisi, type: string) => {
        setActionTarget(devir);
        setActionType(type);
        setActionReason("");
        setError("");
        setActionDialogOpen(true);
    };

    const handleAction = async () => {
        if (!actionTarget) return;
        setSaving(true);
        setError("");

        try {
            const res = await fetch(
                `/api/devir-islemleri/${actionTarget.id}/durum`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: actionType,
                        iadenedeni: actionReason || undefined,
                    }),
                }
            );

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Bir hata oluştu");
                return;
            }

            setActionDialogOpen(false);
            setActionTarget(null);
            fetchDevirler();
        } catch {
            setError("Bir hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    // ─── Book helpers ──────────────────────────────────────────────────
    const handleBookSelect = (kitap: KitapMini) => {
        setSelectedBooks((prev) => [...prev, kitap]);
        setBookSearchInput("");
        setBookSearchResults([]);
        bookSearchRef.current?.focus();
    };

    const handleBookEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (bookSearchResults.length === 1) {
                handleBookSelect(bookSearchResults[0]);
            }
        }
    };

    const removeBook = (index: number) => {
        setSelectedBooks((prev) => prev.filter((_, i) => i !== index));
    };

    // ─── PDF generation ────────────────────────────────────────────────
    const generatePDF = async (devir: DevirFisi) => {
        const detail = devir.kitaplar
            ? devir
            : await fetch(`/api/devir-islemleri/${devir.id}`).then((r) => r.json());

        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const pageWidth = 210;
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;
        let y = 20;

        // ─── Header ───
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("T.C.", pageWidth / 2, y, { align: "center" });
        y += 5;
        doc.text("CUMHURIYET UNIVERSITESI", pageWidth / 2, y, { align: "center" });
        y += 5;
        doc.setFontSize(10);
        doc.text("Kutuphane ve Dokumantasyon Daire Baskanligi", pageWidth / 2, y, { align: "center" });
        y += 8;

        // Separator line
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // ─── Title ───
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("DEVIR FISI", pageWidth / 2, y, { align: "center" });
        y += 10;

        // ─── Info section ───
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        const addInfoRow = (label: string, value: string, xOffset = margin) => {
            doc.setFont("helvetica", "bold");
            doc.text(label, xOffset, y);
            doc.setFont("helvetica", "normal");
            doc.text(value, xOffset + 40, y);
        };

        addInfoRow("Fis No:", detail.fisNo);
        addInfoRow("Tarih:", formatDate(detail.createdAt), pageWidth / 2);
        y += 6;
        addInfoRow("Durum:", durumLabels[detail.durum] || detail.durum);
        y += 6;

        addInfoRow("Cikis Kutuphane:", `${detail.cikisKutuphane.adi} (${detail.cikisKutuphane.kodu})`);
        y += 6;
        addInfoRow("Giris Kutuphane:", `${detail.girisKutuphane.adi} (${detail.girisKutuphane.kodu})`);
        y += 6;

        if (detail.aciklama) {
            addInfoRow("Aciklama:", detail.aciklama);
            y += 6;
        }

        y += 4;

        // ─── Books table ───
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Kitap Listesi", margin, y);
        y += 6;

        // Table header
        const colWidths = [8, 55, 35, 30, 25, contentWidth - 153];
        const colHeaders = ["#", "Baslik", "Yazar", "ISBN", "Demirbas No", "Barkod"];

        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 4, contentWidth, 7, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");

        let xPos = margin + 1;
        colHeaders.forEach((header, i) => {
            doc.text(header, xPos, y);
            xPos += colWidths[i];
        });
        y += 5;

        // Table rows
        doc.setFont("helvetica", "normal");
        const books = detail.kitaplar || [];
        books.forEach((dk: { kitap: KitapMini; sira: number }, index: number) => {
            if (y > 260) {
                doc.addPage();
                y = 20;
            }

            const kitap = dk.kitap;
            xPos = margin + 1;
            const rowData = [
                (index + 1).toString(),
                (kitap.baslik || "").substring(0, 35),
                (kitap.yazarlar || "").substring(0, 22),
                kitap.isbn || "-",
                kitap.demirbasNo || "-",
                kitap.barkod || "-",
            ];

            if (index % 2 === 1) {
                doc.setFillColor(248, 248, 248);
                doc.rect(margin, y - 3.5, contentWidth, 5.5, "F");
            }

            rowData.forEach((val, i) => {
                doc.text(val, xPos, y);
                xPos += colWidths[i];
            });
            y += 5.5;
        });

        y += 4;
        doc.setDrawColor(180);
        doc.line(margin, y, pageWidth - margin, y);
        y += 4;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Toplam: ${books.length} adet kitap`, margin, y);
        y += 12;

        // ─── Signatures ───
        if (y > 230) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(9);
        const sigWidth = contentWidth / 3;
        const sigStartX = margin;

        // Signature headers
        doc.setFont("helvetica", "bold");
        doc.text("Teslim Eden", sigStartX + sigWidth * 0 + sigWidth / 2, y, { align: "center" });
        doc.text("Teslim Alan", sigStartX + sigWidth * 1 + sigWidth / 2, y, { align: "center" });
        doc.text("Onaylayan", sigStartX + sigWidth * 2 + sigWidth / 2, y, { align: "center" });
        y += 5;

        // Names
        doc.setFont("helvetica", "normal");
        doc.text(fullName(detail.teslimEden), sigStartX + sigWidth * 0 + sigWidth / 2, y, { align: "center" });
        doc.text(fullName(detail.teslimAlan), sigStartX + sigWidth * 1 + sigWidth / 2, y, { align: "center" });
        doc.text(fullName(detail.onaylayan), sigStartX + sigWidth * 2 + sigWidth / 2, y, { align: "center" });
        y += 15;

        // Signature lines
        for (let i = 0; i < 3; i++) {
            const lineX = sigStartX + sigWidth * i + 10;
            doc.line(lineX, y, lineX + sigWidth - 20, y);
        }
        y += 5;
        doc.setFontSize(8);
        doc.text("Imza", sigStartX + sigWidth * 0 + sigWidth / 2, y, { align: "center" });
        doc.text("Imza", sigStartX + sigWidth * 1 + sigWidth / 2, y, { align: "center" });
        doc.text("Imza", sigStartX + sigWidth * 2 + sigWidth / 2, y, { align: "center" });

        // ─── Footer ───
        doc.setFontSize(7);
        doc.setTextColor(128);
        doc.text(
            `Bu belge ${formatDateTime(new Date().toISOString())} tarihinde olusturulmustur.`,
            pageWidth / 2,
            287,
            { align: "center" }
        );

        doc.save(`devir-fisi-${detail.fisNo}.pdf`);
    };

    // ─── Computed ──────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const actionLabels: Record<string, string> = {
        gonder: "Teslime Gönder",
        teslimAl: "Teslim Al",
        onayla: "Onayla",
        iadeEt: "İade Et / Reddet",
    };

    const actionDescriptions: Record<string, string> = {
        gonder:
            "Bu devir fişini teslime göndermek istediğinize emin misiniz? Gönderildikten sonra düzenlenemez.",
        teslimAl:
            "Kitapları teslim aldığınızı onaylıyor musunuz? İşlem onay aşamasına geçecektir.",
        onayla:
            "Bu devir fişini onaylamak istediğinize emin misiniz? Kitaplar giriş kütüphanesine devredilecektir.",
        iadeEt:
            "Bu devir fişini iade etmek / reddetmek istediğinize emin misiniz?",
    };

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Devir İşlemleri
                        </h1>
                        <p className="text-muted-foreground">
                            Kütüphaneler arası kitap devir fişlerini yönetin
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni Devir Fişi
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                        {
                            label: "Toplam",
                            value: stats.total || 0,
                            icon: Repeat,
                            color: "text-blue-600 dark:text-blue-400",
                            bg: "bg-blue-50 dark:bg-blue-950/50",
                            border: "border-blue-100 dark:border-blue-900/50",
                        },
                        {
                            label: "Taslak",
                            value: stats.TASLAK || 0,
                            icon: FileText,
                            color: "text-slate-600 dark:text-slate-400",
                            bg: "bg-slate-50 dark:bg-slate-950/50",
                            border: "border-slate-100 dark:border-slate-900/50",
                        },
                        {
                            label: "Teslim Bekliyor",
                            value: stats.TESLIM_BEKLIYOR || 0,
                            icon: Clock,
                            color: "text-amber-600 dark:text-amber-400",
                            bg: "bg-amber-50 dark:bg-amber-950/50",
                            border: "border-amber-100 dark:border-amber-900/50",
                        },
                        {
                            label: "Onaylandı",
                            value: stats.ONAYLANDI || 0,
                            icon: CheckCircle2,
                            color: "text-emerald-600 dark:text-emerald-400",
                            bg: "bg-emerald-50 dark:bg-emerald-950/50",
                            border: "border-emerald-100 dark:border-emerald-900/50",
                        },
                        {
                            label: "İade / Red",
                            value: stats.IADE_EDILDI || 0,
                            icon: XCircle,
                            color: "text-rose-600 dark:text-rose-400",
                            bg: "bg-rose-50 dark:bg-rose-950/50",
                            border: "border-rose-100 dark:border-rose-900/50",
                        },
                    ].map((stat) => (
                        <Card
                            key={stat.label}
                            className={`border ${stat.border} ${stat.bg} shadow-none`}
                        >
                            <CardContent className="flex items-center gap-4 p-5">
                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
                                >
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.label}
                                    </p>
                                    <p
                                        className={`text-2xl font-bold tracking-tight ${stat.color}`}
                                    >
                                        {stat.value.toLocaleString("tr-TR")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters & Table */}
                <Card>
                    <div className="border-b px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-base font-semibold">
                                Devir Fişleri
                            </h3>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Select
                                    value={filterDurum}
                                    onValueChange={setFilterDurum}
                                >
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="Tüm Durumlar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Tüm Durumlar
                                        </SelectItem>
                                        {Object.entries(durumLabels).map(
                                            ([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Fiş no veya açıklama ara..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 sm:w-64"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : devirler.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Repeat className="mx-auto mb-3 h-10 w-10 opacity-40" />
                            <p>Devir fişi bulunamadı</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fiş No</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Çıkış</TableHead>
                                        <TableHead>Giriş</TableHead>
                                        <TableHead className="text-center">
                                            Kitap
                                        </TableHead>
                                        <TableHead>Oluşturan</TableHead>
                                        <TableHead>Tarih</TableHead>
                                        <TableHead className="w-[180px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {devirler.map((devir) => (
                                        <TableRow key={devir.id}>
                                            <TableCell className="font-mono text-sm font-medium">
                                                {devir.fisNo}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        durumColors[devir.durum] ||
                                                        "outline"
                                                    }
                                                >
                                                    {durumLabels[devir.durum] ||
                                                        devir.durum}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {devir.cikisKutuphane.adi}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {devir.girisKutuphane.adi}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">
                                                    {devir._count.kitaplar}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {fullName(devir.olusturan)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(devir.createdAt)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <TooltipProvider delayDuration={0}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Detail */}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() =>
                                                                        openDetail(
                                                                            devir
                                                                        )
                                                                    }
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Detay
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        {/* PDF */}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() =>
                                                                        generatePDF(
                                                                            devir
                                                                        )
                                                                    }
                                                                >
                                                                    <FileDown className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                PDF İndir
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        {/* Edit (only TASLAK) */}
                                                        {devir.durum === "TASLAK" && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() =>
                                                                            openEdit(
                                                                                devir
                                                                            )
                                                                        }
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    Düzenle
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}

                                                        {/* Workflow actions */}
                                                        {devir.durum ===
                                                            "TASLAK" && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-blue-600"
                                                                            onClick={() =>
                                                                                openAction(
                                                                                    devir,
                                                                                    "gonder"
                                                                                )
                                                                            }
                                                                        >
                                                                            <Send className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Teslime Gönder
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}

                                                        {devir.durum ===
                                                            "TESLIM_BEKLIYOR" && (
                                                                <>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-emerald-600"
                                                                                onClick={() =>
                                                                                    openAction(
                                                                                        devir,
                                                                                        "teslimAl"
                                                                                    )
                                                                                }
                                                                            >
                                                                                <PackageCheck className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            Teslim Al
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-rose-600"
                                                                                onClick={() =>
                                                                                    openAction(
                                                                                        devir,
                                                                                        "iadeEt"
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Undo2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            İade Et
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </>
                                                            )}

                                                        {devir.durum ===
                                                            "ONAY_BEKLIYOR" && (
                                                                <>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-emerald-600"
                                                                                onClick={() =>
                                                                                    openAction(
                                                                                        devir,
                                                                                        "onayla"
                                                                                    )
                                                                                }
                                                                            >
                                                                                <ShieldCheck className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            Onayla
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-rose-600"
                                                                                onClick={() =>
                                                                                    openAction(
                                                                                        devir,
                                                                                        "iadeEt"
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Undo2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            Reddet
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </>
                                                            )}

                                                        {/* Delete (only TASLAK) */}
                                                        {devir.durum ===
                                                            "TASLAK" && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-rose-600"
                                                                            onClick={() => {
                                                                                setDeleting(
                                                                                    devir
                                                                                );
                                                                                setError(
                                                                                    ""
                                                                                );
                                                                                setDeleteDialogOpen(
                                                                                    true
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Sil
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
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
                                    Toplam{" "}
                                    <strong>
                                        {total.toLocaleString("tr-TR")}
                                    </strong>{" "}
                                    kayıt
                                    {total > pageSize && (
                                        <>
                                            {" "}
                                            &middot; Sayfa{" "}
                                            <strong>{page}</strong> /{" "}
                                            {totalPages}
                                        </>
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
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.max(1, p - 1)
                                                )
                                            }
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        {Array.from(
                                            {
                                                length: Math.min(
                                                    5,
                                                    totalPages
                                                ),
                                            },
                                            (_, i) => {
                                                let pageNum: number;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (
                                                    page >=
                                                    totalPages - 2
                                                ) {
                                                    pageNum =
                                                        totalPages - 4 + i;
                                                } else {
                                                    pageNum = page - 2 + i;
                                                }
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={
                                                            page === pageNum
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() =>
                                                            setPage(pageNum)
                                                        }
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            }
                                        )}
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.min(totalPages, p + 1)
                                                )
                                            }
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
                </Card>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                CREATE / EDIT DIALOG
            ═══════════════════════════════════════════════════════════════ */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? "Devir Fişi Düzenle"
                                : "Yeni Devir Fişi"}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? "Devir fişi bilgilerini güncelleyin"
                                : "Kütüphaneler arası kitap devir fişi oluşturun"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Libraries */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Kütüphaneler
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>
                                        Çıkış Kütüphanesi{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={cikisKutuphaneId}
                                        onValueChange={(val) => {
                                            setCikisKutuphaneId(val);
                                            // Clear selected books when source library changes
                                            setSelectedBooks([]);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kütüphane seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kutuphaneler.map((k) => (
                                                <SelectItem
                                                    key={k.id}
                                                    value={k.id}
                                                >
                                                    {k.adi} ({k.kodu})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>
                                        Giriş Kütüphanesi{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={girisKutuphaneId}
                                        onValueChange={setGirisKutuphaneId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kütüphane seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kutuphaneler
                                                .filter(
                                                    (k) =>
                                                        k.id !==
                                                        cikisKutuphaneId
                                                )
                                                .map((k) => (
                                                    <SelectItem
                                                        key={k.id}
                                                        value={k.id}
                                                    >
                                                        {k.adi} ({k.kodu})
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {cikisKutuphaneId && girisKutuphaneId && (
                                <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
                                    <ArrowRight className="h-4 w-4 shrink-0" />
                                    <span>
                                        {kutuphaneler.find(
                                            (k) => k.id === cikisKutuphaneId
                                        )?.adi || ""}{" "}
                                        →{" "}
                                        {kutuphaneler.find(
                                            (k) => k.id === girisKutuphaneId
                                        )?.adi || ""}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* People */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Sorumlular
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label>
                                        Teslim Eden{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={teslimEdenId}
                                        onValueChange={setTeslimEdenId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kişi seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kullanicilar.map((u) => (
                                                <SelectItem
                                                    key={u.id}
                                                    value={u.id}
                                                >
                                                    {u.firstName} {u.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>
                                        Teslim Alan{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={teslimAlanId}
                                        onValueChange={setTeslimAlanId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kişi seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kullanicilar.map((u) => (
                                                <SelectItem
                                                    key={u.id}
                                                    value={u.id}
                                                >
                                                    {u.firstName} {u.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>
                                        Onaylayan{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={onaylayanId}
                                        onValueChange={setOnaylayanId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kişi seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {kullanicilar.map((u) => (
                                                <SelectItem
                                                    key={u.id}
                                                    value={u.id}
                                                >
                                                    {u.firstName} {u.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Description & Notes */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Açıklama</Label>
                                <Textarea
                                    value={aciklama}
                                    onChange={(e) =>
                                        setAciklama(e.target.value)
                                    }
                                    placeholder="Devir açıklaması..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Notlar</Label>
                                <Textarea
                                    value={notlar}
                                    onChange={(e) =>
                                        setNotlar(e.target.value)
                                    }
                                    placeholder="Varsa ek notlar..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Book Search & List */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Kitaplar
                            </h4>

                            {!cikisKutuphaneId ? (
                                <p className="text-sm text-amber-600">
                                    Kitap eklemek için önce çıkış kütüphanesini
                                    seçin
                                </p>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        ref={bookSearchRef}
                                        placeholder="Kitap adı, barkod, ISBN, demirbaş no veya yazar ara..."
                                        value={bookSearchInput}
                                        onChange={(e) =>
                                            setBookSearchInput(e.target.value)
                                        }
                                        onKeyDown={handleBookEnter}
                                        onFocus={() =>
                                            setBookSearchFocused(true)
                                        }
                                        onBlur={() =>
                                            setTimeout(
                                                () =>
                                                    setBookSearchFocused(false),
                                                200
                                            )
                                        }
                                        className="h-11 pl-10"
                                    />
                                    {bookSearchLoading && (
                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                    )}

                                    {bookSearchFocused &&
                                        bookSearchResults.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-card shadow-xl">
                                                {bookSearchResults.map(
                                                    (kitap) => (
                                                        <button
                                                            key={kitap.id}
                                                            type="button"
                                                            onMouseDown={(e) =>
                                                                e.preventDefault()
                                                            }
                                                            onClick={() =>
                                                                handleBookSelect(
                                                                    kitap
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                                                        >
                                                            <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="truncate text-sm font-medium">
                                                                    {
                                                                        kitap.baslik
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {[
                                                                        kitap.yazarlar &&
                                                                        kitap.yazarlar,
                                                                        kitap.barkod &&
                                                                        `Barkod: ${kitap.barkod}`,
                                                                        kitap.demirbasNo &&
                                                                        `Demirbaş: ${kitap.demirbasNo}`,
                                                                    ]
                                                                        .filter(
                                                                            Boolean
                                                                        )
                                                                        .join(
                                                                            " · "
                                                                        )}
                                                                </p>
                                                            </div>
                                                            <Plus className="h-4 w-4 shrink-0 text-blue-500" />
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}

                                    {bookSearchFocused &&
                                        bookSearchInput.trim() &&
                                        !bookSearchLoading &&
                                        bookSearchResults.length === 0 && (
                                            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground shadow-xl">
                                                Uygun kitap bulunamadı
                                            </div>
                                        )}
                                </div>
                            )}

                            {/* Selected books */}
                            {selectedBooks.length > 0 && (
                                <Card className="border-dashed">
                                    <CardHeader className="pb-2 pt-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">
                                                Seçilen Kitaplar
                                            </CardTitle>
                                            <Badge variant="secondary">
                                                {selectedBooks.length} kitap
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <div className="space-y-2">
                                            {selectedBooks.map(
                                                (kitap, index) => (
                                                    <div
                                                        key={kitap.id}
                                                        className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                                                    >
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {kitap.baslik}
                                                            </p>
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {[
                                                                    kitap.yazarlar,
                                                                    kitap.isbn &&
                                                                    `ISBN: ${kitap.isbn}`,
                                                                    kitap.demirbasNo &&
                                                                    `Demirbaş: ${kitap.demirbasNo}`,
                                                                ]
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                                    .join(
                                                                        " · "
                                                                    )}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500"
                                                            onClick={() =>
                                                                removeBook(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {selectedBooks.length === 0 &&
                                cikisKutuphaneId && (
                                    <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                                        <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-40" />
                                        Henüz kitap eklenmedi. Yukarıdan arayarak
                                        kitap ekleyin.
                                    </div>
                                )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            İptal
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editing ? "Güncelle" : "Oluştur"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════
                DETAIL DIALOG
            ═══════════════════════════════════════════════════════════════ */}
            <Dialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
            >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Devir Fişi Detayı
                        </DialogTitle>
                        <DialogDescription>
                            {viewing?.fisNo}
                        </DialogDescription>
                    </DialogHeader>

                    {viewing && (
                        <div className="space-y-6 py-4">
                            {/* Status badge */}
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant={
                                        durumColors[viewing.durum] || "outline"
                                    }
                                    className="text-sm px-3 py-1"
                                >
                                    {durumLabels[viewing.durum] || viewing.durum}
                                </Badge>
                                {viewing.iadenedeni && (
                                    <span className="text-sm text-red-500">
                                        İade nedeni: {viewing.iadenedeni}
                                    </span>
                                )}
                            </div>

                            {/* Info grid */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoItem
                                    label="Çıkış Kütüphanesi"
                                    value={`${viewing.cikisKutuphane.adi} (${viewing.cikisKutuphane.kodu})`}
                                />
                                <InfoItem
                                    label="Giriş Kütüphanesi"
                                    value={`${viewing.girisKutuphane.adi} (${viewing.girisKutuphane.kodu})`}
                                />
                                <InfoItem
                                    label="Teslim Eden"
                                    value={fullName(viewing.teslimEden)}
                                />
                                <InfoItem
                                    label="Teslim Alan"
                                    value={fullName(viewing.teslimAlan)}
                                />
                                <InfoItem
                                    label="Onaylayan"
                                    value={fullName(viewing.onaylayan)}
                                />
                                <InfoItem
                                    label="Oluşturan"
                                    value={fullName(viewing.olusturan)}
                                />
                                <InfoItem
                                    label="Oluşturma Tarihi"
                                    value={formatDateTime(viewing.createdAt)}
                                />
                                {viewing.teslimTarihi && (
                                    <InfoItem
                                        label="Teslim Tarihi"
                                        value={formatDateTime(
                                            viewing.teslimTarihi
                                        )}
                                    />
                                )}
                                {viewing.onayTarihi && (
                                    <InfoItem
                                        label="Onay Tarihi"
                                        value={formatDateTime(
                                            viewing.onayTarihi
                                        )}
                                    />
                                )}
                            </div>

                            {viewing.aciklama && (
                                <InfoItem
                                    label="Açıklama"
                                    value={viewing.aciklama}
                                />
                            )}

                            {viewing.notlar && (
                                <InfoItem
                                    label="Notlar"
                                    value={viewing.notlar}
                                />
                            )}

                            {/* Books list */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">
                                    Kitap Listesi ({viewing.kitaplar?.length || 0}{" "}
                                    adet)
                                </h4>
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-10">
                                                    #
                                                </TableHead>
                                                <TableHead>Başlık</TableHead>
                                                <TableHead>Yazar</TableHead>
                                                <TableHead>
                                                    Demirbaş No
                                                </TableHead>
                                                <TableHead>Barkod</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewing.kitaplar?.map(
                                                (dk, index) => (
                                                    <TableRow key={dk.id}>
                                                        <TableCell className="text-muted-foreground">
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {dk.kitap.baslik}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {dk.kitap
                                                                .yazarlar ||
                                                                "—"}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm">
                                                            {dk.kitap
                                                                .demirbasNo ||
                                                                "—"}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm">
                                                            {dk.kitap.barkod ||
                                                                "—"}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {viewing && (
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => generatePDF(viewing)}
                            >
                                <FileDown className="h-4 w-4" />
                                PDF İndir
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => setDetailDialogOpen(false)}
                        >
                            Kapat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════
                DELETE CONFIRMATION
            ═══════════════════════════════════════════════════════════════ */}
            <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Devir Fişini Sil</DialogTitle>
                        <DialogDescription>
                            <strong>{deleting?.fisNo}</strong> numaralı devir
                            fişini silmek istediğinize emin misiniz? Bu işlem
                            geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
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
                        >
                            {saving && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════
                ACTION (WORKFLOW) DIALOG
            ═══════════════════════════════════════════════════════════════ */}
            <Dialog
                open={actionDialogOpen}
                onOpenChange={setActionDialogOpen}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {actionLabels[actionType] || "İşlem"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionDescriptions[actionType] || ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {actionTarget && (
                            <div className="rounded-lg bg-muted/50 p-3 text-sm">
                                <p>
                                    <strong>Fiş No:</strong>{" "}
                                    {actionTarget.fisNo}
                                </p>
                                <p>
                                    <strong>Çıkış:</strong>{" "}
                                    {actionTarget.cikisKutuphane.adi} →{" "}
                                    <strong>Giriş:</strong>{" "}
                                    {actionTarget.girisKutuphane.adi}
                                </p>
                                <p>
                                    <strong>Kitap Sayısı:</strong>{" "}
                                    {actionTarget._count.kitaplar}
                                </p>
                            </div>
                        )}

                        {actionType === "iadeEt" && (
                            <div className="grid gap-2">
                                <Label>
                                    İade / Red Nedeni{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    value={actionReason}
                                    onChange={(e) =>
                                        setActionReason(e.target.value)
                                    }
                                    placeholder="İade / red nedenini yazın..."
                                    rows={3}
                                />
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setActionDialogOpen(false)}
                            disabled={saving}
                        >
                            İptal
                        </Button>
                        <Button
                            variant={
                                actionType === "iadeEt"
                                    ? "destructive"
                                    : "default"
                            }
                            onClick={handleAction}
                            disabled={
                                saving ||
                                (actionType === "iadeEt" &&
                                    !actionReason.trim())
                            }
                        >
                            {saving && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {actionLabels[actionType] || "Onayla"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

// ─── Info Item ─────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </p>
            <p className="text-sm font-medium">{value || "—"}</p>
        </div>
    );
}
