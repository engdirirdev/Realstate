"use client";

interface PropertyAvailabilityBadgeProps {
  status: string; // "APPROVED" | "CLOSED" | "PENDING" | "RESERVED" | "RENTED" | "REJECTED"
  hasActiveBooking?: boolean;
  className?: string;
}

export default function PropertyAvailabilityBadge({
  status,
  hasActiveBooking = false,
  className = "",
}: PropertyAvailabilityBadgeProps) {
  // Map database status to official requirement statuses
  let label = "Available";
  let dotColor = "bg-emerald-500";
  let badgeClasses = "bg-emerald-500/10 text-emerald-800 border-emerald-500/30";

  const upper = (status || "").toUpperCase();

  if (upper === "CLOSED" || upper === "SOLD") {
    label = "Sold";
    dotColor = "bg-red-500";
    badgeClasses = "bg-red-500/10 text-red-800 border-red-500/30";
  } else if (upper === "RESERVED" || hasActiveBooking) {
    label = "Reserved";
    dotColor = "bg-amber-500";
    badgeClasses = "bg-amber-500/10 text-amber-800 border-amber-500/30";
  } else if (upper === "RENTED") {
    label = "Rented";
    dotColor = "bg-blue-500";
    badgeClasses = "bg-blue-500/10 text-blue-800 border-blue-500/30";
  } else if (upper === "PENDING" || upper === "DRAFT") {
    label = "Pending Approval";
    dotColor = "bg-slate-400";
    badgeClasses = "bg-slate-500/10 text-slate-700 border-slate-400/30";
  } else if (upper === "APPROVED") {
    label = "Available";
    dotColor = "bg-emerald-500";
    badgeClasses = "bg-emerald-500/10 text-emerald-800 border-emerald-500/30";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs uppercase tracking-wider ${badgeClasses} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
      <span>{label}</span>
    </span>
  );
}
