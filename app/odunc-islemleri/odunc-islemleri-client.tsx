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
    Search,
    BookOpen,
    BookCheck,
    AlertTriangle,
    Loader2,
    RotateCcw,
    ArrowRightLeft,
    Ban,
    CircleDollarSign,
    BookX,
    Clock,
    ScanBarcode,
    X,
    Trash2,
    UserCheck,
    Plus,
    BookPlus,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Odunc {
    id: string;
    uuid: string;
    oduncTarihi: string;
    sonIadeTarihi: string;
    iadeTarihi: string | null;
    uzatmaSayisi: number;
    maksimumUzatma: number;
    durum: string;
    gecikmeCezasi: string | null;
    cezaOdendi: boolean;
    notlar: string | null;
    kitapId: string;
    kitap: { id: string; baslik: string; isbn: string | null; barkod: string | null };
    uyeId: string;
    uye: { id: string; adi: string; soyadi: string; kartNumarasi: string | null };
    kutuphaneId: string;
    kutuphane: { id: string; adi: string; kodu: string };
    createdAt: string;
}

interface Kitap {
    id: string;
    baslik: string;
    isbn: string | null;
    barkod: string | null;
    demirbasNo: string | null;
    durum: string;
    kutuphaneId: string;
}

interface Uye {
    id: string;
    adi: string;
    soyadi: string;
    tcKimlikNo: string;
    kartNumarasi: string | null;
    aktif: boolean;
    kutuphaneId: string;
    uyeTipi: { id: string; adi: string; maksimumKitap: number; oduncSuresi: number };
    _count?: { oduncler: number };
}

interface Kutuphane {
    id: string;
    adi: string;
    kodu: string;
}

// Book selected for loan queue
interface LoanQueueItem {
    kitap: Kitap;
    notlar: string;
}

const durumLabels: Record<string, string> = {
    AKTIF: "Aktif",
    IADE_EDILDI: "İade Edildi",
    GECIKMIS: "Gecikmiş",
    KAYIP: "Kayıp",
    IPTAL: "İptal",
};

const durumColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    AKTIF: "default",
    IADE_EDILDI: "secondary",
    GECIKMIS: "destructive",
    KAYIP: "destructive",
    IPTAL: "outline",
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function isOverdue(sonIadeTarihi: string, durum: string) {
    if (durum !== "AKTIF") return false;
    return new Date() > new Date(sonIadeTarihi);
}

function getDaysUntilDue(sonIadeTarihi: string) {
    const diff = new Date(sonIadeTarihi).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Tabs ───────────────────────────────────────────────────────────────
type TabType = "odunc-ver" | "kayitlar";

export default function OduncIslemleriClient({ user }: { user: SessionUser }) {
    const [activeTab, setActiveTab] = React.useState<TabType>("odunc-ver");

    // ─── State for Kayıtlar (Records) tab ──────────────────────────────
    const [oduncler, setOduncler] = React.useState<Odunc[]>([]);
    const [statsData, setStatsData] = React.useState<Record<string, number>>({ total: 0 });
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [filterDurum, setFilterDurum] = React.useState("all");
    const [page, setPage] = React.useState(1);
    const [pageSize] = React.useState(50);
    const [total, setTotal] = React.useState(0);
    const [searchDebounced, setSearchDebounced] = React.useState("");
    const [recordsKutuphaneFilter, setRecordsKutuphaneFilter] = React.useState(
        user.kutuphaneId || "all"
    );

    // Action dialog
    const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
    const [actionType, setActionType] = React.useState<string>("");
    const [actionTarget, setActionTarget] = React.useState<Odunc | null>(null);
    const [actionNote, setActionNote] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");

    // ─── State for Ödünç Ver (New Loan) tab ────────────────────────────
    const [kutuphaneler, setKutuphaneler] = React.useState<Kutuphane[]>([]);

    // Barcode / search input
    const [bookSearchInput, setBookSearchInput] = React.useState("");
    const [bookSearchResults, setBookSearchResults] = React.useState<Kitap[]>([]);
    const [bookSearchFocused, setBookSearchFocused] = React.useState(false);
    const [bookSearchLoading, setBookSearchLoading] = React.useState(false);

    // Member search
    const [memberSearchInput, setMemberSearchInput] = React.useState("");
    const [memberSearchResults, setMemberSearchResults] = React.useState<Uye[]>([]);
    const [memberSearchFocused, setMemberSearchFocused] = React.useState(false);
    const [memberSearchLoading, setMemberSearchLoading] = React.useState(false);

    // Selected member
    const [selectedMember, setSelectedMember] = React.useState<Uye | null>(null);
    const [memberActiveLoans, setMemberActiveLoans] = React.useState(0);

    // Loan queue
    const [loanQueue, setLoanQueue] = React.useState<LoanQueueItem[]>([]);
    const [loanProcessing, setLoanProcessing] = React.useState(false);
    const [loanSuccess, setLoanSuccess] = React.useState<string[]>([]);
    const [loanError, setLoanError] = React.useState("");

    // Kütüphane (admin only)
    const [selectedKutuphane, setSelectedKutuphane] = React.useState(user.kutuphaneId || "");

    const isAdmin = user.role === "ADMIN";

    const bookSearchRef = React.useRef<HTMLInputElement>(null);
    const memberSearchRef = React.useRef<HTMLInputElement>(null);
    const bookSearchTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);
    const memberSearchTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    // Fetch data
    const fetchRecords = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("pageSize", String(pageSize));
            if (searchDebounced.trim()) params.set("search", searchDebounced.trim());
            if (filterDurum && filterDurum !== "all") params.set("durum", filterDurum);
            if (isAdmin && recordsKutuphaneFilter && recordsKutuphaneFilter !== "all") {
                params.set("kutuphaneId", recordsKutuphaneFilter);
            }

            const res = await fetch(`/api/odunc-islemleri?${params}`);
            if (!res.ok) return;

            const payload = await res.json();
            const records: Odunc[] = Array.isArray(payload) ? payload : payload.data || [];
            setOduncler(records);
            setTotal(Array.isArray(payload) ? records.length : payload.total ?? records.length);
            setStatsData(
                Array.isArray(payload)
                    ? {
                        total: records.length,
                        AKTIF: records.filter((o) => o.durum === "AKTIF").length,
                        GECIKMIS: records.filter(
                            (o) => o.durum === "AKTIF" && isOverdue(o.sonIadeTarihi, o.durum)
                        ).length,
                        IADE_EDILDI: records.filter((o) => o.durum === "IADE_EDILDI").length,
                    }
                    : payload.stats || { total: 0 }
            );
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchDebounced, filterDurum, isAdmin, recordsKutuphaneFilter]);

    const fetchKutuphaneler = React.useCallback(async () => {
        if (!isAdmin) return;
        const res = await fetch("/api/kutuphaneler");
        if (!res.ok) return;
        const data = await res.json();
        setKutuphaneler(Array.isArray(data) ? data : data.data || []);
    }, [isAdmin]);

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchDebounced(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    React.useEffect(() => {
        setPage(1);
    }, [filterDurum, recordsKutuphaneFilter]);

    React.useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    React.useEffect(() => {
        fetchKutuphaneler();
    }, [fetchKutuphaneler]);

    // ─── Book Search Logic (lazy API search) ──────────────────────────
    React.useEffect(() => {
        if (!selectedMember || !bookSearchInput.trim()) {
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
                params.set("durum", "MEVCUT");
                if (isAdmin && selectedKutuphane) {
                    params.set("kutuphaneId", selectedKutuphane);
                }

                const res = await fetch(`/api/kitaplar?${params}`);
                if (!res.ok) {
                    setBookSearchResults([]);
                    return;
                }

                const data = await res.json();
                const books: Kitap[] = Array.isArray(data) ? data : data.data || [];
                setBookSearchResults(
                    books
                        .filter((k) => !loanQueue.some((lq) => lq.kitap.id === k.id))
                        .slice(0, 10)
                );
            } finally {
                setBookSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(bookSearchTimeout.current);
    }, [bookSearchInput, selectedMember, selectedKutuphane, isAdmin, loanQueue]);

    // ─── Member Search Logic (lazy API search) ────────────────────────
    React.useEffect(() => {
        if (!memberSearchInput.trim()) {
            setMemberSearchResults([]);
            return;
        }

        clearTimeout(memberSearchTimeout.current);
        memberSearchTimeout.current = setTimeout(async () => {
            setMemberSearchLoading(true);
            try {
                const params = new URLSearchParams();
                params.set("search", memberSearchInput.trim());
                params.set("pageSize", "20");
                params.set("aktif", "true");
                if (isAdmin && selectedKutuphane) {
                    params.set("kutuphaneId", selectedKutuphane);
                }

                const res = await fetch(`/api/uyeler?${params}`);
                if (!res.ok) {
                    setMemberSearchResults([]);
                    return;
                }

                const data = await res.json();
                const members: Uye[] = Array.isArray(data) ? data : data.data || [];
                setMemberSearchResults(members.slice(0, 8));
            } finally {
                setMemberSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(memberSearchTimeout.current);
    }, [memberSearchInput, isAdmin, selectedKutuphane]);

    // When a member is selected, count their active loans
    React.useEffect(() => {
        if (!selectedMember) {
            setMemberActiveLoans(0);
            return;
        }

        const fetchMemberLoans = async () => {
            try {
                const params = new URLSearchParams();
                params.set("uyeId", selectedMember.id);
                params.set("durum", "AKTIF");
                params.set("page", "1");
                params.set("pageSize", "1");
                if (isAdmin && selectedKutuphane) {
                    params.set("kutuphaneId", selectedKutuphane);
                }

                const res = await fetch(`/api/odunc-islemleri?${params}`);
                if (!res.ok) {
                    setMemberActiveLoans(0);
                    return;
                }

                const data = await res.json();
                setMemberActiveLoans(data.total ?? 0);
            } catch {
                setMemberActiveLoans(0);
            }
        };

        fetchMemberLoans();
    }, [selectedMember, isAdmin, selectedKutuphane]);

    // ─── Book select (Enter in barcode field or click) ─────────────────
    const handleBookSelect = (kitap: Kitap) => {
        if (!selectedMember) {
            setLoanError("Önce bir üye seçmelisiniz");
            return;
        }
        const maxBooks = selectedMember.uyeTipi.maksimumKitap;
        const currentTotal = memberActiveLoans + loanQueue.length;
        if (currentTotal >= maxBooks) {
            setLoanError(
                `Bu üye en fazla ${maxBooks} kitap ödünç alabilir. Şu an ${memberActiveLoans} aktif ödüncü ve kuyrukta ${loanQueue.length} kitap var.`
            );
            return;
        }

        setLoanQueue((prev) => [...prev, { kitap, notlar: "" }]);
        setBookSearchInput("");
        setBookSearchResults([]);
        setLoanError("");
        bookSearchRef.current?.focus();
    };

    const handleBookEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (bookSearchResults.length === 1) {
                handleBookSelect(bookSearchResults[0]);
            } else if (bookSearchResults.length > 1) {
                // Exact barcode match
                const exact = bookSearchResults.find(
                    (k) =>
                        k.barkod?.toLowerCase() === bookSearchInput.toLowerCase().trim()
                );
                if (exact) handleBookSelect(exact);
            }
        }
    };

    const removeFromQueue = (index: number) => {
        setLoanQueue((prev) => prev.filter((_, i) => i !== index));
    };

    // ─── Member select ─────────────────────────────────────────────────
    const handleMemberSelect = (uye: Uye) => {
        setSelectedMember(uye);
        setMemberSearchInput("");
        setMemberSearchResults([]);
        setLoanError("");
        // Focus the barcode input after selecting a member
        setTimeout(() => bookSearchRef.current?.focus(), 100);
    };

    const clearMember = () => {
        setSelectedMember(null);
        setLoanQueue([]);
        setLoanError("");
        setLoanSuccess([]);
    };

    // ─── Process all loans ─────────────────────────────────────────────
    const processLoans = async () => {
        if (!selectedMember || loanQueue.length === 0) return;
        setLoanProcessing(true);
        setLoanError("");
        setLoanSuccess([]);

        const successes: string[] = [];
        let lastError = "";

        for (const item of loanQueue) {
            try {
                const res = await fetch("/api/odunc-islemleri", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        kitapId: item.kitap.id,
                        uyeId: selectedMember.id,
                        kutuphaneId: isAdmin ? selectedKutuphane : undefined,
                        notlar: item.notlar || undefined,
                    }),
                });
                if (res.ok) {
                    successes.push(item.kitap.baslik);
                } else {
                    const data = await res.json();
                    lastError = `${item.kitap.baslik}: ${data.error}`;
                }
            } catch {
                lastError = `${item.kitap.baslik}: Bir hata oluştu`;
            }
        }

        setLoanSuccess(successes);
        if (lastError) setLoanError(lastError);

        // Clear processed items and refresh data
        setLoanQueue([]);
        await fetchRecords();
        setLoanProcessing(false);
    };

    // ─── Action handlers (Return, Extend, etc.) ────────────────────────
    const openAction = (odunc: Odunc, type: string) => {
        setActionTarget(odunc);
        setActionType(type);
        setActionNote("");
        setError("");
        setActionDialogOpen(true);
    };

    const handleAction = async () => {
        if (!actionTarget) return;
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/odunc-islemleri/${actionTarget.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: actionType,
                    notlar: actionNote || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Bir hata oluştu");
                return;
            }

            setActionDialogOpen(false);
            setActionTarget(null);
            fetchRecords();
        } catch {
            setError("Bir hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    // ─── Computed ──────────────────────────────────────────────────────
    const stats = {
        total: statsData.total || 0,
        aktif: statsData.AKTIF || 0,
        geciken: statsData.GECIKMIS || 0,
        iadeEdilen: statsData.IADE_EDILDI || 0,
    };

    const actionLabels: Record<string, string> = {
        iade: "İade Et",
        uzat: "Süre Uzat",
        iptal: "İptal Et",
        kayip: "Kayıp İşaretle",
        ceza_odendi: "Ceza Ödendi",
    };

    const actionDescriptions: Record<string, string> = {
        iade: "Bu kitabı iade etmek istediğinize emin misiniz? Gecikme varsa ceza otomatik hesaplanacaktır.",
        uzat: "Ödünç süresini uzatmak istediğinize emin misiniz?",
        iptal: "Bu ödünç kaydını iptal etmek istediğinize emin misiniz?",
        kayip: "Bu kitabı kayıp olarak işaretlemek istediğinize emin misiniz?",
        ceza_odendi: "Gecikme cezasının ödendiğini onaylıyor musunuz?",
    };

    const memberLimit = selectedMember?.uyeTipi.maksimumKitap ?? 0;
    const memberRemainingSlots = memberLimit - memberActiveLoans - loanQueue.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Ödünç İşlemleri
                    </h1>
                    <p className="text-muted-foreground">
                        Kitap ödünç verme, iade ve kayıt yönetimi
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-1 rounded-lg border bg-muted/50 p-1 w-fit">
                    <button
                        onClick={() => setActiveTab("odunc-ver")}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === "odunc-ver"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <BookPlus className="h-4 w-4" />
                        Ödünç Ver
                    </button>
                    <button
                        onClick={() => setActiveTab("kayitlar")}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === "kayitlar"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <BookOpen className="h-4 w-4" />
                        Kayıtlar
                        {stats.geciken > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                {stats.geciken}
                            </span>
                        )}
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    TAB: ÖDÜNÇ VER  (New Loan — barcode/search based)
                ═══════════════════════════════════════════════════════════════ */}
                {activeTab === "odunc-ver" && (
                    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                        {/* Left column — book search + queue */}
                        <div className="space-y-4">
                            {/* Admin: library selector */}
                            {isAdmin && (
                                <Card>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center gap-4">
                                            <Label className="shrink-0 text-sm font-medium">Kütüphane:</Label>
                                            <Select value={selectedKutuphane} onValueChange={setSelectedKutuphane}>
                                                <SelectTrigger className="w-64">
                                                    <SelectValue placeholder="Kütüphane seçin" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {kutuphaneler.map((k) => (
                                                        <SelectItem key={k.id} value={k.id}>
                                                            {k.adi} ({k.kodu})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Book search / barcode input */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ScanBarcode className="h-5 w-5 text-blue-500" />
                                        Kitap Ara / Barkod Okut
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            ref={bookSearchRef}
                                            placeholder="Barkod okutun veya kitap adı / ISBN yazın... (Enter ile seç)"
                                            value={bookSearchInput}
                                            onChange={(e) => setBookSearchInput(e.target.value)}
                                            onKeyDown={handleBookEnter}
                                            onFocus={() => setBookSearchFocused(true)}
                                            onBlur={() => setTimeout(() => setBookSearchFocused(false), 200)}
                                            className="h-12 pl-10 text-base"
                                            disabled={!selectedMember}
                                        />
                                        {!selectedMember && (
                                            <p className="mt-2 text-xs text-amber-600">
                                                Kitap eklemek için önce sağ panelden bir üye seçin
                                            </p>
                                        )}

                                        {/* Search results dropdown */}
                                        {bookSearchFocused && bookSearchLoading && (
                                            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground shadow-xl">
                                                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                            </div>
                                        )}

                                        {bookSearchFocused && !bookSearchLoading && bookSearchResults.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-card shadow-xl">
                                                {bookSearchResults.map((kitap) => (
                                                    <button
                                                        key={kitap.id}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => handleBookSelect(kitap)}
                                                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                                                    >
                                                        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="truncate text-sm font-medium">
                                                                {kitap.baslik}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {[
                                                                    kitap.barkod && `Barkod: ${kitap.barkod}`,
                                                                    kitap.isbn && `ISBN: ${kitap.isbn}`,
                                                                    kitap.demirbasNo && `Demirbaş: ${kitap.demirbasNo}`,
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(" • ")}
                                                            </p>
                                                        </div>
                                                        <Plus className="h-4 w-4 shrink-0 text-blue-500" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {bookSearchFocused &&
                                            !bookSearchLoading &&
                                            bookSearchInput.trim() &&
                                            bookSearchResults.length === 0 && (
                                                <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground shadow-xl">
                                                    Uygun kitap bulunamadı
                                                </div>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Loan Queue */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                                            Ödünç Listesi
                                            {loanQueue.length > 0 && (
                                                <Badge variant="secondary" className="ml-1">
                                                    {loanQueue.length} kitap
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        {selectedMember && (
                                            <span className={`text-xs font-medium ${memberRemainingSlots <= 0 ? "text-red-500" : memberRemainingSlots <= 1 ? "text-amber-500" : "text-muted-foreground"}`}>
                                                Kalan hak: {Math.max(0, memberRemainingSlots)} / {memberLimit}
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loanError && (
                                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            {loanError}
                                        </div>
                                    )}

                                    {loanSuccess.length > 0 && (
                                        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-400">
                                            <div className="flex items-center gap-2 font-medium">
                                                <CheckCircle2 className="h-4 w-4" />
                                                {loanSuccess.length} kitap başarıyla ödünç verildi
                                            </div>
                                            <ul className="mt-1 ml-6 list-disc text-xs">
                                                {loanSuccess.map((title, i) => (
                                                    <li key={i}>{title}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {loanQueue.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <ScanBarcode className="mb-3 h-12 w-12 text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">
                                                {selectedMember
                                                    ? "Kitap barkodunu okutun veya arama yaparak listeye ekleyin"
                                                    : "Ödünç verme işlemine başlamak için önce bir üye seçin"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-10">#</TableHead>
                                                        <TableHead>Kitap</TableHead>
                                                        <TableHead className="hidden sm:table-cell">Barkod</TableHead>
                                                        <TableHead className="w-10"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {loanQueue.map((item, idx) => (
                                                        <TableRow key={item.kitap.id}>
                                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                                {idx + 1}
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="font-medium text-sm">
                                                                    {item.kitap.baslik}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <code className="text-xs text-muted-foreground">
                                                                    {item.kitap.barkod || item.kitap.isbn || "—"}
                                                                </code>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                                                    onClick={() => removeFromQueue(idx)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            <div className="flex items-center justify-between border-t pt-4 mt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setLoanQueue([]);
                                                        setLoanError("");
                                                    }}
                                                    className="gap-2"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                    Temizle
                                                </Button>
                                                <Button
                                                    onClick={processLoans}
                                                    disabled={loanProcessing || loanQueue.length === 0}
                                                    className="gap-2"
                                                >
                                                    {loanProcessing ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <BookCheck className="h-4 w-4" />
                                                    )}
                                                    {loanQueue.length} Kitabı Ödünç Ver
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right column — member selection panel */}
                        <div className="space-y-4">
                            <Card className={selectedMember ? "ring-2 ring-blue-500/30" : ""}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <UserCheck className="h-5 w-5 text-blue-500" />
                                        Üye Seçimi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {!selectedMember ? (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    ref={memberSearchRef}
                                                    placeholder="TC No, kart no veya isim yazın..."
                                                    value={memberSearchInput}
                                                    onChange={(e) => setMemberSearchInput(e.target.value)}
                                                    onFocus={() => setMemberSearchFocused(true)}
                                                    onBlur={() => setTimeout(() => setMemberSearchFocused(false), 200)}
                                                    className="pl-10"
                                                />

                                                {memberSearchFocused && memberSearchLoading && (
                                                    <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground shadow-xl">
                                                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                                    </div>
                                                )}

                                                {memberSearchFocused && !memberSearchLoading && memberSearchResults.length > 0 && (
                                                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-card shadow-xl">
                                                        {memberSearchResults.map((uye) => (
                                                            <button
                                                                key={uye.id}
                                                                type="button"
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => handleMemberSelect(uye)}
                                                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                                                            >
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
                                                                    {uye.adi[0]}{uye.soyadi[0]}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="truncate text-sm font-medium">
                                                                        {uye.adi} {uye.soyadi}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {uye.uyeTipi.adi} • {uye.kartNumarasi || uye.tcKimlikNo}
                                                                    </p>
                                                                </div>
                                                                <Badge variant="outline" className="text-[10px]">
                                                                    Max {uye.uyeTipi.maksimumKitap}
                                                                </Badge>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {memberSearchFocused &&
                                                    !memberSearchLoading &&
                                                    memberSearchInput.trim() &&
                                                    memberSearchResults.length === 0 && (
                                                        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground shadow-xl">
                                                            Uygun üye bulunamadı
                                                        </div>
                                                    )}
                                            </div>
                                            <p className="text-xs text-muted-foreground text-center">
                                                Ödünç verme işlemine başlamak için bir üye seçin
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Selected member card */}
                                            <div className="flex items-start gap-3 rounded-lg bg-blue-500/5 p-3 border border-blue-500/10">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
                                                    {selectedMember.adi[0]}{selectedMember.soyadi[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">
                                                        {selectedMember.adi} {selectedMember.soyadi}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {selectedMember.kartNumarasi || selectedMember.tcKimlikNo}
                                                    </p>
                                                    <Badge variant="secondary" className="mt-1 text-[10px]">
                                                        {selectedMember.uyeTipi.adi}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                                                    onClick={clearMember}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {/* Limits info */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Ödünç Süresi</span>
                                                    <span className="font-medium">{selectedMember.uyeTipi.oduncSuresi} gün</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Maks. Kitap</span>
                                                    <span className="font-medium">{memberLimit}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Aktif Ödünç</span>
                                                    <span className="font-medium">{memberActiveLoans}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Kuyrukta</span>
                                                    <span className="font-medium">{loanQueue.length}</span>
                                                </div>
                                                <div className="h-px bg-border" />
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">Kalan Hak</span>
                                                    <span className={`text-lg font-bold ${memberRemainingSlots <= 0 ? "text-red-500" : memberRemainingSlots <= 1 ? "text-amber-500" : "text-green-500"}`}>
                                                        {Math.max(0, memberRemainingSlots)}
                                                    </span>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-300 ${memberRemainingSlots <= 0
                                                            ? "bg-red-500"
                                                            : memberRemainingSlots <= 1
                                                                ? "bg-amber-500"
                                                                : "bg-blue-500"
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(100, ((memberActiveLoans + loanQueue.length) / memberLimit) * 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    TAB: KAYITLAR  (Records with actions)
                ═══════════════════════════════════════════════════════════════ */}
                {activeTab === "kayitlar" && (
                    <>
                        {/* Stats */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    label: "Toplam Kayıt",
                                    value: stats.total,
                                    icon: BookOpen,
                                    color: "text-blue-600 dark:text-blue-400",
                                    bg: "bg-blue-50 dark:bg-blue-950/50",
                                    border: "border-blue-100 dark:border-blue-900/50",
                                },
                                {
                                    label: "Aktif Ödünç",
                                    value: stats.aktif,
                                    icon: ArrowRightLeft,
                                    color: "text-emerald-600 dark:text-emerald-400",
                                    bg: "bg-emerald-50 dark:bg-emerald-950/50",
                                    border: "border-emerald-100 dark:border-emerald-900/50",
                                },
                                {
                                    label: "Geciken",
                                    value: stats.geciken,
                                    icon: AlertTriangle,
                                    color: "text-rose-600 dark:text-rose-400",
                                    bg: "bg-rose-50 dark:bg-rose-950/50",
                                    border: "border-rose-100 dark:border-rose-900/50",
                                },
                                {
                                    label: "İade Edilen",
                                    value: stats.iadeEdilen,
                                    icon: BookCheck,
                                    color: "text-amber-600 dark:text-amber-400",
                                    bg: "bg-amber-50 dark:bg-amber-950/50",
                                    border: "border-amber-100 dark:border-amber-900/50",
                                },
                            ].map((stat) => (
                                <Card key={stat.label} className={`border ${stat.border} ${stat.bg} shadow-none`}>
                                    <CardContent className="flex items-center gap-4 p-5">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                            <p className={`text-2xl font-bold tracking-tight ${stat.color}`}>
                                                {stat.value.toLocaleString("tr-TR")}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Filters & Table */}
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <CardTitle>Ödünç Kayıtları</CardTitle>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        {isAdmin && (
                                            <Select
                                                value={recordsKutuphaneFilter}
                                                onValueChange={setRecordsKutuphaneFilter}
                                            >
                                                <SelectTrigger className="w-full sm:w-56">
                                                    <SelectValue placeholder="Tüm Kütüphaneler" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Tüm Kütüphaneler</SelectItem>
                                                    {kutuphaneler.map((k) => (
                                                        <SelectItem key={k.id} value={k.id}>
                                                            {k.adi} ({k.kodu})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <Select value={filterDurum} onValueChange={setFilterDurum}>
                                            <SelectTrigger className="w-full sm:w-44">
                                                <SelectValue placeholder="Tüm Durumlar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tüm Durumlar</SelectItem>
                                                <SelectItem value="AKTIF">Aktif</SelectItem>
                                                <SelectItem value="IADE_EDILDI">İade Edildi</SelectItem>
                                                <SelectItem value="GECIKMIS">Gecikmiş</SelectItem>
                                                <SelectItem value="KAYIP">Kayıp</SelectItem>
                                                <SelectItem value="IPTAL">İptal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="relative w-full sm:w-72">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Üye adı, kitap adı..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : oduncler.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground">
                                        {search.trim() || filterDurum !== "all" || (isAdmin && recordsKutuphaneFilter !== "all")
                                            ? "Arama sonucu bulunamadı"
                                            : "Henüz ödünç kaydı bulunmuyor"}
                                    </div>
                                ) : (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Kitap</TableHead>
                                                    <TableHead>Üye</TableHead>
                                                    <TableHead className="hidden md:table-cell">Ödünç Tarihi</TableHead>
                                                    <TableHead className="hidden sm:table-cell">Son İade</TableHead>
                                                    {isAdmin && (
                                                        <TableHead className="hidden lg:table-cell">Kütüphane</TableHead>
                                                    )}
                                                    <TableHead>Durum</TableHead>
                                                    <TableHead className="hidden lg:table-cell text-center">Uzatma</TableHead>
                                                    <TableHead className="text-right">İşlemler</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {oduncler.map((o) => {
                                                    const overdue = isOverdue(o.sonIadeTarihi, o.durum);
                                                    const daysLeft = getDaysUntilDue(o.sonIadeTarihi);

                                                    return (
                                                        <TableRow key={o.id} className={overdue ? "bg-destructive/5" : undefined}>
                                                            <TableCell>
                                                                <div className="font-medium max-w-[180px] truncate">{o.kitap.baslik}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {o.kitap.isbn || o.kitap.barkod || "—"}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-medium">{o.uye.adi} {o.uye.soyadi}</div>
                                                                <div className="text-xs text-muted-foreground md:hidden">
                                                                    {formatDate(o.oduncTarihi)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden text-xs md:table-cell">
                                                                {formatDate(o.oduncTarihi)}
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <div className="text-xs">{formatDate(o.sonIadeTarihi)}</div>
                                                                {o.durum === "AKTIF" && (
                                                                    <div className={`text-[11px] ${overdue ? "text-destructive font-medium" : daysLeft <= 3 ? "text-orange-500" : "text-muted-foreground"}`}>
                                                                        {overdue ? `${Math.abs(daysLeft)} gün gecikmiş` : `${daysLeft} gün kaldı`}
                                                                    </div>
                                                                )}
                                                                {o.durum === "IADE_EDILDI" && o.iadeTarihi && (
                                                                    <div className="text-[11px] text-green-600">
                                                                        İade: {formatDate(o.iadeTarihi)}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            {isAdmin && (
                                                                <TableCell className="hidden lg:table-cell">
                                                                    <span className="text-xs">{o.kutuphane?.adi}</span>
                                                                </TableCell>
                                                            )}
                                                            <TableCell>
                                                                <div className="flex flex-col gap-1">
                                                                    <Badge variant={overdue ? "destructive" : durumColors[o.durum]}>
                                                                        {overdue ? "Gecikmiş" : durumLabels[o.durum]}
                                                                    </Badge>
                                                                    {o.gecikmeCezasi && (
                                                                        <span className={`text-[11px] ${o.cezaOdendi ? "text-green-600" : "text-destructive"}`}>
                                                                            ₺{parseFloat(o.gecikmeCezasi).toFixed(2)}
                                                                            {o.cezaOdendi ? " (ödendi)" : " (ödenmedi)"}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden lg:table-cell text-center">
                                                                <span className="text-xs">{o.uzatmaSayisi}/{o.maksimumUzatma}</span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <TooltipProvider>
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        {o.durum === "AKTIF" && (
                                                                            <>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            onClick={() => openAction(o, "iade")}
                                                                                            className="h-8 w-8 text-green-600 hover:text-green-600"
                                                                                        >
                                                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>İade Et</TooltipContent>
                                                                                </Tooltip>

                                                                                {!overdue && o.uzatmaSayisi < o.maksimumUzatma && (
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                onClick={() => openAction(o, "uzat")}
                                                                                                className="h-8 w-8 text-blue-600 hover:text-blue-600"
                                                                                            >
                                                                                                <Clock className="h-3.5 w-3.5" />
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>Süre Uzat</TooltipContent>
                                                                                    </Tooltip>
                                                                                )}

                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            onClick={() => openAction(o, "kayip")}
                                                                                            className="h-8 w-8 text-orange-600 hover:text-orange-600"
                                                                                        >
                                                                                            <BookX className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>Kayıp İşaretle</TooltipContent>
                                                                                </Tooltip>

                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            onClick={() => openAction(o, "iptal")}
                                                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                                                        >
                                                                                            <Ban className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>İptal Et</TooltipContent>
                                                                                </Tooltip>
                                                                            </>
                                                                        )}

                                                                        {o.gecikmeCezasi && !o.cezaOdendi && (
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        onClick={() => openAction(o, "ceza_odendi")}
                                                                                        className="h-8 w-8 text-emerald-600 hover:text-emerald-600"
                                                                                    >
                                                                                        <CircleDollarSign className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>Ceza Ödendi</TooltipContent>
                                                                            </Tooltip>
                                                                        )}
                                                                    </div>
                                                                </TooltipProvider>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>

                                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Toplam <strong>{total.toLocaleString("tr-TR")}</strong> kayıt
                                                {total > pageSize && (
                                                    <>
                                                        {" "}
                                                        &middot; Sayfa <strong>{page}</strong> / {totalPages}
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
                                                        onClick={() =>
                                                            setPage((p) => Math.min(totalPages, p + 1))
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
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Action Dialog (Return, Extend, Cancel, Lost, Penalty Paid) */}
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{actionLabels[actionType]}</DialogTitle>
                        <DialogDescription>{actionDescriptions[actionType]}</DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                    )}

                    {actionTarget && (
                        <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                            <p><strong>Kitap:</strong> {actionTarget.kitap.baslik}</p>
                            <p><strong>Üye:</strong> {actionTarget.uye.adi} {actionTarget.uye.soyadi}</p>
                            <p><strong>Son İade:</strong> {formatDate(actionTarget.sonIadeTarihi)}</p>
                            {actionType === "uzat" && (
                                <p><strong>Uzatma:</strong> {actionTarget.uzatmaSayisi}/{actionTarget.maksimumUzatma}</p>
                            )}
                        </div>
                    )}

                    {(actionType === "iade" || actionType === "iptal" || actionType === "kayip") && (
                        <div className="space-y-2">
                            <Label htmlFor="actionNote">Not (opsiyonel)</Label>
                            <Textarea
                                id="actionNote"
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                rows={2}
                                placeholder="Ek not ekleyebilirsiniz..."
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => { setActionDialogOpen(false); setError(""); }}
                            disabled={saving}
                        >
                            İptal
                        </Button>
                        <Button
                            variant={actionType === "iptal" || actionType === "kayip" ? "destructive" : "default"}
                            onClick={handleAction}
                            disabled={saving}
                            className="gap-2"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {actionLabels[actionType]}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
