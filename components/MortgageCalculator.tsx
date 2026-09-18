"use client";

import { useState } from "react";
import { Calculator, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface MortgageCalculatorProps {
  propertyPrice: number;
}

export default function MortgageCalculator({ propertyPrice }: MortgageCalculatorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(7.5);
  const [loanTermYears, setLoanTermYears] = useState(20);

  const downPaymentAmount = (propertyPrice * downPaymentPercent) / 100;
  const principal = Math.max(0, propertyPrice - downPaymentAmount);

  // Monthly mortgage calculation: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = loanTermYears * 12;

  const monthlyPayment =
    monthlyRate > 0 && totalMonths > 0 && principal > 0
      ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : principal / (totalMonths || 1);

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <h2 className="font-bold text-[#0F172A] flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[#10B981]" /> Mortgage & Financing Calculator
        </h2>
        <span className="text-xs font-semibold px-2.5 py-1 bg-[#10B981]/10 text-[#059669] rounded-lg">
          Estimate
        </span>
      </div>

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[#64748B] font-medium">Estimated Monthly Payment</p>
          <p className="text-3xl font-extrabold text-[#10B981] mt-0.5">
            {formatPrice(Math.round(monthlyPayment))} <span className="text-xs font-normal text-[#64748B]">/ month</span>
          </p>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">
            Loan amount: {formatPrice(Math.round(principal))} over {loanTermYears} years
          </p>
        </div>

        <div className="text-right text-xs space-y-1 text-[#64748B]">
          <div className="flex justify-between sm:justify-end gap-3">
            <span>Down Payment ({downPaymentPercent}%):</span>
            <span className="font-bold text-[#0F172A]">{formatPrice(Math.round(downPaymentAmount))}</span>
          </div>
          <div className="flex justify-between sm:justify-end gap-3">
            <span>Interest Rate:</span>
            <span className="font-bold text-[#0F172A]">{interestRate}% APR</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div>
          <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
            Down Payment ({downPaymentPercent}%)
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="w-full accent-[#10B981] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-[#94A3B8] mt-1">
            <span>5%</span>
            <span>20% (Std)</span>
            <span>50%</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
            Interest Rate ({interestRate}%)
          </label>
          <input
            type="range"
            min="3"
            max="15"
            step="0.5"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full accent-[#10B981] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-[#94A3B8] mt-1">
            <span>3%</span>
            <span>7.5%</span>
            <span>15%</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
            Loan Term ({loanTermYears} Years)
          </label>
          <select
            value={loanTermYears}
            onChange={(e) => setLoanTermYears(Number(e.target.value))}
            className="w-full h-9 border border-[#E2E8F0] rounded-xl px-2 text-xs bg-white text-[#0F172A] focus:outline-none focus:border-[#10B981]"
          >
            <option value={10}>10 Years (120 mos)</option>
            <option value={15}>15 Years (180 mos)</option>
            <option value={20}>20 Years (240 mos)</option>
            <option value={25}>25 Years (300 mos)</option>
            <option value={30}>30 Years (360 mos)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
