import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryConstraint,
  type UpdateData,
  type WithFieldValue,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { DocumentWithId } from "@/types";

export async function createRecord<T extends object>(
  collectionName: string,
  data: T,
): Promise<string> {
  const ref = doc(collection(db, collectionName));

  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as WithFieldValue<DocumentData>);

  return ref.id;
}
export async function getRecord<T>(
  collectionName: string,
  id: string,
): Promise<DocumentWithId<T> | null> {
  const ref = doc(db, collectionName, id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    ...snapshot.data(),
    id: snapshot.id,
  } as DocumentWithId<T>;
}

export async function getRecords<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<DocumentWithId<T>[]> {
  const ref = collection(db, collectionName);

  const q = query(ref, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  })) as DocumentWithId<T>[];
}

export async function updateRecord<T extends object>(
  collectionName: string,
  id: string,
  data: Partial<T>,
): Promise<void> {
  const ref = doc(db, collectionName, id);

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  } as UpdateData<DocumentData>);
}

export async function deleteRecord(
  collectionName: string,
  id: string,
): Promise<void> {
  const ref = doc(db, collectionName, id);

  await deleteDoc(ref);
}
