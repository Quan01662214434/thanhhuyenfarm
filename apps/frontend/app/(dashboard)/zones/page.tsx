"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Edit3,
  MapPin,
  Plus,
  Sprout,
  Trash2,
  TreePine,
  X,
  ListOrdered,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type Zone = {
  id: string;
  name: string;
  description: string | null;
  farmId: string;
  farm: { name: string };
  _count: { plants: number };
};

export default function ZonesPage() {
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingZone, setManagingZone] = useState<Zone | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVietgap, setEditVietgap] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const { data: d } = await api.get<Zone[]>("/zones");
      return d;
    },
  });

  const { data: farms } = useQuery({
    queryKey: ["farms"],
    queryFn: async () => {
      const { data: d } = await api.get<any[]>("/farms");
      return d;
    },
  });

  const createZone = useMutation({
    mutationFn: async (dto: { name: string; description: string; farmId?: string }) => {
      await api.post("/zones", dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      setShowAddModal(false);
    },
  });

  const updateZone = useMutation({
    mutationFn: async ({ id, name, description, vietgapCode }: { id: string; name: string; description: string; vietgapCode: string }) => {
      await api.patch(`/zones/${id}`, { name, description, vietgapCode });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      setEditingId(null);
    },
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/zones/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zones"] }),
  });

  const startEdit = (zone: Zone & { vietgapCode?: string }) => {
    setEditingId(zone.id);
    setEditName(zone.name);
    setEditDesc(zone.description || "");
    setEditVietgap(zone.vietgapCode || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
    setEditVietgap("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Quản lý Khu vực Vườn</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Quản lý các phân khu trong trang trại của bạn.
          </p>
        </div>
        <Button className="rounded-2xl gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Thêm khu vực
        </Button>
      </div>

      {/* Zone Stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="glass-panel rounded-2xl px-4 py-3 flex items-center gap-2">
          <TreePine className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Tổng khu vực: <strong className="text-neutral-900 dark:text-white">{data?.length ?? 0}</strong>
          </span>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-3 flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Tổng cây: <strong className="text-neutral-900 dark:text-white">{data?.reduce((sum, z) => sum + z._count.plants, 0)?.toLocaleString() ?? 0}</strong>
          </span>
        </div>
      </div>

      {/* Zone Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((zone, i) => {
          const isEditing = editingId === zone.id;

          return (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="glass-panel rounded-2xl p-5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">Tên khu vực</label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded-xl"
                        placeholder="VD: Khu A - Vườn chính"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">Địa chỉ / Mô tả</label>
                      <Input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="rounded-xl"
                        placeholder="VD: Thôn 5, Xã Đạ Sar, Lạc Dương, Lâm Đồng"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">Mã chứng nhận VietGAP (Tùy chọn)</label>
                      <Input
                        value={editVietgap}
                        onChange={(e) => setEditVietgap(e.target.value)}
                        className="rounded-xl"
                        placeholder="VD: VietGAP-12345"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="rounded-xl flex-1 gap-1"
                        onClick={() => updateZone.mutate({ id: zone.id, name: editName, description: editDesc, vietgapCode: editVietgap })}
                        disabled={updateZone.isPending}
                      >
                        <Check className="h-3 w-3" />
                        Lưu
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={cancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                          <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">{zone.name}</h3>
                          <p className="text-xs text-neutral-500">{zone.farm.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-8 w-8"
                          onClick={() => startEdit(zone)}
                        >
                          <Edit3 className="h-4 w-4 text-neutral-400 hover:text-emerald-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-8 w-8"
                          onClick={() => { if (confirm("Xóa khu vực này?")) deleteZone.mutate(zone.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Address / Description */}
                    <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 px-4 py-3 mb-3">
                      {zone.description ? (
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{zone.description}</p>
                      ) : (
                        <p className="text-sm text-neutral-400 italic">Chưa có địa chỉ — Bấm ✏️ để thêm</p>
                      )}
                      {(zone as any).vietgapCode && (
                        <div className="mt-2 flex items-center gap-1.5 inline-flex rounded-lg bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-400">
                          <Check className="h-3 w-3" /> VietGAP: {(zone as any).vietgapCode}
                        </div>
                      )}
                    </div>

                    {/* Plant count & Actions */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          <strong className="text-neutral-900 dark:text-white">{zone._count.plants.toLocaleString()}</strong> cây
                        </span>
                      </div>
                      <Button variant="secondary" size="sm" className="rounded-xl h-8 text-xs gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400" onClick={() => setManagingZone(zone)}>
                        <ListOrdered className="h-3 w-3" /> Cây trong khu
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="h-16 w-16 text-emerald-300/50 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Chưa có khu vực nào</h3>
          <p className="text-sm text-neutral-500 mt-1">Bắt đầu bằng cách tạo khu vực mới.</p>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddZoneModal
            farms={farms || []}
            onClose={() => setShowAddModal(false)}
            onSave={(dto) => createZone.mutate(dto)}
            isPending={createZone.isPending}
          />
        )}
        {managingZone && (
          <ManageZonePlantsModal
            zone={managingZone}
            onClose={() => setManagingZone(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ManageZonePlantsModal({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const qc = useQueryClient();
  const [plantIndex, setPlantIndex] = useState("");
  const [species, setSpecies] = useState("Sầu riêng");

  const { data: plants, isLoading } = useQuery({
    queryKey: ["plants", "zone", zone.id],
    queryFn: async () => {
      const { data } = await api.get<any[]>(`/plants?zoneId=${zone.id}`);
      // Sort by plantIndex numerically
      return data.sort((a, b) => {
        if (a.plantIndex === null && b.plantIndex === null) return 0;
        if (a.plantIndex === null) return 1;
        if (b.plantIndex === null) return -1;
        return a.plantIndex - b.plantIndex;
      });
    },
  });

  const createPlant = useMutation({
    mutationFn: async () => {
      await api.post("/plants", {
        zoneId: zone.id,
        species,
        plantedAt: new Date().toISOString(),
        plantIndex: plantIndex ? parseInt(plantIndex, 10) : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants", "zone", zone.id] });
      qc.invalidateQueries({ queryKey: ["zones"] });
      // Auto-increment
      if (plantIndex) {
        setPlantIndex((parseInt(plantIndex, 10) + 1).toString());
      }
    },
  });

  const updatePlantIndex = useMutation({
    mutationFn: async ({ id, newIndex }: { id: string; newIndex: number | null }) => {
      await api.patch(`/plants/${id}`, { plantIndex: newIndex });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants", "zone", zone.id] });
    },
  });

  const [editingIndexId, setEditingIndexId] = useState<string | null>(null);
  const [editIndexValue, setEditIndexValue] = useState("");

  const handleSaveIndex = (plantId: string) => {
    updatePlantIndex.mutate({
      id: plantId,
      newIndex: editIndexValue ? parseInt(editIndexValue, 10) : null,
    });
    setEditingIndexId(null);
  };

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
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <TreePine className="h-5 w-5 text-emerald-500" /> Cây thuộc {zone.name}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Quản lý và thêm số thứ tự cây cho khu vực này</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Add Form */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl mb-6 flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 block uppercase">Số thứ tự cây</label>
            <Input type="number" value={plantIndex} onChange={(e) => setPlantIndex(e.target.value)} placeholder="VD: 1, 2, 3..." className="rounded-xl border-emerald-200 dark:border-emerald-800 bg-white dark:bg-neutral-900" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 block uppercase">Giống cây</label>
            <Input value={species} onChange={(e) => setSpecies(e.target.value)} className="rounded-xl border-emerald-200 dark:border-emerald-800 bg-white dark:bg-neutral-900" />
          </div>
          <Button 
            className="rounded-xl px-6 gap-2" 
            disabled={!species || createPlant.isPending} 
            onClick={() => createPlant.mutate()}
          >
            <Plus className="h-4 w-4" /> Thêm nhanh
          </Button>
        </div>

        {/* Plant List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
          {isLoading ? (
            <p className="text-center text-sm text-neutral-500 py-10">Đang tải...</p>
          ) : plants?.length === 0 ? (
            <p className="text-center text-sm text-neutral-500 py-10">Khu vực này chưa có cây nào.</p>
          ) : (
            plants?.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-3">
                  {editingIndexId === p.id ? (
                    <Input
                      type="number"
                      autoFocus
                      className="w-14 h-8 text-center px-1 py-0 rounded-md border-emerald-500 bg-white dark:bg-neutral-800"
                      value={editIndexValue}
                      onChange={(e) => setEditIndexValue(e.target.value)}
                      onBlur={() => handleSaveIndex(p.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveIndex(p.id)}
                    />
                  ) : (
                    <div 
                      className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center font-black text-emerald-700 dark:text-emerald-400 text-sm cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                      onClick={() => {
                        setEditingIndexId(p.id);
                        setEditIndexValue(p.plantIndex?.toString() || "");
                      }}
                      title="Bấm để sửa số thứ tự"
                    >
                      {p.plantIndex != null ? p.plantIndex : "-"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">{p.species}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{p.health} · Ngày trồng: {new Date(p.plantedAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                {/* Could add a delete/edit button here if needed in the future */}
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-neutral-400" asChild>
                  <Link href={`/plants`}><Edit3 className="h-3 w-3" /></Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* Modal Component */
function AddZoneModal({
  farms,
  onClose,
  onSave,
  isPending,
}: {
  farms: any[];
  onClose: () => void;
  onSave: (dto: any) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [vietgapCode, setVietgapCode] = useState("");
  const [farmId, setFarmId] = useState("");

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
            <Plus className="h-5 w-5 text-emerald-500" /> Thêm khu vực mới
          </h2>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Tên khu vực *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Khu Đông" className="rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Mô tả / Địa chỉ</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Chi tiết vị trí..." className="rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Mã chứng nhận VietGAP (Tùy chọn)</label>
            <Input value={vietgapCode} onChange={(e) => setVietgapCode(e.target.value)} placeholder="VD: VietGAP-123..." className="rounded-xl" />
          </div>

          {farms.length > 1 && (
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Trang trại *</label>
              <select
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Chọn trang trại</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            className="rounded-xl flex-1 gap-1"
            disabled={!name || (farms.length > 1 && !farmId) || isPending}
            onClick={() => onSave({ name, description, vietgapCode, farmId: farmId || undefined })}
          >
            <Check className="h-3 w-3" /> Lưu khu vực
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Hủy</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
