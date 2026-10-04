// ================================================================
// PAGE NAME  : Admin Dashboard — Manage Users Directory
// ROUTE      : /admin/users
// DESCRIPTION: Admin User List — Filter tabs [All Users] [Admins]
//              [Users / Managers] [Customers], Search by name/email,
//              Role & Status filters, 👁 View Dashboard button, and
//              🗑️ Delete User / Delete Customer action button
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN only
// ================================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Search, Filter, Mail, Phone, Calendar, Shield, UserPlus,
  Eye, CheckCircle2, AlertTriangle, ShieldCheck, Loader2, UserX, UserCheck, Trash2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "ADMIN" | "USER" | "CUSTOMER";
  isActive: boolean;
  createdAt: string;
  _count: {
    favorites: number;
    pricePredictions: number;
    recommendations: number;
    managedProperties: number;
    customerBookings: number;
    customerPayments: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ADMIN" | "USER" | "CUSTOMER">("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER" as "ADMIN" | "USER" | "CUSTOMER",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (activeTab !== "ALL") params.set("role", activeTab);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users-list?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, statusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast({ title: "Missing fields", description: "Name, email, and password are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Success! 🎉", description: `Created new ${form.role} account.` });
      setModalOpen(false);
      setForm({ name: "", email: "", phone: "", password: "", role: "CUSTOMER" });
      fetchUsers();
    } catch {
      toast({ title: "Error", description: "Failed to create account.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (!data.success) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Status Updated", description: `Account is now ${!currentActive ? "Active" : "Suspended"}.` });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u)));
    } catch {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const handleOpenDelete = (user: UserItem) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Account Deleted 🗑️", description: `Permanently deleted ${userToDelete.name || userToDelete.email}.` });
        setDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete user account.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Identity &amp; Access Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <Users className="h-7 w-7 text-[#C89B3C]" /> User Accounts &amp; Access Directory
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Search, filter by role, manage privileges, inspect account activity, or manage registrations.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 gap-2 shadow-sm rounded-xl font-bold self-start sm:self-auto border-0"
        >
          <UserPlus className="h-4 w-4" /> Create New Account
        </Button>
      </div>

      {/* ── Role Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL", label: "All Users" },
          { key: "ADMIN", label: "Admins" },
          { key: "USER", label: "Users / Managers" },
          { key: "CUSTOMER", label: "Customers" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-xs border ${
                isActive
                  ? "bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] border-transparent"
                  : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:bg-[#F7F3EA] hover:text-[#07111F]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-[#FCFBF7] p-4 rounded-2xl shadow-sm border border-[#E8E1D4] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#C89B3C]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="pl-10 h-10 border-[#E8E1D4] rounded-xl text-xs sm:text-sm bg-white text-[#07111F] focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Account Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 border-[#E8E1D4] rounded-xl bg-white text-xs font-semibold text-[#07111F] w-[160px] focus:ring-1 focus:ring-[#C89B3C]">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active Accounts</SelectItem>
              <SelectItem value="INACTIVE">Suspended Accounts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#C89B3C]" />
            <p className="text-sm font-medium">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-[#9CA3AF]">
            <Users className="h-10 w-10 mx-auto mb-2 text-[#C89B3C]/40" />
            <p className="font-semibold text-[#07111F]">No user accounts found matching criteria.</p>
            <p className="text-xs text-[#6B7280] mt-1">Try adjusting your search query or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">User Account</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Contact Info</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Role</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Activity Summary</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Joined Date</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Account Status</th>
                  <th className="text-right px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                    {/* Avatar & Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-inner ${
                          user.role === "ADMIN"
                            ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40"
                            : user.role === "USER"
                            ? "bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F]"
                            : "bg-[#F7F3EA] text-[#07111F] border border-[#E8E1D4]"
                        }`}>
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-[#07111F]">{user.name || "Unnamed User"}</p>
                          <p className="text-[10px] text-[#6B7280] font-mono">ID: {user.id.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="px-4 py-4">
                      <p className="text-[#07111F] flex items-center gap-1.5 text-xs font-medium">
                        <Mail className="h-3.5 w-3.5 text-[#C89B3C]" /> {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-[#6B7280] flex items-center gap-1.5 text-xs mt-0.5">
                          <Phone className="h-3.5 w-3.5 text-[#C89B3C]" /> {user.phone}
                        </p>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        user.role === "ADMIN"
                          ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30"
                          : user.role === "USER"
                          ? "bg-[#FCFBF7] text-[#A97918] border border-[#C89B3C]/40"
                          : "bg-[#F7F3EA] text-[#6B7280] border border-[#E8E1D4]"
                      }`}>
                        {user.role === "ADMIN" && <ShieldCheck className="h-3.5 w-3.5 text-[#D9B45B]" />}
                        {user.role === "USER" ? "USER / MANAGER" : user.role}
                      </span>
                    </td>

                    {/* Activity Summary */}
                    <td className="px-4 py-4 text-xs font-medium text-[#6B7280]">
                      {user.role === "USER" ? (
                        <span className="font-bold text-[#07111F]">🏢 {user._count.managedProperties} Properties Listed</span>
                      ) : user.role === "CUSTOMER" ? (
                        <div className="space-y-0.5">
                          <span>❤️ {user._count.favorites} Favorites</span> • <span>💳 {user._count.customerBookings} Bookings</span>
                        </div>
                      ) : (
                        <span className="font-bold text-[#A97918]">🛡️ Platform Administrator</span>
                      )}
                    </td>

                    {/* Join Date */}
                    <td className="px-4 py-4 text-[#6B7280] text-xs">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Account Status */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {user.isActive ? "Active" : "Suspended"}
                      </button>
                    </td>

                    {/* Actions: View Dashboard & Delete User */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="inline-flex items-center gap-1.5 bg-[#07111F] hover:bg-[#0B1728] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-xs border border-[#C89B3C]/30"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#D9B45B]" /> View
                        </Link>
                        <Button
                          onClick={() => handleOpenDelete(user)}
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0 border-[#E8E1D4] text-[#DC2626] bg-[#FCFBF7] hover:bg-red-50 hover:border-red-200 rounded-xl flex items-center justify-center transition-colors"
                          title="Delete User Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal 1: Create Account ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#C89B3C]" /> Create New Account
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Register an account directly with assigned role and credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Account Role</Label>
              <Select value={form.role} onValueChange={(val) => setForm((p) => ({ ...p, role: val as any }))}>
                <SelectTrigger className="h-10 border-[#E8E1D4] rounded-xl bg-white text-[#07111F] text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                  <SelectItem value="CUSTOMER">CUSTOMER (End Buyer / Renter)</SelectItem>
                  <SelectItem value="USER">USER / MANAGER (Property Agent)</SelectItem>
                  <SelectItem value="ADMIN">ADMIN (System Administrator)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Mohamed Ali"
                className="h-10 border-[#E8E1D4] bg-white rounded-xl text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@kiromaal.com"
                className="h-10 border-[#E8E1D4] bg-white rounded-xl text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+252 61 000 0000"
                className="h-10 border-[#E8E1D4] bg-white rounded-xl text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="h-10 border-[#E8E1D4] bg-white rounded-xl text-sm focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
                required
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm"
              >
                {submitting ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: Delete User Confirmation ─── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" /> Confirm Delete Account
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Are you sure you want to permanently delete account for <span className="font-bold text-[#07111F]">{userToDelete?.name || userToDelete?.email}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-xs text-red-700 my-2">
            ⚠️ Warning: Deleting this account will permanently remove all associated user data from the database. This action cannot be undone.
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl gap-2 font-semibold border-0"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Account Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
