"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  History,
  Info,
  Laptop,
  Shield,
  User,
  Wrench
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type ActivityLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: any;
  createdAt: string;
  actor: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
};

const actionLabels: Record<string, { label: string, color: string }> = {
  "MARK_AS_PAID": { label: "Thanh toán lương", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
  "UPDATE_ATTENDANCE": { label: "Sửa chấm công", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
};

const getActionDisplay = (action: string) => {
  return actionLabels[action] || { label: action, color: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800" };
};

export default function ActivityLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data } = await api.get<ActivityLog[]>("/analytics/activity-logs");
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl mt-1" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-amber-500" />
              Lịch sử thao tác (Audit Logs)
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Giám sát các thao tác nhạy cảm của Quản lý và Nhân viên trên hệ thống
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50/50 dark:bg-neutral-950/50 text-xs uppercase font-semibold text-neutral-500">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Đối tượng bị ảnh hưởng</th>
                <th className="px-6 py-4">Chi tiết thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {logs?.map((log) => {
                const actionDisplay = getActionDisplay(log.action);
                return (
                  <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(log.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(log.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.actor ? (
                          <>
                            {log.actor.role === "OWNER" ? <Shield className="h-4 w-4 text-amber-500" /> : <Wrench className="h-4 w-4 text-blue-500" />}
                            <span className="font-bold text-neutral-900 dark:text-white">
                              {log.actor.firstName} {log.actor.lastName}
                            </span>
                          </>
                        ) : (
                          <>
                            <Laptop className="h-4 w-4 text-neutral-400" />
                            <span className="text-neutral-500 italic">Hệ thống</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${actionDisplay.color}`}>
                        {actionDisplay.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                      {log.entity} <br/> <span className="text-[10px] opacity-70">ID: {log.entityId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-mono bg-neutral-50 dark:bg-neutral-950 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {JSON.stringify(log.metadata)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && (!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    <History className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                    Chưa có lịch sử thao tác nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
