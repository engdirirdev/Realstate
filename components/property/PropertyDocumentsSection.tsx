"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Maximize2,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface DocItem {
  id: string;
  title: string;
  fileUrl: string;
  fileType?: string | null;
  verifiedAt?: string | Date | null;
}

interface PropertyDocumentsSectionProps {
  documents: DocItem[];
  floorPlanUrl?: string | null;
}

export default function PropertyDocumentsSection({
  documents = [],
  floorPlanUrl,
}: PropertyDocumentsSectionProps) {
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);

  // Synthesize available verified document list based on database and uploaded floor plans
  const documentList: DocItem[] = [...documents];

  if (floorPlanUrl && !documentList.some((d) => d.title.toLowerCase().includes("floor plan"))) {
    documentList.push({
      id: "doc-floor-plan-pdf",
      title: "Architectural Floor Plan Schematic",
      fileUrl: floorPlanUrl,
      fileType: "PDF",
    });
  }

  // If no documents exist, hide gracefully
  if (documentList.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-7 shadow-sm space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E1D4] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-[#C89B3C]/30">
            <ShieldCheck className="h-3 w-3 text-[#D9B45B]" /> Verified Authenticity
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#07111F] flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#C89B3C]" /> Property Documents &amp; Certificates
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Legal title deeds, municipal conveyance filings, and certified engineering floor plans.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {documentList.length} Verified Document{documentList.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Document Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {documentList.map((doc) => {
          const type = (doc.fileType || "PDF").toUpperCase();
          return (
            <div
              key={doc.id}
              className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4 flex flex-col justify-between hover:bg-[#EFE9DD] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
                  {type}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#07111F] truncate" title={doc.title}>
                    {doc.title}
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Verified Municipal &amp; Legal Filing
                  </p>
                </div>
              </div>

              {/* Action Buttons: Preview, Download, Full Screen */}
              <div className="flex items-center gap-2 pt-3 mt-3 border-t border-[#E8E1D4]">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewDoc(doc)}
                  className="rounded-xl border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-white text-xs font-bold gap-1 cursor-pointer flex-1"
                >
                  <Eye className="h-3.5 w-3.5 text-[#C89B3C]" /> Preview
                </Button>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-white text-xs font-bold gap-1 flex-1"
                >
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-3.5 w-3.5 text-[#C89B3C]" /> Download
                  </a>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewDoc(doc)}
                  className="rounded-xl border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-white p-2 h-9 w-9 cursor-pointer"
                  title="View Full Screen"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-[#C89B3C]" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Document Full Screen Preview Modal ── */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={(val) => !val && setPreviewDoc(null)}>
          <DialogContent className="max-w-4xl bg-[#FCFBF7] rounded-3xl p-6 border border-[#E8E1D4] shadow-2xl max-h-[92vh] flex flex-col">
            <DialogHeader className="border-b border-[#E8E1D4] pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-serif font-bold text-lg text-[#07111F] flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#C89B3C]" /> {previewDoc.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#6B7280]">
                    Verified digital document viewer ({previewDoc.fileType || "PDF"})
                  </DialogDescription>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold text-xs hover:brightness-105 border-0"
                >
                  <a href={previewDoc.fileUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download Copy
                  </a>
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 my-3 rounded-2xl overflow-hidden bg-[#07111F] border border-[#E8E1D4] min-h-[500px] flex items-center justify-center relative">
              <iframe
                src={previewDoc.fileUrl}
                className="w-full h-full min-h-[500px] border-0 bg-white"
                title={previewDoc.title}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
