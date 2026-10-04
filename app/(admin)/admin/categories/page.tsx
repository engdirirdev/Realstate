// ================================================================
// PAGE NAME  : Admin Dashboard — Categories & Property Types
// ROUTE      : /admin/categories
// DESCRIPTION: Manage property categories and taxonomy
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { FolderTree, Plus, Trash2, Tag, Loader2, Sparkles } from "lucide-react";
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
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Architecture Taxonomy
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <FolderTree className="h-7 w-7 text-[#C89B3C]" /> Manage Property Classifications
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">Organize real estate property classifications, segments, and asset categories.</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl gap-2 font-bold shadow-sm border-0"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
            <p className="text-sm font-medium">Loading property categories...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
              <tr>
                <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Category Name</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Slug Identifier</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Description</th>
                <th className="text-right px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E1D4]">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-[#07111F] flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#C89B3C]" /> {cat.name}
                  </td>
                  <td className="px-4 py-4 text-[#A97918] font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-4 text-[#6B7280] text-xs">{cat.description || "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      variant="outline"
                      size="sm"
                      className="h-8 border-[#E8E1D4] text-[#DC2626] hover:bg-red-50 hover:border-red-200 rounded-xl"
                    >
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
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 border border-[#E8E1D4] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F]">Add Property Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Category Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Luxury Villas"
                required
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Description (Optional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Exclusive residential standalone villas"
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]">Cancel</Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm"
              >
                {submitting ? "Saving..." : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
