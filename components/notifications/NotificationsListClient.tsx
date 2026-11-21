"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Sparkles, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  createdAt: string;
}

interface NotificationsListClientProps {
  initialNotifications: NotificationItem[];
  badgeText?: string;
  headingText?: string;
  emptyDescription?: string;
}

export default function NotificationsListClient({
  initialNotifications,
  badgeText = "Activity Feed",
  headingText = "Client Notifications",
  emptyDescription = "You will receive instant updates here when property managers respond to your inquiries or confirm scheduled visits.",
}: NotificationsListClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const [clearingAll, setClearingAll] = useState(false);
  const [clearingId, setClearingId] = useState<string | null>(null);

  const handleClearOne = async (id: string) => {
    setClearingId(id);
    try {
      const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      }
    } finally {
      setClearingId(null);
    }
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;
    setClearingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
      });
      if (res.ok) {
        setItems([]);
        router.refresh();
      }
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> {badgeText}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-[#C89B3C]" /> {headingText}
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {items.length} alerts and updates received for your account
          </p>
        </div>

        {items.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearAll}
            disabled={clearingAll}
            className="self-start sm:self-center h-10 px-4 rounded-xl border-red-200 bg-[#FCFBF7] text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs gap-2 shadow-xs cursor-pointer"
          >
            {clearingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Clear All Notifications
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Bell className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No notifications yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4] flex items-start gap-4 hover:border-[#C89B3C]/50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] flex-shrink-0 mt-0.5 shadow-inner">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif font-bold text-[#07111F] text-sm">{n.title}</h3>
                  <button
                    type="button"
                    onClick={() => handleClearOne(n.id)}
                    disabled={clearingId === n.id}
                    title="Clear notification"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#6B7280] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors shrink-0 cursor-pointer"
                  >
                    {clearingId === n.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Clear
                  </button>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{n.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-[#A97918] font-bold">
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {n.linkUrl && (
                    <Link
                      href={n.linkUrl}
                      className="text-[11px] font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors"
                    >
                      View Details →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

