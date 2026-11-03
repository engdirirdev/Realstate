export default function PropertiesLoading() {
  return (
    <div className="bg-[#F7F3EA] min-h-screen py-10 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Filter Card Skeleton */}
        <div className="bg-[#FCFBF7] p-6 sm:p-8 rounded-3xl border border-[#E8E1D4] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-[#E8E1D4] rounded-full" />
              <div className="h-9 w-64 bg-[#E8E1D4] rounded-xl" />
              <div className="h-4 w-80 bg-[#E8E1D4] rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 bg-[#E8E1D4] rounded-xl" />
              <div className="h-9 w-28 bg-[#E8E1D4] rounded-xl" />
            </div>
          </div>

          {/* Filter Inputs Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-[#E8E1D4]/70 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Results Counter Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 bg-[#E8E1D4] rounded" />
          <div className="h-4 w-28 bg-[#E8E1D4] rounded" />
        </div>

        {/* Property Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden flex flex-col space-y-3"
            >
              {/* Media Preview Box */}
              <div className="aspect-[16/10] bg-[#E8E1D4] w-full" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-1/2 bg-[#E8E1D4] rounded-lg" />
                <div className="h-6 w-3/4 bg-[#E8E1D4] rounded-lg" />
                <div className="h-4 w-2/3 bg-[#E8E1D4] rounded" />
                <div className="flex items-center gap-4 pt-2">
                  <div className="h-4 w-12 bg-[#E8E1D4] rounded" />
                  <div className="h-4 w-12 bg-[#E8E1D4] rounded" />
                  <div className="h-4 w-14 bg-[#E8E1D4] rounded" />
                </div>
                <div className="h-10 w-full bg-[#E8E1D4] rounded-xl mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
