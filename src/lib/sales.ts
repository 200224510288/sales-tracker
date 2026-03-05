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

export async function deleteSaleItem(dateId: string, id: string): Promise<void> {
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

/**
 * dateId is "YYYY-MM-DD"
 * Returns month start/end strings:
 * - start: "YYYY-MM-01"
 * - endExclusive: first day of next month "YYYY-MM-01"
 *
 * String compare works because ISO dates sort lexicographically.
 */
function getMonthRangeStr(dateId: string): { start: string; endExclusive: string; monthId: string } {
  const d = new Date(dateId + "T00:00:00");
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12

  const start = `${year}-${String(month).padStart(2, "0")}-01`;

  const next = new Date(year, month, 1); // first day next month
  const endExclusive = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

  const monthId = `${year}-${String(month).padStart(2, "0")}`;

  return { start, endExclusive, monthId };
}

/**
 * ✅ Monthly commission summary (quantity-based)
 * - Sums net (treated as quantity) across all days in month
 * - Uses salesDays doc field: { date: "YYYY-MM-DD" }
 */
export async function getMonthlyCommissionSummary(dateId: string): Promise<{
  monthId: string; // YYYY-MM
  nlbQty: number;
  dlbQty: number;
  totalQty: number;
}> {
  const { start, endExclusive, monthId } = getMonthRangeStr(dateId);

  // Get all salesDays ordered by date (string)
  const daysQ = query(collection(db, "salesDays"), orderBy("date", "asc"));
  const daySnap = await getDocs(daysQ);

  let nlbQty = 0;
  let dlbQty = 0;

  for (const dayDoc of daySnap.docs) {
    const day = dayDoc.data() as { date?: string };

    // Safety: skip malformed docs
    if (!day.date) continue;

    // Only include days within the month
    if (day.date < start || day.date >= endExclusive) continue;

    // Sum items of that day
    const itemsSnap = await getDocs(collection(db, "salesDays", dayDoc.id, "items"));
    itemsSnap.forEach((itemDoc) => {
      const x = itemDoc.data() as Omit<SaleItem, "id">;

      // ✅ net is quantity in your logic
      const qty = Number(x.net || 0);

      if (x.board === "NLB") nlbQty += qty;
      if (x.board === "DLB") dlbQty += qty;
    });
  }

  return {
    monthId,
    nlbQty,
    dlbQty,
    totalQty: nlbQty + dlbQty,
  };
}


/**
 * monthId: "YYYY-MM"
 * Sums net (quantity) across all salesDays within that month.
 */
export async function getMonthlyCommissionSummaryByMonth(monthId: string): Promise<{
  monthId: string;
  nlbQty: number;
  dlbQty: number;
  totalQty: number;
}> {
  const start = `${monthId}-01`; // YYYY-MM-01

  // endExclusive = first day of next month, as string
  const [yStr, mStr] = monthId.split("-");
  const y = Number(yStr);
  const m = Number(mStr); // 1-12
  const next = new Date(y, m, 1); // JS month index: m means next month because m is 1-based here
  const endExclusive = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

  const daysQ = query(collection(db, "salesDays"), orderBy("date", "asc"));
  const daySnap = await getDocs(daysQ);

  let nlbQty = 0;
  let dlbQty = 0;

  for (const dayDoc of daySnap.docs) {
    const day = dayDoc.data() as { date?: string };
    if (!day.date) continue;

    if (day.date < start || day.date >= endExclusive) continue;

    const itemsSnap = await getDocs(collection(db, "salesDays", dayDoc.id, "items"));
    itemsSnap.forEach((itemDoc) => {
      const x = itemDoc.data() as Omit<SaleItem, "id">;
      const qty = Number(x.net || 0); // net = quantity
      if (x.board === "NLB") nlbQty += qty;
      if (x.board === "DLB") dlbQty += qty;
    });
  }

  return { monthId, nlbQty, dlbQty, totalQty: nlbQty + dlbQty };
}


export async function getMonthlyReturnSummaryByMonth(monthId: string): Promise<{
  monthId: string;
  nlbGross: number;
  dlbGross: number;
  totalGross: number;
  nlbReturn: number; // deduction
  dlbReturn: number; // deduction
  totalReturn: number; // deduction
  returnPct: number; // totalReturn / totalGross * 100
}> {
  const start = `${monthId}-01`;

  const [yStr, mStr] = monthId.split("-");
  const y = Number(yStr);
  const m = Number(mStr); // 1..12
  const next = new Date(y, m, 1);
  const endExclusive = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

  const daysQ = query(collection(db, "salesDays"), orderBy("date", "asc"));
  const daySnap = await getDocs(daysQ);

  let nlbGross = 0;
  let dlbGross = 0;
  let nlbReturn = 0;
  let dlbReturn = 0;

  for (const dayDoc of daySnap.docs) {
    const day = dayDoc.data() as { date?: string };
    if (!day.date) continue;

    if (day.date < start || day.date >= endExclusive) continue;

    const itemsSnap = await getDocs(collection(db, "salesDays", dayDoc.id, "items"));
    itemsSnap.forEach((itemDoc) => {
      const x = itemDoc.data() as Omit<SaleItem, "id">;

      const gross = Number(x.gross || 0);
      const ret = Number(x.deduction || 0); // ✅ return qty

      if (x.board === "NLB") {
        nlbGross += gross;
        nlbReturn += ret;
      } else if (x.board === "DLB") {
        dlbGross += gross;
        dlbReturn += ret;
      }
    });
  }

  const totalGross = nlbGross + dlbGross;
  const totalReturn = nlbReturn + dlbReturn;
  const returnPct = totalGross > 0 ? (totalReturn / totalGross) * 100 : 0;

  return {
    monthId,
    nlbGross,
    dlbGross,
    totalGross,
    nlbReturn,
    dlbReturn,
    totalReturn,
    returnPct,
  };
}

export type DailyTotalPoint = {
  dateId: string;     // YYYY-MM-DD
  totalQty: number;   // sum(net)
};

export async function listDailyTotals(): Promise<DailyTotalPoint[]> {
  const daysQ = query(collection(db, "salesDays"), orderBy("date", "asc"));
  const daySnap = await getDocs(daysQ);

  const points: DailyTotalPoint[] = [];

  // NOTE: This is N+1 reads (one per day). Fine for small/medium datasets.
  for (const dayDoc of daySnap.docs) {
    const day = dayDoc.data() as { date?: string };
    const dateId = day.date ?? dayDoc.id; // fallback to doc id if needed

    const itemsSnap = await getDocs(collection(db, "salesDays", dayDoc.id, "items"));

    let totalQty = 0;
    itemsSnap.forEach((itemDoc) => {
      const x = itemDoc.data() as Omit<SaleItem, "id">;
      totalQty += Number(x.net || 0); // ✅ net = quantity
    });

    points.push({ dateId, totalQty });
  }

  return points;
}

export type DailyCodePoint = {
  dateId: string;   // YYYY-MM-DD
  qty: number;      // sum(net) for that code on that date
};

export async function listDailyTotalsByCode(code: string): Promise<DailyCodePoint[]> {
  const daysQ = query(collection(db, "salesDays"), orderBy("date", "asc"));
  const daySnap = await getDocs(daysQ);

  const points: DailyCodePoint[] = [];

  for (const dayDoc of daySnap.docs) {
    const day = dayDoc.data() as { date?: string };
    const dateId = day.date ?? dayDoc.id;

    const itemsSnap = await getDocs(collection(db, "salesDays", dayDoc.id, "items"));

    let qty = 0;
    itemsSnap.forEach((itemDoc) => {
      const x = itemDoc.data() as Omit<SaleItem, "id">;
      if ((x.code || "").trim().toUpperCase() === code.trim().toUpperCase()) {
        qty += Number(x.net || 0); // ✅ net = quantity
      }
    });

    // Keep zero days too (helps patterns). If you want only non-zero, add: if (qty > 0)
    points.push({ dateId, qty });
  }

  return points;
}