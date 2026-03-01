"use client";

import * as React from "react";
import { AppSidebar, SidebarTrigger } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
    children: React.ReactNode;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
                user={user}
            />

            {/* Main Content */}
            <div
                className={cn(
                    "min-h-screen transition-all duration-300",
                    collapsed ? "lg:pl-[68px]" : "lg:pl-64"
                )}
            >
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:px-6">
                    {/* Mobile: open drawer, Desktop: toggle collapse */}
                    <SidebarTrigger
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                setMobileOpen(true);
                            } else {
                                setCollapsed(!collapsed);
                            }
                        }}
                    />

                    <div className="flex-1" />

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-4 w-4" />
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                3
                            </span>
                        </Button>
                        <ThemeToggle />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
