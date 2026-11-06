// ================================================================
// COMPONENT  : Customer Portal Loading Skeleton (App Router)
// ROUTE      : /customer/*
// DESCRIPTION: Luxury Kiro-Maal branded instant transition skeleton
//              Provides instant visual feedback during navigation
// ================================================================
export default function CustomerLoading() {
  return (
    <div className="space-y-6 w-full min-w-0 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
      {/* Welcome Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#07111F] to-[#112238] border border-[#C89B3C]/30 text-white space-y-3 shadow-sm">
        <div className="h-5 w-28 bg-[#C89B3C]/40 rounded-full animate-pulse" />
        <div className="h-8 w-64 bg-white/20 rounded-xl animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-white/10 rounded-lg animate-pulse" />
      </div>

      {/* Quick Action Navigation Pills Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 w-28 bg-[#E8E1D4]/80 rounded-xl animate-pulse shrink-0"
          />
        ))}
      </div>

      {/* Customer Properties / Bookings Card Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl bg-[#FCFBF7] border border-[#E8E1D4] overflow-hidden shadow-xs space-y-3"
          >
            <div className="h-48 w-full bg-[#E8E1D4]/80 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-[#C89B3C]/20 rounded-full animate-pulse" />
                <div className="h-5 w-20 bg-[#07111F]/15 rounded-md animate-pulse" />
              </div>
              <div className="h-5 w-3/4 bg-[#07111F]/15 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-[#E8E1D4]/70 rounded animate-pulse" />
              <div className="pt-2 flex items-center justify-between border-t border-[#E8E1D4]">
                <div className="h-6 w-24 bg-[#07111F]/15 rounded animate-pulse" />
                <div className="h-8 w-24 bg-[#E8E1D4]/70 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
