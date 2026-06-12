"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  Globe,
  Key,
  Loader2,
  Moon,
  Palette,
  Phone,
  Plus,
  Shield,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type OrgSettings = {
  id: string;
  name: string;
  standardWorkHours: number;
};

type JobCategory = {
  id: string;
  name: string;
  dailyWage: number;
  standardHours: number;
};

type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthYear: number | null;
  role: string;
  specialty: string | null;
  dailyWage: number | null;
  createdAt: string;
  lastLoginAt: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const roleLabels: Record<string, string> = {
  OWNER: "Chủ vườn",
  MANAGER: "Quản lý",
  EMPLOYEE: "Nhân viên",
  GUEST: "Khách",
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const role = useAuthStore((s) => s.role) || "GUEST";
  const token = useAuthStore((s) => s.accessToken);
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // ─── Profile ───
  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: d } = await api.get<UserProfile>("/users/me");
      return d;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (dto: Partial<UserProfile>) => {
      await api.patch("/users/me", dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      showSuccess("Đã cập nhật thông tin cá nhân");
    },
  });

  // ─── Org settings (OWNER/MANAGER only) ───
  const { data: org } = useQuery({
    queryKey: ["org-settings"],
    queryFn: async () => {
      const { data: d } = await api.get<OrgSettings>("/organization/settings");
      return d;
    },
    enabled: role === "OWNER" || role === "MANAGER",
  });

  const { data: jobCats } = useQuery({
    queryKey: ["job-categories"],
    queryFn: async () => {
      const { data: d } = await api.get<JobCategory[]>("/attendance/job-categories");
      return d;
    },
    enabled: role === "OWNER" || role === "MANAGER",
  });

  const updateOrg = useMutation({
    mutationFn: async (dto: Partial<OrgSettings>) => {
      await api.patch("/organization/settings", dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-settings"] });
      showSuccess("Đã cập nhật thông tin trang trại");
    },
  });

  const createJobCat = useMutation({
    mutationFn: async (dto: { name: string; dailyWage: number; standardHours: number }) => {
      await api.post("/attendance/job-categories", dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-categories"] });
      showSuccess("Đã tạo danh mục công việc mới");
    },
  });

  const deleteJobCat = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/attendance/job-categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-categories"] });
      showSuccess("Đã xóa danh mục");
    },
  });

  // ─── Password ───
  const [showPwdModal, setShowPwdModal] = useState(false);

  // ─── Job form ───
  const [newJobName, setNewJobName] = useState("");
  const [newJobWage, setNewJobWage] = useState(0);
  const [newJobHours, setNewJobHours] = useState(8);

  // ─── CSV export ───
  const handleExport = async (endpoint: string, filename: string) => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showSuccess(`Đã tải xuống ${filename}`);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Success toast */}
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
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Cài đặt</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Quản lý thông tin cá nhân, trang trại và tùy chỉnh giao diện
        </p>
      </div>

      {/* ═══════════════════════════════════ */}
      {/* Profile Card */}
      {/* ═══════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900 dark:text-white">Thông tin cá nhân</h2>
              <p className="text-xs text-neutral-500">
                {roleLabels[role] || role} · Tham gia {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase">Họ</label>
                <Input
                  defaultValue={profile?.lastName}
                  onBlur={(e) => updateProfile.mutate({ lastName: e.target.value } as any)}
                  className="rounded-xl bg-white/80 dark:bg-neutral-900/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase">Tên</label>
                <Input
                  defaultValue={profile?.firstName}
                  onBlur={(e) => updateProfile.mutate({ firstName: e.target.value } as any)}
                  className="rounded-xl bg-white/80 dark:bg-neutral-900/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase">Email đăng nhập</label>
              <Input value={profile?.email || ""} readOnly className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase">
                  <Phone className="h-3 w-3 inline mr-1" />Số điện thoại
                </label>
                <Input
                  defaultValue={profile?.phone || ""}
                  onBlur={(e) => updateProfile.mutate({ phone: e.target.value } as any)}
                  placeholder="VD: 0901234567"
                  className="rounded-xl bg-white/80 dark:bg-neutral-900/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase">Năm sinh</label>
                <Input
                  type="number"
                  defaultValue={profile?.birthYear || ""}
                  onBlur={(e) => updateProfile.mutate({ birthYear: parseInt(e.target.value) || undefined } as any)}
                  placeholder="VD: 1990"
                  className="rounded-xl bg-white/80 dark:bg-neutral-900/50"
                />
              </div>
            </div>

            {profile?.lastLoginAt && (
              <p className="text-[10px] text-neutral-400">
                Đăng nhập lần cuối: {new Date(profile.lastLoginAt).toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════ */}
      {/* Security */}
      {/* ═══════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900 dark:text-white">Bảo mật</h2>
              <p className="text-xs text-neutral-500">Quản lý mật khẩu và phiên đăng nhập</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowPwdModal(true)}>
            <Key className="h-4 w-4" />
            Đổi mật khẩu
          </Button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════ */}
      {/* Appearance */}
      {/* ═══════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="font-semibold text-neutral-900 dark:text-white">Giao diện</h2>
          </div>
          <div className="flex gap-3">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className="rounded-2xl flex-1 gap-2"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              Sáng
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className="rounded-2xl flex-1 gap-2"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              Tối
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════ */}
      {/* Org Settings (OWNER/MANAGER only) */}
      {/* ═══════════════════════════════════ */}
      {(role === "OWNER" || role === "MANAGER") && (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-900 dark:text-white">Thông tin Trang trại</h2>
                  <p className="text-xs text-neutral-500">Cấu hình tổ chức và quy trình lao động</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase">Tên trang trại</label>
                  <Input
                    defaultValue={org?.name}
                    onBlur={(e) => updateOrg.mutate({ name: e.target.value })}
                    className="rounded-xl bg-white/80 dark:bg-neutral-900/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase">Giờ làm tiêu chuẩn (h/ngày)</label>
                  <Input
                    type="number"
                    step="0.5"
                    defaultValue={org?.standardWorkHours}
                    onBlur={(e) => updateOrg.mutate({ standardWorkHours: parseFloat(e.target.value) })}
                    className="rounded-xl bg-white/80 dark:bg-neutral-900/50"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Hệ thống dùng con số này để tự động chia lương khi nhân viên check-out.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════ */}
          {/* QR Passport Settings */}
          {/* ═══════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-900 dark:text-white">Cấu hình Hộ chiếu QR</h2>
                  <p className="text-xs text-neutral-500">Tùy chỉnh thông tin hiển thị khi khách quét mã QR cây trồng</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { key: 'showHarvests', label: 'Hiển thị Sản lượng Thu hoạch', desc: 'Cho khách xem cây đã thu hoạch bao nhiêu ký.' },
                  { key: 'showHistory', label: 'Hiển thị Nhật ký Chăm sóc', desc: 'Cho khách xem các hoạt động chăm sóc cây.' },
                  { key: 'showTreatments', label: 'Hiển thị Bón phân & Phun thuốc', desc: 'Minh bạch quy trình sử dụng phân bón, thuốc bảo vệ thực vật.' },
                  { key: 'showCaretakers', label: 'Hiển thị Người phụ trách', desc: 'Cho khách biết ai là người đang chăm sóc cây này.' },
                ].map((item) => {
                  const isChecked = org?.qrConfig ? (org.qrConfig as any)[item.key] !== false : true; // Default to true
                  return (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-white/80 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <div>
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{item.label}</p>
                        <p className="text-[10px] text-neutral-500 font-medium">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={isChecked}
                          onChange={(e) => {
                            const newConfig = { ...(org?.qrConfig as any) || {}, [item.key]: e.target.checked };
                            updateOrg.mutate({ qrConfig: newConfig });
                          }}
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════ */}
          {/* Job Categories */}
          {/* ═══════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-900 dark:text-white">Danh mục Công việc & Lương</h2>
                  <p className="text-xs text-neutral-500">Mỗi loại công việc có mức lương và số giờ tiêu chuẩn riêng</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tên công việc (VD: Tưới nước)"
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                    className="rounded-xl flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Lương/ngày"
                    value={newJobWage || ""}
                    onChange={(e) => setNewJobWage(parseFloat(e.target.value))}
                    className="rounded-xl w-32"
                  />
                  <Input
                    type="number"
                    placeholder="Giờ chuẩn"
                    value={newJobHours || ""}
                    onChange={(e) => setNewJobHours(parseFloat(e.target.value))}
                    className="rounded-xl w-24"
                  />
                  <Button 
                    onClick={() => {
                      if (newJobName && newJobWage > 0 && newJobHours > 0) {
                        createJobCat.mutate({ name: newJobName, dailyWage: newJobWage, standardHours: newJobHours });
                        setNewJobName("");
                        setNewJobWage(0);
                        setNewJobHours(8);
                      }
                    }}
                    className="rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {jobCats?.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      <div>
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{cat.name}</p>
                        <p className="text-[10px] text-neutral-500 font-medium">Lương: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cat.dailyWage)} | Định mức: {cat.standardHours}h</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteJobCat.mutate(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {(!jobCats || jobCats.length === 0) && (
                  <p className="text-center py-4 text-xs text-neutral-400 italic">Chưa có danh mục công việc nào.</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* ═══════════════════════════════════ */}
          {/* Data Export */}
          {/* ═══════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-900 dark:text-white">Xuất dữ liệu</h2>
                  <p className="text-xs text-neutral-500">Tải xuống dữ liệu trang trại dạng CSV (mở bằng Excel)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={() => handleExport("/reports/attendance", "BaoCaoChamCong.csv")}
                >
                  <Download className="h-3.5 w-3.5" />
                  Xuất chấm công
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={() => handleExport("/reports/plants", "DanhSachCayTrong.csv")}
                >
                  <Download className="h-3.5 w-3.5" />
                  Xuất danh sách cây
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ═══════════════════════════════════ */}
      {/* Password Change Modal */}
      {/* ═══════════════════════════════════ */}
      <AnimatePresence>
        {showPwdModal && (
          <PasswordChangeModal onClose={() => setShowPwdModal(false)} onSuccess={() => showSuccess("Đổi mật khẩu thành công!")} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Password Change Modal ─── */
function PasswordChangeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Mật khẩu xác nhận không khớp");
      if (newPassword.length < 6) throw new Error("Mật khẩu mới phải ít nhất 6 ký tự");
      await api.patch("/users/me/password", { currentPassword, newPassword });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err.message || "Đổi mật khẩu thất bại");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-red-500" />
            Đổi mật khẩu
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Mật khẩu hiện tại</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                className="rounded-xl pr-10 focus:border-emerald-500"
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                className="rounded-xl pr-10 focus:border-emerald-500"
                placeholder="Ít nhất 6 ký tự"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Xác nhận mật khẩu mới</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              className="rounded-xl focus:border-emerald-500"
              placeholder="Nhập lại mật khẩu mới"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] text-red-500 font-bold">Mật khẩu xác nhận không khớp</p>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl bg-white" onClick={onClose}>Hủy</Button>
          <Button
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
            disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Đổi mật khẩu"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
