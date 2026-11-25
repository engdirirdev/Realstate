"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const CHANNEL_NAME = "kiromaal-live-sync";
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Automatically keeps the UI synchronized with the live database:
 * 1. After any successful /api/* mutation (POST/PUT/PATCH/DELETE), triggers
 *    router.refresh() and broadcasts a sync signal to all other open tabs.
 * 2. When another tab saves data, this tab refreshes automatically.
 * 3. When returning focus to a tab, refreshes server data automatically.
 */
export default function AutoRefreshSync() {
  const router = useRouter();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = setTimeout(() => {
        lastRefreshRef.current = Date.now();
        router.refresh();
        refreshTimerRef.current = null;
      }, 150);
    };

    // 1. Cross-tab BroadcastChannel sync
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (event?.data?.type === "DATA_MUTATED") {
            scheduleRefresh();
          }
        };
      } catch {
        channel = null;
      }
    }

    // 2. Intercept successful /api/* mutations to auto-refresh current & other tabs
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      try {
        const urlStr =
          typeof input === "string"
            ? input
            : input instanceof URL
            ? input.toString()
            : input.url;
        const method = (
          init?.method ||
          (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")
        ).toUpperCase();

        if (
          response.ok &&
          MUTATION_METHODS.has(method) &&
          urlStr.includes("/api/") &&
          !urlStr.includes("/api/upload") &&
          !urlStr.includes("/api/ai-chat") &&
          !urlStr.includes("/api/auth") &&
          !urlStr.includes("/api/ai/behavior")
        ) {
          scheduleRefresh();
          if (channel) {
            channel.postMessage({ type: "DATA_MUTATED", url: urlStr, ts: Date.now() });
          }
        }
      } catch {
        // Never interfere with app fetch calls
      }
      return response;
    };

    // 3. Refresh when user returns to this tab after > 3 seconds,
    //    UNLESS a modal dialog or form field is currently active (e.g. returning from file picker)
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefreshRef.current <= 3000) return;
      if (document.querySelector('[role="dialog"], [data-state="open"][aria-modal="true"]')) {
        return;
      }
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
        return;
      }
      scheduleRefresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.fetch = originalFetch;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (channel) {
        channel.close();
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [router]);

  return null;
}

