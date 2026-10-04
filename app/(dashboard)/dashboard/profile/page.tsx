// ================================================================
// PAGE NAME  : User Dashboard — Profile Settings
// ROUTE      : /dashboard/profile
// DESCRIPTION: User can update name, phone number and set their
//              AI preferences (city, property type, budget, etc.)
//              which drive the recommendation engine
//              Kiro-Maal Real Estate Master Design System
// ROLE       : USER only
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Save, Loader2, CheckCircle2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const CITIES = ["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Garowe", "Baydhabo", "Berbera"];
const TYPES = [
  { value: "HOUSE", label: "House" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "VILLA", label: "Villa" },
  { value: "STUDIO", label: "Studio" },
  { value: "OFFICE", label: "Office" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "LAND", label: "Land" },
  { value: "TOWNHOUSE", label: "Townhouse" },
];

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [prefs, setPrefs] = useState({
    preferredCity: "",
    propertyType: "",
    minBedrooms: 1,
    maxBudget: 100000,
    minArea: 50,
  });

  useEffect(() => {
    if (session?.user) {
      setProfile({ name: session.user.name || "", phone: (session.user as any).phone || "" });
    }
    // Fetch current preferences
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.preferences) {
          const p = d.preferences;
          setPrefs({
            preferredCity: p.preferredCity ?? "",
            propertyType: p.propertyType ?? "",
            minBedrooms: p.minBedrooms ?? 1,
            maxBudget: p.maxBudget ?? 100000,
            minArea: p.minArea ?? 50,
          });
        }
      })
      .catch(() => {});
  }, [session]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally { setLoading(false); }
  };

  const savePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefLoading(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) { setPrefSaved(true); setTimeout(() => setPrefSaved(false), 3000); }
    } finally { setPrefLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Advisor Identity
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-[#C89B3C]" /> Manager Account &amp; Preferences
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Update your professional credentials and configure algorithmic property recommendations.
        </p>
      </div>

      {/* Profile form */}
      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6 space-y-4">
        <h2 className="font-serif font-bold text-[#07111F] text-base flex items-center gap-2 border-b border-[#E8E1D4] pb-3">
          <User className="h-4 w-4 text-[#C89B3C]" /> Account Information
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Full Name</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] outline-none"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Email Address</label>
            <input
              value={session?.user?.email || ""}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA] text-[#6B7280] text-sm cursor-not-allowed"
            />
            <p className="text-[10px] text-[#A97918] mt-1 font-medium">Registered account email cannot be altered directly.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Contact Phone</label>
            <input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] outline-none"
              placeholder="+252 61 234 5678"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl font-bold shadow-sm border-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {loading ? "Saving..." : saved ? "Credentials Saved!" : "Save Profile"}
          </Button>
        </form>
      </div>

      {/* AI Preferences */}
      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6 space-y-4">
        <h2 className="font-serif font-bold text-[#07111F] text-base flex items-center gap-2 border-b border-[#E8E1D4] pb-3">
          <Sparkles className="h-4 w-4 text-[#C89B3C]" /> Recommendation Engine Parameters
        </h2>
        <p className="text-[#6B7280] text-xs">
          Guide the Kiro-Maal AI engine to curate property listings that match your advisory portfolio.
        </p>
        <form onSubmit={savePreferences} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Preferred Market City</label>
              <select
                value={prefs.preferredCity}
                onChange={(e) => setPrefs({ ...prefs, preferredCity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] outline-none"
              >
                <option value="">Any city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Property Type</label>
              <select
                value={prefs.propertyType}
                onChange={(e) => setPrefs({ ...prefs, propertyType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] outline-none"
              >
                <option value="">Any type</option>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Min Bedrooms</label>
              <input
                type="number"
                min={0}
                max={10}
                value={prefs.minBedrooms}
                onChange={(e) => setPrefs({ ...prefs, minBedrooms: +e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Max Budget ($)</label>
              <input
                type="number"
                min={0}
                value={prefs.maxBudget}
                onChange={(e) => setPrefs({ ...prefs, maxBudget: +e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Min Area (m²)</label>
              <input
                type="number"
                min={0}
                value={prefs.minArea}
                onChange={(e) => setPrefs({ ...prefs, minArea: +e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] outline-none"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={prefLoading}
            className="gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl font-bold shadow-sm border-0"
          >
            {prefLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : prefSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {prefLoading ? "Saving..." : prefSaved ? "Preferences Saved!" : "Save Preferences"}
          </Button>
        </form>
      </div>
    </div>
  );
}
