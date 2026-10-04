// ================================================================
// PAGE NAME  : Admin Dashboard — Audit Logs
// ROUTE      : /admin/audit-logs
// DESCRIPTION: Platform security audit logs and action history
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Clock, User, Globe, Loader2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AuditItem {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      const data = await res.json();
      if (data.success) setLogs(data.logs);
    } catch {
      toast({ title: "Error", description: "Failed to load audit logs.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
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
        {loading ? (
          <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
            <p className="text-sm font-medium">Loading compliance audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-[#9CA3AF]">No audit logs recorded in platform history.</div>
        ) : (
          <table className="w-full text-sm">
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
                <tr key={log.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-[#07111F]">
                    <span className="px-2.5 py-1 rounded-full bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 font-mono text-xs shadow-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#6B7280] text-xs">{log.details || "N/A"}</td>
                  <td className="px-4 py-4 text-[#6B7280] font-mono text-xs flex items-center gap-1.5 mt-2">
                    <Globe className="h-3.5 w-3.5 text-[#C89B3C]" /> {log.ipAddress || "Internal"}
                  </td>
                  <td className="px-5 py-4 text-right text-[#6B7280] text-xs font-medium">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
