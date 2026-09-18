// ================================================================
// PAGE NAME  : Manager Dashboard — Add / Edit Property
// ROUTE      : /dashboard/properties/add
// DESCRIPTION: Form for Manager to list a new property or edit and
//              resubmit a rejected property for Admin Approval
// ROLE       : USER / Manager
// ================================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, PlusCircle, Send, Save, ArrowLeft, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function ManagerAddPropertyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [dupWarning, setDupWarning] = useState<string | null>(null);
  const [anomalyWarning, setAnomalyWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    city: "Mogadishu",
    location: "",
    address: "",
    type: "HOUSE",
    bedrooms: "3",
    bathrooms: "2",
    area: "150",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    videoUrl: "",
    floorPlanUrl: "",
    virtualTourUrl: "",
    parking: "1",
    isFurnished: false,
    lotSize: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDuplicateCheck = async () => {
    if (!form.title || !form.price || !form.city) return;
    try {
      const res = await fetch("/api/properties/duplicate-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          city: form.city,
          price: Number(form.price),
          bedrooms: Number(form.bedrooms),
          area: Number(form.area),
          type: form.type,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.duplicate?.isDuplicate) {
          setDupWarning(`⚠️ Potential Duplicate Detected: Similar listing "${data.duplicate.matchedProperty?.title}" ($${data.duplicate.matchedProperty?.price}) already exists.`);
        } else {
          setDupWarning(null);
        }

        if (data.anomaly?.isAnomaly) {
          setAnomalyWarning(`💡 Price Analysis: ${data.anomaly.reason}`);
        } else {
          setAnomalyWarning(null);
        }
      }
    } catch {
      // Non-blocking background check
    }
  };

  const handleGenerateAiDescription = async () => {
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/properties/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title || `${form.bedrooms}-Bedroom ${form.type} in ${form.city}`,
          city: form.city,
          type: form.type,
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          area: Number(form.area),
        }),
      });
      const data = await res.json();
      if (data.success && data.description) {
        setForm((prev) => ({ ...prev, description: data.description }));
        toast({ title: "AI Description Generated! ✨", description: "Listing text generated. You can review and edit it." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate AI description", variant: "destructive" });
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSubmit = async (submitForReview: boolean) => {
    if (!form.title || !form.description || !form.price || !form.city) {
      toast({ title: "Missing fields", description: "Title, description, price, and city are required.", variant: "destructive" });
      return;
    }
    setSubmitting(submitForReview ? "PENDING" : "DRAFT");
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submitForReview }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: submitForReview ? "Submitted for Admin Review! 🚀" : "Saved as Draft 📝",
          description: submitForReview
            ? "Your listing has been sent to the Admin queue for approval."
            : "Property saved as Draft.",
        });
        router.push("/dashboard/properties");
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit property.", variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl bg-[#F8FAFC]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="h-4 w-4 text-[#0F172A]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Add New Property Listing</h1>
          <p className="text-[#64748B] text-sm mt-0.5">List a property with AI assistance, media tour, and admin review.</p>
        </div>
      </div>

      {dupWarning && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          {dupWarning}
        </div>
      )}

      {anomalyWarning && (
        <div className="bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          {anomalyWarning}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6 sm:p-8 space-y-6">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#10B981]" /> Basic Details
          </h2>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#0F172A]">Property Title <span className="text-red-500">*</span></Label>
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              onBlur={handleDuplicateCheck}
              placeholder="e.g. Modern 3-Bedroom Villa in Hodan"
              className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Property Type <span className="text-red-500">*</span></Label>
              <Select value={form.type} onValueChange={(val) => setForm((p) => ({ ...p, type: val }))}>
                <SelectTrigger className="h-10 border-[#E2E8F0] rounded-xl bg-white text-[#0F172A]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E2E8F0]">
                  {["HOUSE", "APARTMENT", "VILLA", "OFFICE", "LAND", "COMMERCIAL", "TOWNHOUSE", "STUDIO"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">City <span className="text-red-500">*</span></Label>
              <Select value={form.city} onValueChange={(val) => setForm((p) => ({ ...p, city: val }))}>
                <SelectTrigger className="h-10 border-[#E2E8F0] rounded-xl bg-white text-[#0F172A]">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E2E8F0]">
                  {["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Garowe", "Baydhabo", "Berbera"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">District / Neighborhood</Label>
              <Input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Hodan District"
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Price (USD) <span className="text-red-500">*</span></Label>
              <Input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                onBlur={handleDuplicateCheck}
                placeholder="75000"
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#0F172A]">Description <span className="text-red-500">*</span></Label>
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={generatingDesc}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] bg-[#8B5CF6]/10 px-2.5 py-1 rounded-lg transition-colors"
              >
                {generatingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "✨ AI Generate Description"}
              </button>
            </div>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the property, features, access, and neighborhood..."
              className="min-h-[110px] border-[#E2E8F0] rounded-xl text-sm"
              required
            />
          </div>
        </div>

        {/* Specifications & Features */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">Specifications &amp; Features</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Bedrooms</Label>
              <Input
                name="bedrooms"
                type="number"
                value={form.bedrooms}
                onChange={handleChange}
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Bathrooms</Label>
              <Input
                name="bathrooms"
                type="number"
                value={form.bathrooms}
                onChange={handleChange}
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Area (m²)</Label>
              <Input
                name="area"
                type="number"
                value={form.area}
                onChange={handleChange}
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Parking Spaces</Label>
              <Input
                name="parking"
                type="number"
                value={form.parking}
                onChange={handleChange}
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Lot / Compound Size (m² optional)</Label>
              <Input
                name="lotSize"
                type="number"
                value={form.lotSize}
                onChange={handleChange}
                placeholder="e.g. 250"
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                id="furnished"
                type="checkbox"
                checked={form.isFurnished}
                onChange={(e) => setForm((p) => ({ ...p, isFurnished: e.target.checked }))}
                className="h-4 w-4 text-[#10B981] rounded border-[#E2E8F0] focus:ring-[#10B981]"
              />
              <Label htmlFor="furnished" className="text-xs font-semibold text-[#0F172A] cursor-pointer">
                Furnished Property (Includes basic / luxury furniture)
              </Label>
            </div>
          </div>
        </div>

        {/* Media, Tours & Floor Plans */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#10B981]" /> Media, Video Tour &amp; Floor Plans
          </h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Primary Image URL <span className="text-red-500">*</span></Label>
              <Input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Video Tour Link (YouTube / Vimeo embed)</Label>
              <Input
                name="videoUrl"
                value={form.videoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0F172A]">Floor Plan Image / PDF URL</Label>
                <Input
                  name="floorPlanUrl"
                  value={form.floorPlanUrl}
                  onChange={handleChange}
                  placeholder="https://.../floorplan.jpg"
                  className="h-10 border-[#E2E8F0] rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0F172A]">360° Virtual Tour URL</Label>
                <Input
                  name="virtualTourUrl"
                  value={form.virtualTourUrl}
                  onChange={handleChange}
                  placeholder="https://matterport.com/... or 360 viewer"
                  className="h-10 border-[#E2E8F0] rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!!submitting}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto rounded-xl border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] gap-2"
          >
            {submitting === "DRAFT" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-[#64748B]" />}
            Save as Draft
          </Button>

          <Button
            type="button"
            disabled={!!submitting}
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto rounded-xl bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm"
          >
            {submitting === "PENDING" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit for Admin Review
          </Button>
        </div>
      </div>
    </div>
  );
}
