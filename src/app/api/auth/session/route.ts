import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "__session";
const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin inside the try/catch.
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");

    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "Authentication token is required." },
        { status: 400 },
      );
    }

    let decodedToken;

    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Firebase ID token verification failed:", error);

      return NextResponse.json(
        { error: "Invalid or expired authentication token." },
        { status: 401 },
      );
    }

    // Check administrator authorization.
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

    // Create the server-side session cookie.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION,
    });

    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    return response;
  } catch (error) {
    console.error("Session creation server error:", error);

    return NextResponse.json(
      { error: "A server error occurred while creating your session." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
