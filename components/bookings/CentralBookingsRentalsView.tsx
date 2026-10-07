"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  Loader2,
  RefreshCw,
  Search,
  Check,
  MapPin,
  Eye,
  PlusCircle,
  Receipt,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  ShieldCheck,
  CalendarDays,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice, cn } from "@/lib/utils";

function getInitials(name?: string | null): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface CentralBookingsRentalsViewProps {
  isAdmin?: boolean;
  initialTab?: "bookings" | "rentals";
}

export default function CentralBookingsRentalsView({
  isAdmin = false,
  initialTab = "bookings",
}: CentralBookingsRentalsViewProps) {
  // Segmented control: "bookings" | "rentals" (Section 4)
  const [activeTab, setActiveTab] = useState<"bookings" | "rentals">(initialTab);

  // Sync initialTab when route or parent prop changes
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ─── TAB 1: RENTAL BOOKINGS STATE ───
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsRefreshing, setBookingsRefreshing] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [bookingSearch, setBookingSearch] = useState("");
  const [debouncedBookingSearch, setDebouncedBookingSearch] = useState("");
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingTotal, setBookingTotal] = useState(0);

  // ─── TAB 2: ACTIVE RENTALS STATE ───
  const [rentals, setRentals] = useState<any[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [rentalsRefreshing, setRentalsRefreshing] = useState(false);
  const [rentalsError, setRentalsError] = useState<string | null>(null);
  const [rentalStatusFilter, setRentalStatusFilter] = useState("ALL");
  const [rentalSearch, setRentalSearch] = useState("");
  const [debouncedRentalSearch, setDebouncedRentalSearch] = useState("");
  const [rentalPage, setRentalPage] = useState(1);
  const [rentalTotal, setRentalTotal] = useState(0);

  // Debounce search inputs to prevent network spam on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBookingSearch(bookingSearch), 250);
    return () => clearTimeout(t);
  }, [bookingSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedRentalSearch(rentalSearch), 250);
    return () => clearTimeout(t);
  }, [rentalSearch]);

  // ─── ONLY 4 SUMMARY CARDS (Section 3) ───
  const [metrics, setMetrics] = useState({
    pendingBookings: 0,
    approvedBookings: 0,
    activeRentals: 0,
    expiringSoon: 0,
  });

  // ─── ACTION MODALS STATE ───
  const [viewBookingTarget, setViewBookingTarget] = useState<any | null>(null);
  const [viewRentalTarget, setViewRentalTarget] = useState<any | null>(null);
  const [rejectingBooking, setRejectingBooking] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // ─── CREATE DIRECT RENTAL MODAL (Manager Only - Section 22, 25, 29) ───
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creatingDirect, setCreatingDirect] = useState(false);
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [directPropertyId, setDirectPropertyId] = useState("");
  const [directCustomerId, setDirectCustomerId] = useState("");
  const [directCheckIn, setDirectCheckIn] = useState("");
  const [directCheckOut, setDirectCheckOut] = useState("");
  const [directRentAmount, setDirectRentAmount] = useState("");
  const [directDeposit, setDirectDeposit] = useState("0");
  const [directNotes, setDirectNotes] = useState("");

  // ─── 1. Fetch 4 Summary Metrics (Section 3) ───
  const fetchMetrics = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, activeRes] = await Promise.all([
        fetch("/api/requests?kind=rental&mode=bookings&status=PENDING&pageSize=1").then((r) => r.json()),
        fetch("/api/requests?kind=rental&mode=bookings&status=APPROVED&pageSize=1").then((r) => r.json()),
        fetch("/api/requests?kind=rental&mode=rentals&status=ACTIVE&pageSize=100").then((r) => r.json()),
      ]);

      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const expiringSoonCount = (activeRes.items || []).filter((r: any) => {
        if (!r.endDate) return false;
        const end = new Date(r.endDate).getTime();
        return end > now && end - now <= thirtyDaysMs;
      }).length;

      setMetrics({
        pendingBookings: pendingRes.total || 0,
        approvedBookings: approvedRes.total || 0,
        activeRentals: activeRes.total || 0,
        expiringSoon: expiringSoonCount,
      });
    } catch {
      // Non-critical metric fetch failure
    }
  }, []);

  // ─── 2. Fetch Rental Bookings ───
  const fetchBookings = useCallback(async () => {
    setBookingsLoading((prev) => (bookings.length === 0 ? true : prev));
    setBookingsRefreshing(true);
    setBookingsError(null);
    try {
      const sp = new URLSearchParams({
        kind: "rental",
        mode: "bookings",
        page: String(bookingPage),
        pageSize: "15",
      });
      if (bookingStatusFilter !== "ALL") sp.set("status", bookingStatusFilter);
      if (debouncedBookingSearch.trim()) sp.set("q", debouncedBookingSearch.trim());

      const res = await fetch(`/api/requests?${sp.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.items || []);
        setBookingTotal(data.total || 0);
      } else {
        setBookingsError(data.error || "Unable to load rental bookings.");
      }
    } catch {
      setBookingsError("Network error while loading rental bookings.");
    } finally {
      setBookingsLoading(false);
      setBookingsRefreshing(false);
    }
  }, [bookingPage, bookingStatusFilter, debouncedBookingSearch, bookings.length]);

  // ─── 3. Fetch Rentals (Agreements) ───
  const fetchRentals = useCallback(async () => {
    setRentalsLoading((prev) => (rentals.length === 0 ? true : prev));
    setRentalsRefreshing(true);
    setRentalsError(null);
    try {
      const sp = new URLSearchParams({
        kind: "rental",
        mode: "rentals",
        page: String(rentalPage),
        pageSize: "15",
      });
      if (rentalStatusFilter !== "ALL") sp.set("status", rentalStatusFilter);
      if (debouncedRentalSearch.trim()) sp.set("q", debouncedRentalSearch.trim());

      const res = await fetch(`/api/requests?${sp.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRentals(data.items || []);
        setRentalTotal(data.total || 0);
      } else {
        setRentalsError(data.error || "Unable to load active rentals.");
      }
    } catch {
      setRentalsError("Network error while loading active rentals.");
    } finally {
      setRentalsLoading(false);
      setRentalsRefreshing(false);
    }
  }, [rentalPage, rentalStatusFilter, debouncedRentalSearch, rentals.length]);

  // Initial mount: load metrics, bookings, and rentals all in parallel so tabs switch in 0ms
  useEffect(() => {
    fetchMetrics();
    fetchBookings();
    fetchRentals();
  }, []);

  // Filter/search changes inside Bookings
  const [bookingsMounted, setBookingsMounted] = useState(false);
  useEffect(() => {
    if (!bookingsMounted) {
      setBookingsMounted(true);
      return;
    }
    fetchBookings();
  }, [bookingPage, bookingStatusFilter, debouncedBookingSearch]);

  // Filter/search changes inside Rentals
  const [rentalsMounted, setRentalsMounted] = useState(false);
  useEffect(() => {
    if (!rentalsMounted) {
      setRentalsMounted(true);
      return;
    }
    fetchRentals();
  }, [rentalPage, rentalStatusFilter, debouncedRentalSearch]);

  // Instant tab switch handler with URL synchronization (0ms delay)
  const handleTabChange = (newTab: "bookings" | "rentals") => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const targetPath = isAdmin
        ? newTab === "rentals"
          ? "/admin/rentals"
          : "/admin/bookings"
        : newTab === "rentals"
        ? "/dashboard/rentals"
        : "/dashboard/bookings";
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, "", targetPath);
      }
    }
  };

  // ─── Manager Booking Approval Action (Section 13) ───
  const handleApproveBooking = async (bookingId: string) => {
    if (isAdmin) {
      toast({
        title: "Unauthorized Action",
        description: "Administrators cannot approve normal rental bookings.",
        variant: "destructive",
      });
      return;
    }

    setBusyId(bookingId);
    try {
      const res = await fetch(`/api/requests/rental/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Booking Approved",
          description: "Tenancy agreement activated and property marked as RENTED.",
        });
        fetchBookings();
        fetchRentals();
        fetchMetrics();
        setViewBookingTarget(null);
      } else {
        toast({
          title: "Approval Failed",
          description: data.error || "Could not approve rental booking.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Error occurred while approving booking.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  // ─── Manager Booking Rejection Action (Section 14) ───
  const handleRejectBooking = async () => {
    if (!rejectingBooking) return;
    if (isAdmin) {
      toast({
        title: "Unauthorized Action",
        description: "Administrators cannot reject normal rental bookings.",
        variant: "destructive",
      });
      return;
    }

    setBusyId(rejectingBooking.id);
    try {
      const res = await fetch(`/api/requests/rental/${rejectingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", notes: rejectReason }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Booking Rejected",
          description: "Booking request rejected and customer notified.",
        });
        setRejectingBooking(null);
        setRejectReason("");
        fetchBookings();
        fetchMetrics();
      } else {
        toast({
          title: "Rejection Failed",
          description: data.error || "Could not reject rental booking.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Error occurred while rejecting booking.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  // ─── Manager Direct Rental Creation (Section 22, 25, 29) ───
  const openDirectModal = async () => {
    setCreateModalOpen(true);
    try {
      const [propsRes, custRes] = await Promise.all([
        fetch("/api/properties?mode=my-properties").then((r) => r.json()),
        fetch("/api/customers").then((r) => r.json()),
      ]);

      if (propsRes.success) {
        const availableRentals = (propsRes.properties || []).filter(
          (p: any) =>
            (p.listingType === "FOR_RENT" || !p.listingType) &&
            p.status !== "SOLD" &&
            p.status !== "RENTED" &&
            p.availabilityStatus !== "RENTED" &&
            p.availabilityStatus !== "SOLD"
        );
        setMyProperties(availableRentals);
      }
      if (custRes.success) {
        setCustomers(custRes.customers || []);
      }
    } catch {
      // Non-critical dropdown load error
    }
  };

  const handlePropertySelect = (propId: string) => {
    setDirectPropertyId(propId);
    const p = myProperties.find((item) => item.id === propId);
    if (p) {
      setDirectRentAmount(String(p.price || ""));
      setDirectDeposit(String(p.securityDeposit || "0"));
    }
  };

  const handleDirectRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPropertyId || !directCustomerId || !directCheckIn || !directCheckOut) {
      toast({
        title: "Required Fields Missing",
        description: "Please specify property, customer, check-in, and check-out dates.",
        variant: "destructive",
      });
      return;
    }

    setCreatingDirect(true);
    try {
      const res = await fetch("/api/rentals/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: directPropertyId,
          customerId: directCustomerId,
          startDate: directCheckIn,
          endDate: directCheckOut,
          rentAmount: directRentAmount ? Number(directRentAmount) : undefined,
          securityDeposit: directDeposit ? Number(directDeposit) : undefined,
          paymentStatus: "PAID",
          notes: directNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Direct Rental Created",
          description: "Tenancy agreement is now ACTIVE and property marked as RENTED.",
        });
        setCreateModalOpen(false);
        setDirectPropertyId("");
        setDirectCustomerId("");
        setDirectCheckIn("");
        setDirectCheckOut("");
        setDirectNotes("");
        fetchRentals();
        fetchMetrics();
      } else {
        toast({
          title: "Creation Failed",
          description: data.error || "Could not create direct rental agreement.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Could not create direct rental agreement.",
        variant: "destructive",
      });
    } finally {
      setCreatingDirect(false);
    }
  };

  // Helper for status pill styling (Section 15 & 16)
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "PENDING" || s === "PENDING VERIFICATION") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          {status}
        </span>
      );
    }
    if (s === "APPROVED" || s === "ACTIVE" || s === "PAID" || s === "PAID / VERIFIED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
          {status}
        </span>
      );
    }
    if (s === "EXPIRED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
          {status}
        </span>
      );
    }
    if (s === "COMPLETED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
        {status}
      </span>
    );
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* ================================================================ */}
      {/* 1. TOP HEADER & BREADCRUMB (Section 2)                           */}
      {/* ================================================================ */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#D4A72C] mb-1">
          Rental Management
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#071426] tracking-tight">
          Rental Bookings &amp; Rentals
        </h1>
        <p className="text-sm text-[#64748B] mt-1 max-w-3xl">
          Manage customer rental requests, approvals, and active tenancy agreements.
        </p>
      </div>

      {/* ================================================================ */}
      {/* 2. ONLY 4 IMPORTANT SUMMARY CARDS (Section 3)                    */}
      {/* Desktop: 4 in row | Tablet: 2+2 | Mobile: 1                      */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Bookings */}
        <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#64748B]">Pending Bookings</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-[#071426] mt-1 font-mono">
              {metrics.pendingBookings}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">Awaiting manager approval</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Approved Bookings */}
        <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#64748B]">Approved Bookings</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-[#071426] mt-1 font-mono">
              {metrics.approvedBookings}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">Approved rental requests</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Active Rentals */}
        <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#64748B]">Active Rentals</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-[#071426] mt-1 font-mono">
              {metrics.activeRentals}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">Currently occupied properties</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <KeyRound className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Expiring Soon */}
        <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#64748B]">Expiring Soon</p>
            <p className="text-2xl lg:text-3xl font-extrabold text-[#071426] mt-1 font-mono">
              {metrics.expiringSoon}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">Rentals ending soon</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. SEGMENTED NAVIGATION: BOOKINGS vs ACTIVE RENTALS (Section 4)  */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        {/* Segmented Control */}
        <div className="inline-flex p-1 bg-white border border-[#E5E7EB] rounded-xl shadow-xs self-start">
          <button
            type="button"
            onClick={() => handleTabChange("bookings")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "bookings"
                ? "bg-[#071426] text-white shadow-xs"
                : "bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
            )}
          >
            <FileText className="w-4 h-4 text-[#D4A72C]" />
            <span>Rental Bookings</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-mono",
                activeTab === "bookings"
                  ? "bg-white/20 text-white"
                  : "bg-[#F1F5F9] text-[#64748B]"
              )}
            >
              {bookingTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("rentals")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "rentals"
                ? "bg-[#071426] text-white shadow-xs"
                : "bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
            )}
          >
            <KeyRound className="w-4 h-4 text-[#D4A72C]" />
            <span>Active Rentals</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-mono",
                activeTab === "rentals"
                  ? "bg-white/20 text-white"
                  : "bg-[#F1F5F9] text-[#64748B]"
              )}
            >
              {rentalTotal}
            </span>
          </button>
        </div>

        {/* Manager Action & Refresh */}
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <Button
              size="sm"
              onClick={openDirectModal}
              className="bg-[#071426] hover:bg-[#0B1E38] text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs cursor-pointer gap-1.5 border border-[#D4A72C]/40"
            >
              <PlusCircle className="w-4 h-4 text-[#D4A72C]" /> Create Rental Directly
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (activeTab === "bookings") fetchBookings();
              else fetchRentals();
              fetchMetrics();
            }}
            className="text-xs text-[#64748B] hover:text-[#071426] border-[#E5E7EB] bg-white h-9 px-3 rounded-lg cursor-pointer gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. TAB 1: RENTAL BOOKINGS CONTENT (Section 5)                    */}
      {/* ================================================================ */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          {/* Controls: Compact Status Filters + Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Horizontal Scrolling Filter Bar (Section 28) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setBookingStatusFilter(s);
                    setBookingPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border",
                    bookingStatusFilter === s
                      ? "bg-[#071426] text-white border-[#071426]"
                      : "bg-white text-[#64748B] border-[#E5E7EB] hover:text-[#071426] hover:border-[#CBD5E1]"
                  )}
                >
                  {s === "ALL" ? "All Bookings" : s}
                </button>
              ))}
            </div>

            {/* Search Input (Section 27) */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search by booking ID, property, customer..."
                className="w-full pl-9 pr-3 h-9 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:ring-1 focus:ring-[#071426] focus:border-[#071426]"
              />
            </div>
          </div>

          {/* TABLE CONTAINER (Section 8, 9, 10, 11) */}
          <div className="w-full max-w-full bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden relative">
            {bookingsRefreshing && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4A72C] to-transparent animate-pulse z-10" />
            )}
            {bookingsLoading ? (
              // Loading Skeleton (Section 31)
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#64748B]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#D4A72C]" />
                  <span>Loading rental bookings...</span>
                </div>
              </div>
            ) : bookingsError ? (
              // Error State (Section 32)
              <div className="p-12 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                <p className="text-sm font-semibold text-[#071426]">Unable to load rental bookings</p>
                <p className="text-xs text-[#64748B]">{bookingsError}</p>
                <Button
                  size="sm"
                  onClick={fetchBookings}
                  variant="outline"
                  className="mt-2 text-xs border-[#E5E7EB]"
                >
                  Try Again
                </Button>
              </div>
            ) : bookings.length === 0 ? (
              // Empty State (Section 30)
              <div className="p-12 text-center space-y-2">
                <FileText className="h-9 w-9 text-[#CBD5E1] mx-auto" />
                <p className="text-sm font-bold text-[#071426]">No rental bookings found</p>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  No booking requests match your current filters. Check another status or clear search.
                </p>
              </div>
            ) : (
              <>
                {/* ─── DESKTOP & TABLET: HORIZONTAL SCROLL TABLE (Section 8-21) ─── */}
                <div className="hidden md:block w-full max-w-full overflow-x-auto">
                  <table className="w-full min-w-[1140px] text-left border-collapse text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[130px]">
                          Booking ID
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[260px]">
                          Property
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[220px]">
                          Customer
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[180px]">
                          Rental Period
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[120px]">
                          Total Amount
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[140px]">
                          Booking Status
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[150px]">
                          Payment Status
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[110px]">
                          Created Date
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[130px] text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {bookings.map((b) => {
                        const displayStatus =
                          b.bookingStatus || (b.status === "ACTIVE" ? "APPROVED" : b.status);
                        const payment = b.transaction?.payments?.[0];
                        const isPending = displayStatus === "PENDING";

                        return (
                          <tr key={b.id} className="hover:bg-[#F8FAFC] transition-colors">
                            {/* Booking ID */}
                            <td className="py-3.5 px-4 font-mono font-semibold text-[#071426] whitespace-nowrap">
                              #{b.requestNo}
                            </td>

                            {/* Property Column (Section 12) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-[#E5E7EB] shrink-0">
                                  <img
                                    src={
                                      b.property?.images?.[0]?.url ||
                                      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200"
                                    }
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 max-w-[200px]">
                                  <p className="font-semibold text-xs text-[#0F172A] line-clamp-2 leading-tight">
                                    {b.property?.title}
                                  </p>
                                  <p className="text-[11px] text-[#64748B] truncate flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3 text-[#D4A72C] shrink-0" />
                                    <span>{b.property?.city || b.property?.location}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Customer Column (Section 13) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#071426] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {getInitials(b.customer?.name)}
                                </div>
                                <div className="min-w-0 max-w-[170px]">
                                  <p className="font-semibold text-xs text-[#0F172A] truncate">
                                    {b.customer?.name || "Customer"}
                                  </p>
                                  <p className="text-[11px] text-[#64748B] truncate">
                                    {b.customer?.email || b.customer?.phone || "No contact"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Rental Period Column (Section 14) */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <p className="font-semibold text-xs text-[#0F172A]">
                                {b.startDate ? new Date(b.startDate).toLocaleDateString() : "—"} →{" "}
                                {b.endDate ? new Date(b.endDate).toLocaleDateString() : "—"}
                              </p>
                              <p className="text-[11px] text-[#64748B] mt-0.5">
                                {b.periods ? `${b.periods} ${b.rentalPeriod?.toLowerCase() || "mo"}` : "1 Month"}
                              </p>
                            </td>

                            {/* Total Rent Amount */}
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#071426] whitespace-nowrap">
                              {formatPrice(b.totalAmount || b.rentAmount)}
                            </td>

                            {/* Booking Status Pill (Section 15) */}
                            <td className="py-3.5 px-4">
                              {getStatusBadge(displayStatus)}
                            </td>

                            {/* Payment Status Pill (Section 16) */}
                            <td className="py-3.5 px-4">
                              {getStatusBadge(
                                payment?.status === "PAID"
                                  ? "PAID / VERIFIED"
                                  : "PENDING VERIFICATION"
                              )}
                            </td>

                            {/* Created Date */}
                            <td className="py-3.5 px-4 text-[#64748B] text-[11px] whitespace-nowrap">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </td>

                            {/* Actions Column (Section 17) */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewBookingTarget(b)}
                                  className="h-7 px-2 text-xs border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#071426] rounded-md gap-1 font-medium cursor-pointer"
                                >
                                  <Eye className="h-3 w-3 text-[#D4A72C]" /> View
                                </Button>

                                {!isAdmin && isPending && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveBooking(b.id)}
                                      disabled={busyId === b.id}
                                      className="h-7 px-2 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-md gap-1 font-semibold shadow-2xs cursor-pointer"
                                    >
                                      <Check className="h-3 w-3" /> Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setRejectingBooking(b)}
                                      disabled={busyId === b.id}
                                      className="h-7 px-2 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 rounded-md gap-1 font-semibold cursor-pointer"
                                    >
                                      <XCircle className="h-3 w-3" /> Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ─── MOBILE: RESPONSIVE CARDS VIEW (Section 22) ─── */}
                <div className="block md:hidden divide-y divide-[#E5E7EB]">
                  {bookings.map((b) => {
                    const displayStatus =
                      b.bookingStatus || (b.status === "ACTIVE" ? "APPROVED" : b.status);
                    const payment = b.transaction?.payments?.[0];
                    const isPending = displayStatus === "PENDING";

                    return (
                      <div key={b.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#071426]">
                            #{b.requestNo}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(displayStatus)}
                          </div>
                        </div>

                        {/* Property Details */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-[#E5E7EB] shrink-0">
                            <img
                              src={
                                b.property?.images?.[0]?.url ||
                                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200"
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs text-[#0F172A] truncate">
                              {b.property?.title}
                            </p>
                            <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-[#D4A72C]" />
                              <span>{b.property?.city || b.property?.location}</span>
                            </p>
                          </div>
                        </div>

                        {/* Customer & Tenancy Info */}
                        <div className="bg-[#F8FAFC] rounded-lg p-2.5 text-xs space-y-1.5 border border-[#F1F5F9]">
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Customer:</span>
                            <span className="font-semibold text-[#0F172A] truncate max-w-[180px]">
                              {b.customer?.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Period:</span>
                            <span className="font-medium text-[#0F172A]">
                              {b.startDate ? new Date(b.startDate).toLocaleDateString() : "—"} →{" "}
                              {b.endDate ? new Date(b.endDate).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Total Amount:</span>
                            <span className="font-mono font-bold text-[#0F172A]">
                              {formatPrice(b.totalAmount || b.rentAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                            <span className="text-[#64748B]">Payment:</span>
                            <span>
                              {getStatusBadge(
                                payment?.status === "PAID"
                                  ? "PAID / VERIFIED"
                                  : "PENDING VERIFICATION"
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewBookingTarget(b)}
                            className="flex-1 h-8 text-xs border-[#E5E7EB] text-[#071426]"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#D4A72C] mr-1" /> View
                          </Button>
                          {!isAdmin && isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveBooking(b.id)}
                                disabled={busyId === b.id}
                                className="flex-1 h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectingBooking(b)}
                                disabled={busyId === b.id}
                                className="flex-1 h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination Controls */}
            {bookingTotal > 15 && (
              <div className="p-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
                <span>
                  Showing {(bookingPage - 1) * 15 + 1}–{Math.min(bookingPage * 15, bookingTotal)} of{" "}
                  {bookingTotal} bookings
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bookingPage <= 1}
                    onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2 text-xs border-[#E5E7EB]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="font-semibold text-[#0F172A] px-1">
                    Page {bookingPage}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bookingPage * 15 >= bookingTotal}
                    onClick={() => setBookingPage((p) => p + 1)}
                    className="h-7 px-2 text-xs border-[#E5E7EB]"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 5. TAB 2: ACTIVE RENTALS CONTENT (Section 6)                     */}
      {/* ================================================================ */}
      {activeTab === "rentals" && (
        <div className="space-y-4">
          {/* Controls: Compact Status Filters + Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {["ALL", "ACTIVE", "EXPIRED", "COMPLETED", "CANCELLED"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setRentalStatusFilter(s);
                    setRentalPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border",
                    rentalStatusFilter === s
                      ? "bg-[#071426] text-white border-[#071426]"
                      : "bg-white text-[#64748B] border-[#E5E7EB] hover:text-[#071426] hover:border-[#CBD5E1]"
                  )}
                >
                  {s === "ALL" ? "All Rentals" : s}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                value={rentalSearch}
                onChange={(e) => setRentalSearch(e.target.value)}
                placeholder="Search by agreement number, property, customer..."
                className="w-full pl-9 pr-3 h-9 text-xs bg-white border border-[#E5E7EB] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:ring-1 focus:ring-[#071426] focus:border-[#071426]"
              />
            </div>
          </div>

          {/* TABLE CONTAINER (Section 8, 9, 10, 11) */}
          <div className="w-full max-w-full bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden relative">
            {rentalsRefreshing && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4A72C] to-transparent animate-pulse z-10" />
            )}
            {rentalsLoading ? (
              // Loading Skeleton
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#64748B]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#D4A72C]" />
                  <span>Loading active rental agreements...</span>
                </div>
              </div>
            ) : rentalsError ? (
              // Error State
              <div className="p-12 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                <p className="text-sm font-semibold text-[#071426]">Unable to load active rentals</p>
                <p className="text-xs text-[#64748B]">{rentalsError}</p>
                <Button
                  size="sm"
                  onClick={fetchRentals}
                  variant="outline"
                  className="mt-2 text-xs border-[#E5E7EB]"
                >
                  Try Again
                </Button>
              </div>
            ) : rentals.length === 0 ? (
              // Empty State
              <div className="p-12 text-center space-y-2">
                <KeyRound className="h-9 w-9 text-[#CBD5E1] mx-auto" />
                <p className="text-sm font-bold text-[#071426]">No rental agreements found</p>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  No active or historical tenancies match the selected filters.
                </p>
              </div>
            ) : (
              <>
                {/* ─── DESKTOP & TABLET: HORIZONTAL SCROLL TABLE (Section 8-21) ─── */}
                <div className="hidden md:block w-full max-w-full overflow-x-auto">
                  <table className="w-full min-w-[1140px] text-left border-collapse text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[140px]">
                          Rental Agreement #
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[110px]">
                          Booking Ref
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[260px]">
                          Property
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[220px]">
                          Customer
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[180px]">
                          Rental Period
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[120px]">
                          Total Rent
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[140px]">
                          Payment
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[130px]">
                          Rental Status
                        </th>
                        <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] w-[120px] text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {rentals.map((r) => {
                        const displayStatus =
                          r.rentalStatus || (r.status === "ACTIVE" ? "ACTIVE" : r.status);
                        const agreementNumber =
                          r.agreementNo || `AGR-${r.requestNo?.replace("RNT-", "")}`;

                        return (
                          <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                            {/* Agreement # */}
                            <td className="py-3.5 px-4 font-mono font-bold text-[#071426] whitespace-nowrap">
                              {agreementNumber}
                            </td>

                            {/* Booking Ref */}
                            <td className="py-3.5 px-4 font-mono text-[#D4A72C] font-semibold whitespace-nowrap">
                              #{r.requestNo}
                            </td>

                            {/* Property */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-[#E5E7EB] shrink-0">
                                  <img
                                    src={
                                      r.property?.images?.[0]?.url ||
                                      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200"
                                    }
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 max-w-[200px]">
                                  <p className="font-semibold text-xs text-[#0F172A] line-clamp-2 leading-tight">
                                    {r.property?.title}
                                  </p>
                                  <p className="text-[11px] text-[#64748B] truncate flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3 text-[#D4A72C] shrink-0" />
                                    <span>{r.property?.city || r.property?.location}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#071426] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {getInitials(r.customer?.name)}
                                </div>
                                <div className="min-w-0 max-w-[170px]">
                                  <p className="font-semibold text-xs text-[#0F172A] truncate">
                                    {r.customer?.name || "Customer"}
                                  </p>
                                  <p className="text-[11px] text-[#64748B] truncate">
                                    {r.customer?.email || r.customer?.phone || "No contact"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Rental Period */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <p className="font-semibold text-xs text-[#0F172A]">
                                {r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"} →{" "}
                                {r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"}
                              </p>
                              <p className="text-[11px] text-[#64748B] mt-0.5">
                                {r.periods ? `${r.periods} ${r.rentalPeriod?.toLowerCase() || "mo"}` : "1 Month"}
                              </p>
                            </td>

                            {/* Total Rent */}
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#071426] whitespace-nowrap">
                              {formatPrice(r.rentAmount)} / {r.rentalPeriod?.toLowerCase() || "mo"}
                            </td>

                            {/* Payment Status (Section 16) */}
                            <td className="py-3.5 px-4">
                              {getStatusBadge("PAID / VERIFIED")}
                            </td>

                            {/* Rental Status (Section 15) */}
                            <td className="py-3.5 px-4">
                              {getStatusBadge(displayStatus)}
                            </td>

                            {/* Actions Column */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewRentalTarget(r)}
                                  className="h-7 px-2 text-xs border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#071426] rounded-md gap-1 font-medium cursor-pointer"
                                >
                                  <Eye className="h-3 w-3 text-[#D4A72C]" /> View
                                </Button>

                                {r.transaction?.receipt && (
                                  <Link href={`/receipt/${r.transaction.receipt.id}`} target="_blank">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs border-[#D4A72C]/40 text-[#071426] hover:bg-[#F8FAFC] rounded-md gap-1 font-medium cursor-pointer"
                                    >
                                      <Receipt className="h-3 w-3 text-[#D4A72C]" /> Receipt
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ─── MOBILE: RESPONSIVE CARDS VIEW (Section 22) ─── */}
                <div className="block md:hidden divide-y divide-[#E5E7EB]">
                  {rentals.map((r) => {
                    const displayStatus =
                      r.rentalStatus || (r.status === "ACTIVE" ? "ACTIVE" : r.status);
                    const agreementNumber =
                      r.agreementNo || `AGR-${r.requestNo?.replace("RNT-", "")}`;

                    return (
                      <div key={r.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#071426] block">
                              {agreementNumber}
                            </span>
                            <span className="font-mono text-[11px] text-[#D4A72C]">
                              Ref: #{r.requestNo}
                            </span>
                          </div>
                          <div>{getStatusBadge(displayStatus)}</div>
                        </div>

                        {/* Property Details */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-[#E5E7EB] shrink-0">
                            <img
                              src={
                                r.property?.images?.[0]?.url ||
                                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200"
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs text-[#0F172A] truncate">
                              {r.property?.title}
                            </p>
                            <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-[#D4A72C]" />
                              <span>{r.property?.city || r.property?.location}</span>
                            </p>
                          </div>
                        </div>

                        {/* Tenancy Specifications */}
                        <div className="bg-[#F8FAFC] rounded-lg p-2.5 text-xs space-y-1.5 border border-[#F1F5F9]">
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Tenant:</span>
                            <span className="font-semibold text-[#0F172A] truncate max-w-[180px]">
                              {r.customer?.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Period:</span>
                            <span className="font-medium text-[#0F172A]">
                              {r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"} →{" "}
                              {r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Rent:</span>
                            <span className="font-mono font-bold text-[#0F172A]">
                              {formatPrice(r.rentAmount)} / {r.rentalPeriod?.toLowerCase() || "mo"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                            <span className="text-[#64748B]">Payment:</span>
                            <span>{getStatusBadge("PAID / VERIFIED")}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewRentalTarget(r)}
                            className="flex-1 h-8 text-xs border-[#E5E7EB] text-[#071426]"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#D4A72C] mr-1" /> View Agreement
                          </Button>
                          {r.transaction?.receipt && (
                            <Link href={`/receipt/${r.transaction.receipt.id}`} target="_blank" className="flex-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 text-xs border-[#D4A72C]/40 text-[#071426]"
                              >
                                <Receipt className="h-3.5 w-3.5 text-[#D4A72C] mr-1" /> Receipt
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination Controls */}
            {rentalTotal > 15 && (
              <div className="p-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
                <span>
                  Showing {(rentalPage - 1) * 15 + 1}–{Math.min(rentalPage * 15, rentalTotal)} of{" "}
                  {rentalTotal} rentals
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={rentalPage <= 1}
                    onClick={() => setRentalPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2 text-xs border-[#E5E7EB]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="font-semibold text-[#0F172A] px-1">
                    Page {rentalPage}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={rentalPage * 15 >= rentalTotal}
                    onClick={() => setRentalPage((p) => p + 1)}
                    className="h-7 px-2 text-xs border-[#E5E7EB]"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 6. VIEW BOOKING DETAILS MODAL (Section 5)                        */}
      {/* ================================================================ */}
      <Dialog open={!!viewBookingTarget} onOpenChange={(o) => !o && setViewBookingTarget(null)}>
        <DialogContent className="max-w-lg bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#D4A72C]">
                #{viewBookingTarget?.requestNo}
              </span>
              <span>{viewBookingTarget && getStatusBadge(viewBookingTarget.bookingStatus || viewBookingTarget.status)}</span>
            </div>
            <DialogTitle className="font-bold text-lg text-[#071426] flex items-center gap-2 mt-1">
              <FileText className="h-5 w-5 text-[#D4A72C]" />
              Rental Booking Request
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Customer tenancy request awaiting approval.
            </DialogDescription>
          </DialogHeader>

          {viewBookingTarget && (
            <div className="space-y-4 mt-2 text-xs">
              {/* Property Details */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                  <img
                    src={viewBookingTarget.property?.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-[#0F172A] truncate">
                    {viewBookingTarget.property?.title}
                  </h4>
                  <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-[#D4A72C]" />
                    {viewBookingTarget.property?.city || viewBookingTarget.property?.location}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-1">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Customer
                </p>
                <p className="font-semibold text-xs text-[#0F172A]">
                  {viewBookingTarget.customer?.name}
                </p>
                <p className="text-[11px] text-[#64748B] flex items-center gap-2">
                  <span>{viewBookingTarget.customer?.email}</span>
                  {viewBookingTarget.customer?.phone && (
                    <span>• {viewBookingTarget.customer?.phone}</span>
                  )}
                </p>
              </div>

              {/* Tenancy Dates */}
              <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#64748B] block">Check-in:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {viewBookingTarget.startDate ? new Date(viewBookingTarget.startDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Check-out:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {viewBookingTarget.endDate ? new Date(viewBookingTarget.endDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#F1F5F9] flex justify-between text-[11px]">
                  <span className="text-[#64748B]">Rental Period:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {viewBookingTarget.periods ? `${viewBookingTarget.periods} ${viewBookingTarget.rentalPeriod?.toLowerCase() || "month"}` : "1 Month"}
                  </span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-1.5 text-[11px]">
                <div className="flex justify-between text-[#64748B]">
                  <span>Rent Amount:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatPrice(viewBookingTarget.rentAmount)}
                  </span>
                </div>
                {viewBookingTarget.securityDeposit > 0 && (
                  <div className="flex justify-between text-[#64748B]">
                    <span>Security Deposit:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {formatPrice(viewBookingTarget.securityDeposit)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-[#F1F5F9] font-bold text-xs text-[#0F172A]">
                  <span>Total Amount:</span>
                  <span className="font-mono text-sm text-[#071426]">
                    {formatPrice(viewBookingTarget.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              {viewBookingTarget.transaction?.payments?.[0] && (
                <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Payment Method:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {viewBookingTarget.transaction.payments[0].paymentMethod}
                    </span>
                  </div>
                  {viewBookingTarget.transaction.payments[0].transactionRef && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Transaction Reference:</span>
                      <span className="font-mono font-semibold text-[#071426]">
                        {viewBookingTarget.transaction.payments[0].transactionRef}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-[#F1F5F9]">
                    <span className="text-[#64748B]">Payment Status:</span>
                    <span>
                      {getStatusBadge(
                        viewBookingTarget.transaction.payments[0].status === "PAID"
                          ? "PAID / VERIFIED"
                          : "PENDING VERIFICATION"
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setViewBookingTarget(null)}
              className="text-xs border-[#E5E7EB]"
            >
              Close
            </Button>
            {!isAdmin && viewBookingTarget?.status === "PENDING" && (
              <Button
                onClick={() => handleApproveBooking(viewBookingTarget.id)}
                disabled={busyId === viewBookingTarget.id}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
              >
                Approve Booking
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* 7. VIEW RENTAL AGREEMENT MODAL (Section 6 & 16)                  */}
      {/* ================================================================ */}
      <Dialog open={!!viewRentalTarget} onOpenChange={(o) => !o && setViewRentalTarget(null)}>
        <DialogContent className="max-w-lg bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#071426] block">
                  {viewRentalTarget?.agreementNo || `AGR-${viewRentalTarget?.requestNo?.replace("RNT-", "")}`}
                </span>
                <span className="font-mono text-[11px] text-[#D4A72C]">
                  Booking Ref: #{viewRentalTarget?.requestNo}
                </span>
              </div>
              <div>{viewRentalTarget && getStatusBadge(viewRentalTarget.rentalStatus || viewRentalTarget.status)}</div>
            </div>
            <DialogTitle className="font-bold text-lg text-[#071426] flex items-center gap-2 mt-1">
              <KeyRound className="h-5 w-5 text-[#D4A72C]" />
              Active Tenancy Agreement
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Official active lease contract details.
            </DialogDescription>
          </DialogHeader>

          {viewRentalTarget && (
            <div className="space-y-4 mt-2 text-xs">
              {/* Property Details */}
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                  <img
                    src={viewRentalTarget.property?.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-[#0F172A] truncate">
                    {viewRentalTarget.property?.title}
                  </h4>
                  <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-[#D4A72C]" />
                    {viewRentalTarget.property?.city || viewRentalTarget.property?.location}
                  </p>
                </div>
              </div>

              {/* Tenant Details */}
              <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-1">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Tenant
                </p>
                <p className="font-semibold text-xs text-[#0F172A]">
                  {viewRentalTarget.customer?.name}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  {viewRentalTarget.customer?.email} {viewRentalTarget.customer?.phone && `• ${viewRentalTarget.customer.phone}`}
                </p>
              </div>

              {/* Tenancy Dates */}
              <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#64748B] block">Move-in Date:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {viewRentalTarget.startDate ? new Date(viewRentalTarget.startDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">End of Tenancy:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {viewRentalTarget.endDate ? new Date(viewRentalTarget.endDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Specifications */}
              <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-1.5 text-[11px]">
                <div className="flex justify-between text-[#64748B]">
                  <span>Rent Rate:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatPrice(viewRentalTarget.rentAmount)} / {viewRentalTarget.rentalPeriod?.toLowerCase() || "mo"}
                  </span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Security Deposit:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {viewRentalTarget.securityDeposit ? formatPrice(viewRentalTarget.securityDeposit) : "None"}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-[#F1F5F9] font-bold text-xs text-[#0F172A]">
                  <span>Total Settled:</span>
                  <span className="font-mono text-sm text-[#071426]">
                    {formatPrice(viewRentalTarget.totalAmount || viewRentalTarget.rentAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setViewRentalTarget(null)}
              className="text-xs border-[#E5E7EB]"
            >
              Close
            </Button>
            {viewRentalTarget?.transaction?.receipt && (
              <Link href={`/receipt/${viewRentalTarget.transaction.receipt.id}`} target="_blank">
                <Button className="bg-[#071426] hover:bg-[#0B1E38] text-white font-semibold text-xs gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-[#D4A72C]" /> View Official Receipt
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* 8. REJECT BOOKING MODAL (Section 14)                              */}
      {/* ================================================================ */}
      <Dialog open={!!rejectingBooking} onOpenChange={(o) => !o && setRejectingBooking(null)}>
        <DialogContent className="max-w-md bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg text-rose-700 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              Reject Rental Booking
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Please state why this booking request is being declined. The property will remain available.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <Label htmlFor="reject-notes" className="text-xs font-semibold text-[#0F172A]">
              Rejection Reason
            </Label>
            <Textarea
              id="reject-notes"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Requested dates conflict with existing maintenance schedule..."
              className="text-xs border-[#E5E7EB] rounded-lg min-h-[90px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectingBooking(null)}
              className="text-xs border-[#E5E7EB]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectBooking}
              disabled={busyId === rejectingBooking?.id}
              className="bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs"
            >
              {busyId === rejectingBooking?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* 9. CREATE DIRECT RENTAL MODAL (Section 22, 25, 29)                */}
      {/* ================================================================ */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg text-[#071426] flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-[#D4A72C]" />
              Create Direct Rental Agreement
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Directly activate an authorized tenancy agreement for a customer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDirectRentalSubmit} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Select Available Property *
              </Label>
              <select
                value={directPropertyId}
                onChange={(e) => handlePropertySelect(e.target.value)}
                required
                className="w-full h-9 px-3 border border-[#E5E7EB] bg-white rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#071426]"
              >
                <option value="">-- Choose available property --</option>
                {myProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.city}) — {formatPrice(p.price)}/mo
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Select Customer / Tenant *
              </Label>
              <select
                value={directCustomerId}
                onChange={(e) => setDirectCustomerId(e.target.value)}
                required
                className="w-full h-9 px-3 border border-[#E5E7EB] bg-white rounded-lg text-xs text-[#0F172A] focus:outline-hidden focus:ring-1 focus:ring-[#071426]"
              >
                <option value="">-- Choose customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email || c.phone || "No contact"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Check-in Date *
                </Label>
                <Input
                  type="date"
                  value={directCheckIn}
                  onChange={(e) => setDirectCheckIn(e.target.value)}
                  required
                  className="h-9 text-xs border-[#E5E7EB] rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Check-out Date *
                </Label>
                <Input
                  type="date"
                  value={directCheckOut}
                  onChange={(e) => setDirectCheckOut(e.target.value)}
                  required
                  className="h-9 text-xs border-[#E5E7EB] rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Monthly Rent Amount ($)
                </Label>
                <Input
                  type="number"
                  value={directRentAmount}
                  onChange={(e) => setDirectRentAmount(e.target.value)}
                  placeholder="e.g. 1200"
                  className="h-9 text-xs border-[#E5E7EB] rounded-lg font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Security Deposit ($)
                </Label>
                <Input
                  type="number"
                  value={directDeposit}
                  onChange={(e) => setDirectDeposit(e.target.value)}
                  placeholder="e.g. 500"
                  className="h-9 text-xs border-[#E5E7EB] rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#0F172A] block mb-1">
                Internal Agreement Notes
              </Label>
              <Textarea
                value={directNotes}
                onChange={(e) => setDirectNotes(e.target.value)}
                placeholder="Optional lease agreement notes..."
                className="text-xs border-[#E5E7EB] rounded-lg min-h-[60px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="text-xs border-[#E5E7EB]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingDirect}
                className="bg-[#071426] hover:bg-[#0B1E38] text-white font-semibold text-xs"
              >
                {creatingDirect ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Activate Rental"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
