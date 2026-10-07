export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D4]/60">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-[#E8E1D4] rounded-lg" />
          <div className="h-8 w-64 bg-[#E8E1D4] rounded-xl" />
        </div>
        <div className="h-10 w-36 bg-[#E8E1D4] rounded-xl" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-4 flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-[#E8E1D4] rounded" />
              <div className="h-8 w-8 bg-[#E8E1D4] rounded-xl" />
            </div>
            <div className="h-7 w-20 bg-[#E8E1D4] rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main Table / Content Card Skeleton */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2">
          <div className="h-5 w-48 bg-[#E8E1D4] rounded-lg" />
          <div className="h-9 w-64 bg-[#E8E1D4] rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#F7F3EA] rounded-xl border border-[#E8E1D4]/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
