import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";

const COLLECTION = "testimonials";
const IMAGE_FOLDER = "m-tech/testimonials/";

type TestimonialImage = {
  url: string;
  publicId: string;
};

function isValidImage(value: unknown): value is TestimonialImage | null {
  if (value === null) return true;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const image = value as Record<string, unknown>;

  if (
    typeof image.url !== "string" ||
    typeof image.publicId !== "string" ||
    !image.publicId.startsWith(IMAGE_FOLDER) ||
    image.publicId.includes("..") ||
    image.publicId.includes("\\")
  ) {
    return false;
  }

  try {
    const url = new URL(image.url);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function validateTestimonial(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid request body." };
  }

  const data = body as Record<string, unknown>;
  const allowedFields = [
    "customerName",
    "message",
    "rating",
    "image",
    "approved",
    "active",
    "sortOrder",
  ];

  if (Object.keys(data).some((key) => !allowedFields.includes(key))) {
    return { error: "Unexpected fields were submitted." };
  }

  const customerName =
    typeof data.customerName === "string" ? data.customerName.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";

  if (!customerName || customerName.length > 100) {
    return { error: "Customer name must be between 1 and 100 characters." };
  }

  if (!message || message.length > 1000) {
    return { error: "Message must be between 1 and 1000 characters." };
  }

  if (
    !Number.isInteger(data.rating) ||
    (data.rating as number) < 1 ||
    (data.rating as number) > 5
  ) {
    return { error: "Rating must be an integer between 1 and 5." };
  }

  if (data.image !== undefined && !isValidImage(data.image)) {
    return { error: "The testimonial image is invalid." };
  }

  if (data.approved !== undefined && typeof data.approved !== "boolean") {
    return { error: "Approval status must be a boolean." };
  }

  if (data.active !== undefined && typeof data.active !== "boolean") {
    return { error: "Active status must be a boolean." };
  }

  if (
    data.sortOrder !== undefined &&
    (!Number.isInteger(data.sortOrder) || (data.sortOrder as number) < 0)
  ) {
    return { error: "Sort order must be a non-negative integer." };
  }

  return {
    data: {
      customerName,
      message,
      rating: data.rating as number,
      image: (data.image as TestimonialImage | null | undefined) ?? null,
      approved: (data.approved as boolean | undefined) ?? false,
      active: (data.active as boolean | undefined) ?? true,
      sortOrder: (data.sortOrder as number | undefined) ?? 0,
    },
  };
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const result = validateTestimonial(body);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const now = FieldValue.serverTimestamp();

    const docRef = await adminDb.collection(COLLECTION).add({
      ...result.data,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create testimonial:", error);

    return NextResponse.json(
      { error: "Unable to create testimonial." },
      { status: 500 },
    );
  }
}
