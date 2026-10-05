"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import DynamicPropertyForm from "@/components/property/DynamicPropertyForm";

export default function AdminAddPropertyModal() {
  const [open, setOpen] = useState(false);

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
        <DialogContent className="max-w-4xl bg-[#F7F3EA] border border-[#E8E1D4] text-[#07111F] max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-3xl">
          <DialogHeader className="mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07111F] text-[#D9B45B] text-xs font-bold uppercase tracking-wider w-fit mb-1 border border-[#C89B3C]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#D9B45B]" /> Dynamic Property Creation
            </div>
            <DialogTitle className="font-serif text-2xl font-bold text-[#07111F]">
              Register New Listing (Admin Mode)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Create and instantly publish properties with type-specific specifications.
            </DialogDescription>
          </DialogHeader>

          <DynamicPropertyForm
            isAdminMode={true}
            onSuccessRedirect="/admin/properties"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
