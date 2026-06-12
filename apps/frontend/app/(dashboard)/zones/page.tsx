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
} from "lucide-react";
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
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

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
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      await api.patch(`/zones/${id}`, { name, description });
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

  const startEdit = (zone: Zone) => {
    setEditingId(zone.id);
    setEditName(zone.name);
    setEditDesc(zone.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
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
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="rounded-xl flex-1 gap-1"
                        onClick={() => updateZone.mutate({ id: zone.id, name: editName, description: editDesc })}
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
                    </div>

                    {/* Plant count */}
                    <div className="flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        <strong className="text-neutral-900 dark:text-white">{zone._count.plants.toLocaleString()}</strong> cây sầu riêng
                      </span>
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
      </AnimatePresence>
    </div>
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
            onClick={() => onSave({ name, description, farmId: farmId || undefined })}
          >
            <Check className="h-3 w-3" /> Lưu khu vực
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Hủy</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
