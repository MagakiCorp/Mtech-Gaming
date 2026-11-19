import { Suspense } from "react";
import { connection } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

import HeroSection from "@/components/public/home/hero-section";
import CategorySection from "@/components/public/home/category-section";
import FeaturedProductsSection from "@/components/public/home/featured-products-section";
import PromotionSection from "@/components/public/home/promotion-section";
import BestSellersSection from "@/components/public/home/best-sellers-section";
import NewArrivalsSection from "@/components/public/home/new-arrivals-section";
import TestimonialsSection from "@/components/public/home/testimonials-section";
import ContactSection from "@/components/public/home/contact-section";

import type {
  HomepageData,
  GeneralData,
  PublicCategory,
  PublicProduct,
  PublicPromotion,
  PublicTestimonial,
  PublicContact,
} from "@/components/public/home/types";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

async function HomePageContent() {
  await connection();

  const [
    homepageSnapshot,
    generalSnapshot,
    categoriesSnapshot,
    testimonialsSnapshot,
    contactSnapshot,
  ] = await Promise.all([
    adminDb.collection("settings").doc("homepage").get(),
    adminDb.collection("settings").doc("general").get(),
    adminDb.collection("categories").where("active", "==", true).get(),
    adminDb
      .collection("testimonials")
      .where("active", "==", true)
      .where("approved", "==", true)
      .get(),
    adminDb.collection("settings").doc("contact").get(),
  ]);

  const homepage = homepageSnapshot.exists
    ? (homepageSnapshot.data() as HomepageData)
    : null;

  const general = generalSnapshot.exists
    ? (generalSnapshot.data() as GeneralData)
    : null;

  const categories: PublicCategory[] = categoriesSnapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<PublicCategory, "id">),
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 6);

  const testimonials: PublicTestimonial[] = testimonialsSnapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<PublicTestimonial, "id">),
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, 6);

  const contact = contactSnapshot.exists
    ? (contactSnapshot.data() as PublicContact)
    : null;

  const featuredProductIds = Array.isArray(homepage?.featuredProductIds)
    ? homepage.featuredProductIds.slice(0, 12)
    : [];

  const promotionIds = Array.isArray(homepage?.promotionIds)
    ? homepage.promotionIds.slice(0, 12)
    : [];

  const bestSellerProductIds = Array.isArray(homepage?.bestSellerProductIds)
    ? homepage.bestSellerProductIds.slice(0, 12)
    : [];

  const newArrivalProductIds = Array.isArray(homepage?.newArrivalProductIds)
    ? homepage.newArrivalProductIds.slice(0, 12)
    : [];

  const [
    productSnapshots,
    promotionSnapshots,
    bestSellerSnapshots,
    newArrivalSnapshots,
  ] = await Promise.all([
    Promise.all(
      featuredProductIds.map((id) =>
        adminDb.collection("products").doc(id).get(),
      ),
    ),
    Promise.all(
      promotionIds.map((id) => adminDb.collection("promotions").doc(id).get()),
    ),
    Promise.all(
      bestSellerProductIds.map((id) =>
        adminDb.collection("products").doc(id).get(),
      ),
    ),
    Promise.all(
      newArrivalProductIds.map((id) =>
        adminDb.collection("products").doc(id).get(),
      ),
    ),
  ]);

  const featuredProducts: PublicProduct[] = productSnapshots
    .filter((snapshot) => snapshot.exists)
    .map((snapshot) => ({
      id: snapshot.id,
      ...(snapshot.data() as Omit<PublicProduct, "id">),
    }))
    .filter(
      (product) =>
        product.active === true && product.availability !== "discontinued",
    );

  const promotions: PublicPromotion[] = promotionSnapshots
    .filter((snapshot) => snapshot.exists)
    .map((snapshot) => ({
      id: snapshot.id,
      ...(snapshot.data() as Omit<PublicPromotion, "id">),
    }))
    .filter((promotion) => promotion.active === true);

  const bestSellerProducts: PublicProduct[] = bestSellerSnapshots
    .filter((snapshot) => snapshot.exists)
    .map((snapshot) => ({
      id: snapshot.id,
      ...(snapshot.data() as Omit<PublicProduct, "id">),
    }))
    .filter(
      (product) =>
        product.active === true && product.availability !== "discontinued",
    );

  const newArrivalProducts: PublicProduct[] = newArrivalSnapshots
    .filter((snapshot) => snapshot.exists)
    .map((snapshot) => ({
      id: snapshot.id,
      ...(snapshot.data() as Omit<PublicProduct, "id">),
    }))
    .filter(
      (product) =>
        product.active === true && product.availability !== "discontinued",
    );

  const visibility = homepage?.sectionVisibility;

  const defaultSectionOrder = [
    "categories",
    "featuredProducts",
    "promotions",
    "bestSellers",
    "newArrivals",
    "testimonials",
  ] as const;

  type SectionKey = (typeof defaultSectionOrder)[number];

  const validSections = new Set<string>(defaultSectionOrder);

  const configuredOrder = Array.isArray(homepage?.sectionOrder)
    ? homepage.sectionOrder.filter((section): section is SectionKey =>
        validSections.has(section),
      )
    : [];

  // Remove duplicates and append any sections missing from the saved order.
  const sectionOrder = [
    ...new Set<SectionKey>([...configuredOrder, ...defaultSectionOrder]),
  ];

  return (
    <>
      <HeroSection hero={homepage?.hero} general={general} />

      {sectionOrder.map((section) => {
        switch (section) {
          case "categories":
            return (visibility?.categories ?? true) ? (
              <CategorySection key={section} categories={categories} />
            ) : null;

          case "featuredProducts":
            return (visibility?.featuredProducts ?? true) ? (
              <FeaturedProductsSection
                key={section}
                products={featuredProducts}
              />
            ) : null;

          case "promotions":
            return (visibility?.promotions ?? true) ? (
              <PromotionSection key={section} promotions={promotions} />
            ) : null;

          case "bestSellers":
            return (visibility?.bestSellers ?? true) ? (
              <BestSellersSection key={section} products={bestSellerProducts} />
            ) : null;

          case "newArrivals":
            return (visibility?.newArrivals ?? true) ? (
              <NewArrivalsSection key={section} products={newArrivalProducts} />
            ) : null;

          case "testimonials":
            return (visibility?.testimonials ?? true) ? (
              <TestimonialsSection key={section} testimonials={testimonials} />
            ) : null;

          default:
            return null;
        }
      })}

      {contact && <ContactSection contact={contact} />}
    </>
  );
}
