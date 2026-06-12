"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import axios from "axios";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  MapPin, CalendarDays, PhoneCall, Facebook,
  Sprout, Activity, History, Droplets, Package, Medal, Info,
  QrCode, ChevronLeft, ChevronRight, Bug, Users, ShieldCheck, CheckCircle2
} from "lucide-react";

function apiBase() {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return "/api";
  return "http://localhost:4000/api";
}

type PublicPlant = {
  id: string; species: string; health: string; plantedAt: string;
  statusNote: string | null; estimatedHarvestAt: string | null;
  ageDays: number; qrToken: string;
  zone: { name: string; address: string | null; vietgapCode: string | null; farm: { name: string; organization?: { qrConfig?: any } } };
  media: { url: string | null; caption: string | null }[];
  histories: { title: string; detail: string | null; createdAt: string }[];
  diseases: { name: string; severity: number; detectedAt: string; resolvedAt: string | null }[];
  treatments: { product: string; dosage: string | null; appliedAt: string }[];
  fertilizers: { product: string; amount: string | null; appliedAt: string }[];
  waterings: { liters: number | null; wateredAt: string }[];
  harvests: { quantityKg: number; harvested: string }[];
  certifications: { title: string; issuer: string | null }[];
  caretakers: { firstName: string; lastName: string; role: string; phone: string | null }[];
};

const healthMap: Record<string, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  HEALTHY: { label: "Khỏe mạnh", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]", icon: "🌱" },
  WATCH: { label: "Theo dõi", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]", icon: "👀" },
  DISEASED: { label: "Đang bệnh", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]", icon: "🦠" },
  RECOVERING: { label: "Hồi phục", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]", icon: "🩹" },
  DEAD: { label: "Đã chết", color: "text-neutral-600", bg: "bg-neutral-100 border-neutral-300", dot: "bg-neutral-400", icon: "💀" },
};

const FARM_PHONE = "0938 213 219";

// 3D Parallax Image Slider Component
function ImageSlider({ images }: { images: { url: string | null; caption: string | null }[] }) {
  const [idx, setIdx] = React.useState(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 150]); // Parallax effect
  const scale = useTransform(scrollY, [0, 300], [1, 1.1]);
  
  const validImages = images.filter(i => i.url);
  if (validImages.length === 0) return (
    <div className="h-[40vh] bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      <Sprout className="h-28 w-28 text-white/30 drop-shadow-2xl" />
    </div>
  );

  return (
    <div className="relative h-[45vh] bg-black overflow-hidden perspective-1000">
      <motion.div style={{ y, scale }} className="absolute inset-0 origin-bottom">
        <Image src={validImages[idx].url!} alt="Ảnh cây" fill className="object-cover opacity-90" priority />
      </motion.div>
      
      {validImages.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + validImages.length) % validImages.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white z-10 shadow-lg active:scale-90 transition-transform">
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % validImages.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white z-10 shadow-lg active:scale-90 transition-transform">
            <ChevronRight className="h-8 w-8" />
          </button>
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-3 z-10 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {validImages.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-2.5 rounded-full transition-all shadow-inner ${i === idx ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"}`} />
            ))}
          </div>
        </>
      )}
      {/* 3D Gradient Overlay for seamless blend */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-black/40 pointer-events-none" />
    </div>
  );
}

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function PublicPlantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const sp = useSearchParams();
  const token = sp.get("t") ?? "";

  const { data, isError, isLoading } = useQuery({
    queryKey: ["public-plant", id, token],
    queryFn: async () => {
      const { data: d } = await axios.get<PublicPlant>(`${apiBase()}/plants/public/${id}`, {
        params: token ? { t: token } : {},
      });
      return d;
    },
  });

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
        <Sprout className="absolute inset-0 m-auto h-8 w-8 text-emerald-500 animate-pulse" />
      </div>
      <p className="mt-6 text-lg text-emerald-800 font-bold tracking-wide">Đang tải dữ liệu...</p>
    </div>
  );

  if (isError || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full">
        <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Info className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Không tìm thấy</h2>
        <p className="text-base text-slate-500 leading-relaxed">Mã QR không hợp lệ hoặc dữ liệu cây đã bị xóa khỏi hệ thống.</p>
      </div>
    </div>
  );

  const health = healthMap[data.health] || healthMap.HEALTHY;
  const qrConfig: Record<string, any> = (data.zone?.farm?.organization?.qrConfig as any) ?? {};
  const showHarvests = qrConfig.showHarvests !== false;
  const showHistory = qrConfig.showHistory !== false;
  const showTreatments = qrConfig.showTreatments !== false;
  const showCaretakers = qrConfig.showCaretakers !== false;
  const variety = data.species.toLowerCase().includes("sầu riêng") ? "Monthong" : "Bản địa";

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200">
      <div className="mx-auto max-w-md bg-slate-50 min-h-screen shadow-2xl relative overflow-hidden">
        
        {/* Floating Top Bar (Glassmorphism) */}
        <div className="fixed top-0 max-w-md w-full z-50 px-4 py-3">
          <div className="flex items-center justify-between px-4 py-3 bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-inner flex items-center justify-center border border-emerald-300/50">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-black text-slate-800 tracking-tight uppercase">Thanh Huyền</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${health.bg}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${health.dot} animate-pulse border border-white/50`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${health.color}`}>{health.label}</span>
            </div>
          </div>
        </div>

        {/* 3D Image Hero */}
        <ImageSlider images={data.media} />

        {/* 3D Main Card — Pulled up */}
        <div className="px-4 -mt-24 relative z-20">
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-white p-6 relative overflow-hidden"
          >
            {/* Subtle glow effect inside card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* ID Badge */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg flex items-center justify-center shrink-0 border border-slate-700">
                <QrCode className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Hộ chiếu thực vật</p>
                </div>
                <p className="text-base font-mono font-bold text-slate-900 truncate tracking-tight">{data.id.slice(0, 16).toUpperCase()}</p>
              </div>
            </div>

            {/* Key Info Grid */}
            <div className="grid gap-y-4 gap-x-2">
              <Row icon={<Sprout className="h-6 w-6 text-emerald-500" />} label="Tên thực vật" value={data.species} bold valueSize="text-lg" />
              <Row icon={<Package className="h-6 w-6 text-violet-500" />} label="Chủng loại" value={variety} bold valueSize="text-base" />
              <Row icon={<MapPin className="h-6 w-6 text-blue-500" />} label="Vị trí trồng" value={`${data.zone.name}${data.zone.address ? ` - ${data.zone.address}` : ""}`} bold valueSize="text-base" />
              {data.zone.vietgapCode && (
                <Row icon={<ShieldCheck className="h-6 w-6 text-amber-500" />} label="Chứng nhận VietGAP" value={data.zone.vietgapCode} bold valueSize="text-base text-amber-600" />
              )}
              <Row icon={<CalendarDays className="h-6 w-6 text-amber-500" />} label="Ngày xuống giống"
                value={new Date(data.plantedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} bold valueSize="text-base" />
              <Row icon={<History className="h-6 w-6 text-teal-500" />} label="Độ tuổi" value={`${data.ageDays} ngày`} bold valueSize="text-base" />
            </div>
          </motion.div>
        </div>

        {/* Main Content Sections */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-4 mt-8 space-y-8 pb-12">

          {/* Quick Actions / Contact (3D Buttons) */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <a href={`tel:${FARM_PHONE.replace(/ /g, "")}`}
              className="group relative overflow-hidden flex flex-col items-center p-5 rounded-3xl bg-gradient-to-b from-blue-50 to-blue-100/50 border border-blue-200/50 shadow-[0_8px_16px_-6px_rgba(59,130,246,0.2)] active:scale-95 transition-all">
              <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-inner shadow-blue-400 text-white flex items-center justify-center mb-3">
                <PhoneCall className="h-6 w-6 drop-shadow-md" />
              </div>
              <span className="text-base font-black text-blue-900">Gọi Hotline</span>
              <span className="text-sm text-blue-600 font-bold mt-1">{FARM_PHONE}</span>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer"
              className="group relative overflow-hidden flex flex-col items-center p-5 rounded-3xl bg-gradient-to-b from-indigo-50 to-indigo-100/50 border border-indigo-200/50 shadow-[0_8px_16px_-6px_rgba(99,102,241,0.2)] active:scale-95 transition-all">
              <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 shadow-inner shadow-indigo-400 text-white flex items-center justify-center mb-3">
                <Facebook className="h-6 w-6 drop-shadow-md" />
              </div>
              <span className="text-base font-black text-indigo-900">Facebook</span>
              <span className="text-sm text-indigo-600 font-bold mt-1">Nông trại</span>
            </a>
          </motion.div>

          {/* Harvest Stats */}
          {showHarvests && (
            <motion.div variants={itemVariants}>
              <SectionTitle icon={<Package className="h-6 w-6 text-emerald-500" />} title="Thống kê Sản lượng" />
              <div className="grid grid-cols-2 gap-4">
                <StatCard value={String(data.harvests.length)} label="Lần thu hoạch" color="emerald" />
                <StatCard value={`${data.harvests.reduce((a, b) => a + b.quantityKg, 0).toFixed(0)}kg`} label="Tổng sản lượng" color="amber" />
              </div>
            </motion.div>
          )}

          {/* Certifications (Premium Look) */}
          {data.certifications.length > 0 && (
            <motion.div variants={itemVariants}>
              <SectionTitle icon={<Medal className="h-6 w-6 text-amber-500" />} title="Chứng nhận Chất lượng" />
              <div className="space-y-3">
                {data.certifications.map(c => (
                  <div key={c.title} className="relative overflow-hidden flex items-center gap-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border border-amber-200/60 shadow-sm">
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/40 to-transparent pointer-events-none" />
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-inner flex items-center justify-center shrink-0">
                      <Medal className="h-6 w-6 text-white drop-shadow" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-base font-black text-amber-950 uppercase tracking-wide">{c.title}</p>
                      {c.issuer && <p className="text-sm font-bold text-amber-700 mt-0.5">{c.issuer}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Timeline (Care History) */}
          {showHistory && data.histories.length > 0 && (
            <motion.div variants={itemVariants}>
              <SectionTitle icon={<History className="h-6 w-6 text-teal-500" />} title="Nhật ký Chăm sóc" />
              <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100">
                <div className="space-y-0 border-l-[3px] border-slate-100 ml-4 pl-6 relative">
                  {data.histories.slice(0, 6).map((h, i) => (
                    <div key={i} className="relative pb-8 last:pb-0 group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 h-5 w-5 rounded-full bg-white border-[4px] border-teal-500 shadow-[0_0_0_4px_rgba(255,255,255,1),0_2px_8px_rgba(20,184,166,0.4)] group-hover:scale-125 transition-transform duration-300" />
                      
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-teal-50/50 group-hover:border-teal-100 transition-colors">
                        <p className="text-base font-black text-slate-900">{h.title}</p>
                        {h.detail && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{h.detail}</p>}
                        <div className="flex items-center gap-1.5 mt-3">
                          <CalendarDays className="h-3.5 w-3.5 text-teal-500" />
                          <p className="text-xs text-teal-700 font-bold tracking-wide">{new Date(h.createdAt).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Fertilizers & Treatments */}
          {showTreatments && (
            <>
              <motion.div variants={itemVariants}>
                <SectionTitle icon={<Droplets className="h-6 w-6 text-amber-500" />} title="Lịch sử Dinh dưỡng" />
                {data.fertilizers.length > 0 ? (
                  <div className="space-y-3">
                    {data.fertilizers.map((f, i) => (
                      <ItemCard key={i} icon={<Droplets className="h-6 w-6 text-amber-600" />}
                        iconBg="bg-amber-100" title={f.product} subtitle={f.amount ? `Lượng: ${f.amount}` : undefined}
                        date={new Date(f.appliedAt).toLocaleDateString("vi-VN")} dateColor="text-amber-800 bg-amber-100" />
                    ))}
                  </div>
                ) : <EmptyState text="Chưa ghi nhận dữ liệu bón phân." icon={<Droplets className="h-8 w-8 text-slate-300" />} />}
              </motion.div>

              <motion.div variants={itemVariants}>
                <SectionTitle icon={<Activity className="h-6 w-6 text-violet-500" />} title="Lịch sử Bảo vệ thực vật" />
                {data.treatments.length > 0 ? (
                  <div className="space-y-3">
                    {data.treatments.map((t, i) => (
                      <ItemCard key={i} icon={<Activity className="h-6 w-6 text-violet-600" />}
                        iconBg="bg-violet-100" title={t.product} subtitle={t.dosage ? `Liều lượng: ${t.dosage}` : undefined}
                        date={new Date(t.appliedAt).toLocaleDateString("vi-VN")} dateColor="text-violet-800 bg-violet-100" />
                    ))}
                  </div>
                ) : <EmptyState text="Cây khỏe mạnh, chưa cần phun thuốc." icon={<ShieldCheck className="h-8 w-8 text-slate-300" />} />}
              </motion.div>
            </>
          )}

          {/* Diseases Alert Card */}
          {data.diseases.length > 0 && (
            <motion.div variants={itemVariants}>
              <SectionTitle icon={<Bug className="h-6 w-6 text-red-500" />} title="Lịch sử Dịch bệnh" />
              <div className="space-y-3">
                {data.diseases.map((d, i) => {
                  const active = !d.resolvedAt;
                  return (
                    <div key={i} className={`relative overflow-hidden p-5 rounded-[2rem] border-2 shadow-sm ${active ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-100"}`}>
                      {active && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full pointer-events-none" />}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-red-100' : 'bg-emerald-100'}`}>
                            {active ? <Bug className="h-5 w-5 text-red-600" /> : <ShieldCheck className="h-5 w-5 text-emerald-600" />}
                          </div>
                          <p className="text-base font-black text-slate-900">{d.name}</p>
                        </div>
                        {active && <span className="text-[10px] font-black text-white bg-red-500 px-2.5 py-1 rounded-full tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">ĐANG BỆNH</span>}
                      </div>
                      <p className="text-sm font-semibold text-slate-600 ml-12">
                        Phát hiện: <span className="text-slate-900">{new Date(d.detectedAt).toLocaleDateString("vi-VN")}</span>
                        {d.resolvedAt && <><br/>Đã xử lý: <span className="text-emerald-700">{new Date(d.resolvedAt).toLocaleDateString("vi-VN")}</span></>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Footer Branding */}
          <motion.div variants={itemVariants} className="pt-10 pb-6 flex flex-col items-center">
            <div className="h-16 w-16 rounded-3xl overflow-hidden mb-4 shadow-[0_8px_16px_rgba(0,0,0,0.1)] border border-slate-200">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <p className="text-base font-black text-slate-900 tracking-wide uppercase">Thanh Huyền Farm</p>
            <p className="text-sm text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Hệ thống Truy xuất Nguồn gốc 3.0
            </p>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

// ═══ Premium Reusable Components ═══

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pl-2">
      <div className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
    </div>
  );
}

function Row({ icon, label, value, bold, valueSize = "text-base" }: { icon: React.ReactNode; label: string; value: string; bold?: boolean; valueSize?: string }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-sm font-bold text-slate-500">{label}</span>
      </div>
      <span className={`${valueSize} ${bold ? "font-black text-slate-900" : "font-bold text-slate-700"} text-right max-w-[50%] truncate tracking-tight drop-shadow-sm`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  const bg = color === "emerald" 
    ? "bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200/60" 
    : "bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200/60";
  const valColor = color === "emerald" ? "text-emerald-700 drop-shadow-sm" : "text-amber-700 drop-shadow-sm";
  
  return (
    <div className={`p-6 rounded-[2rem] border ${bg} shadow-sm relative overflow-hidden`}>
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/40 rounded-full blur-xl" />
      <p className={`text-4xl font-black tracking-tighter ${valColor}`}>{value}</p>
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-2">{label}</p>
    </div>
  );
}

function ItemCard({ icon, iconBg, title, subtitle, date, dateColor }: {
  icon: React.ReactNode; iconBg: string; title: string; subtitle?: string; date: string; dateColor: string;
}) {
  return (
    <div className="group flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
      <div className={`h-14 w-14 rounded-[1.25rem] ${iconBg} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-black text-slate-900 truncate tracking-tight">{title}</p>
        {subtitle && <p className="text-sm font-semibold text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <span className={`text-xs font-black px-3.5 py-1.5 rounded-full shrink-0 shadow-sm border border-white/50 ${dateColor}`}>
        {date}
      </span>
    </div>
  );
}

function EmptyState({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
      <div className="mb-3 opacity-50">{icon}</div>
      <p className="text-sm font-bold text-slate-400 tracking-wide">{text}</p>
    </div>
  );
}
