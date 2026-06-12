"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Eye,
  MapPin,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  Loader2,
  CloudSun,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ──────────────────────────────────────
// Weather code → visual info
// ──────────────────────────────────────
type WeatherStyle = {
  icon: React.ElementType;
  label: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  emoji: string;
};

const getWeatherInfo = (code: number): WeatherStyle => {
  if (code === 0) return { icon: Sun, label: "Trời nắng", color: "text-amber-400", gradientFrom: "from-amber-400", gradientTo: "to-orange-500", emoji: "☀️" };
  if (code >= 1 && code <= 2) return { icon: CloudSun, label: "Ít mây", color: "text-amber-300", gradientFrom: "from-sky-300", gradientTo: "to-blue-400", emoji: "⛅" };
  if (code === 3) return { icon: Cloud, label: "Nhiều mây", color: "text-slate-400", gradientFrom: "from-slate-400", gradientTo: "to-slate-500", emoji: "☁️" };
  if (code === 45 || code === 48) return { icon: CloudFog, label: "Sương mù", color: "text-slate-300", gradientFrom: "from-slate-300", gradientTo: "to-slate-400", emoji: "🌫️" };
  if (code >= 51 && code <= 55) return { icon: CloudDrizzle, label: "Mưa phùn", color: "text-blue-300", gradientFrom: "from-blue-400", gradientTo: "to-blue-500", emoji: "🌦️" };
  if (code >= 56 && code <= 57) return { icon: CloudSnow, label: "Mưa đá nhẹ", color: "text-cyan-300", gradientFrom: "from-cyan-400", gradientTo: "to-cyan-500", emoji: "🌨️" };
  if (code >= 61 && code <= 65) return { icon: CloudRain, label: code <= 63 ? "Mưa vừa" : "Mưa to", color: "text-blue-400", gradientFrom: "from-blue-500", gradientTo: "to-indigo-600", emoji: "🌧️" };
  if (code >= 66 && code <= 67) return { icon: CloudSnow, label: "Mưa tuyết", color: "text-cyan-400", gradientFrom: "from-cyan-500", gradientTo: "to-blue-600", emoji: "🌨️" };
  if (code >= 71 && code <= 77) return { icon: CloudSnow, label: "Tuyết rơi", color: "text-white", gradientFrom: "from-slate-200", gradientTo: "to-blue-300", emoji: "❄️" };
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: "Mưa rào", color: "text-blue-500", gradientFrom: "from-blue-500", gradientTo: "to-indigo-700", emoji: "🌧️" };
  if (code >= 85 && code <= 86) return { icon: CloudSnow, label: "Bão tuyết", color: "text-cyan-200", gradientFrom: "from-slate-400", gradientTo: "to-blue-500", emoji: "🌨️" };
  if (code >= 95) return { icon: CloudLightning, label: "Dông sét", color: "text-yellow-300", gradientFrom: "from-indigo-600", gradientTo: "to-purple-800", emoji: "⛈️" };
  return { icon: Cloud, label: "Có mây", color: "text-slate-400", gradientFrom: "from-slate-400", gradientTo: "to-slate-500", emoji: "☁️" };
};

export default function WeatherPage() {
  const [coords, setCoords] = useState({ lat: 11.948, lon: 108.4419 }); // Default: Dalat area
  const [locationName, setLocationName] = useState("Khu vực trang trại");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => console.warn("Using default location."),
      );
    }
  }, []);

  useEffect(() => {
    const fetchCityName = async () => {
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=vi`);
        const data = await res.json();
        setLocationName(data.city || data.locality || "Vị trí hiện tại");
      } catch {
        setLocationName("Vị trí hiện tại");
      }
    };
    fetchCityName();
  }, [coords.lat, coords.lon]);

  const { data: weather, isLoading } = useQuery({
    queryKey: ["weather", coords],
    queryFn: async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode,relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FHo_Chi_Minh`
      );
      if (!res.ok) throw new Error("Weather API failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 font-medium">Đang tải dữ liệu thời tiết...</p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800">
          <Cloud className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 font-medium">Không tải được dữ liệu thời tiết.</p>
        </div>
      </div>
    );
  }

  const current = weather.current_weather;
  const daily = weather.daily;
  const hourly = weather.hourly;
  const currentInfo = getWeatherInfo(current.weathercode);
  const CurrentIcon = currentInfo.icon;

  // Hourly: next 12h, step 2h
  const currentHourIndex = hourly.time.findIndex((t: string) => new Date(t) >= new Date());
  const hourlyData = Array.from({ length: 6 }).map((_, i) => {
    const idx = currentHourIndex + i * 2;
    if (idx >= hourly.time.length) return null;
    return {
      time: new Date(hourly.time[idx]),
      temp: hourly.temperature_2m[idx],
      precip: hourly.precipitation_probability[idx],
      humidity: hourly.relativehumidity_2m?.[idx],
      info: getWeatherInfo(hourly.weathercode[idx]),
    };
  }).filter(Boolean);

  const sunriseToday = daily.sunrise?.[0] ? new Date(daily.sunrise[0]) : null;
  const sunsetToday = daily.sunset?.[0] ? new Date(daily.sunset[0]) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* ════════════════════════════════════════ */}
      {/* Header                                  */}
      {/* ════════════════════════════════════════ */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Thời tiết</h1>
        <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> {locationName}
        </p>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* Main Hero Card — Dynamic Gradient       */}
      {/* ════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-[2rem] p-6 sm:p-8 bg-gradient-to-br ${currentInfo.gradientFrom} ${currentInfo.gradientTo} shadow-2xl`}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10">
          {/* Top: Location */}
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-4 w-4 text-white/80" />
            <span className="text-sm font-bold text-white/80 tracking-wide">{locationName}</span>
          </div>

          {/* Center: Temp + Icon */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-7xl sm:text-8xl font-black text-white tracking-tighter leading-none">
                {Math.round(current.temperature)}°
              </p>
              <p className="text-xl font-bold text-white/90 mt-2">{currentInfo.label}</p>
            </div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <CurrentIcon className="h-24 w-24 sm:h-28 sm:w-28 text-white/90 drop-shadow-lg" />
            </motion.div>
          </div>

          {/* Bottom: Mini Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat icon={<Thermometer className="h-4 w-4" />} label="Cao/Thấp" value={`${Math.round(daily.temperature_2m_max[0])}° / ${Math.round(daily.temperature_2m_min[0])}°`} />
            <MiniStat icon={<Wind className="h-4 w-4" />} label="Gió" value={`${current.windspeed} km/h`} />
            <MiniStat icon={<Droplets className="h-4 w-4" />} label="Xác suất mưa" value={`${daily.precipitation_probability_max[0]}%`} />
            {sunriseToday && sunsetToday && (
              <MiniStat
                icon={<Sunrise className="h-4 w-4" />}
                label="Mặt trời"
                value={`${sunriseToday.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} — ${sunsetToday.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════ */}
      {/* Hourly Forecast (Scrollable)            */}
      {/* ════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-emerald-500" />
          Theo dõi 12 giờ tới
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-1 px-1">
          {hourlyData.map((hour: any, i: number) => {
            if (!hour) return null;
            const HIcon = hour.info.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="snap-start shrink-0 w-[110px] bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-center shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
              >
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                  {hour.time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <HIcon className={`h-8 w-8 ${hour.info.color}`} />
                </motion.div>
                <p className="font-black text-xl text-neutral-900 dark:text-white">{Math.round(hour.temp)}°</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                  <Droplets className="h-2.5 w-2.5" /> {hour.precip}%
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ════════════════════════════════════════ */}
      {/* 7-Day Forecast                          */}
      {/* ════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          Dự báo 7 ngày tới
        </h3>
        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
            {daily.time.map((dateStr: string, i: number) => {
              const dInfo = getWeatherInfo(daily.weathercode[i]);
              const DIcon = dInfo.icon;
              const date = new Date(dateStr);
              const isToday = i === 0;
              const maxTemp = Math.round(daily.temperature_2m_max[i]);
              const minTemp = Math.round(daily.temperature_2m_min[i]);
              const precip = daily.precipitation_probability_max[i];

              // Temperature bar visual
              const allMax = Math.max(...daily.temperature_2m_max);
              const allMin = Math.min(...daily.temperature_2m_min);
              const range = allMax - allMin || 1;
              const barLeft = ((minTemp - allMin) / range) * 100;
              const barWidth = ((maxTemp - minTemp) / range) * 100;

              return (
                <motion.div
                  key={dateStr}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${isToday ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                >
                  {/* Day Name */}
                  <div className="w-[72px] shrink-0">
                    <p className={`text-sm font-bold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                      {isToday ? "Hôm nay" : date.toLocaleDateString("vi-VN", { weekday: "short" })}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      {date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className="w-8 shrink-0 flex justify-center">
                    <DIcon className={`h-6 w-6 ${dInfo.color}`} />
                  </div>

                  {/* Rain % */}
                  <div className="w-12 shrink-0 text-center">
                    {precip > 0 ? (
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                        <Droplets className="h-2.5 w-2.5" />{precip}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-300">—</span>
                    )}
                  </div>

                  {/* Temperature Bar */}
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-neutral-400 w-7 text-right shrink-0">{minTemp}°</span>
                    <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full relative overflow-hidden">
                      <div
                        className={`absolute top-0 bottom-0 rounded-full bg-gradient-to-r ${dInfo.gradientFrom} ${dInfo.gradientTo}`}
                        style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 8)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 w-7 shrink-0">{maxTemp}°</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════ */}
      {/* Farming Tips based on weather           */}
      {/* ════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-red-500" />
          Lưu ý canh tác
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {generateFarmTips(current, daily).map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`p-4 rounded-2xl border ${tip.borderColor} ${tip.bgColor}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{tip.emoji}</span>
                <div>
                  <p className={`text-sm font-bold ${tip.textColor}`}>{tip.title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Mini stat inside hero card ─── */
function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md rounded-xl px-3 py-2.5 border border-white/10">
      <div className="text-white/80 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}

/* ─── Generate farm-specific tips ─── */
function generateFarmTips(current: any, daily: any) {
  const tips: { emoji: string; title: string; desc: string; bgColor: string; borderColor: string; textColor: string }[] = [];

  const precipMax = daily.precipitation_probability_max[0] || 0;
  const tempMax = daily.temperature_2m_max[0] || 30;
  const windSpeed = current.windspeed || 0;

  if (precipMax >= 70) {
    tips.push({
      emoji: "🌧️",
      title: "Mưa lớn dự kiến",
      desc: "Nên hoãn phun thuốc và bón phân. Kiểm tra hệ thống thoát nước cho vườn để tránh ngập úng rễ cây.",
      bgColor: "bg-blue-50 dark:bg-blue-900/10",
      borderColor: "border-blue-200 dark:border-blue-800",
      textColor: "text-blue-800 dark:text-blue-300",
    });
  } else if (precipMax >= 30) {
    tips.push({
      emoji: "🌦️",
      title: "Có khả năng mưa",
      desc: "Nên bón phân hữu cơ gốc để tận dụng độ ẩm. Phun thuốc nên làm sáng sớm trước khi mưa.",
      bgColor: "bg-sky-50 dark:bg-sky-900/10",
      borderColor: "border-sky-200 dark:border-sky-800",
      textColor: "text-sky-800 dark:text-sky-300",
    });
  } else {
    tips.push({
      emoji: "☀️",
      title: "Thời tiết thuận lợi",
      desc: "Điều kiện lý tưởng để phun thuốc và bón phân. Nên tưới nước vào chiều mát để giữ ẩm đất.",
      bgColor: "bg-amber-50 dark:bg-amber-900/10",
      borderColor: "border-amber-200 dark:border-amber-800",
      textColor: "text-amber-800 dark:text-amber-300",
    });
  }

  if (tempMax >= 35) {
    tips.push({
      emoji: "🔥",
      title: "Nhiệt độ cao",
      desc: "Tăng lượng nước tưới gấp đôi. Che phủ gốc cây bằng lớp phủ hữu cơ để giữ ẩm và hạ nhiệt rễ.",
      bgColor: "bg-red-50 dark:bg-red-900/10",
      borderColor: "border-red-200 dark:border-red-800",
      textColor: "text-red-800 dark:text-red-300",
    });
  }

  if (windSpeed >= 30) {
    tips.push({
      emoji: "💨",
      title: "Gió mạnh",
      desc: "Không nên phun thuốc trong điều kiện gió lớn. Kiểm tra hệ thống chống gió cho cây non.",
      bgColor: "bg-slate-50 dark:bg-slate-900/10",
      borderColor: "border-slate-200 dark:border-slate-800",
      textColor: "text-slate-800 dark:text-slate-300",
    });
  }

  if (tips.length < 2) {
    tips.push({
      emoji: "🌱",
      title: "Chăm sóc định kỳ",
      desc: "Kiểm tra sức khỏe cây trồng, quan sát dấu hiệu sâu bệnh và ghi nhận vào hệ thống QR để theo dõi.",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/10",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      textColor: "text-emerald-800 dark:text-emerald-300",
    });
  }

  return tips;
}
