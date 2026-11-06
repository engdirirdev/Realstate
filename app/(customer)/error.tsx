"use client";

import { useEffect } from "react";
import Link from "next/link";
import { UserCheck, RotateCcw, Calendar, Home } from "lucide-react";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Customer Portal Error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center p-8 rounded-3xl bg-card border border-border shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-[#C89B3C]/10 border border-[#C89B3C]/20 text-[#C89B3C] dark:text-[#D9B45B] mx-auto flex items-center justify-center mb-5">
          <UserCheck className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Customer Portal Error
        </h2>
        <p className="text-[#C89B3C] dark:text-[#D9B45B] text-sm font-medium mb-3">
          Waxaa dhacday cilad ku timid macluumaadka akoonkaada
        </p>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          We could not load your rental or booking details. Your reservations and saved inquiries are safe in our database.
        </p>

        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground/80 mb-6">
            Reference code: <span className="text-[#C89B3C] dark:text-[#D9B45B] font-semibold">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again (Dib u celi)</span>
          </button>

          <Link
            href="/my-bookings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium text-sm transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>My Bookings</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
