import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { SaleItem } from "./types";

export async function ensureSalesDay(dateId: string): Promise<void> {
  await setDoc(
    doc(db, "salesDays", dateId),
    { date: dateId, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function addSaleItem(
  dateId: string,
  item: Omit<SaleItem, "id">
): Promise<void> {
  await addDoc(collection(db, "salesDays", dateId, "items"), {
    ...item,
    createdAt: serverTimestamp(),
  });
}

export async function getSaleItems(dateId: string): Promise<SaleItem[]> {
  const q = query(
    collection(db, "salesDays", dateId, "items"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<SaleItem, "id">),
  }));
}

export async function deleteSaleItem(
  dateId: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(db, "salesDays", dateId, "items", id));
}

export async function updateSaleItem(dateId: string, item: SaleItem): Promise<void> {
  if (!item.id) return;

  await updateDoc(doc(db, "salesDays", dateId, "items", item.id), {
    board: item.board,
    code: item.code,
    gross: item.gross,
    deduction: item.deduction,
    net: item.gross - item.deduction,
  });
}
