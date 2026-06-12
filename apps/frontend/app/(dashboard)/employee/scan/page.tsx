"use client";

import { motion } from "framer-motion";
import { Camera, QrCode, Smartphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EmployeeScanPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center px-4 pb-24">
      {/* QR Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-2xl shadow-emerald-500/30">
            <QrCode className="h-14 w-14" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border-2 border-emerald-500">
            <Camera className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </motion.div>

      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Quét mã QR cây trồng</h1>
        <p className="text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed">
          Hướng camera vào mã QR trên cây để xem thông tin chi tiết, lịch sử chăm sóc và ghi nhận hoạt động.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <Button className="w-full rounded-2xl h-12 text-sm gap-2" asChild>
          <Link href="/scan">
            <Camera className="h-5 w-5" />
            Mở Camera quét QR
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-xs text-neutral-400">hoặc</span>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <Button variant="outline" className="w-full rounded-2xl h-12 text-sm gap-2" asChild>
          <Link href="/scan">
            <Smartphone className="h-5 w-5" />
            Nhập mã cây thủ công
          </Link>
        </Button>
      </div>

      <p className="text-[10px] text-neutral-400 max-w-xs">
        💡 Mẹo: Giữ điện thoại cách mã QR khoảng 15-20cm để quét nhanh hơn
      </p>
    </div>
  );
}
