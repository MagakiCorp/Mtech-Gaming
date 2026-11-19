import { Suspense } from "react";
import { connection } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import CategoryForm from "@/components/admin/categories/category-form";

export default function NewCategoryPage() {
  return (
    <Suspense fallback={null}>
      <NewCategoryPageContent />
    </Suspense>
  );
}

async function NewCategoryPageContent() {
  await connection();

  const snapshot = await adminDb
    .collection("categories")
    .orderBy("name", "asc")
    .get();

  const categories = snapshot.docs
    .filter((doc) => doc.data().active === true)
    .map((doc) => ({
      id: doc.id,
      name: String(doc.data().name ?? ""),
    }));

  return <CategoryForm categories={categories} />;
}
