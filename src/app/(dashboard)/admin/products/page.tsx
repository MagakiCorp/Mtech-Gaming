import { Suspense } from "react";
import { connection } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

import ProductsTable from "@/components/admin/products/products-table";

import type {
  AdminProduct,
  AdminProductCategory,
} from "@/types/admin-products";

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  );
}

async function ProductsPageContent() {
  await connection();

  const [productsSnapshot, categoriesSnapshot] = await Promise.all([
    adminDb.collection("products").orderBy("createdAt", "desc").get(),
    adminDb.collection("categories").get(),
  ]);

  const categoryNames = new Map(
    categoriesSnapshot.docs.map((category) => [
      category.id,
      String(category.data().name ?? "Uncategorised"),
    ]),
  );

  const products: AdminProduct[] = productsSnapshot.docs.map((document) => {
    const data = document.data();

    const createdAt = data.createdAt?.toDate?.();

    return {
      id: document.id,
      name: String(data.name ?? ""),
      slug: String(data.slug ?? ""),
      brand: String(data.brand ?? ""),
      categoryId: String(data.categoryId ?? ""),
      categoryName:
        categoryNames.get(String(data.categoryId ?? "")) ?? "Uncategorised",

      pricing: {
        type: data.pricing?.type ?? "on_request",
        min: data.pricing?.min ?? null,
        max: data.pricing?.max ?? null,
        currency: "KES",
      },

      imageUrl: String(data.images?.main?.url ?? ""),

      availability: data.availability ?? "out_of_stock",

      active: data.active === true,
      featured: data.featured === true,
      bestSeller: data.bestSeller === true,
      newArrival: data.newArrival === true,

      createdAt: createdAt ? createdAt.toISOString() : null,
    };
  });

  const categories: AdminProductCategory[] = categoriesSnapshot.docs
    .map((document) => ({
      id: document.id,
      name: String(document.data().name ?? ""),
      active: document.data().active === true,
    }))
    .filter((category) => category.active)
    .sort((a, b) => a.name.localeCompare(b.name));

  return <ProductsTable products={products} categories={categories} />;
}
