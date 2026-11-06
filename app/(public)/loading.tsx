// ================================================================
// COMPONENT  : Public Root Loading Skeleton (App Router)
// ROUTE      : / (Home, About, Services, Contact, etc.)
// DESCRIPTION: Luxury Kiro-Maal branded instant transition skeleton
// ================================================================
export default function PublicLoading() {
  return (
    <div className="w-full min-h-screen bg-[#F7F3EA] space-y-12 p-4 sm:p-8 animate-in fade-in duration-150">
      {/* Hero Section Skeleton */}
      <div className="max-w-6xl mx-auto pt-8 pb-12 text-center space-y-4">
        <div className="h-6 w-44 bg-[#C89B3C]/20 rounded-full animate-pulse mx-auto" />
        <div className="h-12 w-3/4 max-w-2xl bg-[#07111F]/15 rounded-2xl animate-pulse mx-auto" />
        <div className="h-4 w-1/2 max-w-lg bg-[#E8E1D4] rounded-lg animate-pulse mx-auto" />

        {/* Search Bar Skeleton */}
        <div className="mt-8 max-w-3xl mx-auto h-16 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-3 flex items-center gap-3 shadow-xs">
          <div className="h-full flex-1 bg-[#E8E1D4]/60 rounded-2xl animate-pulse" />
          <div className="h-full w-28 bg-[#C89B3C]/40 rounded-2xl animate-pulse" />
        </div>
      </div>

      {/* Featured Properties Grid Skeleton */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-[#07111F]/15 rounded-xl animate-pulse" />
          <div className="h-5 w-24 bg-[#E8E1D4] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-[#FCFBF7] border border-[#E8E1D4] overflow-hidden shadow-xs space-y-3"
            >
              <div className="h-56 w-full bg-[#E8E1D4]/80 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-20 bg-[#C89B3C]/20 rounded-full animate-pulse" />
                  <div className="h-5 w-24 bg-[#07111F]/15 rounded animate-pulse" />
                </div>
                <div className="h-5 w-4/5 bg-[#07111F]/15 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-[#E8E1D4]/70 rounded animate-pulse" />
                <div className="pt-3 flex items-center justify-between border-t border-[#E8E1D4]">
                  <div className="h-6 w-24 bg-[#07111F]/15 rounded animate-pulse" />
                  <div className="h-9 w-28 bg-[#C89B3C]/30 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
