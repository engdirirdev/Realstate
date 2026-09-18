// ================================================================
// PAGE NAME  : User Dashboard — Profile Settings
// ROUTE      : /dashboard/profile
// DESCRIPTION: User can update name, phone number and set their
//              AI preferences (city, property type, budget, etc.)
//              which drive the recommendation engine
// ROLE       : USER only
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Save, Loader2, CheckCircle2 } from "lucide-react";
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-gray-600" /> Profile Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Update your account info and AI recommendation preferences
        </p>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Account Information</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="input-field"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              value={session?.user?.email || ""}
              disabled
              className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="input-field"
              placeholder="+252 61 234 5678"
            />
          </div>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {loading ? "Saving..." : saved ? "Saved!" : "Save Profile"}
          </Button>
        </form>
      </div>

      {/* AI Preferences */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">AI Recommendation Preferences</h2>
        <p className="text-gray-500 text-sm mb-5">
          Help our AI find properties that match exactly what you're looking for.
        </p>
        <form onSubmit={savePreferences} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred City</label>
              <select
                value={prefs.preferredCity}
                onChange={(e) => setPrefs({ ...prefs, preferredCity: e.target.value })}
                className="input-field"
              >
                <option value="">Any city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type</label>
              <select
                value={prefs.propertyType}
                onChange={(e) => setPrefs({ ...prefs, propertyType: e.target.value })}
                className="input-field"
              >
                <option value="">Any type</option>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Bedrooms</label>
              <input
                type="number"
                min={0}
                max={10}
                value={prefs.minBedrooms}
                onChange={(e) => setPrefs({ ...prefs, minBedrooms: +e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Budget ($)</label>
              <input
                type="number"
                min={0}
                value={prefs.maxBudget}
                onChange={(e) => setPrefs({ ...prefs, maxBudget: +e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Area (m²)</label>
              <input
                type="number"
                min={0}
                value={prefs.minArea}
                onChange={(e) => setPrefs({ ...prefs, minArea: +e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <Button type="submit" disabled={prefLoading} variant="outline" className="gap-2">
            {prefLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : prefSaved ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Save className="h-4 w-4" />}
            {prefLoading ? "Saving..." : prefSaved ? "Preferences Saved!" : "Save Preferences"}
          </Button>
        </form>
      </div>
    </div>
  );
}
