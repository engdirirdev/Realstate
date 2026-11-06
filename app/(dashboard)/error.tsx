"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, RotateCcw, AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Manager Dashboard Error]", error);
  }, [error]);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="rounded-3xl border border-destructive/20 bg-card p-8 md:p-10 shadow-lg text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive mx-auto flex items-center justify-center mb-5">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Dashboard Operation Interrupted
        </h2>
        <p className="text-[#C89B3C] dark:text-[#D9B45B] text-sm font-medium mb-3">
          Khalad ayaa ka dhacay maamulka hawlaha dashboard-ka
        </p>

        <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6">
          The requested management view could not be rendered due to a data or network issue. Unsaved changes may need to be re-entered.
        </p>

        {error.digest && (
          <div className="inline-block px-3 py-1 rounded-md bg-muted text-xs font-mono text-muted-foreground mb-6">
            Trace Token: <span className="text-foreground font-semibold">{error.digest}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Operation (Dib u Bilow)</span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Hard Refresh</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
