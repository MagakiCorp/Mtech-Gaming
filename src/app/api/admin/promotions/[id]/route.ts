import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";
import { deletePromotionImage } from "@/lib/cloudinary-cleanup";

import { Timestamp } from "firebase-admin/firestore";


type RouteContext = {
  params: Promise<{ id: string }>;
};

function getImagePublicId(data: unknown): string | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("publicId" in data) ||
    typeof data.publicId !== "string"
  ) {
    return null;
  }

  return data.publicId;
}

async function cleanupPromotionImage(publicId: string | null) {
  if (!publicId) return;

  try {
    const result = await deletePromotionImage(publicId);

    if (result === "skipped") {
      console.warn(
        `Skipped promotion image cleanup because the asset is outside the allowed folder: ${publicId}`,
      );
    }
  } catch (error) {
    // Firestore has already been updated.
    // Do not turn a successful deletion into an API failure.
    console.error("Promotion image cleanup failed:", publicId, error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const promotionRef = adminDb.collection("promotions").doc(id);
    const homepageRef = adminDb.collection("settings").doc("homepage");

    let imagePublicId: string | null = null;
    let promotionFound = false;

    // Delete the promotion and remove its homepage reference atomically.
    await adminDb.runTransaction(async (transaction) => {
      const [promotionSnapshot, homepageSnapshot] = await Promise.all([
        transaction.get(promotionRef),
        transaction.get(homepageRef),
      ]);

      if (!promotionSnapshot.exists) return;

      promotionFound = true;
      imagePublicId = getImagePublicId(promotionSnapshot.data()?.image);

      transaction.delete(promotionRef);

      if (homepageSnapshot.exists) {
        transaction.update(homepageRef, {
          promotionIds: FieldValue.arrayRemove(id),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    if (!promotionFound) {
      return NextResponse.json(
        { error: "Promotion not found." },
        { status: 404 },
      );
    }

    // Only clean up the image after successful Firestore deletion.
    await cleanupPromotionImage(imagePublicId);

    return NextResponse.json({
      message: "Promotion deleted successfully.",
    });
  } catch (error) {
    console.error("Promotion deletion failed:", error);

    return NextResponse.json(
      { error: "Unable to delete promotion." },
      { status: 500 },
    );
  }
}


const PROMOTION_IMAGE_FOLDER = "m-tech/promotions/";

const PROMOTION_TYPES = ["banner", "offer", "campaign"] as const;
const TARGET_TYPES = ["product", "category", "none"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isValidImage(value: unknown): value is {
  url: string;
  publicId: string;
} {
  if (!isObject(value)) return false;

  if (
    typeof value.url !== "string" ||
    typeof value.publicId !== "string" ||
    !value.publicId.startsWith(PROMOTION_IMAGE_FOLDER) ||
    value.publicId.includes("..")
  ) {
    return false;
  }

  try {
    const url = new URL(value.url);

    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function isValidCtaLink(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body: unknown = await request.json();

    if (!isObject(body)) {
      return NextResponse.json(
        { error: "Invalid promotion data." },
        { status: 400 },
      );
    }

    const promotionRef = adminDb.collection("promotions").doc(id);
    const existingSnapshot = await promotionRef.get();

    if (!existingSnapshot.exists) {
      return NextResponse.json(
        { error: "Promotion not found." },
        { status: 404 },
      );
    }

    const existing = existingSnapshot.data()!;

    const {
      title,
      description,
      image,
      type,
      targetType,
      targetId,
      ctaText,
      ctaLink,
      startDate,
      endDate,
      active,
      sortOrder,
    } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 120
    ) {
      return NextResponse.json(
        { error: "A valid promotion title is required." },
        { status: 400 },
      );
    }

    if (typeof description !== "string" || description.length > 1000) {
      return NextResponse.json(
        { error: "The promotion description is invalid." },
        { status: 400 },
      );
    }

    if (!isValidImage(image)) {
      return NextResponse.json(
        { error: "A valid promotion image is required." },
        { status: 400 },
      );
    }

    if (
      typeof type !== "string" ||
      !PROMOTION_TYPES.includes(type as (typeof PROMOTION_TYPES)[number])
    ) {
      return NextResponse.json(
        { error: "A valid promotion type is required." },
        { status: 400 },
      );
    }

    if (
      typeof targetType !== "string" ||
      !TARGET_TYPES.includes(targetType as (typeof TARGET_TYPES)[number])
    ) {
      return NextResponse.json(
        { error: "A valid promotion target type is required." },
        { status: 400 },
      );
    }

    if (
      targetType === "none"
        ? targetId !== null
        : typeof targetId !== "string" || !targetId.trim()
    ) {
      return NextResponse.json(
        { error: "The selected promotion target is invalid." },
        { status: 400 },
      );
    }

    if (
      typeof ctaText !== "string" ||
      ctaText.length > 40 ||
      typeof ctaLink !== "string" ||
      ctaLink.length > 2048
    ) {
      return NextResponse.json(
        { error: "The promotion CTA details are invalid." },
        { status: 400 },
      );
    }

    if (Boolean(ctaText.trim()) !== Boolean(ctaLink.trim())) {
      return NextResponse.json(
        { error: "Enter both CTA text and a CTA link, or leave both empty." },
        { status: 400 },
      );
    }

    if (ctaLink.trim() && !isValidCtaLink(ctaLink.trim())) {
      return NextResponse.json(
        { error: "The CTA link must be a relative path or HTTPS URL." },
        { status: 400 },
      );
    }

    if (
      typeof active !== "boolean" ||
      !Number.isInteger(sortOrder) ||
      (sortOrder as number) < 0
    ) {
      return NextResponse.json(
        { error: "The promotion status or display order is invalid." },
        { status: 400 },
      );
    }

    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    if (parsedStartDate === undefined || parsedEndDate === undefined) {
      return NextResponse.json(
        { error: "One or more promotion dates are invalid." },
        { status: 400 },
      );
    }

    if (parsedStartDate && parsedEndDate && parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        { error: "The end date must be later than the start date." },
        { status: 400 },
      );
    }

    if (targetType !== "none") {
      const targetCollection =
        targetType === "product" ? "products" : "categories";

      const isSameExistingTarget =
        existing.targetType === targetType && existing.targetId === targetId;

      const targetSnapshot = await adminDb
        .collection(targetCollection)
        .doc(targetId as string)
        .get();

      if (
        !targetSnapshot.exists ||
        (!isSameExistingTarget && targetSnapshot.data()?.active !== true)
      ) {
        return NextResponse.json(
          { error: "The selected product or category is unavailable." },
          { status: 400 },
        );
      }
    }

    const oldImagePublicId =
      typeof existing.image?.publicId === "string"
        ? existing.image.publicId
        : null;

    await promotionRef.update({
      title: title.trim(),
      description: description.trim(),
      image,
      type,
      targetType,
      targetId: targetType === "none" ? null : targetId,
      ctaText: ctaText.trim(),
      ctaLink: ctaLink.trim(),
      startDate: parsedStartDate ? Timestamp.fromDate(parsedStartDate) : null,
      endDate: parsedEndDate ? Timestamp.fromDate(parsedEndDate) : null,
      active,
      sortOrder,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Delete the previous image only after Firestore has saved the new one.
    if (
      oldImagePublicId &&
      oldImagePublicId !== image.publicId &&
      oldImagePublicId.startsWith(PROMOTION_IMAGE_FOLDER) &&
      !oldImagePublicId.includes("..")
    ) {
      try {
        await deletePromotionImage(oldImagePublicId);
      } catch (cleanupError) {
        console.error(
          "Promotion was updated, but its previous image could not be deleted:",
          cleanupError,
        );
      }
    }

    return NextResponse.json({
      message: "Promotion updated successfully.",
    });
  } catch (error) {
    console.error("Promotion update failed:", error);

    return NextResponse.json(
      { error: "Unable to update promotion." },
      { status: 500 },
    );
  }
}
