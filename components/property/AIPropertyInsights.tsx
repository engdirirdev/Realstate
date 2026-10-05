"use client";

import {
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  History,
  Target,
  BarChart2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface PriceHistoryItem {
  id: string;
  createdAt: string | Date;
  predictedPrice: number;
  confidence: number;
  modelVersion?: string;
}

interface AIPropertyInsightsProps {
  askingPrice: number;
  predictedPrice: number | null;
  predictedMin: number | null;
  predictedMax: number | null;
  pricePosition: string | null;
  confidence: number | null;
  reliability: string | null;
  investmentScore: number | null;
  investmentLabel: string | null;
  marketTrend: string | null;
  demandLevel: string | null;
  similarMatchScore: number | null;
  priceHistory: PriceHistoryItem[] | null;
}

export default function AIPropertyInsights({
  askingPrice,
  predictedPrice,
  predictedMin,
  predictedMax,
  pricePosition,
  confidence,
  reliability,
  investmentScore,
  investmentLabel,
  marketTrend,
  demandLevel,
  similarMatchScore,
  priceHistory,
}: AIPropertyInsightsProps) {
  const hasPrediction = typeof predictedPrice === "number" && predictedPrice > 0;
  const hasHistory = Array.isArray(priceHistory) && priceHistory.length > 0;

  return (
    <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-7 shadow-sm space-y-6">
      {/* ── Card Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-[#C89B3C]/30">
            <Sparkles className="h-3 w-3 text-[#D9B45B]" /> Real ML Intelligence Engine
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#07111F] flex items-center gap-2">
            <Target className="h-6 w-6 text-[#C89B3C]" /> AI Property Insights &amp; Valuation
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Objective econometric machine learning prediction based on verified neighborhood comparables.
          </p>
        </div>

        {hasPrediction && reliability && (
          <div className="flex items-center gap-2 bg-[#F7F3EA] border border-[#E8E1D4] px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-[#6B7280]">Model Reliability:</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                reliability === "HIGH"
                  ? "bg-emerald-100 text-emerald-800"
                  : reliability === "MEDIUM"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {reliability} ({confidence ? `${Math.round(confidence)}%` : "Verified"})
            </span>
          </div>
        )}
      </div>

      {/* ── Key Metrics Grid (4 Core Pillars) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. AI Price Prediction */}
        <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4.5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-[#C89B3C]" /> AI Price Prediction
            </p>
            {hasPrediction ? (
              <>
                <p className="text-2xl font-serif font-extrabold text-[#07111F] mt-1.5">
                  {formatPrice(predictedPrice!)}
                </p>
                {predictedMin && predictedMax && (
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Range: {formatPrice(predictedMin)} – {formatPrice(predictedMax)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-semibold text-[#6B7280] mt-2 italic">Data not available.</p>
            )}
          </div>
          {hasPrediction && pricePosition && (
            <div className="mt-3 pt-2.5 border-t border-[#E8E1D4]">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  pricePosition === "BELOW_MARKET"
                    ? "bg-emerald-100 text-emerald-800"
                    : pricePosition === "ABOVE_MARKET"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-[#07111F] text-[#D9B45B]"
                }`}
              >
                {pricePosition.replace("_", " ")}
              </span>
            </div>
          )}
        </div>

        {/* 2. Investment Score */}
        <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4.5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-[#C89B3C]" /> Investment Score
            </p>
            {typeof investmentScore === "number" ? (
              <>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <p className="text-2xl font-serif font-extrabold text-[#C89B3C]">
                    {investmentScore}
                  </p>
                  <span className="text-xs font-bold text-[#6B7280]">/ 100</span>
                </div>
                {investmentLabel && (
                  <p className="text-[11px] font-semibold text-[#07111F] mt-0.5">
                    Grade: {investmentLabel}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-semibold text-[#6B7280] mt-2 italic">Data not available.</p>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E1D4]">
            <span className="text-[10px] font-semibold text-[#6B7280]">
              Space &amp; Completeness Rating
            </span>
          </div>
        </div>

        {/* 3. Market Trend & Demand Level */}
        <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4.5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#C89B3C]" /> Market Trend
            </p>
            {marketTrend ? (
              <>
                <p className="text-2xl font-serif font-extrabold text-emerald-800 mt-1.5">
                  {marketTrend}
                </p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Demand:{" "}
                  <strong className="text-[#07111F]">
                    {demandLevel || "Data not available."}
                  </strong>
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-[#6B7280] mt-2 italic">Data not available.</p>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E1D4]">
            <span className="text-[10px] font-semibold text-[#6B7280]">
              Local City Market Index
            </span>
          </div>
        </div>

        {/* 4. Similar Property Match Score */}
        <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4.5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#C89B3C]" /> Similar Match Score
            </p>
            {typeof similarMatchScore === "number" && similarMatchScore > 0 ? (
              <>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <p className="text-2xl font-serif font-extrabold text-[#07111F]">
                    {Math.round(similarMatchScore)}%
                  </p>
                  <span className="text-xs font-bold text-[#6B7280]">comparability</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Across active verified comps
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-[#6B7280] mt-2 italic">Data not available.</p>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E1D4]">
            <span className="text-[10px] font-semibold text-[#6B7280]">
              Weighted Architectural Comps
            </span>
          </div>
        </div>
      </div>

      {/* ── Price History Table ── */}
      <div className="border border-[#E8E1D4] rounded-2xl p-4 sm:p-5 bg-[#FCFBF7]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#07111F] flex items-center gap-1.5 mb-3">
          <History className="h-4 w-4 text-[#C89B3C]" /> Property Price &amp; Valuation History
        </h3>

        {hasHistory ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4] text-[#07111F] font-bold">
                <tr>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Valuation Record</th>
                  <th className="text-left py-2 px-3">Model Confidence</th>
                  <th className="text-right py-2 px-3">Model Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                {priceHistory!.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F7F3EA]/50">
                    <td className="py-2.5 px-3 text-[#6B7280]">
                      {new Date(rec.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#07111F]">
                      {formatPrice(rec.predictedPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-800 font-semibold">
                      {Math.round(rec.confidence)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#6B7280] font-mono">
                      {rec.modelVersion || "v1.0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#F7F3EA] text-center border border-[#E8E1D4]/60">
            <p className="text-xs text-[#6B7280] italic">
              Data not available. (No prior price adjustments or archived historical valuations found).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
