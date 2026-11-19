import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { GeneralData, HomepageHero } from "./types";

interface HeroSectionProps {
  hero?: HomepageHero;
  general?: GeneralData | null;
}

const CHAMFER =
  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))]";

export default function HeroSection({ hero, general }: HeroSectionProps) {
  const imageUrl = hero?.image?.url;

  if (!hero || !imageUrl) return null;

  const hasCta = Boolean(hero.ctaText && hero.ctaLink);

  return (
    <section className="relative isolate min-h-[640px] overflow-hidden bg-[#08060f] text-white sm:min-h-[720px] lg:min-h-[900px]">
      {/* Key art */}
      <img
        src={imageUrl}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 -z-40 h-full w-full object-cover object-center saturate-[1.15] contrast-[1.05]"
      />

      {/* Depth: vignette + floor fade + left read-zone */}
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(ellipse_at_70%_30%,transparent_0%,#08060f_95%)] opacity-80" />
      <div className="absolute inset-0 -z-30 bg-gradient-to-t from-[#08060f] via-[#08060f]/50 to-transparent" />
      <div className="absolute inset-0 -z-30 bg-gradient-to-r from-[#08060f] via-[#08060f]/55 to-transparent lg:via-[#08060f]/30" />

      {/* Colour grade: violet from below, cold cyan from top right */}
      <div className="absolute -bottom-40 -left-24 -z-20 h-[480px] w-[620px] rounded-full bg-violet-600/30 blur-[120px]" />
      <div className="absolute -right-32 -top-32 -z-20 h-[420px] w-[420px] rounded-full bg-cyan-400/15 blur-[120px]" />

      {/* Scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay [background-image:repeating-linear-gradient(to_bottom,#fff_0,#fff_1px,transparent_1px,transparent_3px)]"
      />

      {/* HUD frame corners */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 sm:inset-6 lg:inset-8"
      >
        <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-violet-400/70" />
        <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-cyan-300/50" />
        <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-violet-400/70" />
        <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-cyan-300/50" />
      </div>

      <div className="mx-auto flex min-h-[640px] max-w-[1600px] flex-col justify-end px-8 pb-24 pt-36 sm:min-h-[720px] sm:px-14 sm:pb-28 lg:min-h-[800px] lg:px-20 lg:pb-32">
        {general?.businessName && (
          <div className="mb-8 inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-5 text-sm font-medium text-white/90 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-300" />
            </span>
            {general.businessName}
          </div>
        )}

        {hero.heading && (
          <h1 className="max-w-4xl bg-gradient-to-b from-white via-white to-violet-200/70 bg-clip-text text-5xl font-black leading-[0.95] tracking-tighter text-transparent drop-shadow-[0_0_40px_rgba(139,92,246,0.35)] sm:text-7xl lg:text-8xl">
            {hero.heading}
          </h1>
        )}

        {hero.subheading && (
          <p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            {hero.subheading}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
          {hasCta && (
            <Link href={hero.ctaLink!} className="group relative inline-flex">
              {/* Glow */}
              <span className="absolute inset-0 -z-10 bg-violet-500/60 blur-xl transition-opacity duration-300 group-hover:opacity-100 sm:opacity-70" />
              {/* Border layer */}
              <span
                className={`${CHAMFER} bg-gradient-to-br from-violet-300 via-violet-500 to-cyan-300 p-px`}
              >
                <span
                  className={`${CHAMFER} flex min-h-14 items-center gap-4 bg-gradient-to-br from-violet-600 to-violet-800 px-8 text-base font-bold tracking-wide transition-colors duration-300 group-hover:from-violet-500 group-hover:to-violet-700 group-focus-visible:from-violet-500`}
                >
                  {hero.ctaText}
                  <ArrowUpRight
                    size={20}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1"
                  />
                </span>
              </span>
            </Link>
          )}

          <Link
            href="/categories"
            className="group inline-flex items-center gap-2 border-b border-white/20 pb-1 text-sm font-semibold text-white/80 transition-colors hover:border-violet-300 hover:text-violet-200"
          >
            Browse categories
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>

      {/* Tagline rail */}
      {general?.tagline && (
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#08060f]/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-8 py-4 sm:px-14 lg:px-20">
            <span className="h-px w-10 bg-gradient-to-r from-violet-400 to-transparent" />
            <p className="truncate text-sm text-white/60">{general.tagline}</p>
          </div>
        </div>
      )}

      {/* Edge light */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
    </section>
  );
}
