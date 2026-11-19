import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { adminDb } from "@/lib/firebase-admin";

import CategoryProductsSection, {
  type PublicCategoryProduct,
} from "@/components/public/categories/category-products-section";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

async function getCategoryDocument(slug: string) {
  const snapshot = await adminDb
    .collection("categories")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  return snapshot.docs[0] ?? null;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  await connection();

  const { slug } = await params;
  const document = await getCategoryDocument(slug);

  if (!document) {
    return {
      title: "Category not found | M Tech",
    };
  }

  const category = document.data();

  if (category.active !== true) {
    return {
      title: "Category not found | M Tech",
    };
  }

  const title = category.seo?.title || `${category.name} | M Tech`;
  const description =
    category.seo?.description ||
    category.description ||
    `Explore ${category.name} at M Tech.`;

  const image = category.image?.url;

  return {
    title,
    description,
    alternates: {
      canonical: `/categories/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, alt: category.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <Suspense fallback={null}>
      <CategoryPageContent params={params} />
    </Suspense>
  );
}

async function CategoryPageContent({ params }: CategoryPageProps) {
  await connection();

  const { slug } = await params;
  const categoryDocument = await getCategoryDocument(slug);

  if (!categoryDocument) {
    notFound();
  }

  const category = categoryDocument.data();

  if (category.active !== true) {
    notFound();
  }

  const productsSnapshot = await adminDb
    .collection("products")
    .where("categoryId", "==", categoryDocument.id)
    .where("active", "==", true)
    .get();

  const products: PublicCategoryProduct[] = productsSnapshot.docs
    .filter((document) => document.data().availability !== "discontinued")
    .map((document) => {
      const data = document.data();

      const {
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...productData
      } = data;

      return {
        id: document.id,
        ...productData,
      } as PublicCategoryProduct;
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08060f] text-white">
      {/* Ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 top-20 h-[480px] w-[480px] rounded-full bg-violet-700/10 blur-[140px]" />
        <div className="absolute -right-40 top-0 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.07] blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <section className="relative border-b border-white/[0.08]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-24">
          {/* Category information */}
          <div className="relative z-10">
            <Link
              href="/categories"
              className="group inline-flex items-center gap-2 text-sm font-medium text-white/45 transition-colors hover:text-cyan-300"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1"
              />
              All categories
            </Link>

            <div className="mt-12 flex items-center gap-3">
              <span className="h-px w-8 bg-cyan-400" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                Explore the collection
              </span>
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-black uppercase leading-[0.98] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              {category.name}
            </h1>

            {category.description && (
              <p className="mt-7 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                {category.description}
              </p>
            )}

            <div className="mt-9 flex items-center gap-4">
              <div className="h-10 w-px bg-gradient-to-b from-violet-400 to-cyan-400" />
              <div>
                <p className="font-mono text-2xl font-bold tabular-nums text-white">
                  {String(products.length).padStart(2, "0")}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  {products.length === 1
                    ? "Product available"
                    : "Products available"}
                </p>
              </div>
            </div>

            <Link
              href="/products"
              className="group mt-10 inline-flex items-center gap-3 border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-all hover:border-violet-400/60 hover:bg-violet-500/10"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)",
              }}
            >
              Browse all products
              <ArrowUpRight
                size={15}
                className="text-cyan-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          {/* Category image */}
          {category.image?.url && (
            <div className="relative">
              <div
                className="absolute -inset-3 bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-400/10 blur-2xl"
                aria-hidden="true"
              />

              <div
                className="relative aspect-[5/3.5] overflow-hidden border border-white/10 bg-[#0d0917]"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
                }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.09),transparent_45%,rgba(34,211,238,0.07))]" />

                <Image
                  src={category.image.url}
                  alt={category.name}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain p-6 sm:p-10"
                />

                {/* HUD details */}
                <div className="pointer-events-none absolute left-4 top-4 h-5 w-5 border-l border-t border-violet-400/70" />
                <div className="pointer-events-none absolute right-4 top-4 h-5 w-5 border-r border-t border-cyan-400/70" />
                <div className="pointer-events-none absolute bottom-4 left-4 h-5 w-5 border-b border-l border-cyan-400/70" />
                <div className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 border-b border-r border-violet-400/70" />

                <div className="absolute bottom-5 left-7 right-7 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      </section>

      <div className="relative">
        <CategoryProductsSection products={products} />
      </div>
    </div>
  );
}
