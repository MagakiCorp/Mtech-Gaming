import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { adminDb } from "@/lib/firebase-admin";

import {
  Package,
  Tags,
  Megaphone,
  MessageSquare,
  ArrowUpRight,
  Plus,
  Settings,
  ChevronRight,
} from "lucide-react";

const overviewItems = [
  {
    label: "Products",
    description: "Manage your gaming accessories and product listings.",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Categories",
    description: "Organise products into store categories.",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    label: "Promotions",
    description: "Manage banners, offers and campaigns.",
    href: "/admin/promotions",
    icon: Megaphone,
  },
  {
    label: "Testimonials",
    description: "Review and manage customer feedback.",
    href: "/admin/testimonials",
    icon: MessageSquare,
  },
];

async function DashboardMetrics() {
    await connection();
  try {
    // Fetch document counts directly from Firestore.
    const [
      productsSnapshot,
      categoriesSnapshot,
      promotionsSnapshot,
      testimonialsSnapshot,
    ] = await Promise.all([
      adminDb.collection("products").count().get(),

      adminDb.collection("categories").count().get(),

      adminDb
        .collection("promotions")
        .where("active", "==", true)
        .count()
        .get(),

      adminDb
        .collection("testimonials")
        .where("approved", "==", false)
        .count()
        .get(),
    ]);

    const metrics = [
      {
        label: "Total products",
        value: productsSnapshot.data().count,
        icon: Package,
        description: "Products in your catalogue",
      },
      {
        label: "Total categories",
        value: categoriesSnapshot.data().count,
        icon: Tags,
        description: "Product categories",
      },
      {
        label: "Enabled promotions",
        value: promotionsSnapshot.data().count,
        icon: Megaphone,
        description: "Promotions enabled in settings",
      },
      {
        label: "Pending testimonials",
        value: testimonialsSnapshot.data().count,
        icon: MessageSquare,
        description: "Awaiting approval",
      },
    ];

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500">
                  {metric.label}
                </p>

                <Icon size={18} className="text-purple-600" />
              </div>

              <p className="mt-5 text-3xl font-bold tracking-tight text-zinc-900">
                {metric.value.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-zinc-400">{metric.description}</p>
            </div>
          );
        })}
      </div>
    );
  } catch (error) {
    console.error("Failed to load dashboard metrics:", error);

    return (
      <div className="border border-red-200 bg-red-50 px-5 py-6">
        <p className="text-sm font-semibold text-red-800">
          Unable to load dashboard metrics.
        </p>

        <p className="mt-1 text-xs text-red-600">
          Check your Firestore connection and try again.
        </p>
      </div>
    );
  }
}

function MetricsLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-32 animate-pulse border border-zinc-200 bg-white"
        />
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
            Overview
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Welcome to your M Tech Store administration workspace.
          </p>
        </div>

        <Link
          href="/admin/products"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          <Plus size={16} />
          Add product
        </Link>
      </section>

      {/* Store metrics */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-bold text-zinc-800">Store overview</h2>

          <p className="mt-1 text-xs text-zinc-400">
            Current data from your store database.
          </p>
        </div>

        <Suspense fallback={<MetricsLoading />}>
          <DashboardMetrics />
        </Suspense>
      </section>

      {/* Management modules */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-bold text-zinc-800">Store management</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Manage the content and products displayed on your website.
          </p>
        </div>

        <div className="divide-y divide-zinc-200 border-y border-zinc-200 bg-white">
          {overviewItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center justify-between gap-4 px-5 py-5 transition hover:bg-zinc-50 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-purple-50 text-purple-700 transition group-hover:bg-purple-100">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {item.label}
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>

                <ArrowUpRight
                  size={18}
                  className="shrink-0 text-zinc-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-purple-600"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Store settings */}
      <section className="flex flex-col justify-between gap-4 border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-zinc-100 text-zinc-700">
            <Settings size={19} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Store configuration
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Update business details, contact information and SEO.
            </p>
          </div>
        </div>

        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 transition hover:text-purple-900"
        >
          Manage settings
          <ChevronRight size={16} />
        </Link>
      </section>
    </div>
  );
}
