// ================================================================
// PAGE NAME  : User Dashboard — Price Prediction History
// ROUTE      : /dashboard/predictions
// DESCRIPTION: Full history table of all AI price predictions the
//              user has run — location, type, predicted price,
//              confidence score, price range, date
//              Kiro-Maal Real Estate Master Design System
// ROLE       : USER only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BarChart3, TrendingUp, Sparkles, MapPin } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Price Predictions – Dashboard | Kiro-Maal Real Estate" };

export default async function PredictionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const predictions = await prisma.pricePrediction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const avgConfidence =
    predictions.length > 0
      ? Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length)
      : 0;

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> ML Valuation Archive
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07111F] flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-[#C89B3C]" /> Property Price Prediction History
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Historical portfolio of automated machine learning appraisals and confidence evaluations
          </p>
        </div>

        <Link
          href="/price-prediction"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105 self-start sm:self-auto"
        >
          <TrendingUp className="h-4 w-4" /> Run New Valuation
        </Link>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-16 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <BarChart3 className="h-7 w-7 opacity-80" />
          </div>
          <h3 className="font-serif font-bold text-[#07111F] text-base mb-1">No valuations run yet</h3>
          <p className="text-[#6B7280] text-xs mb-6 max-w-sm mx-auto leading-relaxed">
            Utilize our algorithmic appraisal system to estimate realistic market values for villas, houses, and land.
          </p>
          <Link
            href="/price-prediction"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105"
          >
            <TrendingUp className="h-4 w-4" /> Estimate Property Valuation
          </Link>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FCFBF7] p-5 rounded-2xl border border-[#E8E1D4] shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Total Valuation Queries</p>
              <p className="font-serif text-3xl font-bold text-[#07111F]">{predictions.length}</p>
            </div>
            <div className="bg-[#FCFBF7] p-5 rounded-2xl border border-[#E8E1D4] shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Mean Confidence Index</p>
              <p className="font-serif text-3xl font-bold text-[#07111F]">{avgConfidence}%</p>
            </div>
            <div className="bg-[#FCFBF7] p-5 rounded-2xl border border-[#E8E1D4] shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Peak Appraisal Value</p>
              <p className="font-serif text-2xl font-bold text-[#07111F]">
                {formatPrice(Math.max(...predictions.map((p) => p.predictedPrice)))}
              </p>
            </div>
          </div>

          {/* Predictions table */}
          <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Property Details</th>
                    <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Estimated Valuation</th>
                    <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Appraisal Range</th>
                    <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Confidence Index</th>
                    <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Generated Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D4]">
                  {predictions.map((pred) => (
                    <tr key={pred.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#07111F] text-xs sm:text-sm">
                          {pred.location} · <span className="text-[#A97918]">{getPropertyTypeLabel(pred.propertyType)}</span>
                        </p>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {pred.bedrooms} bed · {pred.bathrooms} bath · {pred.area} m²
                        </p>
                      </td>
                      <td className="px-4 py-4 font-serif font-bold text-[#07111F] text-sm sm:text-base">
                        {formatPrice(pred.predictedPrice)}
                      </td>
                      <td className="px-4 py-4 text-xs text-[#6B7280]">
                        {formatPrice(pred.minPrice)} – {formatPrice(pred.maxPrice)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40">
                          {Math.round(pred.confidence)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-[#6B7280]">
                        {new Date(pred.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
