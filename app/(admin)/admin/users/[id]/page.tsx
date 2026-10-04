// ================================================================
// PAGE NAME  : Admin Dashboard — User Inspection & Dashboard Preview
// ROUTE      : /admin/users/[id]
// DESCRIPTION: Dynamic Role-Based Read-Only Dashboard Preview for
//              ADMIN, USER/MANAGER, and CUSTOMER roles.
// ROLE       : ADMIN only (Read-Only Inspection)
// ================================================================
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, ArrowLeft, Shield, ShieldCheck, Mail, Phone, Calendar,
  Building2, Heart, CreditCard, MessageSquare, CheckCircle2,
  XCircle, AlertTriangle, Eye, Loader2, RefreshCw, UserCheck, UserX,
  Lock, TrendingUp, BarChart3, Bot, Brain, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default function AdminUserReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to load user preview.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Status Updated", description: `Account is now ${!user.isActive ? "Active" : "Suspended"}.` });
        setUser((prev: any) => ({ ...prev, isActive: !user.isActive }));
      }
    } catch {
      toast({ title: "Error", description: "Failed to update user status." });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (!user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Role Updated! 🛡️", description: `User role changed to ${newRole}.` });
        setUser((prev: any) => ({ ...prev, role: newRole }));
      }
    } catch {
      toast({ title: "Error", description: "Failed to update user role." });
    } finally {
      setUpdating(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Account Deleted 🗑️", description: `Deleted account for ${user.name || user.email}.` });
        router.push("/admin/users");
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete account." });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
        <p className="text-sm font-semibold text-[#07111F]">Loading user dashboard preview...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-12 text-center bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] space-y-4">
        <Users className="h-12 w-12 text-[#6B7280] mx-auto opacity-40" />
        <h2 className="text-xl font-bold font-serif text-[#07111F]">User Account Not Found</h2>
        <Button onClick={() => router.push("/admin/users")} className="bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30 hover:bg-[#0B1728] rounded-xl text-xs font-bold">
          Return to Manage Users
        </Button>
      </div>
    );
  }

  const isAdminRole = user.role === "ADMIN";
  const isManagerRole = user.role === "USER";
  const isCustomerRole = user.role === "CUSTOMER";

  return (
    <div className="space-y-6 min-h-screen p-2 sm:p-6">
      {/* Back to Manage Users Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button
          onClick={() => router.push("/admin/users")}
          variant="outline"
          className="bg-[#FCFBF7] border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA] rounded-xl text-xs font-semibold gap-2 self-start"
        >
          <ArrowLeft className="h-4 w-4 text-[#C89B3C]" /> Back to Manage Users
        </Button>

        {/* Read-Only Badge */}
        <span className="inline-flex items-center gap-1.5 bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
          <Lock className="h-3.5 w-3.5 text-[#C89B3C]" /> READ-ONLY PREVIEW
        </span>
      </div>

      {/* ── Admin Inspection Banner ── */}
      <div className="bg-[#07111F] text-white p-6 rounded-2xl shadow-md border border-[#C89B3C]/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] flex items-center justify-center font-bold text-lg shadow-sm">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-white">{user.name || "Unnamed User"}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                  isAdminRole ? "bg-[#C89B3C] text-[#07111F]" : isManagerRole ? "bg-[#142642] text-[#D9B45B] border border-[#C89B3C]/30" : "bg-white/10 text-white border border-white/20"
                }`}>
                  {isAdminRole ? "ADMIN" : isManagerRole ? "USER / MANAGER" : "CUSTOMER"}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] flex flex-wrap items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5 text-[#C89B3C]" /> {user.email}
                {user.phone && <span>• Phone: {user.phone}</span>}
                <span>• Joined: {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </p>
            </div>
          </div>

          {/* Quick Account Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1E293B] w-full sm:w-auto">
            <Button
              onClick={handleToggleStatus}
              disabled={updating}
              variant="outline"
              className={`text-xs font-semibold rounded-xl h-9 border ${
                user.isActive
                  ? "bg-[#991B1B]/20 text-[#FCA5A5] border-[#991B1B]/40 hover:bg-[#991B1B]/30"
                  : "bg-[#047857]/20 text-[#6EE7B7] border-[#047857]/40 hover:bg-[#047857]/30"
              }`}
            >
              {user.isActive ? <UserX className="h-3.5 w-3.5 mr-1" /> : <UserCheck className="h-3.5 w-3.5 mr-1" />}
              {user.isActive ? "Suspend" : "Activate"}
            </Button>

            <Select value={user.role} onValueChange={handleChangeRole} disabled={updating}>
              <SelectTrigger className="h-9 border-[#C89B3C]/30 rounded-xl bg-[#0B1728] text-white text-xs w-[160px]">
                <SelectValue placeholder="Change Role" />
              </SelectTrigger>
              <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                <SelectItem value="CUSTOMER">Role: CUSTOMER</SelectItem>
                <SelectItem value="USER">Role: USER / MANAGER</SelectItem>
                <SelectItem value="ADMIN">Role: ADMIN</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setDeleteModalOpen(true)}
              variant="outline"
              className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white border-transparent text-xs font-semibold rounded-xl h-9 gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete User
            </Button>
          </div>
        </div>
      </div>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-[#991B1B] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#991B1B]" /> Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Are you sure you want to permanently delete <span className="font-bold text-[#07111F]">{user.name || user.email}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#991B1B]/10 p-4 rounded-xl border border-[#991B1B]/20 text-xs text-[#991B1B] my-2">
            ⚠️ Warning: Deleting this account will permanently remove all associated listings, bookings, payments, and data from the system.
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F]">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl gap-2 font-semibold"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Account Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DYNAMIC ROLE-BASED DASHBOARD PREVIEW LOGIC                                 */}
      {/* ========================================================================= */}

      {/* ── 1. ADMIN DASHBOARD PREVIEW ── */}
      {isAdminRole && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E1D4] pb-3">
            <h2 className="text-lg font-bold font-serif text-[#07111F] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#C89B3C]" /> Admin Dashboard Preview
            </h2>
            <span className="text-xs text-[#6B7280]">Full Administrative Privileges Preview</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">System Role</p>
              <p className="text-xl font-bold font-serif text-[#07111F] mt-1">ADMINISTRATOR</p>
            </div>
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">Account Status</p>
              <p className="text-xl font-bold font-serif text-[#047857] mt-1">{user.isActive ? "ACTIVE" : "SUSPENDED"}</p>
            </div>
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">System Control</p>
              <p className="text-xl font-bold font-serif text-[#C89B3C] mt-1">FULL ACCESS</p>
            </div>
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">Management Privileges</p>
              <p className="text-xl font-bold font-serif text-[#07111F] mt-1">USERS &amp; SYSTEM</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. USER / MANAGER / AGENT DASHBOARD PREVIEW ── */}
      {isManagerRole && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E1D4] pb-3">
            <h2 className="text-lg font-bold font-serif text-[#07111F] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#C89B3C]" /> User / Manager Dashboard Preview
            </h2>
            <span className="text-xs text-[#6B7280]">Manager Portfolio Preview</span>
          </div>

          {/* Manager KPI Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">Total Properties</p>
              <p className="text-2xl font-bold font-serif text-[#07111F] mt-1">{user.managedProperties?.length || 0}</p>
            </div>
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">Active Listings</p>
              <p className="text-2xl font-bold font-serif text-[#047857] mt-1">
                {user.managedProperties?.filter((p: any) => p.status === "APPROVED" || p.status === "PUBLISHED").length || 0}
              </p>
            </div>
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">Pending Properties</p>
              <p className="text-2xl font-bold font-serif text-[#A97918] mt-1">
                {user.managedProperties?.filter((p: any) => p.status === "PENDING").length || 0}
              </p>
            </div>
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">Total Earnings</p>
              <p className="text-2xl font-bold font-serif text-[#C89B3C] mt-1">
                {formatPrice(user.managerPayments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0)}
              </p>
            </div>
          </div>

          {/* Manager Preview Tabs */}
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="bg-[#FCFBF7] border border-[#E8E1D4] p-1 rounded-xl">
              <TabsTrigger value="properties" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#07111F] data-[state=active]:text-[#D9B45B]">
                My Properties ({user.managedProperties?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#07111F] data-[state=active]:text-[#D9B45B]">
                Inquiries ({user.managerInquiries?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#07111F] data-[state=active]:text-[#D9B45B]">
                Bookings ({user.managerBookings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="earnings" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#07111F] data-[state=active]:text-[#D9B45B]">
                Earnings / Payments ({user.managerPayments?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Properties */}
            <TabsContent value="properties" className="mt-4 space-y-3">
              {user.managedProperties?.length === 0 ? (
                <div className="p-8 bg-[#FCFBF7] rounded-2xl text-center text-[#6B7280] border border-[#E8E1D4]">No properties listed by this manager.</div>
              ) : (
                user.managedProperties?.map((p: any) => (
                  <div key={p.id} className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#07111F]/10 overflow-hidden flex-shrink-0">
                        {p.images[0] ? <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                        <p className="font-bold text-[#07111F] text-sm">{p.title}</p>
                        <p className="text-xs text-[#6B7280]">{p.city} • {formatPrice(p.price)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      p.status === "APPROVED" ? "bg-[#047857]/10 text-[#047857]" : p.status === "PENDING" ? "bg-[#C89B3C]/10 text-[#A97918]" : "bg-[#991B1B]/10 text-[#991B1B]"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 2: Inquiries */}
            <TabsContent value="inquiries" className="mt-4 space-y-3">
              {user.managerInquiries?.length === 0 ? (
                <div className="p-8 bg-[#FCFBF7] rounded-2xl text-center text-[#6B7280] border border-[#E8E1D4]">No customer inquiries received.</div>
              ) : (
                user.managerInquiries?.map((inq: any) => (
                  <div key={inq.id} className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] space-y-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-[#07111F]">From: {inq.customer?.name} ({inq.customer?.email})</span>
                      <span className="text-[#C89B3C] font-semibold">{inq.status}</span>
                    </div>
                    <p className="text-[#6B7280]">&ldquo;{inq.message}&rdquo;</p>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 3: Bookings */}
            <TabsContent value="bookings" className="mt-4 space-y-3">
              {user.managerBookings?.length === 0 ? (
                <div className="p-8 bg-[#FCFBF7] rounded-2xl text-center text-[#6B7280] border border-[#E8E1D4]">No booking requests.</div>
              ) : (
                user.managerBookings?.map((b: any) => (
                  <div key={b.id} className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#07111F]">{b.property?.title}</p>
                      <p className="text-[#6B7280]">Customer: {b.customer?.name}</p>
                    </div>
                    <span className="font-bold text-[#047857]">{b.status}</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 4: Earnings */}
            <TabsContent value="earnings" className="mt-4 space-y-3">
              {user.managerPayments?.length === 0 ? (
                <div className="p-8 bg-[#FCFBF7] rounded-2xl text-center text-[#6B7280] border border-[#E8E1D4]">No payment transactions.</div>
              ) : (
                user.managerPayments?.map((pay: any) => (
                  <div key={pay.id} className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-mono font-bold text-[#07111F]">{pay.transactionRef}</p>
                      <p className="text-[#6B7280]">Customer: {pay.customer?.name}</p>
                    </div>
                    <span className="font-bold text-[#C89B3C] font-serif text-sm">{formatPrice(pay.amount)}</span>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* ── 3. CUSTOMER DASHBOARD PREVIEW ── */}
      {isCustomerRole && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E1D4] pb-3">
            <h2 className="text-lg font-bold font-serif text-[#07111F] flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#C89B3C] fill-[#C89B3C]" /> Customer Dashboard Preview
            </h2>
            <span className="text-xs text-[#6B7280]">End-User Customer Activity Preview</span>
          </div>

          {/* Customer KPI Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">Saved Properties</p>
              <p className="text-2xl font-bold font-serif text-[#07111F] mt-1">❤️ {user.favorites?.length || 0}</p>
            </div>
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">AI Recommendations</p>
              <p className="text-2xl font-bold font-serif text-[#C89B3C] mt-1">{user.recommendations?.length || 0}</p>
            </div>
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">Bookings / Reservations</p>
              <p className="text-2xl font-bold font-serif text-[#07111F] mt-1">{user.customerBookings?.length || 0}</p>
            </div>
            <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4]">
              <p className="text-xs font-semibold text-[#6B7280]">Payments Made</p>
              <p className="text-2xl font-bold font-serif text-[#C89B3C] mt-1">
                {formatPrice(user.customerPayments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0)}
              </p>
            </div>
          </div>

          {/* Customer Preview Tabs */}
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="bg-[#FCFBF7] border border-[#E8E1D4] p-1 rounded-xl">
              <TabsTrigger value="favorites" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#07111F] data-[state=active]:text-[#D9B45B]">
                Saved Properties ({user.favorites?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#07111F] data-[state=active]:text-[#D9B45B]">
                AI Recommendations ({user.recommendations?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#07111F] data-[state=active]:text-[#D9B45B]">
                Bookings ({user.customerBookings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#07111F] data-[state=active]:text-[#D9B45B]">
                Payment History ({user.customerPayments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#07111F] data-[state=active]:text-[#D9B45B]">
                Sent Inquiries ({user.customerInquiries?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Saved Favorites */}
            <TabsContent value="favorites" className="mt-4 space-y-3">
              {user.favorites?.length === 0 ? (
                <div className="p-8 bg-[#FCFBF7] rounded-2xl text-center text-[#6B7280] border border-[#E8E1D4]">No saved favorite properties.</div>
              ) : (
                user.favorites?.map((f: any) => (
                  <div key={f.id} className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#07111F]/10 overflow-hidden flex-shrink-0">
                        {f.property?.images[0] ? <img src={f.property.images[0].url} alt={f.property.title} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                        <p className="font-bold text-[#07111F] text-sm">{f.property?.title}</p>
                        <p className="text-xs text-[#6B7280]">{f.property?.city} • {formatPrice(f.property?.price || 0)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#C89B3C]">Saved</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 2: AI Recommendations */}
            <TabsContent value="recommendations" className="mt-4 space-y-3">
              {user.recommendations?.length === 0 ? (
                <div className="p-8 bg-[#FCFBF7] rounded-2xl text-center text-[#6B7280] border border-[#E8E1D4]">No recommendations generated yet.</div>
              ) : (
                user.recommendations?.map((r: any) => (
                  <div key={r.id} className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#07111F]">{r.property?.title}</p>
                      <p className="text-[#6B7280]">{r.property?.city}</p>
                    </div>
                    <span className="font-bold text-[#C89B3C]">Match: {Math.round(r.score)}%</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 3: Bookings */}
            <TabsContent value="bookings" className="mt-4 space-y-3">
              {user.customerBookings?.length === 0 ? (
                <div className="p-8 bg-[#FCFBF7] rounded-2xl text-center text-[#6B7280] border border-[#E8E1D4]">No bookings created by customer.</div>
              ) : (
                user.customerBookings?.map((b: any) => (
                  <div key={b.id} className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#07111F]">{b.property?.title}</p>
                      <p className="text-[#6B7280]">Total: {formatPrice(b.totalPrice)}</p>
                    </div>
                    <span className="font-bold text-[#047857]">{b.status}</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 4: Payments */}
            <TabsContent value="payments" className="mt-4 space-y-3">
              {user.customerPayments?.length === 0 ? (
                <div className="p-8 bg-[#FCFBF7] rounded-2xl text-center text-[#6B7280] border border-[#E8E1D4]">No payment transactions.</div>
              ) : (
                user.customerPayments?.map((pay: any) => (
                  <div key={pay.id} className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-mono font-bold text-[#07111F]">{pay.transactionRef}</p>
                      <p className="text-[#6B7280]">{pay.property?.title}</p>
                    </div>
                    <span className="font-bold text-[#C89B3C] font-serif text-sm">{formatPrice(pay.amount)}</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 5: Sent Inquiries */}
            <TabsContent value="inquiries" className="mt-4 space-y-3">
              {user.customerInquiries?.length === 0 ? (
                <div className="p-8 bg-[#FCFBF7] rounded-2xl text-center text-[#6B7280] border border-[#E8E1D4]">No inquiries sent.</div>
              ) : (
                user.customerInquiries?.map((inq: any) => (
                  <div key={inq.id} className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] space-y-2 text-xs">
                    <p className="font-bold text-[#07111F]">{inq.property?.title}</p>
                    <p className="text-[#6B7280]">&ldquo;{inq.message}&rdquo;</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
