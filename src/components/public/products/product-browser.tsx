"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowUpRight, SlidersHorizontal, X } from "lucide-react";

import type {
  PublicProduct,
  PublicCategory,
} from "@/components/public/home/types";

interface ProductsBrowserProps {
  products: PublicProduct[];
  categories: PublicCategory[];
}

function formatPrice(pricing: PublicProduct["pricing"]): string {
  if (!pricing) return "Price on request";

  const formatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  });

  if (pricing.type === "on_request") {
    return "Price on request";
  }

  if (pricing.type === "range") {
    if (pricing.min == null || pricing.max == null) {
      return "Price on request";
    }

    return `${formatter.format(pricing.min)} – ${formatter.format(pricing.max)}`;
  }

  return pricing.min != null
    ? formatter.format(pricing.min)
    : "Price on request";
}

function AvailabilityLabel({
  availability,
}: {
  availability: PublicProduct["availability"];
}) {
  const labels = {
    in_stock: {
      text: "In stock",
      style: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      dot: "bg-emerald-400",
    },
    out_of_stock: {
      text: "Out of stock",
      style: "border-white/10 bg-white/5 text-white/45",
      dot: "bg-white/35",
    },
    pre_order: {
      text: "Pre-order",
      style: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      dot: "bg-amber-400",
    },
    discontinued: {
      text: "Discontinued",
      style: "border-red-400/20 bg-red-400/10 text-red-300",
      dot: "bg-red-400",
    },
  };

  const item = labels[availability] ?? labels.out_of_stock;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.style}`}
    >
      <span className={`size-1.5 rounded-full ${item.dot}`} />
      {item.text}
    </span>
  );
}

const CHAMFER =
  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))]";

export default function ProductsBrowser({
  products,
  categories,
}: ProductsBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory;

      const matchesSearch =
        !query ||
        [product.name, product.description, product.brand ?? ""].some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const hasFilters = search.trim().length > 0 || selectedCategory !== "all";

  return (
    <section className="relative isolate overflow-hidden bg-[#08060f] py-14 text-white sm:py-20">
      {/* Background effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(167,139,250,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.7) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 -z-10 h-96 w-96 rounded-full bg-violet-700/10 blur-[130px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-[35%] -z-10 h-96 w-96 rounded-full bg-cyan-500/[0.07] blur-[130px]"
      />

      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {/* Header and search */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-violet-400 to-cyan-400" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-300">
                Product database
              </span>
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Explore our{" "}
              <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                products
              </span>
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-7 text-white/45">
              Browse the collection and find your next gaming upgrade.
            </p>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-13 w-full border border-white/10 bg-[#110d1c] pl-12 pr-11 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/20"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
              >
                <X size={16} />
              </button>
            )}

            <div className="absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-violet-500 to-cyan-400" />
          </div>
        </div>

        {/* Category filters */}
        <div className="mt-12 border-y border-white/[0.08] py-5">
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={15} className="shrink-0 text-violet-400" />

            <span className="hidden shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30 sm:block">
              Filter by
            </span>

            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                aria-pressed={selectedCategory === "all"}
                className={`shrink-0 border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  selectedCategory === "all"
                    ? "border-violet-400/50 bg-violet-500/15 text-violet-200"
                    : "border-white/10 bg-white/[0.025] text-white/45 hover:border-white/25 hover:text-white"
                }`}
              >
                All products
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={selectedCategory === category.id}
                  className={`shrink-0 border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                    selectedCategory === category.id
                      ? "border-violet-400/50 bg-violet-500/15 text-violet-200"
                      : "border-white/10 bg-white/[0.025] text-white/45 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results information */}
        <div className="flex items-center justify-between border-b border-white/[0.08] py-5">
          <p className="font-mono text-xs text-white/40">
            RESULTS{" "}
            <span className="font-bold text-cyan-300">
              / {String(filteredProducts.length).padStart(2, "0")}
            </span>
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300 transition hover:text-cyan-300"
            >
              <X size={13} />
              Clear filters
            </button>
          )}
        </div>

        {/* Product grid */}
        {filteredProducts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group min-w-0"
              >
                {/* Image panel */}
                <div
                  className={`relative aspect-[4/4.2] overflow-hidden border border-white/[0.07] bg-[#110d1c] transition duration-500 group-hover:border-violet-400/40 ${CHAMFER}`}
                >
                  {/* Image background grid */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(167,139,250,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.6) 1px, transparent 1px)",
                      backgroundSize: "30px 30px",
                    }}
                  />

                  {product.images?.main?.url && (
                    <Image
                      src={product.images.main.url}
                      alt={product.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-6 transition duration-700 group-hover:scale-105"
                    />
                  )}

                  {/* Image lighting */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-950/30 via-transparent to-transparent opacity-70"
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-violet-500/[0.08] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />

                  {/* Product index */}
                  <span className="absolute left-4 top-4 font-mono text-[10px] tracking-widest text-white/35">
                    ITEM / {String(index + 1).padStart(2, "0")}
                  </span>

                  {product.featured && (
                    <span className="absolute right-4 top-4 border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-violet-200">
                      Featured
                    </span>
                  )}

                  {/* View indicator */}
                  <div className="absolute bottom-4 right-4 flex size-10 items-center justify-center border border-white/15 bg-[#08060f]/80 text-white transition duration-300 group-hover:border-violet-400 group-hover:bg-violet-600 group-hover:text-white">
                    <ArrowUpRight
                      size={18}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </div>

                  {/* Corner detail */}
                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-cyan-400/40"
                  />
                </div>

                {/* Product information */}
                <div className="pt-5">
                  <div className="flex min-h-6 items-center justify-between gap-2">
                    {product.brand ? (
                      <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/70">
                        {product.brand}
                      </span>
                    ) : (
                      <span />
                    )}

                    <AvailabilityLabel availability={product.availability} />
                  </div>

                  <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-white transition-colors group-hover:text-violet-300">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/40">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                    <p className="text-sm font-bold text-white">
                      {formatPrice(product.pricing)}
                    </p>

                    <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-violet-300/70 transition-colors group-hover:text-cyan-300">
                      View product
                    </span>
                  </div>

                  <div className="mt-3 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500 group-hover:w-full" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="py-28 text-center">
            <div className="mx-auto flex size-14 items-center justify-center border border-violet-400/20 bg-violet-500/10 text-violet-300">
              <Search size={22} />
            </div>

            <h3 className="mt-6 text-lg font-bold uppercase tracking-wide text-white">
              No products found
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Try another search term or select a different category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
              }}
              className="mt-7 inline-flex items-center gap-2 border border-violet-400/30 bg-violet-500/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-violet-200 transition hover:border-violet-400/60 hover:bg-violet-500/20"
            >
              <X size={14} />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
    </section>
  );
}
