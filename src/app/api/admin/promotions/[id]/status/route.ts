import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { hasAdminSession } from "@/lib/auth/api-session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body || typeof body !== "object" || typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "A valid active status is required." },
        { status: 400 },
      );
    }

    const promotionRef = adminDb.collection("promotions").doc(id);
    const promotion = await promotionRef.get();

    if (!promotion.exists) {
      return NextResponse.json(
        { error: "Promotion not found." },
        { status: 404 },
      );
    }

    await promotionRef.update({
      active: body.active,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: body.active
        ? "Promotion activated successfully."
        : "Promotion deactivated successfully.",
      active: body.active,
    });
  } catch (error) {
    console.error("Promotion status update failed:", error);

    return NextResponse.json(
      { error: "Unable to update promotion status." },
      { status: 500 },
    );
  }
}
