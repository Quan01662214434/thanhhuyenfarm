"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Fingerprint,
  Globe,
  Leaf,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#050505] overflow-hidden">
      {/* ═══════════════════════════════════════════ */}
      {/* Navigation                                 */}
      {/* ═══════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-[#050505]/80 border-b border-neutral-100 dark:border-neutral-900">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
              <img src="/logo.png" alt="Logo" className="h-7 w-7 object-cover rounded-lg" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">Thanh Huyền Farm</p>
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">Management Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/scan" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900">
              Quét QR
            </Link>
            <Link
              href="/login"
              className="text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.97]"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/* Hero Section                               */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-gradient-to-b from-emerald-500/[0.08] to-transparent blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-6xl px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 border border-emerald-200/50 dark:border-emerald-800/50 mb-8"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">Nền tảng quản trị nông nghiệp số</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-[1.1] mb-6"
            >
              Quản lý trang trại{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">chuyên nghiệp</span>
              <br />
              từ gốc đến ngọn.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed"
            >
              Theo dõi sức khỏe cây trồng, quản lý nhân sự, chấm công, bảng lương và truy xuất nguồn gốc — tất cả trong một hệ thống duy nhất.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-[0.97]"
              >
                Truy cập hệ thống
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/scan"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-sm font-bold rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-sm hover:shadow-md"
              >
                <QrCode className="h-4 w-4" />
                Quét mã QR
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* Stats Bar                                  */}
      {/* ═══════════════════════════════════════════ */}
      <section className="border-y border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "1,887+", label: "Cây đang giám sát" },
              { value: "24/7", label: "Theo dõi thời gian thực" },
              { value: "100%", label: "Truy xuất nguồn gốc" },
              { value: "4+", label: "Vai trò phân quyền" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">{s.value}</p>
                <p className="text-sm text-neutral-400 font-medium mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* Features Grid                              */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3"
            >
              Tính năng
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white tracking-tight"
            >
              Mọi thứ bạn cần để vận hành
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: QrCode,
                title: "Mã QR thông minh",
                desc: "Mỗi cây một mã QR riêng. Quét là xem ngay toàn bộ lịch sử chăm sóc, phân thuốc và thu hoạch.",
                gradient: "from-emerald-500 to-teal-500",
              },
              {
                icon: ShieldCheck,
                title: "Phân quyền RBAC",
                desc: "Chủ vườn, Quản lý, Nhân viên — mỗi vai trò có quyền truy cập và thao tác riêng biệt.",
                gradient: "from-blue-500 to-indigo-500",
              },
              {
                icon: Fingerprint,
                title: "Chấm công GPS",
                desc: "Nhân viên check-in/out bằng GPS. Hệ thống tự tính lương theo giờ làm và loại công việc.",
                gradient: "from-violet-500 to-purple-500",
              },
              {
                icon: BarChart3,
                title: "Báo cáo phân tích",
                desc: "Dashboard trực quan với biểu đồ sức khỏe cây, chi phí nhân công và xu hướng sản lượng.",
                gradient: "from-amber-500 to-orange-500",
              },
              {
                icon: Globe,
                title: "Truy xuất nguồn gốc",
                desc: "Khách hàng quét QR thấy ngay xuất xứ cây trồng, lịch sử bón phân, chứng nhận chất lượng.",
                gradient: "from-cyan-500 to-blue-500",
              },
              {
                icon: Smartphone,
                title: "Tối ưu di động",
                desc: "Giao diện thiết kế ưu tiên mobile. Quản lý mọi nơi — ngoài vườn, trên xe, hay tại nhà.",
                gradient: "from-pink-500 to-rose-500",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 hover:shadow-lg transition-all duration-300"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} shadow-md mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA Section                                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#065f46] p-10 md:p-16 text-center"
          >
            {/* Decorative */}
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-emerald-400/10 blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-teal-400/10 blur-[80px]" />

            <div className="relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 mx-auto mb-6">
                <Sprout className="h-8 w-8 text-emerald-300" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                Sẵn sàng số hóa trang trại?
              </h2>
              <p className="text-base text-white/50 max-w-lg mx-auto mb-8 leading-relaxed">
                Hàng ngàn cây trồng đã được quản lý trên hệ thống. Đăng nhập ngay để trải nghiệm nền tảng quản trị nông nghiệp chuyên nghiệp nhất.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-900 text-sm font-bold rounded-2xl hover:shadow-xl transition-all active:scale-[0.97]"
                >
                  Đăng nhập ngay
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-md text-white text-sm font-bold rounded-2xl border border-white/10 hover:bg-white/20 transition-all"
                >
                  <QrCode className="h-4 w-4" />
                  Thử quét QR
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* Footer                                     */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="border-t border-neutral-100 dark:border-neutral-900 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <img src="/logo.png" alt="Logo" className="h-6 w-6 object-cover" />
            </div>
            <p className="text-sm font-bold text-neutral-400">Thanh Huyền Farm</p>
          </div>
          <p className="text-xs text-neutral-300 dark:text-neutral-700">
            © {new Date().getFullYear()} Thanh Huyền Farm. Nền tảng quản trị nông nghiệp số.
          </p>
        </div>
      </footer>
    </div>
  );
}
