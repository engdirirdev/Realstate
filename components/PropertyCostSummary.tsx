"use client";

import { useState } from "react";
import {
  Receipt,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
  Percent,
  CalendarCheck,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PropertyCostSummaryProps {
  propertyPrice: number;
  propertyType?: string;
  city?: string;
}

export default function PropertyCostSummary({
  propertyPrice,
  propertyType = "Property",
  city = "Somalia",
}: PropertyCostSummaryProps) {
  // Cost toggles
  const [includeAgencyFee, setIncludeAgencyFee] = useState(true);
  const [includeServiceCharges, setIncludeServiceCharges] = useState(true);

  // Investment settings
  const [showInvestment, setShowInvestment] = useState(true);
  const [rentalYieldPercent, setRentalYieldPercent] = useState(8.0); // 8% average yield

  // Purchase Breakdown Calculations (100% transparent, 0% interest / Riba-free)
  const registrationFee = Math.round((propertyPrice * 1.5) / 100); // 1.5% municipal title deed registration
  const documentationFee = Math.max(350, Math.round((propertyPrice * 0.5) / 100)); // Legal notarization & deed conveyance
  const agencyFee = includeAgencyFee ? Math.round((propertyPrice * 2.0) / 100) : 0; // 2% standard brokerage commission
  const serviceCharges = includeServiceCharges
    ? Math.round(Math.min(1200, Math.max(300, (propertyPrice * 0.3) / 100)))
    : 0; // Handover, verification, and utility readiness

  const totalAcquisitionCost =
    propertyPrice + registrationFee + documentationFee + agencyFee + serviceCharges;

  // Investment & Rental Yield Calculations (Asset equity & rental income model)
  const estimatedAnnualIncome = Math.round((propertyPrice * rentalYieldPercent) / 100);
  const estimatedMonthlyIncome = Math.round(estimatedAnnualIncome / 12);
  const netRoi = ((estimatedAnnualIncome / totalAcquisitionCost) * 100).toFixed(1);

  // Appreciation index estimate based on regional growth
  const appreciationRate =
    city.toLowerCase().includes("moga")
      ? 7.5
      : city.toLowerCase().includes("harge")
      ? 6.8
      : city.toLowerCase().includes("bosa")
      ? 6.2
      : 6.0;

  const estimated5YearAppreciation = Math.round(
    propertyPrice * (Math.pow(1 + appreciationRate / 100, 5) - 1)
  );

  return (
    <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-7 shadow-sm space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-[#C89B3C]/30">
            <ShieldCheck className="h-3 w-3 text-[#D9B45B]" /> Direct Acquisition • Interest-Free (Riba-Free)
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#07111F] flex items-center gap-2">
            <Receipt className="h-6 w-6 text-[#C89B3C]" /> Property Cost Summary
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Transparent all-inclusive cost breakdown for verified direct purchase.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Estimated Total Acquisition
          </p>
          <p className="text-2xl sm:text-3xl font-serif font-extrabold text-[#C89B3C] leading-none mt-1">
            {formatPrice(totalAcquisitionCost)}
          </p>
        </div>
      </div>

      {/* ── Acquisition Cost Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost Table */}
        <div className="space-y-2.5 bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-bold text-[#07111F] uppercase tracking-wider flex items-center justify-between">
            <span>Itemized Cost Item</span>
            <span>Amount (USD)</span>
          </p>

          <div className="border-t border-[#E8E1D4] pt-2.5 space-y-2 text-xs">
            {/* Base Price */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[#07111F] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#C89B3C]" /> Property Base Price
              </span>
              <span className="font-bold text-[#07111F]">{formatPrice(propertyPrice)}</span>
            </div>

            {/* Registration Fee */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[#4B5563] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]"></span>
                Registration &amp; Title Transfer (1.5%)
              </span>
              <span className="font-semibold text-[#07111F]">{formatPrice(registrationFee)}</span>
            </div>

            {/* Documentation Fee */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[#4B5563] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]"></span>
                Legal Notarization &amp; Deed Documentation
              </span>
              <span className="font-semibold text-[#07111F]">{formatPrice(documentationFee)}</span>
            </div>

            {/* Agency Fee Toggle */}
            <div className="flex items-center justify-between py-1 pt-1.5 border-t border-[#E8E1D4]/60">
              <label className="text-[#4B5563] flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAgencyFee}
                  onChange={(e) => setIncludeAgencyFee(e.target.checked)}
                  className="rounded border-[#E8E1D4] text-[#C89B3C] focus:ring-[#C89B3C] accent-[#C89B3C] h-3.5 w-3.5"
                />
                Agency &amp; Brokerage Fee (2.0% Optional)
              </label>
              <span className={`font-semibold ${includeAgencyFee ? "text-[#07111F]" : "text-[#9CA3AF] line-through"}`}>
                {includeAgencyFee ? formatPrice(agencyFee) : "$0"}
              </span>
            </div>

            {/* Service Charges Toggle */}
            <div className="flex items-center justify-between py-1">
              <label className="text-[#4B5563] flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeServiceCharges}
                  onChange={(e) => setIncludeServiceCharges(e.target.checked)}
                  className="rounded border-[#E8E1D4] text-[#C89B3C] focus:ring-[#C89B3C] accent-[#C89B3C] h-3.5 w-3.5"
                />
                Service Charges &amp; Handover Admin
              </label>
              <span className={`font-semibold ${includeServiceCharges ? "text-[#07111F]" : "text-[#9CA3AF] line-through"}`}>
                {includeServiceCharges ? formatPrice(serviceCharges) : "$0"}
              </span>
            </div>
          </div>

          {/* Subtotal summary banner */}
          <div className="pt-3 border-t border-[#E8E1D4] flex items-center justify-between text-xs font-bold text-[#07111F]">
            <span className="text-[#6B7280]">Total Acquisition Payable:</span>
            <span className="text-sm font-serif font-extrabold text-[#C89B3C]">
              {formatPrice(totalAcquisitionCost)}
            </span>
          </div>
        </div>

        {/* Ownership & Transparency Highlights */}
        <div className="bg-[#07111F] text-white rounded-2xl p-5 flex flex-col justify-between border border-[#C89B3C]/20 shadow-inner">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#D9B45B] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> 100% Sharia-Compliant Ownership
            </div>
            <h3 className="font-serif text-lg font-bold text-[#FCFBF7]">
              Direct Equity Acquisition
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Kiro-Maal ensures every real estate transaction adheres to Islamic commercial ethics.
              Transactions are completed with certified title deeds, no hidden interest, no compound fees,
              and full transparency between buyer, owner, and verified municipality offices.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 mt-4 text-xs">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <p className="text-[10px] text-[#D9B45B] font-bold uppercase tracking-wider">Title Status</p>
              <p className="font-semibold text-white mt-0.5">Freehold Verified</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <p className="text-[10px] text-[#D9B45B] font-bold uppercase tracking-wider">Financing Model</p>
              <p className="font-semibold text-white mt-0.5">Cash / Equity Installments</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Optional Investment Summary Section ── */}
      <div className="border border-[#E8E1D4] rounded-2xl bg-[#FCFBF7] overflow-hidden">
        {/* Toggle Bar */}
        <button
          type="button"
          onClick={() => setShowInvestment((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 bg-[#F7F3EA] hover:bg-[#EFE9DD] transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#07111F] flex items-center justify-center text-[#D9B45B]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold font-serif text-[#07111F]">
                Investment &amp; Rental Return Summary
              </p>
              <p className="text-[11px] text-[#6B7280]">
                Estimated rental income, gross yield, and 5-year capital appreciation projection.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-white text-[#07111F] rounded-lg border border-[#E8E1D4] shadow-xs">
            {showInvestment ? "Hide Analysis ▲" : "View Investment Potential ▼"}
          </span>
        </button>

        {showInvestment && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Estimated Monthly Rent */}
              <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1">
                  <CalendarCheck className="h-3.5 w-3.5 text-[#C89B3C]" /> Monthly Rent
                </p>
                <p className="text-xl sm:text-2xl font-serif font-extrabold text-[#07111F] mt-1.5">
                  {formatPrice(estimatedMonthlyIncome)}
                </p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">Est. rental cashflow</p>
              </div>

              {/* Estimated Annual Income */}
              <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5 text-[#C89B3C]" /> Annual Rent
                </p>
                <p className="text-xl sm:text-2xl font-serif font-extrabold text-[#07111F] mt-1.5">
                  {formatPrice(estimatedAnnualIncome)}
                </p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">Gross annual yield</p>
              </div>

              {/* Net ROI */}
              <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-[#C89B3C]" /> Estimated ROI
                </p>
                <p className="text-xl sm:text-2xl font-serif font-extrabold text-[#C89B3C] mt-1.5">
                  {netRoi}%
                </p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">Yield on total cost</p>
              </div>

              {/* 5-Yr Appreciation */}
              <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#C89B3C]" /> Appreciation
                </p>
                <p className="text-xl sm:text-2xl font-serif font-extrabold text-emerald-800 mt-1.5">
                  +{appreciationRate}%/yr
                </p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  +{formatPrice(estimated5YearAppreciation)} in 5 yrs
                </p>
              </div>
            </div>

            {/* Yield Adjuster Slider */}
            <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-[#07111F]">
                  Adjust Estimated Rental Yield ({rentalYieldPercent.toFixed(1)}% Annual):
                </label>
                <span className="text-xs text-[#6B7280]">
                  Somali urban benchmark: <strong className="text-[#07111F]">7.0% – 10.0%</strong>
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="14"
                step="0.5"
                value={rentalYieldPercent}
                onChange={(e) => setRentalYieldPercent(Number(e.target.value))}
                className="w-full accent-[#C89B3C] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#6B7280] mt-1.5">
                <span>Conservative (5.0%)</span>
                <span className="text-[#07111F] font-semibold">Standard Urban Average (8.0%)</span>
                <span>High Demand (12.0%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
