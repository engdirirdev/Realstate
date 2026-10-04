"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function AdminAddPropertyModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    city: "Mogadishu",
    location: "Wadajir",
    type: "HOUSE",
    bedrooms: "3",
    bathrooms: "2",
    area: "180",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.city) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in title, price, and city.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          submitForReview: true, // Auto-submit
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Since Admin created it, auto-approve it in DB via review endpoint if needed
        if (data.property?.id) {
          await fetch(`/api/admin/properties/${data.property.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "APPROVED" }),
          }).catch(() => {});
        }

        toast({
          title: "Property Added Successfully! 🏠",
          description: `"${form.title}" is now published and live on the platform.`,
        });
        setOpen(false);
        setForm({
          title: "",
          description: "",
          price: "",
          city: "Mogadishu",
          location: "Wadajir",
          type: "HOUSE",
          bedrooms: "3",
          bathrooms: "2",
          area: "180",
          imageUrl:
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        });
        router.refresh();
      } else {
        toast({
          title: "Submission Error",
          description: data.error || "Failed to create property.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network or server failure while saving property.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="h-9 px-3.5 bg-gradient-to-r from-[#C89B3C] via-[#E8B849] to-[#D9A336] text-[#07111F] hover:brightness-105 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-[#C89B3C]/20 border border-[#F3D78A]/40 cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Add Property</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#A97918] text-xs font-bold uppercase tracking-wider w-fit mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Platform Portfolio
            </div>
            <DialogTitle className="font-serif text-2xl font-bold text-[#07111F]">
              Add New Property Listing
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Create and publish a verified listing directly into the active real estate catalog.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-[#07111F]">Property Title *</Label>
              <Input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Luxury Seaside Villa with Private Garden"
                className="mt-1 bg-white border-[#E8E1D4] text-sm focus:border-[#C89B3C]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold text-[#07111F]">Price ($ USD) *</Label>
                <Input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="e.g. 150000"
                  className="mt-1 bg-white border-[#E8E1D4] text-sm focus:border-[#C89B3C]"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-[#07111F]">City *</Label>
                <Select
                  value={form.city}
                  onValueChange={(val) => setForm((p) => ({ ...p, city: val }))}
                >
                  <SelectTrigger className="mt-1 bg-white border-[#E8E1D4] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                    <SelectItem value="Mogadishu">Mogadishu</SelectItem>
                    <SelectItem value="Hargeisa">Hargeisa</SelectItem>
                    <SelectItem value="Bosaso">Bosaso</SelectItem>
                    <SelectItem value="Garowe">Garowe</SelectItem>
                    <SelectItem value="Kismayo">Kismayo</SelectItem>
                    <SelectItem value="Berbera">Berbera</SelectItem>
                    <SelectItem value="Baydhabo">Baydhabo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-[#07111F]">District / Location</Label>
                <Input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Hodan / Wadajir"
                  className="mt-1 bg-white border-[#E8E1D4] text-sm focus:border-[#C89B3C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs font-bold text-[#07111F]">Property Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm((p) => ({ ...p, type: val }))}
                >
                  <SelectTrigger className="mt-1 bg-white border-[#E8E1D4] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                    <SelectItem value="VILLA">Villa</SelectItem>
                    <SelectItem value="APARTMENT">Apartment</SelectItem>
                    <SelectItem value="HOUSE">House</SelectItem>
                    <SelectItem value="OFFICE">Office</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    <SelectItem value="LAND">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-[#07111F]">Bedrooms</Label>
                <Input
                  type="number"
                  name="bedrooms"
                  value={form.bedrooms}
                  onChange={handleChange}
                  className="mt-1 bg-white border-[#E8E1D4] text-sm focus:border-[#C89B3C]"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-[#07111F]">Bathrooms</Label>
                <Input
                  type="number"
                  name="bathrooms"
                  value={form.bathrooms}
                  onChange={handleChange}
                  className="mt-1 bg-white border-[#E8E1D4] text-sm focus:border-[#C89B3C]"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-[#07111F]">Area (m²)</Label>
                <Input
                  type="number"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className="mt-1 bg-white border-[#E8E1D4] text-sm focus:border-[#C89B3C]"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-[#07111F]">Primary Photo URL</Label>
              <Input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="mt-1 bg-white border-[#E8E1D4] text-sm focus:border-[#C89B3C]"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-[#07111F]">Description</Label>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe key luxury features, security, compound amenities..."
                rows={3}
                className="mt-1 bg-white border-[#E8E1D4] text-sm focus:border-[#C89B3C]"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-xl border-[#E8E1D4] text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-[#C89B3C] via-[#E8B849] to-[#D9A336] text-[#07111F] font-bold rounded-xl text-xs gap-1.5 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Publish Property</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
