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

    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "A valid active status is required." },
        { status: 400 },
      );
    }

    const categoryRef = adminDb.collection("categories").doc(id);
    const category = await categoryRef.get();

    if (!category.exists) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 },
      );
    }

    await categoryRef.update({
      active: body.active,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      message: body.active
        ? "Category activated successfully."
        : "Category deactivated successfully.",
      active: body.active,
    });
  } catch (error) {
    console.error("Category status update failed:", error);

    return NextResponse.json(
      { error: "Unable to update category status." },
      { status: 500 },
    );
  }
}
