import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Radio,
} from "lucide-react";

import type { PublicContact } from "./types";

interface ContactSectionProps {
  contact: PublicContact;
}

export default function ContactSection({ contact }: ContactSectionProps) {
  const phone = contact.phone?.trim();
  const email = contact.email?.trim();
  const address = contact.address?.trim();
  const location = contact.location?.trim();
  const whatsapp = contact.whatsappNumber?.replace(/\D/g, "");

  const hasContactDetails = phone || email || address || location || whatsapp;

  if (!hasContactDetails) return null;

  const contactItems = [
    {
      label: "Call us",
      value: phone,
      href: phone ? `tel:${phone.replace(/\s/g, "")}` : undefined,
      icon: Phone,
    },
    {
      label: "Email us",
      value: email,
      href: email ? `mailto:${email}` : undefined,
      icon: Mail,
    },
    {
      label: "Visit us",
      value: [address, location].filter(Boolean).join(", "),
      href: undefined,
      icon: MapPin,
    },
  ].filter((item) => item.value);

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
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          {/* Contact information */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-violet-500 to-cyan-400" />

              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-300">
                Get in touch
              </p>

              <Radio size={14} className="text-cyan-300" />
            </div>

            <h2 className="max-w-2xl text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Need assistance?
              <span className="mt-2 block bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Let's talk.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-white/55 sm:text-base">
              Need help choosing the right gaming accessories? Get in touch with
              our team and we'll be happy to assist.
            </p>

            {/* Contact methods */}
            <div className="mt-10 space-y-3">
              {contactItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="group flex items-start gap-4 border border-white/10 bg-[#110d1c]/70 p-4 transition duration-300 hover:border-violet-400/40 hover:bg-[#171020]"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center border border-violet-400/20 bg-violet-500/10 text-violet-300 transition group-hover:border-cyan-400/30 group-hover:text-cyan-300">
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                        {item.label}
                      </p>

                      {item.href ? (
                        <a
                          href={item.href}
                          className="mt-1 block break-words text-sm font-semibold text-white transition-colors hover:text-cyan-300 sm:text-base"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-1 break-words text-sm font-semibold text-white sm:text-base">
                          {item.value}
                        </p>
                      )}
                    </div>

                    <span className="font-mono text-[9px] text-white/20">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* WhatsApp CTA */}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative mt-8 inline-flex items-center gap-3 overflow-hidden bg-gradient-to-r from-violet-700 to-violet-600 px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:from-violet-600 hover:to-violet-500"
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

          {/* Business hours panel */}
          <div className="relative self-start border border-violet-400/20 bg-[#110d1c] p-6 sm:p-8 lg:p-9">
            {/* Panel lighting */}
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 bg-violet-500/10 blur-[70px]" />

            <div className="relative flex items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Clock3 size={21} />
                </div>

                <div>
                  <h3 className="text-base font-black uppercase tracking-wide text-white sm:text-lg">
                    Business hours
                  </h3>

                  <p className="mt-1 text-xs text-white/40">
                    When you can reach us
                  </p>
                </div>
              </div>

              <span className="hidden border border-cyan-400/20 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-cyan-300 sm:block">
                Schedule
              </span>
            </div>

            {contact.businessHours?.length ? (
              <div className="relative mt-3 divide-y divide-white/[0.07]">
                {contact.businessHours.map((hours) => (
                  <div
                    key={hours.day}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <span className="text-sm font-medium text-white/65">
                      {hours.day}
                    </span>

                    <span
                      className={`text-right text-xs font-semibold sm:text-sm ${
                        hours.closed ? "text-white/30" : "text-cyan-300"
                      }`}
                    >
                      {hours.closed
                        ? "Closed"
                        : `${hours.openingTime} – ${hours.closingTime}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="relative mt-6 text-sm leading-7 text-white/45">
                Please contact us for our current business hours.
              </p>
            )}

            <div className="relative mt-5 border-t border-white/10 pt-6">
              <p className="text-sm leading-7 text-white/50">
                We look forward to helping you find the right accessories for
                your gaming setup.
              </p>

              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-300 transition hover:text-cyan-300"
              >
                More contact information
                <ArrowUpRight size={15} />
              </Link>
            </div>

            {/* HUD corner details */}
            <div className="absolute bottom-0 right-0 h-6 w-6 border-b border-r border-violet-400/50" />
            <div className="absolute left-0 top-0 h-6 w-6 border-l border-t border-cyan-400/50" />
          </div>
        </div>

        <div className="mt-14 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>
    </section>
  );
}
