export default function CustomerLoading() {
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

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-2xs space-y-4 p-5"
          >
            <div className="aspect-[16/9] bg-[#E8E1D4] rounded-xl" />
            <div className="h-5 w-3/4 bg-[#E8E1D4] rounded-lg" />
            <div className="h-4 w-1/2 bg-[#E8E1D4] rounded" />
            <div className="h-16 bg-[#F7F3EA] rounded-xl border border-[#E8E1D4]/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
