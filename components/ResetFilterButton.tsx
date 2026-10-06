"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

interface ResetFilterButtonProps {
  className?: string;
}

export default function ResetFilterButton({ className = "" }: ResetFilterButtonProps) {
  const router = useRouter();

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    // 1. Reset client-side select and input fields in the parent form
    const form = (e.currentTarget as HTMLElement).closest("form");
    if (form) {
      form.reset();
      // Explicitly reset select elements to first option if needed
      const selects = form.querySelectorAll("select");
      selects.forEach((s) => {
        s.selectedIndex = 0;
      });
    }
    // 2. Navigate to clean /properties URL without query params
    router.push("/properties");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className={`flex-1 sm:flex-initial inline-flex items-center justify-center px-5 py-2.5 border border-[#E8E1D4] bg-[#FCFBF7] hover:bg-[#F7F3EA] text-[#07111F] hover:text-[#A97918] rounded-xl text-xs font-bold h-11 transition-all gap-2 cursor-pointer shadow-2xs hover:border-[#C89B3C]/50 ${className}`}
      title="Reset all search filters"
    >
      <RotateCcw className="h-3.5 w-3.5 text-[#A97918]" />
      <span>Reset</span>
    </button>
  );
}
