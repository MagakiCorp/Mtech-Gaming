"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { HomepageProductOption } from "@/types/admin-homepage";


interface ProductSelectionsProps {
  products: HomepageProductOption[];
  featuredProductIds: string[];
  bestSellerProductIds: string[];
  newArrivalProductIds: string[];
  onChange: (
    field:
      | "featuredProductIds"
      | "bestSellerProductIds"
      | "newArrivalProductIds",
    ids: string[],
  ) => void;
}

const MAX_PRODUCTS = 12;

const groups = [
  {
    field: "featuredProductIds",
    title: "Featured products",
    description: "Products you want to highlight on your homepage.",
  },
  {
    field: "bestSellerProductIds",
    title: "Best sellers",
    description: "Your selected popular products.",
  },
  {
    field: "newArrivalProductIds",
    title: "New arrivals",
    description: "Recently added products you want to showcase.",
  },
] as const;

type SelectionField = (typeof groups)[number]["field"];

export default function ProductSelections({
  products,
  featuredProductIds,
  bestSellerProductIds,
  newArrivalProductIds,
  onChange,
}: ProductSelectionsProps) {
  const [searches, setSearches] = useState<Record<string, string>>({});

  const selections: Record<SelectionField, string[]> = {
    featuredProductIds,
    bestSellerProductIds,
    newArrivalProductIds,
  };

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  function updateSearch(field: SelectionField, value: string) {
    setSearches((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addProduct(field: SelectionField, id: string) {
    const current = selections[field];

    if (
      current.includes(id) ||
      current.length >= MAX_PRODUCTS ||
      !productMap.get(id)?.active
    ) {
      return;
    }

    onChange(field, [...current, id]);
  }

  function removeProduct(field: SelectionField, id: string) {
    onChange(
      field,
      selections[field].filter((productId) => productId !== id),
    );
  }

  function moveProduct(
    field: SelectionField,
    index: number,
    direction: -1 | 1,
  ) {
    const current = [...selections[field]];
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= current.length) return;

    [current[index], current[nextIndex]] = [current[nextIndex], current[index]];

    onChange(field, current);
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const selectedIds = selections[group.field];
        const search = (searches[group.field] ?? "").trim().toLowerCase();

        const availableProducts = products.filter((product) => {
          if (!product.active || selectedIds.includes(product.id)) {
            return false;
          }

          return (
            product.name.toLowerCase().includes(search) ||
            product.slug.toLowerCase().includes(search)
          );
        });

        return (
          <section
            key={group.field}
            className="border-t border-zinc-100 pt-7 first:border-0 first:pt-0"
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  {group.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {group.description}
                </p>
              </div>

              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                {selectedIds.length}/{MAX_PRODUCTS} selected
              </span>
            </div>

            {/* Selected products */}
            <div className="space-y-2">
              {selectedIds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-7 text-center">
                  <p className="text-sm font-medium text-zinc-600">
                    No products selected
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Search and add products below.
                  </p>
                </div>
              ) : (
                selectedIds.map((id, index) => {
                  const product = productMap.get(id);

                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-500">
                        {index + 1}
                      </span>

                      {product?.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-md border border-zinc-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
                          <ImageIcon size={19} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-800">
                          {product?.name ?? "Unavailable product"}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {!product
                            ? "Product no longer exists"
                            : !product.active
                              ? "Inactive product"
                              : product.availability.replaceAll("_", " ")}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveProduct(group.field, index, -1)}
                          disabled={index === 0}
                          aria-label="Move product up"
                          className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-purple-700 disabled:opacity-30"
                        >
                          <ArrowUp size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveProduct(group.field, index, 1)}
                          disabled={index === selectedIds.length - 1}
                          aria-label="Move product down"
                          className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-purple-700 disabled:opacity-30"
                        >
                          <ArrowDown size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeProduct(group.field, id)}
                          aria-label="Remove product"
                          className="rounded-md p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Product search and selection */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Add a product
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  type="search"
                  value={searches[group.field] ?? ""}
                  onChange={(event) =>
                    updateSearch(group.field, event.target.value)
                  }
                  placeholder="Search active products..."
                  disabled={selectedIds.length >= MAX_PRODUCTS}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:bg-zinc-50"
                />
              </div>

              {selectedIds.length >= MAX_PRODUCTS ? (
                <p className="mt-2 text-xs text-amber-600">
                  Maximum of {MAX_PRODUCTS} products reached.
                </p>
              ) : search.length > 0 ? (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
                  {availableProducts.length === 0 ? (
                    <p className="px-4 py-5 text-center text-sm text-zinc-500">
                      No matching active products found.
                    </p>
                  ) : (
                    availableProducts.slice(0, 20).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(group.field, product.id)}
                        className="flex w-full items-center gap-3 border-b border-zinc-100 px-3 py-3 text-left transition last:border-0 hover:bg-purple-50"
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
                            <ImageIcon size={17} />
                          </div>
                        )}

                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">
                          {product.name}
                        </span>

                        <Plus size={17} className="shrink-0 text-purple-600" />
                      </button>
                    ))
                  )}

                  {availableProducts.length > 20 && (
                    <p className="px-3 py-2 text-center text-xs text-zinc-400">
                      Showing the first 20 matches. Refine your search.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs text-zinc-400">
                  Start typing to find a product.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
