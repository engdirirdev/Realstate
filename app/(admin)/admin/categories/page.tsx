// ================================================================
// PAGE NAME  : Admin Dashboard — Categories & Property Types
// ROUTE      : /admin/categories
// DESCRIPTION: Manage property categories and taxonomy
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { FolderTree, Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch {
      toast({ title: "Error", description: "Failed to load categories.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Category Created 🎉", description: `Added ${form.name}.` });
        setModalOpen(false);
        setForm({ name: "", description: "" });
        fetchCategories();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create category." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Deleted", description: `Removed ${name}.` });
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete category." });
    }
  };

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
            <FolderTree className="h-6 w-6 text-[#10B981]" /> Manage Categories
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Organize real estate property classifications and taxonomies.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#10B981]" />
            <p className="text-sm font-medium">Loading categories...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-[#64748B]">Category Name</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Slug</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Description</th>
                <th className="text-right px-5 py-3.5 font-semibold text-[#64748B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-5 py-4 font-bold text-[#0F172A] flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#10B981]" /> {c.name}
                  </td>
                  <td className="px-4 py-4 text-[#64748B] font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-4 text-[#64748B] text-xs">{c.description || "N/A"}</td>
                  <td className="px-5 py-4 text-right">
                    <Button onClick={() => handleDelete(c.id, c.name)} variant="outline" size="sm" className="h-8 border-[#FCA5A5] text-[#DC2626] rounded-lg">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border border-[#E2E8F0]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0F172A]">Add Property Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Category Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Luxury Apartments" required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#0F172A]">Description</Label>
              <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description..." className="rounded-xl" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl">
                {submitting ? "Saving..." : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
