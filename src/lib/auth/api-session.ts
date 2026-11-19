import "server-only";

import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function hasAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
      return false;
    }

    const decodedToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true,
    );

    const adminSnapshot = await adminDb
      .collection("admins")
      .doc(decodedToken.uid)
      .get();

    return adminSnapshot.exists && adminSnapshot.data()?.active === true;
  } catch {
    return false;
  }
}
