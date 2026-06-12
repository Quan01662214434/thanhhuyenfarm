"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  Search,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type PayrollSummary = {
  userId: string;
  fullName: string;
  email: string;
  totalUnpaid: number;
  shiftCount: number;
  totalHours: number;
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

export default function PayrollPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [payingUser, setPayingUser] = useState<PayrollSummary | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const { data: summary, isLoading } = useQuery({
    queryKey: ["payroll-summary"],
    queryFn: async () => {
      const { data } = await api.get<PayrollSummary[]>("/attendance/payroll-summary");
      return data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/attendance/payroll/pay/${userId}`);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["payroll-summary"] });
      setPayingUser(null);
      const u = summary?.find(x => x.userId === variables);
      setSuccessMsg(`Đã thanh toán thành công cho ${u?.fullName}`);
      setTimeout(() => setSuccessMsg(""), 4000);
    },
  });

  const filtered = useMemo(() => {
    if (!summary) return [];
    if (!search) return summary;
    const q = search.toLowerCase();
    return summary.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [summary, search]);

  const totalFarmDebt = summary?.reduce((acc, curr) => acc + curr.totalUnpaid, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-bold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl mt-1" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Thanh Toán Tiền Lương</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Quản lý các khoản lương chưa thanh toán của nhân sự
            </p>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 px-5 py-3 rounded-2xl flex items-center gap-3">
          <Wallet className="h-6 w-6 text-amber-500" />
          <div>
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Tổng nợ lương</p>
            <p className="text-xl font-black text-amber-700 dark:text-amber-500">{formatCurrency(totalFarmDebt)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Tìm theo tên nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50/50 dark:bg-neutral-950/50 text-xs uppercase font-semibold text-neutral-500">
              <tr>
                <th className="px-6 py-4">Nhân sự</th>
                <th className="px-6 py-4">Số ca làm</th>
                <th className="px-6 py-4">Tổng giờ</th>
                <th className="px-6 py-4">Số tiền phải trả</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map((s) => (
                <tr key={s.userId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                        {s.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white">{s.fullName}</p>
                        <p className="text-[10px] text-neutral-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                      <CalendarDays className="h-4 w-4" /> {s.shiftCount} ca
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                      <Clock className="h-4 w-4 text-blue-500" /> {s.totalHours.toFixed(1)} giờ
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 font-bold text-lg text-emerald-600 dark:text-emerald-400">
                      <Coins className="h-5 w-5" /> {formatCurrency(s.totalUnpaid)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      onClick={() => setPayingUser(s)}
                      className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                    >
                      <Banknote className="h-4 w-4" /> Thanh toán
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Đã thanh toán đầy đủ!</p>
                    <p className="text-sm">Hiện không có khoản nợ lương nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {payingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setPayingUser(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 overflow-hidden text-center p-6">
              <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Banknote className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Xác nhận thanh toán</h2>
              <p className="text-sm text-neutral-500 mb-6">
                Thanh toán toàn bộ lương tồn đọng cho <strong>{payingUser.fullName}</strong>?
              </p>
              
              <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 mb-6">
                <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Số tiền thanh toán</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(payingUser.totalUnpaid)}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl bg-white" onClick={() => setPayingUser(null)}>Hủy</Button>
                <Button
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={payMutation.isPending}
                  onClick={() => payMutation.mutate(payingUser.userId)}
                >
                  {payMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Xác nhận đã trả"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
