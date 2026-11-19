import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import type { ContactSettings } from "@/types/settings";

type PublicContactSettings = Pick<
  ContactSettings,
  | "phone"
  | "whatsappNumber"
  | "email"
  | "address"
  | "location"
  | "businessHours"
  | "socialLinks"
>;

interface ContactContentProps {
  settings: PublicContactSettings;
}

function getDigits(value: string) {
  return value.replace(/\D/g, "");
}

function getWhatsAppUrl(number: string) {
  const digits = getDigits(number);

  if (!digits) return null;

  return `https://wa.me/${digits}`;
}

function getMapUrl(address: string, location: string) {
  const query = [address, location].filter(Boolean).join(", ");

  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function ContactContent({ settings }: ContactContentProps) {
  const whatsappUrl = getWhatsAppUrl(settings.whatsappNumber);
  const mapUrl = getMapUrl(settings.address, settings.location);

  const socialLinks = [
    { label: "Facebook", url: settings.socialLinks?.facebook },
    { label: "Instagram", url: settings.socialLinks?.instagram },
    { label: "TikTok", url: settings.socialLinks?.tiktok },
    { label: "YouTube", url: settings.socialLinks?.youtube },
  ].filter((item) => item.url?.trim());

  const hasBusinessHours = settings.businessHours?.some((item) =>
    item.day?.trim(),
  );

  return (
    <main className="relative isolate overflow-hidden bg-[#08060f] text-white">
      {/* Global background effects */}
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
        className="pointer-events-none absolute -right-40 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-violet-700/[0.12] blur-[150px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-[45%] -z-10 h-[450px] w-[450px] rounded-full bg-cyan-500/[0.06] blur-[150px]"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-28 lg:px-12 lg:pb-24">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-9 bg-gradient-to-r from-violet-400 to-cyan-400" />

              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-violet-300">
                Contact us
              </span>
            </div>

            <h1 className="text-4xl font-black uppercase leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Let&apos;s find the
              <span className="block bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                right gear for you.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
              Have a question about a product, pricing, or availability? Get in
              touch and we&apos;ll be happy to help.
            </p>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-9 inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(124,58,237,0.18)] transition hover:from-violet-500 hover:to-violet-600"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)",
                }}
              >
                <MessageCircle size={18} />
                Chat with us on WhatsApp
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            )}
          </div>
        </div>

        {/* HUD details */}
        <div
          aria-hidden="true"
          className="absolute right-6 top-6 hidden h-8 w-8 border-r border-t border-violet-400/40 sm:block lg:right-12 lg:top-10"
        />

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-violet-500/70 to-transparent"
        />
      </section>

      {/* Contact information */}
      <section className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.8fr] lg:gap-20 lg:px-12">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-7 bg-cyan-400" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
              Get in touch
            </p>
          </div>

          <h2 className="max-w-lg text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            We&apos;re here to help with your next setup.
          </h2>

          <p className="mt-5 max-w-lg text-sm leading-7 text-white/45 sm:text-base">
            Reach out through whichever channel works best for you. Whether
            you&apos;re comparing accessories or checking product availability,
            we&apos;ll help you get the information you need.
          </p>

          {/* Contact channels */}
          <div className="mt-10 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {settings.phone && (
              <a
                href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
                className="group flex items-center justify-between gap-5 py-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center border border-violet-400/20 bg-violet-500/10 text-violet-300 transition group-hover:border-violet-400/50 group-hover:bg-violet-500/20">
                    <Phone size={19} />
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                      Call us
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white transition group-hover:text-violet-300">
                      {settings.phone}
                    </p>
                  </div>
                </div>

                <ArrowUpRight
                  size={18}
                  className="shrink-0 text-white/25 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-300"
                />
              </a>
            )}

            {settings.whatsappNumber && whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-5 py-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center border border-violet-400/20 bg-violet-500/10 text-violet-300 transition group-hover:border-violet-400/50 group-hover:bg-violet-500/20">
                    <MessageCircle size={19} />
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                      WhatsApp
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white transition group-hover:text-violet-300">
                      {settings.whatsappNumber}
                    </p>
                  </div>
                </div>

                <ArrowUpRight
                  size={18}
                  className="shrink-0 text-white/25 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-300"
                />
              </a>
            )}

            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="group flex items-center justify-between gap-5 py-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center border border-violet-400/20 bg-violet-500/10 text-violet-300 transition group-hover:border-violet-400/50 group-hover:bg-violet-500/20">
                    <Mail size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                      Email
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-white transition group-hover:text-violet-300">
                      {settings.email}
                    </p>
                  </div>
                </div>

                <ArrowUpRight
                  size={18}
                  className="shrink-0 text-white/25 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-300"
                />
              </a>
            )}

            {(settings.address || settings.location) && (
              <div className="flex items-start justify-between gap-5 py-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center border border-violet-400/20 bg-violet-500/10 text-violet-300">
                    <MapPin size={19} />
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                      Visit us
                    </p>

                    {settings.address && (
                      <p className="mt-1 text-sm font-semibold text-white">
                        {settings.address}
                      </p>
                    )}

                    {settings.location && (
                      <p className="mt-1 text-sm text-white/45">
                        {settings.location}
                      </p>
                    )}

                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-violet-300 transition hover:text-cyan-300"
                      >
                        Get directions
                        <ArrowUpRight size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="mt-9">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Follow us
              </p>

              <div className="mt-4 flex flex-wrap gap-x-7 gap-y-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-white/55 transition hover:text-violet-300"
                  >
                    {social.label}
                    <ArrowUpRight size={13} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Business hours */}
        <aside className="relative h-fit overflow-hidden border border-white/10 bg-[#110d1c] p-7 sm:p-9">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-20 w-20 bg-violet-500/[0.07] blur-2xl"
          />

          <div className="relative flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center border border-violet-400/25 bg-violet-500/10 text-violet-300">
              <Clock3 size={21} />
            </div>

            <div>
              <p className="text-lg font-bold text-white">Business hours</p>
              <p className="mt-0.5 text-xs text-white/40">
                When you can reach us
              </p>
            </div>
          </div>

          {hasBusinessHours ? (
            <div className="relative mt-8 divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {settings.businessHours.map((item, index) => (
                <div
                  key={`${item.day}-${index}`}
                  className="flex items-center justify-between gap-4 py-4 text-sm"
                >
                  <span className="font-medium text-white/75">{item.day}</span>

                  <span
                    className={`text-right text-xs font-medium ${
                      item.closed ? "text-red-300/70" : "text-cyan-300/80"
                    }`}
                  >
                    {item.closed
                      ? "Closed"
                      : `${item.openingTime} – ${item.closingTime}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm leading-7 text-white/45">
              Please contact us directly to confirm our current business hours.
            </p>
          )}

          <div className="relative mt-8 border-t border-white/[0.08] pt-7">
            <p className="text-sm leading-7 text-white/45">
              Need help outside business hours? Send us a message and we&apos;ll
              get back to you as soon as we can.
            </p>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300 transition hover:text-cyan-300"
              >
                Send a message
                <ArrowUpRight
                  size={15}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            )}
          </div>

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-px w-1/2 bg-gradient-to-r from-violet-500/70 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-5 w-5 border-r border-t border-violet-400/40"
          />
        </aside>
      </section>

      {/* Product enquiry CTA */}
      <section className="relative isolate overflow-hidden border-t border-white/10 bg-[#100b1b] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_50%,rgba(124,58,237,0.18),transparent_55%)]"
        />

        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-14 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-7 bg-cyan-400" />
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                Ready to explore?
              </p>
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Your next gaming upgrade starts here.
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/50 sm:text-base">
              Browse our range of accessories and contact us when you find
              something you&apos;re interested in.
            </p>
          </div>

          <Link
            href="/products"
            className="group inline-flex w-fit shrink-0 items-center gap-3 bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4 text-sm font-bold text-white transition hover:from-violet-500 hover:to-violet-600"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)",
            }}
          >
            Explore products
            <ArrowUpRight
              size={17}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-violet-500/60 via-cyan-400/30 to-transparent" />
      </section>
    </main>
  );
}
