"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Leaf,
  Loader2,
  Printer,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import * as XLSX from "xlsx";

const reportTypes = [
  {
    title: "Báo cáo Chấm công & Lương",
    description: "Xuất toàn bộ lịch sử chấm công, giờ làm, tiền lương, trạng thái thanh toán của từng nhân viên.",
    icon: FileSpreadsheet,
    type: "attendance",
    filename: "BaoCaoChamCong.xlsx",
    color: "from-emerald-500/10 to-emerald-600/5",
    available: true,
  },
  {
    title: "Báo cáo Danh sách Cây trồng",
    description: "Xuất danh sách toàn bộ cây sầu riêng theo khu vực, giống, tình trạng sức khỏe và ngày trồng.",
    icon: Leaf,
    type: "plants",
    filename: "DanhSachCayTrong.xlsx",
    color: "from-blue-500/10 to-blue-600/5",
    available: true,
  },
  {
    title: "Báo cáo Thu hoạch & Sản lượng",
    description: "Thống kê sản lượng thu hoạch theo mùa vụ, so sánh năng suất giữa các khu vực và dự báo sản lượng.",
    icon: TrendingUp,
    format: ["PDF", "Excel"],
    color: "from-amber-500/10 to-amber-600/5",
    available: false,
  },
  {
    title: "Báo cáo Chi phí & Lợi nhuận",
    description: "Tổng hợp chi phí nhân công, phân bón, thuốc BVTV, so sánh với doanh thu để tính lợi nhuận ròng.",
    icon: BarChart3,
    color: "from-purple-500/10 to-purple-600/5",
    available: false,
  },
  {
    title: "Báo cáo Dịch bệnh",
    description: "Tổng hợp các ca dịch bệnh đã phát hiện, phương pháp điều trị đã áp dụng, và kết quả.",
    icon: FileText,
    color: "from-red-500/10 to-red-600/5",
    available: false,
  },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const handleDownload = async (type: string, filename: string) => {
    try {
      setDownloading(type);
      let data = [];
      if (type === 'attendance') {
        const res = await api.get("/attendance/history");
        data = res.data.map((h: any) => ({
           "Nhân sự": `${h.user.firstName} ${h.user.lastName}`,
           "Email": h.user.email,
           "Ngày": new Date(h.checkedIn).toLocaleDateString("vi-VN"),
           "Giờ vào": new Date(h.checkedIn).toLocaleTimeString("vi-VN"),
           "Giờ ra": h.checkedOut ? new Date(h.checkedOut).toLocaleTimeString("vi-VN") : "Đang làm việc",
           "Công việc": h.jobCategory?.name || "Mặc định",
           "Tổng giờ": h.workHours ? Number(h.workHours.toFixed(2)) : 0,
           "Lương (VND)": h.calculatedSalary || 0,
           "Thanh toán": h.isPaid ? "Đã trả" : "Chưa trả"
        }));
      } else if (type === 'plants') {
        const res = await api.get("/plants/admin");
        data = res.data.plants.map((p: any) => ({
           "Mã QR": p.id,
           "Tên cây": p.species,
           "Sức khỏe": p.health,
           "Khu vực": p.zone.name,
           "Ngày trồng": new Date(p.plantedAt).toLocaleDateString("vi-VN"),
           "Tuổi (ngày)": p.ageDays,
           "Ghi chú": p.statusNote || ""
        }));
      }
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, filename);

      setSuccessMsg(`Đã tải xuống ${filename}`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success toast */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-bold">{successMsg}</span>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Báo cáo & Xuất dữ liệu</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tạo và tải xuống các báo cáo tổng hợp về hoạt động trang trại
          </p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportTypes.map((report, i) => {
          const Icon = report.icon;
          const isDownloading = downloading === report.endpoint;
          return (
            <motion.div
              key={report.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`glass-panel rounded-2xl p-6 bg-gradient-to-br ${report.color} hover:shadow-lg transition-all duration-300 group h-full flex flex-col`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">{report.title}</h3>
                    {!report.available && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                        Sắp ra mắt
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed mb-4 flex-1">{report.description}</p>

                {report.available && report.type ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl text-xs h-9 gap-1.5 w-full bg-white dark:bg-neutral-800"
                    disabled={isDownloading}
                    onClick={() => handleDownload(report.type!, report.filename!)}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {isDownloading ? "Đang xử lý..." : "Tải xuống Excel"}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl text-xs h-9 gap-1 w-full opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Download className="h-3 w-3" />
                    Đang phát triển
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
