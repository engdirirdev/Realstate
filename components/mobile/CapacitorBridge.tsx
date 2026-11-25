"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WifiOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * Native Capacitor Bridge (Android / iOS):
 * - Completely inert on normal web browsers (zero overhead).
 * - Inside the native Android Capacitor app:
 *   1. Applies Deep Navy (#0B1728) StatusBar & hides SplashScreen smoothly.
 *   2. Registers FCM Push Notifications and syncs device token to /api/mobile/push-token.
 *   3. Handles Deep Links (kiromaal://... and https://kiromaal.com/...).
 *   4. Handles Android hardware Back button cleanly.
 *   5. Shows an offline banner when mobile connectivity drops.
 */
export default function CapacitorBridge() {
  const router = useRouter();
  const { status } = useSession();
  const [isOffline, setIsOffline] = useState(false);

  // 1. Core native chrome, deep links, back button & network listener
  useEffect(() => {
    let cleanupFns: Array<() => void> = [];
    let active = true;

    async function initNativeShell() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform() || !active) return;

        // StatusBar (#0B1728 Deep Navy)
        try {
          const { StatusBar, Style } = await import("@capacitor/status-bar");
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: "#0B1728" });
        } catch {
          // Ignore if unavailable
        }

        // SplashScreen hide
        try {
          const { SplashScreen } = await import("@capacitor/splash-screen");
          await SplashScreen.hide();
        } catch {
          // Ignore if already hidden
        }

        // Deep Linking + Hardware Back Button
        try {
          const { App } = await import("@capacitor/app");

          const urlListener = await App.addListener("appUrlOpen", (event) => {
            if (!event?.url) return;
            try {
              // Supports both https://kiromaal.com/properties/123 and kiromaal://properties/123
              const raw = event.url.replace(/^kiromaal:\/\//i, "https://kiromaal.com/");
              const parsed = new URL(raw);
              const target = `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
              router.push(target);
            } catch {
              // Ignore malformed URLs
            }
          });
          cleanupFns.push(() => urlListener.remove());

          const backListener = await App.addListener("backButton", ({ canGoBack }) => {
            if (canGoBack && window.history.length > 1) {
              window.history.back();
            } else {
              App.exitApp();
            }
          });
          cleanupFns.push(() => backListener.remove());
        } catch {
          // Ignore if unavailable
        }

        // Network connectivity banner
        try {
          const { Network } = await import("@capacitor/network");
          const current = await Network.getStatus();
          if (active) setIsOffline(!current.connected);

          const netListener = await Network.addListener("networkStatusChange", (net) => {
            if (active) setIsOffline(!net.connected);
          });
          cleanupFns.push(() => netListener.remove());
        } catch {
          // Ignore if unavailable
        }
      } catch {
        // Non-native browser environment
      }
    }

    initNativeShell();

    return () => {
      active = false;
      cleanupFns.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
    };
  }, [router]);

  // 2. Push Notifications registration when authenticated on native Android
  useEffect(() => {
    if (status !== "authenticated") return;

    let cleanupFns: Array<() => void> = [];
    let active = true;

    async function initPushNotifications() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform() || !active) return;

        const { PushNotifications } = await import("@capacitor/push-notifications");

        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === "prompt") {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== "granted" || !active) return;

        const regListener = await PushNotifications.addListener("registration", async (token) => {
          try {
            await fetch("/api/mobile/push-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: token.value,
                platform: Capacitor.getPlatform(),
              }),
            });
          } catch {
            // Will retry on next app launch
          }
        });
        cleanupFns.push(() => regListener.remove());

        const recvListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            toast({
              title: notification.title || "Kiro-Maal Notification",
              description: notification.body || "",
            });
          }
        );
        cleanupFns.push(() => recvListener.remove());

        const tapListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            const targetPath = action.notification?.data?.url || action.notification?.data?.path;
            if (typeof targetPath === "string" && targetPath.startsWith("/")) {
              router.push(targetPath);
            }
          }
        );
        cleanupFns.push(() => tapListener.remove());

        await PushNotifications.register();
      } catch {
        // Ignore if Firebase / FCM not yet configured
      }
    }

    initPushNotifications();

    return () => {
      active = false;
      cleanupFns.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
    };
  }, [status, router]);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md rounded-2xl bg-[#0B1728] text-white border border-[#D6A536]/50 px-4 py-3 shadow-2xl flex items-center gap-3"
    >
      <WifiOff className="h-5 w-5 text-[#D6A536] shrink-0" />
      <div className="text-xs leading-snug">
        <p className="font-bold text-[#D6A536]">Offline Mode</p>
        <p className="text-slate-300">No internet connection. Reconnect to sync live properties.</p>
      </div>
    </div>
  );
}

