"use client";

import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Fingerprint, Lock, Mail, Shield, Sprout } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: { email: string; role: string };
      }>("/auth/login", { email, password });
      return data;
    },
    onSuccess: (data) => {
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        email: data.user.email,
        role: data.user.role,
      });
      if (data.user.role === "EMPLOYEE") {
        router.push("/employee/attendance");
      } else {
        router.push("/dashboard");
      }
    },
  });

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#fafbfc] dark:bg-[#0a0a0a]">
      {/* ═══════════════════════════════════════════ */}
      {/* Left panel — Enterprise Branding            */}
      {/* ═══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden">
        {/* Background gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#065f46]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Floating light effects */}
        <div className="absolute top-1/4 -left-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 h-64 w-64 rounded-full bg-teal-500/15 blur-[80px]" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 xl:p-16">
          {/* Top: Logo */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-cover rounded-lg" />
            </div>
            <div>
              <p className="text-lg font-bold text-white tracking-tight">Thanh Huyền Farm</p>
              <p className="text-xs font-medium text-emerald-300/70 uppercase tracking-widest">Hệ thống quản trị</p>
            </div>
          </div>

          {/* Center: Hero Message */}
          <div className="space-y-8 max-w-lg">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] backdrop-blur-sm px-4 py-2 border border-white/[0.06] mb-6"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Farm Management System</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight"
              >
                Nền tảng quản trị<br />
                <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">nông nghiệp số</span>
              </motion.h2>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base text-white/50 leading-relaxed max-w-md"
            >
              Quản lý toàn diện cây trồng, nhân sự, chấm công, bảng lương và truy xuất nguồn gốc — tất cả trong một hệ thống duy nhất.
            </motion.p>

            {/* Feature grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { icon: Sprout, label: "Quản lý cây trồng", desc: "Theo dõi sức khỏe & QR" },
                { icon: Shield, label: "Phân quyền RBAC", desc: "Chủ vườn · Quản lý · NV" },
                { icon: Fingerprint, label: "Chấm công GPS", desc: "Định vị & tính lương tự động" },
                { icon: ArrowRight, label: "Truy xuất nguồn gốc", desc: "Mã QR minh bạch" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 shrink-0 mt-0.5">
                    <f.icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90">{f.label}</p>
                    <p className="text-[10px] text-white/40 font-medium mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom: Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-between"
          >
            <p className="text-[11px] text-white/25 font-medium">
              © {new Date().getFullYear()} Thanh Huyền Farm. Bản quyền thuộc về chủ trang trại.
            </p>
            <div className="flex items-center gap-1.5 bg-white/[0.06] rounded-full px-3 py-1.5 border border-white/[0.04]">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Hệ thống hoạt động</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Right panel — Login Form                    */}
      {/* ═══════════════════════════════════════════ */}
      <div className="flex w-full lg:w-[45%] items-center justify-center px-6 py-12 relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/[0.03] blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[400px] space-y-8 relative z-10"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 dark:bg-emerald-900/20 shadow-sm border border-emerald-100 dark:border-emerald-800">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-cover rounded-lg" />
            </div>
            <div>
              <p className="text-base font-bold text-neutral-900 dark:text-white">Thanh Huyền Farm</p>
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">Hệ thống quản trị</p>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              Đăng nhập
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Truy cập hệ thống quản lý trang trại của bạn.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-300 dark:text-neutral-600 transition-colors group-focus-within:text-emerald-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-neutral-900 outline-none transition-all placeholder:text-neutral-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10"
                  placeholder="email@thanhuyenfarm.vn"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider" htmlFor="pw">
                Mật khẩu
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-300 dark:text-neutral-600 transition-colors group-focus-within:text-emerald-500" />
                <input
                  id="pw"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-12 pr-12 text-sm font-medium text-neutral-900 outline-none transition-all placeholder:text-neutral-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 dark:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {login.isError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20"
              >
                <Shield className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Đăng nhập thất bại — Vui lòng kiểm tra lại thông tin.</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="button"
              disabled={login.isPending || !email || !password}
              onClick={() => login.mutate()}
              className="w-full rounded-xl py-3.5 px-6 text-sm font-bold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]"
              style={{
                background: login.isPending
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
              }}
            >
              {login.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xác thực...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Đăng nhập
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="pt-4 flex items-center justify-between">
            <Link href="/" className="text-xs font-medium text-neutral-400 hover:text-emerald-600 transition-colors">
              ← Trang chủ
            </Link>
            <p className="text-[10px] text-neutral-300 dark:text-neutral-700 font-medium">
              v2.0 · Bảo mật SSL
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
