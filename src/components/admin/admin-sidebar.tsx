"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  Megaphone,
  MessageSquare,
  Settings,
  Menu,
  X,
  Monitor,
  ChevronRight,
  House,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Homepage",
    href: "/admin/homepage",
    icon: House,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    label: "Promotions",
    href: "/admin/promotions",
    icon: Megaphone,
  },
  {
    label: "Testimonials",
    href: "/admin/testimonials",
    icon: MessageSquare,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <>
      <div className="border-b border-zinc-200 bg-white px-5 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-purple-700"
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          <span>Navigation</span>
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-zinc-100 px-6">
          <div>
            <p className="text-lg font-black tracking-[0.22em] text-zinc-900">
              M TECH
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-600">
              Store management
            </p>
          </div>

          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 px-4 py-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`group flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-purple-50 text-purple-700"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.3 : 1.8}
                      className={
                        isActive
                          ? "text-purple-600"
                          : "text-zinc-400 group-hover:text-zinc-700"
                      }
                    />
                    {item.label}
                  </span>

                  {isActive && (
                    <ChevronRight size={15} className="text-purple-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-zinc-100 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Monitor size={17} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-800">
                M Tech Store
              </p>
              <p className="text-[11px] text-zinc-500">Administration panel</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
