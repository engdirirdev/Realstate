// ================================================================
// PAGE NAME  : Admin Dashboard — System Settings
// ROUTE      : /admin/settings
// DESCRIPTION: Platform configuration and system parameters
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { Settings, Save, ShieldCheck, Mail, Globe, Cpu, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    site_name: "Kiro-Maal Real Estate",
    contact_email: "support@kiromaal.com",
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
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Core Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-[#C89B3C]" /> System Architecture &amp; Governance
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Configure global platform parameters, AI model endpoints, and validation controls.</p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3 max-w-lg mx-auto bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
          <p className="text-sm font-medium">Loading system configurations...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          <div className="bg-[#FCFBF7] p-6 rounded-2xl shadow-sm border border-[#E8E1D4] space-y-4">
            <h2 className="text-base font-serif font-bold text-[#07111F] flex items-center gap-2 border-b border-[#E8E1D4] pb-3">
              <Globe className="h-4 w-4 text-[#C89B3C]" /> General Brand Parameters
            </h2>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Platform Brand Name</Label>
              <Input
                value={form.site_name}
                onChange={(e) => setForm((p) => ({ ...p, site_name: e.target.value }))}
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Concierge Email</Label>
              <Input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Default Settlement Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className="rounded-xl font-mono border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
          </div>

          <div className="bg-[#FCFBF7] p-6 rounded-2xl shadow-sm border border-[#E8E1D4] space-y-4">
            <h2 className="text-base font-serif font-bold text-[#07111F] flex items-center gap-2 border-b border-[#E8E1D4] pb-3">
              <ShieldCheck className="h-4 w-4 text-[#C89B3C]" /> Approval &amp; AI Security Controls
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#07111F]">Auto-Publish Property Listings</p>
                <p className="text-xs text-[#6B7280]">Bypasses administrative review workflow when Managers submit properties.</p>
              </div>
              <Switch
                checked={form.auto_approve_properties}
                onCheckedChange={(val) => setForm((p) => ({ ...p, auto_approve_properties: val }))}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E8E1D4]">
              <div>
                <p className="text-sm font-semibold text-[#07111F]">Enable Global Floating AI Concierge</p>
                <p className="text-xs text-[#6B7280]">Displays Kiro-Maal AI Floating Assistant pill across all public and client views.</p>
              </div>
              <Switch
                checked={form.enable_ai_chat}
                onCheckedChange={(val) => setForm((p) => ({ ...p, enable_ai_chat: val }))}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold px-6 shadow-sm border-0"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </Button>
        </form>
      )}
    </div>
  );
}
