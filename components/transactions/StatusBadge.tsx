"use client";

import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  Eye,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface StatusBadgeProps {
  status?: string | null;
  className?: string;
  showIcon?: boolean;
}

export default function StatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  if (!status) return <span className="text-[#64748B] text-xs font-medium">—</span>;

  const s = status.toUpperCase().trim();

  let label = s.replace(/_/g, " ");
  let icon = <Clock className="h-3 w-3 shrink-0" />;
  let colorClass = "bg-amber-500/10 text-amber-950 border-amber-600/30";

  switch (s) {
    case "PENDING":
      label = "Pending";
      icon = <Clock className="h-3 w-3 shrink-0 text-amber-700" />;
      colorClass = "bg-amber-500/15 text-amber-950 border-amber-500/40";
      break;
    case "UNDER_REVIEW":
      label = "Under Review";
      icon = <Eye className="h-3 w-3 shrink-0 text-sky-700" />;
      colorClass = "bg-sky-500/15 text-sky-950 border-sky-500/40";
      break;
    case "APPROVED":
      label = "Approved";
      icon = <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-700" />;
      colorClass = "bg-emerald-500/15 text-emerald-950 border-emerald-500/40";
      break;
    case "PAYMENT_PENDING":
      label = "Awaiting Payment";
      icon = <CreditCard className="h-3 w-3 shrink-0 text-amber-700" />;
      colorClass = "bg-amber-500/15 text-amber-950 border-amber-500/40";
      break;
    case "PAID":
      label = "Paid";
      icon = <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-700" />;
      colorClass = "bg-emerald-500/15 text-emerald-950 border-emerald-500/40";
      break;
    case "COMPLETED":
      label = "Completed";
      icon = <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-700" />;
      colorClass = "bg-emerald-500/15 text-emerald-950 border-emerald-500/40";
      break;
    case "CONFIRMED":
      label = "Confirmed";
      icon = <ShieldCheck className="h-3 w-3 shrink-0 text-[#E8B849]" />;
      colorClass = "bg-[#07111F] text-[#E8B849] border-[#C89B3C]/50";
      break;
    case "ACTIVE":
      label = "Active Lease";
      icon = <Sparkles className="h-3 w-3 shrink-0 text-teal-700" />;
      colorClass = "bg-teal-500/15 text-teal-950 border-teal-500/40";
      break;
    case "EXPIRED":
      label = "Expired";
      icon = <Clock className="h-3 w-3 shrink-0 text-slate-600" />;
      colorClass = "bg-slate-500/10 text-slate-800 border-slate-300";
      break;
    case "REJECTED":
      label = "Rejected";
      icon = <XCircle className="h-3 w-3 shrink-0 text-rose-700" />;
      colorClass = "bg-rose-500/15 text-rose-950 border-rose-500/40";
      break;
    case "CANCELLED":
      label = "Cancelled";
      icon = <XCircle className="h-3 w-3 shrink-0 text-slate-600" />;
      colorClass = "bg-slate-500/10 text-slate-800 border-slate-300";
      break;
    case "FAILED":
      label = "Failed";
      icon = <AlertCircle className="h-3 w-3 shrink-0 text-rose-700" />;
      colorClass = "bg-rose-500/15 text-rose-950 border-rose-500/40";
      break;
    case "REFUNDED":
      label = "Refunded";
      icon = <RefreshCw className="h-3 w-3 shrink-0 text-purple-700" />;
      colorClass = "bg-purple-500/15 text-purple-950 border-purple-500/40";
      break;
    case "PROCESSING":
      label = "Processing";
      icon = <RefreshCw className="h-3 w-3 shrink-0 text-sky-700 animate-spin" />;
      colorClass = "bg-sky-500/15 text-sky-950 border-sky-500/40";
      break;
    default:
      label = s.replace(/_/g, " ");
      icon = <Clock className="h-3 w-3 shrink-0 text-slate-600" />;
      colorClass = "bg-slate-500/10 text-slate-800 border-slate-300";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-tight whitespace-nowrap shadow-2xs transition-all",
        colorClass,
        className
      )}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
}
