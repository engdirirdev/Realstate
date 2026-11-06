"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2, Globe, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export interface LocationItem {
  id: string;
  city: string;
  region: string;
  country: string;
  createdAt: string;
}

interface AdminLocationsClientProps {
  initialLocations: LocationItem[];
}

function AdminLocationsClient({ initialLocations = [] }: AdminLocationsClientProps) {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ city: "", region: "", country: "Somalia" });

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [editForm, setEditForm] = useState({ city: "", region: "", country: "Somalia" });
  const [updating, setUpdating] = useState(false);

  // Sync with SSR updates or router revalidations
  useEffect(() => {
    if (initialLocations) {
      setLocations(initialLocations);
    }
  }, [initialLocations]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city.trim() || !form.region.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success && data.location) {
        toast({ title: "Location Added 🎉", description: `Added ${form.city}, ${form.region}.` });
        setLocations((prev) => [
          ...prev,
          {
            id: data.location.id,
            city: data.location.city,
            region: data.location.region,
            country: data.location.country,
            createdAt: data.location.createdAt || new Date().toISOString(),
          },
        ].sort((a, b) => a.city.localeCompare(b.city)));
        setModalOpen(false);
        setForm({ city: "", region: "", country: "Somalia" });
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error || "Failed to add location", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to add location." });
    } finally {
      setSubmitting(false);
    }
  }, [form, router]);

  const openEditModal = useCallback((loc: LocationItem) => {
    setEditingLocation(loc);
    setEditForm({ city: loc.city, region: loc.region, country: loc.country });
    setEditModalOpen(true);
  }, []);

  const handleUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !editForm.city.trim() || !editForm.region.trim()) return;
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
      if (data.success && data.location) {
        toast({ title: "Location Updated ✨", description: `Updated ${editForm.city}, ${editForm.region}.` });
        setLocations((prev) =>
          prev.map((l) =>
            l.id === data.location.id
              ? {
                  ...l,
                  city: data.location.city,
                  region: data.location.region,
                  country: data.location.country,
                }
              : l
          ).sort((a, b) => a.city.localeCompare(b.city))
        );
        setEditModalOpen(false);
        setEditingLocation(null);
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error || "Failed to update location", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update location." });
    } finally {
      setUpdating(false);
    }
  }, [editingLocation, editForm, router]);

  const handleDelete = useCallback(async (id: string, city: string) => {
    try {
      const res = await fetch(`/api/admin/locations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Deleted", description: `Removed ${city}.` });
        setLocations((prev) => prev.filter((l) => l.id !== id));
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete location.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete location." });
    }
  }, [router]);

  return (
    <div className="space-y-5 w-full min-w-0">
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
        {locations.length === 0 ? (
          <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
            <MapPin className="h-10 w-10 text-[#C89B3C]/50 mb-1" />
            <p className="text-base font-serif font-bold text-[#07111F]">No Locations Registered</p>
            <p className="text-xs text-[#6B7280] max-w-sm">
              Configure your primary Somali regional markets and cities to establish platform coverage areas.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="mt-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl gap-2 shadow-sm border-0"
            >
              <Plus className="h-4 w-4" /> Add First Location
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
          </div>
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
                disabled
                className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] text-[#6B7280] cursor-not-allowed"
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
                disabled
                className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] text-[#6B7280] cursor-not-allowed"
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


export default memo(AdminLocationsClient);
