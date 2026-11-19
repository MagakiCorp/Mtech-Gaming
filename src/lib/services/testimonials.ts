import { orderBy, where } from "firebase/firestore";

import {
  createRecord,
  deleteRecord,
  getRecord,
  getRecords,
  updateRecord,
} from "./firestore";

import type { Testimonial, TestimonialInput } from "@/types";

const COLLECTION = "testimonials";

export async function getTestimonials() {
  return getRecords<Testimonial>(COLLECTION, [
    where("active", "==", true),
    where("approved", "==", true),
    orderBy("sortOrder", "asc"),
  ]);
}

export async function getAllTestimonials() {
  return getRecords<Testimonial>(COLLECTION, [orderBy("createdAt", "desc")]);
}

export async function getTestimonial(id: string) {
  return getRecord<Testimonial>(COLLECTION, id);
}

export async function createTestimonial(data: TestimonialInput) {
  return createRecord(COLLECTION, data);
}

export async function updateTestimonial(
  id: string,
  data: Partial<TestimonialInput>,
) {
  return updateRecord<Testimonial>(COLLECTION, id, data);
}

export async function deleteTestimonial(id: string) {
  return deleteRecord(COLLECTION, id);
}
