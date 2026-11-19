import { NextRequest, NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COOKIE_NAME = "__session";
const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "Authentication token is required." },
        { status: 400 },
      );
    }

    // Verify the Firebase ID token.
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check whether this user is an active administrator.
    const adminSnapshot = await adminDb
      .collection("admins")
      .doc(decodedToken.uid)
      .get();

    if (!adminSnapshot.exists || adminSnapshot.data()?.active !== true) {
      return NextResponse.json(
        { error: "You are not authorized to access the admin area." },
        { status: 403 },
      );
    }

    // Create a server-side session cookie.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION,
    });

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    return response;
  } catch (error) {
    console.error("Session creation failed:", error);

    return NextResponse.json(
      { error: "Authentication failed. Please sign in again." },
      { status: 401 },
    );
  }
}

// Logout: remove the server-side session cookie.
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
