import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidateTag } from "next/cache";

import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";
import { deleteGeneralImage } from "@/lib/cloudinary-cleanup";

interface ImageAsset {
  url: string;
  publicId: string;
}

interface GeneralSettingsInput {
  businessName: string;
  tagline: string;
  description: string;
  logo: ImageAsset | null;
  favicon: ImageAsset | null;
  currency: "KES";
}

function isValidImage(value: unknown): value is ImageAsset | null {
  if (value === null) return true;

  if (!value || typeof value !== "object") return false;

  const image = value as Record<string, unknown>;

  return (
    typeof image.url === "string" &&
    image.url.startsWith("https://res.cloudinary.com/") &&
    typeof image.publicId === "string" &&
    image.publicId.startsWith("m-tech/general/") &&
    !image.publicId.includes("..")
  );
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection("settings").doc("general").get();

    return NextResponse.json({
      settings: snapshot.exists ? snapshot.data() : null,
    });
  } catch (error) {
    console.error("Failed to fetch general settings:", error);

    return NextResponse.json(
      { error: "Failed to load general settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<GeneralSettingsInput>;

    const businessName = body.businessName?.trim();
    const tagline = body.tagline?.trim();
    const description = body.description?.trim();

    if (!businessName || businessName.length > 100) {
      return NextResponse.json(
        {
          error: "Business name is required and must be under 100 characters.",
        },
        { status: 400 },
      );
    }

    if (typeof tagline !== "string" || tagline.length > 160) {
      return NextResponse.json(
        { error: "Tagline must be under 160 characters." },
        { status: 400 },
      );
    }

    if (typeof description !== "string" || description.length > 1000) {
      return NextResponse.json(
        { error: "Description must be under 1000 characters." },
        { status: 400 },
      );
    }

    if (
      !isValidImage(body.logo) ||
      !isValidImage(body.favicon) ||
      body.currency !== "KES"
    ) {
      return NextResponse.json(
        { error: "Invalid image or currency settings." },
        { status: 400 },
      );
    }

    const settingsRef = adminDb.collection("settings").doc("general");
    const existingSnapshot = await settingsRef.get();
    const existing = existingSnapshot.data();

    const settings: GeneralSettingsInput = {
      businessName,
      tagline,
      description,
      logo: body.logo ?? null,
      favicon: body.favicon ?? null,
      currency: "KES",
    };

    await settingsRef.set(
      {
        ...settings,
        updatedAt: FieldValue.serverTimestamp(),
        ...(existingSnapshot.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );

    // Refresh cached root metadata after a successful Firestore update.
    revalidateTag("site-settings", { expire: 0 });

    // Clean up replaced or removed images after Firestore succeeds.
    const previousLogo = existing?.logo as ImageAsset | null | undefined;
    const previousFavicon = existing?.favicon as ImageAsset | null | undefined;

    const cleanupResults = await Promise.allSettled([
      previousLogo?.publicId &&
      previousLogo.publicId !== settings.logo?.publicId
        ? deleteGeneralImage(previousLogo.publicId)
        : Promise.resolve("skipped" as const),

      previousFavicon?.publicId &&
      previousFavicon.publicId !== settings.favicon?.publicId
        ? deleteGeneralImage(previousFavicon.publicId)
        : Promise.resolve("skipped" as const),
    ]);

    const cleanupWarnings = cleanupResults
      .map((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to delete previous ${index === 0 ? "logo" : "favicon"}:`,
            result.reason,
          );

          return `${index === 0 ? "Logo" : "Favicon"} cleanup failed.`;
        }

        if (
          result.value === "skipped" &&
          (index === 0
            ? previousLogo?.publicId !== settings.logo?.publicId
            : previousFavicon?.publicId !== settings.favicon?.publicId)
        ) {
          return `${index === 0 ? "Logo" : "Favicon"} was not deleted.`;
        }

        return null;
      })
      .filter((warning): warning is string => warning !== null);

    return NextResponse.json({
      message: "General settings saved successfully.",
      settings,
      cleanupWarnings,
    });
  } catch (error) {
    console.error("Failed to update general settings:", error);

    return NextResponse.json(
      { error: "Failed to save general settings." },
      { status: 500 },
    );
  }
}
