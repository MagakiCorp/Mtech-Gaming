import { Suspense } from "react";
import { connection } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import CategoriesTable from "@/components/admin/categories/categories-table";

import type { Category } from "@/types";

export default function CategoriesPage() {
  return (
    <Suspense fallback={null}>
      <CategoriesPageContent />
    </Suspense>
  );
}

async function CategoriesPageContent() {
  await connection();

  const snapshot = await adminDb
    .collection("categories")
    .orderBy("sortOrder", "asc")
    .get();

  const categoryDocuments: (Category & { id: string })[] = snapshot.docs.map(
    (doc) => ({
      ...(doc.data() as Category),
      id: doc.id,
    }),
  );

  const categoryNames = new Map<string, string>(
    categoryDocuments.map((category) => [category.id, category.name]),
  );

  const categories = categoryDocuments.map((category) => ({
    id: category.id,
    name: category.name ?? "",
    slug: category.slug ?? "",
    description: category.description ?? "",
    image: category.image ?? null,
    parentId: category.parentId ?? null,
    parentName: category.parentId
      ? (categoryNames.get(category.parentId) ?? "Unknown category")
      : "",
    active: category.active === true,
    sortOrder: category.sortOrder ?? 0,
  }));

  return <CategoriesTable categories={categories} />;
}
