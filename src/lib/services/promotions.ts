import { orderBy, where } from "firebase/firestore";

import {
  createRecord,
  deleteRecord,
  getRecord,
  getRecords,
  updateRecord,
} from "./firestore";

import type { Promotion, PromotionInput } from "@/types";

const COLLECTION = "promotions";

export async function getPromotions() {
  return getRecords<Promotion>(COLLECTION, [
    where("active", "==", true),
    orderBy("sortOrder", "asc"),
  ]);
}

export async function getAllPromotions() {
  return getRecords<Promotion>(COLLECTION, [orderBy("createdAt", "desc")]);
}

export async function getPromotion(id: string) {
  return getRecord<Promotion>(COLLECTION, id);
}

export async function createPromotion(data: PromotionInput) {
  return createRecord(COLLECTION, data);
}

export async function updatePromotion(
  id: string,
  data: Partial<PromotionInput>,
) {
  return updateRecord<Promotion>(COLLECTION, id, data);
}

export async function deletePromotion(id: string) {
  return deleteRecord(COLLECTION, id);
}
