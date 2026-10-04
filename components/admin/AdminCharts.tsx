"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import { BarChart3, Building2, ChevronDown } from "lucide-react";

interface RevenueMonthData {
  month: string;
  revenue: number;
}

interface PropertyTypeData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface AdminChartsProps {
  monthlyRevenue: RevenueMonthData[];
  propertyTypes: PropertyTypeData[];
  totalProperties: number;
}

// Exact colors matching reference donut chart
const DONUT_COLORS: Record<string, string> = {
  APARTMENT: "#1E60D5", // Royal Blue (40%)
  VILLA: "#059669",     // Emerald (25%)
  HOUSE: "#D9A336",     // Gold (20%)
  COMMERCIAL: "#E11D48",// Crimson (10%)
  LAND: "#F43F5E",      // Coral/Rose (5%)
  OFFICE: "#3B82F6",
  TOWNHOUSE: "#8B5CF6",
  STUDIO: "#64748B",
};

export default function AdminCharts({
  monthlyRevenue,
  propertyTypes,
  totalProperties,
}: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ─── Monthly Revenue Area Chart (2 cols) ─── */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E6DED4] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0B1523] tracking-tight">
                Monthly Revenue
              </h3>
              <p className="text-xs text-slate-500">
                Platform financial performance and transactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9CEBF] rounded-xl text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50">
            <span>{new Date().getFullYear()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyRevenue}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="goldRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C99126" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C99126" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DED4" />
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
                tickFormatter={(val) =>
                  val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0B1523] text-white px-3.5 py-2 rounded-xl text-xs shadow-xl border border-[#C99126]">
                        <p className="font-bold text-[#D9A336]">{data.month}</p>
                        <p className="font-extrabold text-sm mt-0.5 text-white">
                          {formatPrice(data.revenue)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C99126"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#goldRevenueGradient)"
                dot={{ r: 4, fill: "#C99126", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                activeDot={{
                  r: 6,
                  fill: "#C99126",
                  stroke: "#0B1523",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Property Types Donut Chart (1 col) ─── */}
      <div className="bg-white rounded-2xl border border-[#E6DED4] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0B1523] tracking-tight">
                Property Types
              </h3>
              <p className="text-xs text-slate-500">Distribution of active assets</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9CEBF] rounded-xl text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50">
            <span>{new Date().getFullYear()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto pt-3">
          {/* Donut Chart with Centered Number */}
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={propertyTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {propertyTypes.map((entry, index) => {
                    const typeKey = entry.name.toUpperCase().replace(/S$/, "");
                    const sliceColor =
                      DONUT_COLORS[typeKey] || entry.color || "#1E60D5";
                    return <Cell key={`cell-${index}`} fill={sliceColor} />;
                  })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as PropertyTypeData;
                      return (
                        <div className="bg-[#0B1523] text-white px-3 py-1.5 rounded-xl text-xs shadow-xl border border-[#C99126]">
                          <span className="font-semibold">{data.name}: </span>
                          <span className="font-bold text-[#D9A336]">
                            {data.value} listings
                          </span>
                          <span className="text-[11px] text-slate-300 ml-1">
                            ({data.percentage}%)
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[#0B1523] leading-none">
                {totalProperties}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5">
                Total Properties
              </span>
            </div>
          </div>

          {/* Legend on Right (Matching Screenshot) */}
          <div className="space-y-2.5 w-full sm:w-auto text-xs min-w-[130px]">
            {propertyTypes.slice(0, 5).map((type, idx) => {
              const typeKey = type.name.toUpperCase().replace(/S$/, "");
              const dotColor = DONUT_COLORS[typeKey] || type.color || "#1E60D5";
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="text-slate-700 font-medium truncate max-w-[85px]">
                      {type.name}
                    </span>
                  </div>
                  <span className="font-bold text-[#0B1523]">
                    {type.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
