import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";
import { deleteHomepageImage } from "@/lib/cloudinary-cleanup";

const SECTION_KEYS = [
  "categories",
  "featuredProducts",
  "promotions",
  "bestSellers",
  "newArrivals",
  "testimonials",
] as const;

const HERO_FIELDS = ["heading", "subheading", "ctaText", "ctaLink"] as const;

const VISIBILITY_FIELDS = SECTION_KEYS;

const PRODUCT_SELECTION_FIELDS = [
  "featuredProductIds",
  "bestSellerProductIds",
  "newArrivalProductIds",
] as const;

const MAX_PRODUCTS_PER_SECTION = 12;
const MAX_PROMOTIONS = 6;
const HOMEPAGE_IMAGE_FOLDER = "m-tech/homepage/";

function isValidHomepageImage(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const image = value as Record<string, unknown>;

  if (
    Object.keys(image).some((key) => !["url", "publicId"].includes(key)) ||
    typeof image.url !== "string" ||
    typeof image.publicId !== "string" ||
    !image.publicId.startsWith(HOMEPAGE_IMAGE_FOLDER) ||
    image.publicId.includes("..") ||
    image.publicId.includes("\\") ||
    image.publicId.length > 500
  ) {
    return false;
  }

  try {
    const url = new URL(image.url);

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      image.url.length <= 2000
    );
  } catch {
    return false;
  }
}

export async function PATCH(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const allowedFields = [
      "hero",
      "sectionVisibility",
      "sectionOrder",
      ...PRODUCT_SELECTION_FIELDS,
      "promotionIds",
    ];

    if (
      Object.keys(data).length === 0 ||
      Object.keys(data).some((key) => !allowedFields.includes(key))
    ) {
      return NextResponse.json(
        { error: "Invalid or unexpected fields." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    let shouldUpdateHeroImage = false;
    let newHeroImage: { url: string; publicId: string } | null = null;

    // Validate hero content and optional image.
    if ("hero" in data) {
      if (
        !data.hero ||
        typeof data.hero !== "object" ||
        Array.isArray(data.hero)
      ) {
        return NextResponse.json(
          { error: "Invalid hero settings." },
          { status: 400 },
        );
      }

      const hero = data.hero as Record<string, unknown>;
      const allowedHeroFields = [...HERO_FIELDS, "image"];

      if (
        Object.keys(hero).some(
          (key) =>
            !allowedHeroFields.includes(
              key as (typeof allowedHeroFields)[number],
            ),
        )
      ) {
        return NextResponse.json(
          { error: "Unexpected hero fields." },
          { status: 400 },
        );
      }

      const limits = {
        heading: 120,
        subheading: 300,
        ctaText: 40,
        ctaLink: 500,
      };

      for (const field of HERO_FIELDS) {
        if (
          typeof hero[field] !== "string" ||
          !(hero[field] as string).trim() ||
          (hero[field] as string).length > limits[field]
        ) {
          return NextResponse.json(
            { error: `Invalid hero ${field}.` },
            { status: 400 },
          );
        }
      }

      const ctaLink = (hero.ctaLink as string).trim();

      if (!ctaLink.startsWith("/") && !/^https:\/\/[^\s]+$/i.test(ctaLink)) {
        return NextResponse.json(
          { error: "CTA link must be a relative path or HTTPS URL." },
          { status: 400 },
        );
      }

      const heroUpdate: Record<string, unknown> = {
        heading: (hero.heading as string).trim(),
        subheading: (hero.subheading as string).trim(),
        ctaText: (hero.ctaText as string).trim(),
        ctaLink,
      };

      if (Object.prototype.hasOwnProperty.call(hero, "image")) {
        shouldUpdateHeroImage = true;

        if (hero.image !== null && !isValidHomepageImage(hero.image)) {
          return NextResponse.json(
            { error: "Invalid homepage hero image." },
            { status: 400 },
          );
        }

        newHeroImage = hero.image as { url: string; publicId: string } | null;
        heroUpdate.image = newHeroImage;
      }

      updates.hero = heroUpdate;
    }

    // Validate section visibility.
    if ("sectionVisibility" in data) {
      if (
        !data.sectionVisibility ||
        typeof data.sectionVisibility !== "object" ||
        Array.isArray(data.sectionVisibility)
      ) {
        return NextResponse.json(
          { error: "Invalid section visibility settings." },
          { status: 400 },
        );
      }

      const visibility = data.sectionVisibility as Record<string, unknown>;

      if (
        Object.keys(visibility).some(
          (key) =>
            !VISIBILITY_FIELDS.includes(
              key as (typeof VISIBILITY_FIELDS)[number],
            ),
        ) ||
        Object.values(visibility).some((value) => typeof value !== "boolean")
      ) {
        return NextResponse.json(
          { error: "Invalid section visibility values." },
          { status: 400 },
        );
      }

      if (Object.keys(visibility).length !== SECTION_KEYS.length) {
        return NextResponse.json(
          { error: "All section visibility values are required." },
          { status: 400 },
        );
      }

      updates.sectionVisibility = visibility;
    }

    // Validate section ordering.
    if ("sectionOrder" in data) {
      if (
        !Array.isArray(data.sectionOrder) ||
        data.sectionOrder.length !== SECTION_KEYS.length ||
        data.sectionOrder.some(
          (item) =>
            typeof item !== "string" ||
            !SECTION_KEYS.includes(item as (typeof SECTION_KEYS)[number]),
        ) ||
        new Set(data.sectionOrder).size !== SECTION_KEYS.length
      ) {
        return NextResponse.json(
          { error: "Invalid homepage section order." },
          { status: 400 },
        );
      }

      updates.sectionOrder = data.sectionOrder;
    }

    // Validate and save product selections.
    for (const field of PRODUCT_SELECTION_FIELDS) {
      if (!(field in data)) continue;

      const ids = data[field];

      if (
        !Array.isArray(ids) ||
        ids.length > MAX_PRODUCTS_PER_SECTION ||
        ids.some(
          (id) =>
            typeof id !== "string" ||
            !id.trim() ||
            id.includes("/") ||
            id.length > 1500,
        ) ||
        new Set(ids).size !== ids.length
      ) {
        return NextResponse.json(
          { error: `Invalid product selection for ${field}.` },
          { status: 400 },
        );
      }

      const productSnapshots = await Promise.all(
        ids.map((id) => adminDb.collection("products").doc(id).get()),
      );

      const hasUnavailableProduct = productSnapshots.some(
        (snapshot) => !snapshot.exists || snapshot.data()?.active !== true,
      );

      if (hasUnavailableProduct) {
        return NextResponse.json(
          {
            error:
              "One or more selected products no longer exist or are inactive. Refresh the page and update your selections.",
          },
          { status: 400 },
        );
      }

      updates[field] = ids;
    }

    // Validate and save homepage promotion selections.
    if ("promotionIds" in data) {
      const ids = data.promotionIds;

      if (
        !Array.isArray(ids) ||
        ids.length > MAX_PROMOTIONS ||
        ids.some(
          (id) =>
            typeof id !== "string" ||
            !id.trim() ||
            id.includes("/") ||
            id.length > 1500,
        ) ||
        new Set(ids).size !== ids.length
      ) {
        return NextResponse.json(
          { error: "Invalid homepage promotion selection." },
          { status: 400 },
        );
      }

      const promotionSnapshots = await Promise.all(
        ids.map((id) => adminDb.collection("promotions").doc(id).get()),
      );

      const hasUnavailablePromotion = promotionSnapshots.some(
        (snapshot) => !snapshot.exists || snapshot.data()?.active !== true,
      );

      if (hasUnavailablePromotion) {
        return NextResponse.json(
          {
            error:
              "One or more selected promotions no longer exist or are inactive. Refresh the page and update your selections.",
          },
          { status: 400 },
        );
      }

      updates.promotionIds = ids;
    }

    updates.updatedAt = FieldValue.serverTimestamp();

    const homepageRef = adminDb.collection("settings").doc("homepage");

    // Keep the previous image so it can be cleaned up after a successful save.
    const previousSnapshot = shouldUpdateHeroImage
      ? await homepageRef.get()
      : null;

    const previousHeroImage = previousSnapshot?.data()?.hero?.image as
      | { publicId?: string }
      | null
      | undefined;

    await homepageRef.set(updates, { merge: true });

    // Only delete the previous image after Firestore has saved the new value.
    if (
      shouldUpdateHeroImage &&
      previousHeroImage?.publicId &&
      previousHeroImage.publicId !== newHeroImage?.publicId
    ) {
      try {
        await deleteHomepageImage(previousHeroImage.publicId);
      } catch (cleanupError) {
        console.error("Homepage hero image cleanup failed:", cleanupError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update homepage settings:", error);

    return NextResponse.json(
      { error: "Unable to save homepage settings." },
      { status: 500 },
    );
  }
}
