import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "dark" | "light"; // dark = for dark sidebar/footer, light = for white header
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function BrandLogo({
  variant = "light",
  className,
  size = "md",
}: BrandLogoProps) {
  const isDark = variant === "dark";

  const imgDimension = size === "sm" ? 34 : size === "lg" ? 48 : 40;

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-3 group", className)}
    >
      {/* Kiro-Maal Shield Logo Image */}
      <div
        className={cn(
          "relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
          size === "sm"
            ? "w-9 h-9"
            : size === "lg"
            ? "w-12 h-12"
            : "w-10 h-10",
          isDark
            ? "bg-[#07111F] border border-[#C89B3C]/30 shadow-md shadow-black/40"
            : "bg-[#FCFBF7] border border-[#E8E1D4] shadow-xs"
        )}
      >
        <Image
          src="/images/kiro_maal_logo.png"
          alt="Kiro-Maal Real Estate"
          width={imgDimension}
          height={imgDimension}
          className="object-contain p-0.5"
          priority
        />
      </div>

      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-extrabold tracking-tight font-serif",
            size === "sm"
              ? "text-base"
              : size === "lg"
              ? "text-xl"
              : "text-lg",
            isDark
              ? "text-[#D9B45B] group-hover:text-[#F3D78A]"
              : "text-[#07111F] group-hover:text-[#C89B3C]",
            "transition-colors"
          )}
        >
          Kiro-Maal
        </span>
        <span
          className={cn(
            "text-[9px] font-bold tracking-[0.16em] uppercase",
            isDark ? "text-slate-300" : "text-[#07111F]"
          )}
        >
          Real Estate
        </span>
      </div>
    </Link>
  );
}
