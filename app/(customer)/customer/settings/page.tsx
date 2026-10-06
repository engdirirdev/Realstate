"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Lock,
  Sparkles,
  Bell,
  Shield,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function CustomerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyTransactions, setNotifyTransactions] = useState(true);
  const [notifyRecommendations, setNotifyRecommendations] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/user/preferences");
        const json = await res.json();
        if (json.success && json.preferences) {
          setPreferences({
            preferredCity: json.preferences.preferredCity || "Mogadishu",
            propertyType: json.preferences.propertyType || "VILLA",
            minBedrooms: json.preferences.minBedrooms || 3,
            maxBudget: json.preferences.maxBudget || 150000,
            minArea: json.preferences.minArea || 120,
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "New password and confirmation password do not match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters.",
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
        toast({ title: "Password updated successfully! 🔒" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Failed to update password.", variant: "destructive" });
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
          title: "Preferences saved! ✨",
          description: "Your property recommendations and alerts will reflect your preferences.",
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
    <div className="space-y-6 max-w-4xl bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Account Controls
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-[#C89B3C]" /> Account Settings
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Manage your password security, AI recommendation criteria, and portal notifications.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <Loader2 className="h-6 w-6 animate-spin text-[#C89B3C]" />
          <span className="text-sm text-[#6B7280]">Loading settings...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Security & Password Card */}
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  Security &amp; Password
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Update your authentication credentials to protect your investments.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07111F]">Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-xl border-[#E8E1D4] text-xs bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07111F]">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="rounded-xl border-[#E8E1D4] text-xs bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07111F]">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="rounded-xl border-[#E8E1D4] text-xs bg-white"
                />
              </div>

              <Button
                type="submit"
                disabled={savingPassword}
                className="rounded-xl bg-[#07111F] hover:bg-[#112238] text-[#D9B45B] font-bold text-xs gap-2"
              >
                {savingPassword ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5 text-[#C89B3C]" />
                )}
                Change Password
              </Button>
            </form>
          </div>

          {/* AI Matching Criteria Card */}
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  AI Recommendation Parameters
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Configure your criteria to tune automated property matches.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Target City</Label>
                  <select
                    value={preferences.preferredCity}
                    onChange={(e) => setPreferences({ ...preferences, preferredCity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-xs font-semibold text-[#07111F]"
                  >
                    <option value="Mogadishu">Mogadishu</option>
                    <option value="Hargeisa">Hargeisa</option>
                    <option value="Garowe">Garowe</option>
                    <option value="Bosaso">Bosaso</option>
                    <option value="Kismayo">Kismayo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Preferred Type</Label>
                  <select
                    value={preferences.propertyType}
                    onChange={(e) => setPreferences({ ...preferences, propertyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-xs font-semibold text-[#07111F]"
                  >
                    <option value="VILLA">Villa</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="HOUSE">House</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land Plot</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Min Bedrooms</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={preferences.minBedrooms}
                    onChange={(e) => setPreferences({ ...preferences, minBedrooms: Number(e.target.value) })}
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Max Budget (USD)</Label>
                  <Input
                    type="number"
                    step="1000"
                    value={preferences.maxBudget}
                    onChange={(e) => setPreferences({ ...preferences, maxBudget: Number(e.target.value) })}
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Min Area (m²)</Label>
                  <Input
                    type="number"
                    value={preferences.minArea}
                    onChange={(e) => setPreferences({ ...preferences, minArea: Number(e.target.value) })}
                    className="rounded-xl border-[#E8E1D4] text-xs bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={savingPrefs}
                  className="rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold text-xs gap-1.5 border-0 shadow-xs"
                >
                  {savingPrefs ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Save AI Preferences
                </Button>
              </div>
            </form>
          </div>

          {/* Notifications Card */}
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E1D4]">
              <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  Notification Preferences
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Configure your communication frequency and alert channels.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-w-lg">
              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA] cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-[#07111F]">Transaction &amp; Lease Alerts</p>
                  <p className="text-[11px] text-[#6B7280]">
                    Real-time status updates on approvals, rental dates, and payments
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyTransactions}
                  onChange={(e) => {
                    setNotifyTransactions(e.target.checked);
                    toast({ title: "Notification preference saved" });
                  }}
                  className="h-4 w-4 rounded accent-[#C89B3C]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA] cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-[#07111F]">AI Property Match Alerts</p>
                  <p className="text-[11px] text-[#6B7280]">
                    Receive instant notifications when new properties match your criteria
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyRecommendations}
                  onChange={(e) => {
                    setNotifyRecommendations(e.target.checked);
                    toast({ title: "Notification preference saved" });
                  }}
                  className="h-4 w-4 rounded accent-[#C89B3C]"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
