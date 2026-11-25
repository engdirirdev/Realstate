// ================================================================
// PAGE NAME  : Customer Portal — Personal Profile & Credentials
// ROUTE      : /customer/profile
// DESCRIPTION: Full personal profile editor: Profile Picture,
//              Username, Full Name, Email, Phone, Password,
//              Language (English & Somali), and AI Match Criteria
// ================================================================
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  Sparkles,
  Loader2,
  Check,
  Camera,
  Lock,
  Globe,
  Trash2,
  KeyRound,
  Mail,
  Phone,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SomaliPhoneInput } from "@/components/ui/SomaliPhoneInput";
import { validateSomaliPhone, validateStrongPassword } from "@/lib/validation";
import { toast } from "@/hooks/use-toast";
import { usePortalLanguage, PortalLanguage } from "@/lib/customer-i18n";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [lang, setLang] = usePortalLanguage();
  const isSo = lang === "so";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    image: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const profRes = await fetch("/api/user/profile");
        const profJson = await profRes.json();

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
      } catch {
        toast({
          title: isSo ? "Cilad" : "Error",
          description: isSo ? "Lama soo rari karin xogtaada." : "Failed to load profile details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isSo]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: isSo ? "Sawirku aad buu u weyn yahay" : "File too large",
        description: isSo ? "Sawirku waa inuu ka yaraadaa 10MB." : "Please select an image under 10MB.",
        variant: "destructive",
      });
      return;
    }

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
          description: isSo ? "Guji Save si aad u kaydiso." : "Click Save All Changes to apply your new photo.",
        });
      } else {
        // Fallback to instant base64 data URL if local storage upload fails
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.newPassword) {
      if (passwords.newPassword !== passwords.confirmPassword) {
        toast({
          title: isSo ? "Erayga sirta ah isma laha" : "Passwords do not match",
          description: isSo
            ? "Erayga sirta ah ee cusub iyo xaqiijinta waa inay isku mid noqdaan."
            : "New password and confirmation password must match.",
          variant: "destructive",
        });
        return;
      }
      const pwdCheck = validateStrongPassword(passwords.newPassword);
      if (!pwdCheck.valid) {
        toast({
          title: isSo ? "Erayga sirta ah waa daciif" : "Weak Password",
          description: pwdCheck.error,
          variant: "destructive",
        });
        return;
      }
    }

    const phoneCheck = validateSomaliPhone(profile.phone, { required: false });
    if (!phoneCheck.valid) {
      toast({
        title: isSo ? "Lambar Khaldan" : "Invalid Phone Number",
        description: phoneCheck.error,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const domain = profile.email.includes("@") ? profile.email.split("@")[1] : "gmail.com";
      const finalEmail =
        profile.username && !profile.username.includes("@")
          ? `${profile.username.trim()}@${domain}`
          : profile.email.trim();

      const profileRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: finalEmail,
          username: profile.username,
          phone: profile.phone,
          image: profile.image,
          currentPassword: passwords.currentPassword || undefined,
          newPassword: passwords.newPassword || undefined,
        }),
      });

      const profData = await profileRes.json();

      if (profileRes.ok && profData.success) {
        if (profData.user) {
          setProfile((prev) => ({
            ...prev,
            name: profData.user.name,
            email: profData.user.email,
            username: profData.user.username || profData.user.email.split("@")[0],
            phone: profData.user.phone || "",
            image: profData.user.image || "",
          }));
        }
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        await updateSession({
          name: profile.name,
          image: profile.image,
        }).catch(() => {});
        router.refresh();
        toast({
          title: isSo ? "Xogtaada Waa La Kaydiyay! 🎉" : "Profile Updated Successfully! 🎉",
          description: isSo
            ? "Dhammaan xogtaada shaqsiga ah iyo sawirkaaga waa la cusboonaysiiyay."
            : "Your personal details and profile picture have been saved.",
        });
      } else {
        toast({
          title: isSo ? "Cilad" : "Update Error",
          description: profData.error || "Could not update profile.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: isSo ? "Cilad" : "Error",
        description: isSo ? "Lama kaydin karin xogta." : "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />{" "}
            {isSo ? "Xogta Macaamiisha" : "Personal Identity & Account"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <User className="h-7 w-7 text-[#C89B3C]" />{" "}
            {isSo ? "Xogta Shaqsiga (My Profile)" : "My Personal Profile"}
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {isSo
              ? "Halkan ka beddel sawirkaaga, magacaaga, username-kaaga, iyo lambarka sirta ah."
              : "Update your profile picture, username, full name, and password."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
          <p className="font-serif font-bold text-[#07111F] text-base">
            {isSo ? "Xogtaada waa la soo rarayaa..." : "Loading Client Profile..."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Profile Picture & Identity Card */}
          <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6 space-y-5">
            <h2 className="text-base font-serif font-bold text-[#07111F] flex items-center gap-2 border-b border-[#E8E1D4] pb-3">
              <Camera className="h-4 w-4 text-[#C89B3C]" />{" "}
              {isSo ? "Sawirka Profile-ka & Aqoonsiga" : "Profile Picture & Personal Details"}
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-[#E8E1D4]">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#07111F] to-[#112238] border-2 border-[#C89B3C] flex items-center justify-center text-[#D9B45B] font-serif font-black text-3xl overflow-hidden shadow-md">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{profile.name?.charAt(0).toUpperCase() || "C"}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer"
                  title="Upload new picture"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <h3 className="font-serif font-bold text-lg text-[#07111F]">
                  {profile.name || "Customer"}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  @{profile.username || "customer"} • {profile.email}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="h-8 rounded-xl border-[#C89B3C]/40 bg-white text-[#07111F] hover:bg-[#F7F3EA] text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5 text-[#C89B3C]" />
                    {isSo ? "Dooro Sawir Cusub" : "Upload Photo"}
                  </Button>
                  {profile.image && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setProfile((prev) => ({ ...prev, image: "" }))}
                      className="h-8 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isSo ? "Ka Saar" : "Remove"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Details Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                  {isSo ? "Magacaaga Oo Buuxa (Full Name)" : "Full Name"}
                </Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder={isSo ? "Magacaaga oo buuxa" : "Your Full Name"}
                  required
                  className="bg-white border-[#E8E1D4] text-[#07111F] rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F] flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                  {isSo ? "Magaca Isticmaalaha (Username)" : "Username"}
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
                  placeholder="username"
                  required
                  className="bg-white border-[#E8E1D4] text-[#07111F] rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F] flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                  {isSo ? "Iimaylka (Email Address)" : "Email Address"}
                </Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => {
                    const emailVal = e.target.value;
                    setProfile({
                      ...profile,
                      email: emailVal,
                      username: emailVal.includes("@") ? emailVal.split("@")[0] : profile.username,
                    });
                  }}
                  placeholder="name@example.com"
                  required
                  className="bg-white border-[#E8E1D4] text-[#07111F] rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F] flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                  {isSo ? "Lambarka Mobaylka (Phone Number)" : "Phone Number"}
                </Label>
                <SomaliPhoneInput
                  value={profile.phone}
                  onChange={(val) => setProfile({ ...profile, phone: val })}
                  placeholder="612345678"
                />
              </div>
            </div>
          </div>

          {/* 2. Password & Security Card */}
          <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6 space-y-4">
            <h2 className="text-base font-serif font-bold text-[#07111F] flex items-center gap-2 border-b border-[#E8E1D4] pb-3">
              <Lock className="h-4 w-4 text-[#C89B3C]" />{" "}
              {isSo ? "Beddel Erayga Sirta Ah (Change Password)" : "Change Password"}
            </h2>
            <p className="text-xs text-[#6B7280]">
              {isSo
                ? "Buuxi qaybtan haddii aad rabto inaad beddesho eraygaaga sirta ah (Password)."
                : "Fill in these fields anytime you want to update your account password."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  {isSo ? "Password-ka Hadda" : "Current Password"}
                </Label>
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  className="bg-white border-[#E8E1D4] text-[#07111F] rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  {isSo ? "Password-ka Cusub" : "New Password"}
                </Label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder={isSo ? "Ugu yaraan 6 xaraf" : "At least 6 characters"}
                  className="bg-white border-[#E8E1D4] text-[#07111F] rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  {isSo ? "Xaqiiji Password-ka" : "Confirm New Password"}
                </Label>
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  placeholder={isSo ? "Ku celi password-ka" : "Repeat new password"}
                  className="bg-white border-[#E8E1D4] text-[#07111F] rounded-xl h-10"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold px-6 h-11 shadow-sm border-0 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isSo ? "Kaydi Dhammaan Isbeddellada" : "Save All Changes"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
