// ================================================================
// PAGE NAME  : Customer Portal — Profile & AI Preferences
// ROUTE      : /customer/profile
// DESCRIPTION: Profile settings and AI match preference criteria
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
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Preferences Saved! 🎉", description: "Your AI property recommendations have been updated." });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <Settings className="h-6 w-6 text-[#10B981]" /> Customer Profile & AI Preferences
        </h1>
        <p className="text-[#64748B] text-sm mt-1">Configure your personal preferences to power AI recommendations.</p>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E2E8F0] text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
          <p className="text-sm font-semibold text-[#0F172A]">Loading customer profile...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6 space-y-4">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <User className="h-4 w-4 text-[#10B981]" /> Account Info
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0F172A]">Full Name</Label>
                <Input value={profile.name} disabled className="bg-[#F8FAFC] border-[#E2E8F0]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0F172A]">Phone Number</Label>
                <Input value={profile.phone} disabled className="bg-[#F8FAFC] border-[#E2E8F0]" placeholder="No phone saved" />
              </div>
            </div>
          </div>

          {/* AI Match Preferences Card */}
          <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6 space-y-4">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Sparkles className="h-4 w-4 text-[#0891B2]" /> AI Property Match Criteria
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0F172A]">Preferred City</Label>
                <Select
                  value={preferences.preferredLocation}
                  onValueChange={(val) => setPreferences((p) => ({ ...p, preferredLocation: val }))}
                >
                  <SelectTrigger className="h-10 border-[#E2E8F0] rounded-xl bg-white text-[#0F172A]">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0]">
                    {["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Garowe", "Baydhabo"].map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0F172A]">Property Type</Label>
                <Select
                  value={preferences.preferredType}
                  onValueChange={(val) => setPreferences((p) => ({ ...p, preferredType: val as any }))}
                >
                  <SelectTrigger className="h-10 border-[#E2E8F0] rounded-xl bg-white text-[#0F172A]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0]">
                    {["HOUSE", "APARTMENT", "VILLA", "OFFICE", "COMMERCIAL", "STUDIO"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0F172A]">Minimum Budget ($)</Label>
                <Input
                  type="number"
                  value={preferences.minBudget}
                  onChange={(e) => setPreferences((p) => ({ ...p, minBudget: Number(e.target.value) }))}
                  className="h-10 border-[#E2E8F0] rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0F172A]">Maximum Budget ($)</Label>
                <Input
                  type="number"
                  value={preferences.maxBudget}
                  onChange={(e) => setPreferences((p) => ({ ...p, maxBudget: Number(e.target.value) }))}
                  className="h-10 border-[#E2E8F0] rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#0F172A]">Preferred Bedrooms</Label>
                <Input
                  type="number"
                  value={preferences.preferredBedrooms}
                  onChange={(e) => setPreferences((p) => ({ ...p, preferredBedrooms: Number(e.target.value) }))}
                  className="h-10 border-[#E2E8F0] rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-2 font-semibold px-6"
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
