import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

const COOKIE_NAME = "__session";

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect("/admin/login");
  }

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect("/admin/login");
  }

  const adminSnapshot = await adminDb
    .collection("admins")
    .doc(decodedToken.uid)
    .get();

  if (!adminSnapshot.exists || adminSnapshot.data()?.active !== true) {
    redirect("/admin/login");
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? "",
    displayName: adminSnapshot.data()?.displayName ?? "Administrator",
  };
}
