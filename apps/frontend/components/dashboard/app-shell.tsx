"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Banknote, BarChart3, Bell, ChevronLeft, ChevronRight,
  ClipboardList, Droplets, History, LayoutDashboard, Leaf, LogOut,
  Map, MapPin, Menu, QrCode, Search, Settings, ShieldAlert, Sprout,
  Sun, Users, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { CommandMenu } from "./command-menu";

const nav = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard, roles: ["OWNER", "MANAGER"] },
  { href: "/map", label: "Bản đồ", icon: Map, roles: ["OWNER", "MANAGER"] },
  { href: "/weather", label: "Thời tiết", icon: Sun, roles: ["OWNER", "MANAGER", "EMPLOYEE", "GUEST"] },
  { href: "/plants", label: "Cây trồng", icon: Sprout, roles: ["OWNER", "MANAGER"] },
  { href: "/zones", label: "Khu vực", icon: MapPin, roles: ["OWNER", "MANAGER"] },
  { href: "/employees", label: "Nhân sự", icon: Users, roles: ["OWNER", "MANAGER"] },
  { href: "/attendance-admin", label: "Chấm công", icon: ClipboardList, roles: ["OWNER", "MANAGER"] },
  { href: "/payroll", label: "Tiền lương", icon: Banknote, roles: ["OWNER", "MANAGER"] },
  { href: "/diseases", label: "Dịch bệnh", icon: ShieldAlert, roles: ["OWNER", "MANAGER"] },
  { href: "/fertilizers", label: "Phân & Thuốc", icon: Droplets, roles: ["OWNER", "MANAGER"] },
  { href: "/seasons", label: "Mùa vụ", icon: BarChart3, roles: ["OWNER", "MANAGER"] },
  { href: "/tasks", label: "Công việc", icon: ClipboardList, roles: ["OWNER", "MANAGER"] },
  { href: "/notifications", label: "Thông báo", icon: Bell, roles: ["OWNER", "MANAGER", "EMPLOYEE"] },
  { href: "/reports", label: "Báo cáo", icon: BarChart3, roles: ["OWNER"] },
  { href: "/activity-logs", label: "Lịch sử", icon: History, roles: ["OWNER"] },
];

const employeeNav = [
  { href: "/employee/tasks", label: "Việc cần làm", icon: ClipboardList },
  { href: "/employee/scan", label: "Quét QR", icon: QrCode },
  { href: "/employee/attendance", label: "Chấm công", icon: Leaf },
  { href: "/weather", label: "Thời tiết", icon: Sun },
];

// Shared nav item renderer
function NavItem({ href, icon: Icon, label, active, onClick }: {
  href: string; icon: any; label: string; active: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <span className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all",
        active
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
          : "text-neutral-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-neutral-800/50 border border-transparent",
      )}>
        <Icon className={cn("h-5 w-5 shrink-0", active && "text-emerald-600 dark:text-emerald-400")} />
        {label}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const clear = useAuthStore((s) => s.clear);
  const email = useAuthStore((s) => s.email);
  const role = useAuthStore((s) => s.role) || "GUEST";
  const [collapsed, setCollapsed] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isEmployeeArea = role === "EMPLOYEE" || pathname === "/employee" || pathname.startsWith("/employee/");

  const visibleNav = isEmployeeArea ? employeeNav : nav.filter((n) => n.roles.includes(role));

  // Close mobile drawer on route change
  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen((o) => !o); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="min-h-screen relative z-0">
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* ═══ Mobile Drawer Sidebar ═══ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-white dark:bg-neutral-950 shadow-2xl md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-white shadow border border-neutral-200">
                    <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-neutral-900 dark:text-white">Thanh Huyền</p>
                    <p className="text-[11px] text-neutral-400">Sầu Riêng Farm</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)}
                  className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
                {visibleNav.map((item) => (
                  <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
                    active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    onClick={() => setMobileOpen(false)} />
                ))}
                {isEmployeeArea && role !== "EMPLOYEE" && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <NavItem href="/dashboard" icon={ArrowLeft} label="Về Quản lý"
                      active={false} onClick={() => setMobileOpen(false)} />
                  </div>
                )}
              </nav>

              {/* Drawer footer */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 p-3 space-y-1">
                <NavItem href="/settings" icon={Settings} label="Cài đặt"
                  active={pathname === "/settings"} onClick={() => setMobileOpen(false)} />
                <button onClick={() => { clear(); setMobileOpen(false); }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 w-full border border-transparent transition-colors">
                  <LogOut className="h-5 w-5 shrink-0" />
                  Đăng xuất
                </button>
                {email && <p className="text-[11px] text-neutral-400 px-4 truncate">{email}</p>}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Desktop Floating Sidebar ═══ */}
      <aside className={cn(
        "fixed left-4 top-4 bottom-4 z-40 hidden floating-sidebar rounded-[2rem] transition-all duration-300 md:flex md:flex-col overflow-hidden",
        collapsed ? "w-[80px]" : "w-[260px]",
      )}>
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200/60 px-4 dark:border-neutral-800">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">Thanh Huyền</span>
              <span className="text-xs text-neutral-500">Sầu Riêng Farm</span>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 p-3 scrollbar-hide">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <motion.span whileHover={{ x: 4 }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300",
                    active
                      ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:from-emerald-500/30 dark:to-emerald-500/10 dark:text-emerald-300 shadow-sm border border-emerald-500/20"
                      : "text-neutral-600 hover:bg-white/50 dark:text-neutral-400 dark:hover:bg-neutral-800/50 hover:shadow-sm border border-transparent",
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", active && "scale-110 text-emerald-600 dark:text-emerald-400")} />
                  {!collapsed && item.label}
                </motion.span>
              </Link>
            );
          })}
          {isEmployeeArea && role !== "EMPLOYEE" && (
            <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-neutral-800">
              <Link href="/dashboard">
                <motion.span whileHover={{ x: 2 }}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  {!collapsed && "Về Quản lý"}
                </motion.span>
              </Link>
            </div>
          )}
        </nav>
        {/* Settings pinned */}
        <div className="shrink-0 border-t border-neutral-200/60 dark:border-neutral-800 p-3">
          <Link href="/settings">
            <motion.span whileHover={{ x: 4 }}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300",
                pathname === "/settings" || pathname.startsWith("/settings/")
                  ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:from-emerald-500/30 dark:to-emerald-500/10 dark:text-emerald-300 shadow-sm border border-emerald-500/20"
                  : "text-neutral-600 hover:bg-white/50 dark:text-neutral-400 dark:hover:bg-neutral-800/50 hover:shadow-sm border border-transparent",
              )}>
              <Settings className={cn("h-5 w-5 shrink-0", (pathname === "/settings" || pathname.startsWith("/settings/")) && "text-emerald-600 dark:text-emerald-400")} />
              {!collapsed && "Cài đặt"}
            </motion.span>
          </Link>
          <div className="flex justify-center mt-2">
            <Button type="button" variant="ghost" size="icon" className="rounded-2xl"
              onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <div className={cn("transition-all duration-300", collapsed ? "md:pl-[112px]" : "md:pl-[292px]")}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between gap-3 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl px-4 md:px-6 border-b border-neutral-100 dark:border-neutral-800 md:border-0 md:bg-transparent md:dark:bg-transparent md:mx-4 md:mt-4 md:premium-glass md:rounded-[2rem]">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setMobileOpen(true)}
              className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center active:scale-95 transition-transform">
              <Menu className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
            </button>
            <span className="text-sm font-black text-neutral-900 dark:text-white">Thanh Huyền</span>
          </div>
          {/* Desktop: search */}
          <button type="button" onClick={() => setCmdOpen(true)}
            className="hidden max-w-md flex-1 items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white/80 px-4 py-2 text-left text-sm text-neutral-500 shadow-inner dark:border-neutral-800 dark:bg-neutral-900/50 md:flex">
            <Search className="h-4 w-4" />
            Search…
            <kbd className="ml-auto rounded-lg bg-neutral-100 px-2 py-0.5 text-[10px] dark:bg-neutral-800">⌘K</kbd>
          </button>
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="sm" className="rounded-2xl hidden md:flex" asChild>
              <Link href="/scan"><QrCode className="h-4 w-4 mr-1" />Scan</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-2xl text-neutral-500 dark:text-neutral-400 hidden md:flex" asChild>
              <Link href="/settings"><Settings className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-2xl text-neutral-500 dark:text-neutral-400 hidden md:flex" onClick={() => clear()}>
              Đăng xuất
            </Button>
          </div>
        </header>
        <main className="p-4 pb-28 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* ═══ Mobile Bottom Nav ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-pb bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-200/60 dark:border-neutral-800/60">
        <div className="flex items-center justify-around px-1 py-1.5">
          {(isEmployeeArea ? employeeNav : [
            { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
            { href: "/plants", label: "Cây trồng", icon: Sprout },
            { href: "/scan", label: "Quét QR", icon: QrCode },
            { href: "/fertilizers", label: "Phân thuốc", icon: Droplets },
            { href: "/settings", label: "Cài đặt", icon: Settings },
          ]).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 min-w-[56px] transition-colors",
                  active ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400 dark:text-neutral-500",
                )}>
                <div className="relative">
                  <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                  {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-500" />}
                </div>
                <span className={cn("text-[10px] font-medium truncate max-w-[56px]", active && "font-bold")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
