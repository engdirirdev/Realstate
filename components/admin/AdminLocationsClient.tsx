"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2, Sparkles, Pencil, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  ABUDWAK_VILLAGES,
  ABUDWAK_VILLAGE_NAMES,
  SYSTEM_CITY,
  SYSTEM_COUNTRY,
  SYSTEM_REGION,
  SYSTEM_REGION_FULL,
} from "@/lib/abudwak-locations";

export interface LocationItem {
  id: string;
  city: string; // Stores the Abudwak village name
  region: string; // "Abudwak, Galmudug"
  country: string; // "Somalia"
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
  const [seedingAll, setSeedingAll] = useState(false);

  const registeredNames = useMemo(
    () => new Set(locations.map((l) => l.city.toLowerCase())),
    [locations]
  );

  const availableVillages = useMemo(
    () => ABUDWAK_VILLAGE_NAMES.filter((v) => !registeredNames.has(v.toLowerCase())),
    [registeredNames]
  );

  const [selectedVillage, setSelectedVillage] = useState<string>(
    availableVillages[0] || ABUDWAK_VILLAGE_NAMES[0]
  );

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [editVillage, setEditVillage] = useState<string>(ABUDWAK_VILLAGE_NAMES[0]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (initialLocations) {
      setLocations(initialLocations);
    }
  }, [initialLocations]);

  useEffect(() => {
    if (availableVillages.length > 0 && !availableVillages.includes(selectedVillage)) {
      setSelectedVillage(availableVillages[0]);
    }
  }, [availableVillages, selectedVillage]);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedVillage) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/admin/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            village: selectedVillage,
            city: selectedVillage,
            region: SYSTEM_REGION_FULL,
            country: SYSTEM_COUNTRY,
          }),
        });
        const data = await res.json();
        if (data.success && data.location) {
          toast({
            title: "Village Registered 🎉",
            description: `Added ${data.location.city} Village — ${SYSTEM_CITY}, ${SYSTEM_REGION}.`,
          });
          setLocations((prev) =>
            [
              ...prev,
              {
                id: data.location.id,
                city: data.location.city,
                region: data.location.region,
                country: data.location.country,
                createdAt: data.location.createdAt || new Date().toISOString(),
              },
            ].sort((a, b) => a.city.localeCompare(b.city))
          );
          setModalOpen(false);
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to add village",
            variant: "destructive",
          });
        }
      } catch {
        toast({ title: "Error", description: "Failed to add village.", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
    },
    [selectedVillage, router]
  );

  const handleSeedAllVillages = useCallback(async () => {
    setSeedingAll(true);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedAllAbudwak: true }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.locations)) {
        setLocations(
          data.locations
            .map((l: any) => ({
              id: l.id,
              city: l.city,
              region: l.region,
              country: l.country,
              createdAt: l.createdAt || new Date().toISOString(),
            }))
            .sort((a: LocationItem, b: LocationItem) => a.city.localeCompare(b.city))
        );
        toast({
          title: "All 6 Villages Registered ✨",
          description: "Ubah, Horsed, October, 1da-Lulio, Ammano, and Waberi are now active.",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to register villages",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to register villages.", variant: "destructive" });
    } finally {
      setSeedingAll(false);
    }
  }, [router]);

  const openEditModal = useCallback((loc: LocationItem) => {
    setEditingLocation(loc);
    setEditVillage(loc.city);
    setEditModalOpen(true);
  }, []);

  const handleUpdate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingLocation || !editVillage) return;
      setUpdating(true);
      try {
        const res = await fetch("/api/admin/locations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingLocation.id,
            village: editVillage,
            city: editVillage,
            region: SYSTEM_REGION_FULL,
            country: SYSTEM_COUNTRY,
          }),
        });
        const data = await res.json();
        if (data.success && data.location) {
          toast({
            title: "Village Updated ✨",
            description: `Updated to ${data.location.city}, ${SYSTEM_CITY}.`,
          });
          setLocations((prev) =>
            prev
              .map((l) =>
                l.id === data.location.id
                  ? {
                      ...l,
                      city: data.location.city,
                      region: data.location.region,
                      country: data.location.country,
                    }
                  : l
              )
              .sort((a, b) => a.city.localeCompare(b.city))
          );
          setEditModalOpen(false);
          setEditingLocation(null);
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to update village",
            variant: "destructive",
          });
        }
      } catch {
        toast({ title: "Error", description: "Failed to update village.", variant: "destructive" });
      } finally {
        setUpdating(false);
      }
    },
    [editingLocation, editVillage, router]
  );

  const handleDelete = useCallback(
    async (id: string, village: string) => {
      try {
        const res = await fetch(`/api/admin/locations?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          toast({ title: "Deleted", description: `Removed ${village} village.` });
          setLocations((prev) => prev.filter((l) => l.id !== id));
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to delete village.",
            variant: "destructive",
          });
        }
      } catch {
        toast({ title: "Error", description: "Failed to delete village.", variant: "destructive" });
      }
    },
    [router]
  );

  return (
    <div className="space-y-5 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Abudwak Village Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <MapPin className="h-7 w-7 text-[#C89B3C]" /> Abudwak Villages &amp; Locations
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Operating exclusively in <strong>{SYSTEM_CITY}, {SYSTEM_REGION}, {SYSTEM_COUNTRY}</strong> — manage the 6 official villages (Ubah, Horsed, October, 1da-Lulio, Ammano, Waberi).
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {availableVillages.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSeedAllVillages}
              disabled={seedingAll}
              className="border-[#C89B3C]/50 bg-[#FCFBF7] text-[#07111F] hover:bg-[#F7F3EA] rounded-xl gap-2 font-bold text-xs cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4 text-[#C89B3C]" />
              {seedingAll ? "Registering..." : `Register All 6 Villages`}
            </Button>
          )}
          <Button
            onClick={() => setModalOpen(true)}
            disabled={availableVillages.length === 0}
            className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold shadow-sm border-0 cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add Village
          </Button>
        </div>
      </div>

      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
        {locations.length === 0 ? (
          <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
            <MapPin className="h-10 w-10 text-[#C89B3C]/50 mb-1" />
            <p className="text-base font-serif font-bold text-[#07111F]">No Villages Registered Yet</p>
            <p className="text-xs text-[#6B7280] max-w-md">
              Register the 6 official villages of Abudwak, Galmudug, Somalia: Ubah, Horsed, October, 1da-Lulio, Ammano, and Waberi.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
              <Button
                onClick={handleSeedAllVillages}
                disabled={seedingAll}
                className="bg-[#07111F] text-[#D9B45B] font-bold hover:bg-[#0D1E35] rounded-xl gap-2 shadow-sm border border-[#C89B3C]/40 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                {seedingAll ? "Registering..." : "Register All 6 Villages"}
              </Button>
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl gap-2 shadow-sm border-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Single Village
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Village</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">City / Town</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Region / State</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Country</th>
                  <th className="text-right px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                {locations.map((loc) => {
                  const meta = ABUDWAK_VILLAGES.find(
                    (v) => v.name.toLowerCase() === loc.city.toLowerCase()
                  );
                  return (
                    <tr key={loc.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#07111F]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{meta?.emoji || "🏡"}</span>
                          <div>
                            <p className="font-bold text-[#07111F]">{loc.city}</p>
                            {meta?.desc && (
                              <p className="text-[11px] font-normal text-[#6B7280]">{meta.desc}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#07111F] text-xs font-semibold">{SYSTEM_CITY}</td>
                      <td className="px-4 py-4 text-[#6B7280] text-xs font-semibold">{SYSTEM_REGION}</td>
                      <td className="px-4 py-4 text-[#6B7280] text-xs">{loc.country || SYSTEM_COUNTRY}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => openEditModal(loc)}
                            variant="outline"
                            size="sm"
                            className="h-8 border-[#C89B3C]/40 text-[#07111F] bg-[#FCFBF7] hover:bg-[#F7F3EA] hover:border-[#C89B3C] rounded-xl font-medium shadow-xs cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-[#C89B3C]" /> Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(loc.id, loc.city)}
                            variant="outline"
                            size="sm"
                            className="h-8 border-[#E8E1D4] text-[#DC2626] hover:bg-red-50 hover:border-red-200 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Abudwak Village Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 border border-[#E8E1D4] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F]">
              Register Abudwak Village
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Village Name (Abudwak)
              </Label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-[#E8E1D4] bg-white text-sm text-[#07111F] font-medium focus:outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              >
                {ABUDWAK_VILLAGE_NAMES.map((village) => {
                  const alreadyExists = registeredNames.has(village.toLowerCase());
                  return (
                    <option key={village} value={village} disabled={alreadyExists}>
                      {village} {alreadyExists ? "(Already Registered)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  City / Town
                </Label>
                <Input
                  value={SYSTEM_CITY}
                  disabled
                  className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] text-[#07111F] font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  Region / State
                </Label>
                <Input
                  value={SYSTEM_REGION}
                  disabled
                  className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] text-[#07111F] font-semibold cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Country
              </Label>
              <Input
                value={SYSTEM_COUNTRY}
                disabled
                className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] text-[#6B7280] cursor-not-allowed"
              />
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || availableVillages.length === 0}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm"
              >
                {submitting ? "Saving..." : "Save Village"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Abudwak Village Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 border border-[#E8E1D4] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <Pencil className="h-5 w-5 text-[#C89B3C]" /> Edit Abudwak Village
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Village Name (Abudwak)
              </Label>
              <select
                value={editVillage}
                onChange={(e) => setEditVillage(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-[#E8E1D4] bg-white text-sm text-[#07111F] font-medium focus:outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              >
                {ABUDWAK_VILLAGE_NAMES.map((village) => (
                  <option key={village} value={village}>
                    {village}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  City / Town
                </Label>
                <Input
                  value={SYSTEM_CITY}
                  disabled
                  className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] text-[#07111F] font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                  Region / State
                </Label>
                <Input
                  value={SYSTEM_REGION}
                  disabled
                  className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] text-[#07111F] font-semibold cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Country
              </Label>
              <Input
                value={SYSTEM_COUNTRY}
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
