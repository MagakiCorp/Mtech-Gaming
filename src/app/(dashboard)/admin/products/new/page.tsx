import { Suspense } from "react";
import { connection } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import ProductForm from "@/components/admin/products/product-form";

import type { AdminProductCategory } from "@/types/admin-products";

export default function NewProductPage() {
  return (
    <Suspense fallback={null}>
      <NewProductPageContent />
    </Suspense>
  );
}

async function NewProductPageContent() {
  await connection();

  const categoriesSnapshot = await adminDb.collection("categories").get();

  const categories: AdminProductCategory[] = categoriesSnapshot.docs
    .map((document) => ({
      id: document.id,
      name: String(document.data().name ?? ""),
      active: document.data().active === true,
    }))
    .filter((category) => category.active)
    .sort((a, b) => a.name.localeCompare(b.name));

  return <ProductForm categories={categories} />;
}
