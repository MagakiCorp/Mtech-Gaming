import Link from "next/link";
import { Building2, ChevronRight, Globe, Search } from "lucide-react";

const settingsSections = [
  {
    title: "General settings",
    description:
      "Manage your business identity, website branding and default currency.",
    href: "/admin/settings/general",
    icon: Building2,
  },
  {
    title: "Contact information",
    description:
      "Manage contact details, business hours, location and social media links.",
    href: "/admin/settings/contact",
    icon: Globe,
  },
  {
    title: "SEO settings",
    description:
      "Configure search engine metadata, keywords and your default sharing image.",
    href: "/admin/settings/seo",
    icon: Search,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
          Website management
        </p>

        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          Settings
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
          Manage your website's business information, contact details and search
          engine settings.
        </p>
      </div>

      <div className="divide-y divide-zinc-200 border-y border-zinc-200 bg-white">
        {settingsSections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.href}
              href={section.href}
              className="group flex items-center gap-4 px-4 py-5 transition hover:bg-zinc-50 sm:px-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                <Icon size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-zinc-900 transition group-hover:text-purple-700">
                  {section.title}
                </h2>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {section.description}
                </p>
              </div>

              <ChevronRight
                size={19}
                className="shrink-0 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-purple-700"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
