"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Search, RotateCcw, Building2, PhoneCall } from "lucide-react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Public Portal Error]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center p-8 rounded-3xl bg-card border border-border shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-[#C89B3C]/10 border border-[#C89B3C]/20 text-[#C89B3C] dark:text-[#D9B45B] mx-auto flex items-center justify-center mb-5">
          <Building2 className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Unable to Load Properties
        </h2>
        <p className="text-[#C89B3C] dark:text-[#D9B45B] text-sm font-medium mb-3">
          Waxaa dhacday cilad kooban oo xogta guryaha la xiriirta
        </p>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          We experienced an issue retrieving the latest real estate listings. Please retry or browse our directory from the search page.
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
            href="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium text-sm transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Browse All Listings</span>
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground text-sm transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contact Agent</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
