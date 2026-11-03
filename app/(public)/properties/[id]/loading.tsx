export default function PropertyDetailLoading() {
  return (
    <div className="bg-[#FCFBF7] min-h-screen py-8 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Action Bar Skeleton */}
        <div className="flex items-center justify-between pb-2">
          <div className="h-4 w-32 bg-[#E8E1D4] rounded" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-[#E8E1D4] rounded-xl" />
            <div className="h-8 w-24 bg-[#E8E1D4] rounded-xl" />
          </div>
        </div>

        {/* 2-Column Detail Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Gallery Frame */}
            <div className="bg-[#F7F3EA] rounded-3xl border border-[#E8E1D4] overflow-hidden space-y-3 p-4">
              <div className="aspect-[16/10] bg-[#E8E1D4] rounded-2xl w-full" />
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 w-24 bg-[#E8E1D4] rounded-xl" />
                ))}
              </div>
            </div>

            {/* Property Title & Address Skeleton */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E1D4] space-y-4">
              <div className="h-5 w-28 bg-[#E8E1D4] rounded-full" />
              <div className="h-8 w-3/4 bg-[#E8E1D4] rounded-xl" />
              <div className="h-4 w-1/2 bg-[#E8E1D4] rounded" />
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#E8E1D4]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-[#F7F3EA] rounded-xl" />
                ))}
              </div>
            </div>

            {/* AI Insights & Telemetry Skeleton */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E1D4] space-y-3">
              <div className="h-6 w-48 bg-[#E8E1D4] rounded-lg" />
              <div className="h-24 bg-[#F7F3EA] rounded-2xl" />
            </div>

            {/* Map Section Skeleton */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E1D4] space-y-3">
              <div className="h-6 w-40 bg-[#E8E1D4] rounded-lg" />
              <div className="h-64 bg-[#F7F3EA] rounded-2xl" />
            </div>
          </div>

          {/* Right Sidebar (1 Col) */}
          <div className="space-y-6">
            {/* Price & Booking Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E1D4] space-y-4 shadow-sm sticky top-24">
              <div className="h-4 w-20 bg-[#E8E1D4] rounded" />
              <div className="h-10 w-44 bg-[#E8E1D4] rounded-xl" />
              <div className="space-y-2 pt-2">
                <div className="h-12 w-full bg-[#E8E1D4] rounded-xl" />
                <div className="h-12 w-full bg-[#F7F3EA] rounded-xl" />
                <div className="h-12 w-full bg-[#F7F3EA] rounded-xl" />
              </div>
              <div className="pt-4 border-t border-[#E8E1D4] space-y-2">
                <div className="h-4 w-full bg-[#E8E1D4] rounded" />
                <div className="h-4 w-3/4 bg-[#E8E1D4] rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
