"use client";

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  RotateCcw,
  KeyRound,
  CreditCard,
  MessageSquare,
  Loader2,
  Copy,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { AddCustomerModal, CustomerCreatedData } from "@/components/customers/AddCustomerModal";

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    customerBookings?: number;
    customerPayments?: number;
    customerRentalRequests?: number;
    customerPurchaseRequests?: number;
    customerInquiries?: number;
  };
}

interface ManagerCustomersClientProps {
  initialCustomers?: CustomerRecord[];
}

function ManagerCustomersClient({ initialCustomers }: ManagerCustomersClientProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>(initialCustomers || []);
  const [loading, setLoading] = useState(initialCustomers ? false : true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("query", searchQuery.trim());
      }
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      } else {
        toast({
          title: "Error Loading Customers",
          description: data.error || "Failed to load customer list.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Network Error",
        description: "Failed to connect to the server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialCustomers && !searchQuery && statusFilter === "ALL") {
        return;
      }
    }
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [initialCustomers, searchQuery, statusFilter, fetchCustomers]);

  const handleCustomerCreated = (newCustomer: CustomerCreatedData) => {
    // Optimistically prepend or reload list
    setCustomers((prev) => [
      {
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone || null,
        role: newCustomer.role,
        isActive: newCustomer.isActive,
        createdAt: newCustomer.createdAt || new Date().toISOString(),
        _count: {
          customerBookings: 0,
          customerPayments: 0,
          customerRentalRequests: 0,
          customerPurchaseRequests: 0,
          customerInquiries: 0,
        },
      },
      ...prev,
    ]);
    fetchCustomers();
  };

  const handleToggleActive = async (customer: CustomerRecord) => {
    setTogglingId(customer.id);
    const nextStatus = !customer.isActive;
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, isActive: nextStatus } : c))
        );
        toast({
          title: "Status Updated",
          description: `${customer.name} is now ${nextStatus ? "Active" : "Suspended"}.`,
        });
      } else {
        toast({
          title: "Update Failed",
          description: data.error || "Could not change status.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Could not update customer status.",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.isActive).length;
    const totalBookings = customers.reduce(
      (sum, c) => sum + (c._count?.customerBookings || 0) + (c._count?.customerRentalRequests || 0),
      0
    );
    const totalInquiries = customers.reduce(
      (sum, c) => sum + (c._count?.customerInquiries || 0),
      0
    );
    return { total, active, totalBookings, totalInquiries };
  }, [customers]);

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#A97918] text-[11px] font-extrabold uppercase tracking-widest mb-2">
            <span>✦ CLIENT PORTFOLIO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#07111F] tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1">
            Register new customers, manage client accounts, and track booking and tenancy history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={fetchCustomers}
            disabled={loading}
            className="rounded-2xl border-[#E8E1D4] text-[#07111F] text-xs font-bold hover:bg-[#F7F3EA] gap-2 h-11 px-4 cursor-pointer"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-2xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-black text-xs h-11 px-5 shadow-lg shadow-[#C89B3C]/20 hover:brightness-105 border-0 gap-2 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            + Add New Customer
          </Button>
        </div>
      </div>

      {/* ─── 4 Kiro-Maal KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Customers */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-[#07111F] text-white border border-[#C89B3C]/25 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[130px] group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C89B3C]">
              Total Customers
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-black font-serif text-[#FCFBF7] tracking-tight">
              {stats.total}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
            <span className="font-bold text-[#D9B45B]">Registered</span>
            <span>in system</span>
          </div>
        </div>

        {/* Card 2: Active Clients */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[130px] group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Active Accounts
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-black font-serif text-[#07111F] tracking-tight">
              {stats.active}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span className="font-bold text-emerald-600">Verified</span>
            <span>eligible for leases</span>
          </div>
        </div>

        {/* Card 3: Bookings & Leases */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-[#0B1728] text-white border border-[#C89B3C]/25 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[130px] group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C89B3C]">
              Bookings &amp; Leases
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B] flex items-center justify-center group-hover:scale-105 transition-transform">
              <KeyRound className="h-5 w-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-black font-serif text-[#FCFBF7] tracking-tight">
              {stats.totalBookings}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
            <span className="font-bold text-[#D9B45B]">Tenancies</span>
            <span>created or active</span>
          </div>
        </div>

        {/* Card 4: Inquiries */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[130px] group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Client Inquiries
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#F7F3EA] border border-[#E8E1D4] text-[#A97918] flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl sm:text-4xl font-black font-serif text-[#07111F] tracking-tight">
              {stats.totalInquiries}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span className="font-bold text-[#A97918]">Active leads</span>
            <span>&amp; conversations</span>
          </div>
        </div>
      </div>

      {/* ─── Search Bar and Status Filter Tabs ─── */}
      <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border-[#E8E1D4] rounded-2xl pl-10 text-xs h-10 text-[#07111F] placeholder:text-[#9CA3AF] focus:border-[#C89B3C] focus:ring-[#C89B3C]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9CA3AF] hover:text-[#07111F]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-[#F7F3EA] rounded-2xl border border-[#E8DEC8] self-stretch sm:self-auto">
            {(
              [
                { key: "ALL", label: "All Customers" },
                { key: "ACTIVE", label: "Active" },
                { key: "INACTIVE", label: "Suspended" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === tab.key
                    ? "bg-[#07111F] text-[#D9B45B] shadow-sm"
                    : "text-[#6B7280] hover:text-[#07111F]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Customers Table & Responsive Mobile Cards ─── */}
      <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 text-[#C89B3C] animate-spin mb-3" />
            <p className="text-xs font-bold text-[#07111F]">Loading customer directory...</p>
            <p className="text-[11px] text-[#6B7280] mt-1">Retrieving registered clients and rental history.</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#F7F3EA] border border-[#E8DEC8] text-[#A97918] flex items-center justify-center">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#07111F]">
                No Customers Found
              </h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-sm">
                {searchQuery
                  ? `No clients matched "${searchQuery}". Try adjusting your search query.`
                  : "You haven't added any customers yet. Add your first customer to start creating rental agreements."}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold text-xs h-10 px-5 border-0 hover:brightness-105"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              + Add Customer Now
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E1D4] bg-[#F7F3EA]/60 text-[#6B7280] uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3.5 px-5">Customer Profile</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Activity &amp; Deals</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-5 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D4]/70">
                  {customers.map((c) => {
                    const initials = (c.name || "Customer")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    const bookingsCount =
                      (c._count?.customerBookings || 0) +
                      (c._count?.customerRentalRequests || 0);
                    const paymentsCount = c._count?.customerPayments || 0;

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-[#F7F3EA]/30 transition-colors group"
                      >
                        {/* Profile */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#07111F] to-[#0F223D] border border-[#C89B3C]/40 text-[#D9B45B] font-serif font-black flex items-center justify-center text-xs shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-[#07111F] text-xs group-hover:text-[#A97918] transition-colors">
                                {c.name}
                              </div>
                              <span className="text-[10px] text-[#9CA3AF] font-mono">
                                ID: {c.id.slice(-8)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`mailto:${c.email}`}
                                className="text-[#07111F] font-semibold hover:text-[#C89B3C] hover:underline flex items-center gap-1"
                              >
                                <Mail className="h-3 w-3 text-[#C89B3C]" />
                                {c.email}
                              </a>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(c.email, "Email")}
                                className="text-[#9CA3AF] hover:text-[#07111F] p-0.5"
                                title="Copy email"
                              >
                                <Copy className="h-2.5 w-2.5" />
                              </button>
                            </div>

                            {c.phone ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${c.phone}`}
                                  className="text-[#6B7280] hover:text-[#07111F] font-mono text-[11px] flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3 text-[#A97918]" />
                                  {c.phone}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(c.phone || "", "Phone")}
                                  className="text-[#9CA3AF] hover:text-[#07111F] p-0.5"
                                  title="Copy phone"
                                >
                                  <Copy className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#9CA3AF] italic">
                                No phone recorded
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Activity */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="px-2.5 py-1 rounded-xl bg-white border border-[#E8E1D4] text-[#07111F] font-medium text-[11px] flex items-center gap-1"
                              title="Tenancies & Bookings"
                            >
                              <KeyRound className="h-3 w-3 text-[#C89B3C]" />
                              <span>{bookingsCount} Leases</span>
                            </div>

                            <div
                              className="px-2.5 py-1 rounded-xl bg-white border border-[#E8E1D4] text-[#07111F] font-medium text-[11px] flex items-center gap-1"
                              title="Verified Payments"
                            >
                              <CreditCard className="h-3 w-3 text-emerald-600" />
                              <span>{paymentsCount} Pays</span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {c.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active Client
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td suppressHydrationWarning className="py-4 px-4 text-[#6B7280] font-medium">
                          {new Date(c.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/bookings?tab=rentals&direct=true&customerId=${c.id}`}
                              className="px-3 py-1.5 rounded-xl bg-[#07111F] text-[#D9B45B] hover:bg-[#0F223D] font-bold text-[11px] flex items-center gap-1 transition-all"
                              title="Create direct lease for this client"
                            >
                              <KeyRound className="h-3 w-3" />
                              Create Lease
                            </Link>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={togglingId === c.id}
                              onClick={() => handleToggleActive(c)}
                              className="h-8 px-2 text-xs rounded-xl text-[#6B7280] hover:text-[#07111F] hover:bg-white border border-transparent hover:border-[#E8E1D4]"
                              title={c.isActive ? "Suspend Account" : "Activate Account"}
                            >
                              {togglingId === c.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : c.isActive ? (
                                <UserX className="h-3.5 w-3.5 text-amber-600" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Visible on mobile/tablet) */}
            <div className="md:hidden divide-y divide-[#E8E1D4]">
              {customers.map((c) => {
                const initials = (c.name || "Customer")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const bookingsCount =
                  (c._count?.customerBookings || 0) +
                  (c._count?.customerRentalRequests || 0);

                return (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#07111F] border border-[#C89B3C]/40 text-[#D9B45B] font-serif font-black flex items-center justify-center text-xs">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-[#07111F] text-sm">
                            {c.name}
                          </div>
                          <span className="text-[10px] text-[#9CA3AF] font-mono">
                            Joined {new Date(c.createdAt).toLocaleDateString("en-US")}
                          </span>
                        </div>
                      </div>

                      {c.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                          Suspended
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 bg-white p-3 rounded-2xl border border-[#E8E1D4] text-xs">
                      <div className="flex items-center justify-between text-[#6B7280]">
                        <span className="text-[10px] uppercase font-bold">Email:</span>
                        <a
                          href={`mailto:${c.email}`}
                          className="font-semibold text-[#07111F] hover:text-[#C89B3C] truncate max-w-[200px]"
                        >
                          {c.email}
                        </a>
                      </div>
                      {c.phone && (
                        <div className="flex items-center justify-between text-[#6B7280] pt-1 border-t border-[#F7F3EA]">
                          <span className="text-[10px] uppercase font-bold">Phone:</span>
                          <a
                            href={`tel:${c.phone}`}
                            className="font-mono font-semibold text-[#A97918]"
                          >
                            {c.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[#6B7280] pt-1 border-t border-[#F7F3EA]">
                        <span className="text-[10px] uppercase font-bold">Leases/Bookings:</span>
                        <span className="font-bold text-[#07111F]">
                          {bookingsCount} records
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/dashboard/bookings?tab=rentals&direct=true&customerId=${c.id}`}
                        className="flex-1 py-2 rounded-xl bg-[#07111F] text-[#D9B45B] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Create Lease
                      </Link>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={togglingId === c.id}
                        onClick={() => handleToggleActive(c)}
                        className="rounded-xl border-[#E8E1D4] text-xs h-9 px-3"
                      >
                        {togglingId === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : c.isActive ? (
                          "Suspend"
                        ) : (
                          "Activate"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ─── Add Customer Modal ─── */}
      <AddCustomerModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
}

export default memo(ManagerCustomersClient);
