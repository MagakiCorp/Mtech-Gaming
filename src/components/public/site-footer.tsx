"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Phone, Mail, MessageCircle } from "lucide-react";

import { getSettings } from "@/lib/services/settings";

import type { ContactSettings, GeneralSettings } from "@/types";

export default function SiteFooter() {
  const [general, setGeneral] = useState<GeneralSettings | null>(null);
  const [contact, setContact] = useState<ContactSettings | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const [generalSettings, contactSettings] = await Promise.all([
          getSettings("general"),
          getSettings("contact"),
        ]);

        if (mounted) {
          setGeneral(generalSettings);
          setContact(contactSettings);
        }
      } catch (error) {
        console.error("Failed to load footer settings:", error);
      }
    }

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const businessName = general?.businessName?.trim() || "";
  const tagline = general?.tagline?.trim() || "";

  const whatsappNumber = contact?.whatsappNumber?.replace(/\D/g, "");
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  const socialLinks: { label: string; href: string }[] = [
    { label: "Instagram", href: contact?.socialLinks?.instagram || "" },
    { label: "Facebook", href: contact?.socialLinks?.facebook || "" },
    { label: "TikTok", href: contact?.socialLinks?.tiktok || "" },
    { label: "YouTube", href: contact?.socialLinks?.youtube || "" },
  ].filter((item) => Boolean(item.href.trim()));

  const exploreLinks = [
    ["Home", "/"],
    ["Products", "/products"],
    ["Categories", "/categories"],
    ["Contact", "/contact"],
  ];

  return (
    <footer className="relative isolate overflow-hidden border-t border-violet-500/20 bg-[#08060f] text-white">
      {/* Ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 -z-10 h-80 w-80 rounded-full bg-violet-700/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 -z-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]"
      />

      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(167,139,250,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.7) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top accent */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/70 to-cyan-400/60"
      />

      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_1fr_1fr] lg:gap-10">
          {/* Brand */}
          <div className="max-w-sm">
            {(general?.logo?.url || businessName) && (
              <Link
                href="/"
                className="inline-flex items-center gap-3"
                aria-label={businessName ? `${businessName} home` : "Home"}
              >
                {general?.logo?.url ? (
                  <div className="relative h-40 w-40 shrink-0">
                    <Image
                      src={general.logo.url}
                      alt={businessName ? `${businessName} logo` : "Logo"}
                      fill
                      sizes="40px"
                      className="object-contain loading-[eager]"
                    />
                  </div>
                ) : (
                  <span className="text-lg font-black uppercase tracking-[0.16em] text-white">
                    {businessName}
                  </span>
                )}
              </Link>
            )}

            {tagline && (
              <p className="mt-5 max-w-xs text-sm leading-7 text-white/50">
                {tagline}
              </p>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 transition hover:text-cyan-300"
              >
                <MessageCircle size={16} />
                Chat with us
                <ArrowUpRight size={15} />
              </a>
            )}
          </div>

          {/* Explore */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
              <span className="h-1.5 w-1.5 bg-violet-400" />
              Explore
            </h3>

            <ul className="mt-6 space-y-4">
              {exploreLinks.map(([label, href], index) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-violet-300"
                  >
                    <span className="font-mono text-[10px] text-violet-500/60">
                      0{index + 1}
                    </span>
                    {label}
                    <ArrowUpRight
                      size={13}
                      className="opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          {(contact?.phone || contact?.email || contact?.address) && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                <span className="h-1.5 w-1.5 bg-cyan-400" />
                Get in touch
              </h3>

              <ul className="mt-6 space-y-5">
                {contact.phone && (
                  <li className="flex items-start gap-3">
                    <Phone
                      size={16}
                      className="mt-0.5 shrink-0 text-violet-400"
                    />
                    <a
                      href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                      className="text-sm text-white/50 transition hover:text-cyan-300"
                    >
                      {contact.phone}
                    </a>
                  </li>
                )}

                {contact.email && (
                  <li className="flex items-start gap-3">
                    <Mail
                      size={16}
                      className="mt-0.5 shrink-0 text-violet-400"
                    />
                    <a
                      href={`mailto:${contact.email}`}
                      className="break-all text-sm text-white/50 transition hover:text-cyan-300"
                    >
                      {contact.email}
                    </a>
                  </li>
                )}

                {contact.address && (
                  <li className="flex items-start gap-3">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-violet-400"
                    />
                    <span className="text-sm leading-6 text-white/50">
                      {contact.address}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Social */}
          {socialLinks.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                <span className="h-1.5 w-1.5 bg-violet-400" />
                Follow us
              </h3>

              <div className="mt-6 flex flex-wrap gap-2">
                {socialLinks.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group inline-flex items-center gap-2 border border-white/10 bg-white/[0.025] px-3 py-2.5 text-xs font-medium text-white/55 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
                  >
                    {label}
                    <ArrowUpRight
                      size={12}
                      className="text-violet-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {businessName && (
            <p className="text-xs text-white/35">
              © {new Date().getFullYear()} {businessName}. All rights reserved.
            </p>
          )}

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse bg-cyan-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
              System online
            </span>
          </div>
        </div>
      </div>

      {/* Bottom edge light */}
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"
      />
    </footer>
  );
}
