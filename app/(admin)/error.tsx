"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RotateCcw, Shield, Activity } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Governance Error]", error);
  }, [error]);

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto">
      <div className="rounded-3xl border border-red-500/20 bg-card p-8 md:p-10 shadow-xl text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mx-auto flex items-center justify-center mb-5">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Admin Console Error
        </h2>
        <p className="text-[#C89B3C] dark:text-[#D9B45B] text-sm font-medium mb-3">
          Cilad ayaa ku timid qeybta maamulka sare (Admin Console)
        </p>

        <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6">
          An error prevented this administrative module from loading. Security policies and audit records remain intact.
        </p>

        {error.digest && (
          <div className="inline-block px-3 py-1 rounded-md bg-muted text-xs font-mono text-muted-foreground mb-6">
            Admin Error Digest: <span className="text-red-400 font-semibold">{error.digest}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Module (Dib u soo celi)</span>
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium text-sm transition-all"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Root</span>
          </Link>

          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
          >
            <Activity className="w-4 h-4" />
            <span>System Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
