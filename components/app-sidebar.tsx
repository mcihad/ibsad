"use client";

import * as React from "react";
import Link from "next/link";
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
    Menu,
    Layers,
    Repeat,
    Tags,
    List,
    ArrowRightLeft,
    BarChart3,
    User,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface SidebarSection {
    label?: string;
    items: SidebarItem[];
    roles?: string[];
}

const sidebarSections: SidebarSection[] = [
    {
        items: [
            { title: "Ana Sayfa", href: "/", icon: LayoutDashboard },
            { title: "Kitaplar", href: "/kitaplar", icon: BookOpen },
            { title: "Kütüphaneler", href: "/kutuphaneler", icon: Library },
            { title: "Üyeler", href: "/uyeler", icon: Users },
            { title: "Üye Tipleri", href: "/uye-tipleri", icon: Layers },
        ],
    },
    {
        label: "İşlemler",
        items: [
            { title: "Ödünç İşlemleri", href: "/odunc-islemleri", icon: ArrowRightLeft },
            { title: "Devir İşlemleri", href: "/devir-islemleri", icon: Repeat },
        ],
    },
    {
        label: "Etiketler",
        items: [
            { title: "Etiket Tasarımları", href: "/etiket-tasarimlari", icon: Tags },
            { title: "Etiket Listeleri", href: "/etiket-listeleri", icon: List },
        ],
    },
    {
        label: "Yönetim",
        items: [
            { title: "İstatistikler", href: "/istatistikler", icon: BarChart3 },
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

    const isActive = (href: string) =>
        pathname === href || (href !== "/" && pathname.startsWith(href));

    const sidebarContent = (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo.png"
                        alt="İBSAD Logo"
                        width={32}
                        height={32}
                        className="shrink-0 rounded-lg"
                    />
                    {!collapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-[15px] font-bold text-foreground tracking-wide">
                                İBSAD
                            </span>
                            <span className="truncate text-[11px] text-muted-foreground">
                                İlçe Bilgi Sistemleri Arşiv Düzeni
                            </span>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <button
                        onClick={onToggle}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="mx-4 h-px bg-border" />

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <TooltipProvider delayDuration={0}>
                    <div className="space-y-6">
                        {sidebarSections
                            .filter(s => !s.roles || (user?.role && s.roles.includes(user.role)))
                            .map((section, sIdx) => (
                                <div key={sIdx}>
                                    {/* Section Label */}
                                    {section.label && !collapsed && (
                                        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                            {section.label}
                                        </p>
                                    )}
                                    {section.label && collapsed && (
                                        <div className="mb-2 mx-auto h-px w-6 bg-border" />
                                    )}

                                    <div className="space-y-0.5">
                                        {section.items.map((item) => {
                                            const active = isActive(item.href);

                                            if (collapsed) {
                                                return (
                                                    <Tooltip key={item.href}>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={item.href}
                                                                onClick={() => onMobileClose()}
                                                                className={cn(
                                                                    "flex h-10 w-full items-center justify-center rounded-lg transition-all duration-200",
                                                                    active
                                                                        ? "bg-primary text-primary-foreground shadow-sm"
                                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                )}
                                                            >
                                                                <item.icon className="h-[18px] w-[18px]" />
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right">
                                                            {item.title}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => onMobileClose()}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                                        active
                                                            ? "bg-primary/10 text-primary"
                                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    )}
                                                >
                                                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                                                    <span className="truncate">{item.title}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>
                </TooltipProvider>
            </nav>

            {/* Bottom — User Info + Actions */}
            <div className="border-t border-border px-3 py-3">
                <TooltipProvider delayDuration={0}>
                    {collapsed ? (
                        <div className="flex flex-col items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/profil"
                                        onClick={() => onMobileClose()}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <Settings className="h-[18px] w-[18px]" />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">Ayarlar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={async () => {
                                            await fetch("/api/auth/logout", { method: "POST" });
                                            window.location.href = "/login";
                                        }}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                        <LogOut className="h-[18px] w-[18px]" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Çıkış Yap</TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {/* User info */}
                            <div className="flex-1 min-w-0 flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                    {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground truncate leading-tight">
                                        {user ? `${user.firstName} ${user.lastName}` : ""}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate leading-tight">
                                        {user?.email || ""}
                                    </p>
                                </div>
                            </div>
                            {/* Action icons */}
                            <div className="flex items-center gap-0.5 shrink-0">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href="/profil"
                                            onClick={() => onMobileClose()}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>Ayarlar</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={async () => {
                                                await fetch("/api/auth/logout", { method: "POST" });
                                                window.location.href = "/login";
                                            }}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Çıkış Yap</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    )}
                </TooltipProvider>
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

            {/* Sidebar — theme-aware (light/dark) */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300",
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
