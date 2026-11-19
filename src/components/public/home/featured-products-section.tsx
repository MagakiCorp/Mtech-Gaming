import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { PublicProduct } from "./types";

interface FeaturedProductsSectionProps {
  products: PublicProduct[];
}

const CHAMFER =
  "[clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function getProductPrice(product: PublicProduct): string | null {
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

function getAvailabilityLabel(
  availability: PublicProduct["availability"],
): string {
  switch (availability) {
    case "in_stock":
      return "In stock";
    case "out_of_stock":
      return "Out of stock";
    case "pre_order":
      return "Pre-order";
    case "discontinued":
      return "Discontinued";
    default:
      return "";
  }
}

export default function FeaturedProductsSection({
  products,
}: FeaturedProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden bg-[#08060f] py-20 text-white sm:py-24">
      {/* Digital background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035] [background-image:repeating-linear-gradient(to_bottom,#fff_0,#fff_1px,transparent_1px,transparent_4px)]"
      />

      <div className="pointer-events-none absolute -right-40 top-0 -z-10 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-0 -z-10 h-[360px] w-[360px] rounded-full bg-cyan-400/5 blur-[120px]" />

      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        {/* Section heading */}
        <div className="mb-12 flex flex-col justify-between gap-7 border-b border-white/10 pb-8 sm:flex-row sm:items-end lg:mb-14">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-violet-400 to-cyan-300" />
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-violet-300">
                Our selection
              </p>
            </div>

            <h2 className="text-3xl font-black uppercase leading-tight tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
              Featured products
              <span className="text-violet-400">.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
              A selection of products worth exploring for your gaming setup.
            </p>
          </div>

          <Link
            href="/products"
            className="group hidden w-fit items-center gap-3 border-b border-violet-400/40 pb-2 text-sm font-semibold text-white/80 transition hover:border-cyan-300 hover:text-cyan-200 sm:inline-flex"
          >
            View all products
            <ArrowUpRight
              size={17}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
          {products.map((product, index) => {
            const price = getProductPrice(product);
            const image = product.images?.main?.url;
            const availability = getAvailabilityLabel(product.availability);

            return (
              <article key={product.id} className="group min-w-0">
                <Link href={`/products/${product.slug}`} className="block">
                  {/* Product image area */}
                  <div
                    className={`${CHAMFER} relative aspect-square overflow-hidden border border-white/10 bg-[#110d1c] transition duration-300 group-hover:border-violet-400/60`}
                  >
                    {/* Image surface texture */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:32px_32px]"
                    />

                    {/* Product image */}
                    {image && (
                      <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        className="relative z-10 h-full w-full object-contain p-5 transition duration-500 ease-out group-hover:scale-110 sm:p-7"
                      />
                    )}

                    {/* Image lighting */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.07] via-transparent to-cyan-400/[0.06] opacity-70 transition-opacity group-hover:opacity-100" />

                    {/* Product index */}
                    <span className="absolute left-3 top-3 z-20 font-mono text-[10px] tracking-widest text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* Availability */}
                    {availability && (
                      <span
                        className={`absolute right-3 top-3 z-20 border px-2 py-1 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${
                          product.availability === "in_stock"
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : product.availability === "pre_order"
                              ? "border-violet-400/30 bg-violet-400/10 text-violet-300"
                              : "border-white/10 bg-black/40 text-white/55"
                        }`}
                      >
                        {availability}
                      </span>
                    )}

                    {/* Bottom image accent */}
                    <div className="absolute inset-x-0 bottom-0 z-20 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Corner detail */}
                    <span className="absolute bottom-3 right-3 z-20 h-3 w-3 border-b border-r border-cyan-300/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>

                  {/* Product information */}
                  <div className="relative pt-4">
                    <h3 className="line-clamp-2 min-h-12 text-sm font-bold leading-6 text-white/90 transition-colors group-hover:text-violet-300 sm:text-base">
                      {product.name}
                    </h3>

                    {price && (
                      <p className="mt-2 text-sm font-bold tracking-wide text-white sm:text-base">
                        {price}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45 transition-colors group-hover:text-violet-300">
                        View product
                      </span>

                      <span className="flex h-7 w-7 items-center justify-center border border-white/10 text-white/55 transition duration-300 group-hover:border-violet-400/50 group-hover:bg-violet-500/15 group-hover:text-violet-300">
                        <ArrowUpRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {/* Mobile view all */}
        <div className="mt-12 border-t border-white/10 pt-6 sm:hidden">
          <Link
            href="/products"
            className="group inline-flex items-center gap-3 text-sm font-semibold text-violet-300 transition hover:text-cyan-200"
          >
            View all products
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
