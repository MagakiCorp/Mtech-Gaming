import { orderBy, where } from "firebase/firestore";

import {
  createRecord,
  deleteRecord,
  getRecord,
  getRecords,
  updateRecord,
} from "./firestore";

import type { Category, CategoryInput } from "@/types";

const COLLECTION = "categories";

export async function getCategories() {
  return getRecords<Category>(COLLECTION, [
    where("active", "==", true),
    orderBy("sortOrder", "asc"),
  ]);
}

export async function getAllCategories() {
  return getRecords<Category>(COLLECTION, [orderBy("sortOrder", "asc")]);
}

export async function getCategory(id: string) {
  return getRecord<Category>(COLLECTION, id);
}

export async function getCategoryBySlug(slug: string) {
  const categories = await getRecords<Category>(COLLECTION, [
    where("slug", "==", slug),
    where("active", "==", true),
  ]);

  return categories[0] ?? null;
}

export async function getSubcategories(parentId: string) {
  return getRecords<Category>(COLLECTION, [
    where("parentId", "==", parentId),
    where("active", "==", true),
    orderBy("sortOrder", "asc"),
  ]);
}

export async function createCategory(data: CategoryInput) {
  return createRecord(COLLECTION, data);
}

export async function updateCategory(id: string, data: Partial<CategoryInput>) {
  return updateRecord<Category>(COLLECTION, id, data);
}

export async function deleteCategory(id: string) {
  return deleteRecord(COLLECTION, id);
}
