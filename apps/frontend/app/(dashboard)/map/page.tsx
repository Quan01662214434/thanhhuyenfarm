"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { Map, AlertTriangle, CheckCircle2, ShieldAlert, Sprout, Activity } from "lucide-react";
import * as React from "react";
import { useAuthStore } from "@/stores/auth-store";

function apiBase() {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "http://localhost:4000/api";
}

type MapZone = {
  id: string;
  name: string;
  description: string | null;
  totalPlants: number;
  stats: {
    HEALTHY: number;
    WATCH: number;
    DISEASED: number;
    RECOVERING: number;
    DEAD: number;
  };
};

export default function MapPage() {
  const token = useAuthStore((s) => s.token);

  const { data: zones, isLoading } = useQuery({
    queryKey: ["map-overview"],
    queryFn: async () => {
      const { data } = await axios.get<MapZone[]>(`${apiBase()}/analytics/map-overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    enabled: !!token,
  });

  if (isLoading || !zones) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Calculate total farm stats
  const totalPlants = zones.reduce((sum, z) => sum + z.totalPlants, 0);
  const totalDiseased = zones.reduce((sum, z) => sum + z.stats.DISEASED, 0);
  const totalWatch = zones.reduce((sum, z) => sum + z.stats.WATCH, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <Map className="h-8 w-8 text-emerald-500" />
            Bản đồ Nông trại
          </h1>
          <p className="text-slate-500 font-medium mt-1">Giám sát rủi ro dịch bệnh (Heatmap)</p>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Sprout} title="Tổng số khu" value={zones.length} color="blue" />
        <StatCard icon={Sprout} title="Tổng cây trồng" value={totalPlants} color="emerald" />
        <StatCard icon={Activity} title="Theo dõi" value={totalWatch} color="amber" />
        <StatCard icon={ShieldAlert} title="Bệnh nguy hiểm" value={totalDiseased} color="red" />
      </div>

      {/* Heatmap Grid */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {zones.map((zone) => {
            const hasDiseased = zone.stats.DISEASED > 0;
            const hasWatch = zone.stats.WATCH > 0;
            const isSafe = !hasDiseased && !hasWatch && zone.totalPlants > 0;
            
            let bgClass = "bg-slate-50 border-slate-200";
            let indicator = null;

            if (hasDiseased) {
              bgClass = "bg-red-50 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
              indicator = <AlertTriangle className="h-6 w-6 text-red-500 animate-pulse" />;
            } else if (hasWatch) {
              bgClass = "bg-amber-50 border-amber-300";
              indicator = <Activity className="h-6 w-6 text-amber-500" />;
            } else if (isSafe) {
              bgClass = "bg-emerald-50 border-emerald-200";
              indicator = <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
            }

            return (
              <motion.div
                key={zone.id}
                whileHover={{ scale: 1.02 }}
                className={`relative p-5 rounded-2xl border-2 transition-all ${bgClass} flex flex-col`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{zone.name}</h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">{zone.totalPlants} cây</p>
                  </div>
                  {indicator}
                </div>
                
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold bg-white/60 p-2 rounded-xl">
                    <span className="text-slate-600">Bệnh/Yếu:</span>
                    <span className={hasDiseased ? "text-red-600" : "text-slate-400"}>
                      {zone.stats.DISEASED}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold bg-white/60 p-2 rounded-xl">
                    <span className="text-slate-600">Theo dõi:</span>
                    <span className={hasWatch ? "text-amber-600" : "text-slate-400"}>
                      {zone.stats.WATCH}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold bg-white/60 p-2 rounded-xl">
                    <span className="text-slate-600">Khỏe mạnh:</span>
                    <span className={isSafe ? "text-emerald-600" : "text-slate-400"}>
                      {zone.stats.HEALTHY}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }: any) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-100",
    emerald: "text-emerald-600 bg-emerald-100",
    amber: "text-amber-600 bg-amber-100",
    red: "text-red-600 bg-red-100",
  };
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
