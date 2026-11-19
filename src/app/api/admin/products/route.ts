import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";
import type { ProductInput } from "@/types";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ProductInput;

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

    const categorySnapshot = await adminDb
      .collection("categories")
      .doc(categoryId)
      .get();

    if (!categorySnapshot.exists || categorySnapshot.data()?.active !== true) {
      return NextResponse.json(
        { error: "Please select an active category." },
        { status: 400 },
      );
    }

    const existingProduct = await adminDb
      .collection("products")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!existingProduct.empty) {
      return NextResponse.json(
        { error: "A product with this slug already exists." },
        { status: 409 },
      );
    }

    const productData = {
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const productRef = adminDb.collection("products").doc();

    await productRef.set(productData);

    return NextResponse.json(
      {
        message: "Product created successfully.",
        id: productRef.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Product creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create product." },
      { status: 500 },
    );
  }
}
