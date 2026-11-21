// ================================================================
// PAGE NAME  : Admin Dashboard — System Settings
// ROUTE      : /admin/settings
// DESCRIPTION: Executive full-width settings hub: Language (EN/SO),
//              Day & Night Theme, General Brand Parameters,
//              Approval & AI Controls, and Centralized Payment Accounts
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import {
  Settings,
  Save,
  ShieldCheck,
  Globe,
  Loader2,
  Sparkles,
  CreditCard,
  Building,
  Smartphone,
  Sun,
  Moon,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import type { PaymentMethodConfig } from "@/lib/payment-settings";
import { usePortalLanguage, usePortalTheme } from "@/lib/customer-i18n";

interface AdminSettingsClientProps {
  initialSettings?: {
    site_name: string;
    contact_email: string;
    currency: string;
    auto_approve_properties: boolean;
    enable_ai_chat: boolean;
  };
  initialPaymentMethods?: PaymentMethodConfig[];
}

function AdminSettingsClient({
  initialSettings,
  initialPaymentMethods,
}: AdminSettingsClientProps) {
  const [lang, setLang] = usePortalLanguage();
  const [theme, setTheme] = usePortalTheme();
  const isSo = lang === "so";
  const isNight = theme === "night";

  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [form, setForm] = useState(
    initialSettings || {
      site_name: "Kiro-Maal Real Estate",
      contact_email: "support@kiromaal.com",
      currency: "USD",
      auto_approve_properties: false,
      enable_ai_chat: true,
    }
  );

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(
    initialPaymentMethods || []
  );

  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, methodsRes] = await Promise.all([
        fetch("/api/admin/settings").then((r) => r.json()),
        fetch("/api/payment-methods?all=true").then((r) => r.json()),
      ]);

      if (settingsRes.success && settingsRes.settings) {
        setForm((prev) => ({
          ...prev,
          ...settingsRes.settings,
          auto_approve_properties: settingsRes.settings.auto_approve_properties === "true",
          enable_ai_chat: settingsRes.settings.enable_ai_chat !== "false",
        }));
      }

      if (methodsRes.success && Array.isArray(methodsRes.methods)) {
        setPaymentMethods(methodsRes.methods);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load platform settings.",
        variant: "destructive",
      });
    }
  }, []);

  useEffect(() => {
    if (!initialSettings && !initialPaymentMethods) {
      fetchSettings();
    }
  }, [initialSettings, initialPaymentMethods, fetchSettings]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const payload = {
          ...form,
          auto_approve_properties: String(form.auto_approve_properties),
          enable_ai_chat: String(form.enable_ai_chat),
        };

        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast({
            title: isSo ? "Dejinta Waa La Kaydiyay 🎉" : "Settings Saved 🎉",
            description: isSo
              ? "Xogta nidaamka waa la cusboonaysiiyay."
              : "Platform configuration updated successfully.",
          });
        } else {
          toast({ title: "Error", description: data.error, variant: "destructive" });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to update settings.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [form, isSo]
  );

  const handleUpdatePaymentMethodField = (
    id: string,
    field: keyof PaymentMethodConfig,
    val: any
  ) => {
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const handleSavePaymentMethods = async () => {
    setSavingPayment(true);
    try {
      const res = await fetch("/api/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methods: paymentMethods }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: isSo ? "Akoonnada Lacagta Waa La Kaydiyay 🎉" : "Payment Accounts Saved 🎉",
          description: isSo
            ? "Xogta lacag-bixinta iyo tilmaamaha waa la cusboonaysiiyay."
            : "Centralized payment accounts & settlement instructions updated.",
        });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save payment accounts.",
        variant: "destructive",
      });
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-12">
      {/* ─── Executive Header Banner ─── */}
      <div className="bg-[#07111F] rounded-3xl p-6 sm:p-7 border border-[#C89B3C]/35 shadow-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#C89B3C]/40 text-[#D9B45B] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D9B45B]" />
            {isSo ? "Maamulka Nidaamka & Lacagaha" : "Core Configuration & Governance"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#FCFBF7] flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-[#D9B45B]" />
            {isSo ? "Dejinta Nidaamka (System Settings)" : "System Architecture & Settings"}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            {isSo
              ? "Maamul luuqadda, muuqaalka iftiinka, xogta guud, amniga AI, iyo akoonnada lacag-bixinta."
              : "Manage portal language, display theme, brand configuration, AI governance, and payment accounts."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-3 py-1.5 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/40 text-[#D9B45B] text-xs font-bold">
            {isSo ? "Maamulka Sare" : "Super Admin"}
          </span>
        </div>
      </div>

      {/* ─── ROW 1: Language & Day/Night Theme (Side-by-Side Executive Cards) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Card */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
            <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0 shadow-xs">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#07111F]">
                {isSo ? "Luuqadda Nidaamka (Language)" : "Language (English & Somali)"}
              </h3>
              <p className="text-xs text-[#6B7280]">
                {isSo
                  ? "Dooro luuqadda aad rabto in laguugu soo bandhigo nidaamka."
                  : "Select your preferred display language across the admin portal."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                lang === "en"
                  ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md ring-2 ring-[#C89B3C]/30"
                  : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇬🇧</span>
                <div>
                  <p className="font-serif font-bold text-sm">English</p>
                  <p className={`text-[11px] ${lang === "en" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                    English interface
                  </p>
                </div>
              </div>
              {lang === "en" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setLang("so")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                lang === "so"
                  ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md ring-2 ring-[#C89B3C]/30"
                  : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇸🇴</span>
                <div>
                  <p className="font-serif font-bold text-sm">Af-Soomaali</p>
                  <p className={`text-[11px] ${lang === "so" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                    Somali interface
                  </p>
                </div>
              </div>
              {lang === "so" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
            </button>
          </div>
        </div>

        {/* Day & Night Theme Card */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
            <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0 shadow-xs">
              {isNight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#07111F]">
                {isSo ? "Muuqaalka Iftiinka (Day & Night)" : "Appearance Theme (Day & Night)"}
              </h3>
              <p className="text-xs text-[#6B7280]">
                {isSo
                  ? "U kala beddel muuqaalka Maalinta (Iftiin) iyo Habeenka (Madow)."
                  : "Switch between Warm Luxury Daylight and Deep Navy Dark Mode."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setTheme("day")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                theme === "day"
                  ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md ring-2 ring-[#C89B3C]/30"
                  : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    theme === "day" ? "bg-[#C89B3C]/20 text-[#D9B45B]" : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <Sun className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif font-bold text-sm">
                    {isSo ? "Maalin (Day)" : "Day Mode"}
                  </p>
                  <p className={`text-[11px] ${theme === "day" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                    Warm Ivory
                  </p>
                </div>
              </div>
              {theme === "day" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setTheme("night")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                theme === "night"
                  ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md ring-2 ring-[#C89B3C]/30"
                  : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    theme === "night" ? "bg-[#C89B3C]/20 text-[#D9B45B]" : "bg-slate-900 text-[#D9B45B]"
                  }`}
                >
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif font-bold text-sm">
                    {isSo ? "Habeen (Night)" : "Night Mode"}
                  </p>
                  <p className={`text-[11px] ${theme === "night" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                    Deep Navy Dark
                  </p>
                </div>
              </div>
              {theme === "night" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── ROW 2: General Brand Parameters & Approval / AI Security Controls ─── */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Brand Parameters */}
        <div className="bg-[#FCFBF7] p-6 rounded-3xl shadow-sm border border-[#E8E1D4] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0 shadow-xs">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#07111F]">
                  {isSo ? "Xogta Guud ee Shirkadda" : "General Brand Parameters"}
                </h2>
                <p className="text-xs text-[#6B7280]">
                  {isSo
                    ? "Magaca nidaamka, iimaylka adeegga, iyo lacagta rasmiga ah."
                    : "Platform identity, official concierge contact, and settlement currency."}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Platform Brand Name
              </Label>
              <Input
                value={form.site_name}
                onChange={(e) => setForm((p) => ({ ...p, site_name: e.target.value }))}
                className="h-10 rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  Concierge Email
                </Label>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
                  className="h-10 rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  Default Settlement Currency
                </Label>
                <Input
                  value={form.currency}
                  onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                  className="h-10 rounded-xl font-mono font-bold border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Approval & AI Security Controls */}
        <div className="bg-[#FCFBF7] p-6 rounded-3xl shadow-sm border border-[#E8E1D4] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0 shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#07111F]">
                  {isSo ? "Xakamaynta Oggolaanshaha & AI" : "Approval & AI Security Controls"}
                </h2>
                <p className="text-xs text-[#6B7280]">
                  {isSo
                    ? "Maamul daabacaadda tooska ah iyo kaaliyaha AI."
                    : "Governance toggles for listing moderation and AI assistant visibility."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E8E1D4]">
              <div>
                <p className="text-sm font-bold text-[#07111F]">Auto-Publish Property Listings</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Bypasses administrative review workflow when Managers submit properties.
                </p>
              </div>
              <Switch
                checked={form.auto_approve_properties}
                onCheckedChange={(val) =>
                  setForm((p) => ({ ...p, auto_approve_properties: val }))
                }
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E8E1D4]">
              <div>
                <p className="text-sm font-bold text-[#07111F]">
                  Enable Global Floating AI Concierge
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Displays Kiro-Maal AI Floating Assistant pill across all public and client views.
                </p>
              </div>
              <Switch
                checked={form.enable_ai_chat}
                onCheckedChange={(val) => setForm((p) => ({ ...p, enable_ai_chat: val }))}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold px-6 h-10 shadow-sm border-0 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSo ? "Kaydi Dejinta Guud" : "Save General Parameters"}
            </Button>
          </div>
        </div>
      </form>

      {/* ─── ROW 3: Centralized Payment Accounts (2x2 Luxury Grid) ─── */}
      <div className="bg-[#FCFBF7] p-6 rounded-3xl shadow-sm border border-[#E8E1D4] space-y-6">
        <div className="border-b border-[#E8E1D4] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0 shadow-xs">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#07111F]">
                {isSo ? "Akoonnada Lacag-Bixinta (Payment Accounts)" : "Centralized Payment Accounts"}
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Configure merchant phone numbers, bank accounts, and settlement instructions shown to customers during booking &amp; purchase.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSavePaymentMethods}
            disabled={savingPayment}
            className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold px-5 h-10 text-xs shadow-sm border-0 self-start sm:self-auto cursor-pointer"
          >
            {savingPayment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSo ? "Kaydi Akoonnada" : "Save Payment Accounts"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paymentMethods.map((m) => (
            <div
              key={m.id}
              className="bg-white p-5 rounded-2xl border border-[#E8E1D4] space-y-3.5 shadow-2xs hover:border-[#C89B3C]/60 transition-all"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F1ECE1]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/30 shrink-0">
                    {m.type === "mobile_money" ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Building className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-serif font-bold text-sm text-[#07111F] block leading-tight">
                      {m.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A97918]">
                      {m.type === "mobile_money" ? "Mobile Money" : "Bank Transfer"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {m.isActive ? "Active" : "Disabled"}
                  </span>
                  <Switch
                    checked={m.isActive}
                    onCheckedChange={(val) =>
                      handleUpdatePaymentMethodField(m.id, "isActive", val)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {m.type === "bank_transfer" && (
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-bold text-[#07111F]">Bank Name</Label>
                    <Input
                      value={m.bankName || ""}
                      onChange={(e) =>
                        handleUpdatePaymentMethodField(m.id, "bankName", e.target.value)
                      }
                      placeholder="e.g. Salaam Somali Bank"
                      className="h-9 rounded-xl border-[#E8E1D4] text-xs bg-[#FCFBF7]"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-[#07111F]">
                    Account / Beneficiary Name
                  </Label>
                  <Input
                    value={m.accountName}
                    onChange={(e) =>
                      handleUpdatePaymentMethodField(m.id, "accountName", e.target.value)
                    }
                    placeholder="e.g. Kiro-Maal Real Estate"
                    className="h-9 rounded-xl border-[#E8E1D4] text-xs bg-[#FCFBF7]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-[#07111F]">
                    {m.type === "mobile_money" ? "Merchant / Phone #" : "Account Number"}
                  </Label>
                  <Input
                    value={m.accountNumber}
                    onChange={(e) =>
                      handleUpdatePaymentMethodField(m.id, "accountNumber", e.target.value)
                    }
                    placeholder="e.g. +252 61 500 0001"
                    className="h-9 rounded-xl font-mono border-[#E8E1D4] text-xs bg-[#FCFBF7]"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] font-bold text-[#07111F]">
                    Payment Instructions for Customer
                  </Label>
                  <Textarea
                    value={m.instructions}
                    onChange={(e) =>
                      handleUpdatePaymentMethodField(m.id, "instructions", e.target.value)
                    }
                    placeholder="Step-by-step instructions displayed when customer selects this method..."
                    className="min-h-[60px] rounded-xl border-[#E8E1D4] text-xs bg-[#FCFBF7]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(AdminSettingsClient);
