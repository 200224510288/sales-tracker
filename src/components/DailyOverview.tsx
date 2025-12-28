"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SaleItem } from "@/lib/types";
import { getSaleItems } from "@/lib/sales";
import { getLocalISODate } from "@/lib/date";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DailyOverview() {
  const [dateId, setDateId] = useState<string>(getLocalISODate());
  const [items, setItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Local-safe quick dates
  function today(): string {
    return getLocalISODate();
  }
  function yesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalISODate(d);
  }

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        setError("");
        setIsLoading(true);
        const data = await getSaleItems(dateId);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load totals");
          setItems([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dateId]);

  const totals = useMemo(() => {
    const nlb = items.filter((x) => x.board === "NLB").reduce((s, x) => s + x.net, 0);
    const dlb = items.filter((x) => x.board === "DLB").reduce((s, x) => s + x.net, 0);
    return { nlb, dlb, grand: nlb + dlb };
  }, [items]);

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Overview</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quick totals for owner review
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div>
            <label htmlFor="overview-date" className="block text-xs font-bold text-gray-600 mb-1">
              Date
            </label>
            <input
              id="overview-date"
              type="date"
              value={dateId}
              onChange={(e) => setDateId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-5 sm:pt-0">
            <button
              onClick={() => setDateId(today())}
              className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                dateId === today()
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateId(yesterday())}
              className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                dateId === yesterday()
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Yesterday
            </button>
          </div>

          <Link
            href={`/sales?date=${dateId}`}
            className="px-5 py-2 rounded font-bold bg-green-600 text-white hover:bg-green-700 transition-colors text-center"
          >
            Enter Sales
          </Link>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700 font-semibold">
        {formatDisplayDate(dateId)}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-gray-50 border border-gray-200 rounded p-6">
          <p className="text-sm font-bold text-gray-600 uppercase mb-2">NLB Total</p>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "…" : formatCurrency(totals.nlb)}
          </p>
          <p className="text-xs text-gray-500 mt-3">
            Net total (NLB)
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-6">
          <p className="text-sm font-bold text-gray-600 uppercase mb-2">DLB Total</p>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "…" : formatCurrency(totals.dlb)}
          </p>
          <p className="text-xs text-gray-500 mt-3">
            Net total (DLB)
          </p>
        </div>

        <div className="bg-blue-900 text-white rounded p-6">
          <p className="text-sm font-bold text-blue-100 uppercase mb-2">Total Sales</p>
          <p className="text-3xl font-bold">
            {isLoading ? "…" : formatCurrency(totals.grand)}
          </p>
          <p className="text-xs text-blue-200 mt-3">
            Grand net total
          </p>
        </div>
      </div>
    </section>
  );
}
