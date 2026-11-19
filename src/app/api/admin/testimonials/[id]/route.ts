import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";
import { deleteTestimonialImage } from "@/lib/cloudinary-cleanup";

const COLLECTION = "testimonials";
const IMAGE_FOLDER = "m-tech/testimonials/";

type TestimonialImage = {
  url: string;
  publicId: string;
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

function validateUpdate(body: unknown) {
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

  const keys = Object.keys(data);

  if (keys.length === 0 || keys.some((key) => !allowedFields.includes(key))) {
    return { error: "Invalid or unexpected fields were submitted." };
  }

  const update: Record<string, unknown> = {};

  if ("customerName" in data) {
    if (typeof data.customerName !== "string") {
      return { error: "Customer name must be a string." };
    }

    const value = data.customerName.trim();

    if (!value || value.length > 100) {
      return { error: "Customer name must be between 1 and 100 characters." };
    }

    update.customerName = value;
  }

  if ("message" in data) {
    if (typeof data.message !== "string") {
      return { error: "Message must be a string." };
    }

    const value = data.message.trim();

    if (!value || value.length > 1000) {
      return { error: "Message must be between 1 and 1000 characters." };
    }

    update.message = value;
  }

  if ("rating" in data) {
    if (
      !Number.isInteger(data.rating) ||
      (data.rating as number) < 1 ||
      (data.rating as number) > 5
    ) {
      return { error: "Rating must be an integer between 1 and 5." };
    }

    update.rating = data.rating;
  }

  if ("image" in data) {
    if (!isValidImage(data.image)) {
      return { error: "The testimonial image is invalid." };
    }

    update.image = data.image;
  }

  for (const field of ["approved", "active"] as const) {
    if (field in data) {
      if (typeof data[field] !== "boolean") {
        return { error: `${field} must be a boolean.` };
      }

      update[field] = data[field];
    }
  }

  if ("sortOrder" in data) {
    if (!Number.isInteger(data.sortOrder) || (data.sortOrder as number) < 0) {
      return { error: "Sort order must be a non-negative integer." };
    }

    update.sortOrder = data.sortOrder;
  }

  return { data: update };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Testimonial not found." },
        { status: 404 },
      );
    }

    const body: unknown = await request.json();
    const result = validateUpdate(body);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const currentData = snapshot.data();
    const previousImage = currentData?.image as
      | TestimonialImage
      | null
      | undefined;

    await docRef.update({
      ...result.data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const imageWasUpdated = Object.prototype.hasOwnProperty.call(
      result.data,
      "image",
    );

    const nextImage = result.data.image as TestimonialImage | null | undefined;

    if (
      imageWasUpdated &&
      previousImage?.publicId &&
      previousImage.publicId !== nextImage?.publicId
    ) {
      try {
        await deleteTestimonialImage(previousImage.publicId);
      } catch (error) {
        console.error("Failed to clean up replaced testimonial image:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update testimonial:", error);

    return NextResponse.json(
      { error: "Unable to update testimonial." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = adminDb.collection(COLLECTION).doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Testimonial not found." },
        { status: 404 },
      );
    }

    const testimonial = snapshot.data();
    const image = testimonial?.image as TestimonialImage | null | undefined;

    await docRef.delete();

    if (image?.publicId) {
      try {
        await deleteTestimonialImage(image.publicId);
      } catch (error) {
        console.error("Failed to clean up deleted testimonial image:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete testimonial:", error);

    return NextResponse.json(
      { error: "Unable to delete testimonial." },
      { status: 500 },
    );
  }
}
