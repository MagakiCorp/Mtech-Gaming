import { Suspense } from "react";
import { connection } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

import CategoriesBrowser from "@/components/public/categories/categories-browser";

import type { Category } from "@/types/category";

export default function CategoriesPage() {
  return (
    <Suspense fallback={null}>
      <CategoriesPageContent />
    </Suspense>
  );
}

async function CategoriesPageContent() {
  await connection();

  const snapshot = await adminDb
    .collection("categories")
    .where("active", "==", true)
    .get();

  const categories = snapshot.docs
    .map((document) => {
      const data = document.data();

      const {
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...categoryData
      } = data;

      return {
        id: document.id,
        ...categoryData,
      } as Omit<Category, "createdAt" | "updatedAt"> & {
        id: string;
      };
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="min-h-screen bg-[#08060f]">
      {/* Categories introduction */}
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#08060f] text-white">
        {/* Background grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(167,139,250,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.7) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Ambient lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 -z-10 h-[500px] w-[500px] rounded-full bg-violet-700/15 blur-[150px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 left-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.07] blur-[140px]"
        />

        {/* Scanline texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.025]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.5) 4px)",
          }}
        />

        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-9 bg-gradient-to-r from-violet-400 to-cyan-400" />

              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-violet-300">
                Find your gear
              </span>
            </div>

            <h1 className="text-4xl font-black uppercase leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Shop by{" "}
              <span className="bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                category
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
              Explore our gaming accessories by category and discover products
              suited to your setup.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/10 pt-6">
              <div className="flex items-center gap-3">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-40" />
                  <span className="relative inline-flex size-2 rounded-full bg-cyan-400" />
                </span>

                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-white/70">
                  {categories.length}{" "}
                  {categories.length === 1 ? "category" : "categories"}{" "}
                  available
                </p>
              </div>

              <span className="hidden h-4 w-px bg-white/15 sm:block" />

              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                Browse the collection
              </span>
            </div>
          </div>
        </div>

        {/* HUD corner details */}
        <div
          aria-hidden="true"
          className="absolute right-6 top-6 hidden h-8 w-8 border-r border-t border-violet-400/40 sm:block lg:right-12 lg:top-10"
        />

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-violet-500/70 to-transparent"
        />

        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-px w-1/3 bg-gradient-to-l from-cyan-400/40 to-transparent"
        />
      </section>

      <CategoriesBrowser categories={categories} />
    </div>
  );
}
