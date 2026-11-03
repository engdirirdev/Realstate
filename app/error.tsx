"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("[Root Error Boundary Caught]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl p-8 rounded-3xl bg-card/90 border border-border shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Ambient Gradient Highlights */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Warning Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 shadow-inner">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
          </div>

          {/* Bilingual Title */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1.5">
            Something Went Wrong
          </h1>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-3">
            Cilad ayaa dhacday inta howsha la guda-galayey
          </p>

          <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-md">
            We encountered an unexpected issue while loading this page. You can retry the action or return to the safe navigation menu.
          </p>

          {/* Reference Digest */}
          {error.digest && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground mb-6 font-mono">
              <span>Incident ID:</span>
              <span className="text-amber-500 font-semibold">{error.digest}</span>
            </div>
          )}

          {/* Action Recovery Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mb-6">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again (Isku Day)</span>
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Back Home</span>
            </Link>

            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground text-sm transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Support</span>
            </Link>
          </div>

          {/* Developer Diagnostics (Shown in dev mode or toggled) */}
          {isDev && (
            <div className="w-full text-left mt-2 border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-xs font-mono text-muted-foreground hover:text-foreground py-1"
              >
                <span>Diagnostic Information (Dev Mode)</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDetails && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 text-xs font-mono overflow-x-auto max-h-56">
                  <div className="text-red-400 font-semibold mb-1">{error.name}: {error.message}</div>
                  {error.stack && (
                    <pre className="text-[11px] text-slate-400 whitespace-pre-wrap leading-tight">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
