import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const keys = Object.keys(body);

    if (
      keys.length !== 1 ||
      !["approved", "active"].includes(keys[0]) ||
      typeof body[keys[0]] !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Provide either approved or active as a boolean." },
        { status: 400 },
      );
    }

    const field = keys[0] as "approved" | "active";
    const value = body[field];

    const testimonialRef = adminDb.collection("testimonials").doc(id);

    const testimonialSnapshot = await testimonialRef.get();

    if (!testimonialSnapshot.exists) {
      return NextResponse.json(
        { error: "Testimonial not found." },
        { status: 404 },
      );
    }

    await testimonialRef.update({
      [field]: value,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: "Testimonial status updated successfully.",
    });
  } catch (error) {
    console.error("Testimonial status update error:", error);

    return NextResponse.json(
      { error: "Unable to update testimonial status." },
      { status: 500 },
    );
  }
}
