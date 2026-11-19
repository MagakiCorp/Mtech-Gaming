import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { adminDb } from "@/lib/firebase-admin";
import TestimonialForm from "@/components/admin/testimonials/testimonial-form";

import type { Testimonial } from "@/types";
import type { AdminTestimonial } from "@/types/admin-testimonial";

interface EditTestimonialPageProps {
  params: Promise<{ id: string }>;
}

function toISOString(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return null;
}

export default function EditTestimonialPage({
  params,
}: EditTestimonialPageProps) {
  return (
    <Suspense fallback={null}>
      <EditTestimonialPageContent params={params} />
    </Suspense>
  );
}

async function EditTestimonialPageContent({
  params,
}: EditTestimonialPageProps) {
  await connection();

  const { id } = await params;

  const snapshot = await adminDb.collection("testimonials").doc(id).get();

  if (!snapshot.exists) {
    notFound();
  }

  const testimonial = snapshot.data() as Testimonial;

  const initialData: AdminTestimonial = {
    id,
    customerName: testimonial.customerName ?? "",
    message: testimonial.message ?? "",
    rating: testimonial.rating ?? 5,
    image: testimonial.image ?? null,
    approved: testimonial.approved === true,
    active: testimonial.active === true,
    sortOrder: testimonial.sortOrder ?? 0,
    createdAt: toISOString(testimonial.createdAt),
  };

  return <TestimonialForm testimonialId={id} initialData={initialData} />;
}
