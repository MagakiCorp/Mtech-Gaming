import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";
import { deleteCategoryImage } from "@/lib/cloudinary-cleanup";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CategoryImage = {
  url: string;
  publicId: string;
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

    const imageData = image as CategoryImage;

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
      image: image as CategoryImage | null,
      parentId,
      active: data.active,
      sortOrder,
      seo: {
        title: seoData.title.trim(),
        description: seoData.description.trim(),
      },
    },
  };
}

async function validateParent(
  categoryId: string,
  parentId: string | null,
): Promise<string | null> {
  if (!parentId) return null;

  const visited = new Set<string>();
  let currentId: string | null = parentId;

  while (currentId) {
    if (currentId === categoryId) {
      return "A category cannot be its own parent or a descendant of itself.";
    }

    if (visited.has(currentId)) {
      return "The selected parent hierarchy contains a cycle.";
    }

    visited.add(currentId);

    const snapshot = await adminDb
      .collection("categories")
      .doc(currentId)
      .get();

    if (!snapshot.exists) {
      return "The selected parent category does not exist.";
    }

    const parentData = snapshot.data();

    currentId =
      typeof parentData?.parentId === "string" ? parentData.parentId : null;
  }

  return null;
}

async function cleanupOldImage(publicId: string | null) {
  if (!publicId) return;

  try {
    const result = await deleteCategoryImage(publicId);

    if (result === "skipped") {
      console.warn(
        `Skipped category image cleanup because the asset is outside the allowed folder: ${publicId}`,
      );
    }
  } catch (error) {
    // Firestore has already been updated/deleted.
    // Do not turn a successful category operation into an API failure.
    console.error("Category image cleanup failed:", publicId, error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
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
    const categoryRef = adminDb.collection("categories").doc(id);
    const current = await categoryRef.get();

    if (!current.exists) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 },
      );
    }

    const parentError = await validateParent(id, category.parentId);

    if (parentError) {
      return NextResponse.json({ error: parentError }, { status: 400 });
    }

    const duplicate = await adminDb
      .collection("categories")
      .where("slug", "==", category.slug)
      .limit(2)
      .get();

    if (duplicate.docs.some((doc) => doc.id !== id)) {
      return NextResponse.json(
        { error: "A category with this slug already exists." },
        { status: 409 },
      );
    }

    const oldPublicId = getImagePublicId(current.data()?.image);
    const newPublicId = category.image?.publicId ?? null;

    // Save Firestore first. Never delete the old image before this succeeds.
    await categoryRef.update({
      ...category,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Replacing or removing an image triggers cleanup.
    if (oldPublicId && oldPublicId !== newPublicId) {
      await cleanupOldImage(oldPublicId);
    }

    return NextResponse.json({
      message: "Category updated successfully.",
    });
  } catch (error) {
    console.error("Category update failed:", error);

    return NextResponse.json(
      { error: "Unable to update category." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const categoryRef = adminDb.collection("categories").doc(id);
    const category = await categoryRef.get();

    if (!category.exists) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 },
      );
    }

    const [products, children] = await Promise.all([
      adminDb
        .collection("products")
        .where("categoryId", "==", id)
        .limit(1)
        .get(),

      adminDb
        .collection("categories")
        .where("parentId", "==", id)
        .limit(1)
        .get(),
    ]);

    if (!products.empty) {
      return NextResponse.json(
        {
          error:
            "This category cannot be deleted because products are assigned to it. Reassign those products first.",
        },
        { status: 409 },
      );
    }

    if (!children.empty) {
      return NextResponse.json(
        {
          error:
            "This category cannot be deleted because it has subcategories. Reassign or delete those first.",
        },
        { status: 409 },
      );
    }

    const imagePublicId = getImagePublicId(category.data()?.image);

    // Delete Firestore first.
    await categoryRef.delete();

    // Only after successful deletion, attempt Cloudinary cleanup.
    await cleanupOldImage(imagePublicId);

    return NextResponse.json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Category deletion failed:", error);

    return NextResponse.json(
      { error: "Unable to delete category." },
      { status: 500 },
    );
  }
}
