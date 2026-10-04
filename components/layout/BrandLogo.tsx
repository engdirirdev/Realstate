import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "dark" | "light"; // dark = for dark sidebar/footer, light = for white header
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function BrandLogo({ variant = "light", className, size = "md" }: BrandLogoProps) {
  const isDark = variant === "dark";

  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 group", className)}>
      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1677FF] to-[#38BDF8] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
        {/* Stylized Roof & House SVG */}
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" strokeWidth="2.2" stroke="currentColor">
          <path d="M3 10.5L12 3l9 7.5v9.75a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20.25V10.5z" stroke="currentColor" fill="none" />
          <path d="M9 21v-6a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5v6" stroke="currentColor" fill="none" />
          <path d="M12 3l-8 6.5" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-extrabold tracking-tight font-sans",
            size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg",
            isDark ? "text-white" : "text-[#0F2747]"
          )}
        >
          SkyHome
        </span>
        <span
          className={cn(
            "text-[9px] font-semibold tracking-wider uppercase mt-0.5",
            isDark ? "text-[#38BDF8]" : "text-[#1677FF]"
          )}
        >
          Real Estate
        </span>
      </div>
    </Link>
  );
}
