"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  History,
  Pencil,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
  Wrench,
  X,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type Emp = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  dailyWage: number | null;
  isActive: boolean;
};

const roleConfig: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  OWNER: { label: "Chủ vườn", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: Crown },
  MANAGER: { label: "Quản lý", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Shield },
  EMPLOYEE: { label: "Nhân viên", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", icon: Wrench },
  GUEST: { label: "Khách", color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400", icon: User },
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<Emp | null | "new">(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get<Emp[]>("/users");
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl mt-1" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Quản lý Nhân sự</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {data?.length ?? 0} thành viên trong trang trại
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl gap-2 bg-white dark:bg-neutral-900" asChild>
            <Link href="/attendance-admin">
              <History className="h-4 w-4 text-emerald-500" />
              Chấm công
            </Link>
          </Button>
          <Button className="rounded-2xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setEditingUser("new")}>
            <UserPlus className="h-4 w-4" />
            Thêm nhân sự
          </Button>
        </div>
      </div>

      <div className="premium-glass rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Tìm theo tên, email, chức vụ..."
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
                <th className="px-6 py-4">Họ và tên</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Lương cơ bản</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map((u) => {
                const cfg = roleConfig[u.role] || roleConfig.GUEST;
                const RoleIcon = cfg.icon;
                return (
                  <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-neutral-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-600 dark:text-neutral-400">
                      {u.phone || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.color}`}>
                        <RoleIcon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {u.dailyWage ? formatCurrency(u.dailyWage) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                          <CheckCircle2 className="h-3 w-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md">
                          <AlertCircle className="h-3 w-3" /> Tạm khóa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-emerald-600" onClick={() => setEditingUser(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteMutation.mutate(u.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    <Users className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                    Không tìm thấy nhân sự nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingUser && (
          <UserFormModal
            user={editingUser === "new" ? null : editingUser}
            onClose={() => setEditingUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserFormModal({ user, onClose }: { user: Emp | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "EMPLOYEE",
    dailyWage: user?.dailyWage?.toString() || "0",
    isActive: user ? user.isActive : true,
    password: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (user) {
        await api.patch(`/users/${user.id}`, formData);
      } else {
        await api.post("/users", formData);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {user ? "Chỉnh sửa nhân sự" : "Thêm nhân sự mới"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase">Họ</label>
              <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="rounded-xl focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase">Tên</label>
              <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="rounded-xl focus:border-emerald-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Email</label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="rounded-xl focus:border-emerald-500" />
          </div>

          {!user && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase">Mật khẩu khởi tạo</label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="rounded-xl focus:border-emerald-500" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase">Số điện thoại</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="rounded-xl focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase">Lương một ngày</label>
              <Input type="number" value={formData.dailyWage} onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value })} className="rounded-xl focus:border-emerald-500" placeholder="VD: 300000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase">Chức vụ</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900 focus:border-emerald-500 outline-none">
              <option value="EMPLOYEE">Nhân viên</option>
              <option value="MANAGER">Quản lý</option>
              <option value="OWNER">Chủ vườn</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="isActive" className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Tài khoản đang hoạt động</label>
          </div>
        </div>
        <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl bg-white" onClick={onClose}>Hủy</Button>
          <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Đang lưu..." : "Lưu dữ liệu"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
