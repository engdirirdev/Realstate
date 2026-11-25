// ================================================================
// PAGE NAME  : Admin Dashboard — System Settings
// ROUTE      : /admin/settings
// DESCRIPTION: Executive settings hub with clean main title selector:
//              Clicking any setting title opens its dedicated card
//              (Language, Appearance Theme, General Brand, AI Controls,
//               Executive Team, Centralized Payment Accounts)
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
  Users,
  Plus,
  Pencil,
  Trash2,
  Camera,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { PaymentMethodConfig } from "@/lib/payment-settings";
import { usePortalLanguage, usePortalTheme } from "@/lib/customer-i18n";
import {
  EXECUTIVE_TEAM_SETTING_KEY,
  parseExecutiveTeam,
  type ExecutiveTeamMember,
} from "@/lib/executive-team";

type SettingSectionKey =
  | "language"
  | "theme"
  | "brand"
  | "security"
  | "team"
  | "payments";

interface AdminSettingsClientProps {
  initialSettings?: {
    site_name: string;
    contact_email: string;
    contact_phone?: string;
    contact_address?: string;
    contact_hours?: string;
    company_description?: string;
    social_facebook?: string;
    social_twitter?: string;
    social_instagram?: string;
    social_linkedin?: string;
    currency: string;
    auto_approve_properties: boolean;
    enable_ai_chat: boolean;
  };
  initialPaymentMethods?: PaymentMethodConfig[];
  initialExecutiveTeam?: ExecutiveTeamMember[];
}

function getMemberInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "KM"
  );
}

function AdminSettingsClient({
  initialSettings,
  initialPaymentMethods,
  initialExecutiveTeam,
}: AdminSettingsClientProps) {
  const [lang, setLang] = usePortalLanguage();
  const [theme, setTheme] = usePortalTheme();
  const isSo = lang === "so";
  const isNight = theme === "night";

  // Initially only the main titles are shown; clicking one opens its card
  const [activeSection, setActiveSection] = useState<SettingSectionKey | null>(null);

  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Executive Team state
  const [team, setTeam] = useState<ExecutiveTeamMember[]>(
    initialExecutiveTeam ?? parseExecutiveTeam(undefined)
  );
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "",
    bio: "",
    image: "" as string,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);

  const [form, setForm] = useState({
    site_name: initialSettings?.site_name || "Kiro-Maal Real Estate",
    contact_email: initialSettings?.contact_email || "concierge@kiro-maal.so",
    contact_phone: initialSettings?.contact_phone || "+252 61 200 0000 / +252 61 900 0000",
    contact_address: initialSettings?.contact_address || "Abudwak, Galmudug, Somalia",
    contact_hours: initialSettings?.contact_hours || "Sat – Thu: 8:30 AM – 6:00 PM EAT",
    company_description:
      initialSettings?.company_description ||
      "Kiro-Maal Real Estate is Abudwak's premier luxury property platform. Discover verified properties, unlock AI-driven valuations, and find your dream home with unmatched trust and precision.",
    social_facebook: initialSettings?.social_facebook || "",
    social_twitter: initialSettings?.social_twitter || "",
    social_instagram: initialSettings?.social_instagram || "",
    social_linkedin: initialSettings?.social_linkedin || "",
    currency: initialSettings?.currency || "USD",
    auto_approve_properties: initialSettings?.auto_approve_properties ?? false,
    enable_ai_chat: initialSettings?.enable_ai_chat ?? true,
  });

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
        if (settingsRes.settings[EXECUTIVE_TEAM_SETTING_KEY] !== undefined) {
          setTeam(parseExecutiveTeam(settingsRes.settings[EXECUTIVE_TEAM_SETTING_KEY]));
        }
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

  const persistExecutiveTeam = useCallback(
    async (nextTeam: ExecutiveTeamMember[], successMsg: string) => {
      setSavingTeam(true);
      try {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [EXECUTIVE_TEAM_SETTING_KEY]: JSON.stringify(nextTeam),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setTeam(nextTeam);
          toast({
            title: isSo ? "Kooxda Waa La Cusboonaysiiyay 🎉" : "Executive Team Updated 🎉",
            description: successMsg,
          });
          return true;
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to save team changes.",
            variant: "destructive",
          });
          return false;
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to save executive team.",
          variant: "destructive",
        });
        return false;
      } finally {
        setSavingTeam(false);
      }
    },
    [isSo]
  );

  const openAddMemberModal = () => {
    setEditingMemberId(null);
    setMemberForm({ name: "", role: "", bio: "", image: "" });
    setTeamModalOpen(true);
  };

  const openEditMemberModal = (member: ExecutiveTeamMember) => {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      role: member.role,
      bio: member.bio || "",
      image: member.image || "",
    });
    setTeamModalOpen(true);
  };

  const handleMemberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setMemberForm((prev) => ({ ...prev, image: data.url }));
        toast({
          title: isSo ? "Sawirka Waa La Soo Geliyay 📸" : "Profile Photo Uploaded 📸",
          description: "Click Save to apply this photo.",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: data.error || "Could not upload profile photo.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Upload Error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = memberForm.name.trim();
    const cleanRole = memberForm.role.trim();
    if (!cleanName || !cleanRole) return;

    let nextTeam: ExecutiveTeamMember[];
    if (editingMemberId) {
      nextTeam = team.map((m) =>
        m.id === editingMemberId
          ? {
              ...m,
              name: cleanName,
              role: cleanRole,
              bio: memberForm.bio.trim(),
              image: memberForm.image.trim() || null,
            }
          : m
      );
    } else {
      nextTeam = [
        ...team,
        {
          id: `exec-${Date.now()}`,
          name: cleanName,
          role: cleanRole,
          bio: memberForm.bio.trim(),
          image: memberForm.image.trim() || null,
        },
      ];
    }

    const ok = await persistExecutiveTeam(
      nextTeam,
      editingMemberId
        ? `Updated ${cleanName}'s profile on the About page.`
        : `Registered ${cleanName} to the Executive Team.`
    );
    if (ok) {
      setTeamModalOpen(false);
      setEditingMemberId(null);
    }
  };

  const handleDeleteMember = async (member: ExecutiveTeamMember) => {
    const nextTeam = team.filter((m) => m.id !== member.id);
    await persistExecutiveTeam(nextTeam, `Removed ${member.name} from the Executive Team.`);
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

  const sectionItems: {
    key: SettingSectionKey;
    title: string;
    subtitle: string;
    Icon: typeof Globe;
  }[] = [
    {
      key: "language",
      title: isSo ? "Luuqadda Nidaamka" : "Language (English & Somali)",
      subtitle: isSo ? "SOM / ENG" : "Display language",
      Icon: Globe,
    },
    {
      key: "theme",
      title: isSo ? "Muuqaalka Iftiinka" : "Appearance Theme",
      subtitle: isSo ? "Maalin / Habeen" : "Day & Night mode",
      Icon: isNight ? Moon : Sun,
    },
    {
      key: "brand",
      title: isSo ? "Xogta Guud ee Shirkadda" : "General Brand Parameters",
      subtitle: isSo ? "Magaca, xiriirka & footer-ka" : "Brand, contact & footer",
      Icon: Building2,
    },
    {
      key: "security",
      title: isSo ? "Xakamaynta Oggolaanshaha & AI" : "Approval & AI Security Controls",
      subtitle: isSo ? "Daabacaadda & Kaaliyaha AI" : "Publishing & AI governance",
      Icon: ShieldCheck,
    },
    {
      key: "team",
      title: isSo ? "Kooxda Hoggaanka" : "Executive Team Management",
      subtitle: isSo ? `${team.length} xubnood` : `${team.length} members`,
      Icon: Users,
    },
    {
      key: "payments",
      title: isSo ? "Akoonnada Lacag-Bixinta" : "Centralized Payment Accounts",
      subtitle: isSo ? `${paymentMethods.length} habab lacag` : `${paymentMethods.length} methods`,
      Icon: CreditCard,
    },
  ];

  const toggleSection = (key: SettingSectionKey) => {
    setActiveSection((prev) => (prev === key ? null : key));
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
            {isSo ? "Dejinta Nidaamka" : "System Architecture & Settings"}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            {isSo
              ? "Guji mid ka mid ah cinwaannada hoose si aad u furto kaarkiisa dejinta."
              : "Click any setting title below to open and manage its configuration card."}
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/40 text-[#D9B45B] text-xs font-bold self-start sm:self-center">
          {isSo ? "Maamulka Sare" : "Super Admin"}
        </span>
      </div>

      {/* ─── MAIN SETTING TITLES GRID (Click any title to open its card) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectionItems.map(({ key, title, subtitle, Icon }) => {
          const isActive = activeSection === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleSection(key)}
              className={`group text-left p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                isActive
                  ? "bg-[#07111F] text-white border-[#C89B3C] shadow-lg ring-2 ring-[#C89B3C]/30"
                  : "bg-[#FCFBF7] text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/70 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                    isActive
                      ? "bg-[#C89B3C]/20 text-[#D9B45B] border-[#C89B3C]/50"
                      : "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/30"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    className={`font-serif font-bold text-sm sm:text-base truncate ${
                      isActive ? "text-white" : "text-[#07111F]"
                    }`}
                  >
                    {title}
                  </h2>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      isActive ? "text-[#D9B45B]" : "text-[#6B7280]"
                    }`}
                  >
                    {subtitle}
                  </p>
                </div>
              </div>

              <ChevronRight
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                  isActive
                    ? "text-[#D9B45B] rotate-90"
                    : "text-[#9CA3AF] group-hover:text-[#C89B3C] group-hover:translate-x-0.5"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* ─── ACTIVE SETTING CARD (Shown only for the clicked title) ─── */}

      {/* 1. Language Card */}
      {activeSection === "language" && (
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E8E1D4]">
            <div className="flex items-center gap-3">
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
                    : "Select your preferred display language across the platform."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA] cursor-pointer"
              aria-label="Close card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                <span className="text-xl font-bold px-2 py-1 rounded-lg bg-[#C89B3C]/20 text-[#D9B45B]">SOM</span>
                <div>
                  <p className="font-serif font-bold text-sm">Af-Soomaali</p>
                  <p className={`text-[11px] ${lang === "so" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                    Somali interface (Base)
                  </p>
                </div>
              </div>
              {lang === "so" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
            </button>

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
                <span className="text-xl font-bold px-2 py-1 rounded-lg bg-[#C89B3C]/20 text-[#D9B45B]">ENG</span>
                <div>
                  <p className="font-serif font-bold text-sm">English</p>
                  <p className={`text-[11px] ${lang === "en" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                    English interface
                  </p>
                </div>
              </div>
              {lang === "en" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B] shrink-0" />}
            </button>
          </div>
        </div>
      )}

      {/* 2. Day & Night Theme Card */}
      {activeSection === "theme" && (
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E8E1D4]">
            <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA] cursor-pointer"
              aria-label="Close card"
            >
              <X className="h-4 w-4" />
            </button>
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
      )}

      {/* 3. General Brand Parameters Card */}
      {activeSection === "brand" && (
        <form
          onSubmit={handleSave}
          className="bg-[#FCFBF7] p-6 rounded-3xl shadow-sm border border-[#E8E1D4] space-y-5 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E8E1D4]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0 shadow-xs">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#07111F]">
                  {isSo ? "Xogta Guud ee Shirkadda" : "General Brand Parameters"}
                </h2>
                <p className="text-xs text-[#6B7280]">
                  {isSo
                    ? "Magaca nidaamka, iimaylka adeegga, ciwaanka, iyo baraha bulshada."
                    : "Platform identity, official concierge contact, footer details, and settlement currency."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA] cursor-pointer"
              aria-label="Close card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
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
                  placeholder="concierge@kiro-maal.so"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  Direct Advisory Phone (Footer &amp; Contact)
                </Label>
                <Input
                  value={form.contact_phone}
                  onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))}
                  placeholder="+252 61 200 0000 / +252 61 900 0000"
                  className="h-10 rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  Headquarters / Office Address (Footer &amp; Contact)
                </Label>
                <Input
                  value={form.contact_address}
                  onChange={(e) => setForm((p) => ({ ...p, contact_address: e.target.value }))}
                  placeholder="Abudwak, Galmudug, Somalia"
                  className="h-10 rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Private / Office Hours (Contact Page)
              </Label>
              <Input
                value={form.contact_hours}
                onChange={(e) => setForm((p) => ({ ...p, contact_hours: e.target.value }))}
                placeholder="Sat – Thu: 8:30 AM – 6:00 PM EAT"
                className="h-10 rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Company Description (Footer)
              </Label>
              <Textarea
                value={form.company_description}
                onChange={(e) => setForm((p) => ({ ...p, company_description: e.target.value }))}
                placeholder="Brief company overview shown in the website footer..."
                className="min-h-[76px] rounded-xl border-[#E8E1D4] bg-white text-xs sm:text-sm focus:border-[#C89B3C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Facebook URL
                </Label>
                <Input
                  value={form.social_facebook}
                  onChange={(e) => setForm((p) => ({ ...p, social_facebook: e.target.value }))}
                  placeholder="https://facebook.com/..."
                  className="h-9 rounded-xl border-[#E8E1D4] bg-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Twitter / X URL
                </Label>
                <Input
                  value={form.social_twitter}
                  onChange={(e) => setForm((p) => ({ ...p, social_twitter: e.target.value }))}
                  placeholder="https://x.com/..."
                  className="h-9 rounded-xl border-[#E8E1D4] bg-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Instagram URL
                </Label>
                <Input
                  value={form.social_instagram}
                  onChange={(e) => setForm((p) => ({ ...p, social_instagram: e.target.value }))}
                  placeholder="https://instagram.com/..."
                  className="h-9 rounded-xl border-[#E8E1D4] bg-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  LinkedIn URL
                </Label>
                <Input
                  value={form.social_linkedin}
                  onChange={(e) => setForm((p) => ({ ...p, social_linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/..."
                  className="h-9 rounded-xl border-[#E8E1D4] bg-white text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#E8E1D4]">
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold px-6 h-10 shadow-sm border-0 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSo ? "Kaydi Dejinta Guud" : "Save General Parameters"}
            </Button>
          </div>
        </form>
      )}

      {/* 4. Approval & AI Security Controls Card */}
      {activeSection === "security" && (
        <form
          onSubmit={handleSave}
          className="bg-[#FCFBF7] p-6 rounded-3xl shadow-sm border border-[#E8E1D4] space-y-5 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E8E1D4]">
            <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA] cursor-pointer"
              aria-label="Close card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
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

          <div className="flex justify-end pt-2 border-t border-[#E8E1D4]">
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold px-6 h-10 shadow-sm border-0 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSo ? "Kaydi Xakamaynta" : "Save Controls"}
            </Button>
          </div>
        </form>
      )}

      {/* 5. Executive Team Management Card */}
      {activeSection === "team" && (
        <div className="bg-[#FCFBF7] p-6 rounded-3xl shadow-sm border border-[#E8E1D4] space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-[#E8E1D4] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40 shrink-0 shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-[#07111F]">
                  {isSo ? "Kooxda Hoggaanka (Executive Team)" : "Executive Team Management"}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {isSo
                    ? "Ku dar, wax ka beddel, ama tirtir xubnaha kooxda hoggaanka iyo sawirradooda."
                    : "Register, edit, delete leadership members and upload or change their profile photos shown on the About Us page."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                onClick={openAddMemberModal}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold px-5 h-10 text-xs shadow-sm border-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                {isSo ? "Ku Dar Xubin" : "Add Team Member"}
              </Button>
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA] cursor-pointer"
                aria-label="Close card"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {team.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#E8E1D4] p-10 text-center space-y-3">
              <Users className="h-10 w-10 text-[#C89B3C]/50 mx-auto" />
              <p className="font-serif font-bold text-[#07111F] text-base">
                No Executive Team Members Registered
              </p>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Add your leadership team members with their profile photos and roles to showcase them on the public About Us page.
              </p>
              <Button
                type="button"
                onClick={openAddMemberModal}
                className="bg-[#07111F] text-[#D9B45B] hover:bg-[#0D1E35] rounded-xl gap-1.5 text-xs font-bold border border-[#C89B3C]/40 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add First Member
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-[#E8E1D4] hover:border-[#C89B3C]/60 p-5 shadow-2xs flex flex-col items-center text-center justify-between gap-4 transition-all"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#C89B3C]/50 bg-[#07111F] flex items-center justify-center shadow-sm mb-3 shrink-0">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-serif text-lg font-bold text-[#D9B45B]">
                          {getMemberInitials(member.name)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-[#07111F] text-sm leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-[11px] text-[#C89B3C] font-bold uppercase tracking-wide mt-1">
                      {member.role}
                    </p>
                    {member.bio && (
                      <p className="text-[11px] text-[#6B7280] mt-1.5 line-clamp-2 leading-relaxed">
                        {member.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full pt-3 border-t border-[#F1ECE1]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditMemberModal(member)}
                      disabled={savingTeam}
                      className="flex-1 h-8 rounded-xl border-[#C89B3C]/40 text-[#07111F] hover:bg-[#F7F3EA] text-xs font-semibold gap-1 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#C89B3C]" /> Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMember(member)}
                      disabled={savingTeam}
                      className="h-8 px-2.5 rounded-xl border-[#E8E1D4] text-[#DC2626] hover:bg-red-50 hover:border-red-200 cursor-pointer"
                      aria-label={`Delete ${member.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Centralized Payment Accounts Card */}
      {activeSection === "payments" && (
        <div className="bg-[#FCFBF7] p-6 rounded-3xl shadow-sm border border-[#E8E1D4] space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
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

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                onClick={handleSavePaymentMethods}
                disabled={savingPayment}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold px-5 h-10 text-xs shadow-sm border-0 cursor-pointer"
              >
                {savingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSo ? "Kaydi Akoonnada" : "Save Payment Accounts"}
              </Button>
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA] cursor-pointer"
                aria-label="Close card"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
      )}

      {/* Add / Edit Executive Team Member Modal */}
      <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 border border-[#E8E1D4] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#C89B3C]" />
              {editingMemberId ? "Edit Executive Member" : "Register Executive Member"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveMember} className="space-y-4 mt-2">
            {/* Profile Photo Uploader */}
            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-[#E8E1D4]">
              <div className="relative w-22 h-22 rounded-full overflow-hidden border-2 border-[#C89B3C] bg-[#07111F] flex items-center justify-center shadow-sm">
                {memberForm.image ? (
                  <img
                    src={memberForm.image}
                    alt={memberForm.name || "Member"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-xl font-bold text-[#D9B45B]">
                    {getMemberInitials(memberForm.name || "KM")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#07111F] text-[#D9B45B] hover:bg-[#0D1E35] border border-[#C89B3C]/40 text-xs font-bold cursor-pointer transition-colors">
                  {uploadingPhoto ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  <span>{memberForm.image ? "Change Photo" : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleMemberPhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>

                {memberForm.image && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMemberForm((prev) => ({ ...prev, image: "" }))}
                    className="h-8 px-2.5 rounded-xl border-[#E8E1D4] text-rose-600 hover:bg-rose-50 text-xs gap-1 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Full Name *
              </Label>
              <Input
                value={memberForm.name}
                onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Mohamed Ali Hassan"
                required
                className="h-10 rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Position / Role *
              </Label>
              <Input
                value={memberForm.role}
                onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))}
                placeholder="e.g. CEO & Co-Founder"
                required
                className="h-10 rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Short Bio (Optional)
              </Label>
              <Textarea
                value={memberForm.bio}
                onChange={(e) => setMemberForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Brief leadership note shown under their title..."
                className="min-h-[68px] rounded-xl border-[#E8E1D4] bg-white text-xs focus:border-[#C89B3C]"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTeamModalOpen(false)}
                className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingTeam || uploadingPhoto || !memberForm.name.trim() || !memberForm.role.trim()}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm gap-1.5"
              >
                {savingTeam ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingMemberId ? "Save Changes" : "Register Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default memo(AdminSettingsClient);
