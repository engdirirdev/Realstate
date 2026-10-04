// ================================================================
// PAGE NAME  : Customer Portal — Price Predictions History
// ROUTE      : /customer/predictions
// DESCRIPTION: History of all price predictions run by customer
//              Kiro-Maal Real Estate Master Design System
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BarChart3, Building2, MapPin, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Price Prediction History – Customer Portal | Kiro-Maal Real Estate" };

export default async function CustomerPredictionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const predictions = await prisma.pricePrediction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#C89B3C]" /> ML Valuation Model
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] tracking-tight">Price Prediction History</h1>
          <p className="text-[#6B7280] text-sm mt-1">{predictions.length} price estimates run through Kiro-Maal AI</p>
        </div>

        <Link
          href="/price-prediction"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105 self-start sm:self-auto"
        >
          + Run New Prediction
        </Link>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <BarChart3 className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No predictions run yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto mb-6 leading-relaxed">
            Use our Machine Learning model to calculate an estimated market valuation before acquiring or leasing property.
          </p>
          <Link
            href="/price-prediction"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105"
          >
            Predict Property Price →
          </Link>
        </div>
      ) : (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Location</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Type</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Specs</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Predicted Price</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Est. Range</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Confidence</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#07111F]">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" /> {p.location}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#A97918] text-xs font-bold uppercase tracking-wider">
                      {getPropertyTypeLabel(p.propertyType)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {p.bedrooms} beds • {p.bathrooms} baths • {p.area} m²
                    </td>
                    <td className="px-4 py-4 font-serif font-bold text-[#07111F] text-base">
                      {formatPrice(p.predictedPrice)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {formatPrice(p.minPrice)} – {formatPrice(p.maxPrice)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40">
                        {Math.round(p.confidence)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#C89B3C]" />
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
