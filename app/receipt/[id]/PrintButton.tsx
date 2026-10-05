"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      variant="outline"
      className="gap-2 text-xs font-bold rounded-xl border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-[#F7F3EA] shadow-2xs"
    >
      <Printer className="h-3.5 w-3.5 text-[#C89B3C]" /> Print Receipt
    </Button>
  );
}
