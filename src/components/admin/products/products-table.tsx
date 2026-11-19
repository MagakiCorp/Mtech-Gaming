"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Package,
  Pencil,
  ChevronDown,
  SlidersHorizontal,
  X,
  Power,
} from "lucide-react";

import type {
  AdminProduct,
  AdminProductCategory,
} from "@/types/admin-products";

interface ProductsTableProps {
  products: AdminProduct[];
  categories: AdminProductCategory[];
}

type AvailabilityFilter =
  | "all"
  | "in_stock"
  | "out_of_stock"
  | "pre_order"
  | "discontinued";

function formatPrice(pricing: AdminProduct["pricing"]) {
  if (pricing.type === "on_request") {
    return "Price on request";
  }

  const format = (value: number) => `KES ${value.toLocaleString("en-KE")}`;

  if (pricing.type === "range") {
    if (pricing.min === null || pricing.max === null) {
      return "Price on request";
    }

    return `${format(pricing.min)} – ${format(pricing.max)}`;
  }

  return pricing.min !== null ? format(pricing.min) : "Price on request";
}

function availabilityLabel(availability: AdminProduct["availability"]) {
  const labels = {
    in_stock: "In stock",
    out_of_stock: "Out of stock",
    pre_order: "Pre-order",
    discontinued: "Discontinued",
  };

  return labels[availability];
}

function AvailabilityBadge({
  availability,
}: {
  availability: AdminProduct["availability"];
}) {
  const styles = {
    in_stock: "bg-emerald-50 text-emerald-700",
    out_of_stock: "bg-red-50 text-red-700",
    pre_order: "bg-amber-50 text-amber-700",
    discontinued: "bg-zinc-100 text-zinc-600",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${styles[availability]}`}
    >
      {availabilityLabel(availability)}
    </span>
  );
}

export default function ProductsTable({
  products,
  categories,
}: ProductsTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.brand.toLowerCase().includes(normalizedSearch) ||
        product.slug.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "all" || product.categoryId === categoryFilter;

      const matchesAvailability =
        availabilityFilter === "all" ||
        product.availability === availabilityFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.active) ||
        (statusFilter === "inactive" && !product.active);

      return (
        matchesSearch && matchesCategory && matchesAvailability && matchesStatus
      );
    });
  }, [products, search, categoryFilter, availabilityFilter, statusFilter]);

  const hasFilters =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    availabilityFilter !== "all" ||
    statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setAvailabilityFilter("all");
    setStatusFilter("all");
  }

  const router = useRouter();

  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState("");

  async function toggleProductStatus(product: AdminProduct) {
    const nextStatus = !product.active;

    setUpdatingProductId(product.id);
    setActionError("");

    try {
      const response = await fetch(`/api/admin/products/${product.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: nextStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update product status.");
      }

      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the product.",
      );
    } finally {
      setUpdatingProductId(null);
    }
  }

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
            Catalogue
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Products
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage your gaming accessories and product listings.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          <Plus size={17} />
          Add product
        </Link>
      </section>

      {/* Product summary */}
      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-zinc-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs text-zinc-500">All products</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">
            {products.length}
          </p>
        </div>

        <div className="h-9 w-px bg-zinc-200" />

        <div>
          <p className="text-xs text-zinc-500">Active</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {products.filter((product) => product.active).length}
          </p>
        </div>

        <div className="h-9 w-px bg-zinc-200" />

        <div>
          <p className="text-xs text-zinc-500">Inactive</p>
          <p className="mt-1 text-xl font-bold text-zinc-500">
            {products.filter((product) => !product.active).length}
          </p>
        </div>
      </section>

      {/* Search and filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products by name, brand or slug..."
              className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-9 text-sm text-zinc-700 outline-none focus:border-purple-400 sm:w-48"
              >
                <option value="all">All categories</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>

            <div className="relative flex-1 sm:flex-none">
              <select
                value={availabilityFilter}
                onChange={(event) =>
                  setAvailabilityFilter(
                    event.target.value as AvailabilityFilter,
                  )
                }
                className="h-11 w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-9 text-sm text-zinc-700 outline-none focus:border-purple-400 sm:w-44"
              >
                <option value="all">All availability</option>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="pre_order">Pre-order</option>
                <option value="discontinued">Discontinued</option>
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>

            <div className="relative flex-1 sm:flex-none">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-9 text-sm text-zinc-700 outline-none focus:border-purple-400 sm:w-36"
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
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Showing {filteredProducts.length} of {products.length} products
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900"
            >
              <X size={14} />
              Clear filters
            </button>
          </div>
        )}
      </section>

      {actionError && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      {/* Product table */}
      <section className="overflow-hidden border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">
              Product catalogue
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {filteredProducts.length} products displayed
            </p>
          </div>

          <SlidersHorizontal size={18} className="text-zinc-400" />
        </div>

        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-zinc-50/80"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-zinc-200 bg-zinc-100">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <Package size={20} className="text-zinc-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-sm font-semibold text-zinc-900">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {product.brand || "No brand specified"}
                          </p>

                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {product.featured && (
                              <span className="text-[10px] font-semibold text-purple-700">
                                Featured
                              </span>
                            )}

                            {product.bestSeller && (
                              <span className="text-[10px] font-semibold text-amber-700">
                                Best seller
                              </span>
                            )}

                            {product.newArrival && (
                              <span className="text-[10px] font-semibold text-blue-700">
                                New arrival
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-zinc-600">
                      {product.categoryName}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-zinc-800">
                      {formatPrice(product.pricing)}
                    </td>

                    <td className="px-5 py-4">
                      <AvailabilityBadge availability={product.availability} />
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          product.active ? "text-emerald-700" : "text-zinc-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            product.active ? "bg-emerald-500" : "bg-zinc-400"
                          }`}
                        />

                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleProductStatus(product)}
                          disabled={updatingProductId === product.id}
                          title={
                            product.active
                              ? "Deactivate product"
                              : "Activate product"
                          }
                          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            product.active
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          <Power size={13} />
                          {updatingProductId === product.id
                            ? "Updating..."
                            : product.active
                              ? "Deactivate"
                              : "Activate"}
                        </button>

                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                        >
                          <Pencil size={13} />
                          Edit
                        </Link>
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
              <Package size={25} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-zinc-900">
              {products.length === 0
                ? "No products yet"
                : "No matching products"}
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
              {products.length === 0
                ? "Your product catalogue is empty. Add your first product to get started."
                : "Try changing your search or filters to find the product you're looking for."}
            </p>

            {products.length === 0 && (
              <Link
                href="/admin/products/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-purple-700"
              >
                <Plus size={15} />
                Add your first product
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
