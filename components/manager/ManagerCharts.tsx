"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface MonthlySalesData {
  month: string;
  sales: number;
  rentals: number;
}

interface StatusItemData {
  name: string;
  count: number;
  color: string;
}

interface ManagerChartsProps {
  salesPerformance: MonthlySalesData[];
  statusDistribution: StatusItemData[];
  totalProperties: number;
}

export default function ManagerCharts({
  salesPerformance,
  statusDistribution,
  totalProperties,
}: ManagerChartsProps) {
  // Map status items to Kiro-Maal palette if needed
  const kiroStatusDistribution = statusDistribution.map((item, idx) => {
    const palette = ["#C89B3C", "#D9B45B", "#07111F", "#A97918"];
    return {
      ...item,
      color: palette[idx % palette.length],
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ─── Sales Performance Bar Chart (2 cols) ─── */}
      <div className="lg:col-span-2 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm text-[#07111F] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-serif text-[#07111F] tracking-tight">Sales &amp; Rental Performance</h3>
            <p className="text-xs text-[#6B7280]">Monthly transaction volumes for your portfolio</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 bg-[#F7F3EA] border border-[#E8E1D4] rounded-xl text-[#A97918]">
              {new Date().getFullYear()}
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesPerformance}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D4" />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as MonthlySalesData;
                    return (
                      <div className="bg-[#07111F] text-white px-3.5 py-2.5 rounded-2xl text-xs shadow-2xl border border-[#C89B3C]/50">
                        <p className="font-bold text-[#D9B45B] font-serif">{data.month}</p>
                        <p className="mt-1 text-white">
                          <span className="text-[#C89B3C] font-bold">● Sales:</span> {data.sales}
                        </p>
                        <p className="text-white">
                          <span className="text-[#D9B45B] font-bold">● Rentals:</span> {data.rentals}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 11, color: "#07111F" }}
              />
              <Bar dataKey="sales" name="Sales" fill="#C89B3C" radius={[4, 4, 0, 0]} maxBarSize={16} />
              <Bar dataKey="rentals" name="Rentals" fill="#07111F" radius={[4, 4, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Property Status Donut Chart (1 col) ─── */}
      <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm text-[#07111F] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-serif text-[#07111F] tracking-tight">Portfolio Status</h3>
            <p className="text-xs text-[#6B7280]">Listing breakdown by state</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-[#F7F3EA] border border-[#E8E1D4] rounded-xl text-[#A97918]">
            Active
          </span>
        </div>

        <div className="relative h-48 sm:h-52 w-full flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={kiroStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
              >
                {kiroStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as StatusItemData;
                    return (
                      <div className="bg-[#07111F] text-white px-3.5 py-2 rounded-2xl text-xs shadow-2xl border border-[#C89B3C]/50">
                        <span className="font-semibold text-white/80">{data.name}: </span>
                        <span className="font-bold text-[#D9B45B]">{data.count} listings</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black font-serif text-[#07111F] leading-none">
              {totalProperties}
            </span>
            <span className="text-[11px] font-semibold text-[#6B7280] mt-1">Total Listings</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 pt-2.5 border-t border-[#E8E1D4]">
          {kiroStatusDistribution.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#07111F] font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-[#07111F]">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
