"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    Library,
    Users,
    Shield,
    LogOut,
    LayoutDashboard,
    ChevronLeft,
    ChevronDown,
    Menu,
    Layers,
    Repeat,
    Tags,
    List,
    ArrowRightLeft,
    BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface SidebarGroup {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: SidebarItem[];
    roles?: string[];
}

const sidebarGroups: SidebarGroup[] = [
    {
        title: "Ana Menü",
        icon: LayoutDashboard,
        items: [
            { title: "Ana Sayfa", href: "/", icon: LayoutDashboard },
        ],
    },
    {
        title: "Kütüphane",
        icon: Library,
        items: [
            { title: "Kitaplar", href: "/kitaplar", icon: BookOpen },
            { title: "Kütüphaneler", href: "/kutuphaneler", icon: Library },
        ],
    },
    {
        title: "Üye Yönetimi",
        icon: Users,
        items: [
            { title: "Üyeler", href: "/uyeler", icon: Users },
            { title: "Üye Tipleri", href: "/uye-tipleri", icon: Layers },
        ],
    },
    {
        title: "Etiketler",
        icon: Tags,
        items: [
            { title: "Etiket Tasarımları", href: "/etiket-tasarimlari", icon: Tags },
            { title: "Etiket Listeleri", href: "/etiket-listeleri", icon: List },
        ],
    },
    {
        title: "İşlemler",
        icon: ArrowRightLeft,
        items: [
            { title: "Ödünç İşlemleri", href: "/odunc-islemleri", icon: ArrowRightLeft },
            { title: "Devir İşlemleri", href: "/devir-islemleri", icon: Repeat },
        ],
    },
    {
        title: "İstatistikler",
        icon: BarChart3,
        items: [
            { title: "İstatistikler", href: "/istatistikler", icon: BarChart3 },
        ],
        roles: ["ADMIN"],
    },
    {
        title: "Yönetim",
        icon: Shield,
        items: [
            { title: "Kullanıcılar", href: "/kullanicilar", icon: Shield },
        ],
        roles: ["ADMIN"],
    },
];

interface AppSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
}

export function AppSidebar({
    collapsed,
    onToggle,
    mobileOpen,
    onMobileClose,
    user,
}: AppSidebarProps) {
    const pathname = usePathname();

    // Track which groups are expanded
    const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(() => {
        const set = new Set<string>();
        for (const group of sidebarGroups) {
            for (const item of group.items) {
                if (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) {
                    set.add(group.title);
                    break;
                }
            }
        }
        set.add("Ana Menü");
        return set;
    });

    const toggleGroup = (title: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN": return { label: "Admin", color: "bg-red-500/20 text-red-300" };
            case "KUTUPHANECI": return { label: "Kütüphaneci", color: "bg-blue-500/20 text-blue-300" };
            case "MEMUR": return { label: "Memur", color: "bg-emerald-500/20 text-emerald-300" };
            default: return { label: role, color: "bg-slate-500/20 text-slate-300" };
        }
    };

    const sidebarContent = (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="İBSAD Logo"
                        width={34}
                        height={34}
                        className="shrink-0 rounded-lg"
                    />
                    {!collapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-[15px] font-bold text-slate-100 tracking-wide">
                                İBSAD
                            </span>
                            <span className="truncate text-[11px] text-slate-400">
                                Kütüphane Otomasyonu
                            </span>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <button
                        onClick={onToggle}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="mx-4 h-px bg-slate-700/50" />

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <TooltipProvider delayDuration={0}>
                    <div className="space-y-1">
                        {sidebarGroups.filter(g => !g.roles || (user?.role && g.roles.includes(user.role))).map((group) => {
                            const isExpanded = expandedGroups.has(group.title);
                            const hasActiveItem = group.items.some(
                                (item) =>
                                    pathname === item.href ||
                                    (item.href !== "/" && pathname.startsWith(item.href))
                            );

                            if (collapsed) {
                                return (
                                    <div key={group.title} className="space-y-0.5">
                                        {group.items.map((item) => {
                                            const isActive =
                                                pathname === item.href ||
                                                (item.href !== "/" && pathname.startsWith(item.href));
                                            return (
                                                <Tooltip key={item.href}>
                                                    <TooltipTrigger asChild>
                                                        <Link
                                                            href={item.href}
                                                            onClick={() => onMobileClose()}
                                                            className={cn(
                                                                "flex h-10 w-full items-center justify-center rounded-lg transition-all duration-200",
                                                                isActive
                                                                    ? "bg-blue-600/90 text-white shadow-md shadow-blue-600/20"
                                                                    : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                                                            )}
                                                        >
                                                            <item.icon className="h-[18px] w-[18px]" />
                                                        </Link>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="border-slate-600 bg-slate-700 text-slate-100">
                                                        {item.title}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                        <div className="my-2 h-px bg-slate-700/40" />
                                    </div>
                                );
                            }

                            return (
                                <div key={group.title} className="mb-1">
                                    <button
                                        onClick={() => toggleGroup(group.title)}
                                        className={cn(
                                            "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                            hasActiveItem
                                                ? "text-slate-100"
                                                : "text-slate-400 hover:bg-slate-700/40 hover:text-slate-300"
                                        )}
                                    >
                                        <group.icon className="h-[18px] w-[18px] shrink-0" />
                                        <span className="flex-1 text-left">{group.title}</span>
                                        <ChevronDown
                                            className={cn(
                                                "h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200",
                                                isExpanded && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    <div
                                        className={cn(
                                            "overflow-hidden transition-all duration-200",
                                            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                        )}
                                    >
                                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700/60 pl-3">
                                            {group.items.map((item) => {
                                                const isActive =
                                                    pathname === item.href ||
                                                    (item.href !== "/" && pathname.startsWith(item.href));
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => onMobileClose()}
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                                            isActive
                                                                ? "bg-blue-500/15 text-blue-300"
                                                                : "text-slate-400 hover:bg-slate-700/40 hover:text-slate-300"
                                                        )}
                                                    >
                                                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                                                        <span className="truncate">{item.title}</span>
                                                        {isActive && (
                                                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TooltipProvider>
            </nav>

            {/* Bottom — User Info + Logout */}
            <div className="mt-auto border-t border-slate-700/30 px-3 py-2.5">
                <div className={cn(
                    "flex items-center gap-2",
                    collapsed && "flex-col"
                )}>
                    <TooltipProvider delayDuration={0}>
                        {collapsed ? (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href="/profil"
                                            onClick={() => onMobileClose()}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-700/50"
                                        >
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback className="bg-slate-700 text-slate-200 text-[10px] font-semibold">
                                                    {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="border-slate-600 bg-slate-700 text-slate-100">
                                        {user ? `${user.firstName} ${user.lastName}` : "Profil"}
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={async () => {
                                                await fetch("/api/auth/logout", { method: "POST" });
                                                window.location.href = "/login";
                                            }}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="border-slate-600 bg-slate-700 text-slate-100">
                                        Çıkış Yap
                                    </TooltipContent>
                                </Tooltip>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/profil"
                                    onClick={() => onMobileClose()}
                                    className="flex flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-700/50 min-w-0"
                                >
                                    <Avatar className="h-7 w-7 shrink-0">
                                        <AvatarFallback className="bg-slate-700 text-slate-200 text-[10px] font-semibold">
                                            {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-[13px] font-medium text-slate-200 leading-tight">
                                            {user ? `${user.firstName} ${user.lastName}` : ""}
                                        </span>
                                        {user?.role && (
                                            <span className={cn("inline-flex self-start rounded px-1 py-px text-[9px] font-medium leading-tight", getRoleBadge(user.role).color)}>
                                                {getRoleBadge(user.role).label}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={async () => {
                                                await fetch("/api/auth/logout", { method: "POST" });
                                                window.location.href = "/login";
                                            }}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="border-slate-600 bg-slate-700 text-slate-100">
                                        Çıkış Yap
                                    </TooltipContent>
                                </Tooltip>
                            </>
                        )}
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar — always dark */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-300",
                    collapsed ? "w-[68px]" : "w-64",
                    mobileOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0"
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}

export function SidebarTrigger({
    onClick,
    className,
}: {
    onClick: () => void;
    className?: string;
}) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={className}
        >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menüyü aç</span>
        </Button>
    );
}
