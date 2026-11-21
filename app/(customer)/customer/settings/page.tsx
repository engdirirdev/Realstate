"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Settings,
  Lock,
  Sparkles,
  Bell,
  Loader2,
  CheckCircle2,
  KeyRound,
  User,
  Camera,
  Globe,
  Trash2,
  AtSign,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { usePortalLanguage, PortalLanguage } from "@/lib/customer-i18n";

export default function CustomerSettingsPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [lang, setLang] = usePortalLanguage();
  const isSo = lang === "so";

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Personal details state
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    image: "",
  });

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // AI & Property Preferences
  const [preferences, setPreferences] = useState({
    preferredCity: "Mogadishu",
    propertyType: "VILLA",
    minBedrooms: 3,
    maxBudget: 150000,
    minArea: 120,
  });

  // Notification toggles
  const [notifyTransactions, setNotifyTransactions] = useState(true);
  const [notifyRecommendations, setNotifyRecommendations] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, prefRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/user/preferences"),
        ]);
        const [profJson, prefJson] = await Promise.all([profRes.json(), prefRes.json()]);

        if (profJson.success && profJson.user) {
          const u = profJson.user;
          setProfile({
            name: u.name || "",
            username: u.username || (u.email ? u.email.split("@")[0] : ""),
            email: u.email || "",
            phone: u.phone || "",
            image: u.image || "",
          });
        }

        if (prefJson.success && prefJson.preferences) {
          setPreferences({
            preferredCity: prefJson.preferences.preferredCity || "Mogadishu",
            propertyType: prefJson.preferences.propertyType || "VILLA",
            minBedrooms: prefJson.preferences.minBedrooms || 3,
            maxBudget: prefJson.preferences.maxBudget || 150000,
            minArea: prefJson.preferences.minArea || 120,
          });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.urls) && data.urls[0]) {
        setProfile((prev) => ({ ...prev, image: data.urls[0] }));
        toast({
          title: isSo ? "Sawirka waa la soo galiyay! 📸" : "Profile Picture Uploaded! 📸",
        });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setProfile((prev) => ({ ...prev, image: reader.result as string }));
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setProfile((prev) => ({ ...prev, image: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSavePersonalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const domain = profile.email.includes("@") ? profile.email.split("@")[1] : "gmail.com";
      const finalEmail =
        profile.username && !profile.username.includes("@")
          ? `${profile.username.trim()}@${domain}`
          : profile.email.trim();

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          username: profile.username,
          email: finalEmail,
          phone: profile.phone,
          image: profile.image,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.user) {
          setProfile((prev) => ({
            ...prev,
            name: json.user.name,
            email: json.user.email,
            username: json.user.username || json.user.email.split("@")[0],
            phone: json.user.phone || "",
            image: json.user.image || "",
          }));
        }
        await updateSession({
          name: profile.name,
          image: profile.image,
        }).catch(() => {});
        router.refresh();
        toast({
          title: isSo ? "Xogta Shaqsiga Waa La Kaydiyay! ✨" : "Personal Details Updated! ✨",
          description: isSo
            ? "Magacaaga, username-kaaga, iyo sawirkaaga waa la cusboonaysiiyay."
            : "Your username, name, contact details, and profile picture have been saved.",
        });
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update personal details.", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: isSo ? "Erayga sirta ah isma laha" : "Passwords mismatch",
        description: isSo
          ? "Erayga sirta ah ee cusub iyo xaqiijinta isku mid ma aha."
          : "New password and confirmation password do not match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: isSo ? "Erayga sirta ah waa gaaban yahay" : "Password too short",
        description: isSo
          ? "Erayga sirta ah waa inuu ugu yaraan 6 xaraf noqdaa."
          : "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: isSo
            ? "Erayga Sirta Ah Waa La Beddelay! 🔒"
            : "Password updated successfully! 🔒",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({
        title: "Network error",
        description: "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: isSo ? "Dooqyada Waa La Kaydiyay! ✨" : "Preferences saved! ✨",
          description: isSo
            ? "Talooyinka guryaha waxay raaci doonaan dooqyadaada."
            : "Your property recommendations and alerts will reflect your preferences.",
        });
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />{" "}
            {isSo ? "Maamulka Akoonka" : "Account Controls"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-[#C89B3C]" />{" "}
            {isSo ? "Dejinta Akoonka (Account Settings)" : "Account Settings"}
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {isSo
              ? "Maamul xogtaada shaqsiga ah, luuqadda (English & Somali), erayga sirta ah, iyo ogeysiisyada."
              : "Manage your personal details, language (English & Somali), password security, and preferences."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <Loader2 className="h-6 w-6 animate-spin text-[#C89B3C]" />
          <span className="text-sm text-[#6B7280]">
            {isSo ? "Dejinta waa la soo rarayaa..." : "Loading settings..."}
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Language Switcher Card (English & Somali) */}
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  {isSo ? "Luuqadda Nidaamka (System Language)" : "System Language (English & Somali)"}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {isSo
                    ? "Dooro luuqadda aad rabto inaad ku isticmaasho barta macaamiisha."
                    : "Choose your preferred language for the Customer Portal and AI Assistant."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setLang("en");
                  toast({
                    title: "Language switched to English 🇬🇧",
                    description: "Your portal interface is now displayed in English.",
                  });
                }}
                className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  lang === "en"
                    ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md"
                    : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇬🇧</span>
                  <div>
                    <p className="font-serif font-bold text-sm">English (International)</p>
                    <p className={`text-xs ${lang === "en" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                      Full English portal &amp; AI responses
                    </p>
                  </div>
                </div>
                {lang === "en" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLang("so");
                  toast({
                    title: "Luuqadda waxaa loo beddelay Af-Soomaali 🇸🇴",
                    description: "Barta macaamiisha hadda waa Af-Soomaali.",
                  });
                }}
                className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  lang === "so"
                    ? "bg-[#07111F] text-white border-[#C89B3C] shadow-md"
                    : "bg-white text-[#07111F] border-[#E8E1D4] hover:border-[#C89B3C]/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇸🇴</span>
                  <div>
                    <p className="font-serif font-bold text-sm">Somali (Af-Soomaali)</p>
                    <p className={`text-xs ${lang === "so" ? "text-[#D9B45B]" : "text-[#6B7280]"}`}>
                      Barta macaamiisha iyo AI oo Af-Soomaali ah
                    </p>
                  </div>
                </div>
                {lang === "so" && <CheckCircle2 className="h-5 w-5 text-[#D9B45B]" />}
              </button>
            </div>
          </div>

          {/* 2. Personal Profile & Picture Card */}
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  {isSo
                    ? "Xogta Shaqsiga & Sawirka (Personal Details & Picture)"
                    : "Personal Details & Profile Picture"}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {isSo
                    ? "Beddel magacaaga, username-kaaga, lambarkaaga, iyo sawirkaaga."
                    : "Update your username, full name, phone number, and profile picture."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePersonalProfile} className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-[#E8E1D4]">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-[#07111F] border-2 border-[#C89B3C] flex items-center justify-center text-[#D9B45B] font-serif font-black text-2xl overflow-hidden shadow-sm">
                    {profile.image ? (
                      <img
                        src={profile.image}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{profile.name?.charAt(0).toUpperCase() || "C"}</span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="rounded-xl border-[#C89B3C]/40 bg-white text-[#07111F] hover:bg-[#F7F3EA] text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 text-[#C89B3C]" />
                    )}
                    {isSo ? "Beddel Sawirka" : "Change Profile Picture"}
                  </Button>
                  {profile.image && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setProfile((prev) => ({ ...prev, image: "" }))}
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isSo ? "Ka Saar" : "Remove"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                    {isSo ? "Magacaaga Oo Buuxa" : "Full Name"}
                  </Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                    {isSo ? "Username" : "Username"}
                  </Label>
                  <Input
                    value={profile.username}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\s+/g, "");
                      const domain = profile.email.includes("@")
                        ? profile.email.split("@")[1]
                        : "gmail.com";
                      setProfile({
                        ...profile,
                        username: val,
                        email: val.includes("@") ? val : `${val}@${domain}`,
                      });
                    }}
                    required
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                    {isSo ? "Iimaylka (Email)" : "Email Address"}
                  </Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfile({
                        ...profile,
                        email: val,
                        username: val.includes("@") ? val.split("@")[0] : profile.username,
                      });
                    }}
                    required
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                    {isSo ? "Lambarka Telefoonka" : "Phone Number"}
                  </Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+252 61 XXXXXXX"
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 font-bold text-xs gap-2 border-0 cursor-pointer"
              >
                {savingProfile ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {isSo ? "Kaydi Xogta Shaqsiga" : "Save Personal Details"}
              </Button>
            </form>
          </div>

          {/* 3. Security & Password Card */}
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  {isSo ? "Amniga & Erayga Sirta Ah (Security & Password)" : "Security & Password"}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {isSo
                    ? "Cusboonaysii eraygaaga sirta ah si aad u ilaaliso akoonkaaga."
                    : "Update your authentication credentials to protect your account."}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    {isSo ? "Password-ka Hadda" : "Current Password"}
                  </Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    {isSo ? "Password-ka Cusub" : "New Password"}
                  </Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={isSo ? "Ugu yaraan 6 xaraf" : "At least 6 characters"}
                    required
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    {isSo ? "Xaqiiji Password-ka" : "Confirm New Password"}
                  </Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={isSo ? "Ku celi password-ka" : "Repeat new password"}
                    required
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingPassword}
                className="rounded-xl bg-[#07111F] hover:bg-[#112238] text-[#D9B45B] font-bold text-xs gap-2 cursor-pointer"
              >
                {savingPassword ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5 text-[#C89B3C]" />
                )}
                {isSo ? "Beddel Password-ka" : "Change Password"}
              </Button>
            </form>
          </div>

          {/* 4. AI Matching Criteria Card */}
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  {isSo ? "Shuruudaha Talooyinka AI" : "AI Recommendation Parameters"}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {isSo
                    ? "Deji dooqyadaada guryaha si AI-gu kuugu soo xulo guryaha kugu habboon."
                    : "Configure your criteria to tune automated property matches."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    {isSo ? "Magaalada" : "Target City"}
                  </Label>
                  <select
                    value={preferences.preferredCity}
                    onChange={(e) =>
                      setPreferences({ ...preferences, preferredCity: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-xs font-semibold text-[#07111F] h-10"
                  >
                    <option value="Mogadishu">Mogadishu</option>
                    <option value="Hargeisa">Hargeisa</option>
                    <option value="Garowe">Garowe</option>
                    <option value="Bosaso">Bosaso</option>
                    <option value="Kismayo">Kismayo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    {isSo ? "Nooca Guriga" : "Preferred Type"}
                  </Label>
                  <select
                    value={preferences.propertyType}
                    onChange={(e) =>
                      setPreferences({ ...preferences, propertyType: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-xs font-semibold text-[#07111F] h-10"
                  >
                    <option value="VILLA">Villa</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="HOUSE">House</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land Plot</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    {isSo ? "Qolalka Ugu Yar" : "Min Bedrooms"}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={preferences.minBedrooms}
                    onChange={(e) =>
                      setPreferences({ ...preferences, minBedrooms: Number(e.target.value) })
                    }
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    {isSo ? "Miisaaniyadda Ugu Badan (USD)" : "Max Budget (USD)"}
                  </Label>
                  <Input
                    type="number"
                    step="1000"
                    value={preferences.maxBudget}
                    onChange={(e) =>
                      setPreferences({ ...preferences, maxBudget: Number(e.target.value) })
                    }
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    {isSo ? "Bedka Ugu Yar (m²)" : "Min Area (m²)"}
                  </Label>
                  <Input
                    type="number"
                    value={preferences.minArea}
                    onChange={(e) =>
                      setPreferences({ ...preferences, minArea: Number(e.target.value) })
                    }
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white h-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingPrefs}
                className="rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 font-bold text-xs gap-2 border-0 cursor-pointer"
              >
                {savingPrefs ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {isSo ? "Kaydi Dooqyada AI" : "Save AI Preferences"}
              </Button>
            </form>
          </div>

          {/* 5. Notification Preferences Card */}
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  {isSo ? "Ogeysiisyada (Notification Channels)" : "Notification Channels"}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {isSo
                    ? "Maamul ogeysiisyada heshiisyada iyo talooyinka guryaha."
                    : "Control real-time alerts for transaction updates and new listings."}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D4] cursor-pointer">
                <div>
                  <p className="font-bold text-[#07111F]">
                    {isSo
                      ? "Ogeysiisyada Heshiisyada & Ballamaha"
                      : "Transaction & Booking Status Alerts"}
                  </p>
                  <p className="text-[#6B7280] text-[11px]">
                    {isSo
                      ? "Hel ogeysiis marka codsigaaga la ansixiyo ama maamuluhu kuu soo jawaabo."
                      : "Receive instant notifications when requests are approved or managers reply."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyTransactions}
                  onChange={(e) => setNotifyTransactions(e.target.checked)}
                  className="h-4 w-4 accent-[#C89B3C]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D4] cursor-pointer">
                <div>
                  <p className="font-bold text-[#07111F]">
                    {isSo ? "Ogeysiisyada Talooyinka Guryaha (AI)" : "AI Property Match Alerts"}
                  </p>
                  <p className="text-[#6B7280] text-[11px]">
                    {isSo
                      ? "Hel ogeysiis marka guryo cusub oo ku habboon miisaaniyaddaada la soo dhigo."
                      : "Get notified when new verified properties match your target city and budget."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyRecommendations}
                  onChange={(e) => setNotifyRecommendations(e.target.checked)}
                  className="h-4 w-4 accent-[#C89B3C]"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
