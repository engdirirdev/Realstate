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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ─── Sales Performance Bar Chart (2 cols) ─── */}
      <div className="lg:col-span-2 bg-gradient-to-br from-[#071D36] via-[#092546] to-[#0B2C52] rounded-2xl border border-[#133C6D] p-5 sm:p-6 shadow-xl text-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">My Sales Performance</h3>
            <p className="text-xs text-[#94A3B8]">Monthly sales vs rental conversion volumes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-white">
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#133C6D" />
              <XAxis
                dataKey="month"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94A3B8"
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
                      <div className="bg-[#040E1C] text-white px-3 py-2 rounded-xl text-xs shadow-2xl border border-[#1677FF]">
                        <p className="font-bold text-[#38BDF8]">{data.month}</p>
                        <p className="mt-1 text-white">
                          <span className="text-[#1677FF] font-bold">● Sales:</span> {data.sales}
                        </p>
                        <p className="text-white">
                          <span className="text-[#38BDF8] font-bold">● Rentals:</span> {data.rentals}
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
                wrapperStyle={{ paddingBottom: 12, fontSize: 11, color: "#FFFFFF" }}
              />
              <Bar dataKey="sales" name="Sales" fill="#1677FF" radius={[4, 4, 0, 0]} maxBarSize={16} />
              <Bar dataKey="rentals" name="Rentals" fill="#38BDF8" radius={[4, 4, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Property Status Donut Chart (1 col) ─── */}
      <div className="bg-gradient-to-br from-[#071D36] via-[#092546] to-[#0B2C52] rounded-2xl border border-[#133C6D] p-5 sm:p-6 shadow-xl text-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Property Status</h3>
            <p className="text-xs text-[#94A3B8]">Listing distribution by state</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-white">
            Active
          </span>
        </div>

        <div className="relative h-48 sm:h-52 w-full flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as StatusItemData;
                    return (
                      <div className="bg-[#040E1C] text-white px-3 py-1.5 rounded-xl text-xs shadow-2xl border border-[#133C6D]">
                        <span className="font-semibold">{data.name}: </span>
                        <span className="font-bold text-[#38BDF8]">{data.count} listings</span>
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
            <span className="text-2xl sm:text-3xl font-black text-white leading-none">
              {totalProperties}
            </span>
            <span className="text-[11px] font-semibold text-white/70 mt-1">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 pt-2.5 border-t border-[#133C6D]">
          {statusDistribution.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-white/80 font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-white">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
