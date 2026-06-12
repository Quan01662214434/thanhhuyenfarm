"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Filter,
  Leaf,
  MapPin,
  QrCode,
  Search,
  Sprout,
  TreePine,
  AlertTriangle,
  Heart,
  Eye,
  Plus,
  X,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type PlantRow = {
  id: string;
  plantIndex?: number | null;
  species: string;
  health: string;
  qrToken: string;
  statusNote: string | null;
  plantedAt: string;
  zone: { name: string };
  media: { url: string | null }[];
  _count: { diseases: number; tasks: number };
};

const ITEMS_PER_PAGE = 12;

const healthConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Heart }> = {
  HEALTHY: { label: "Khỏe mạnh", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: Heart },
  WATCH: { label: "Theo dõi", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30", icon: Eye },
  DISEASED: { label: "Bệnh", color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertTriangle },
  RECOVERING: { label: "Đang hồi phục", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30", icon: Sprout },
  DEAD: { label: "Chết", color: "text-neutral-500", bg: "bg-neutral-200 dark:bg-neutral-800", icon: TreePine },
};

const healthOptions = ["HEALTHY", "WATCH", "DISEASED", "RECOVERING", "DEAD"] as const;

export default function PlantsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <PlantsPageContent />
    </Suspense>
  );
}

function PlantsPageContent() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("zone") || "");
  const [healthFilter, setHealthFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [editingPlant, setEditingPlant] = useState<PlantRow | null>(null);
  const [qrPlant, setQrPlant] = useState<PlantRow | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/plants/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "thanh_huyen_farm_plants.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi xuất file Excel!");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/plants/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Import failed");
      const data = await res.json();
      alert(`Nhập dữ liệu thành công! Đã thêm ${data.count} cây.`);
      qc.invalidateQueries({ queryKey: ["plants"] });
      qc.invalidateQueries({ queryKey: ["zones"] });
    } catch (err) {
      console.error(err);
      alert("Lỗi khi nhập file Excel! Vui lòng kiểm tra lại cấu trúc file CSV.");
    } finally {
      setIsImporting(false);
      e.target.value = ""; // reset input
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["plants"],
    queryFn: async () => {
      const { data: d } = await api.get<PlantRow[]>("/plants");
      return d;
    },
  });

  const updatePlant = useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; species?: string; health?: string; statusNote?: string; plantIndex?: number | null }) => {
      await api.patch(`/plants/${id}`, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants"] });
      setEditingPlant(null);
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      const matchSearch =
        search === "" ||
        p.species.toLowerCase().includes(search.toLowerCase()) ||
        p.zone.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchHealth = healthFilter === "ALL" || p.health === healthFilter;
      return matchSearch && matchHealth;
    });
  }, [data, search, healthFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    if (!data) return { total: 0, healthy: 0, diseased: 0, watch: 0 };
    return {
      total: data.length,
      healthy: data.filter((p) => p.health === "HEALTHY").length,
      diseased: data.filter((p) => p.health === "DISEASED").length,
      watch: data.filter((p) => p.health === "WATCH").length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Quản lý Cây trồng</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Theo dõi {stats.total.toLocaleString()} cây sầu riêng trên toàn bộ trang trại
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-2xl gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Xuất Excel
          </Button>
          <div>
            <input type="file" id="import-csv" className="hidden" accept=".csv" onChange={handleImport} disabled={isImporting} />
            <Button variant="outline" className="rounded-2xl gap-2" disabled={isImporting} asChild>
              <label htmlFor="import-csv" className="cursor-pointer">
                <Upload className="h-4 w-4" /> {isImporting ? "Đang nhập..." : "Nhập Excel"}
              </label>
            </Button>
          </div>
          <Button className="rounded-2xl gap-2" asChild>
            <Link href="/scan">
              <Plus className="h-4 w-4" />
              Thêm cây mới
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng cây", value: stats.total, color: "from-emerald-500/20 to-emerald-600/5", textColor: "text-emerald-700 dark:text-emerald-300" },
          { label: "Khỏe mạnh", value: stats.healthy, color: "from-green-500/20 to-green-600/5", textColor: "text-green-700 dark:text-green-300" },
          { label: "Cần theo dõi", value: stats.watch, color: "from-amber-500/20 to-amber-600/5", textColor: "text-amber-700 dark:text-amber-300" },
          { label: "Đang bệnh", value: stats.diseased, color: "from-red-500/20 to-red-600/5", textColor: "text-red-700 dark:text-red-300" },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`glass-panel rounded-2xl p-4 bg-gradient-to-br ${s.color}`}>
            <p className="text-xs font-medium text-neutral-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.textColor}`}>{isLoading ? "..." : s.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Tìm theo tên giống, khu vực, hoặc mã cây..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 rounded-2xl bg-white/80 dark:bg-neutral-900/50 backdrop-blur-sm border-neutral-200/80 dark:border-neutral-800"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={healthFilter === "ALL" ? "default" : "outline"} size="sm" className="rounded-2xl text-xs" onClick={() => { setHealthFilter("ALL"); setPage(1); }}>
            <Filter className="h-3 w-3 mr-1" /> Tất cả
          </Button>
          {Object.entries(healthConfig).map(([key, cfg]) => (
            <Button key={key} variant={healthFilter === key ? "default" : "outline"} size="sm" className="rounded-2xl text-xs" onClick={() => { setHealthFilter(key); setPage(1); }}>
              {cfg.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Hiển thị {paged.length} / {filtered.length.toLocaleString()} cây
          {search && <span className="text-emerald-600 font-medium"> · Tìm: &quot;{search}&quot;</span>}
        </p>
      </div>

      {/* Plant Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {paged.map((p, i) => {
            const cfg = healthConfig[p.health] || healthConfig.HEALTHY;
            const HealthIcon = cfg.icon;
            const age = Math.floor((Date.now() - new Date(p.plantedAt).getTime()) / (1000 * 60 * 60 * 24 * 365));

            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}>
                <Card className="overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 border-neutral-200/60 dark:border-neutral-800">
                  <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-emerald-50 to-neutral-100 dark:from-emerald-950/30 dark:to-neutral-900">
                    {p.media[0]?.url ? (
                      <Image src={p.media[0].url} alt={p.species} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="400px" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Leaf className="h-12 w-12 text-emerald-300/50" /></div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color} backdrop-blur-sm shadow-sm`}>
                        <HealthIcon className="h-3 w-3" /> {cfg.label}
                      </span>
                    </div>
                    {p._count.diseases > 0 && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                          <AlertTriangle className="h-3 w-3" /> {p._count.diseases} bệnh
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white text-base">
                        {p.plantIndex != null ? `#${p.plantIndex} - ` : ""}{p.species}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-neutral-500">{p.zone.name}</span>
                        {age > 0 && (<><span className="text-neutral-300 dark:text-neutral-700">·</span><span className="text-xs text-neutral-500">{age} năm tuổi</span></>)}
                      </div>
                    </div>

                    {p.statusNote && (
                      <p className="text-xs text-neutral-500 line-clamp-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl px-3 py-2">{p.statusNote}</p>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button variant="secondary" size="sm" className="rounded-xl text-xs h-8 gap-1 flex-1" onClick={() => setEditingPlant(p)}>
                        <Edit3 className="h-3 w-3" /> Sửa
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 gap-1 flex-1" onClick={() => setQrPlant(p)}>
                        <QrCode className="h-3 w-3" /> QR
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-xl text-xs h-8 gap-1" asChild>
                        <Link href={`/p/${p.id}?t=${encodeURIComponent(p.qrToken)}`} target="_blank">
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sprout className="h-16 w-16 text-emerald-300/50 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Không tìm thấy cây nào</h3>
          <p className="text-sm text-neutral-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) pageNum = i + 1;
              else if (page <= 4) pageNum = i + 1;
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
              else pageNum = page - 3 + i;
              return (
                <Button key={pageNum} variant={page === pageNum ? "default" : "ghost"} size="sm" className="rounded-xl h-9 w-9 text-xs" onClick={() => setPage(pageNum)}>
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-xs text-neutral-400 ml-2">Trang {page} / {totalPages}</span>
        </div>
      )}

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingPlant && (
          <EditPlantModal
            plant={editingPlant}
            onClose={() => setEditingPlant(null)}
            onSave={(dto) => updatePlant.mutate({ id: editingPlant.id, ...dto })}
            isPending={updatePlant.isPending}
          />
        )}
      </AnimatePresence>

      {/* QR MODAL */}
      <AnimatePresence>
        {qrPlant && (
          <QrModal plant={qrPlant} onClose={() => setQrPlant(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===== Edit Plant Modal ===== */
function EditPlantModal({ plant, onClose, onSave, isPending }: {
  plant: PlantRow;
  onClose: () => void;
  onSave: (dto: { species?: string; health?: string; statusNote?: string; plantIndex?: number | null }) => void;
  isPending: boolean;
}) {
  const [species, setSpecies] = useState(plant.species);
  const [health, setHealth] = useState(plant.health);
  const [statusNote, setStatusNote] = useState(plant.statusNote || "");
  const [plantIndex, setPlantIndex] = useState(plant.plantIndex?.toString() || "");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-emerald-500" /> Chỉnh sửa cây
          </h2>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Mã cây</label>
            <p className="text-xs font-mono text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-3 py-2">{plant.id}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Giống cây</label>
            <Input value={species} onChange={(e) => setSpecies(e.target.value)} className="rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Số thứ tự cây (Tùy chọn)</label>
            <Input type="number" value={plantIndex} onChange={(e) => setPlantIndex(e.target.value)} className="rounded-xl" placeholder="Để trống nếu chưa có" />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">Tình trạng sức khỏe</label>
            <div className="flex gap-2 flex-wrap">
              {healthOptions.map((h) => {
                const cfg = healthConfig[h];
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHealth(h)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${health === h ? cfg.bg + " " + cfg.color + " ring-2 ring-offset-1 ring-current" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"}`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Ghi chú tình trạng</label>
            <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="rounded-xl" placeholder="VD: Lá hơi vàng, cần theo dõi thêm..." />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button className="rounded-xl flex-1 gap-1" disabled={isPending} onClick={() => onSave({ species, health, statusNote: statusNote || undefined, plantIndex: plantIndex ? Number(plantIndex) : null })}>
            <Check className="h-3 w-3" /> Lưu thay đổi
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Hủy</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ===== QR Code Modal ===== */
function QrModal({ plant, onClose }: { plant: PlantRow; onClose: () => void }) {
  const publicUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
  const qrUrl = `${publicUrl}/p/${plant.id}?t=${encodeURIComponent(plant.qrToken)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrUrl)}&color=064e3b&bgcolor=ffffff&margin=10`;

  const downloadQR = async () => {
    try {
      const res = await fetch(qrImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `qr-${plant.species}-${plant.id.slice(0, 8)}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(qrImageUrl, "_blank");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-500" /> Mã QR
          </h2>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center space-y-4">
          <div className="bg-white rounded-2xl p-4 inline-block shadow-inner border border-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt={`QR - ${plant.species}`} width={280} height={280} className="mx-auto" />
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{plant.species}</p>
            <p className="text-xs text-neutral-500">{plant.zone.name}</p>
            <p className="text-[10px] font-mono text-neutral-400 mt-1 break-all">ID: {plant.id}</p>
          </div>

          <div className="flex gap-2">
            <Button className="rounded-xl flex-1 gap-1" onClick={downloadQR}>
              <Download className="h-4 w-4" /> Tải xuống QR
            </Button>
            <Button variant="outline" className="rounded-xl flex-1 gap-1" asChild>
              <Link href={qrUrl} target="_blank">
                <Eye className="h-4 w-4" /> Xem trang
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
