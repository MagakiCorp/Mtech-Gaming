import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  MessageCircle,
  Cpu,
} from "lucide-react";

import ProductImageGallery from "@/components/public/products/product-image-gallery";

import type { Product } from "@/types/product";

export type PublicProductDetail = Omit<Product, "createdAt" | "updatedAt"> & {
  id: string;
};

interface ProductDetailsProps {
  product: PublicProductDetail;
  categoryName: string;
  whatsappNumber: string | null;
}

function formatPrice(pricing: Product["pricing"]): string {
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

function getAvailability(availability: Product["availability"]) {
  const labels = {
    in_stock: {
      text: "In stock",
      style: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      dot: "bg-emerald-400",
      description: "This product is currently available.",
    },
    out_of_stock: {
      text: "Out of stock",
      style: "border-white/10 bg-white/5 text-white/50",
      dot: "bg-white/35",
      description: "This product is currently unavailable.",
    },
    pre_order: {
      text: "Available for pre-order",
      style: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      dot: "bg-amber-400",
      description: "Contact us to enquire about pre-ordering.",
    },
    discontinued: {
      text: "Discontinued",
      style: "border-red-400/20 bg-red-400/10 text-red-300",
      dot: "bg-red-400",
      description: "This product is no longer available.",
    },
  };

  return labels[availability] ?? labels.out_of_stock;
}

export default function ProductDetails({
  product,
  categoryName,
  whatsappNumber,
}: ProductDetailsProps) {
  const availability = getAvailability(product.availability);

  const message = encodeURIComponent(
    `Hello M Tech, I'm interested in ${product.name}. Please share more information about this product.`,
  );

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${message}`
    : null;

  return (
    <div className="relative isolate overflow-hidden bg-[#08060f] text-white">
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
        className="pointer-events-none absolute -left-48 top-40 -z-10 h-[500px] w-[500px] rounded-full bg-violet-700/10 blur-[150px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 top-[30%] -z-10 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.06] blur-[150px]"
      />

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
        {/* Breadcrumb */}
        <Link
          href="/products"
          className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40 transition hover:text-violet-300"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          Back to products
        </Link>

        {/* Main product area */}
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 xl:gap-20">
          {/* Gallery */}
          <div className="min-w-0">
            <div className="relative border border-white/[0.08] bg-[#110d1c] p-2 sm:p-3">
              <div className="absolute left-0 top-0 h-8 w-8 border-l border-t border-violet-400/60" />
              <div className="absolute right-0 top-0 h-8 w-8 border-r border-t border-cyan-400/40" />
              <div className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-violet-400/40" />
              <div className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-cyan-400/60" />

              <div className="relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(167,139,250,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.6) 1px, transparent 1px)",
                    backgroundSize: "36px 36px",
                  }}
                />

                <ProductImageGallery
                  name={product.name}
                  images={product.images}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
              <span>Product showcase</span>
              <span className="text-violet-300/60">M TECH / PRODUCT VIEW</span>
            </div>
          </div>

          {/* Product information */}
          <div className="flex min-w-0 flex-col">
            {/* Category and brand */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">
                {categoryName}
              </span>

              {product.brand && (
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  {product.brand}
                </span>
              )}
            </div>

            <h1 className="mt-6 text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl xl:text-[2.8rem]">
              {product.name}
            </h1>

            {/* Product status */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${availability.style}`}
              >
                <span className={`size-1.5 rounded-full ${availability.dot}`} />
                {availability.text}
              </span>

              {product.featured && (
                <span className="border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Featured product
                </span>
              )}
            </div>

            {/* Price */}
            <div className="relative mt-8 border-y border-white/10 py-7">
              <div className="absolute left-0 top-0 h-px w-24 bg-gradient-to-r from-violet-500 to-cyan-400" />

              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                Price
              </p>

              <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {formatPrice(product.pricing)}
              </p>

              <p className="mt-3 flex items-center gap-2 text-xs text-white/40">
                <span className={`size-1.5 rounded-full ${availability.dot}`} />
                {availability.description}
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-8">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
                  <span className="h-1.5 w-1.5 bg-violet-400" />
                  Product description
                </h2>

                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/50">
                  {product.description}
                </p>
              </div>
            )}

            {/* WhatsApp enquiry */}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative mt-9 inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden bg-gradient-to-r from-violet-700 to-violet-600 px-6 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:from-violet-600 hover:to-violet-500"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
                }}
              >
                <MessageCircle size={19} />
                Enquire on WhatsApp
                <ArrowUpRight
                  size={17}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
                <span className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full bg-cyan-300/70" />
              </a>
            ) : (
              <p className="mt-9 border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white/45">
                WhatsApp enquiries are currently unavailable. Please use our{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-violet-300 transition hover:text-cyan-300"
                >
                  contact page
                </Link>{" "}
                to reach us.
              </p>
            )}

            <div className="mt-5 flex items-start gap-3 border-l-2 border-emerald-400/40 pl-4 text-xs leading-6 text-white/40">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-emerald-400"
              />
              <p>Contact our team for product information and availability.</p>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications?.length > 0 && (
          <section className="mt-20 border-t border-white/10 pt-12 sm:mt-28">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px w-8 bg-gradient-to-r from-violet-400 to-cyan-400" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                    Product information
                  </span>
                </div>

                <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Technical{" "}
                  <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                    specifications
                  </span>
                </h2>

                <p className="mt-3 text-sm text-white/40">
                  Technical details and product features.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-white/30">
                <Cpu size={15} className="text-cyan-400" />
                {product.specifications.length} specifications
              </div>
            </div>

            <div className="mt-8 max-w-5xl border-y border-white/10">
              {product.specifications.map((specification, index) => (
                <div
                  key={`${specification.name}-${index}`}
                  className="group grid grid-cols-1 gap-2 border-b border-white/[0.07] px-4 py-5 transition last:border-b-0 hover:bg-violet-500/[0.04] sm:grid-cols-[260px_1fr] sm:gap-8 sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-violet-400/50">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40 transition group-hover:text-violet-300">
                      {specification.name}
                    </p>
                  </div>

                  <p className="text-sm font-medium text-white/80">
                    {specification.value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
    </div>
  );
}
