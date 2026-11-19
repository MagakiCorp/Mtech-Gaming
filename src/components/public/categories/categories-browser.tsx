"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";

import type { Category } from "@/types/category";

interface CategoriesBrowserProps {
  categories: (Omit<Category, "createdAt" | "updatedAt"> & {
    id: string;
  })[];
}

const CHAMFER =
  "[clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,16px_100%,0_calc(100%-16px))]";

export default function CategoriesBrowser({
  categories,
}: CategoriesBrowserProps) {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((category) =>
      [category.name, category.description].some((value) =>
        value?.toLowerCase().includes(query),
      ),
    );
  }, [categories, search]);

  return (
    <section className="relative isolate overflow-hidden bg-[#08060f] py-12 text-white sm:py-16">
      {/* Background grid */}
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
        className="pointer-events-none absolute -left-40 top-20 -z-10 h-96 w-96 rounded-full bg-violet-700/[0.08] blur-[130px]"
      />

      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {/* Browser heading */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-violet-400 to-cyan-400" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">
                Explore the collection
              </span>
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Browse{" "}
              <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                categories
              </span>
            </h2>

            <p className="mt-3 text-sm text-white/45">
              Find the accessories that fit your gaming setup.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-300/60"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories..."
              aria-label="Search categories"
              className="h-12 w-full border border-white/10 bg-[#110d1c] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/20"
            />

            <span className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300 focus-within:w-full" />
          </div>
        </div>

        {/* Results information */}
        <div className="flex items-center justify-between border-b border-white/[0.07] py-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">
            Showing{" "}
            <span className="font-bold text-white">
              {filteredCategories.length}
            </span>{" "}
            {filteredCategories.length === 1 ? "category" : "categories"}
          </p>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs font-semibold uppercase tracking-wider text-violet-300 transition hover:text-cyan-300"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Category results */}
        {filteredCategories.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category, index) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group min-w-0"
              >
                {/* Image area */}
                <div
                  className={`relative aspect-[5/3.8] overflow-hidden border border-white/[0.08] bg-[#110d1c] transition duration-500 group-hover:border-violet-400/40 ${CHAMFER}`}
                >
                  {/* Technical grid */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10 opacity-[0.07]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(167,139,250,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.6) 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }}
                  />

                  {category.image?.url && (
                    <Image
                      src={category.image.url}
                      alt={category.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                    />
                  )}

                  {/* Image lighting */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-violet-950/40 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                  />

                  <span className="absolute left-4 top-4 z-20 font-mono text-[10px] tracking-widest text-white/40">
                    CATEGORY / {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="absolute bottom-4 right-4 z-20 flex size-10 items-center justify-center border border-white/15 bg-[#08060f]/85 text-white transition duration-300 group-hover:border-violet-400 group-hover:bg-violet-600">
                    <ArrowUpRight
                      size={18}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </div>

                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 z-20 h-5 w-5 border-b border-l border-cyan-400/50"
                  />
                </div>

                {/* Category information */}
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] py-5 transition-colors group-hover:border-violet-400/40">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white transition-colors group-hover:text-violet-300">
                      {category.name}
                    </h3>

                    {category.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/40">
                        {category.description}
                      </p>
                    )}
                  </div>

                  <ArrowUpRight
                    size={17}
                    className="mt-1 shrink-0 text-white/25 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300"
                  />
                </div>

                <div className="h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="mx-auto flex size-14 items-center justify-center border border-white/10 bg-[#110d1c] text-violet-300">
              <Search size={22} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-white">
              No categories found
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Try searching with a different category name.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-6 text-xs font-bold uppercase tracking-wider text-violet-300 transition hover:text-cyan-300"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
