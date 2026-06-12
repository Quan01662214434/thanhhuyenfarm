"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  severity: string;
  createdAt: string;
  readAt: string | null;
};

const severityConfig: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  INFO: { icon: Info, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Thông tin" },
  WARNING: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30", label: "Cảnh báo" },
  DANGER: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", label: "Nguy hiểm" },
  SUCCESS: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30", label: "Thành công" },
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: d } = await api.get<Notif[]>("/notifications");
      return d;
    },
  });

  const filtered = data?.filter((n) => filter === "all" || !n.readAt) ?? [];
  const unreadCount = data?.filter((n) => !n.readAt).length ?? 0;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Thông báo
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Cảnh báo dịch bệnh, nhắc nhở công việc và cập nhật hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-2xl text-xs"
            onClick={() => setFilter("all")}
          >
            Tất cả
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            className="rounded-2xl text-xs"
            onClick={() => setFilter("unread")}
          >
            Chưa đọc ({unreadCount})
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/30"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((n, i) => {
            const cfg = severityConfig[n.severity] || severityConfig.INFO;
            const Icon = cfg.icon;
            const timeAgo = getTimeAgo(n.createdAt);

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !n.readAt && markRead.mutate(n.id)}
                className={!n.readAt ? "cursor-pointer" : ""}
              >
                <div className={`glass-panel rounded-2xl p-5 transition-all duration-200 hover:shadow-md ${n.readAt ? "opacity-60" : "border-l-4 border-l-emerald-500"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                      <Icon className={`h-5 w-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-semibold text-sm ${n.readAt ? "text-neutral-500" : "text-neutral-900 dark:text-white"}`}>
                          {n.title}
                        </h3>
                        <Badge variant="muted" className="text-[10px]">{cfg.label}</Badge>
                        {!n.readAt && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      {n.body && (
                        <p className="text-xs text-neutral-500 leading-relaxed mb-2">{n.body}</p>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <Clock className="h-3 w-3" />
                        {timeAgo}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BellOff className="h-16 w-16 text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
            {filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}
          </h3>
          <p className="text-sm text-neutral-500 mt-1">Mọi thứ đang ổn, vườn sầu riêng đang khỏe mạnh! 🌿</p>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}
