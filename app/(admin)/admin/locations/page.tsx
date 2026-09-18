// ================================================================
// PAGE NAME  : Admin Dashboard — Locations & Regions
// ROUTE      : /admin/locations
// DESCRIPTION: Manage regional locations and cities
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface LocationItem {
  id: string;
  city: string;
  region: string;
  country: string;
  createdAt: string;
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ city: "", region: "", country: "Somalia" });

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/admin/locations");
      const data = await res.json();
      if (data.success) setLocations(data.locations);
    } catch {
      toast({ title: "Error", description: "Failed to load locations.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city || !form.region) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Location Added 🎉", description: `Added ${form.city}, ${form.region}.` });
        setModalOpen(false);
        setForm({ city: "", region: "", country: "Somalia" });
        fetchLocations();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to add location." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, city: string) => {
    try {
      const res = await fetch(`/api/admin/locations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Deleted", description: `Removed ${city}.` });
        setLocations((prev) => prev.filter((l) => l.id !== id));
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete location." });
    }
  };

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
            <MapPin className="h-6 w-6 text-[#10B981]" /> Manage Locations &amp; Regions
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Configure supported cities, regions, and geographic locations.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#10B981]" />
            <p className="text-sm font-medium">Loading locations...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-[#64748B]">City</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Region / State</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Country</th>
                <th className="text-right px-5 py-3.5 font-semibold text-[#64748B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-5 py-4 font-bold text-[#0F172A] flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#10B981]" /> {loc.city}
                  </td>
                  <td className="px-4 py-4 text-[#64748B] text-xs font-semibold">{loc.region}</td>
                  <td className="px-4 py-4 text-[#64748B] text-xs">{loc.country}</td>
                  <td className="px-5 py-4 text-right">
                    <Button onClick={() => handleDelete(loc.id, loc.city)} variant="outline" size="sm" className="h-8 border-[#FCA5A5] text-[#DC2626] rounded-lg">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border border-[#E2E8F0]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0F172A]">Add Geographic Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">City Name</Label>
              <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="e.g. Mogadishu" required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Region / State</Label>
              <Input value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} placeholder="e.g. Banaadir" required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Country</Label>
              <Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="Somalia" className="rounded-xl" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl">
                {submitting ? "Saving..." : "Save Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
