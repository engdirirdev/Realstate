// ================================================================
// PAGE NAME  : Admin Dashboard — System Settings
// ROUTE      : /admin/settings
// DESCRIPTION: Platform configuration and system parameters
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { Settings, Save, ShieldCheck, Mail, Globe, Cpu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    site_name: "AI RealEstate Somalia",
    contact_email: "support@realestate.so",
    currency: "USD",
    auto_approve_properties: false,
    enable_ai_chat: true,
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setForm((prev) => ({
          ...prev,
          ...data.settings,
          auto_approve_properties: data.settings.auto_approve_properties === "true",
          enable_ai_chat: data.settings.enable_ai_chat !== "false",
        }));
      }
    } catch {
      toast({ title: "Error", description: "Failed to load settings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
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
        toast({ title: "Settings Saved 🎉", description: "Platform configuration updated successfully." });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <Settings className="h-6 w-6 text-[#10B981]" /> System Settings
        </h1>
        <p className="text-[#64748B] text-sm mt-1">Configure global application parameters, AI settings, and security policies.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#10B981]" />
          <p className="text-sm font-medium">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          <div className="bg-white p-6 rounded-2xl shadow-card border border-[#E2E8F0] space-y-4">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Globe className="h-4 w-4 text-[#10B981]" /> General Settings
            </h2>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Platform Name</Label>
              <Input
                value={form.site_name}
                onChange={(e) => setForm((p) => ({ ...p, site_name: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Support Contact Email</Label>
              <Input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Default Platform Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className="rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card border border-[#E2E8F0] space-y-4">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <ShieldCheck className="h-4 w-4 text-[#10B981]" /> Approval &amp; AI Security Controls
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#0F172A]">Auto-Approve Property Listings</p>
                <p className="text-xs text-[#64748B]">Bypasses Admin approval workflow when Managers create listings.</p>
              </div>
              <Switch
                checked={form.auto_approve_properties}
                onCheckedChange={(val) => setForm((p) => ({ ...p, auto_approve_properties: val }))}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
              <div>
                <p className="text-sm font-bold text-[#0F172A]">Enable Universal AI Floating Chatbot</p>
                <p className="text-xs text-[#64748B]">Shows AI Real Estate Assistant across all client portals.</p>
              </div>
              <Switch
                checked={form.enable_ai_chat}
                onCheckedChange={(val) => setForm((p) => ({ ...p, enable_ai_chat: val }))}
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-2 font-semibold px-6">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </Button>
        </form>
      )}
    </div>
  );
}
