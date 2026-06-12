"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  Loader2,
  Plus,
  Sprout,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  plantId: string | null;
  assigneeId: string;
  plant: { id: string; species: string } | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
};

const columns = [
  { key: "TODO", label: "Cần làm", icon: Circle, color: "text-neutral-500", bg: "bg-neutral-100 dark:bg-neutral-800/50" },
  { key: "IN_PROGRESS", label: "Đang thực hiện", icon: Loader2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { key: "DONE", label: "Hoàn thành", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
] as const;

export default function TasksKanbanPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data: d } = await api.get<Task[]>("/tasks");
      return d;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: d } = await api.get<any[]>("/users");
      return d;
    },
  });

  const { data: plants } = useQuery({
    queryKey: ["plants"],
    queryFn: async () => {
      const { data: d } = await api.get<any[]>("/plants");
      return d;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/tasks/${id}/status`, { status });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const createTask = useMutation({
    mutationFn: async (dto: any) => {
      await api.post("/tasks", dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setShowModal(false);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...dto }: any) => {
      await api.patch(`/tasks/${id}`, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setEditingTask(null);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const getNextStatus = (current: string) => {
    if (current === "TODO") return "IN_PROGRESS";
    if (current === "IN_PROGRESS") return "DONE";
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Bảng Công việc</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Quản lý và theo dõi tiến độ công việc tại trang trại
          </p>
        </div>
        <Button className="rounded-2xl gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Tạo công việc
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 flex-wrap">
        {columns.map((col) => {
          const count = tasks?.filter((t) => t.status === col.key).length ?? 0;
          const ColIcon = col.icon;
          return (
            <div key={col.key} className="flex items-center gap-2">
              <ColIcon className={`h-4 w-4 ${col.color}`} />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{col.label}</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const ColIcon = col.icon;
          const columnTasks = tasks?.filter((t) => t.status === col.key) ?? [];

          return (
            <div key={col.key} className="space-y-3">
              {/* Column Header */}
              <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 ${col.bg}`}>
                <ColIcon className={`h-4 w-4 ${col.color}`} />
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  {col.label}
                </span>
                <span className="ml-auto text-xs font-bold text-neutral-400 bg-white/60 dark:bg-black/20 rounded-full px-2 py-0.5">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <AnimatePresence mode="popLayout">
                {columnTasks.map((t, i) => {
                  const next = getNextStatus(t.status);
                  return (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div className="glass-panel rounded-2xl p-4 hover:shadow-md transition-all duration-200 group relative">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm text-neutral-900 dark:text-white pr-8">
                            {t.title}
                          </h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => setEditingTask(t)}
                            >
                              <Edit3 className="h-3.5 w-3.5 text-neutral-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => { if (confirm("Xóa công việc này?")) deleteTask.mutate(t.id); }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </div>
                        </div>

                        {t.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{t.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {t.plant && (
                            <Badge variant="muted" className="text-[10px] gap-1">
                              <Sprout className="h-3 w-3" />
                              {t.plant.species}
                            </Badge>
                          )}
                          {t.assignee && (
                            <Badge variant="muted" className="text-[10px] gap-1">
                              <User className="h-3 w-3" />
                              {t.assignee.firstName} {t.assignee.lastName}
                            </Badge>
                          )}
                          {t.dueAt && (
                            <Badge variant="muted" className="text-[10px] gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(t.dueAt).toLocaleDateString("vi-VN")}
                            </Badge>
                          )}
                        </div>

                        {/* Move to next status */}
                        {next && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full rounded-xl text-xs h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => updateStatus.mutate({ id: t.id, status: next })}
                          >
                            Chuyển sang {columns.find((c) => c.key === next)?.label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                  <ColIcon className={`h-8 w-8 ${col.color} opacity-30 mb-2`} />
                  <p className="text-xs text-neutral-400">Không có công việc</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showModal || editingTask) && (
          <TaskFormModal
            task={editingTask}
            users={users || []}
            plants={plants || []}
            onClose={() => { setShowModal(false); setEditingTask(null); }}
            onSave={(dto) => editingTask ? updateTask.mutate({ id: editingTask.id, ...dto }) : createTask.mutate(dto)}
            isPending={createTask.isPending || updateTask.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* Modal Component */
function TaskFormModal({
  task,
  users,
  plants,
  onClose,
  onSave,
  isPending,
}: {
  task: Task | null;
  users: any[];
  plants: any[];
  onClose: () => void;
  onSave: (dto: any) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || "");
  const [plantId, setPlantId] = useState(task?.plantId || "");
  const [dueAt, setDueAt] = useState(task?.dueAt ? task.dueAt.split("T")[0] : "");

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
            {task ? <Edit3 className="h-5 w-5 text-emerald-500" /> : <Plus className="h-5 w-5 text-emerald-500" />}
            {task ? "Chỉnh sửa công việc" : "Tạo công việc mới"}
          </h2>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Tiêu đề *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Bón phân khu A" className="rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chi tiết công việc..."
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Người thực hiện *</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Chọn nhân viên</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Hạn chót</label>
              <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Liên quan đến cây (Tùy chọn)</label>
            <select
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Không có</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>{p.species} ({p.id.slice(0, 8)})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            className="rounded-xl flex-1 gap-1"
            disabled={!title || !assigneeId || isPending}
            onClick={() => onSave({ title, description, assigneeId, plantId: plantId || null, dueAt: dueAt || null })}
          >
            <Check className="h-3 w-3" />
            {task ? "Lưu thay đổi" : "Tạo công việc"}
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Hủy</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
