"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { categorySchema } from "@smoke-shop/validators";
import { ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminCategoriesPage() {
  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.adminCategory.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [error, setError] = useState("");

  const createMutation = trpc.adminCategory.create.useMutation({
    onSuccess: () => {
      utils.adminCategory.list.invalidate();
      resetForm();
    },
    onError: (err) => setError(err.message),
  });

  const updateMutation = trpc.adminCategory.update.useMutation({
    onSuccess: () => {
      utils.adminCategory.list.invalidate();
      resetForm();
    },
    onError: (err) => setError(err.message),
  });

  const deleteMutation = trpc.adminCategory.delete.useMutation({
    onSuccess: () => utils.adminCategory.list.invalidate(),
  });

  function resetForm() {
    setShowForm(false);
    setEditId(null);
    setParentId(null);
    setFormName("");
    setFormDescription("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = categorySchema.safeParse({
      name: formName,
      description: formDescription || undefined,
      parentId,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid input");
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, data: parsed.data });
    } else {
      createMutation.mutate(parsed.data);
    }
  }

  function startEdit(id: string, name: string, description: string | null) {
    setEditId(id);
    setFormName(name);
    setFormDescription(description ?? "");
    setShowForm(true);
  }

  function startAddChild(parentCategoryId: string) {
    setParentId(parentCategoryId);
    setFormName("");
    setFormDescription("");
    setEditId(null);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-md border p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {editId ? "Edit Category" : parentId ? "Add Subcategory" : "New Category"}
          </h3>
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              placeholder="Category name"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <input
              placeholder="Description (optional)"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
              {editId ? "Update" : "Create"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-md border px-4 py-1.5 text-sm hover:bg-accent">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : categories?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories. Run the seed script or add one above.</p>
        ) : (
          categories?.map((cat) => (
            <div key={cat.id} className="rounded-md border">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  {cat.children.length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-medium">{cat.name}</span>
                  {cat.description && <span className="text-xs text-muted-foreground">— {cat.description}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startAddChild(cat.id)} className="rounded p-1 hover:bg-accent" title="Add subcategory">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button onClick={() => startEdit(cat.id, cat.name, cat.description)} className="rounded p-1 hover:bg-accent" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate({ id: cat.id })} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {cat.children.length > 0 && (
                <div className="border-t pl-8">
                  {cat.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between border-b p-2 last:border-b-0">
                      <span className="text-sm">{child.name}</span>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(child.id, child.name, child.description)} className="rounded p-1 hover:bg-accent" title="Edit">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => deleteMutation.mutate({ id: child.id })} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Delete">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
