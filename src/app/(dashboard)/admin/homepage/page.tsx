import { Suspense } from "react";
import { connection } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import HomepageEditor from "@/components/admin/homepage/homepage-editor";

import type { HomepageSettings, Product } from "@/types";
import type {
  HomepageProductOption,
  HomepagePromotionOption,
} from "@/types/admin-homepage";

const DEFAULT_SECTION_ORDER = [
  "categories",
  "featuredProducts",
  "promotions",
  "bestSellers",
  "newArrivals",
  "testimonials",
] as const;

const DEFAULT_SETTINGS: Pick<
  HomepageSettings,
  | "hero"
  | "featuredProductIds"
  | "bestSellerProductIds"
  | "newArrivalProductIds"
  | "promotionIds"
  | "sectionVisibility"
  | "sectionOrder"
> = {
  hero: {
    heading: "Gear Up for More",
    subheading: "Discover gaming accessories built for your setup.",
    image: null,
    ctaText: "Explore Products",
    ctaLink: "/products",
  },

  featuredProductIds: [],
  bestSellerProductIds: [],
  newArrivalProductIds: [],
  promotionIds: [],

  sectionVisibility: {
    categories: true,
    featuredProducts: true,
    promotions: true,
    bestSellers: true,
    newArrivals: true,
    testimonials: true,
  },

  sectionOrder: [...DEFAULT_SECTION_ORDER],
};

export default function HomepagePage() {
  return (
    <Suspense fallback={null}>
      <HomepagePageContent />
    </Suspense>
  );
}

async function HomepagePageContent() {
  await connection();

  const [settingsSnapshot, productsSnapshot, promotionsSnapshot] =
    await Promise.all([
      adminDb.collection("settings").doc("homepage").get(),
      adminDb.collection("products").get(),
      adminDb.collection("promotions").get(),
    ]);

  const saved = settingsSnapshot.exists
    ? (settingsSnapshot.data() as Partial<HomepageSettings>)
    : {};

  const savedOrder = Array.isArray(saved.sectionOrder)
    ? saved.sectionOrder.filter(
        (section): section is (typeof DEFAULT_SECTION_ORDER)[number] =>
          DEFAULT_SECTION_ORDER.includes(
            section as (typeof DEFAULT_SECTION_ORDER)[number],
          ),
      )
    : [];

  const homepageSettings = {
    hero: {
      ...DEFAULT_SETTINGS.hero,
      ...(saved.hero ?? {}),
    },

    featuredProductIds: saved.featuredProductIds ?? [],
    bestSellerProductIds: saved.bestSellerProductIds ?? [],
    newArrivalProductIds: saved.newArrivalProductIds ?? [],
    promotionIds: saved.promotionIds ?? [],

    sectionVisibility: {
      categories:
        saved.sectionVisibility?.categories ??
        DEFAULT_SETTINGS.sectionVisibility.categories,
      featuredProducts:
        saved.sectionVisibility?.featuredProducts ??
        DEFAULT_SETTINGS.sectionVisibility.featuredProducts,
      promotions:
        saved.sectionVisibility?.promotions ??
        DEFAULT_SETTINGS.sectionVisibility.promotions,
      bestSellers:
        saved.sectionVisibility?.bestSellers ??
        DEFAULT_SETTINGS.sectionVisibility.bestSellers,
      newArrivals:
        saved.sectionVisibility?.newArrivals ??
        DEFAULT_SETTINGS.sectionVisibility.newArrivals,
      testimonials:
        saved.sectionVisibility?.testimonials ??
        DEFAULT_SETTINGS.sectionVisibility.testimonials,
    },

    sectionOrder: [
      ...new Set([...savedOrder, ...DEFAULT_SETTINGS.sectionOrder]),
    ],
  };

  const products: HomepageProductOption[] = productsSnapshot.docs.map(
    (document) => {
      const product = document.data() as Product;

      return {
        id: document.id,
        name: product.name ?? "",
        slug: product.slug ?? "",
        imageUrl: product.images?.main?.url ?? "",
        availability: product.availability ?? "out_of_stock",
        active: product.active === true,
      };
    },
  );

  const promotions: HomepagePromotionOption[] = promotionsSnapshot.docs.map(
    (document) => {
      const promotion = document.data();

      return {
        id: document.id,
        title: promotion.title ?? "",
        description: promotion.description ?? "",
        imageUrl: promotion.image?.url ?? "",
        type: promotion.type ?? "banner",
        active: promotion.active === true,
      };
    },
  );

  return (
    <HomepageEditor
      initialSettings={homepageSettings}
      products={products}
      promotions={promotions}
    />
  );
}
