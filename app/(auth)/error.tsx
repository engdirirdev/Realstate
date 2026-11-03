"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Lock, RotateCcw, ArrowLeft } from "lucide-react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Auth Route Error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center p-8 rounded-3xl bg-card border border-border shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center mb-5">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Authentication Interrupted
        </h2>
        <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-3">
          Cilad ayaa ku timid furitaanka akoonkaada
        </p>
        <p className="text-muted-foreground text-sm mb-6">
          We encountered an issue during verification. Please try logging in again or reset your session.
        </p>

        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground/80 mb-6">
            Error ID: <span className="text-amber-500 font-semibold">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
