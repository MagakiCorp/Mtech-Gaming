import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Product } from "@/types/product";

export type PublicCategoryProduct = Omit<Product, "createdAt" | "updatedAt"> & {
  id: string;
};

interface CategoryProductsSectionProps {
  products: PublicCategoryProduct[];
}

function formatPrice(product: PublicCategoryProduct): string {
  const pricing = product.pricing;

  if (!pricing || pricing.type === "on_request") {
    return "Price on request";
  }

  const formatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: pricing.currency || "KES",
    maximumFractionDigits: 0,
  });

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

const CHAMFER =
  "[clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,16px_100%,0_calc(100%-16px))]";

export default function CategoryProductsSection({
  products,
}: CategoryProductsSectionProps) {
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
        className="pointer-events-none absolute -right-40 top-20 -z-10 h-96 w-96 rounded-full bg-violet-700/[0.08] blur-[130px]"
      />

      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {/* Section heading */}
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-violet-400 to-cyan-400" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">
                Explore this collection
              </span>
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Products in this{" "}
              <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                category
              </span>
            </h2>

            <p className="mt-3 text-sm text-white/45">
              Explore the available products in this collection.
            </p>
          </div>

          <p className="shrink-0 font-mono text-xs font-semibold uppercase tracking-wider text-white/45">
            <span className="text-white">{products.length}</span>{" "}
            {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Product grid */}
        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group min-w-0"
              >
                {/* Product image */}
                <div
                  className={`relative aspect-[4/4.2] overflow-hidden border border-white/[0.08] bg-[#110d1c] transition duration-500 group-hover:border-violet-400/40 ${CHAMFER}`}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10 opacity-[0.07]"
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
                      className="object-contain p-5 transition-transform duration-700 group-hover:scale-105"
                    />
                  )}

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-violet-950/30 via-transparent to-transparent"
                  />

                  <span className="absolute left-4 top-4 z-20 font-mono text-[10px] tracking-widest text-white/35">
                    ITEM / {String(index + 1).padStart(2, "0")}
                  </span>

                  {product.featured && (
                    <span className="absolute right-4 top-4 z-20 border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-violet-200">
                      Featured
                    </span>
                  )}

                  <div className="absolute bottom-4 right-4 z-20 flex size-10 items-center justify-center border border-white/15 bg-[#08060f]/85 text-white transition duration-300 group-hover:border-violet-400 group-hover:bg-violet-600">
                    <ArrowUpRight
                      size={18}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </div>

                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 z-20 h-5 w-5 border-b border-l border-cyan-400/40"
                  />
                </div>

                {/* Product information */}
                <div className="pt-5">
                  {product.brand && (
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/70">
                      {product.brand}
                    </span>
                  )}

                  <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-white transition-colors group-hover:text-violet-300">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/40">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                    <p className="text-sm font-bold text-white">
                      {formatPrice(product)}
                    </p>

                    <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-white/30 transition-colors group-hover:text-cyan-300">
                      View product
                    </span>
                  </div>

                  <div className="mt-3 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500 group-hover:w-full" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h3 className="text-lg font-bold text-white">
              No products available yet
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Products in this category will appear here when available.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex items-center text-xs font-bold uppercase tracking-wider text-violet-300 transition hover:text-cyan-300"
            >
              Explore all products
              <ArrowUpRight size={16} className="ml-2" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
