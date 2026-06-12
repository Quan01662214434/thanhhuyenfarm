"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { setAuthToken } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    setAuthToken(accessToken);
  }, [ready, accessToken, router]);

  if (!ready || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-emerald-500/30" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
