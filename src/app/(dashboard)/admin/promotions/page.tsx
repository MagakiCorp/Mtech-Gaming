
import { Suspense } from "react";
import { connection } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import PromotionsTable from "@/components/admin/promotions/promotions-table";

import type { Promotion } from "@/types";
import type { AdminPromotion } from "@/types/admin-promotion";

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

export default function PromotionsPage() {
  return (
    <Suspense fallback={null}>
      <PromotionsPageContent />
    </Suspense>
  );
}

async function PromotionsPageContent() {
  await connection();

  const [promotionSnapshot, productSnapshot, categorySnapshot] =
    await Promise.all([
      adminDb.collection("promotions").orderBy("createdAt", "desc").get(),
      adminDb.collection("products").get(),
      adminDb.collection("categories").get(),
    ]);

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

  const promotions: AdminPromotion[] = promotionSnapshot.docs.map((doc) => {
    const promotion = doc.data() as Promotion;

    let targetName = "";

    if (promotion.targetType === "product" && promotion.targetId) {
      targetName = productNames.get(promotion.targetId) ?? "Unknown product";
    } else if (promotion.targetType === "category" && promotion.targetId) {
      targetName = categoryNames.get(promotion.targetId) ?? "Unknown category";
    }

    return {
      id: doc.id,
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
  });

  return <PromotionsTable promotions={promotions} />;
}