import { Quote, Star } from "lucide-react";

import type { PublicTestimonial } from "./types";

interface TestimonialsSectionProps {
  testimonials: PublicTestimonial[];
}

export default function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  if (testimonials.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden border-y border-violet-500/20 bg-[#08060f] py-20 text-white sm:py-24">
      {/* Background atmosphere */}
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
        {/* Heading */}
        <div className="mb-12 max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-violet-500 to-cyan-400" />

            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-300">
              Customer experiences
            </p>

            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </div>

          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
            Real people.{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              Real feedback.
            </span>
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
            Hear from customers who have experienced our products and service.
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => {
            const rating = Math.min(
              5,
              Math.max(0, Math.floor(testimonial.rating || 0)),
            );

            return (
              <article
                key={testimonial.id}
                className="group relative flex h-full min-w-0 flex-col overflow-hidden border border-white/10 bg-[#110d1c] p-6 transition duration-500 hover:border-violet-400/40 sm:p-7"
              >
                {/* Ambient card glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-[60px] transition duration-500 group-hover:bg-violet-500/20" />

                {/* Card index */}
                <div className="relative flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/30">
                    FEEDBACK / {String(index + 1).padStart(2, "0")}
                  </span>

                  <Quote
                    size={27}
                    strokeWidth={1.5}
                    className="text-violet-400/60 transition duration-500 group-hover:text-cyan-300"
                  />
                </div>

                {/* Rating */}
                <div
                  className="relative mt-7 flex items-center gap-1"
                  aria-label={`${rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }, (_, starIndex) => (
                    <Star
                      key={starIndex}
                      size={14}
                      strokeWidth={1.5}
                      className={
                        starIndex < rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-white/15"
                      }
                    />
                  ))}
                </div>

                {/* Customer feedback */}
                <blockquote className="relative mt-5 flex-1 text-sm leading-7 text-white/75">
                  “{testimonial.message}”
                </blockquote>

                {/* Customer identity */}
                <div className="relative mt-8 flex items-center gap-3 border-t border-white/10 pt-5">
                  {testimonial.image?.url && (
                    <img
                      src={testimonial.image.url}
                      alt={testimonial.customerName}
                      loading="lazy"
                      className="h-11 w-11 shrink-0 border border-violet-400/30 object-cover"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white transition group-hover:text-violet-300">
                      {testimonial.customerName}
                    </p>

                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
                      Customer feedback
                    </p>
                  </div>

                  <div className="ml-auto h-5 w-5 shrink-0 border-b border-r border-violet-400/40" />
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500 group-hover:w-full" />
              </article>
            );
          })}
        </div>

        <div className="mt-12 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>
    </section>
  );
}
