import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";

import type { PublicPromotion } from "./types";

interface PromotionSectionProps {
  promotions: PublicPromotion[];
}

function getPromotionLabel(type: PublicPromotion["type"]): string {
  switch (type) {
    case "banner":
      return "Featured";
    case "offer":
      return "Special offer";
    case "campaign":
      return "Campaign";
    default:
      return "Promotion";
  }
}

export default function PromotionSection({
  promotions,
}: PromotionSectionProps) {
  if (promotions.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden border-y border-violet-500/20 bg-[#08060f] py-20 text-white sm:py-24">
      {/* Ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-violet-700/15 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

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
        {/* Section heading */}
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-violet-500 to-cyan-400" />

              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-300">
                Don't miss out
              </p>

              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
              Offers{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                & highlights
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
              Explore our latest offers, campaigns and featured collections.
            </p>
          </div>

          <div className="hidden items-center gap-2 border border-violet-400/20 bg-violet-500/5 px-4 py-3 sm:flex">
            <Zap size={15} className="text-cyan-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
              Exclusive promotions
            </span>
          </div>
        </div>

        {/* Promotions */}
        <div className="grid gap-5 lg:grid-cols-2">
          {promotions.map((promotion, index) => (
            <article
              key={promotion.id}
              className="group relative isolate grid min-h-[300px] overflow-hidden border border-white/10 bg-[#100b1b] transition duration-500 hover:border-violet-400/50 sm:grid-cols-[0.85fr_1.15fr]"
            >
              {/* Image */}
              <div className="relative min-h-56 overflow-hidden sm:min-h-full">
                {promotion.image?.url && (
                  <img
                    src={promotion.image.url}
                    alt={promotion.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#08060f]/80 via-[#08060f]/10 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-[#100b1b]" />

                <div className="absolute inset-0 bg-violet-950/10 mix-blend-color" />

                {/* Campaign index */}
                <div className="absolute left-4 top-4 border border-white/20 bg-[#08060f]/70 px-3 py-1.5 backdrop-blur-sm">
                  <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-white/80">
                    CAMPAIGN / {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Image corner detail */}
                <div className="absolute bottom-4 left-4 h-5 w-5 border-b border-l border-cyan-400/70" />
              </div>

              {/* Promotion details */}
              <div className="relative flex flex-col items-start justify-center p-6 sm:p-8 lg:p-10">
                <div className="absolute right-0 top-0 h-20 w-20 bg-violet-500/10 blur-2xl transition group-hover:bg-violet-400/20" />

                <div className="relative flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-violet-200">
                    <Zap size={11} />
                    {getPromotionLabel(promotion.type)}
                  </span>

                  {promotion.type === "offer" && (
                    <span className="h-px w-8 bg-cyan-400/70" />
                  )}
                </div>

                <h3 className="relative mt-5 text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
                  {promotion.title}
                </h3>

                {promotion.description && (
                  <p className="relative mt-3 line-clamp-4 text-sm leading-7 text-white/55">
                    {promotion.description}
                  </p>
                )}

                {promotion.ctaLink && (
                  <Link
                    href={promotion.ctaLink}
                    className="group/cta relative mt-7 inline-flex items-center gap-3 bg-gradient-to-r from-violet-700 to-violet-600 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:from-violet-600 hover:to-violet-500"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)",
                    }}
                  >
                    {promotion.ctaText || "Explore"}
                    <ArrowUpRight
                      size={15}
                      className="transition-transform group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
                    />
                  </Link>
                )}

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500 group-hover:w-full" />

                <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-violet-400/40" />
              </div>
            </article>
          ))}
        </div>

        {/* Bottom edge light */}
        <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>
    </section>
  );
}
