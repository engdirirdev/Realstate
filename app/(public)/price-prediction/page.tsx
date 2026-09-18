// ================================================================
// PAGE NAME  : Price Prediction Page
// ROUTE      : /price-prediction
// DESCRIPTION: ML-powered property price estimator — user inputs
//              city, type, bedrooms, area and gets predicted price
//              with confidence interval and market insights
// ================================================================
"use client";

import { useState } from "react";
import { BarChart3, Brain, Loader2, TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";

interface PredictionResult {
  predictedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
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
      if (data.success) {
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

  const confidenceColor = result
    ? result.confidence >= 75 ? "text-[#10B981]" : result.confidence >= 50 ? "text-yellow-600" : "text-red-600"
    : "";

  return (
    <div className="section-container py-12 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#ECFEFF] text-[#0891B2] px-4 py-2 rounded-full text-sm font-medium mb-3">
            <Brain className="h-4 w-4" /> Machine Learning Model
          </div>
          <h1 className="font-display text-3xl font-bold text-[#0F172A]">AI Price Prediction</h1>
          <p className="text-[#64748B] mt-2">
            Enter property details to get an estimated market price using our TensorFlow.js ML model
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6 space-y-5">
            <h2 className="font-semibold text-[#0F172A] flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#10B981]" /> Property Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">City *</label>
              <select name="city" value={form.city} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]">
                <option value="">Select city...</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Property Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]">
                {TYPES.map((t) => <option key={t} value={t}>{getPropertyTypeLabel(t)}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Bedrooms</label>
                <input name="bedrooms" type="number" min={0} max={10} value={form.bedrooms} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Bathrooms</label>
                <input name="bathrooms" type="number" min={0} max={10} value={form.bathrooms} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Area (m²)</label>
              <input name="area" type="number" min={10} max={5000} value={form.area} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#10B981]" />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isFurnished"
                name="isFurnished"
                type="checkbox"
                checked={form.isFurnished}
                onChange={handleChange}
                className="w-4 h-4 accent-[#10B981]"
              />
              <label htmlFor="isFurnished" className="text-sm text-[#0F172A]">Property is furnished (+15% value)</label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
              </div>
            )}

            <Button onClick={predict} disabled={loading} className="w-full bg-[#10B981] text-white hover:bg-[#059669] rounded-xl border-0" size="lg">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Running ML Model...</>
              ) : (
                <><Brain className="h-4 w-4 mr-2" /> Predict Price</>
              )}
            </Button>
          </div>

          {/* Result */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E2E8F0] p-10 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-[#94A3B8] mb-3" />
                <p className="text-[#64748B] text-sm">Fill in the property details and click Predict Price to see the estimated market value.</p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-10 text-center">
                <Loader2 className="h-12 w-12 mx-auto text-[#0891B2] animate-spin mb-3" />
                <p className="text-[#0F172A] font-medium">Running ML model...</p>
                <p className="text-[#94A3B8] text-sm mt-1">Analyzing market data for {form.city}</p>
              </div>
            )}

            {result && (
              <>
                {/* Main prediction card */}
                <div className="bg-white border border-[#E2E8F0] shadow-card rounded-2xl p-6 text-[#0F172A]">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-4 w-4 text-[#06B6D4]" />
                    <span className="text-sm font-medium text-[#64748B]">AI Predicted Price</span>
                  </div>
                  <div className="text-3xl font-bold mb-1 text-[#059669]">{formatPrice(result.predictedPrice)}</div>
                  <div className="text-[#64748B] text-sm">
                    Range: {formatPrice(result.minPrice)} – {formatPrice(result.maxPrice)}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 bg-[#E2E8F0] rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] transition-all duration-1000"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold text-[#06B6D4] px-2 py-0.5`}>
                      {result.confidence}%
                    </span>
                  </div>
                  <p className="text-[#94A3B8] text-xs mt-1">Model confidence</p>
                </div>

                {/* Insights */}
                <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-5">
                  <h3 className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-[#10B981]" /> Price Insights
                  </h3>
                  <div className="space-y-2">
                    {result.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-[#0F172A]">
                        <CheckCircle2 className="h-4 w-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-700">
                    This is an AI-generated estimate based on training data. Actual market prices may vary. Always consult a local agent before making decisions.
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
