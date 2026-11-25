"use client";

import React from "react";
import { Phone, CheckCircle2, AlertCircle } from "lucide-react";
import {
  SOMALI_COUNTRY_CODE,
  extractSomaliLocalDigits,
  isPartialSomaliPrefixValid,
  validateSomaliPhone,
} from "@/lib/validation";

interface SomaliPhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (fullPhone: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  showHelper?: boolean;
}

/**
 * Luxury Somali Phone Input:
 * - Automatically locks "+252" prefix
 * - Accepts ONLY 9 digits after +252
 * - Immediately flags invalid prefixes (must start with 61, 62, 63, 64, 65, 66, 90, or 77)
 */
export function SomaliPhoneInput({
  id,
  name = "phone",
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "61 234 5678",
  className = "",
  compact = false,
  showHelper = true,
}: SomaliPhoneInputProps) {
  const localDigits = extractSomaliLocalDigits(value);
  const hasDigits = localDigits.length > 0;
  const prefixOk = isPartialSomaliPrefixValid(localDigits);
  const fullCheck = hasDigits ? validateSomaliPhone(`${SOMALI_COUNTRY_CODE}${localDigits}`) : null;
  const isCompleteValid = Boolean(fullCheck?.valid && localDigits.length === 9);
  const hasError = hasDigits && (!prefixOk || (localDigits.length === 9 && !fullCheck?.valid));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = extractSomaliLocalDigits(e.target.value);
    onChange(cleaned ? `${SOMALI_COUNTRY_CODE}${cleaned}` : "");
  };

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center rounded-xl border bg-white overflow-hidden transition-all ${
          hasError
            ? "border-red-500 ring-2 ring-red-500/15"
            : isCompleteValid
            ? "border-emerald-500/70 ring-1 ring-emerald-500/15"
            : "border-[#E8E1D4] focus-within:border-[#C89B3C] focus-within:ring-2 focus-within:ring-[#C89B3C]/20"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-[#F7F3EA]" : ""} ${className}`}
      >
        {/* Fixed +252 Prefix */}
        <div
          className={`flex items-center gap-1.5 bg-[#07111F] text-[#D9B45B] font-mono font-bold select-none shrink-0 border-r border-[#C89B3C]/30 ${
            compact ? "px-2.5 h-8.5 text-[11px]" : "px-3 h-10 text-xs"
          }`}
          title="Somalia Country Code (+252)"
        >
          <Phone className={compact ? "h-3 w-3 text-[#D9B45B]" : "h-3.5 w-3.5 text-[#D9B45B]"} />
          <span>+252</span>
        </div>

        {/* 9-digit Local Number Input */}
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={9}
          required={required}
          disabled={disabled}
          value={localDigits}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`flex-1 min-w-0 bg-transparent text-[#07111F] placeholder:text-[#9CA3AF] outline-none font-mono tracking-wide ${
            compact ? "px-2.5 h-8.5 text-xs" : "px-3 h-10 text-sm"
          }`}
        />

        {/* Status / Counter Badge */}
        <div className="pr-2.5 flex items-center gap-1 shrink-0">
          {isCompleteValid ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : hasError ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : hasDigits ? (
            <span className="text-[10px] font-mono font-bold text-[#6B7280]">
              {localDigits.length}/9
            </span>
          ) : null}
        </div>
      </div>

      {/* Live Validation Feedback */}
      {hasError ? (
        <p className="text-[11px] font-medium text-red-600 leading-tight">
          After +252, number must start with 61, 62, 63, 64, 65, 66, 90, or 77 (9 digits total).
        </p>
      ) : hasDigits && localDigits.length < 9 && showHelper ? (
        <p className="text-[11px] text-[#A97918] leading-tight">
          Enter {9 - localDigits.length} more digit{9 - localDigits.length === 1 ? "" : "s"} (9 digits required after +252).
        </p>
      ) : null}
    </div>
  );
}

