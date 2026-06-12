"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  ChevronRight,
  Flashlight,
  Keyboard,
  QrCode,
  RotateCcw,
  Scan,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualId, setManualId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = useCallback(async () => {
    if (scannerRef.current || !containerRef.current) return;

    try {
      const html5Qr = new Html5Qrcode("qr-reader");
      scannerRef.current = html5Qr;
      setCameraError(null);
      setScanning(true);

      await html5Qr.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Check if it's a raw ID (like cl...) or a URL
          let targetPath = "";
          let targetToken = "";

          try {
            // First try to parse as JSON in case it's a legacy payload
            const parsed = JSON.parse(decodedText);
            if (parsed.plantId) {
              targetPath = parsed.plantId;
              targetToken = parsed.token || "demo-public-token-secure";
            }
          } catch (e) {
            // Not JSON, try URL
            try {
              const url = new URL(decodedText);
              const pathMatch = url.pathname.match(/\/p\/(.+)/);
              const token = url.searchParams.get("t");
              if (pathMatch) {
                targetPath = pathMatch[1];
                targetToken = token || "demo-public-token-secure";
              } else if (url.pathname.includes("/p/")) {
                 targetPath = url.pathname.split("/p/")[1];
                 targetToken = token || "demo-public-token-secure";
              }
            } catch {
              // Not a URL. If it looks like a cuid or simple string without spaces, treat it as ID
              if (decodedText && !decodedText.includes(" ") && !decodedText.includes("{")) {
                targetPath = decodedText;
                targetToken = "demo-public-token-secure";
              }
            }
          }

          if (targetPath) {
            setLastScanned(decodedText);
            html5Qr.stop().catch(() => {});
            scannerRef.current = null;
            setScanning(false);
            router.push(`/p/${targetPath}?t=${encodeURIComponent(targetToken)}`);
          } else {
            setLastScanned(decodedText);
            alert("Mã QR không hợp lệ: " + decodedText);
          }
        },
        () => {
          // Ignore scan failures (no QR in view)
        }
      );
    } catch (err: any) {
      setCameraError(
        err?.message?.includes("Permission")
          ? "Vui lòng cho phép truy cập camera để quét mã QR"
          : "Không thể mở camera. Hãy thử trình duyệt Chrome hoặc Safari."
      );
      setScanning(false);
    }
  }, [router]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (mode === "camera") {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => startScanner(), 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [mode, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleManualSubmit = () => {
    if (!manualId) return;
    const token = manualToken || "demo-public-token-secure";
    router.push(`/p/${manualId}?t=${encodeURIComponent(token)}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-5 pt-6 pb-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Trang chủ
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/20">
            <QrCode className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-white">Scanner</span>
        </div>
      </header>

      {/* Mode Tabs */}
      <div className="relative z-20 flex gap-1 mx-5 p-1 bg-white/[0.06] rounded-xl mb-6">
        <button
          onClick={() => setMode("camera")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            mode === "camera"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          <Camera className="h-4 w-4" />
          Camera
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            mode === "manual"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          <Keyboard className="h-4 w-4" />
          Nhập thủ công
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "camera" ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 px-5"
          >
            {/* Camera viewfinder */}
            <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-black border-2 border-white/10">
              {/* QR Reader container */}
              <div
                id="qr-reader"
                ref={containerRef}
                className="w-full h-full"
                style={{ minHeight: "300px" }}
              />

              {/* Scanning overlay frame */}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {/* Corner decorations */}
                  <div className="absolute top-8 left-8 w-12 h-12 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" style={{ borderWidth: "3px 0 0 3px" }} />
                  <div className="absolute top-8 right-8 w-12 h-12 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" style={{ borderWidth: "3px 3px 0 0" }} />
                  <div className="absolute bottom-8 left-8 w-12 h-12 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" style={{ borderWidth: "0 0 3px 3px" }} />
                  <div className="absolute bottom-8 right-8 w-12 h-12 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" style={{ borderWidth: "0 3px 3px 0" }} />

                  {/* Scanning line animation */}
                  <motion.div
                    className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                    animate={{ top: ["15%", "85%", "15%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              )}

              {/* Camera error overlay */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center z-20">
                  <CameraOff className="h-12 w-12 text-red-400 mb-4" />
                  <p className="text-sm text-white/80 font-medium mb-4">{cameraError}</p>
                  <button
                    onClick={() => {
                      setCameraError(null);
                      startScanner();
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Thử lại
                  </button>
                </div>
              )}
            </div>

            {/* Status text */}
            <div className="text-center mt-6">
              {scanning ? (
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <p className="text-sm font-bold text-white/60">Đang quét... Hướng camera vào mã QR</p>
                </div>
              ) : !cameraError ? (
                <p className="text-sm text-white/40">Đang khởi động camera...</p>
              ) : null}
            </div>

            {/* Instructions */}
            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3 p-4 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
                <Smartphone className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white/80">Quét bằng Zalo / Camera</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Mở Zalo → Quét QR, hoặc dùng camera điện thoại trực tiếp. Mã QR sẽ dẫn thẳng trang thông tin cây.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
                <Scan className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white/80">Quét trực tiếp trên web</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Cho phép truy cập camera khi được hỏi. Đưa mã QR vào khung hình vuông để quét tự động.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 px-5"
          >
            <div className="max-w-sm mx-auto space-y-6">
              <div className="text-center mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto mb-4">
                  <Keyboard className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-black text-white">Nhập thủ công</h2>
                <p className="text-sm text-white/40 mt-1">Nhập Plant ID và Token từ mã QR</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Plant ID</label>
                  <div className="relative">
                    <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      placeholder="clxxxxxxxxxxxxxxxxx"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-wider">QR Token</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="token từ QR code"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleManualSubmit}
                  disabled={!manualId}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Xem thông tin cây
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom safe area spacer for mobile */}
      <div className="h-24" />

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-5 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent">
        <div className="flex gap-3 max-w-sm mx-auto">
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            Đăng nhập
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
