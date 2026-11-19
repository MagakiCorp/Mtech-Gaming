import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";

function validateCategory(data: Record<string, unknown>) {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const slug = typeof data.slug === "string" ? data.slug.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const parentId =
    typeof data.parentId === "string" && data.parentId.trim()
      ? data.parentId.trim()
      : null;
  const sortOrder = Number(data.sortOrder);

  if (!name || name.length > 100) {
    return { error: "Enter a category name (maximum 100 characters)." };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Enter a valid URL slug." };
  }

  if (description.length > 1000) {
    return { error: "Description cannot exceed 1,000 characters." };
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return { error: "Sort order must be a non-negative whole number." };
  }

  if (typeof data.active !== "boolean") {
    return { error: "A valid category status is required." };
  }

  const image = data.image;

  if (image !== null) {
    if (
      !image ||
      typeof image !== "object" ||
      typeof (image as Record<string, unknown>).url !== "string" ||
      typeof (image as Record<string, unknown>).publicId !== "string"
    ) {
      return { error: "The category image is invalid." };
    }

    const imageData = image as { url: string; publicId: string };

    try {
      if (new URL(imageData.url).protocol !== "https:") {
        return { error: "Category images must use a secure URL." };
      }
    } catch {
      return { error: "Enter a valid category image URL." };
    }

    if (!imageData.publicId.trim()) {
      return { error: "The category image public ID is missing." };
    }
  }

  const seo = data.seo;

  if (
    !seo ||
    typeof seo !== "object" ||
    typeof (seo as Record<string, unknown>).title !== "string" ||
    typeof (seo as Record<string, unknown>).description !== "string"
  ) {
    return { error: "Valid SEO details are required." };
  }

  const seoData = seo as { title: string; description: string };

  if (seoData.title.length > 160 || seoData.description.length > 320) {
    return { error: "SEO title or description is too long." };
  }

  return {
    value: {
      name,
      slug,
      description,
      image: image as { url: string; publicId: string } | null,
      parentId,
      active: data.active === true,
      sortOrder,
      seo: {
        title: seoData.title.trim(),
        description: seoData.description.trim(),
      },
    },
  };
}

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 },
      );
    }

    const validation = validateCategory(body);

    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const category = validation.value;

    const duplicate = await adminDb
      .collection("categories")
      .where("slug", "==", category.slug)
      .limit(1)
      .get();

    if (!duplicate.empty) {
      return NextResponse.json(
        { error: "A category with this slug already exists." },
        { status: 409 },
      );
    }

    if (category.parentId) {
      const parent = await adminDb
        .collection("categories")
        .doc(category.parentId)
        .get();

      if (!parent.exists) {
        return NextResponse.json(
          { error: "The selected parent category does not exist." },
          { status: 400 },
        );
      }
    }

    const categoryRef = adminDb.collection("categories").doc();

    await categoryRef.set({
      ...category,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        message: "Category created successfully.",
        id: categoryRef.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Category creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create category." },
      { status: 500 },
    );
  }
}
