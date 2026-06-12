"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Clock,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  Coins,
  Droplets,
  History,
  Leaf,
  Loader2,
  MapPin,
  Sun,
  Timer,
  TrendingUp,
  Users,
  Wind,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type Overview = {
  farms: number;
  plants: number;
  diseased: number;
  tasksOpen: number;
  laborCost: number;
  byHealth: { health: string; _count: { _all: number } }[];
  orgName?: string;
  orgAddress?: string;
};

type ActivityLog = {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  actor: { firstName: string; lastName: string } | null;
};

type MapOverview = {
  id: string;
  name: string;
  description: string;
  totalPlants: number;
  stats: Record<string, number>;
};

// WMO weather code mapping
const getWeatherIcon = (code: number) => {
  if (code === 0) return Sun;
  if (code >= 1 && code <= 3) return Cloud;
  if (code >= 51 && code <= 55) return CloudDrizzle;
  if (code >= 61 && code <= 65) return CloudRain;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95) return CloudLightning;
  return Cloud;
};

const actionLabels: Record<string, string> = {
  MARK_AS_PAID: "Thanh toán lương",
  UPDATE_ATTENDANCE: "Sửa chấm công",
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
};

const actionColors: Record<string, string> = {
  MARK_AS_PAID: "bg-emerald-500",
  UPDATE_ATTENDANCE: "bg-blue-500",
  CREATE: "bg-green-500",
  UPDATE: "bg-amber-500",
  DELETE: "bg-red-500",
};

export default function DashboardOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const { data: d } = await api.get<Overview>("/analytics/overview");
      return d;
    },
  });

  // Real weather from Open-Meteo (Dalat coords)
  const { data: weather } = useQuery({
    queryKey: ["dashboard-weather"],
    queryFn: async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=11.2038&longitude=107.3587&current_weather=true&hourly=temperature_2m,weathercode&daily=precipitation_probability_max&timezone=Asia%2FHo_Chi_Minh`
      );
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Real activity logs
  const { data: activities } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: async () => {
      const { data: d } = await api.get<ActivityLog[]>("/analytics/activity-logs");
      return d;
    },
  });

  // Map overview
  const { data: mapOverview } = useQuery({
    queryKey: ["analytics-map-overview"],
    queryFn: async () => {
      const { data: d } = await api.get<MapOverview[]>("/analytics/map-overview");
      return d;
    },
  });

  // Format byHealth data for BarChart
  const healthData = data?.byHealth?.map((h) => ({
    name: h.health === "HEALTHY" ? "Khỏe mạnh" : h.health === "WATCH" ? "Theo dõi" : h.health === "DISEASED" ? "Bệnh" : h.health,
    count: h._count._all,
  })) || [];

  // Weather forecast for next hours
  const hourlyForecast = (() => {
    if (!weather?.hourly) return [];
    const now = new Date();
    const startIdx = weather.hourly.time.findIndex((t: string) => new Date(t) >= now);
    if (startIdx < 0) return [];
    return [0, 2, 4, 6].map((offset) => {
      const idx = startIdx + offset;
      if (idx >= weather.hourly.time.length) return null;
      return {
        time: new Date(weather.hourly.time[idx]).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        temp: Math.round(weather.hourly.temperature_2m[idx]),
        icon: getWeatherIcon(weather.hourly.weathercode[idx]),
      };
    }).filter(Boolean) as { time: string; temp: number; icon: typeof Sun }[];
  })();

  // Recent activities (last 3)
  const recentActivities = (activities || []).slice(0, 3).map((a) => {
    const label = actionLabels[a.action] || a.action;
    const color = actionColors[a.action] || "bg-neutral-500";
    const diff = Date.now() - new Date(a.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    const timeAgo = mins < 1 ? "Vừa xong" : mins < 60 ? `${mins} phút trước` : mins < 1440 ? `${Math.floor(mins / 60)} giờ trước` : `${Math.floor(mins / 1440)} ngày trước`;
    const actor = a.actor ? `${a.actor.firstName} ${a.actor.lastName}` : "Hệ thống";
    return { title: `${label} (${a.entity})`, time: timeAgo, status: actor, color };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-max">
      {/* ═══ Top Row: Hero & Weather ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="md:col-span-3 relative overflow-hidden rounded-3xl premium-glass p-6 md:p-8 flex flex-col justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-teal-500/10 to-transparent dark:from-emerald-900/40 dark:via-teal-900/10 z-0" />
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-400/20 blur-[60px]" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">
              {(() => {
                const h = new Date().getHours();
                if (h < 12) return "Chào buổi sáng! ☀️";
                if (h < 14) return "Chào buổi trưa! 🌤️";
                if (h < 18) return "Chào buổi chiều! 🌅";
                return "Chào buổi tối! 🌙";
              })()}
            </h1>
            <p className="text-base text-neutral-500 dark:text-neutral-400">
              Tổng quan hoạt động trang trại hôm nay
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-xl px-4 py-3 border border-white/20 shadow-sm">
            <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-black text-neutral-900 dark:text-white">{data?.orgName || "Thanh Huyền"}</p>
              <p className="text-[11px] font-medium text-neutral-500">{data?.orgAddress || "Định Quán, Đồng Nai"}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weather Widget (Bento Tall) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="md:col-span-1 md:row-span-2 relative overflow-hidden rounded-3xl group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      >
        <Link href="/weather" className="block h-full w-full">
          <div className={`h-full w-full p-6 flex flex-col justify-between ${
            weather?.current_weather?.weathercode === 0 
              ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
              : weather?.current_weather?.weathercode >= 61 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : weather?.current_weather?.weathercode >= 95
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-800'
                  : 'bg-gradient-to-br from-sky-400 to-blue-500'
          }`}>
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-black/20 blur-3xl" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-auto">
                <div>
                  <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Thời tiết</p>
                  <p className="text-sm font-bold text-white/90">Khu vực trại</p>
                </div>
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  {weather?.current_weather ? (() => {
                    const WIcon = getWeatherIcon(weather.current_weather.weathercode);
                    return <WIcon className="h-12 w-12 text-white/90 drop-shadow-xl" />;
                  })() : <Cloud className="h-12 w-12 text-white/40" />}
                </motion.div>
              </div>

              {weather?.current_weather ? (
                <div className="mt-8">
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-6xl font-black text-white tracking-tighter leading-none">
                      {Math.round(weather.current_weather.temperature)}°
                    </p>
                  </div>
                  <p className="text-base font-bold text-white/90 mb-6 drop-shadow-md">
                    {weather.current_weather.weathercode === 0 ? "Trời nắng gắt" 
                      : weather.current_weather.weathercode <= 3 ? "Trời nhiều mây"
                      : weather.current_weather.weathercode >= 95 ? "Mưa dông, sấm sét"
                      : weather.current_weather.weathercode >= 61 ? "Mưa lớn"
                      : "Âm u"}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
                      <Wind className="h-4 w-4 text-white/70 mb-1" />
                      <span className="text-[10px] font-black text-white">{weather.current_weather.windspeed} km/h</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
                      <Droplets className="h-4 w-4 text-white/70 mb-1" />
                      <span className="text-[10px] font-black text-white">{weather.daily?.precipitation_probability_max?.[0] ?? 0}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ═══ Middle Row: 4 Metric Cards ═══ */}
      <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Chi phí nhân công", value: data?.laborCost ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(data.laborCost) : "0 ₫", icon: Coins, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Tổng cây trồng", value: data?.plants?.toString() || "0", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Cảnh báo dịch", value: data?.diseased?.toString() || "0", icon: Droplets, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Việc đang mở", value: data?.tasksOpen?.toString() || "0", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.05 }}>
            <div className="premium-glass rounded-3xl p-5 md:p-6 flex flex-col justify-between h-full hover:-translate-y-1 transition-transform">
              <div className={`h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center mb-4 ${k.bg}`}>
                <k.icon className={`h-5 w-5 md:h-6 md:w-6 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{k.label}</p>
                <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white truncate">{isLoading ? "..." : k.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══ Bottom Row: Chart (Span 2), Quick Actions (1), Activity (1) ═══ */}
      
      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-2 premium-glass rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-6">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white">Tỉ lệ Sức khỏe</h3>
            <p className="text-xs font-medium text-neutral-500">Phân bố cây trồng theo tình trạng</p>
          </div>
          <div className="h-[220px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <Tooltip
                  cursor={{ fill: 'rgba(16, 185, 129, 0.1)', radius: 12 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 8, 8]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions (Bento Grid 2x2 internal) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="md:col-span-1 grid grid-cols-2 gap-3">
        {[
          { href: "/attendance-admin", label: "Chấm công", icon: Timer, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
          { href: "/employee/attendance", label: "Điểm danh", icon: Clock, color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
          { href: "/tasks", label: "Nhiệm vụ", icon: ClipboardList, color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
          { href: "/employees", label: "Nhân sự", icon: Users, color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" },
        ].map((action, i) => (
          <Link key={action.href} href={action.href} className="block h-full">
            <div className="h-full premium-glass rounded-3xl p-4 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform hover:shadow-xl cursor-pointer">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-3 ${action.color}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <p className="text-[11px] font-black text-neutral-900 dark:text-white uppercase tracking-wider">{action.label}</p>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="md:col-span-1 premium-glass rounded-3xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-black text-neutral-900 dark:text-white">Hoạt động</h3>
          <Link href="/activity-logs" className="text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">Xem hết</Link>
        </div>
        <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide flex-1">
          {recentActivities.length > 0 ? recentActivities.map((t, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className={`mt-0.5 h-2 w-2 rounded-full ${t.color} shrink-0 ring-4 ring-${t.color}/20`} />
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">{t.title}</p>
                <p className="text-[10px] font-medium text-neutral-500 mt-1">{t.time} · {t.status}</p>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
              <History className="h-8 w-8 mb-2" />
              <p className="text-xs font-bold">Chưa có hoạt động</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ 4th Row: Cây theo khu vực ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="md:col-span-4 premium-glass rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-6">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white">Cây theo khu vực</h3>
            <p className="text-xs font-medium text-neutral-500">Thống kê tổng số cây trồng trong từng khu vực</p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            {mapOverview && mapOverview.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapOverview} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)', radius: 12 }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="totalPlants" name="Số cây" fill="#3b82f6" radius={[8, 8, 8, 8]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-xs font-bold">Đang tải dữ liệu...</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
