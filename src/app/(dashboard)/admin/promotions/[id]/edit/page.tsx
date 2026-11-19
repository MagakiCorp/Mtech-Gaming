import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { adminDb } from "@/lib/firebase-admin";
import PromotionForm from "@/components/admin/promotions/promotion-form";

import type { Promotion } from "@/types";
import type { AdminPromotion } from "@/types/admin-promotion";

interface EditPromotionPageProps {
  params: Promise<{ id: string }>;
}

function toISOString(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return null;
}

export default function EditPromotionPage({ params }: EditPromotionPageProps) {
  return (
    <Suspense fallback={null}>
      <EditPromotionPageContent params={params} />
    </Suspense>
  );
}

async function EditPromotionPageContent({ params }: EditPromotionPageProps) {
  await connection();

  const { id } = await params;

  const [promotionSnapshot, productSnapshot, categorySnapshot] =
    await Promise.all([
      adminDb.collection("promotions").doc(id).get(),
      adminDb.collection("products").get(),
      adminDb.collection("categories").get(),
    ]);

  if (!promotionSnapshot.exists) {
    notFound();
  }

  const promotion = promotionSnapshot.data() as Promotion;

  const productNames = new Map(
    productSnapshot.docs.map((doc) => [
      doc.id,
      String(doc.data().name ?? "Unknown product"),
    ]),
  );

  const categoryNames = new Map(
    categorySnapshot.docs.map((doc) => [
      doc.id,
      String(doc.data().name ?? "Unknown category"),
    ]),
  );

  let targetName = "";

  if (promotion.targetType === "product" && promotion.targetId) {
    targetName = productNames.get(promotion.targetId) ?? "Unknown product";
  } else if (promotion.targetType === "category" && promotion.targetId) {
    targetName = categoryNames.get(promotion.targetId) ?? "Unknown category";
  }

  const initialData: AdminPromotion = {
    id,
    title: promotion.title ?? "",
    description: promotion.description ?? "",
    image: promotion.image ?? { url: "", publicId: "" },
    type: promotion.type ?? "banner",
    targetType: promotion.targetType ?? "none",
    targetId: promotion.targetId ?? null,
    targetName,
    ctaText: promotion.ctaText ?? "",
    ctaLink: promotion.ctaLink ?? "",
    startDate: toISOString(promotion.startDate),
    endDate: toISOString(promotion.endDate),
    active: promotion.active === true,
    sortOrder: promotion.sortOrder ?? 0,
    createdAt: toISOString(promotion.createdAt),
  };

  // Include active options and the currently linked target, even if inactive.
  const products = productSnapshot.docs
    .filter(
      (doc) =>
        doc.data().active === true ||
        (promotion.targetType === "product" && doc.id === promotion.targetId),
    )
    .map((doc) => ({
      id: doc.id,
      name: String(doc.data().name ?? ""),
      slug: String(doc.data().slug ?? ""),
      active: doc.data().active === true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const categories = categorySnapshot.docs
    .filter(
      (doc) =>
        doc.data().active === true ||
        (promotion.targetType === "category" && doc.id === promotion.targetId),
    )
    .map((doc) => ({
      id: doc.id,
      name: String(doc.data().name ?? ""),
      slug: String(doc.data().slug ?? ""),
      active: doc.data().active === true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PromotionForm
      promotionId={id}
      initialData={initialData}
      products={products}
      categories={categories}
    />
  );
}
