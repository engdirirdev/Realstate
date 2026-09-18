// ================================================================
// PAGE NAME  : Admin Dashboard — Manage Users Directory
// ROUTE      : /admin/users
// DESCRIPTION: Admin User List — Filter tabs [All Users] [Admins]
//              [Users / Managers] [Customers], Search by name/email,
//              Role & Status filters, 👁 View Dashboard button, and
//              🗑️ Delete User / Delete Customer action button
// ROLE       : ADMIN only
// ================================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Search, Filter, Mail, Phone, Calendar, Shield, UserPlus,
  Eye, CheckCircle2, AlertTriangle, ShieldCheck, Loader2, UserX, UserCheck, Trash2
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
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
            <Users className="h-6 w-6 text-[#10B981]" /> Manage Users &amp; Accounts
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            Search, filter by role, activate/suspend accounts, inspect dashboards, or delete users and customers.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#10B981] hover:bg-[#059669] text-white gap-2 shadow-sm rounded-xl font-semibold self-start sm:self-auto"
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
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs border ${
              activeTab === tab.key
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#94A3B8]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="pl-10 h-10 border-[#E2E8F0] rounded-xl text-xs sm:text-sm bg-[#F8FAFC]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-[#64748B]">Account Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 border-[#E2E8F0] rounded-xl bg-white text-xs text-[#0F172A] w-[160px]">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#E2E8F0]">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active Accounts</SelectItem>
              <SelectItem value="INACTIVE">Suspended Accounts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#10B981]" />
            <p className="text-sm font-medium">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-[#0F172A]">No user accounts found matching criteria.</p>
            <p className="text-xs text-[#64748B] mt-1">Try adjusting your search query or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#64748B]">User Account</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Contact Info</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Role</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Activity Summary</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Joined Date</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Account Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-[#64748B]">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Avatar & Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                          user.role === "ADMIN"
                            ? "bg-[#0F172A] text-[#10B981]"
                            : user.role === "USER"
                            ? "bg-[#10B981] text-white"
                            : "bg-[#ECFEFF] text-[#0891B2]"
                        }`}>
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-[#0F172A]">{user.name || "Unnamed User"}</p>
                          <p className="text-[10px] text-[#94A3B8] font-mono">ID: {user.id.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="px-4 py-4">
                      <p className="text-[#0F172A] flex items-center gap-1.5 text-xs font-medium">
                        <Mail className="h-3.5 w-3.5 text-[#64748B]" /> {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-[#64748B] flex items-center gap-1.5 text-xs mt-0.5">
                          <Phone className="h-3.5 w-3.5" /> {user.phone}
                        </p>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === "ADMIN"
                          ? "bg-[#0F172A] text-[#34D399]"
                          : user.role === "USER"
                          ? "bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]"
                          : "bg-[#F1F5F9] text-[#334155]"
                      }`}>
                        {user.role === "ADMIN" && <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />}
                        {user.role === "USER" ? "USER / MANAGER" : user.role}
                      </span>
                    </td>

                    {/* Activity Summary */}
                    <td className="px-4 py-4 text-xs font-medium text-[#64748B]">
                      {user.role === "USER" ? (
                        <span className="font-bold text-[#10B981]">🏢 {user._count.managedProperties} Properties Listed</span>
                      ) : user.role === "CUSTOMER" ? (
                        <div className="space-y-0.5">
                          <span>❤️ {user._count.favorites} Favorites</span> • <span>💳 {user._count.customerBookings} Bookings</span>
                        </div>
                      ) : (
                        <span className="font-bold text-[#0F172A]">🛡️ Administrator</span>
                      )}
                    </td>

                    {/* Join Date */}
                    <td className="px-4 py-4 text-[#64748B] text-xs">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Account Status */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          user.isActive
                            ? "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]"
                            : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
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
                          className="inline-flex items-center gap-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#10B981]" /> View
                        </Link>
                        <Button
                          onClick={() => handleOpenDelete(user)}
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0 border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] hover:text-[#991B1B] rounded-xl flex items-center justify-center"
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
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#10B981]" /> Create New Account
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Add a new account directly from Admin control panel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Account Role</Label>
              <Select value={form.role} onValueChange={(val) => setForm((p) => ({ ...p, role: val as any }))}>
                <SelectTrigger className="h-10 border-[#E2E8F0] rounded-xl bg-white text-[#0F172A]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E2E8F0]">
                  <SelectItem value="CUSTOMER">CUSTOMER (End Buyer / Renter)</SelectItem>
                  <SelectItem value="USER">USER / MANAGER (Property Agent)</SelectItem>
                  <SelectItem value="ADMIN">ADMIN (System Administrator)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Mohamed Ali"
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@realestate.so"
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+252 61 000 0000"
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="h-10 border-[#E2E8F0] rounded-xl text-sm"
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl">
                {submitting ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: Delete User Confirmation ─── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#991B1B] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" /> Confirm Delete Account
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Are you sure you want to permanently delete account for <span className="font-bold text-[#0F172A]">{userToDelete?.name || userToDelete?.email}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#FEE2E2] p-4 rounded-xl border border-[#FCA5A5] text-xs text-[#991B1B] my-2">
            ⚠️ Warning: Deleting this account will permanently remove all associated user data from the database. This action cannot be undone.
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
    </div>
  );
}
