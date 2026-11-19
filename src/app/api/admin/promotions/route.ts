import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";

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

  if (Number.isNaN(date.getTime())) return undefined;

  return date;
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
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();

    if (!isObject(body)) {
      return NextResponse.json(
        { error: "Invalid promotion data." },
        { status: 400 },
      );
    }

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

      const targetSnapshot = await adminDb
        .collection(targetCollection)
        .doc(targetId as string)
        .get();

      if (!targetSnapshot.exists || targetSnapshot.data()?.active !== true) {
        return NextResponse.json(
          { error: "The selected product or category is unavailable." },
          { status: 400 },
        );
      }
    }

    const promotionData = {
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const promotionRef = await adminDb
      .collection("promotions")
      .add(promotionData);

    return NextResponse.json(
      {
        message: "Promotion created successfully.",
        id: promotionRef.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Promotion creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create promotion." },
      { status: 500 },
    );
  }
}
