// ================================================================
// PAGE NAME  : Customer Portal — Price Predictions History
// ROUTE      : /customer/predictions
// DESCRIPTION: History of all price predictions run by customer
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BarChart3, Building2, MapPin, Calendar, ArrowRight } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Price Prediction History – Customer Portal" };

export default async function CustomerPredictionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const predictions = await prisma.pricePrediction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] text-xs font-semibold mb-2">
            <BarChart3 className="h-3.5 w-3.5" /> ML Valuation Model
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Price Prediction History</h1>
          <p className="text-[#64748B] text-sm mt-1">{predictions.length} price estimates run</p>
        </div>

        <Link
          href="/price-prediction"
          className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
        >
          + Run New Prediction
        </Link>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <BarChart3 className="h-12 w-12 text-[#0891B2] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No predictions run yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto mb-6">
            Use our Machine Learning model to get an estimated market valuation before buying or renting.
          </p>
          <Link
            href="/price-prediction"
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Predict Property Price →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#64748B]">Location</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Type</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Specs</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Predicted Price</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Est. Range</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Confidence</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-4 font-semibold text-[#0F172A]">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#94A3B8]" /> {p.location}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#64748B] text-xs font-medium">
                      {getPropertyTypeLabel(p.propertyType)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#64748B]">
                      {p.bedrooms} beds • {p.bathrooms} baths • {p.area} m²
                    </td>
                    <td className="px-4 py-4 font-bold text-[#059669]">
                      {formatPrice(p.predictedPrice)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#64748B]">
                      {formatPrice(p.minPrice)} – {formatPrice(p.maxPrice)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC]">
                        {Math.round(p.confidence)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
