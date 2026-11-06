"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log fatal client error
    console.error("[Fatal Global Error]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07111F] text-slate-100 flex items-center justify-center p-4 antialiased font-sans selection:bg-[#C89B3C] selection:text-[#07111F]">
        <div className="relative w-full max-w-xl p-8 rounded-3xl bg-slate-900/90 border border-red-500/20 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#C89B3C]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-[#C89B3C]/20 border border-red-500/30 flex items-center justify-center text-red-400 mb-6 shadow-inner">
              <AlertOctagon className="w-8 h-8 animate-pulse" />
            </div>

            {/* Bilingual Header */}
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              Critical System Interruption
            </h1>
            <p className="text-[#D9B45B] text-sm font-medium mb-3">
              Cilad weyn oo lama filaan ah ayaa ku timid nidaamka
            </p>

            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
              A critical error prevented the application from rendering. You can attempt to restart the session or return to the main dashboard.
            </p>

            {/* Error Reference Code */}
            {error.digest && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400 mb-6 font-mono">
                <span className="text-slate-500">Error Ref:</span>
                <span className="text-[#D9B45B] font-semibold">{error.digest}</span>
              </div>
            )}

            {/* Recovery Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <button
                onClick={() => reset()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] hover:brightness-110 text-[#07111F] font-semibold shadow-lg shadow-[#C89B3C]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try to Recover (Isku Day Mar Kale)</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Reload to Home</span>
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
