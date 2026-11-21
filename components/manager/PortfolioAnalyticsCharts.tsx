"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, PieChart as PieIcon, MapPin, Layers } from "lucide-react";

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  deals: number;
}

export interface CityDistributionPoint {
  city: string;
  listings: number;
  views: number;
  avgPrice: number;
}

export interface TypeDistributionPoint {
  name: string;
  value: number;
  color: string;
}

export interface StatusBreakdownPoint {
  status: string;
  count: number;
  color: string;
}

interface PortfolioAnalyticsChartsProps {
  monthlyRevenue: MonthlyRevenuePoint[];
  cityDistribution: CityDistributionPoint[];
  typeDistribution: TypeDistributionPoint[];
  statusBreakdown: StatusBreakdownPoint[];
  totalListings: number;
}

export default function PortfolioAnalyticsCharts({
  monthlyRevenue,
  cityDistribution,
  typeDistribution,
  statusBreakdown,
  totalListings,
}: PortfolioAnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatShortCurrency = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
    return `$${v}`;
  };

  return (
    <div className="space-y-6">
      {/* ─── Row 1: Monthly Revenue Area Chart (2 cols) + Property Type Donut (1 col) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-[#07111F] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#C89B3C]" />
                Revenue &amp; Capital Yield Trend
              </h3>
              <p className="text-xs text-[#6B7280]">
                Monthly settled rental &amp; acquisition revenue across your portfolio
              </p>
            </div>
            <span
              suppressHydrationWarning
              className="self-start sm:self-auto text-xs font-bold px-3 py-1 bg-[#F7F3EA] border border-[#E8E1D4] rounded-xl text-[#A97918]"
            >
              {new Date().getFullYear()} YTD
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyRevenue}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="goldRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C89B3C" stopOpacity={0.42} />
                      <stop offset="95%" stopColor="#C89B3C" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                    tickFormatter={formatShortCurrency}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as MonthlyRevenuePoint;
                        return (
                          <div className="bg-[#07111F] text-white px-3.5 py-2.5 rounded-2xl text-xs shadow-2xl border border-[#C89B3C]/50">
                            <p className="font-bold text-[#D9B45B] font-serif">{d.month}</p>
                            <p className="mt-1">
                              <span className="text-[#94A3B8]">Revenue:</span>{" "}
                              <span className="font-bold text-white">
                                ${d.revenue.toLocaleString()}
                              </span>
                            </p>
                            <p>
                              <span className="text-[#94A3B8]">Settled Deals:</span>{" "}
                              <span className="font-bold text-[#D9B45B]">{d.deals}</span>
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
                    stroke="#C89B3C"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#goldRevenueFill)"
                    activeDot={{ r: 5, fill: "#07111F", stroke: "#D9B45B", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-[#F7F3EA]/70 rounded-2xl animate-pulse" />
            )}
          </div>
        </div>

        {/* Property Type Distribution Donut */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-[#07111F] flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-[#C89B3C]" />
                Asset Mix by Type
              </h3>
              <p className="text-xs text-[#6B7280]">Portfolio classification</p>
            </div>
          </div>

          <div className="relative h-52 w-full flex items-center justify-center my-1">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`type-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as TypeDistributionPoint;
                        return (
                          <div className="bg-[#07111F] text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-[#C89B3C]/50">
                            <span className="text-white/80">{d.name}: </span>
                            <span className="font-bold text-[#D9B45B]">{d.value} listings</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-40 h-40 rounded-full border-4 border-dashed border-[#E8E1D4] animate-pulse" />
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl sm:text-3xl font-black font-serif text-[#07111F] leading-none">
                {totalListings}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mt-1">
                Properties
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#E8E1D4]">
            {typeDistribution.slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[#07111F] font-semibold truncate">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-[#07111F]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Row 2: Geographic Distribution Bar Chart + Status Breakdown Bar Chart ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Distribution by City */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-[#07111F] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#C89B3C]" />
                Geographic Distribution by City
              </h3>
              <p className="text-xs text-[#6B7280]">
                Active listings density and regional demand across Somalia
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-[#F7F3EA] border border-[#E8E1D4] rounded-xl text-[#A97918]">
              {cityDistribution.length} Cities
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cityDistribution}
                  margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D4" />
                  <XAxis
                    dataKey="city"
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
                        const d = payload[0].payload as CityDistributionPoint;
                        return (
                          <div className="bg-[#07111F] text-white px-3.5 py-2.5 rounded-2xl text-xs shadow-2xl border border-[#C89B3C]/50 space-y-1">
                            <p className="font-bold text-[#D9B45B] font-serif">{d.city}</p>
                            <p>
                              <span className="text-[#94A3B8]">Listings:</span>{" "}
                              <span className="font-bold text-white">{d.listings}</span>
                            </p>
                            <p>
                              <span className="text-[#94A3B8]">Total Views:</span>{" "}
                              <span className="font-bold text-white">{d.views}</span>
                            </p>
                            <p>
                              <span className="text-[#94A3B8]">Avg Price:</span>{" "}
                              <span className="font-bold text-[#D9B45B]">
                                ${d.avgPrice.toLocaleString()}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="listings"
                    name="Listings"
                    fill="#07111F"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={36}
                  >
                    {cityDistribution.map((_, idx) => (
                      <Cell
                        key={`city-bar-${idx}`}
                        fill={idx % 2 === 0 ? "#07111F" : "#C89B3C"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-[#F7F3EA]/70 rounded-2xl animate-pulse" />
            )}
          </div>
        </div>

        {/* Listing Status Breakdown */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-[#07111F] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#C89B3C]" />
                Inventory Status Breakdown
              </h3>
              <p className="text-xs text-[#6B7280]">
                Live lifecycle distribution across published, rented, and sold assets
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusBreakdown}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8E1D4" />
                  <XAxis
                    type="number"
                    stroke="#6B7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="status"
                    stroke="#07111F"
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as StatusBreakdownPoint;
                        return (
                          <div className="bg-[#07111F] text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-[#C89B3C]/50">
                            <span className="text-white/80">{d.status}: </span>
                            <span className="font-bold text-[#D9B45B]">{d.count} properties</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                    {statusBreakdown.map((entry, idx) => (
                      <Cell key={`status-bar-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-[#F7F3EA]/70 rounded-2xl animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

