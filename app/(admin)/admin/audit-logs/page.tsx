// ================================================================
// PAGE NAME  : Admin Dashboard — Audit Logs
// ROUTE      : /admin/audit-logs
// DESCRIPTION: Platform security audit logs and action history
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Clock, User, Globe, Loader2 } from "lucide-react";
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
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <ShieldAlert className="h-6 w-6 text-[#10B981]" /> System Audit Logs
        </h1>
        <p className="text-[#64748B] text-sm mt-1">Track system events, security actions, and administrative activity.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#10B981]" />
            <p className="text-sm font-medium">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">No audit logs recorded.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-[#64748B]">Action / Event</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Details</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">IP Address</th>
                <th className="text-right px-5 py-3.5 font-semibold text-[#64748B]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-5 py-4 font-bold text-[#0F172A]">
                    <span className="px-2.5 py-1 rounded-full bg-[#0F172A] text-[#34D399] font-mono text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#64748B] text-xs">{log.details || "N/A"}</td>
                  <td className="px-4 py-4 text-[#64748B] font-mono text-xs flex items-center gap-1.5 mt-2">
                    <Globe className="h-3.5 w-3.5 text-[#94A3B8]" /> {log.ipAddress || "Localhost"}
                  </td>
                  <td className="px-5 py-4 text-right text-[#64748B] text-xs font-medium">
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
