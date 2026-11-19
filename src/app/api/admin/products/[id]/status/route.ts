import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authenticated = await hasAdminSession();

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "A valid active status is required." },
        { status: 400 },
      );
    }

    const productRef = adminDb.collection("products").doc(id);
    const productSnapshot = await productRef.get();

    if (!productSnapshot.exists) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    await productRef.update({
      active: body.active,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: body.active
        ? "Product activated successfully."
        : "Product deactivated successfully.",
      active: body.active,
    });
  } catch (error) {
    console.error("Product status update failed:", error);

    return NextResponse.json(
      { error: "Unable to update product status." },
      { status: 500 },
    );
  }
}
