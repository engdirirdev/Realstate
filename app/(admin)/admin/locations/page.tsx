// ================================================================
// PAGE NAME  : Admin Dashboard — Locations & Regions
// ROUTE      : /admin/locations
// DESCRIPTION: Manage regional locations and cities
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Globe, Loader2, Sparkles, Pencil } from "lucide-react";
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

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [editForm, setEditForm] = useState({ city: "", region: "", country: "Somalia" });
  const [updating, setUpdating] = useState(false);

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

  const openEditModal = (loc: LocationItem) => {
    setEditingLocation(loc);
    setEditForm({ city: loc.city, region: loc.region, country: loc.country });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !editForm.city || !editForm.region) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLocation.id,
          city: editForm.city,
          region: editForm.region,
          country: editForm.country,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Location Updated ✨", description: `Updated ${editForm.city}, ${editForm.region}.` });
        setEditModalOpen(false);
        setEditingLocation(null);
        fetchLocations();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update location." });
    } finally {
      setUpdating(false);
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
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Geographic Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <MapPin className="h-7 w-7 text-[#C89B3C]" /> Manage Locations &amp; Regions
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">Configure supported Somali cities, regions, and geographic market areas.</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold shadow-sm border-0"
        >
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </div>

      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
            <p className="text-sm font-medium">Loading supported geographic locations...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
              <tr>
                <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">City</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Region / State</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Country</th>
                <th className="text-right px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E1D4]">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-[#07111F] flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#C89B3C]" /> {loc.city}
                  </td>
                  <td className="px-4 py-4 text-[#6B7280] text-xs font-semibold">{loc.region}</td>
                  <td className="px-4 py-4 text-[#6B7280] text-xs">{loc.country}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => openEditModal(loc)}
                        variant="outline"
                        size="sm"
                        className="h-8 border-[#C89B3C]/40 text-[#07111F] bg-[#FCFBF7] hover:bg-[#F7F3EA] hover:border-[#C89B3C] rounded-xl font-medium shadow-xs"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1 text-[#C89B3C]" /> Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(loc.id, loc.city)}
                        variant="outline"
                        size="sm"
                        className="h-8 border-[#E8E1D4] text-[#DC2626] hover:bg-red-50 hover:border-red-200 rounded-xl"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Location Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 border border-[#E8E1D4] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F]">Add Geographic Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">City Name</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Mogadishu"
                required
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Region / State</Label>
              <Input
                value={form.region}
                onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
                placeholder="e.g. Banaadir"
                required
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Country</Label>
              <Input
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                placeholder="Somalia"
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]">Cancel</Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm"
              >
                {submitting ? "Saving..." : "Save Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 border border-[#E8E1D4] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <Pencil className="h-5 w-5 text-[#C89B3C]" /> Edit Geographic Location
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">City Name</Label>
              <Input
                value={editForm.city}
                onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Mogadishu"
                required
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Region / State</Label>
              <Input
                value={editForm.region}
                onChange={(e) => setEditForm((p) => ({ ...p, region: e.target.value }))}
                placeholder="e.g. Banaadir"
                required
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Country</Label>
              <Input
                value={editForm.country}
                onChange={(e) => setEditForm((p) => ({ ...p, country: e.target.value }))}
                placeholder="Somalia"
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingLocation(null);
                }}
                className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updating}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm"
              >
                {updating ? "Saving Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
