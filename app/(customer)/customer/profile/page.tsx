// ================================================================
// PAGE NAME  : Customer Portal — Profile & AI Preferences
// ROUTE      : /customer/profile
// DESCRIPTION: Profile settings and AI match preference criteria
//              Kiro-Maal Real Estate Master Design System
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { User, Settings, Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [preferences, setPreferences] = useState({
    preferredLocation: "Mogadishu",
    minBudget: 20000,
    maxBudget: 100000,
    preferredType: "HOUSE",
    preferredBedrooms: 3,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/user/preferences");
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.user) {
            setProfile({ name: data.data.user.name || "", phone: data.data.user.phone || "" });
          }
          if (data.data.preferences) {
            setPreferences({
              preferredLocation: data.data.preferences.preferredLocation || "Mogadishu",
              minBudget: data.data.preferences.minBudget || 20000,
              maxBudget: data.data.preferences.maxBudget || 100000,
              preferredType: data.data.preferences.preferredType || "HOUSE",
              preferredBedrooms: data.data.preferences.preferredBedrooms || 3,
            });
          }
        }
      } catch {
        toast({ title: "Error", description: "Failed to load preferences.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const [profileRes, prefRes] = await Promise.all([
        fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        }),
        fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
        }),
      ]);

      const [profData, prefData] = await Promise.all([profileRes.json(), prefRes.json()]);

      if (profileRes.ok && prefRes.ok) {
        toast({ title: "Profile & Preferences Saved! 🎉", description: "Your details and AI match settings have been updated." });
      } else {
        toast({ title: "Update Notice", description: profData.error || prefData.error || "Some details could not be updated.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Account Settings
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-[#C89B3C]" /> Client Profile &amp; AI Matching Parameters
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Configure your personal preferences to power automated AI property recommendations.</p>
      </div>

      {loading ? (
        <div className="p-16 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
          <p className="font-serif font-bold text-[#07111F] text-base">Loading Client Profile...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Card */}
          <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6 space-y-4">
            <h2 className="text-base font-serif font-bold text-[#07111F] flex items-center gap-2 border-b border-[#E8E1D4] pb-3">
              <User className="h-4 w-4 text-[#C89B3C]" /> Account Credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Full Name</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your Full Name"
                  required
                  className="bg-white border-[#E8E1D4] text-[#07111F]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Phone Number</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="bg-white border-[#E8E1D4] text-[#07111F]"
                  placeholder="+252 61 XXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* AI Match Preferences Card */}
          <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6 space-y-4">
            <h2 className="text-base font-serif font-bold text-[#07111F] flex items-center gap-2 border-b border-[#E8E1D4] pb-3">
              <Sparkles className="h-4 w-4 text-[#C89B3C]" /> AI Property Match Criteria
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Preferred City</Label>
                <Select
                  value={preferences.preferredLocation}
                  onValueChange={(val) => setPreferences((p) => ({ ...p, preferredLocation: val }))}
                >
                  <SelectTrigger className="h-10 border-[#E8E1D4] rounded-xl bg-white text-[#07111F] text-xs focus:ring-1 focus:ring-[#C89B3C]">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                    {["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Garowe", "Baydhabo"].map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Property Type</Label>
                <Select
                  value={preferences.preferredType}
                  onValueChange={(val) => setPreferences((p) => ({ ...p, preferredType: val as any }))}
                >
                  <SelectTrigger className="h-10 border-[#E8E1D4] rounded-xl bg-white text-[#07111F] text-xs focus:ring-1 focus:ring-[#C89B3C]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                    {["HOUSE", "APARTMENT", "VILLA", "OFFICE", "COMMERCIAL", "STUDIO"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Minimum Budget ($)</Label>
                <Input
                  type="number"
                  value={preferences.minBudget}
                  onChange={(e) => setPreferences((p) => ({ ...p, minBudget: Number(e.target.value) }))}
                  className="h-10 border-[#E8E1D4] bg-white rounded-xl text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Maximum Budget ($)</Label>
                <Input
                  type="number"
                  value={preferences.maxBudget}
                  onChange={(e) => setPreferences((p) => ({ ...p, maxBudget: Number(e.target.value) }))}
                  className="h-10 border-[#E8E1D4] bg-white rounded-xl text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Preferred Bedrooms</Label>
                <Input
                  type="number"
                  value={preferences.preferredBedrooms}
                  onChange={(e) => setPreferences((p) => ({ ...p, preferredBedrooms: Number(e.target.value) }))}
                  className="h-10 border-[#E8E1D4] bg-white rounded-xl text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold px-6 shadow-sm border-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save AI Preferences
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
