import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";

import type { PublicProduct } from "./types";

interface BestSellersSectionProps {
  products: PublicProduct[];
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function getPrice(product: PublicProduct): string | null {
  const pricing = product.pricing;

  if (!pricing || pricing.type === "on_request") {
    return "Price on request";
  }

  if (
    typeof pricing.min !== "number" ||
    !Number.isFinite(pricing.min) ||
    pricing.min < 0
  ) {
    return null;
  }

  if (pricing.type === "fixed") {
    return formatPrice(pricing.min);
  }

  if (
    typeof pricing.max !== "number" ||
    !Number.isFinite(pricing.max) ||
    pricing.max < pricing.min
  ) {
    return formatPrice(pricing.min);
  }

  return `${formatPrice(pricing.min)} – ${formatPrice(pricing.max)}`;
}

const CHAMFER =
  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))]";

export default function BestSellersSection({
  products,
}: BestSellersSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden border-y border-violet-500/20 bg-[#08060f] py-20 text-white sm:py-24">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-violet-700/15 blur-[120px]" />
        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, #fff 4px)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Heading */}
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-violet-500 to-cyan-400" />

              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-300">
                Customer favourites
              </p>

              <Trophy size={14} className="text-cyan-300" />
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
              Best{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                sellers
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
              Popular picks for gaming setups and everyday play.
            </p>
          </div>

          <Link
            href="/products"
            className="hidden shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-300 transition hover:text-cyan-300 sm:inline-flex"
          >
            Explore products
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* Product leaderboard */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => {
            const image = product.images?.main?.url;
            const price = getPrice(product);

            return (
              <article key={product.id} className="group min-w-0">
                <Link href={`/products/${product.slug}`} className="block">
                  {/* Product image */}
                  <div
                    className={`relative aspect-square overflow-hidden border border-white/10 bg-[#110d1c] transition duration-500 group-hover:border-violet-400/50 ${CHAMFER}`}
                  >
                    {/* Image lighting */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(139,92,246,0.13),transparent_70%)]" />

                    {image && (
                      <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        className="relative z-10 h-full w-full object-contain p-5 transition duration-700 group-hover:scale-110 sm:p-7"
                      />
                    )}

                    {/* Ranking */}
                    <div className="absolute left-3 top-3 z-20 flex items-center gap-2 border border-violet-400/30 bg-[#08060f]/80 px-2.5 py-1.5 backdrop-blur-sm">
                      <span className="font-mono text-[10px] font-bold tracking-wider text-cyan-300">
                        #{String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="h-3 w-px bg-white/20" />

                      <span className="text-[9px] font-bold uppercase tracking-wider text-violet-200">
                        Bestseller
                      </span>
                    </div>

                    {/* Corner detail */}
                    <div className="absolute bottom-3 right-3 z-20 h-5 w-5 border-b border-r border-cyan-400/50" />

                    {/* Hover lighting */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-600/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                    <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500 group-hover:w-full" />
                  </div>

                  {/* Product information */}
                  <div className="pt-4">
                    <h3 className="line-clamp-2 min-h-12 text-sm font-bold leading-6 text-white transition group-hover:text-violet-300 sm:text-base">
                      {product.name}
                    </h3>

                    {price && (
                      <p className="mt-2 text-sm font-bold text-white">
                        {price}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300 transition group-hover:text-cyan-300">
                        View product
                      </span>

                      <ArrowUpRight
                        size={15}
                        className="text-white/40 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300"
                      />
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {/* Mobile link */}
        <Link
          href="/products"
          className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-300 transition hover:text-cyan-300 sm:hidden"
        >
          Explore products
          <ArrowUpRight size={16} />
        </Link>

        <div className="mt-12 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>
    </section>
  );
}
