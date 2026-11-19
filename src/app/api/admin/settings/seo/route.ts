import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidateTag } from "next/cache";

import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";
import cloudinary from "@/lib/cloudinary";

const SETTINGS_REF = adminDb.collection("settings").doc("seo");
const SEO_IMAGE_FOLDER = "m-tech/seo/";

interface ImageAsset {
  url: string;
  publicId: string;
}

function isValidImageAsset(value: unknown): value is ImageAsset {
  if (!value || typeof value !== "object") return false;

  const image = value as Record<string, unknown>;

  return (
    typeof image.url === "string" &&
    image.url.startsWith("https://res.cloudinary.com/") &&
    typeof image.publicId === "string" &&
    image.publicId.startsWith(SEO_IMAGE_FOLDER) &&
    !image.publicId.includes("..")
  );
}

function isValidOptionalImage(value: unknown): value is ImageAsset | null {
  return value === null || isValidImageAsset(value);
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snapshot = await SETTINGS_REF.get();

    return NextResponse.json({
      settings: snapshot.exists ? snapshot.data() : null,
    });
  } catch (error) {
    console.error("Failed to load SEO settings:", error);

    return NextResponse.json(
      { error: "Failed to load SEO settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { siteTitle, siteDescription, keywords, defaultOgImage } = body;

    if (
      typeof siteTitle !== "string" ||
      !siteTitle.trim() ||
      siteTitle.trim().length > 70
    ) {
      return NextResponse.json(
        { error: "Site title is required and must not exceed 70 characters." },
        { status: 400 },
      );
    }

    if (
      typeof siteDescription !== "string" ||
      !siteDescription.trim() ||
      siteDescription.trim().length > 320
    ) {
      return NextResponse.json(
        {
          error:
            "Site description is required and must not exceed 320 characters.",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(keywords) ||
      keywords.length > 30 ||
      !keywords.every(
        (keyword: unknown) =>
          typeof keyword === "string" &&
          keyword.trim().length > 0 &&
          keyword.trim().length <= 50,
      )
    ) {
      return NextResponse.json(
        { error: "Keywords must be an array of up to 30 valid keywords." },
        { status: 400 },
      );
    }

    if (!isValidOptionalImage(defaultOgImage)) {
      return NextResponse.json(
        { error: "Invalid Open Graph image." },
        { status: 400 },
      );
    }

    const currentSnapshot = await SETTINGS_REF.get();
    const currentSettings = currentSnapshot.data();

    const previousImage = currentSettings?.defaultOgImage as
      | ImageAsset
      | null
      | undefined;

    await SETTINGS_REF.set(
      {
        siteTitle: siteTitle.trim(),
        siteDescription: siteDescription.trim(),
        keywords: [
          ...new Set(keywords.map((keyword: string) => keyword.trim())),
        ],
        defaultOgImage,
        ...(currentSnapshot.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp() }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // Refresh cached root metadata after a successful Firestore update.
    revalidateTag("site-settings", { expire: 0 });

    let cleanupWarning: string | null = null;

    if (
      previousImage?.publicId &&
      previousImage.publicId !== defaultOgImage?.publicId
    ) {
      try {
        const result = await cloudinary.uploader.destroy(
          previousImage.publicId,
          { resource_type: "image", invalidate: true },
        );

        if (result.result !== "ok" && result.result !== "not found") {
          console.error(
            "SEO image cleanup returned an unexpected result:",
            result,
          );
          cleanupWarning =
            "Settings saved, but the previous image could not be deleted.";
        }
      } catch (cleanupError) {
        console.error("SEO image cleanup failed:", cleanupError);
        cleanupWarning =
          "Settings saved, but the previous image could not be deleted.";
      }
    }

    return NextResponse.json({
      message: "SEO settings saved successfully.",
      cleanupWarning,
    });
  } catch (error) {
    console.error("Failed to save SEO settings:", error);

    return NextResponse.json(
      { error: "Failed to save SEO settings." },
      { status: 500 },
    );
  }
}
