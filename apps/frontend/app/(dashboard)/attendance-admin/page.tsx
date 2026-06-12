"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  History,
  Loader2,
  Pencil,
  Plus,
  Search,
  TrendingUp,
  UserPlus,
  X,
  Download
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type HistoryLog = {
  id: string;
  checkedIn: string;
  checkedOut: string | null;
  workHours: number | null;
  dailyWage: number | null;
  calculatedSalary: number | null;
  isPaid: boolean;
  note: string | null;
  jobCategory?: { name: string; dailyWage: number } | null;
  user: { firstName: string; lastName: string; email: string };
};

type DailyStat = { date: string; amount: number };

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type JobCategory = {
  id: string;
  name: string;
  dailyWage: number;
  standardHours: number;
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

export default function AttendanceAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingLog, setEditingLog] = useState<HistoryLog | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: ["attendance-history-admin"],
    queryFn: async () => {
      const { data } = await api.get<HistoryLog[]>("/attendance/history");
      return data;
    },
  });

  const { data: dailyStats } = useQuery({
    queryKey: ["attendance-daily-stats"],
    queryFn: async () => {
      const { data } = await api.get<DailyStat[]>("/attendance/daily-stats");
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!history) return [];
    if (!search) return history;
    const q = search.toLowerCase();
    return history.filter(
      (h) =>
        h.user.firstName.toLowerCase().includes(q) ||
        h.user.lastName.toLowerCase().includes(q) ||
        h.user.email.toLowerCase().includes(q) ||
        (h.jobCategory?.name || "").toLowerCase().includes(q)
    );
  }, [history, search]);

  const chartData = (dailyStats || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
    amount: Math.round(d.amount),
  }));

  const handleExport = () => {
    if (!history) return;
    const data = filtered.map(h => ({
      "Nhân sự": `${h.user.firstName} ${h.user.lastName}`,
      "Email": h.user.email,
      "Ngày": new Date(h.checkedIn).toLocaleDateString("vi-VN"),
      "Công việc": h.jobCategory?.name || "Mặc định",
      "Giờ vào": new Date(h.checkedIn).toLocaleTimeString("vi-VN"),
      "Giờ ra": h.checkedOut ? new Date(h.checkedOut).toLocaleTimeString("vi-VN") : "Đang làm việc",
      "Tổng giờ": h.workHours ? Number(h.workHours.toFixed(2)) : 0,
      "Lương": h.calculatedSalary || 0,
      "Thanh toán": h.isPaid ? "Đã trả" : "Chưa trả",
      "Ghi chú": h.note || ""
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ChamCong");
    XLSX.writeFile(workbook, `ChamCong_ThanhHuyenFarm_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl mt-1" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Giám sát Chấm công</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Quản lý giờ làm việc, chấm công hộ và xuất báo cáo
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-2xl gap-2 bg-white"
            onClick={handleExport}
            disabled={!history || history.length === 0}
          >
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>
          <Button
            className="rounded-2xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus className="h-4 w-4" />
            Chấm công hộ
          </Button>
        </div>
      </div>

      {/* Labor Cost Trend Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-glass rounded-3xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">Chi phí nhân công 14 ngày</h3>
              <p className="text-xs text-neutral-500">Biến động chi phí lao động theo ngày</p>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(163,163,163,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Chi phí"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Attendance Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Tìm theo tên nhân viên, công việc..."
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
                <th className="px-6 py-4">Ngày làm việc</th>
                <th className="px-6 py-4">Công việc</th>
                <th className="px-6 py-4">Giờ làm (Tổng)</th>
                <th className="px-6 py-4">Lương tạm tính</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map((log) => {
                const isLive = !log.checkedOut;
                return (
                  <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs">
                          {log.user.firstName[0]}{log.user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-[10px] text-neutral-500">{log.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-600 dark:text-neutral-400">
                      {new Date(log.checkedIn).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      {log.jobCategory?.name || "Mặc định"}
                    </td>
                    <td className="px-6 py-4">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 animate-pulse">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          Đang làm việc
                        </span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900 dark:text-white">{log.workHours?.toFixed(2)} giờ</span>
                          <span className="text-[10px] text-neutral-500">
                            {new Date(log.checkedIn).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            {' → '}
                            {new Date(log.checkedOut!).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {log.calculatedSalary ? formatCurrency(log.calculatedSalary) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {log.isPaid ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full px-2 py-1">Đã trả lương</span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-full px-2 py-1">Chưa thanh toán</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => setEditingLog(log)}>
                        <Pencil className="h-3.5 w-3.5" /> Sửa
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    <History className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                    Chưa có dữ liệu chấm công.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingLog && (
          <EditLogModal
            log={editingLog}
            onClose={() => setEditingLog(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <CreateLogModal onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Edit Log Modal ─── */
function EditLogModal({ log, onClose }: { log: HistoryLog; onClose: () => void }) {
  const qc = useQueryClient();
  const [checkedOut, setCheckedOut] = useState(
    log.checkedOut ? new Date(log.checkedOut).toISOString().slice(0, 16) : ""
  );
  const [checkedIn, setCheckedIn] = useState(
    new Date(log.checkedIn).toISOString().slice(0, 16)
  );

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/attendance/admin/${log.id}`, {
        checkedIn: new Date(checkedIn).toISOString(),
        checkedOut: checkedOut ? new Date(checkedOut).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-history-admin"] });
      qc.invalidateQueries({ queryKey: ["attendance-daily-stats"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Sửa giờ chấm công
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 mb-4">
            <p className="text-sm font-bold text-neutral-900 dark:text-white">{log.user.firstName} {log.user.lastName}</p>
            <p className="text-xs text-neutral-500">Công việc: {log.jobCategory?.name || "Mặc định"}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Giờ vào (Check-in)</label>
            <Input type="datetime-local" value={checkedIn} onChange={(e) => setCheckedIn(e.target.value)} className="rounded-xl focus:border-emerald-500" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Giờ ra (Check-out)</label>
            <Input type="datetime-local" value={checkedOut} onChange={(e) => setCheckedOut(e.target.value)} className="rounded-xl focus:border-emerald-500" />
            <p className="text-[10px] text-neutral-400 mt-1">Hệ thống sẽ tự động tính lại lương dựa trên giờ ra.</p>
          </div>
        </div>
        <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl bg-white" onClick={onClose}>Hủy</Button>
          <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Đang lưu..." : "Cập nhật"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Create Log on Behalf Modal ─── */
function CreateLogModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [jobCategoryId, setJobCategoryId] = useState("");
  const [checkedIn, setCheckedIn] = useState("");
  const [checkedOut, setCheckedOut] = useState("");
  const [note, setNote] = useState("");

  const { data: employees } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get<Employee[]>("/users");
      return data;
    },
  });

  const { data: jobCats } = useQuery({
    queryKey: ["job-categories"],
    queryFn: async () => {
      const { data } = await api.get<JobCategory[]>("/attendance/job-categories");
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post("/attendance/admin/create", {
        userId,
        jobCategoryId: jobCategoryId || undefined,
        checkedIn: new Date(checkedIn).toISOString(),
        checkedOut: checkedOut ? new Date(checkedOut).toISOString() : undefined,
        note: note || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-history-admin"] });
      qc.invalidateQueries({ queryKey: ["attendance-daily-stats"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-500" />
            Chấm công hộ nhân viên
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Nhân viên *</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900 focus:border-emerald-500 outline-none"
            >
              <option value="">Chọn nhân viên</option>
              {employees?.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.email})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Loại công việc</label>
            <select
              value={jobCategoryId}
              onChange={(e) => setJobCategoryId(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900 focus:border-emerald-500 outline-none"
            >
              <option value="">Mặc định</option>
              {jobCats?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({new Intl.NumberFormat("vi-VN").format(c.dailyWage)}₫/{c.standardHours}h)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase">Giờ vào *</label>
              <Input type="datetime-local" value={checkedIn} onChange={(e) => setCheckedIn(e.target.value)} className="rounded-xl focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase">Giờ ra</label>
              <Input type="datetime-local" value={checkedOut} onChange={(e) => setCheckedOut(e.target.value)} className="rounded-xl focus:border-emerald-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Ghi chú</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do chấm công hộ..." className="rounded-xl focus:border-emerald-500" />
          </div>

          <p className="text-[10px] text-neutral-400">
            * Nếu bạn nhập cả giờ vào và giờ ra, hệ thống sẽ tự tính lương dựa trên loại công việc đã chọn.
          </p>
        </div>
        <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl bg-white" onClick={onClose}>Hủy</Button>
          <Button
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
            disabled={!userId || !checkedIn || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Tạo bản ghi"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
