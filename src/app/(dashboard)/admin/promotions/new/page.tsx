import { Suspense } from "react";
import { connection } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import PromotionForm from "@/components/admin/promotions/promotion-form";

export default function NewPromotionPage() {
  return (
    <Suspense fallback={null}>
      <NewPromotionPageContent />
    </Suspense>
  );
}

async function NewPromotionPageContent() {
  await connection();

  const [productSnapshot, categorySnapshot] = await Promise.all([
    adminDb.collection("products").get(),
    adminDb.collection("categories").get(),
  ]);

  const products = productSnapshot.docs
    .filter((doc) => doc.data().active === true)
    .map((doc) => ({
      id: doc.id,
      name: String(doc.data().name ?? ""),
      slug: String(doc.data().slug ?? ""),
      active: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const categories = categorySnapshot.docs
    .filter((doc) => doc.data().active === true)
    .map((doc) => ({
      id: doc.id,
      name: String(doc.data().name ?? ""),
      slug: String(doc.data().slug ?? ""),
      active: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <PromotionForm products={products} categories={categories} />;
}
