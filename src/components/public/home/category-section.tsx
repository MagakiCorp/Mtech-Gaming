import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { PublicCategory } from "./types";

interface CategorySectionProps {
  categories: PublicCategory[];
}

const CHAMFER =
  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))]";

export default function CategorySection({ categories }: CategorySectionProps) {
  if (categories.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden border-y border-white/10 bg-[#0d0917] py-20 text-white sm:py-24">
      {/* Digital texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035] [background-image:repeating-linear-gradient(to_bottom,#fff_0,#fff_1px,transparent_1px,transparent_4px)]"
      />

      {/* Ambient lighting */}
      <div className="pointer-events-none absolute -left-40 top-0 -z-10 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 -z-10 h-[380px] w-[380px] rounded-full bg-cyan-400/5 blur-[120px]" />

      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        {/* Section heading */}
        <div className="mb-12 flex flex-col justify-between gap-7 border-b border-white/10 pb-8 sm:flex-row sm:items-end lg:mb-14">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-violet-400 to-cyan-300" />
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-violet-300">
                Explore
              </p>
            </div>

            <h2 className="text-3xl font-black uppercase leading-tight tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
              Shop by category
              <span className="text-violet-400">.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
              Explore our collection by finding the accessories that suit your
              setup.
            </p>
          </div>

          <Link
            href="/categories"
            className="group hidden w-fit items-center gap-3 border-b border-violet-400/40 pb-2 text-sm font-semibold text-white/80 transition hover:border-cyan-300 hover:text-cyan-200 sm:inline-flex"
          >
            All categories
            <ArrowUpRight
              size={17}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Category gallery */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-7">
          {categories.map((category, index) => {
            const imageUrl = category.image?.url;

            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className={`group relative min-w-0 ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
              >
                <div
                  className={`${CHAMFER} relative aspect-[5/4] overflow-hidden border border-white/10 bg-[#171020] transition duration-300 group-hover:border-violet-400/60 ${
                    index === 0 ? "lg:aspect-[2.05/1]" : ""
                  }`}
                >
                  {/* Category image */}
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                    />
                  )}

                  {/* Image grading */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08060f]/95 via-[#08060f]/25 to-[#08060f]/5 transition-opacity duration-300 group-hover:from-[#08060f]/90" />
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-400/10 opacity-60 transition-opacity group-hover:opacity-100" />

                  {/* Digital texture */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:36px_36px]"
                  />

                  {/* Category index */}
                  <span className="absolute left-4 top-4 font-mono text-[10px] tracking-[0.2em] text-white/60 sm:left-5 sm:top-5">
                    CAT / {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Top-right corner indicator */}
                  <span className="absolute right-4 top-4 h-4 w-4 border-r border-t border-cyan-300/60 transition-all duration-300 group-hover:h-6 group-hover:w-6 sm:right-5 sm:top-5" />

                  {/* Category details */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-7">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.22em] text-violet-300 sm:text-[10px]">
                          Explore collection
                        </span>

                        <h3 className="text-lg font-black leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
                          {category.name}
                        </h3>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/25 bg-black/20 text-white transition duration-300 group-hover:border-violet-400 group-hover:bg-violet-600 group-hover:text-white sm:h-11 sm:w-11">
                        <ArrowUpRight
                          size={19}
                          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>

                    <div className="mt-4 h-px w-full bg-white/15">
                      <div className="h-px w-0 bg-gradient-to-r from-violet-400 to-cyan-300 transition-all duration-500 group-hover:w-full" />
                    </div>
                  </div>

                  {/* Bottom-left corner detail */}
                  <span className="absolute bottom-4 left-4 h-3 w-3 border-b border-l border-violet-400/70 sm:bottom-5 sm:left-5" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile all categories link */}
        <div className="mt-10 border-t border-white/10 pt-6 sm:hidden">
          <Link
            href="/categories"
            className="group inline-flex items-center gap-3 text-sm font-semibold text-violet-300 transition hover:text-cyan-200"
          >
            View all categories
            <ArrowUpRight
              size={17}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>

      {/* Section edge */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
    </section>
  );
}
