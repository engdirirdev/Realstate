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
      <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-3 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
        <p className="text-sm font-semibold text-[#0F172A]">Loading user dashboard preview...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0] space-y-4">
        <Users className="h-12 w-12 text-[#94A3B8] mx-auto opacity-40" />
        <h2 className="text-xl font-bold text-[#0F172A]">User Account Not Found</h2>
        <Button onClick={() => router.push("/admin/users")} className="bg-[#0F172A] text-white rounded-xl text-xs">
          Return to Manage Users
        </Button>
      </div>
    );
  }

  const isAdminRole = user.role === "ADMIN";
  const isManagerRole = user.role === "USER";
  const isCustomerRole = user.role === "CUSTOMER";

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-6">
      {/* Back to Manage Users Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button
          onClick={() => router.push("/admin/users")}
          variant="outline"
          className="bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl text-xs font-semibold gap-2 self-start"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Manage Users
        </Button>

        {/* Read-Only Badge */}
        <span className="inline-flex items-center gap-1.5 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
          <Lock className="h-3.5 w-3.5" /> READ-ONLY PREVIEW
        </span>
      </div>

      {/* ── Admin Inspection Banner ── */}
      <div className="bg-[#0F172A] text-white p-6 rounded-2xl shadow-card border border-[#1E293B] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user.name || "Unnamed User"}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isAdminRole ? "bg-[#34D399] text-[#0F172A]" : isManagerRole ? "bg-[#10B981] text-white" : "bg-[#ECFEFF] text-[#0891B2]"
                }`}>
                  {isAdminRole ? "ADMIN" : isManagerRole ? "USER / MANAGER" : "CUSTOMER"}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5 text-[#34D399]" /> {user.email}
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
                  ? "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5] hover:bg-[#FCA5A5]"
                  : "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0] hover:bg-[#A7F3D0]"
              }`}
            >
              {user.isActive ? <UserX className="h-3.5 w-3.5 mr-1" /> : <UserCheck className="h-3.5 w-3.5 mr-1" />}
              {user.isActive ? "Suspend" : "Activate"}
            </Button>

            <Select value={user.role} onValueChange={handleChangeRole} disabled={updating}>
              <SelectTrigger className="h-9 border-[#334155] rounded-xl bg-[#1E293B] text-white text-xs w-[160px]">
                <SelectValue placeholder="Change Role" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0]">
                <SelectItem value="CUSTOMER">Role: CUSTOMER</SelectItem>
                <SelectItem value="USER">Role: USER / MANAGER</SelectItem>
                <SelectItem value="ADMIN">Role: ADMIN</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setDeleteModalOpen(true)}
              variant="outline"
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white border-transparent text-xs font-semibold rounded-xl h-9 gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete User
            </Button>
          </div>
        </div>
      </div>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#991B1B] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" /> Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Are you sure you want to permanently delete <span className="font-bold text-[#0F172A]">{user.name || user.email}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#FEE2E2] p-4 rounded-xl border border-[#FCA5A5] text-xs text-[#991B1B] my-2">
            ⚠️ Warning: Deleting this account will permanently remove all associated listings, bookings, payments, and data from the system.
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl gap-2 font-semibold"
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
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#10B981]" /> Admin Dashboard Preview
            </h2>
            <span className="text-xs text-[#64748B]">Full Administrative Privileges Preview</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">System Role</p>
              <p className="text-xl font-bold text-[#0F172A] mt-1">ADMINISTRATOR</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">Account Status</p>
              <p className="text-xl font-bold text-[#059669] mt-1">{user.isActive ? "ACTIVE" : "SUSPENDED"}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">System Control</p>
              <p className="text-xl font-bold text-[#0891B2] mt-1">FULL ACCESS</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">Management Privileges</p>
              <p className="text-xl font-bold text-[#10B981] mt-1">USERS &amp; SYSTEM</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. USER / MANAGER / AGENT DASHBOARD PREVIEW ── */}
      {isManagerRole && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#10B981]" /> User / Manager Dashboard Preview
            </h2>
            <span className="text-xs text-[#64748B]">Manager Portfolio Preview</span>
          </div>

          {/* Manager KPI Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">Total Properties</p>
              <p className="text-2xl font-bold text-[#0F172A] mt-1">{user.managedProperties?.length || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">Active Listings</p>
              <p className="text-2xl font-bold text-[#10B981] mt-1">
                {user.managedProperties?.filter((p: any) => p.status === "APPROVED" || p.status === "PUBLISHED").length || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">Pending Properties</p>
              <p className="text-2xl font-bold text-[#D97706] mt-1">
                {user.managedProperties?.filter((p: any) => p.status === "PENDING").length || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">Total Earnings</p>
              <p className="text-2xl font-bold text-[#059669] mt-1">
                {formatPrice(user.managerPayments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0)}
              </p>
            </div>
          </div>

          {/* Manager Preview Tabs */}
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="bg-white border border-[#E2E8F0] p-1 rounded-xl">
              <TabsTrigger value="properties" className="rounded-lg text-xs font-semibold">
                My Properties ({user.managedProperties?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="rounded-lg text-xs font-semibold">
                Inquiries ({user.managerInquiries?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-lg text-xs font-semibold">
                Bookings ({user.managerBookings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="earnings" className="rounded-lg text-xs font-semibold">
                Earnings / Payments ({user.managerPayments?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Properties */}
            <TabsContent value="properties" className="mt-4 space-y-3">
              {user.managedProperties?.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl text-center text-[#94A3B8] border border-[#E2E8F0]">No properties listed by this manager.</div>
              ) : (
                user.managedProperties?.map((p: any) => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#E2E8F0] overflow-hidden flex-shrink-0">
                        {p.images[0] ? <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A] text-sm">{p.title}</p>
                        <p className="text-xs text-[#64748B]">{p.city} • {formatPrice(p.price)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      p.status === "APPROVED" ? "bg-[#D1FAE5] text-[#065F46]" : p.status === "PENDING" ? "bg-[#FEF9C3] text-[#92400E]" : "bg-[#FEE2E2] text-[#991B1B]"
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
                <div className="p-8 bg-white rounded-2xl text-center text-[#94A3B8] border border-[#E2E8F0]">No customer inquiries received.</div>
              ) : (
                user.managerInquiries?.map((inq: any) => (
                  <div key={inq.id} className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] space-y-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>From: {inq.customer?.name} ({inq.customer?.email})</span>
                      <span className="text-[#10B981]">{inq.status}</span>
                    </div>
                    <p className="text-[#334155]">"{inq.message}"</p>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 3: Bookings */}
            <TabsContent value="bookings" className="mt-4 space-y-3">
              {user.managerBookings?.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl text-center text-[#94A3B8] border border-[#E2E8F0]">No booking requests.</div>
              ) : (
                user.managerBookings?.map((b: any) => (
                  <div key={b.id} className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#0F172A]">{b.property?.title}</p>
                      <p className="text-[#64748B]">Customer: {b.customer?.name}</p>
                    </div>
                    <span className="font-bold text-[#059669]">{b.status}</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 4: Earnings */}
            <TabsContent value="earnings" className="mt-4 space-y-3">
              {user.managerPayments?.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl text-center text-[#94A3B8] border border-[#E2E8F0]">No payment transactions.</div>
              ) : (
                user.managerPayments?.map((pay: any) => (
                  <div key={pay.id} className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-mono font-bold">{pay.transactionRef}</p>
                      <p className="text-[#64748B]">Customer: {pay.customer?.name}</p>
                    </div>
                    <span className="font-bold text-[#059669]">{formatPrice(pay.amount)}</span>
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
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#DC2626]" /> Customer Dashboard Preview
            </h2>
            <span className="text-xs text-[#64748B]">End-User Customer Activity Preview</span>
          </div>

          {/* Customer KPI Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">Saved Properties</p>
              <p className="text-2xl font-bold text-[#DC2626] mt-1">❤️ {user.favorites?.length || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">AI Recommendations</p>
              <p className="text-2xl font-bold text-[#10B981] mt-1">{user.recommendations?.length || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">Bookings / Reservations</p>
              <p className="text-2xl font-bold text-[#0F172A] mt-1">{user.customerBookings?.length || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B]">Payments Made</p>
              <p className="text-2xl font-bold text-[#059669] mt-1">
                {formatPrice(user.customerPayments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0)}
              </p>
            </div>
          </div>

          {/* Customer Preview Tabs */}
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="bg-white border border-[#E2E8F0] p-1 rounded-xl">
              <TabsTrigger value="favorites" className="rounded-lg text-xs font-semibold">
                Saved Properties ({user.favorites?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="rounded-lg text-xs font-semibold">
                AI Recommendations ({user.recommendations?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-lg text-xs font-semibold">
                Bookings ({user.customerBookings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-lg text-xs font-semibold">
                Payment History ({user.customerPayments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="rounded-lg text-xs font-semibold">
                Sent Inquiries ({user.customerInquiries?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Saved Favorites */}
            <TabsContent value="favorites" className="mt-4 space-y-3">
              {user.favorites?.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl text-center text-[#94A3B8] border border-[#E2E8F0]">No saved favorite properties.</div>
              ) : (
                user.favorites?.map((f: any) => (
                  <div key={f.id} className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#E2E8F0] overflow-hidden flex-shrink-0">
                        {f.property?.images[0] ? <img src={f.property.images[0].url} alt={f.property.title} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A] text-sm">{f.property?.title}</p>
                        <p className="text-xs text-[#64748B]">{f.property?.city} • {formatPrice(f.property?.price || 0)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#DC2626]">Saved</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 2: AI Recommendations */}
            <TabsContent value="recommendations" className="mt-4 space-y-3">
              {user.recommendations?.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl text-center text-[#94A3B8] border border-[#E2E8F0]">No recommendations generated yet.</div>
              ) : (
                user.recommendations?.map((r: any) => (
                  <div key={r.id} className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#0F172A]">{r.property?.title}</p>
                      <p className="text-[#64748B]">{r.property?.city}</p>
                    </div>
                    <span className="font-bold text-[#10B981]">Match: {Math.round(r.score)}%</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 3: Bookings */}
            <TabsContent value="bookings" className="mt-4 space-y-3">
              {user.customerBookings?.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl text-center text-[#94A3B8] border border-[#E2E8F0]">No bookings created by customer.</div>
              ) : (
                user.customerBookings?.map((b: any) => (
                  <div key={b.id} className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#0F172A]">{b.property?.title}</p>
                      <p className="text-[#64748B]">Total: {formatPrice(b.totalPrice)}</p>
                    </div>
                    <span className="font-bold text-[#059669]">{b.status}</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 4: Payments */}
            <TabsContent value="payments" className="mt-4 space-y-3">
              {user.customerPayments?.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl text-center text-[#94A3B8] border border-[#E2E8F0]">No payment transactions.</div>
              ) : (
                user.customerPayments?.map((pay: any) => (
                  <div key={pay.id} className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-mono font-bold">{pay.transactionRef}</p>
                      <p className="text-[#64748B]">{pay.property?.title}</p>
                    </div>
                    <span className="font-bold text-[#059669]">{formatPrice(pay.amount)}</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 5: Sent Inquiries */}
            <TabsContent value="inquiries" className="mt-4 space-y-3">
              {user.customerInquiries?.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl text-center text-[#94A3B8] border border-[#E2E8F0]">No inquiries sent.</div>
              ) : (
                user.customerInquiries?.map((inq: any) => (
                  <div key={inq.id} className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] space-y-2 text-xs">
                    <p className="font-bold text-[#0F172A]">{inq.property?.title}</p>
                    <p className="text-[#334155]">"{inq.message}"</p>
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
