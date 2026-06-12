"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Leaf, LayoutDashboard, QrCode, Search, Sprout, Users, Map, Timer, Moon, Sun } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

const links = [
  { href: "/dashboard", label: "Tổng quan (Dashboard)", icon: LayoutDashboard },
  { href: "/map", label: "Bản đồ Nông trại", icon: Map },
  { href: "/plants", label: "Quản lý Cây trồng", icon: Sprout },
  { href: "/employees", label: "Quản lý Nhân sự", icon: Users },
  { href: "/attendance-admin", label: "Chấm công & Lương", icon: Timer },
  { href: "/scan", label: "Quét QR", icon: QrCode },
];

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void; }) {
  const [q, setQ] = React.useState("");
  const { theme, setTheme } = useTheme();
  
  const filtered = links.filter((l) => l.label.toLowerCase().includes(q.toLowerCase()));
  if ("nền".includes(q.toLowerCase()) || "tối".includes(q.toLowerCase()) || "sáng".includes(q.toLowerCase()) || "dark".includes(q.toLowerCase())) {
    filtered.push({ href: "#theme", label: theme === "dark" ? "Đổi sang nền Sáng (Light Mode)" : "Đổi sang nền Tối (Dark Mode)", icon: theme === "dark" ? Sun : Moon });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }} 
                animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }} 
                exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
                className="fixed left-1/2 top-[15%] z-50 w-[min(100%,480px)] rounded-3xl border border-neutral-200/80 bg-white/90 backdrop-blur-2xl p-4 shadow-2xl dark:border-neutral-800 dark:bg-black/80"
              >
                <Dialog.Title className="sr-only">Spotlight Search</Dialog.Title>
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
                  <Search className="h-5 w-5 text-emerald-500" />
                  <Input
                    className="border-0 bg-transparent text-lg shadow-none focus-visible:ring-0 px-2"
                    placeholder="Tìm kiếm chức năng, chuyển trang..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <kbd className="hidden md:inline-flex rounded-lg bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800">ESC</kbd>
                </div>
                <ul className="mt-3 max-h-[60vh] overflow-auto space-y-1 scrollbar-hide">
                  {filtered.length === 0 ? (
                    <li className="p-4 text-center text-sm text-neutral-500">Không tìm thấy kết quả.</li>
                  ) : (
                    filtered.map((l) => {
                      const Icon = l.icon;
                      return (
                        <li key={l.label}>
                          {l.href === "#theme" ? (
                            <button
                              onClick={() => {
                                setTheme(theme === "dark" ? "light" : "dark");
                                onOpenChange(false);
                              }}
                              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                            >
                              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              {l.label}
                            </button>
                          ) : (
                            <Link
                              href={l.href}
                              onClick={() => onOpenChange(false)}
                              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors group"
                            >
                              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              {l.label}
                            </Link>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
