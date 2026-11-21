"use client";

import { useState, useMemo, memo } from "react";
import {
  ShieldAlert,
  Globe,
  Sparkles,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
  KeyRound,
  BadgeDollarSign,
  Settings,
  UserCheck,
  Activity,
  Hash,
  FileText,
  Filter,
} from "lucide-react";

export interface AuditItem {
  id: string;
  userId: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AdminAuditLogsClientProps {
  initialLogs: AuditItem[];
}

type CategoryKey = "ALL" | "SALES" | "RENTALS" | "PROPERTIES" | "SECURITY";

interface ActionMeta {
  label: string;
  category: Exclude<CategoryKey, "ALL">;
  accentBar: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconColor: string;
  Icon: typeof ShieldAlert;
}

function getActionMeta(action: string): ActionMeta {
  const upper = action.toUpperCase();
  const label = action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  if (
    upper.includes("REJECT") ||
    upper.includes("CANCEL") ||
    upper.includes("DELETE") ||
    upper.includes("FAIL")
  ) {
    return {
      label,
      category: upper.includes("RENT")
        ? "RENTALS"
        : upper.includes("PURCHASE") || upper.includes("SOLD")
        ? "SALES"
        : upper.includes("PROPERTY")
        ? "PROPERTIES"
        : "SECURITY",
      accentBar: "bg-rose-500",
      badgeBg: "bg-rose-50",
      badgeText: "text-rose-700",
      badgeBorder: "border-rose-200",
      iconBg: "bg-rose-500/10 border-rose-500/25",
      iconColor: "text-rose-600",
      Icon: XCircle,
    };
  }

  if (
    upper.includes("SOLD") ||
    upper.includes("PURCHASE") ||
    upper.includes("PAYMENT") ||
    upper.includes("TRANSACTION")
  ) {
    const isFinal =
      upper.includes("SOLD") ||
      upper.includes("FINAL") ||
      upper.includes("PAID") ||
      upper.includes("COMPLETED");
    return {
      label,
      category: "SALES",
      accentBar: isFinal ? "bg-emerald-500" : "bg-[#C89B3C]",
      badgeBg: isFinal ? "bg-emerald-50" : "bg-amber-50",
      badgeText: isFinal ? "text-emerald-700" : "text-[#9A6F10]",
      badgeBorder: isFinal ? "border-emerald-200" : "border-[#C89B3C]/35",
      iconBg: isFinal
        ? "bg-emerald-500/10 border-emerald-500/25"
        : "bg-[#C89B3C]/15 border-[#C89B3C]/35",
      iconColor: isFinal ? "text-emerald-600" : "text-[#A97918]",
      Icon: isFinal ? CheckCircle2 : BadgeDollarSign,
    };
  }

  if (upper.includes("RENT") || upper.includes("BOOKING")) {
    const isApproved = upper.includes("APPROVED") || upper.includes("ACTIVE");
    return {
      label,
      category: "RENTALS",
      accentBar: isApproved ? "bg-sky-500" : "bg-indigo-500",
      badgeBg: isApproved ? "bg-sky-50" : "bg-indigo-50",
      badgeText: isApproved ? "text-sky-700" : "text-indigo-700",
      badgeBorder: isApproved ? "border-sky-200" : "border-indigo-200",
      iconBg: isApproved
        ? "bg-sky-500/10 border-sky-500/25"
        : "bg-indigo-500/10 border-indigo-500/25",
      iconColor: isApproved ? "text-sky-600" : "text-indigo-600",
      Icon: KeyRound,
    };
  }

  if (upper.includes("PROPERTY") || upper.includes("LISTING")) {
    return {
      label,
      category: "PROPERTIES",
      accentBar: "bg-[#C89B3C]",
      badgeBg: "bg-[#FBF7EE]",
      badgeText: "text-[#9A6F10]",
      badgeBorder: "border-[#C89B3C]/35",
      iconBg: "bg-[#C89B3C]/15 border-[#C89B3C]/35",
      iconColor: "text-[#A97918]",
      Icon: Home,
    };
  }

  return {
    label,
    category: "SECURITY",
    accentBar: "bg-[#07111F]",
    badgeBg: "bg-[#07111F]/5",
    badgeText: "text-[#07111F]",
    badgeBorder: "border-[#07111F]/15",
    iconBg: "bg-[#07111F]/10 border-[#07111F]/20",
    iconColor: "text-[#07111F]",
    Icon: Settings,
  };
}

function parseLogDetails(details: string | null): {
  refType: string | null;
  refId: string | null;
  summary: string;
} {
  if (!details || !details.trim()) {
    return { refType: null, refId: null, summary: "System state transition recorded." };
  }

  const trimmed = details.trim();
  // Pattern: "Transaction:cmwpzh1p... — Property title" or "Request:cmwpzfdeb..."
  const dashSplit = trimmed.split(/\s+[—–-]\s+/);
  const firstPart = dashSplit[0] || trimmed;
  const restPart = dashSplit.slice(1).join(" — ").trim();

  const colonMatch = firstPart.match(/^([A-Za-z_ ]+):([A-Za-z0-9_-]+)$/);
  if (colonMatch) {
    return {
      refType: colonMatch[1].trim(),
      refId: colonMatch[2].trim(),
      summary:
        restPart ||
        `${colonMatch[1].trim()} record updated and verified in platform ledger.`,
    };
  }

  return { refType: null, refId: null, summary: trimmed };
}

function formatRoleLabel(role?: string | null) {
  if (!role) return "System";
  if (role === "ADMIN") return "Super Admin";
  if (role === "USER") return "Manager";
  return "Customer";
}

const AuditLogCard = memo(function AuditLogCard({ log }: { log: AuditItem }) {
  const meta = getActionMeta(log.action);
  const parsed = parseLogDetails(log.details);
  const Icon = meta.Icon;

  const dateObj = new Date(log.createdAt);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group relative bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] hover:border-[#C89B3C]/60 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Left vertical status accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${meta.accentBar}`} />

      <div className="p-5 pl-6 flex-1 flex flex-col justify-between gap-4">
        {/* Top Row: Icon + Human Title + Code Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${meta.iconBg}`}
            >
              <Icon className={`w-5 h-5 ${meta.iconColor}`} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif font-bold text-[#07111F] text-base leading-snug">
                  {meta.label}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                >
                  {meta.category}
                </span>
              </div>

              <span className="inline-block mt-1 font-mono text-[11px] font-semibold text-[#6B7280] bg-[#F7F3EA] px-2 py-0.5 rounded-md border border-[#E8E1D4]">
                {log.action}
              </span>
            </div>
          </div>

          {/* Timestamp Pill */}
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#07111F] bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4]">
              <Clock className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>{formattedTime}</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1 font-medium">{formattedDate}</p>
          </div>
        </div>

        {/* Middle Row: Readable Details & Reference ID */}
        <div className="bg-white/90 rounded-xl border border-[#E8E1D4]/90 p-3.5 space-y-2">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-[#C89B3C] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-[#374151] leading-relaxed break-words">
              {parsed.summary}
            </p>
          </div>

          {parsed.refId && (
            <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-[#F0EAE0]">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B7280]">
                <Hash className="w-3 h-3 text-[#C89B3C]" />
                {parsed.refType || "Reference"}:
              </span>
              <code className="text-[11px] font-mono font-semibold text-[#07111F] bg-[#F7F3EA] px-2 py-0.5 rounded-md border border-[#E8E1D4] select-all">
                {parsed.refId}
              </code>
            </div>
          )}
        </div>

        {/* Bottom Row: Actor & Origin IP */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E1D4]/80 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#07111F] text-[#D9B45B] flex items-center justify-center shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[#07111F] truncate">
              {log.actorName || "System Automated"}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F7F3EA] text-[#8C6D23] border border-[#E8E1D4]">
              {formatRoleLabel(log.actorRole)}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-[#6B7280] bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4]">
            <Globe className="w-3.5 h-3.5 text-[#C89B3C] shrink-0" />
            {log.ipAddress || "Internal"}
          </span>
        </div>
      </div>
    </div>
  );
});

function AdminAuditLogsClient({ initialLogs }: AdminAuditLogsClientProps) {
  const [logs] = useState<AuditItem[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("ALL");

  const stats = useMemo(() => {
    let sales = 0;
    let rentals = 0;
    let properties = 0;
    let security = 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let last24h = 0;

    for (const log of logs) {
      const cat = getActionMeta(log.action).category;
      if (cat === "SALES") sales++;
      else if (cat === "RENTALS") rentals++;
      else if (cat === "PROPERTIES") properties++;
      else security++;
      if (new Date(log.createdAt).getTime() >= oneDayAgo) last24h++;
    }

    return {
      total: logs.length,
      sales,
      rentals,
      properties,
      security,
      last24h,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const meta = getActionMeta(log.action);
      if (activeCategory !== "ALL" && meta.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        log.action.toLowerCase().includes(q) ||
        meta.label.toLowerCase().includes(q) ||
        (log.details || "").toLowerCase().includes(q) ||
        (log.actorName || "").toLowerCase().includes(q) ||
        (log.ipAddress || "internal").toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery, activeCategory]);

  const filterTabs: { key: CategoryKey; label: string; count: number }[] = [
    { key: "ALL", label: "All Events", count: stats.total },
    { key: "SALES", label: "Sales & Purchases", count: stats.sales },
    { key: "RENTALS", label: "Rentals & Bookings", count: stats.rentals },
    { key: "PROPERTIES", label: "Properties", count: stats.properties },
    { key: "SECURITY", label: "System & Security", count: stats.security },
  ];

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Security &amp; Compliance
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <ShieldAlert className="h-7 w-7 text-[#C89B3C]" /> System Audit &amp; Event Logs
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Immutable record of platform transactions, approvals, administrative actions, and security transitions.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 text-xs font-bold shadow-xs self-start sm:self-auto">
          <Activity className="w-4 h-4 text-[#C89B3C]" />
          <span>{stats.last24h} events in last 24h</span>
        </div>
      </div>

      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Total Audit Records
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-[#07111F]">{stats.total}</p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Verified ledger entries</p>
        </div>

        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Sales &amp; Purchases
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-emerald-700">{stats.sales}</p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Approvals &amp; settlements</p>
        </div>

        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Rentals &amp; Bookings
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-sky-700">{stats.rentals}</p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Lease &amp; booking events</p>
        </div>

        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Properties &amp; System
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#C89B3C]/15 text-[#A97918] border border-[#C89B3C]/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-serif font-bold text-[#A97918]">
            {stats.properties + stats.security}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Listings &amp; config audits</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-[#C89B3C] mr-1 hidden sm:block" />
          {filterTabs.map((tab) => {
            const active = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                    : "bg-[#F7F3EA] text-[#4B5563] hover:text-[#07111F] border border-[#E8E1D4]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    active ? "bg-[#C89B3C]/25 text-[#D9B45B]" : "bg-white text-[#6B7280]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-[#C89B3C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, property, actor, ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8E1D4] text-xs sm:text-sm text-[#07111F] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/15"
          />
        </div>
      </div>

      {/* Audit Event Cards Grid */}
      {filteredLogs.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-14 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 opacity-80" />
          </div>
          <h3 className="font-serif font-bold text-[#07111F] text-lg">
            No matching audit events
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Try clearing your search filter or selecting another event category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredLogs.map((log) => (
            <AuditLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(AdminAuditLogsClient);
