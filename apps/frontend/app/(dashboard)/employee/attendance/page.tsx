"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  History,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  Sparkles,
  Timer,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type AttendanceLog = {
  id: string;
  checkedIn: string;
  checkedOut: string | null;
  workHours: number | null;
  dailyWage: number | null;
  calculatedSalary: number | null;
  note: string | null;
  isPaid?: boolean;
  jobCategory?: { name: string; standardHours: number } | null;
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

type MonthlyStats = {
  totalSalary: number;
  totalHours: number;
  totalDays: number;
};

export default function AttendancePage() {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: ["attendance-status"],
    queryFn: async () => {
      const { data } = await api.get<AttendanceLog | null>("/attendance/status");
      return data;
    },
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["attendance-my-history"],
    queryFn: async () => {
      const { data } = await api.get<AttendanceLog[]>("/attendance/my-history");
      return data;
    },
  });

  const { data: jobCats } = useQuery({
    queryKey: ["attendance-job-categories"],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; name: string; dailyWage: number; standardHours: number }[]>("/attendance/job-categories");
      return data;
    },
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ["attendance-monthly-stats"],
    queryFn: async () => {
      const { data } = await api.get<MonthlyStats>("/attendance/stats");
      return data;
    },
  });

  const checkIn = useMutation({
    mutationFn: async () => {
      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch (err) {
        console.warn("Geolocation failed", err);
      }

      await api.post("/attendance/check-in", {
        note,
        latitude,
        longitude,
        jobCategoryId: selectedJobId || undefined,
      });
      setNote("");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-status"] });
      qc.invalidateQueries({ queryKey: ["attendance-my-history"] });
    },
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      await api.post("/attendance/check-out", { note });
      setNote("");
    },
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      qc.invalidateQueries({ queryKey: ["attendance-status"] });
      qc.invalidateQueries({ queryKey: ["attendance-my-history"] });
    },
  });

  const isCheckedIn = !!status && !status.checkedOut;
  const isFinished = !!status && !!status.checkedOut;

  // Calculate live hours
  let liveHours = 0;
  if (isCheckedIn && status) {
    const start = new Date(status.checkedIn).getTime();
    liveHours = Math.max(0, (now.getTime() - start) / (1000 * 60 * 60));
  }
  const liveSalary = status?.dailyWage ? liveHours * (status.dailyWage / (status.jobCategory?.standardHours || 8)) : 0;

  if (loadingStatus) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="max-w-md mx-auto pb-24 space-y-6">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-bold">Lưu thành công!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Monthly Stats */}
      {monthlyStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 text-center">
            <CalendarDays className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-black text-neutral-900 dark:text-white">{monthlyStats.totalDays}</p>
            <p className="text-[10px] text-neutral-500 font-medium">Ngày làm</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 text-center">
            <Timer className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-black text-neutral-900 dark:text-white">{monthlyStats.totalHours.toFixed(1)}</p>
            <p className="text-[10px] text-neutral-500 font-medium">Tổng giờ</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 text-center">
            <Wallet className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyStats.totalSalary)}</p>
            <p className="text-[10px] text-neutral-500 font-medium">Lương tháng</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-xl border border-neutral-100 dark:border-neutral-800">
        {!status || (!isCheckedIn && !isFinished) ? (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">
                <BriefcaseBusiness className="h-3 w-3 inline mr-1" /> Công việc hôm nay
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950 focus:border-emerald-500"
              >
                <option value="">Làm việc chung (Mặc định)</option>
                {jobCats?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({formatCurrency(cat.dailyWage)} / {cat.standardHours}h)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">
                <MessageSquare className="h-3 w-3 inline mr-1" /> Ghi chú
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Phun thuốc khu A"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950 h-20 resize-none"
              />
            </div>

            <Button
              className="w-full h-16 rounded-2xl text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
              onClick={() => checkIn.mutate()}
              disabled={checkIn.isPending}
            >
              {checkIn.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : "VÀO CA (CHECK IN)"}
            </Button>
          </div>
        ) : isCheckedIn ? (
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-sm font-bold animate-pulse">
              <div className="h-2 w-2 rounded-full bg-emerald-500" /> Đang trong ca làm việc
            </div>

            <div className="py-4 space-y-2">
              <p className="text-4xl font-mono font-black text-neutral-900 dark:text-white">
                {Math.floor(liveHours)}h {Math.floor((liveHours % 1) * 60)}m
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                Tạm tính: {formatCurrency(liveSalary)}
              </p>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cập nhật tiến độ..."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950 h-20 resize-none mb-4"
            />

            <Button
              className="w-full h-16 rounded-2xl text-lg font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
              onClick={() => checkOut.mutate()}
              disabled={checkOut.isPending}
            >
              {checkOut.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : "RA CA (CHECK OUT)"}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Đã hoàn thành!</h2>
            <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-2">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Làm việc: <span className="font-bold text-neutral-900 dark:text-white">{status.workHours?.toFixed(2)} giờ</span>
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Tiền lương: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(status.calculatedSalary || 0)}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4">
        <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> Lịch sử của bạn
        </h3>
        <div className="space-y-3">
          {history?.map((log) => (
            <div key={log.id} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">
                  {new Date(log.checkedIn).toLocaleDateString("vi-VN")}
                </p>
                <p className="text-xs text-neutral-500">
                  {log.jobCategory?.name || "Làm chung"} • {log.workHours ? `${log.workHours.toFixed(1)}h` : "Đang làm"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {log.calculatedSalary ? formatCurrency(log.calculatedSalary) : "—"}
                </p>
                {log.isPaid && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full mt-1 inline-block">Đã trả</span>
                )}
              </div>
            </div>
          ))}
          {history?.length === 0 && (
            <p className="text-sm text-center text-neutral-500 py-4">Chưa có lịch sử</p>
          )}
        </div>
      </div>
    </div>
  );
}
