"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";

import { getSettings } from "@/lib/services/settings";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [businessName, setBusinessName] = useState("M Tech");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadBusinessSettings() {
      try {
        const settings = await getSettings("general");

        if (mounted && settings) {
          setBusinessName(settings.businessName || "M Tech");
          setLogoUrl(settings.logo?.url || null);
        }
      } catch (error) {
        console.error("Failed to load business settings:", error);
      }
    }

    void loadBusinessSettings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#32174d] bg-[#32174d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[100px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* Brand */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label={`${businessName} home`}
        >
          {logoUrl ? (
            <div className="relative h-40 w-40 shrink-0">
              <Image
                src={logoUrl}
                alt={`${businessName} logo`}
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#171717] text-sm font-bold tracking-tight text-white transition group-hover:bg-purple-700">
              MT
            </span>
          )}
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 lg:flex"
        >
          {navigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-2 text-[20px] font-medium transition-colors ${
                  active
                    ? "text-white font-extrabold"
                    : "text-[#ffffff] hover:text-[#171717]"
                }`}
              >
                {item.label}

                {active && (
                  <span className="absolute -bottom-[1px] left-0 h-[2px] w-full rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
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

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((previous) => !previous)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e9e9e5] text-[#171717] transition hover:bg-[#f5f5f2] lg:hidden"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-[#e9e9e5] bg-white px-5 py-5 lg:hidden"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-[1440px] flex-col"
          >
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`border-b border-[#f0f0ed] py-3.5 text-sm font-medium transition-colors ${
                    active
                      ? "text-purple-700"
                      : "text-[#555] hover:text-[#171717]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/products"
              className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-[#171717] px-5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Explore products
              <ArrowUpRight size={16} />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
