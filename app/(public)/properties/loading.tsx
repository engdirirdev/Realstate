// ================================================================
// COMPONENT  : Properties Directory Loading Skeleton (App Router)
// ROUTE      : /properties
// DESCRIPTION: Luxury Kiro-Maal branded instant transition skeleton
//              Provides immediate visual feedback when visiting directory
// ================================================================
export default function PropertiesLoading() {
  return (
    <div className="w-full min-h-screen bg-[#F7F3EA] p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-150">
      {/* Directory Header Skeleton */}
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="h-6 w-44 bg-[#C89B3C]/20 rounded-full animate-pulse" />
        <div className="h-10 w-72 bg-[#07111F]/15 rounded-2xl animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-[#E8E1D4] rounded-lg animate-pulse" />

        {/* Search & Filter Form Skeleton */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 shadow-xs space-y-4 mt-6">
          <div className="h-12 w-full bg-[#E8E1D4]/60 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-[#E8E1D4]/70 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Results Count & Sort Bar Skeleton */}
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="h-5 w-40 bg-[#E8E1D4] rounded-md animate-pulse" />
        <div className="h-5 w-28 bg-[#E8E1D4]/80 rounded-md animate-pulse" />
      </div>

      {/* 3x3 Responsive Properties Grid Skeleton */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl bg-[#FCFBF7] border border-[#E8E1D4] overflow-hidden shadow-xs space-y-3"
          >
            {/* Image Placeholder */}
            <div className="h-56 w-full bg-[#E8E1D4]/80 animate-pulse relative">
              <div className="absolute top-3 left-3 h-6 w-20 bg-[#07111F]/30 rounded-lg animate-pulse" />
              <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/40 animate-pulse" />
            </div>

            {/* Content Placeholder */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-[#C89B3C]/30 rounded animate-pulse" />
                <div className="h-4 w-16 bg-[#E8E1D4] rounded animate-pulse" />
              </div>
              <div className="h-6 w-4/5 bg-[#07111F]/15 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-[#E8E1D4]/70 rounded animate-pulse" />

              {/* Specs Row */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-4 w-14 bg-[#E8E1D4] rounded animate-pulse" />
                <div className="h-4 w-14 bg-[#E8E1D4] rounded animate-pulse" />
                <div className="h-4 w-14 bg-[#E8E1D4] rounded animate-pulse" />
              </div>

              {/* Price & CTA Button */}
              <div className="pt-3 flex items-center justify-between border-t border-[#E8E1D4]">
                <div className="h-7 w-28 bg-[#07111F]/15 rounded animate-pulse" />
                <div className="h-9 w-28 bg-[#C89B3C]/30 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
