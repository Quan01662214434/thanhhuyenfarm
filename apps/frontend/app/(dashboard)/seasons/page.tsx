"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Calendar,
  Check,
  CircleDollarSign,
  Edit3,
  Leaf,
  Plus,
  Sprout,
  Trash2,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const seasonalCalendar = [
  { month: "Tháng 1-2", activity: "Bón phân hữu cơ + vô cơ lần 1", phase: "Nuôi cành lá", icon: Sprout, color: "from-green-500/20" },
  { month: "Tháng 3-4", activity: "Xiết nước, xử lý ra hoa", phase: "Ra hoa", icon: Leaf, color: "from-pink-500/20" },
  { month: "Tháng 5", activity: "Tỉa trái, bón phân nuôi trái lần 1", phase: "Đậu trái", icon: Sprout, color: "from-amber-500/20" },
  { month: "Tháng 6-7", activity: "Bón phân nuôi trái lần 2, phun thuốc phòng bệnh", phase: "Nuôi trái", icon: TrendingUp, color: "from-emerald-500/20" },
  { month: "Tháng 7-8", activity: "Thu hoạch chính vụ", phase: "Thu hoạch", icon: Truck, color: "from-yellow-500/20" },
  { month: "Tháng 9-10", activity: "Cắt tỉa cành, phục hồi cây sau thu hoạch", phase: "Phục hồi", icon: Leaf, color: "from-blue-500/20" },
  { month: "Tháng 11-12", activity: "Bón phân phục hồi, phòng trừ sâu bệnh", phase: "Dưỡng cây", icon: Sprout, color: "from-teal-500/20" },
];

type Season = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  laborCost: number;
  inputCost: number;
  revenue: number;
  profit: number;
  harvests: { quantityKg: number; revenue: number }[];
};

export default function SeasonsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);

  const { data: seasons, isLoading } = useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const { data: d } = await api.get<Season[]>("/seasons");
      return d;
    },
  });

  const createSeason = useMutation({
    mutationFn: async (dto: any) => {
      await api.post("/seasons", dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seasons"] });
      setShowModal(false);
    },
  });

  const updateSeason = useMutation({
    mutationFn: async ({ id, ...dto }: any) => {
      await api.patch(`/seasons/${id}`, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seasons"] });
      setEditingSeason(null);
    },
  });

  const deleteSeason = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Bạn có chắc chắn muốn xóa mùa vụ này?")) return;
      await api.delete(`/seasons/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasons"] }),
  });

  const fmtCurrency = (val: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Quản lý Mùa vụ</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Theo dõi chu kỳ canh tác, chi phí và sản lượng theo từng mùa vụ
          </p>
        </div>
        <Button className="rounded-2xl gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Tạo mùa vụ mới
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {seasons?.map((s, i) => {
          const now = new Date();
          const start = new Date(s.startDate);
          const end = new Date(s.endDate);
          const isOngoing = now >= start && now <= end;
          const status = isOngoing ? "Đang diễn ra" : now > end ? "Đã kết thúc" : "Sắp tới";

          const totalYield = s.harvests.reduce((acc, h) => acc + h.quantityKg, 0);

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="glass-panel rounded-2xl p-6 hover:shadow-lg transition-all duration-300 relative group">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setEditingSeason(s)}>
                     <Edit3 className="h-4 w-4 text-neutral-400 hover:text-emerald-500" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => deleteSeason.mutate(s.id)}>
                     <Trash2 className="h-4 w-4 text-red-400" />
                   </Button>
                </div>

                <div className="flex items-center justify-between mb-4 pr-16">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{s.name}</h3>
                      <p className="text-xs text-neutral-500">{new Date(s.startDate).toLocaleDateString('vi-VN')} → {new Date(s.endDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isOngoing ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"}`}>
                    {status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Sản lượng", value: `${totalYield.toLocaleString()} kg`, icon: Truck },
                    { label: "Doanh thu", value: fmtCurrency(s.revenue), icon: CircleDollarSign },
                    { label: "Chi phí", value: fmtCurrency(s.laborCost + s.inputCost), icon: CircleDollarSign },
                    { label: "Lợi nhuận", value: fmtCurrency(s.profit), icon: TrendingUp },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 p-3">
                      <p className="text-[10px] font-medium text-neutral-500 mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!isLoading && (!seasons || seasons.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-16 w-16 text-emerald-300/50 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Chưa có mùa vụ nào</h3>
          <p className="text-sm text-neutral-500 mt-1">Bấm "Tạo mùa vụ mới" để bắt đầu theo dõi.</p>
        </div>
      )}

      {/* Seasonal Calendar Guide */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <Calendar className="inline h-5 w-5 mr-2 text-emerald-500" />
          Lịch canh tác Sầu Riêng (chuẩn miền Nam)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {seasonalCalendar.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.month}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={`glass-panel rounded-2xl p-4 bg-gradient-to-br ${s.color} to-transparent hover:shadow-md transition-all duration-200`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">{s.phase}</span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">{s.month}</h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{s.activity}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showModal || editingSeason) && (
          <SeasonFormModal
            season={editingSeason}
            onClose={() => { setShowModal(false); setEditingSeason(null); }}
            onSave={(dto) => editingSeason ? updateSeason.mutate({ id: editingSeason.id, ...dto }) : createSeason.mutate(dto)}
            isPending={createSeason.isPending || updateSeason.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SeasonFormModal({
  season,
  onClose,
  onSave,
  isPending,
}: {
  season: Season | null;
  onClose: () => void;
  onSave: (dto: any) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(season?.name || "");
  const [startDate, setStartDate] = useState(season?.startDate ? season.startDate.split("T")[0] : "");
  const [endDate, setEndDate] = useState(season?.endDate ? season.endDate.split("T")[0] : "");
  const [laborCost, setLaborCost] = useState(season?.laborCost?.toString() || "0");
  const [inputCost, setInputCost] = useState(season?.inputCost?.toString() || "0");
  const [revenue, setRevenue] = useState(season?.revenue?.toString() || "0");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            {season ? <Edit3 className="h-5 w-5 text-emerald-500" /> : <Plus className="h-5 w-5 text-emerald-500" />}
            {season ? "Sửa mùa vụ" : "Tạo mùa vụ mới"}
          </h2>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Tên mùa vụ *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Vụ chính 2025" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Ngày bắt đầu *</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Ngày kết thúc *</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Chi phí nhân công (VNĐ)</label>
            <Input type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} className="rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Chi phí vật tư (Phân bón, thuốc...) (VNĐ)</label>
            <Input type="number" value={inputCost} onChange={(e) => setInputCost(e.target.value)} className="rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Doanh thu dự kiến/thực tế (VNĐ)</label>
            <Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} className="rounded-xl" />
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            className="rounded-xl flex-1 gap-1"
            disabled={!name || !startDate || !endDate || isPending}
            onClick={() => onSave({ 
              name, 
              startDate, 
              endDate,
              laborCost: parseFloat(laborCost) || 0,
              inputCost: parseFloat(inputCost) || 0,
              revenue: parseFloat(revenue) || 0,
            })}
          >
            <Check className="h-3 w-3" />
            {season ? "Lưu thay đổi" : "Tạo mùa vụ"}
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Hủy</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
