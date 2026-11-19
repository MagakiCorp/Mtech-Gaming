import { orderBy, where } from "firebase/firestore";

import {
  createRecord,
  deleteRecord,
  getRecord,
  getRecords,
  updateRecord,
} from "./firestore";

import type { DocumentWithId, Product, ProductInput } from "@/types";

const COLLECTION = "products";

// Public: active products only
export async function getProducts() {
  return getRecords<Product>(COLLECTION, [
    where("active", "==", true),
    orderBy("sortOrder", "asc"),
  ]);
}

// Admin: all products
export async function getAllProducts() {
  return getRecords<Product>(COLLECTION, [orderBy("createdAt", "desc")]);
}

// Single product by document ID
export async function getProduct(id: string) {
  return getRecord<Product>(COLLECTION, id);
}

// Single public product by slug
export async function getProductBySlug(
  slug: string,
): Promise<DocumentWithId<Product> | null> {
  const products = await getRecords<Product>(COLLECTION, [
    where("slug", "==", slug),
    where("active", "==", true),
  ]);

  return products[0] ?? null;
}

// Products belonging to a category
export async function getProductsByCategory(categoryId: string) {
  return getRecords<Product>(COLLECTION, [
    where("categoryId", "==", categoryId),
    where("active", "==", true),
    orderBy("sortOrder", "asc"),
  ]);
}

// Featured products
export async function getFeaturedProducts() {
  return getRecords<Product>(COLLECTION, [
    where("active", "==", true),
    where("featured", "==", true),
    orderBy("sortOrder", "asc"),
  ]);
}

// Best sellers
export async function getBestSellers() {
  return getRecords<Product>(COLLECTION, [
    where("active", "==", true),
    where("bestSeller", "==", true),
    orderBy("sortOrder", "asc"),
  ]);
}

// New arrivals
export async function getNewArrivals() {
  return getRecords<Product>(COLLECTION, [
    where("active", "==", true),
    where("newArrival", "==", true),
    orderBy("sortOrder", "asc"),
  ]);
}

// Create product
export async function createProduct(data: ProductInput) {
  return createRecord(COLLECTION, data);
}

// Update product
export async function updateProduct(id: string, data: Partial<ProductInput>) {
  return updateRecord<Product>(COLLECTION, id, data);
}

// Delete product
export async function deleteProduct(id: string) {
  return deleteRecord(COLLECTION, id);
}
