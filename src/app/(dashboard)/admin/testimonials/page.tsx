import { Suspense } from "react";
import { connection } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import TestimonialsTable from "@/components/admin/testimonials/testimonials-table";

import type { Testimonial } from "@/types";
import type { AdminTestimonial } from "@/types/admin-testimonial";

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

export default function TestimonialsPage() {
  return (
    <Suspense fallback={null}>
      <TestimonialsPageContent />
    </Suspense>
  );
}

async function TestimonialsPageContent() {
  await connection();

  const snapshot = await adminDb
    .collection("testimonials")
    .orderBy("createdAt", "desc")
    .get();

  const testimonials: AdminTestimonial[] = snapshot.docs.map((doc) => {
    const testimonial = doc.data() as Testimonial;

    return {
      id: doc.id,
      customerName: testimonial.customerName ?? "",
      message: testimonial.message ?? "",
      rating: testimonial.rating ?? 0,
      image: testimonial.image ?? null,
      approved: testimonial.approved === true,
      active: testimonial.active === true,
      sortOrder: testimonial.sortOrder ?? 0,
      createdAt: toISOString(testimonial.createdAt),
    };
  });

  return <TestimonialsTable testimonials={testimonials} />;
}
