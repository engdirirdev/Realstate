"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Calendar,
  History,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";

interface PredictionResult {
  predictedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  calibration?: {
    status: string;
    basis: string;
    outOfSampleMAE: number;
    n: number;
    note: string;
  };
  pairCoverage?: {
    trainRowsForPair: number;
    cityTrainRows: number;
    typeTrainRows: number;
  };
  positionSuppressed?: boolean;
  suppressReason?: string;
  insights: string[];
}

interface PastPrediction {
  id: string;
  location: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  predictedPrice: number;
  confidence: number;
  createdAt: Date | string;
}

const CITIES = [
  "Mogadishu",
  "Hargeisa",
  "Bosaso",
  "Kismayo",
  "Garowe",
  "Baydhabo",
  "Berbera",
  "Afgooye",
];

const TYPES = [
  "HOUSE",
  "APARTMENT",
  "VILLA",
  "OFFICE",
  "LAND",
  "COMMERCIAL",
  "TOWNHOUSE",
  "STUDIO",
];

export default function DashboardPricePrediction({
  initialPredictions = [],
}: {
  initialPredictions?: PastPrediction[];
}) {
  const [form, setForm] = useState({
    city: "Mogadishu",
    type: "VILLA",
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    isFurnished: true,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");
  const [predictionsList, setPredictionsList] = useState<PastPrediction[]>(initialPredictions);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city) {
      setError("Please select a city.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/price-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.status === "INSUFFICIENT_DATA") {
        setError(
          `Insufficient model data: No training samples recorded for ${form.city} / ${form.type}.`
        );
        setResult(null);
      } else if (data.success && data.prediction) {
        setResult(data.prediction);
        // Add to history list immediately
        const newRecord: PastPrediction = {
          id: "pred-" + Date.now(),
          location: form.city,
          propertyType: form.type,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          area: form.area,
          predictedPrice: data.prediction.predictedPrice,
          confidence: data.prediction.confidence,
          createdAt: new Date(),
        };
        setPredictionsList((prev) => [newRecord, ...prev]);
      } else {
        setError(data.error || "Valuation failed. Please try again.");
      }
    } catch {
      setError("Network or valuation engine connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ─── Interactive AI Valuation Workspace ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E8E1D4]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C99126] to-[#E8B849] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#07111F]">
                AI Property Price Estimator
              </h2>
              <p className="text-xs text-[#6B7280]">
                Predict fair market valuations based on regional real estate data
              </p>
            </div>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#07111F] mb-1.5 uppercase tracking-wider">
                  Target City *
                </label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] transition-all"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07111F] mb-1.5 uppercase tracking-wider">
                  Property Type *
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] transition-all"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {getPropertyTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#07111F] mb-1.5 uppercase tracking-wider">
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  min="0"
                  max="20"
                  value={form.bedrooms}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07111F] mb-1.5 uppercase tracking-wider">
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  min="1"
                  max="15"
                  value={form.bathrooms}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07111F] mb-1.5 uppercase tracking-wider">
                  Total Area (m²)
                </label>
                <input
                  type="number"
                  name="area"
                  min="20"
                  max="10000"
                  value={form.area}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="isFurnished"
                name="isFurnished"
                checked={form.isFurnished}
                onChange={handleChange}
                className="w-4 h-4 rounded text-[#C89B3C] focus:ring-[#C89B3C] border-gray-300"
              />
              <label
                htmlFor="isFurnished"
                className="text-xs font-semibold text-[#07111F] cursor-pointer"
              >
                Furnished / Interior Finish Included
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:brightness-105 text-[#07111F] font-bold text-xs sm:text-sm shadow-md shadow-[#C89B3C]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating AI Valuation...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Calculate Fair Market Value
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Result: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="bg-[#07111F] text-white rounded-2xl border border-[#C89B3C]/40 p-6 shadow-xl relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C89B3C]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D9B45B] bg-[#C89B3C]/20 px-2.5 py-1 rounded-md border border-[#C89B3C]/30">
                  ML Valuation Result
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> {result.confidence}% Confidence
                </span>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-400 font-medium">Predicted Market Value</p>
                <h3 className="font-serif text-3xl sm:text-4xl font-black text-[#D9B45B] tracking-tight mt-1">
                  {formatPrice(result.predictedPrice)}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Estimated Range:{" "}
                  <span className="text-slate-200 font-semibold">
                    {formatPrice(result.minPrice)} – {formatPrice(result.maxPrice)}
                  </span>
                </p>
              </div>

              {result.insights && result.insights.length > 0 && (
                <div className="pt-4 border-t border-[#1B2738] space-y-2">
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Model Intelligence:
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {result.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C89B3C] shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-8 text-center shadow-xs flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F3EA] text-[#C89B3C] flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#07111F] text-sm">
                Ready to Evaluate
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-xs">
                Select your property parameters and click Calculate to view automated ML pricing metrics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Prediction History Section ─── */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E8E1D4]">
          <History className="w-5 h-5 text-[#C89B3C]" />
          <h3 className="font-serif text-lg font-bold text-[#07111F]">
            Recent Prediction Records ({predictionsList.length})
          </h3>
        </div>

        {predictionsList.length === 0 ? (
          <div className="text-center py-10 text-[#6B7280] text-xs">
            No valuation history recorded yet. Run a prediction above to build your portfolio.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E1D4] text-[#6B7280] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Location & Type</th>
                  <th className="py-3 px-3">Specs</th>
                  <th className="py-3 px-3">Estimated Price</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]/60">
                {predictionsList.map((p) => (
                  <tr key={p.id} className="hover:bg-white/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#07111F]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>{p.location}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F7F3EA] text-[#A97918] font-bold">
                          {p.propertyType}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#475569]">
                      {p.bedrooms} Beds · {p.bathrooms} Baths · {p.area} m²
                    </td>
                    <td className="py-3 px-3 font-bold text-[#07111F]">
                      {formatPrice(p.predictedPrice)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                        <Percent className="w-3 h-3" /> {p.confidence}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#6B7280]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
