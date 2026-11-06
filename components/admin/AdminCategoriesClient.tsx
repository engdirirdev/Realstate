"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Plus, Trash2, Tag, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

interface AdminCategoriesClientProps {
  initialCategories: CategoryItem[];
}

function AdminCategoriesClient({ initialCategories = [] }: AdminCategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [updating, setUpdating] = useState(false);

  // Sync with SSR updates or router revalidations
  useEffect(() => {
    if (initialCategories) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success && data.category) {
        toast({ title: "Category Created 🎉", description: `Added ${form.name}.` });
        setCategories((prev) => [
          ...prev,
          {
            id: data.category.id,
            name: data.category.name,
            slug: data.category.slug,
            description: data.category.description,
            createdAt: data.category.createdAt || new Date().toISOString(),
          },
        ].sort((a, b) => a.name.localeCompare(b.name)));
        setModalOpen(false);
        setForm({ name: "", description: "" });
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error || "Failed to create category", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create category." });
    } finally {
      setSubmitting(false);
    }
  }, [form, router]);

  const openEditModal = useCallback((cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditForm({ name: cat.name, description: cat.description || "" });
    setEditModalOpen(true);
  }, []);

  const handleUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editForm.name.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editForm.name,
          description: editForm.description,
        }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        toast({ title: "Category Updated ✨", description: `Updated ${editForm.name}.` });
        setCategories((prev) =>
          prev.map((c) =>
            c.id === data.category.id
              ? {
                  ...c,
                  name: data.category.name,
                  slug: data.category.slug,
                  description: data.category.description,
                }
              : c
          ).sort((a, b) => a.name.localeCompare(b.name))
        );
        setEditModalOpen(false);
        setEditingCategory(null);
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error || "Failed to update category", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update category." });
    } finally {
      setUpdating(false);
    }
  }, [editingCategory, editForm, router]);

  const handleDelete = useCallback(async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Deleted", description: `Removed ${name}.` });
        setCategories((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete category.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete category." });
    }
  }, [router]);

  return (
    <div className="space-y-5 w-full min-w-0">
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
        {categories.length === 0 ? (
          <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
            <FolderTree className="h-10 w-10 text-[#C89B3C]/50 mb-1" />
            <p className="text-base font-serif font-bold text-[#07111F]">No Property Categories Found</p>
            <p className="text-xs text-[#6B7280] max-w-sm">
              Define your first property classification (e.g. Luxury Villas, Commercial, Apartments) to organize your catalog.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="mt-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl gap-2 shadow-sm border-0"
            >
              <Plus className="h-4 w-4" /> Add First Category
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => openEditModal(cat)}
                          variant="outline"
                          size="sm"
                          className="h-8 border-[#C89B3C]/40 text-[#07111F] bg-[#FCFBF7] hover:bg-[#F7F3EA] hover:border-[#C89B3C] rounded-xl font-medium shadow-xs"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1 text-[#C89B3C]" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          variant="outline"
                          size="sm"
                          className="h-8 border-[#E8E1D4] text-[#DC2626] hover:bg-red-50 hover:border-red-200 rounded-xl"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
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

      {/* Create Category Dialog */}
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

      {/* Edit Category Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 border border-[#E8E1D4] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <Pencil className="h-5 w-5 text-[#C89B3C]" /> Edit Property Category
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Category Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Luxury Villas"
                required
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#07111F]">Description (Optional)</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Exclusive residential standalone villas"
                className="rounded-xl border-[#E8E1D4] bg-white focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
              />
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingCategory(null);
                }}
                className="rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updating}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm"
              >
                {updating ? "Saving Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export default memo(AdminCategoriesClient);
