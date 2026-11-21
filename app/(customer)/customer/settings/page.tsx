"use client";

import { useState, useEffect } from "react";
import { Globe, Sun, Moon, Bell, Sparkles, Settings, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePortalLanguage, usePortalTheme } from "@/lib/customer-i18n";

export default function CustomerSettingsPage() {
  const [lang, setLang] = usePortalLanguage();
  const [theme, setTheme] = usePortalTheme();
  const isSo = lang === "so";
  const isNight = theme === "night";

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [recommendationAlerts, setRecommendationAlerts] = useState(true);

  useEffect(() => {
    try {
      const savedTx = window.localStorage.getItem("kiromaal_notify_tx");
      const savedAi = window.localStorage.getItem("kiromaal_notify_ai");
      if (savedTx !== null) setEmailNotifications(savedTx === "true");
      if (savedAi !== null) setRecommendationAlerts(savedAi === "true");
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTxAlerts = (checked: boolean) => {
    setEmailNotifications(checked);
    try {
      window.localStorage.setItem("kiromaal_notify_tx", String(checked));
    } catch {}
    toast({
      title: isSo ? "Ogeysiisyada Waa La Cusboonaysiiyay 🔔" : "Notification Preference Saved 🔔",
      description: checked
        ? isSo
          ? "Ogeysiisyada codsiyada iyo fariimaha waa la shiday."
          : "Transaction & booking status alerts enabled."
        : isSo
          ? "Ogeysiisyada codsiyada waa la damiyay."
          : "Transaction & booking status alerts muted.",
    });
  };

  const toggleAiAlerts = (checked: boolean) => {
    setRecommendationAlerts(checked);
    try {
      window.localStorage.setItem("kiromaal_notify_ai", String(checked));
    } catch {}
    toast({
      title: isSo ? "Ogeysiisyada AI Waa La Cusboonaysiiyay 🔔" : "AI Alert Preference Saved 🔔",
      description: checked
        ? isSo
          ? "Ogeysiisyada guryaha kugu habboon waa la shiday."
          : "AI property match alerts enabled."
        : isSo
          ? "Ogeysiisyada guryaha AI waa la damiyay."
          : "AI property match alerts muted.",
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto min-h-screen p-5 sm:p-7">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />{" "}
          {isSo ? "Dejinta Nidaamka" : "Portal Preferences"}
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-[#C89B3C]" />{" "}
          {isSo ? "Dejinta (Settings)" : "Settings"}
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          {isSo
            ? "Dooro luuqadda nidaamka (English & Somali) iyo muuqaalka iftiinka (Maalin & Habeen)."
            : "Customize your system language (English & Somali) and display theme (Day & Night mode)."}
        </p>
      </div>

      {/* 1. Language Switcher Card (English & Somali) */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
          <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#07111F]">
              {isSo ? "Luuqadda Nidaamka (Language)" : "Language (English & Somali)"}
            </h3>
            <p className="text-xs text-[#6B7280]">
              {isSo
                ? "Dooro luuqadda aad rabto in laguugu soo bandhigo nidaamka."
                : "Select your preferred display language across the portal."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              lang === "en"
                ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md ring-2 ring-[#C89B3C]/30"
                : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-3xl">🇬🇧</span>
              <div>
                <p className="font-serif font-bold text-base">English</p>
                <p className={`text-xs mt-0.5 ${lang === "en" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                  International English interface
                </p>
              </div>
            </div>
            {lang === "en" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setLang("so")}
            className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              lang === "so"
                ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md ring-2 ring-[#C89B3C]/30"
                : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-3xl">🇸🇴</span>
              <div>
                <p className="font-serif font-bold text-base">Somali (Af-Soomaali)</p>
                <p className={`text-xs mt-0.5 ${lang === "so" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                  Muuqaalka Af-Soomaaliga
                </p>
              </div>
            </div>
            {lang === "so" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
          </button>
        </div>
      </div>

      {/* 2. Theme Mode Card (Day & Night) */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
          <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0">
            {isNight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#07111F]">
              {isSo
                ? "Muuqaalka Iftiinka (Day & Night Theme)"
                : "Appearance Theme (Day & Night)"}
            </h3>
            <p className="text-xs text-[#6B7280]">
              {isSo
                ? "U kala beddel muuqaalka Maalinta (Iftiin) iyo Habeenka (Madow)."
                : "Switch between Day Mode (Warm Luxury Cream) and Night Mode (Deep Navy Dark)."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme("day")}
            className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              theme === "day"
                ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md ring-2 ring-[#C89B3C]/30"
                : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  theme === "day"
                    ? "bg-[#C89B3C]/20 text-[#D9B45B]"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                <Sun className="h-6 w-6" />
              </div>
              <div>
                <p className="font-serif font-bold text-base">
                  {isSo ? "Maalin (Day Mode)" : "Day Mode (Light)"}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    theme === "day" ? "text-[#D9B45B]" : "text-[#6B7280]"
                  }`}
                >
                  {isSo ? "Muuqaal iftiin leh oo cad" : "Warm Luxury Cream & Ivory"}
                </p>
              </div>
            </div>
            {theme === "day" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme("night")}
            className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              theme === "night"
                ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md ring-2 ring-[#C89B3C]/30"
                : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  theme === "night"
                    ? "bg-[#C89B3C]/20 text-[#D9B45B]"
                    : "bg-slate-900 text-[#D9B45B]"
                }`}
              >
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-serif font-bold text-base">
                  {isSo ? "Habeen (Night Mode)" : "Night Mode (Dark)"}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    theme === "night" ? "text-[#D9B45B]" : "text-[#6B7280]"
                  }`}
                >
                  {isSo ? "Muuqaal madow oo indhaha u roon" : "Deep Navy & Gold Dark Mode"}
                </p>
              </div>
            </div>
            {theme === "night" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
          </button>
        </div>
      </div>

      {/* 3. Notification Channels Card */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E8E1D4]">
          <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#07111F]">
              {isSo ? "Kanaalada Ogeysiisyada" : "Notification Channels"}
            </h3>
            <p className="text-xs text-[#6B7280]">
              {isSo
                ? "Maamul fariimaha degdega ah ee codsiyada iyo guryaha cusub."
                : "Control real-time alerts for transaction updates and new listings."}
            </p>
          </div>
        </div>

        <label className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#E8E1D4] cursor-pointer hover:border-[#C89B3C]/40 transition-colors">
          <div>
            <p className="font-semibold text-xs text-[#07111F]">
              {isSo
                ? "Ogeysiisyada Codsiyada & Ballamaha"
                : "Transaction & Booking Status Alerts"}
            </p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              {isSo
                ? "Hel fariin degdeg ah marka codsigaaga la aqbalo ama maamuluhu kuu soo jawaabo."
                : "Receive instant notifications when requests are approved or managers reply."}
            </p>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => toggleTxAlerts(e.target.checked)}
            className="w-4 h-4 accent-[#C89B3C] rounded cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#E8E1D4] cursor-pointer hover:border-[#C89B3C]/40 transition-colors">
          <div>
            <p className="font-semibold text-xs text-[#07111F]">
              {isSo ? "Ogeysiisyada Guryaha AI" : "AI Property Match Alerts"}
            </p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              {isSo
                ? "Hel ogeysiis marka guryo cusub oo ku habboon dookhaaga la soo galiyo."
                : "Get notified when new verified properties match your target city and budget."}
            </p>
          </div>
          <input
            type="checkbox"
            checked={recommendationAlerts}
            onChange={(e) => toggleAiAlerts(e.target.checked)}
            className="w-4 h-4 accent-[#C89B3C] rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
