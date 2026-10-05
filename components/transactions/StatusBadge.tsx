"use client";

import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAYMENT_PENDING: "bg-orange-50 text-orange-700 border-orange-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  ACTIVE: "bg-teal-50 text-teal-700 border-teal-200",
  EXPIRED: "bg-slate-100 text-slate-600 border-slate-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
};

const LABELS: Record<string, string> = {
  PAYMENT_PENDING: "Approved · Awaiting Payment",
  UNDER_REVIEW: "Under Review",
};

export default function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return <span className="text-[#6B7280] text-xs">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide whitespace-nowrap",
        STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200",
        className
      )}
    >
      {LABELS[status] || status.replace(/_/g, " ")}
    </span>
  );
}
