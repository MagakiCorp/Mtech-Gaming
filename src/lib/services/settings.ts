import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { SettingsMap } from "@/types";

export async function getSettings<K extends keyof SettingsMap>(
  documentId: K,
): Promise<SettingsMap[K] | null> {
  const ref = doc(db, "settings", documentId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as SettingsMap[K];
}

export async function updateSettings<K extends keyof SettingsMap>(
  documentId: K,
  data: Partial<SettingsMap[K]>,
): Promise<void> {
  const ref = doc(db, "settings", documentId);

  await setDoc(
    ref,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
