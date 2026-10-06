export default function PublicLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#FCFBF7] animate-pulse">
      <div className="section-container space-y-8">
        {/* Hero / Header Skeleton */}
        <div className="max-w-2xl space-y-3">
          <div className="h-4 w-32 bg-[#E8E1D4] rounded-full" />
          <div className="h-10 w-96 bg-[#E8E1D4] rounded-xl" />
          <div className="h-4 w-64 bg-[#E8E1D4] rounded" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E8E1D4] p-4 space-y-3 shadow-2xs"
            >
              <div className="aspect-[16/10] bg-[#E8E1D4] rounded-xl" />
              <div className="h-5 w-3/4 bg-[#E8E1D4] rounded-lg" />
              <div className="h-4 w-1/3 bg-[#E8E1D4] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
