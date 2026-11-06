"use client";

import { useState , memo } from "react";
import {
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PropertyCostSummaryProps {
  propertyPrice: number;
  basePrice?: number | null;
  companyServiceFee?: number | null;
  legalTransferFee?: number | null;
  brokerCommission?: number | null;
  propertyType?: string;
  city?: string;
  listingType?: string | null;
  rentPeriod?: string | null;
}

function PropertyCostSummary({
  propertyPrice,
  basePrice,
  companyServiceFee,
  legalTransferFee,
  brokerCommission,
  propertyType = "Property",
  city = "Somalia",
  listingType,
  rentPeriod,
}: PropertyCostSummaryProps) {
  const isRent = listingType === "FOR_RENT";
  const [useBroker, setUseBroker] = useState(false);

  const effectiveCompanyFee =
    typeof companyServiceFee === "number" && companyServiceFee >= 0
      ? companyServiceFee
      : (isRent ? 0 : 300);
  const effectiveLegalFee =
    typeof legalTransferFee === "number" && legalTransferFee >= 0
      ? legalTransferFee
      : (isRent ? 0 : 200);
  const effectiveBrokerFee =
    typeof brokerCommission === "number" && brokerCommission >= 0
      ? brokerCommission
      : (isRent ? 0 : 500);
  const effectiveBasePrice =
    typeof basePrice === "number" && basePrice > 0
      ? basePrice
      : Math.max(0, propertyPrice - effectiveCompanyFee - effectiveLegalFee);

  const totalBasePlusFees = effectiveBasePrice + effectiveCompanyFee + effectiveLegalFee;
  const finalPrice = totalBasePlusFees + (useBroker ? effectiveBrokerFee : 0);

  const periodUnit = (rentPeriod || "monthly").toLowerCase().replace("ly", "").replace("dai", "day");

  return (
    <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-7 shadow-sm space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-[#C89B3C]/30">
            <ShieldCheck className="h-3 w-3 text-[#D9B45B]" />{" "}
            {isRent ? "Direct Tenancy • Verified Lease Agreement" : "Direct Acquisition • Interest-Free (Riba-Free)"}
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#07111F] flex items-center gap-2">
            <Receipt className="h-6 w-6 text-[#C89B3C]" />{" "}
            {isRent ? "Rental Cost Summary" : "Property Cost Summary"}
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {isRent
              ? "Transparent tenancy breakdown. Only the base rent multiplies with duration; service and legal fees are one-time charges."
              : "Transparent all-inclusive cost breakdown for verified direct purchase."}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
            {isRent
              ? `Base Rate (${periodUnit}) + One-Time Fees`
              : useBroker
              ? "Final Purchase Price (with Broker)"
              : "Total Purchase Price"}
          </p>
          <p className="text-2xl sm:text-3xl font-serif font-extrabold text-[#C89B3C] leading-none mt-1">
            {formatPrice(finalPrice)}
          </p>
        </div>
      </div>

      {/* ── Acquisition / Rental Cost Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost Table */}
        <div className="space-y-2.5 bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-bold text-[#07111F] uppercase tracking-wider flex items-center justify-between">
            <span>Itemized Cost Item</span>
            <span>Amount (USD)</span>
          </p>

          <div className="border-t border-[#E8E1D4] pt-2.5 space-y-2 text-xs">
            {/* 1. Property Base Price */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[#07111F] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                {isRent ? `Property Base Rent (per ${periodUnit})` : "Property Base Price"}
              </span>
              <span className="font-bold text-[#07111F]">{formatPrice(effectiveBasePrice)}</span>
            </div>

            {/* 2. Company Service Fee */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[#4B5563] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]"></span>
                Company Service Fee {isRent ? "(One-Time)" : "(Required)"}
              </span>
              <span className="font-semibold text-[#07111F]">{formatPrice(effectiveCompanyFee)}</span>
            </div>

            {/* 3. Legal Transfer Fee */}
            <div className="flex items-center justify-between py-1">
              <span className="text-[#4B5563] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]"></span>
                {isRent ? "Legal / Tenancy Agreement Fee (One-Time)" : "Legal Transfer Fee (Required)"}
              </span>
              <span className="font-semibold text-[#07111F]">{formatPrice(effectiveLegalFee)}</span>
            </div>

            {/* 4. Broker Commission Toggle (Optional, not included by default) */}
            <div className="flex items-center justify-between py-1 pt-1.5 border-t border-[#E8E1D4]/60">
              <label className="text-[#4B5563] flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useBroker}
                  onChange={(e) => setUseBroker(e.target.checked)}
                  className="rounded border-[#E8E1D4] text-[#C89B3C] focus:ring-[#C89B3C] accent-[#C89B3C] h-3.5 w-3.5 cursor-pointer"
                />
                <span>Broker Commission (Optional)</span>
              </label>
              <span className={`font-semibold ${useBroker ? "text-[#07111F]" : "text-[#9CA3AF] line-through"}`}>
                {useBroker ? formatPrice(effectiveBrokerFee) : formatPrice(effectiveBrokerFee)}
              </span>
            </div>
          </div>

          {/* Subtotal summary banner */}
          <div className="pt-3 border-t border-[#E8E1D4] flex items-center justify-between text-xs font-bold text-[#07111F]">
            <span className="text-[#6B7280]">
              {isRent
                ? "Total Initial Period + Fees:"
                : useBroker
                ? "Final Purchase Price (with Broker):"
                : "Total Purchase Price:"}
            </span>
            <span className="text-sm font-serif font-extrabold text-[#C89B3C]">
              {formatPrice(finalPrice)}
            </span>
          </div>

          {isRent && (
            <div className="bg-[#FAF6EC] border border-[#E8DEC8] p-2.5 rounded-xl text-[11px] text-[#8C6D23] flex items-start gap-1.5 mt-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Duration Rule:</strong> When booking, only the Base Rent ({formatPrice(effectiveBasePrice)}) multiplies by the number of {periodUnit}s. Service and legal fees are one-time charges.
              </span>
            </div>
          )}
        </div>

        {/* Ownership & Transparency Highlights */}
        <div className="bg-[#07111F] text-white rounded-2xl p-5 flex flex-col justify-between border border-[#C89B3C]/20 shadow-inner">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#D9B45B] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> 100% Sharia-Compliant Process
            </div>
            <h3 className="font-serif text-lg font-bold text-[#FCFBF7]">
              {isRent ? "Verified Tenancy Agreement" : "Direct Equity Acquisition"}
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {isRent
                ? "Kiro-Maal ensures every tenancy is protected by transparent lease agreements, zero hidden surcharges, certified rent receipts, and clear tenant protections under verified Somali regional guidelines."
                : "Kiro-Maal ensures every real estate transaction adheres to Islamic commercial ethics. Transactions are completed with certified title deeds, no hidden interest, no compound fees, and full transparency between buyer, owner, and verified municipality offices."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 mt-4 text-xs">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <p className="text-[10px] text-[#D9B45B] font-bold uppercase tracking-wider">
                {isRent ? "Tenancy Status" : "Title Status"}
              </p>
              <p className="font-semibold text-white mt-0.5">
                {isRent ? "Verified Leasehold" : "Freehold Verified"}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <p className="text-[10px] text-[#D9B45B] font-bold uppercase tracking-wider">
                {isRent ? "Payment Schedule" : "Financing Model"}
              </p>
              <p className="font-semibold text-white mt-0.5">
                {isRent ? `Per ${periodUnit} (Duration)` : "Cash / Equity Installments"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PropertyCostSummary);
