"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  ChevronDown,
  Droplets,
  Loader2,
  Plus,
  Search,
  Sprout,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";

type Plant = {
  id: string;
  species: string;
  zone: { name: string };
};

type FertilizerApp = {
  id: string;
  plantId: string;
  product: string;
  amount: string | null;
  appliedAt: string;
  plant: { species: string; zone: { name: string } };
};

type TreatmentApp = {
  id: string;
  plantId: string;
  product: string;
  dosage: string | null;
  appliedAt: string;
  notes: string | null;
  plant: { species: string; zone: { name: string } };
};

export default function FertilizersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"fertilizer" | "treatment">("fertilizer");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [plantId, setPlantId] = useState("");
  const [product, setProduct] = useState("");
  const [amountOrDosage, setAmountOrDosage] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch plants for dropdown
  const { data: plants } = useQuery({
    queryKey: ["plants-list"],
    queryFn: async () => {
      const { data } = await api.get<Plant[]>("/plants");
      return data;
    },
  });

  // Fetch fertilizers
  const { data: fertilizers, isLoading: loadingFert } = useQuery({
    queryKey: ["all-fertilizers"],
    queryFn: async () => {
      const { data } = await api.get<FertilizerApp[]>("/plants/fertilizers/all");
      return data;
    },
  });

  // Fetch treatments
  const { data: treatments, isLoading: loadingTreat } = useQuery({
    queryKey: ["all-treatments"],
    queryFn: async () => {
      const { data } = await api.get<TreatmentApp[]>("/plants/treatments/all");
      return data;
    },
  });

  // Create fertilizer
  const createFert = useMutation({
    mutationFn: async () => {
      await api.post(`/plants/${plantId}/fertilizers`, {
        product,
        amount: amountOrDosage || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-fertilizers"] });
      resetForm();
    },
  });

  // Create treatment
  const createTreat = useMutation({
    mutationFn: async () => {
      await api.post(`/plants/${plantId}/treatments`, {
        product,
        dosage: amountOrDosage || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-treatments"] });
      resetForm();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setPlantId("");
    setProduct("");
    setAmountOrDosage("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!plantId || !product) return;
    if (tab === "fertilizer") createFert.mutate();
    else createTreat.mutate();
  };

  const isLoading = tab === "fertilizer" ? loadingFert : loadingTreat;

  // Filter data
  const filteredFertilizers = (fertilizers || []).filter(
    (f) =>
      f.product.toLowerCase().includes(search.toLowerCase()) ||
      f.plant.species.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTreatments = (treatments || []).filter(
    (t) =>
      t.product.toLowerCase().includes(search.toLowerCase()) ||
      t.plant.species.toLowerCase().includes(search.toLowerCase())
  );

  // Group by date helper
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

    if (isSameDay(d, today)) return "Hôm nay";
    if (isSameDay(d, yesterday)) return "Hôm qua";
    return d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const groupByDate = <T extends { appliedAt: string }>(items: T[]) => {
    const groups: { date: string; label: string; items: T[] }[] = [];
    for (const item of items) {
      const dateKey = new Date(item.appliedAt).toLocaleDateString("vi-VN");
      const existing = groups.find((g) => g.date === dateKey);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ date: dateKey, label: formatDateLabel(item.appliedAt), items: [item] });
      }
    }
    return groups;
  };

  const fertGroups = groupByDate(filteredFertilizers);
  const treatGroups = groupByDate(filteredTreatments);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Phân bón & Thuốc BVTV</h1>
          <p className="text-sm text-neutral-500 mt-1">Quản lý lịch sử bón phân và phun thuốc cho toàn bộ vườn cây</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Thêm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl w-fit">
        <button
          onClick={() => setTab("fertilizer")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === "fertilizer"
              ? "bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-400 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          <Droplets className="h-4 w-4" />
          Phân bón
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
            {fertilizers?.length ?? 0}
          </span>
        </button>
        <button
          onClick={() => setTab("treatment")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === "treatment"
              ? "bg-white dark:bg-neutral-800 text-violet-700 dark:text-violet-400 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          <Activity className="h-4 w-4" />
          Thuốc BVTV
          <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold">
            {treatments?.length ?? 0}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên sản phẩm hoặc cây..."
          className="w-full pl-11 pr-4 py-3 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
        />
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-lg"
        >
          <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
            {tab === "fertilizer" ? "🌿 Thêm bón phân" : "💊 Thêm phun thuốc"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plant select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Cây trồng</label>
              <div className="relative">
                <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                <select
                  value={plantId}
                  onChange={(e) => setPlantId(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none appearance-none focus:border-emerald-500"
                >
                  <option value="">Chọn cây...</option>
                  {(plants || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.species} — {p.zone.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300 pointer-events-none" />
              </div>
            </div>

            {/* Product */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {tab === "fertilizer" ? "Tên phân" : "Tên thuốc"}
              </label>
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder={tab === "fertilizer" ? "NPK 20-20-15..." : "Regent 800WG..."}
                className="w-full px-4 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>

            {/* Amount/Dosage */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {tab === "fertilizer" ? "Lượng dùng" : "Liều lượng"}
              </label>
              <input
                value={amountOrDosage}
                onChange={(e) => setAmountOrDosage(e.target.value)}
                placeholder={tab === "fertilizer" ? "500g/gốc" : "2ml/lít nước"}
                className="w-full px-4 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>

            {/* Notes (treatment only) */}
            {tab === "treatment" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ghi chú</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Phun sáng sớm..."
                  className="w-full px-4 py-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSubmit}
              disabled={!plantId || !product || createFert.isPending || createTreat.isPending}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40"
            >
              {(createFert.isPending || createTreat.isPending) ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 text-neutral-500 text-sm font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Hủy
            </button>
          </div>
        </motion.div>
      )}

      {/* Data Table — Grouped by Date */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : tab === "fertilizer" ? (
        <div className="space-y-6">
          {fertGroups.length > 0 ? fertGroups.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 px-3 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{group.label}</span>
                </div>
                <span className="text-[10px] font-medium text-neutral-300 dark:text-neutral-600">{group.items.length} lần bón</span>
                <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
              </div>
              {/* Items */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                  {group.items.map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                        <Droplets className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{f.product}</p>
                        <p className="text-[11px] text-neutral-400 font-medium">
                          {f.plant.species} · {f.plant.zone.name}
                          {f.amount && ` · ${f.amount}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-neutral-400">
                          {new Date(f.appliedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-center py-16">
              <Droplets className="h-12 w-12 text-neutral-200 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-400 font-medium">Chưa có dữ liệu bón phân</p>
              <p className="text-xs text-neutral-300 mt-1">Bấm "Thêm mới" để ghi nhận lần bón phân đầu tiên</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {treatGroups.length > 0 ? treatGroups.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/10 px-3 py-1.5 rounded-lg border border-violet-200/50 dark:border-violet-800/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  <span className="text-xs font-bold text-violet-700 dark:text-violet-400">{group.label}</span>
                </div>
                <span className="text-[10px] font-medium text-neutral-300 dark:text-neutral-600">{group.items.length} lần phun</span>
                <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
              </div>
              {/* Items */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                  {group.items.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                        <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{t.product}</p>
                        <p className="text-[11px] text-neutral-400 font-medium">
                          {t.plant.species} · {t.plant.zone.name}
                          {t.dosage && ` · ${t.dosage}`}
                          {t.notes && ` · ${t.notes}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-neutral-400">
                          {new Date(t.appliedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-center py-16">
              <Activity className="h-12 w-12 text-neutral-200 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-400 font-medium">Chưa có dữ liệu phun thuốc</p>
              <p className="text-xs text-neutral-300 mt-1">Bấm "Thêm mới" để ghi nhận lần phun thuốc đầu tiên</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
