"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Loader2,
  Smartphone,
  Building,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import type { PaymentMethodConfig } from "@/lib/payment-settings";

function generateAutoTransactionRef(methodId: string = "evc_plus"): string {
  const prefixMap: Record<string, string> = {
    evc_plus: "EVC",
    zaad: "ZAAD",
    sahal: "SAHAL",
    bank_transfer: "BANK",
  };
  const tag = prefixMap[methodId] || "PAY";
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TXN-${tag}-${rand}`;
}

export interface PurchasePayTarget {
  transactionId: string;
  txnNo?: string;
  requestNo?: string;
  propertyTitle?: string;
  customerName?: string;
  amount: number;
}

interface PurchasePaymentModalProps {
  target: PurchasePayTarget | null;
  onClose: () => void;
  onConfirmPay: (paymentMethod: string, transactionRef: string) => Promise<void>;
  submitting: boolean;
}

export default function PurchasePaymentModal({
  target,
  onClose,
  onConfirmPay,
  submitting,
}: PurchasePaymentModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("evc_plus");
  const [transactionRef, setTransactionRef] = useState<string>(() =>
    generateAutoTransactionRef("evc_plus")
  );
  const [loadingMethods, setLoadingMethods] = useState(false);

  useEffect(() => {
    if (!target) return;
    setTransactionRef(generateAutoTransactionRef(selectedMethodId));

    if (paymentMethods.length === 0) {
      setLoadingMethods(true);
      fetch("/api/payment-methods")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.methods) && data.methods.length > 0) {
            setPaymentMethods(data.methods);
            const firstId = data.methods[0].id;
            setSelectedMethodId(firstId);
            setTransactionRef(generateAutoTransactionRef(firstId));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingMethods(false));
    }
  }, [target, paymentMethods.length, selectedMethodId]);

  const selectedPaymentMethod = useMemo(() => {
    return paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0];
  }, [paymentMethods, selectedMethodId]);

  const handleSubmit = async () => {
    const finalMethod = selectedPaymentMethod?.name || "EVC Plus";
    const finalRef = transactionRef.trim() || generateAutoTransactionRef(selectedMethodId);
    await onConfirmPay(finalMethod, finalRef);
  };

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#07111F] text-[#D9B45B]">
              Property Purchase Settlement
            </span>
            {target?.txnNo && (
              <span className="text-xs font-mono font-semibold text-[#C89B3C]">
                #{target.txnNo}
              </span>
            )}
          </div>
          <DialogTitle className="text-xl font-bold font-serif text-[#07111F] flex items-center gap-2 mt-1">
            <CreditCard className="h-5 w-5 text-[#C89B3C]" />
            Dedicated Payment Step
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6B7280]">
            Select your preferred payment method and confirm your property purchase settlement.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-4 mt-2">
            {/* Deep Navy Payment Summary Card */}
            <div className="bg-[#07111F] text-white p-4 rounded-xl border border-[#C89B3C]/30 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-[#D9B45B] uppercase tracking-wider text-[11px]">
                  Payment Summary
                </span>
                <span className="font-mono text-xs text-[#94A3B8]">
                  {target.requestNo ? `#${target.requestNo}` : "Property Acquisition"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#94A3B8] block">Property:</span>
                  <span className="font-semibold text-white truncate block">
                    {target.propertyTitle || "Verified Property"}
                  </span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block">Customer:</span>
                  <span className="font-semibold text-white truncate block">
                    {target.customerName || "Verified Buyer"}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-white block font-medium">
                    Property Acquisition Settlement
                  </span>
                  <span className="text-[#94A3B8] text-[11px] block">
                    Official receipt issued immediately upon payment
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#D9B45B] block font-bold uppercase">
                    Total Amount
                  </span>
                  <span className="font-serif font-black text-lg text-[#D9B45B]">
                    {formatPrice(target.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Select Payment Method Grid */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">
                Select Payment Method
              </Label>
              {loadingMethods ? (
                <div className="flex items-center justify-center p-4 text-xs text-[#6B7280]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#C89B3C] mr-2" /> Loading payment
                  channels...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((m) => {
                    const isSelected = selectedMethodId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMethodId(m.id);
                          setTransactionRef(generateAutoTransactionRef(m.id));
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#FAF6EC] border-[#C89B3C] ring-2 ring-[#C89B3C]/30 shadow-xs"
                            : "bg-white border-[#E8E1D4] hover:border-[#C89B3C]/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#07111F]">{m.name}</span>
                          {m.type === "mobile_money" ? (
                            <Smartphone className="h-3.5 w-3.5 text-[#C89B3C]" />
                          ) : (
                            <Building className="h-3.5 w-3.5 text-[#C89B3C]" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#6B7280] mt-1 font-mono">
                          {m.accountNumber}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Settlement Instructions & Auto-Generated Reference */}
            {selectedPaymentMethod && (
              <div className="bg-[#FAF6EC] border border-[#E8DEC8] p-3.5 rounded-xl space-y-3 text-xs">
                <div className="flex items-center gap-1.5 text-[#8C6D23] font-bold">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Settlement Instructions — {selectedPaymentMethod.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-[#E8DEC8]">
                  {selectedPaymentMethod.bankName && (
                    <div className="col-span-2">
                      <span className="text-[#6B7280] block text-[10px]">Bank Name:</span>
                      <span className="font-bold text-[#07111F]">
                        {selectedPaymentMethod.bankName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">Account Name:</span>
                    <span className="font-bold text-[#07111F]">
                      {selectedPaymentMethod.accountName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">
                      {selectedPaymentMethod.type === "bank_transfer"
                        ? "Account Number:"
                        : "Merchant / Phone #:"}
                    </span>
                    <span className="font-mono font-bold text-[#07111F]">
                      {selectedPaymentMethod.accountNumber}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6B7280] block text-[10px]">Amount to Transfer:</span>
                    <span className="font-serif font-black text-sm text-[#C89B3C]">
                      {formatPrice(target.amount)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  {selectedPaymentMethod.instructions}
                </p>

                <div className="space-y-1 pt-1 border-t border-[#E8DEC8]">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-[#07111F]">
                      Transaction Reference (Auto-Generated)
                    </Label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Auto-Generated
                    </span>
                  </div>
                  <Input
                    value={transactionRef}
                    readOnly
                    className="h-10 bg-white border-[#C89B3C]/50 rounded-xl font-mono font-bold text-xs text-[#07111F] focus:ring-2 focus:ring-[#C89B3C]"
                  />
                  <p className="text-[10px] text-[#6B7280]">
                    Payment will be verified and forwarded for final ownership approval by Admin.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl border-[#E8E1D4] text-[#07111F]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] rounded-xl gap-2 font-bold border-0 hover:opacity-95 cursor-pointer shadow-md"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirm &amp; Pay {formatPrice(target.amount)}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

