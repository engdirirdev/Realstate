// ================================================================
// COMPONENT  : Property Detail Loading Skeleton (App Router)
// ROUTE      : /properties/[id]
// DESCRIPTION: Luxury Kiro-Maal branded instant transition skeleton
//              Provides immediate visual feedback when viewing property
// ================================================================
export default function PropertyDetailLoading() {
  return (
    <div className="w-full min-h-screen bg-[#F7F3EA] p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Return Link Skeleton */}
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="h-5 w-48 bg-[#E8E1D4] rounded-md animate-pulse" />
        <div className="h-5 w-24 bg-[#E8E1D4]/80 rounded-md animate-pulse" />
      </div>

      {/* Main Grid: Detail Content (Left 8 cols) + Sticky Sidebar (Right 4 cols) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hero Gallery Skeleton: Large Featured + 4 Thumbnails */}
          <div className="rounded-3xl bg-[#FCFBF7] border border-[#E8E1D4] p-3 shadow-xs space-y-3">
            <div className="h-96 w-full rounded-2xl bg-[#E8E1D4]/80 animate-pulse" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-[#E8E1D4]/60 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Title & Badge Row Skeleton */}
          <div className="rounded-3xl bg-[#FCFBF7] border border-[#E8E1D4] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 bg-[#C89B3C]/20 rounded-full animate-pulse" />
              <div className="h-6 w-32 bg-[#07111F]/10 rounded-full animate-pulse" />
            </div>
            <div className="h-9 w-3/4 bg-[#07111F]/15 rounded-xl animate-pulse" />
            <div className="h-5 w-1/3 bg-[#E8E1D4] rounded-md animate-pulse" />

            {/* Core Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E8E1D4]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 bg-[#F7F3EA]/50 rounded-2xl space-y-2 border border-[#E8E1D4]/60">
                  <div className="h-4 w-12 bg-[#E8E1D4] rounded animate-pulse" />
                  <div className="h-6 w-16 bg-[#07111F]/15 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Description Section Skeleton */}
          <div className="rounded-3xl bg-[#FCFBF7] border border-[#E8E1D4] p-6 shadow-xs space-y-3">
            <div className="h-6 w-40 bg-[#07111F]/15 rounded-lg animate-pulse" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-[#E8E1D4]/70 rounded animate-pulse" />
              <div className="h-4 w-11/12 bg-[#E8E1D4]/70 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-[#E8E1D4]/70 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Price & Action Card Skeleton */}
          <div className="rounded-3xl bg-[#FCFBF7] border border-[#E8E1D4] p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="h-4 w-20 bg-[#E8E1D4] rounded animate-pulse" />
              <div className="h-10 w-44 bg-[#07111F]/15 rounded-xl animate-pulse" />
            </div>
            <div className="h-12 w-full bg-[#C89B3C]/30 rounded-2xl animate-pulse" />
            <div className="h-12 w-full bg-[#07111F]/15 rounded-2xl animate-pulse" />
            <div className="pt-3 border-t border-[#E8E1D4] space-y-2">
              <div className="h-4 w-full bg-[#E8E1D4]/60 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-[#E8E1D4]/60 rounded animate-pulse" />
            </div>
          </div>

          {/* Concierge Card Skeleton */}
          <div className="rounded-3xl bg-[#07111F] border border-[#C89B3C]/30 p-6 shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#C89B3C]/40 animate-pulse" />
            <div className="h-6 w-36 bg-white/20 rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-full bg-[#C89B3C]/40 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
