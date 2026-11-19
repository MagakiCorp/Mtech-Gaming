import { Suspense } from "react";
import { connection } from "next/server";

import TestimonialForm from "@/components/admin/testimonials/testimonial-form";

export default function NewTestimonialPage() {
  return (
    <Suspense fallback={null}>
      <NewTestimonialPageContent />
    </Suspense>
  );
}

async function NewTestimonialPageContent() {
  await connection();

  return <TestimonialForm />;
}
