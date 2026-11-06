"use client";

import { useEffect, useState } from "react";
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
    <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#F7F3EA]">
      <div className="relative w-full max-w-xl p-8 rounded-3xl bg-[#FCFBF7] border border-[#E8E1D4] shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Ambient Gold Highlights */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-[#C89B3C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-[#07111F]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Warning Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-[#C89B3C]/10 border border-[#C89B3C]/30 flex items-center justify-center text-[#C89B3C] mb-6 shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>

          {/* Bilingual Title */}
          <h1 className="text-2xl font-bold font-serif tracking-tight text-[#07111F] mb-1.5">
            Something Went Wrong
          </h1>
          <p className="text-[#C89B3C] text-sm font-semibold mb-3">
            Cilad ayaa dhacday inta howsha la guda-galayey
          </p>

          <p className="text-[#6B7280] text-sm leading-relaxed mb-6 max-w-md">
            We encountered an unexpected issue while loading this page. You can retry the action or return to the safe navigation menu.
          </p>

          {/* Reference Digest */}
          {error.digest && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F7F3EA] border border-[#E8E1D4] text-xs text-[#6B7280] mb-6 font-mono">
              <span>Incident ID:</span>
              <span className="text-[#C89B3C] font-semibold">{error.digest}</span>
            </div>
          )}

          {/* Action Recovery Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center mb-6">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D9A336] via-[#E8B849] to-[#C99126] text-[#07111F] font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again (Isku Day)</span>
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#07111F] hover:bg-[#0B1728] text-white font-medium text-sm transition-all"
            >
              <Home className="w-4 h-4 text-[#D9B45B]" />
              <span>Back Home</span>
            </Link>

            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E1D4] hover:bg-[#F7F3EA] text-[#6B7280] hover:text-[#07111F] text-sm transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Support</span>
            </Link>
          </div>

          {/* Developer Diagnostics (Shown in dev mode or toggled) */}
          {isDev && (
            <div className="w-full text-left mt-2 border-t border-[#E8E1D4] pt-4">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-xs font-mono text-[#6B7280] hover:text-[#07111F] py-1"
              >
                <span>Diagnostic Information (Dev Mode)</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDetails && (
                <div className="mt-3 p-3 rounded-xl bg-[#07111F] text-[#F7F3EA] border border-[#C89B3C]/30 text-xs font-mono overflow-x-auto max-h-56">
                  <div className="text-red-400 font-semibold mb-1">{error.name}: {error.message}</div>
                  {error.stack && (
                    <pre className="text-[11px] text-[#E8E1D4]/80 whitespace-pre-wrap leading-tight">
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
