"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";

function RedirectHandler() {
  const sp = useSearchParams();
  const router = useRouter();
  const treeId = sp.get("treeId");

  useEffect(() => {
    if (treeId) {
      // Redirect to the new plant page — no token needed (legacy support)
      router.replace(`/p/${treeId}`);
    }
  }, [treeId, router]);

  if (!treeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa]">
        <div className="text-center p-8">
          <p className="text-neutral-500 text-sm">Không tìm thấy mã cây. Vui lòng quét lại QR.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f7fa]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
      <p className="text-sm text-emerald-700 font-medium">Đang chuyển hướng...</p>
    </div>
  );
}

export default function PublicHtmlPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f7fa]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-sm text-emerald-700 font-medium">Đang tải...</p>
        </div>
      }
    >
      <RedirectHandler />
    </Suspense>
  );
}
