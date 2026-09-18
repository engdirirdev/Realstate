// ================================================================
// PAGE NAME  : User Dashboard — Price Prediction History
// ROUTE      : /dashboard/predictions
// DESCRIPTION: Full history table of all AI price predictions the
//              user has run — location, type, predicted price,
//              confidence score, price range, date
// ROLE       : USER only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Price Predictions – Dashboard" };

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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" /> Price Predictions History
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          All your AI-powered property price estimates
        </p>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <BarChart3 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No predictions yet</h3>
          <p className="text-gray-500 text-sm mb-6">
            Use the Price Prediction tool to get AI-powered property valuations.
          </p>
          <a
            href="/price-prediction"
            className="btn-gradient inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
          >
            <TrendingUp className="h-4 w-4" /> Predict a Property Price
          </a>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="text-xs text-gray-400 mb-1">Total Predictions</p>
              <p className="text-3xl font-bold text-gray-900">{predictions.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-400 mb-1">Avg Confidence</p>
              <p className="text-3xl font-bold text-gray-900">{avgConfidence}%</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-400 mb-1">Highest Prediction</p>
              <p className="text-2xl font-bold text-primary-700">
                {formatPrice(Math.max(...predictions.map((p) => p.predictedPrice)))}
              </p>
            </div>
          </div>

          {/* Predictions table */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Property Details</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Predicted Price</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Price Range</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Confidence</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {predictions.map((pred) => (
                    <tr key={pred.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {pred.location} · {getPropertyTypeLabel(pred.propertyType)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {pred.bedrooms} bed · {pred.bathrooms} bath · {pred.area}m²
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-primary-700 font-bold text-base">
                          {formatPrice(pred.predictedPrice)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs">
                        {formatPrice(pred.minPrice)} – {formatPrice(pred.maxPrice)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                pred.confidence >= 75
                                  ? "bg-green-500"
                                  : pred.confidence >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${pred.confidence}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              pred.confidence >= 75
                                ? "text-green-600"
                                : pred.confidence >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {pred.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-400 text-xs">
                        {new Date(pred.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
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
