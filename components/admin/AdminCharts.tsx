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

const TYPE_COLORS = ["#1677FF", "#06B6D4", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"];

export default function AdminCharts({
  monthlyRevenue,
  propertyTypes,
  totalProperties,
}: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ─── Monthly Revenue Spline Area Chart (2 cols) ─── */}
      <div className="lg:col-span-2 bg-gradient-to-br from-[#071D36] via-[#092546] to-[#0B2C52] rounded-2xl border border-[#133C6D] p-5 sm:p-6 shadow-xl text-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Monthly Revenue</h3>
            <p className="text-xs text-[#94A3B8]">Platform financial performance and transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-white">
              {new Date().getFullYear()}
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1677FF" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#1677FF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(val) => (val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#040E1C] text-white px-3 py-2 rounded-xl text-xs shadow-2xl border border-[#1677FF]">
                        <p className="font-bold text-[#38BDF8]">{data.month}</p>
                        <p className="font-black text-sm mt-0.5">{formatPrice(data.revenue)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#1677FF"
                strokeWidth={3.5}
                fillOpacity={1}
                fill="url(#adminRevenueGradient)"
                activeDot={{ r: 6, fill: "#1677FF", stroke: "#FFFFFF", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Property Types Donut Chart (1 col) ─── */}
      <div className="bg-gradient-to-br from-[#071D36] via-[#092546] to-[#0B2C52] rounded-2xl border border-[#133C6D] p-5 sm:p-6 shadow-xl text-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Property Types</h3>
            <p className="text-xs text-[#94A3B8]">Distribution of active assets</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-white">
            {new Date().getFullYear()}
          </span>
        </div>

        <div className="relative h-48 sm:h-52 w-full flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={propertyTypes}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {propertyTypes.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || TYPE_COLORS[index % TYPE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as PropertyTypeData;
                    return (
                      <div className="bg-[#040E1C] text-white px-3 py-1.5 rounded-xl text-xs shadow-2xl border border-[#133C6D]">
                        <span className="font-semibold">{data.name}: </span>
                        <span className="font-bold text-[#38BDF8]">{data.value} listings</span>
                        <span className="text-[11px] text-gray-400 ml-1">({data.percentage}%)</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center stats in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black text-white leading-none">
              {totalProperties.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-white/70 mt-1">Total Properties</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2.5 border-t border-[#133C6D]">
          {propertyTypes.slice(0, 6).map((type, i) => (
            <div key={type.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: type.color || TYPE_COLORS[i % TYPE_COLORS.length] }}
                />
                <span className="text-white/80 truncate font-medium">{type.name}</span>
              </div>
              <span className="font-bold text-white ml-2">{type.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
