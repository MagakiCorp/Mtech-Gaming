import { NextRequest, NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/auth/api-session";
import {
  deleteCategoryImage,
  deleteHomepageImage,
  deleteProductImage,
  deletePromotionImage,
  deleteTestimonialImage,
} from "@/lib/cloudinary-cleanup";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const publicIds: unknown = body.publicIds;

    if (
      !Array.isArray(publicIds) ||
      publicIds.length > 30 ||
      !publicIds.every((id) => typeof id === "string")
    ) {
      return NextResponse.json(
        { error: "Invalid image cleanup request." },
        { status: 400 },
      );
    }

    const uniqueIds = [...new Set(publicIds as string[])];

    const results = await Promise.allSettled(
      uniqueIds.map((publicId) => {
        if (publicId.startsWith("m-tech/categories/")) {
          return deleteCategoryImage(publicId);
        }
        if (publicId.startsWith("m-tech/homepage/")) {
          return deleteHomepageImage(publicId);
        }
        if (publicId.startsWith("m-tech/promotions/")) {
          return deletePromotionImage(publicId);
        }

        if (publicId.startsWith("m-tech/testimonials/")) {
          return deleteTestimonialImage(publicId);
        }

        return deleteProductImage(publicId);
      }),
    );

    const failedIds = results.flatMap((result, index) =>
      result.status === "rejected" ? [uniqueIds[index]] : [],
    );

    if (failedIds.length > 0) {
      console.error(
        "Some Cloudinary images could not be cleaned up:",
        failedIds,
      );

      return NextResponse.json(
        { error: "Some images could not be deleted.", failedIds },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Temporary images cleaned up." });
  } catch (error) {
    console.error("Cloudinary cleanup request failed:", error);

    return NextResponse.json(
      { error: "Unable to clean up temporary images." },
      { status: 500 },
    );
  }
}
