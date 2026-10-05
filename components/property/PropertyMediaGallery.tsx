"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Play,
  Compass,
  FileText,
  Image as ImageIcon,
  Building2,
  Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaImage {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary?: boolean;
}

interface PropertyMediaGalleryProps {
  title: string;
  images: MediaImage[];
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  floorPlanUrl?: string | null;
}

export default function PropertyMediaGallery({
  title,
  images = [],
  videoUrl,
  virtualTourUrl,
  floorPlanUrl,
}: PropertyMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeMediaTab, setActiveMediaTab] = useState<"PHOTOS" | "DRONE" | "VIDEO" | "360" | "FLOORPLAN">("PHOTOS");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Separate drone / aerial images if tagged in altText or metadata
  const droneImages = images.filter(
    (img) => img.altText && /drone|aerial|dron|cirka|sare/i.test(img.altText)
  );
  const hasDroneImages = droneImages.length > 0;

  const currentList = activeMediaTab === "DRONE" ? droneImages : images;
  const currentImage = currentList[selectedIndex] || images[0];

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, selectedIndex, currentList.length]);

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % Math.max(1, currentList.length));
    setZoomLevel(1);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + currentList.length) % Math.max(1, currentList.length));
    setZoomLevel(1);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, +(z + 0.35).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(1, +(z - 0.35).toFixed(2)));
  const handleResetZoom = () => setZoomLevel(1);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (lightboxRef.current?.requestFullscreen) {
        await lightboxRef.current.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  if (!images.length && !videoUrl && !virtualTourUrl && !floorPlanUrl) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* ── Media Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => {
            setActiveMediaTab("PHOTOS");
            setSelectedIndex(0);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
            activeMediaTab === "PHOTOS"
              ? "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/40"
              : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5 text-[#C89B3C]" />
          Photos ({images.length})
        </button>

        {hasDroneImages && (
          <button
            type="button"
            onClick={() => {
              setActiveMediaTab("DRONE");
              setSelectedIndex(0);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
              activeMediaTab === "DRONE"
                ? "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/40"
                : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
            }`}
          >
            <Plane className="h-3.5 w-3.5 text-[#C89B3C]" />
            Drone Aerial ({droneImages.length})
          </button>
        )}

        {videoUrl && (
          <button
            type="button"
            onClick={() => setActiveMediaTab("VIDEO")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
              activeMediaTab === "VIDEO"
                ? "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/40"
                : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
            }`}
          >
            <Play className="h-3.5 w-3.5 text-[#C89B3C]" />
            Video Tour
          </button>
        )}

        {virtualTourUrl && (
          <button
            type="button"
            onClick={() => setActiveMediaTab("360")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
              activeMediaTab === "360"
                ? "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/40"
                : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-[#C89B3C]" />
            360° Walkthrough
          </button>
        )}

        {floorPlanUrl && (
          <button
            type="button"
            onClick={() => setActiveMediaTab("FLOORPLAN")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
              activeMediaTab === "FLOORPLAN"
                ? "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/40"
                : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#C89B3C]" />
            Floor Plan
          </button>
        )}
      </div>

      {/* ── Active Tab Display ── */}
      {activeMediaTab === "VIDEO" && videoUrl ? (
        <div className="bg-[#07111F] rounded-3xl overflow-hidden aspect-video w-full border border-[#C89B3C]/30 shadow-md">
          <iframe
            src={videoUrl.replace("watch?v=", "embed/")}
            className="w-full h-full border-0"
            allowFullScreen
            title={`${title} - Video Tour`}
          />
        </div>
      ) : activeMediaTab === "360" && virtualTourUrl ? (
        <div className="bg-[#07111F] rounded-3xl overflow-hidden aspect-video w-full border border-[#C89B3C]/30 shadow-md relative flex flex-col items-center justify-center p-8 text-center text-white">
          <Compass className="h-14 w-14 text-[#D9B45B] mb-3 animate-spin duration-3000" />
          <h3 className="font-serif font-bold text-xl text-[#FCFBF7]">Interactive 360° Virtual Walkthrough</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mt-1 mb-5">
            Immerse yourself into panoramic room views and architectural layout dimensions.
          </p>
          <a
            href={virtualTourUrl}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold rounded-xl text-sm shadow-md hover:brightness-105 transition-all"
          >
            Launch Fullscreen 360° Walkthrough ➔
          </a>
        </div>
      ) : activeMediaTab === "FLOORPLAN" && floorPlanUrl ? (
        <div className="bg-[#FCFBF7] rounded-3xl overflow-hidden border border-[#E8E1D4] p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center">
          <div className="max-h-[500px] w-full flex items-center justify-center overflow-hidden bg-[#F7F3EA] rounded-2xl p-4">
            <img
              src={floorPlanUrl}
              alt={`${title} - Architectural Floor Plan`}
              className="max-h-[460px] w-auto object-contain cursor-zoom-in"
              onClick={() => {
                setLightboxOpen(true);
              }}
            />
          </div>
          <div className="flex items-center justify-between w-full mt-3 pt-3 border-t border-[#E8E1D4] text-xs">
            <span className="text-[#6B7280]">Architectural Floor Plan Schematic</span>
            <a
              href={floorPlanUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[#C89B3C] hover:underline"
            >
              Open High-Resolution PDF / Image ➔
            </a>
          </div>
        </div>
      ) : (
        /* Standard Photos / Drone Views Layout with Hero + Thumbnails */
        <div className="space-y-3">
          {/* Main Hero Viewer */}
          <div className="relative rounded-3xl overflow-hidden bg-[#07111F] border border-[#E8E1D4] h-[340px] sm:h-[460px] group shadow-sm">
            {currentImage ? (
              <img
                src={currentImage.url}
                alt={currentImage.altText || title}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-[1.01]"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                <Building2 className="h-16 w-16 opacity-40" />
              </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Counter Badge */}
            <div className="absolute top-4 left-4 bg-[#07111F]/80 backdrop-blur-md text-[#FCFBF7] border border-[#C89B3C]/30 text-xs font-bold px-3 py-1 rounded-xl shadow-xs">
              {currentList.length > 0 ? `${selectedIndex + 1} / ${currentList.length}` : "1 / 1"}
            </div>

            {/* Fullscreen Trigger */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute top-4 right-4 bg-[#07111F]/80 backdrop-blur-md text-[#D9B45B] hover:text-white border border-[#C89B3C]/30 p-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Open Fullscreen Gallery Viewer"
            >
              <Maximize2 className="h-4 w-4 text-[#D9B45B]" />
              <span className="hidden sm:inline">Fullscreen Gallery</span>
            </button>

            {/* Left / Right Nav Arrows */}
            {currentList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#07111F]/70 hover:bg-[#07111F] text-white p-2.5 rounded-full border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#07111F]/70 hover:bg-[#07111F] text-white p-2.5 rounded-full border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Bottom Caption / Title preview */}
            {currentImage?.altText && (
              <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-medium truncate pointer-events-none">
                {currentImage.altText}
              </div>
            )}
          </div>

          {/* Thumbnail Carousel */}
          {currentList.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {currentList.map((img, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(idx);
                      setZoomLevel(1);
                    }}
                    className={`relative flex-shrink-0 w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#C89B3C] ring-2 ring-[#C89B3C]/40 scale-102"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt={img.altText || ""} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Interactive Fullscreen Lightbox Modal ── */}
      {lightboxOpen && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-[#07111F]/98 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
        >
          {/* Lightbox Header Bar */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
            <div>
              <p className="font-serif font-bold text-sm sm:text-base text-[#FCFBF7] truncate max-w-md">
                {title}
              </p>
              <p className="text-xs text-[#94A3B8]">
                Image {selectedIndex + 1} of {currentList.length}
              </p>
            </div>

            {/* Lightbox Controls: Zoom In, Zoom Out, Reset, Fullscreen, Close */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              {zoomLevel > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetZoom}
                  className="h-8 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLightboxOpen(false);
                  setZoomLevel(1);
                }}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-xl bg-[#DC2626]/80 hover:bg-[#DC2626] text-white border-0"
                title="Close Lightbox (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-4">
            {currentList.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div className="max-w-6xl max-h-[80vh] flex items-center justify-center overflow-hidden">
              <img
                src={currentImage?.url}
                alt={currentImage?.altText || title}
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-h-[75vh] max-w-full object-contain transition-transform duration-200"
              />
            </div>

            {currentList.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Strip */}
          {currentList.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 border-t border-white/10">
              {currentList.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === selectedIndex ? "border-[#C89B3C] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
