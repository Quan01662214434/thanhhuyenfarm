"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Sprout,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  plant: { species: string } | null;
};

export default function EmployeeTasksPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data: d } = await api.get<Task[]>("/tasks");
      return d;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/tasks/${id}/status`, { status });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const myTasks = data?.filter((t) => t.status !== "DONE") ?? [];
  const doneTasks = data?.filter((t) => t.status === "DONE") ?? [];

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Việc cần làm hôm nay</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {myTasks.length} việc chưa xong · {doneTasks.length} đã hoàn thành
        </p>
      </div>

      {/* Active Tasks */}
      <div className="space-y-3">
        {myTasks.map((t, i) => {
          const isInProgress = t.status === "IN_PROGRESS";
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="mt-0.5 shrink-0"
                    onClick={() => update.mutate({ id: t.id, status: "DONE" })}
                  >
                    {isInProgress ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : (
                      <Circle className="h-5 w-5 text-neutral-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">{t.title}</h3>
                    {t.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{t.description}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {t.plant && (
                        <Badge variant="muted" className="text-[10px] gap-1">
                          <Sprout className="h-3 w-3" /> {t.plant.species}
                        </Badge>
                      )}
                      {t.dueAt && (
                        <Badge variant="muted" className="text-[10px] gap-1">
                          <Clock className="h-3 w-3" /> {new Date(t.dueAt).toLocaleDateString("vi-VN")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!isInProgress && (
                    <Button size="sm" variant="outline" className="rounded-xl text-[10px] h-7 shrink-0" onClick={() => update.mutate({ id: t.id, status: "IN_PROGRESS" })}>
                      Bắt đầu
                    </Button>
                  )}
                  {isInProgress && (
                    <Button size="sm" className="rounded-xl text-[10px] h-7 shrink-0" onClick={() => update.mutate({ id: t.id, status: "DONE" })}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Xong
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty */}
      {!isLoading && myTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
          <p className="font-semibold text-neutral-700 dark:text-neutral-300">Đã xong hết! 🎉</p>
          <p className="text-xs text-neutral-500 mt-1">Không còn việc nào cần làm</p>
        </div>
      )}

      {/* Done tasks */}
      {doneTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Đã hoàn thành ({doneTasks.length})</p>
          <div className="space-y-2">
            {doneTasks.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-3 opacity-50 bg-white dark:bg-neutral-900 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs text-neutral-500 line-through">{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to full board */}
      <Button variant="outline" className="w-full rounded-2xl gap-2" asChild>
        <Link href="/tasks">
          Xem bảng công việc đầy đủ <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
