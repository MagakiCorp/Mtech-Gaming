import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { adminDb } from "@/lib/firebase-admin";
import ProductForm from "@/components/admin/products/product-form";

import type { ProductInput } from "@/types";
import type { AdminProductCategory } from "@/types/admin-products";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  return (
    <Suspense fallback={null}>
      <EditProductPageContent params={params} />
    </Suspense>
  );
}

async function EditProductPageContent({ params }: EditProductPageProps) {
  await connection();

  const { id } = await params;

  const [productSnapshot, categoriesSnapshot] = await Promise.all([
    adminDb.collection("products").doc(id).get(),
    adminDb.collection("categories").get(),
  ]);

  if (!productSnapshot.exists) {
    notFound();
  }

  const data = productSnapshot.data()!;

  const { createdAt, updatedAt, ...productData } = data;

  const initialData = productData as ProductInput;

  const categories: AdminProductCategory[] = categoriesSnapshot.docs
    .map((document) => ({
      id: document.id,
      name: String(document.data().name ?? ""),
      active: document.data().active === true,
    }))
    .filter(
      (category) => category.active || category.id === initialData.categoryId,
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ProductForm
      categories={categories}
      productId={id}
      initialData={initialData}
    />
  );
}
