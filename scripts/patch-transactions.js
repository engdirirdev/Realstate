const fs = require('fs');
let code = fs.readFileSync('components/transactions/CentralTransactionsView.tsx', 'utf8');

code = code.replace(
  'import { useCallback, useEffect, useState } from "react";',
  'import { useCallback, useEffect, useState, useRef } from "react";'
);

const targetInterface = `interface CentralTransactionsViewProps {
  isAdmin?: boolean;
  initialTab?: "payments" | "ledger";
}`;

const replInterface = `interface CentralTransactionsViewProps {
  isAdmin?: boolean;
  initialTab?: "payments" | "ledger";
  initialPaymentsData?: {
    payments: any[];
    totalRevenue: number;
    totalPaidTransactions: number;
    totalDeals?: number;
  };
  initialLedgerData?: {
    items: any[];
    total: number;
    totalPages: number;
    revenue?: number | null;
  };
}`;

code = code.replace(targetInterface, replInterface);

const targetProps = `export default function CentralTransactionsView({
  isAdmin = false,
  initialTab = "payments",
}: CentralTransactionsViewProps) {
  const [activeTab, setActiveTab] = useState<"payments" | "ledger">(isAdmin ? initialTab : "payments");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  // --- Payment Gateway Logs State ---
  const [paymentsQ, setPaymentsQ] = useState("");
  const [paymentsStatus, setPaymentsStatus] = useState("ALL");
  const [paymentsData, setPaymentsData] = useState<{
    payments: any[];
    totalRevenue: number;
    totalPaidTransactions: number;
    totalDeals?: number;
  }>({
    payments: [],
    totalRevenue: 0,
    totalPaidTransactions: 0,
    totalDeals: 0,
  });
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // --- Transactions Ledger State ---
  const [ledgerType, setLedgerType] = useState<"ALL" | "SALE" | "RENTAL">(isAdmin ? "ALL" : "RENTAL");
  const [ledgerStatus, setLedgerStatus] = useState("ALL");
  const [ledgerQ, setLedgerQ] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerData, setLedgerData] = useState<{
    items: any[];
    total: number;
    totalPages: number;
    revenue?: number | null;
  }>({
    items: [],
    total: 0,
    totalPages: 1,
  });
  const [ledgerLoading, setLedgerLoading] = useState(true);`;

const replProps = `export default function CentralTransactionsView({
  isAdmin = false,
  initialTab = "payments",
  initialPaymentsData,
  initialLedgerData,
}: CentralTransactionsViewProps) {
  const [activeTab, setActiveTab] = useState<"payments" | "ledger">(isAdmin ? initialTab : "payments");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  // --- Payment Gateway Logs State (SSR pre-hydrated for 0ms render) ---
  const [paymentsQ, setPaymentsQ] = useState("");
  const [paymentsStatus, setPaymentsStatus] = useState("ALL");
  const [paymentsData, setPaymentsData] = useState<{
    payments: any[];
    totalRevenue: number;
    totalPaidTransactions: number;
    totalDeals?: number;
  }>(initialPaymentsData || {
    payments: [],
    totalRevenue: 0,
    totalPaidTransactions: 0,
    totalDeals: 0,
  });
  const [paymentsLoading, setPaymentsLoading] = useState(initialPaymentsData ? false : true);

  // --- Transactions Ledger State (SSR pre-hydrated for 0ms render) ---
  const [ledgerType, setLedgerType] = useState<"ALL" | "SALE" | "RENTAL">(isAdmin ? "ALL" : "RENTAL");
  const [ledgerStatus, setLedgerStatus] = useState("ALL");
  const [ledgerQ, setLedgerQ] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerData, setLedgerData] = useState<{
    items: any[];
    total: number;
    totalPages: number;
    revenue?: number | null;
  }>(initialLedgerData || {
    items: [],
    total: 0,
    totalPages: 1,
  });
  const [ledgerLoading, setLedgerLoading] = useState(initialLedgerData ? false : true);`;

code = code.replace(targetProps, replProps);

const targetEffects = `  useEffect(() => {
    const t = setTimeout(loadPayments, paymentsQ ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadPayments, paymentsQ]);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(loadLedger, ledgerQ ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadLedger, ledgerQ, isAdmin]);`;

const replEffects = `  const isInitialPaymentsMount = useRef(true);
  const isInitialLedgerMount = useRef(true);

  useEffect(() => {
    if (isInitialPaymentsMount.current) {
      isInitialPaymentsMount.current = false;
      if (initialPaymentsData) return;
    }
    const t = setTimeout(loadPayments, paymentsQ ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadPayments, paymentsQ, initialPaymentsData]);

  useEffect(() => {
    if (!isAdmin) return;
    if (isInitialLedgerMount.current) {
      isInitialLedgerMount.current = false;
      if (initialLedgerData) return;
    }
    const t = setTimeout(loadLedger, ledgerQ ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadLedger, ledgerQ, isAdmin, initialLedgerData]);`;

code = code.replace(targetEffects, replEffects);

fs.writeFileSync('components/transactions/CentralTransactionsView.tsx', code, 'utf8');
console.log('CentralTransactionsView patched successfully');

