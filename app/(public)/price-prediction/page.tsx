// ================================================================
// PAGE NAME  : Price Prediction Page
// ROUTE      : /price-prediction
// DESCRIPTION: ML-powered property price estimator — user inputs
//              city, type, bedrooms, area and gets predicted price
//              with confidence interval and market insights
//              Kiro-Maal Real Estate Master Design System
// ================================================================
"use client";

import { useState } from "react";
import { BarChart3, Brain, Loader2, TrendingUp, AlertCircle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const CITIES = ["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Garowe", "Baydhabo", "Berbera", "Afgooye"];
const TYPES = ["HOUSE", "APARTMENT", "VILLA", "OFFICE", "LAND", "COMMERCIAL", "TOWNHOUSE", "STUDIO"];

export default function PricePredictionPage() {
  const [form, setForm] = useState({
    city: "",
    type: "HOUSE",
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    isFurnished: false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? Number(value) : value,
    }));
  };

  const predict = async () => {
    if (!form.city) { setError("Please select a city."); return; }
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
        setError(`Insufficient training data: The model has zero training records for ${form.city} / ${form.type}. Numeric estimates are blocked.`);
        setResult(null);
      } else if (data.success) {
        setResult(data.prediction);
      } else {
        setError(data.error || "Prediction failed. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-[#F7F3EA] min-h-screen">
      <div className="section-container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#07111F] border border-[#C89B3C]/30 text-[#D9B45B] text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#C89B3C]" /> Kiro-Maal Valuation Model
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#07111F]">AI Property Valuation Index</h1>
          <p className="text-[#6B7280] text-sm sm:text-base mt-2 max-w-xl mx-auto">
            Input architectural parameters to receive real-time estimated market prices powered by our Somalia machine learning engine.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6 space-y-5">
            <h2 className="font-serif font-bold text-[#07111F] text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#C89B3C]" /> Property Specifications
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">City *</label>
              <select
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:outline-none focus:ring-1 focus:ring-[#C89B3C] focus:border-[#C89B3C] transition-colors"
              >
                <option value="">Select market city...</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Property Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:outline-none focus:ring-1 focus:ring-[#C89B3C] focus:border-[#C89B3C] transition-colors"
              >
                {TYPES.map((t) => <option key={t} value={t}>{getPropertyTypeLabel(t)}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Bedrooms</label>
                <input
                  name="bedrooms"
                  type="number"
                  min={0}
                  max={10}
                  value={form.bedrooms}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:outline-none focus:ring-1 focus:ring-[#C89B3C] focus:border-[#C89B3C]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Bathrooms</label>
                <input
                  name="bathrooms"
                  type="number"
                  min={0}
                  max={10}
                  value={form.bathrooms}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:outline-none focus:ring-1 focus:ring-[#C89B3C] focus:border-[#C89B3C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#07111F] mb-1.5">Floor Area (m²)</label>
              <input
                name="area"
                type="number"
                min={10}
                max={5000}
                value={form.area}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-sm focus:outline-none focus:ring-1 focus:ring-[#C89B3C] focus:border-[#C89B3C]"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                id="isFurnished"
                name="isFurnished"
                type="checkbox"
                checked={form.isFurnished}
                onChange={handleChange}
                className="w-4 h-4 accent-[#C89B3C] rounded cursor-pointer"
              />
              <label htmlFor="isFurnished" className="text-sm font-medium text-[#07111F] cursor-pointer">
                Furnished luxury interior (+15% valuation)
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
              </div>
            )}

            <Button
              onClick={predict}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm transition-all"
              size="lg"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Computing Valuation Index...</>
              ) : (
                <><Brain className="h-4 w-4 mr-2" /> Estimate Market Valuation</>
              )}
            </Button>
          </div>

          {/* Result */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="bg-[#FCFBF7] rounded-2xl border border-dashed border-[#E8E1D4] p-10 text-center flex flex-col items-center justify-center h-full min-h-[320px]">
                <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mb-3">
                  <TrendingUp className="h-7 w-7 text-[#D9B45B]" />
                </div>
                <h3 className="font-serif font-bold text-[#07111F] text-base mb-1">Awaiting Valuation Parameters</h3>
                <p className="text-[#6B7280] text-xs max-w-xs leading-relaxed">
                  Configure the property specs on the left and select Estimate Market Valuation to run the predictive algorithm.
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-10 text-center flex flex-col items-center justify-center h-full min-h-[320px]">
                <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mb-4">
                  <Loader2 className="h-7 w-7 text-[#D9B45B] animate-spin" />
                </div>
                <p className="text-[#07111F] font-serif font-bold text-base">Running Predictive Model...</p>
                <p className="text-[#6B7280] text-xs mt-1">Cross-referencing verified market data in {form.city}</p>
              </div>
            )}

            {result && (
              <>
                {/* Main prediction card */}
                <div className="bg-[#FCFBF7] border border-[#E8E1D4] shadow-sm rounded-2xl p-6 text-[#07111F]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-[#C89B3C]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">AI Estimated Valuation</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#A97918] bg-[#C89B3C]/15 border border-[#C89B3C]/30 px-2 py-0.5 rounded-full">
                      {result.confidence}% Confidence
                    </span>
                  </div>

                  <div className="font-serif text-3xl sm:text-4xl font-bold mb-1 text-[#07111F]">
                    {formatPrice(result.predictedPrice)}
                  </div>
                  <div className="text-[#6B7280] text-xs font-medium">
                    Estimated Range: <span className="text-[#07111F] font-semibold">{formatPrice(result.minPrice)}</span> – <span className="text-[#07111F] font-semibold">{formatPrice(result.maxPrice)}</span>
                  </div>

                  {result.pairCoverage && result.pairCoverage.trainRowsForPair === 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>This city and property type combination has no training examples in the dataset. The estimate is an additive extrapolation.</span>
                    </div>
                  )}

                  {result.calibration && (
                    <div className="mt-4 pt-3 border-t border-[#E8E1D4] text-xs text-[#6B7280] space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Uncertainty Margin:</span>
                        <span className="font-semibold text-[#07111F]">
                          ±${((result.maxPrice - result.minPrice) / 2).toLocaleString()} ({result.calibration.basis})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[#9CA3AF]">
                        <span>Calibration Status:</span>
                        <span className="font-mono text-amber-600">{result.calibration.status}</span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] italic">
                        {result.calibration.note}
                      </p>
                    </div>
                  )}

                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-[#6B7280] mb-1.5 font-medium">
                      <span>Model Confidence Index</span>
                      <span className="font-bold text-[#07111F]">{result.confidence}%</span>
                    </div>
                    <div className="w-full bg-[#E8E1D4] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] transition-all duration-1000"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-5">
                  <h3 className="font-serif font-bold text-[#07111F] text-sm mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-[#C89B3C]" /> Market Intelligence Insights
                  </h3>
                  <div className="space-y-2.5">
                    {result.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#07111F] leading-relaxed">
                        <CheckCircle2 className="h-4 w-4 text-[#C89B3C] mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-[#07111F] border border-[#C89B3C]/30 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-[#D9B45B] mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-[#E8E1D4]/80 leading-normal">
                    This is an algorithmic appraisal generated by Kiro-Maal data modeling. Actual market transaction prices may vary based on property condition and private negotiations.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
