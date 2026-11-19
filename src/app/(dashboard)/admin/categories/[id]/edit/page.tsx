import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { adminDb } from "@/lib/firebase-admin";
import CategoryForm from "@/components/admin/categories/category-form";

import type { CategoryInput } from "@/types";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  return (
    <Suspense fallback={<EditCategoryLoading />}>
      <EditCategoryContent params={params} />
    </Suspense>
  );
}

async function EditCategoryContent({ params }: EditCategoryPageProps) {
  await connection();

  const { id } = await params;

  const [categorySnapshot, categoriesSnapshot] = await Promise.all([
    adminDb.collection("categories").doc(id).get(),
    adminDb.collection("categories").orderBy("name", "asc").get(),
  ]);

  if (!categorySnapshot.exists) {
    notFound();
  }

  const rawData = categorySnapshot.data()!;

  const {
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...categoryData
  } = rawData;

  const initialData = categoryData as CategoryInput;

  const categories = categoriesSnapshot.docs
    .filter((doc) => doc.id !== id)
    .filter(
      (doc) => doc.data().active === true || doc.id === initialData.parentId,
    )
    .map((doc) => ({
      id: doc.id,
      name: String(doc.data().name ?? ""),
    }));

  return (
    <CategoryForm
      categories={categories}
      categoryId={id}
      initialData={initialData}
    />
  );
}

function EditCategoryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-zinc-200" />
      <div className="h-4 w-72 rounded bg-zinc-100" />
      <div className="mt-8 space-y-5 border border-zinc-200 bg-white p-6">
        <div className="h-10 rounded bg-zinc-100" />
        <div className="h-10 rounded bg-zinc-100" />
        <div className="h-32 rounded bg-zinc-100" />
      </div>
    </div>
  );
}
