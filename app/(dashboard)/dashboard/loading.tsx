// ================================================================
// COMPONENT  : Manager Dashboard Loading Skeleton (App Router)
// ROUTE      : /dashboard/*
// DESCRIPTION: Luxury Kiro-Maal branded instant transition skeleton
//              Provides instant visual feedback during navigation
// ================================================================
export default function DashboardLoading() {
  return (
    <div className="space-y-6 w-full min-w-0 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-[#C89B3C]/20 rounded-full animate-pulse" />
          <div className="h-8 w-56 bg-[#E8E1D4] rounded-xl animate-pulse" />
          <div className="h-4 w-80 max-w-full bg-[#E8E1D4]/60 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 bg-[#E8E1D4]/80 rounded-xl animate-pulse" />
          <div className="h-10 w-36 bg-[#C89B3C]/30 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#FCFBF7] border border-[#E8E1D4] space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-[#E8E1D4]/70 rounded-md animate-pulse" />
              <div className="h-8 w-8 rounded-xl bg-[#C89B3C]/20 animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-[#07111F]/15 rounded-lg animate-pulse" />
            <div className="h-3.5 w-32 bg-[#E8E1D4]/60 rounded-md animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 space-y-4 shadow-xs">
        <div className="h-6 w-48 bg-[#E8E1D4] rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[#E8E1D4]/80 bg-[#F7F3EA]/30 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="h-12 w-12 rounded-xl bg-[#E8E1D4]/80 animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-2/3 bg-[#07111F]/15 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-[#E8E1D4]/70 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-24 bg-[#E8E1D4]/60 rounded-xl animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
