"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  FolderTree,
  Pencil,
  Power,
  Trash2,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: {
    url: string;
    publicId: string;
  } | null;
  parentId: string | null;
  parentName: string;
  active: boolean;
  sortOrder: number;
}

interface CategoriesTableProps {
  categories: AdminCategory[];
}

export default function CategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !query ||
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && category.active) ||
        (statusFilter === "inactive" && !category.active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  async function toggleStatus(category: AdminCategory) {
    setUpdatingId(category.id);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !category.active }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update category.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update category.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteCategory(category: AdminCategory) {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(category.id);
    setError("");

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete category.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete category.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = categories.filter((category) => category.active).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div className="space-y-7">
      {/* Heading */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
            Catalogue
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Categories
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Organise and manage your product categories.
          </p>
        </div>

        <Link
          href="/admin/categories/new"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          <Plus size={17} />
          Add category
        </Link>
      </section>

      {/* Summary */}
      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-zinc-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs text-zinc-500">All categories</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">
            {categories.length}
          </p>
        </div>

        <div className="h-9 w-px bg-zinc-200" />

        <div>
          <p className="text-xs text-zinc-500">Active</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {activeCount}
          </p>
        </div>

        <div className="h-9 w-px bg-zinc-200" />

        <div>
          <p className="text-xs text-zinc-500">Inactive</p>
          <p className="mt-1 text-xl font-bold text-zinc-500">
            {inactiveCount}
          </p>
        </div>
      </section>

      {/* Search and filters */}
      <section className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories by name, slug or description..."
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-10 text-sm text-zinc-700 outline-none focus:border-purple-400 sm:w-40"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Table */}
      <section className="overflow-hidden border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-bold text-zinc-900">
            Category catalogue
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {filteredCategories.length} categories displayed
          </p>
        </div>

        {filteredCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Parent</th>
                  <th className="px-5 py-3">Sort order</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition hover:bg-zinc-50/80"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-zinc-200 bg-zinc-100">
                          {category.image?.url ? (
                            <img
                              src={category.image.url}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FolderTree size={20} className="text-zinc-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-sm font-semibold text-zinc-900">
                            {category.name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            /{category.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-zinc-600">
                      {category.parentName || "—"}
                    </td>

                    <td className="px-5 py-4 text-sm text-zinc-600">
                      {category.sortOrder}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          category.active ? "text-emerald-700" : "text-zinc-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            category.active ? "bg-emerald-500" : "bg-zinc-400"
                          }`}
                        />
                        {category.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleStatus(category)}
                          disabled={
                            updatingId === category.id ||
                            deletingId === category.id
                          }
                          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                            category.active
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {updatingId === category.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Power size={13} />
                          )}
                          {category.active ? "Deactivate" : "Activate"}
                        </button>

                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                        >
                          <Pencil size={13} />
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => void deleteCategory(category)}
                          disabled={
                            deletingId === category.id ||
                            updatingId === category.id
                          }
                          title="Delete category"
                          className="inline-flex items-center justify-center rounded-md border border-zinc-200 p-2 text-zinc-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingId === category.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center bg-zinc-100 text-zinc-400">
              <FolderTree size={25} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-zinc-900">
              {categories.length === 0
                ? "No categories yet"
                : "No matching categories"}
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
              {categories.length === 0
                ? "Create your first category to start organising your products."
                : "Try changing your search or status filter."}
            </p>

            {categories.length === 0 && (
              <Link
                href="/admin/categories/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-purple-700"
              >
                <Plus size={15} />
                Add your first category
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
