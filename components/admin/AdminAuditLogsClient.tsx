"use client";

import { useState, memo } from "react";
import { ShieldAlert, Globe, Sparkles } from "lucide-react";

export interface AuditItem {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AdminAuditLogsClientProps {
  initialLogs: AuditItem[];
}

const AuditLogRow = memo(function AuditLogRow({ log }: { log: AuditItem }) {
  return (
    <tr className="hover:bg-[#F7F3EA]/50 transition-colors">
      <td className="px-5 py-4 font-bold text-[#07111F] whitespace-nowrap">
        <span className="px-2.5 py-1 rounded-full bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 font-mono text-xs shadow-xs">
          {log.action}
        </span>
      </td>
      <td className="px-4 py-4 text-[#6B7280] text-xs truncate" title={log.details || ""}>
        {log.details || "N/A"}
      </td>
      <td className="px-4 py-4 text-[#6B7280] font-mono text-xs whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-[#C89B3C] shrink-0" /> {log.ipAddress || "Internal"}
        </span>
      </td>
      <td className="px-5 py-4 text-right text-[#6B7280] text-xs font-medium whitespace-nowrap">
        {new Date(log.createdAt).toLocaleString("en-US")}
      </td>
    </tr>
  );
});

function AdminAuditLogsClient({ initialLogs }: AdminAuditLogsClientProps) {
  const [logs] = useState<AuditItem[]>(initialLogs);

  return (
    <div className="space-y-5 w-full min-w-0">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Security &amp; Compliance
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <ShieldAlert className="h-7 w-7 text-[#C89B3C]" /> System Audit &amp; Event Logs
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Track platform security events, administrative activities, and system state transitions.</p>
      </div>

      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-16 text-center text-[#9CA3AF]">No audit logs recorded in platform history.</div>
        ) : (
          <div className="overflow-x-auto momentum-scroll">
            <table className="w-full text-sm table-fixed-layout min-w-[700px]">
              <colgroup>
                <col className="w-[180px]" />
                <col className="w-[280px]" />
                <col className="w-[140px]" />
                <col className="w-[160px]" />
              </colgroup>
              <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Event Action</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Details</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Origin IP</th>
                  <th className="text-right px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                {logs.map((log) => (
                  <AuditLogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


export default memo(AdminAuditLogsClient);
