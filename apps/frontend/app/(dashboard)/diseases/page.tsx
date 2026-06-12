"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Bug,
  Calendar,
  Check,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Sprout,
  Trash2,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type DiseaseRecord = {
  id: string;
  name: string;
  severity: number;
  detectedAt: string;
  resolvedAt: string | null;
  notes: string | null;
  plant: { id: string; species: string; zone: { name: string } };
};

const severityLevels = [
  { value: 1, label: "Nhẹ", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { value: 2, label: "Trung bình", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: 3, label: "Nặng", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: 4, label: "Nghiêm trọng", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  { value: 5, label: "Nguy hiểm", color: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200" },
];

// Bệnh phổ biến trên sầu riêng để gợi ý khi thêm mới
const commonDiseases = [
  "Phytophthora (thối rễ)",
  "Nấm hồng (Corticium)",
  "Cháy lá (Rhizoctonia)",
  "Thán thư (Anthracnose)",
  "Đốm rong tảo",
  "Sâu đục trái",
  "Rệp sáp",
  "Xì mủ thân",
];

export default function DiseasesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formPlantId, setFormPlantId] = useState("");
  const [formName, setFormName] = useState("");
  const [formSeverity, setFormSeverity] = useState(2);
  const [formNotes, setFormNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["diseases"],
    queryFn: async () => {
      const { data: d } = await api.get<DiseaseRecord[]>("/diseases");
      return d;
    },
  });

  const createDisease = useMutation({
    mutationFn: async (dto: { plantId: string; name: string; severity: number; notes?: string }) => {
      await api.post("/diseases", dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diseases"] });
      resetForm();
    },
  });

  const updateDisease = useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; severity?: number; notes?: string; resolved?: boolean }) => {
      await api.patch(`/diseases/${id}`, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diseases"] });
      setEditingId(null);
    },
  });

  const deleteDisease = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/diseases/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diseases"] }),
  });

  const resetForm = () => {
    setShowAddForm(false);
    setFormPlantId("");
    setFormName("");
    setFormSeverity(2);
    setFormNotes("");
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.plant.species.toLowerCase().includes(q) ||
        d.plant.zone.name.toLowerCase().includes(q)
    );
  }, [data, search]);

  const activeCount = data?.filter((d) => !d.resolvedAt).length ?? 0;
  const resolvedCount = data?.filter((d) => d.resolvedAt).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Trung tâm Dịch bệnh</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Thêm, sửa, xóa và theo dõi dịch bệnh trên cây sầu riêng
          </p>
        </div>
        <Button className="rounded-2xl gap-2" variant="destructive" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4" />
          Báo cáo dịch bệnh mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-2xl p-4 bg-gradient-to-br from-red-500/10 to-red-600/5">
          <p className="text-xs font-medium text-neutral-500">Đang hoạt động</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{activeCount}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <p className="text-xs font-medium text-neutral-500">Đã chữa khỏi</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{resolvedCount}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <p className="text-xs font-medium text-neutral-500">Tổng ghi nhận</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{data?.length ?? 0}</p>
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="glass-panel rounded-2xl p-6 border-2 border-dashed border-red-300 dark:border-red-800">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <Bug className="h-5 w-5 text-red-500" />
                Báo cáo dịch bệnh mới
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Mã cây (Plant ID) *</label>
                  <Input value={formPlantId} onChange={(e) => setFormPlantId(e.target.value)} placeholder="Dán mã cây bị bệnh vào đây" className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Tên bệnh *</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Phytophthora, Nấm hồng..." className="rounded-xl" list="disease-suggestions" />
                  <datalist id="disease-suggestions">
                    {commonDiseases.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-2 block">Mức độ nghiêm trọng *</label>
                  <div className="flex gap-2 flex-wrap">
                    {severityLevels.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setFormSeverity(s.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${formSeverity === s.value ? s.color + " ring-2 ring-offset-1 ring-current" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"}`}
                      >
                        {s.value}. {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Ghi chú</label>
                  <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Mô tả thêm triệu chứng..." className="rounded-xl" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  className="rounded-xl gap-1"
                  disabled={!formPlantId || !formName || createDisease.isPending}
                  onClick={() => createDisease.mutate({ plantId: formPlantId, name: formName, severity: formSeverity, notes: formNotes || undefined })}
                >
                  <Check className="h-3 w-3" />
                  Lưu báo cáo
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={resetForm}>
                  <X className="h-3 w-3" />
                  Hủy
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Tìm theo tên bệnh, giống cây, khu vực..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-2xl bg-white/80 dark:bg-neutral-900/50 backdrop-blur-sm"
        />
      </div>

      {/* Disease Records List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((d, i) => {
            const sev = severityLevels.find((s) => s.value === d.severity) || severityLevels[1];
            const isEditing = editingId === d.id;

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: i * 0.03 }}
                layout
              >
                <div className={`glass-panel rounded-2xl p-5 transition-all duration-200 hover:shadow-md ${d.resolvedAt ? "opacity-60" : ""}`}>
                  {isEditing ? (
                    /* Edit Mode */
                    <EditDiseaseForm
                      record={d}
                      severityLevels={severityLevels}
                      onSave={(dto) => updateDisease.mutate({ id: d.id, ...dto })}
                      onCancel={() => setEditingId(null)}
                      isPending={updateDisease.isPending}
                    />
                  ) : (
                    /* View Mode */
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                        <Bug className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">{d.name}</h3>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sev.color}`}>
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Mức {d.severity}: {sev.label}
                          </span>
                          {d.resolvedAt && (
                            <Badge variant="default" className="text-[10px] gap-1 bg-emerald-500">
                              <CheckCircle2 className="h-3 w-3" />
                              Đã chữa khỏi
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-neutral-500 mb-1">
                          <span className="flex items-center gap-1">
                            <Sprout className="h-3 w-3" />
                            {d.plant.species}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {d.plant.zone.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(d.detectedAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>

                        {d.notes && (
                          <p className="text-xs text-neutral-500 mt-1 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg px-3 py-2">{d.notes}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!d.resolvedAt && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-8 w-8"
                            title="Đánh dấu đã chữa khỏi"
                            onClick={() => updateDisease.mutate({ id: d.id, resolved: true })}
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-8 w-8"
                          onClick={() => setEditingId(d.id)}
                        >
                          <Edit3 className="h-4 w-4 text-neutral-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-8 w-8"
                          onClick={() => { if (confirm("Bạn có chắc muốn xóa bản ghi này?")) deleteDisease.mutate(d.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldAlert className="h-16 w-16 text-emerald-300/50 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
            {search ? "Không tìm thấy kết quả" : "Chưa có bản ghi dịch bệnh nào"}
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            {search ? "Thử thay đổi từ khóa tìm kiếm" : "Vườn sầu riêng đang rất khỏe mạnh! 🌿"}
          </p>
        </div>
      )}
    </div>
  );
}

/* Inline Edit Component */
function EditDiseaseForm({
  record,
  severityLevels: levels,
  onSave,
  onCancel,
  isPending,
}: {
  record: DiseaseRecord;
  severityLevels: { value: number; label: string; color: string }[];
  onSave: (dto: { name: string; severity: number; notes?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(record.name);
  const [severity, setSeverity] = useState(record.severity);
  const [notes, setNotes] = useState(record.notes || "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1 block">Tên bệnh</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" list="disease-suggestions-edit" />
          <datalist id="disease-suggestions-edit">
            {commonDiseases.map((d) => <option key={d} value={d} />)}
          </datalist>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1 block">Ghi chú</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-500 mb-2 block">Mức độ nghiêm trọng</label>
        <div className="flex gap-2 flex-wrap">
          {levels.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSeverity(s.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${severity === s.value ? s.color + " ring-2 ring-offset-1 ring-current" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"}`}
            >
              {s.value}. {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="rounded-xl gap-1" disabled={isPending} onClick={() => onSave({ name, severity, notes: notes || undefined })}>
          <Check className="h-3 w-3" /> Lưu
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={onCancel}>
          <X className="h-3 w-3" /> Hủy
        </Button>
      </div>
    </div>
  );
}
