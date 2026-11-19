import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";
import type { ProductInput } from "@/types";
import { deleteProductImage } from "@/lib/cloudinary-cleanup";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function getProductImagePublicIds(images: unknown): string[] {
  if (!images || typeof images !== "object") {
    return [];
  }

  const imageData = images as {
    main?: { publicId?: unknown };
    gallery?: { publicId?: unknown }[];
  };

  const publicIds: string[] = [];

  if (typeof imageData.main?.publicId === "string") {
    publicIds.push(imageData.main.publicId);
  }

  if (Array.isArray(imageData.gallery)) {
    for (const image of imageData.gallery) {
      if (typeof image?.publicId === "string") {
        publicIds.push(image.publicId);
      }
    }
  }

  return [...new Set(publicIds)];
}

async function cleanupProductImages(publicIds: string[]) {
  for (const publicId of [...new Set(publicIds)]) {
    try {
      await deleteProductImage(publicId);
    } catch (error) {
      console.error(`Failed to clean up product image ${publicId}:`, error);
    }
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as ProductInput;

    const productRef = adminDb.collection("products").doc(id);
    const existingProduct = await productRef.get();

    if (!existingProduct.exists) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const {
      name,
      slug,
      description,
      categoryId,
      brand,
      pricing,
      images,
      specifications,
      availability,
      featured,
      bestSeller,
      newArrival,
      active,
      sortOrder,
      seo,
    } = body;

    if (!name?.trim() || !slug?.trim() || !categoryId) {
      return NextResponse.json(
        { error: "Name, slug and category are required." },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        { error: "The slug format is invalid." },
        { status: 400 },
      );
    }

    if (!images?.main?.url || !images.main.publicId) {
      return NextResponse.json(
        { error: "A main product image is required." },
        { status: 400 },
      );
    }

    if (!pricing || !["fixed", "range", "on_request"].includes(pricing.type)) {
      return NextResponse.json(
        { error: "Invalid pricing configuration." },
        { status: 400 },
      );
    }

    if (
      pricing.type === "fixed" &&
      (typeof pricing.min !== "number" ||
        !Number.isFinite(pricing.min) ||
        pricing.min < 0)
    ) {
      return NextResponse.json(
        { error: "Enter a valid fixed price." },
        { status: 400 },
      );
    }

    if (
      pricing.type === "range" &&
      (typeof pricing.min !== "number" ||
        typeof pricing.max !== "number" ||
        !Number.isFinite(pricing.min) ||
        !Number.isFinite(pricing.max) ||
        pricing.min < 0 ||
        pricing.max < pricing.min)
    ) {
      return NextResponse.json(
        { error: "Enter a valid price range." },
        { status: 400 },
      );
    }

    const currentCategoryId = existingProduct.data()?.categoryId;

    const categorySnapshot = await adminDb
      .collection("categories")
      .doc(categoryId)
      .get();

    const isKeepingCurrentCategory = categoryId === currentCategoryId;

    if (
      !categorySnapshot.exists ||
      (categorySnapshot.data()?.active !== true && !isKeepingCurrentCategory)
    ) {
      return NextResponse.json(
        {
          error:
            "Please select an active category. An inactive category can only be retained if it is already assigned to this product.",
        },
        { status: 400 },
      );
    }

    const duplicateSlug = await adminDb
      .collection("products")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!duplicateSlug.empty && duplicateSlug.docs[0].id !== id) {
      return NextResponse.json(
        { error: "Another product already uses this slug." },
        { status: 409 },
      );
    }

    const oldImageIds = getProductImagePublicIds(
      existingProduct.data()?.images,
    );

    const newImageIds = getProductImagePublicIds(images);

    const removedImageIds = oldImageIds.filter(
      (publicId) => !newImageIds.includes(publicId),
    );

    await productRef.update({
      name: name.trim(),
      slug: slug.trim(),
      description: description ?? "",
      categoryId,
      brand: brand?.trim() ?? "",
      pricing: {
        type: pricing.type,
        min: pricing.type === "on_request" ? null : pricing.min,
        max: pricing.type === "range" ? pricing.max : null,
        currency: "KES",
      },
      images,
      specifications: specifications ?? [],
      availability,
      featured: featured === true,
      bestSeller: bestSeller === true,
      newArrival: newArrival === true,
      active: active === true,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      seo: seo ?? { title: "", description: "" },
      updatedAt: FieldValue.serverTimestamp(),
    });

    await cleanupProductImages(removedImageIds);

    return NextResponse.json({
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("Product update failed:", error);

    return NextResponse.json(
      { error: "Unable to update product." },
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

    const productRef = adminDb.collection("products").doc(id);
    const productSnapshot = await productRef.get();

    if (!productSnapshot.exists) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const imageIds = getProductImagePublicIds(productSnapshot.data()?.images);

    // Delete the Firestore document first.
    await productRef.delete();

    // Then clean up its Cloudinary images.
    await cleanupProductImages(imageIds);

    return NextResponse.json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Product deletion failed:", error);

    return NextResponse.json(
      { error: "Unable to delete product." },
      { status: 500 },
    );
  }
}