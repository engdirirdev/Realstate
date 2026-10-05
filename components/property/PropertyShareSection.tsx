"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Check,
  Copy,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface PropertyShareSectionProps {
  propertyId: string;
  propertyTitle: string;
  city: string;
  price: number;
}

export default function PropertyShareSection({
  propertyId,
  propertyTitle,
  city,
  price,
}: PropertyShareSectionProps) {
  const [copied, setCopied] = useState(false);

  // Use a deterministic fallback for SSR, then update to real URL after hydration
  const fallbackUrl = `https://realestate.so/properties/${propertyId}`;
  const [shareUrl, setShareUrl] = useState(fallbackUrl);

  useEffect(() => {
    // After hydration, use the actual browser URL
    setShareUrl(window.location.href);
  }, []);

  const shareText = `Check out this verified luxury property: ${propertyTitle} in ${city} for $${price.toLocaleString()} on Kiro-Maal Real Estate`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Link Copied! 📋",
      description: "Direct property link copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-[#E8E1D4] pb-3">
        <h3 className="font-serif font-bold text-sm sm:text-base text-[#07111F] flex items-center gap-2">
          <Share2 className="h-4 w-4 text-[#C89B3C]" /> Share This Property
        </h3>
        <span className="text-[11px] text-[#6B7280]">Share with family, partners, or investors</span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs bg-[#25D366] hover:bg-[#20BA5A] text-white"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs bg-[#1877F2] hover:bg-[#166FE5] text-white"
        >
          <Facebook className="h-3.5 w-3.5" />
          <span>Facebook</span>
        </a>

        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs bg-[#0F1419] hover:bg-black text-white"
        >
          <Twitter className="h-3.5 w-3.5" />
          <span>X (Twitter)</span>
        </a>

        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs bg-[#0A66C2] hover:bg-[#095196] text-white"
        >
          <Linkedin className="h-3.5 w-3.5" />
          <span>LinkedIn</span>
        </a>

        <Button
          type="button"
          onClick={handleCopyLink}
          variant="outline"
          size="sm"
          className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] hover:bg-[#EFE9DD] text-[#07111F] text-xs font-bold gap-1.5 ml-auto cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-[#C89B3C]" /> Copy Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
