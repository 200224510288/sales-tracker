"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SaleItem } from "@/lib/types";
import { getSaleItems, getMonthlyCommissionSummaryByMonth } from "@/lib/sales";
import { getLocalISODate } from "@/lib/date";

const COMMISSION_PER_TICKET = 0.5;

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

function monthIdFromDateId(dateId: string): string {
  return dateId.slice(0, 7); // YYYY-MM-DD -> YYYY-MM
}

export default function CommissionPage() {
  // ---- state
  const [dateId, setDateId] = useState<string>(getLocalISODate());
  const [monthId, setMonthId] = useState<string>(monthIdFromDateId(getLocalISODate()));

  const [dailyItems, setDailyItems] = useState<SaleItem[]>([]);
  const [dailyLoading, setDailyLoading] = useState<boolean>(true);
  const [dailyError, setDailyError] = useState<string>("");

  const [monthly, setMonthly] = useState<{
    monthId: string;
    nlbQty: number;
    dlbQty: number;
    totalQty: number;
  } | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState<boolean>(true);
  const [monthlyError, setMonthlyError] = useState<string>("");

  // ---- helpers
  function today(): string {
    return getLocalISODate();
  }

  function yesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalISODate(d);
  }

  // ---- load daily
  useEffect(() => {
    let cancelled = false;

    async function loadDaily(): Promise<void> {
      try {
        setDailyError("");
        setDailyLoading(true);
        const items = await getSaleItems(dateId);
        if (!cancelled) setDailyItems(items);
      } catch (err) {
        if (!cancelled) {
          setDailyError(err instanceof Error ? err.message : "Failed to load daily commission");
          setDailyItems([]);
        }
      } finally {
        if (!cancelled) setDailyLoading(false);
      }
    }

    loadDaily();
    return () => {
      cancelled = true;
    };
  }, [dateId]);

  // ---- load monthly
  useEffect(() => {
    let cancelled = false;

    async function loadMonthly(): Promise<void> {
      try {
        setMonthlyError("");
        setMonthlyLoading(true);
        const m = await getMonthlyCommissionSummaryByMonth(monthId);
        if (!cancelled) setMonthly(m);
      } catch (err) {
        if (!cancelled) {
          setMonthlyError(err instanceof Error ? err.message : "Failed to load monthly commission");
          setMonthly(null);
        }
      } finally {
        if (!cancelled) setMonthlyLoading(false);
      }
    }

    loadMonthly();
    return () => {
      cancelled = true;
    };
  }, [monthId]);

  // ---- compute daily summary (net = quantity)
  const daily = useMemo(() => {
    const nlbQty = dailyItems.filter((x) => x.board === "NLB").reduce((s, x) => s + x.net, 0);
    const dlbQty = dailyItems.filter((x) => x.board === "DLB").reduce((s, x) => s + x.net, 0);
    const totalQty = nlbQty + dlbQty;

    return {
      nlbQty,
      dlbQty,
      totalQty,
      nlbCommission: nlbQty * COMMISSION_PER_TICKET,
      dlbCommission: dlbQty * COMMISSION_PER_TICKET,
      totalCommission: totalQty * COMMISSION_PER_TICKET,
    };
  }, [dailyItems]);

  // ---- compute monthly summary (already aggregated)
  const monthlyComputed = useMemo(() => {
    const nlbQty = monthly?.nlbQty ?? 0;
    const dlbQty = monthly?.dlbQty ?? 0;
    const totalQty = monthly?.totalQty ?? 0;

    return {
      monthId: monthly?.monthId ?? monthId,
      nlbQty,
      dlbQty,
      totalQty,
      nlbCommission: nlbQty * COMMISSION_PER_TICKET,
      dlbCommission: dlbQty * COMMISSION_PER_TICKET,
      totalCommission: totalQty * COMMISSION_PER_TICKET,
    };
  }, [monthly, monthId]);

  // ---- breakdown rows (daily)
  const rows = useMemo(() => {
    return dailyItems
      .slice()
      .sort((a, b) => (a.board + a.code).localeCompare(b.board + b.code))
      .map((x) => ({
        board: x.board,
        code: x.code,
        qty: x.net,
        commission: x.net * COMMISSION_PER_TICKET,
      }));
  }, [dailyItems]);

  return (
<main className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
          {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Standard rule: <span className="font-semibold">Commission = Quantity × Rs 0.50</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-md font-bold bg-gray-900 text-white hover:bg-black transition-colors"
          >
            Back
          </Link>
          <Link
            href={`/sales?date=${dateId}`}
            className="px-4 py-2 rounded-md font-bold bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Enter Sales
          </Link>
        </div>
      </div>

      {/* Controls Card */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          <p className="text-sm text-gray-600 mt-1">Select a day for daily breakdown, and a month for monthly totals.</p>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily control */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Daily</p>
                <p className="text-xs text-gray-600 mt-1">{formatDisplayDate(dateId)}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setDateId(today())}
                  className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${
                    dateId === today()
                      ? "bg-blue-900 text-white"
                      : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateId(yesterday())}
                  className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${
                    dateId === yesterday()
                      ? "bg-blue-900 text-white"
                      : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="daily-date" className="block text-xs font-bold text-gray-600 mb-1">
                Select Date
              </label>
              <input
                id="daily-date"
                type="date"
                value={dateId}
                onChange={(e) => {
                  const v = e.target.value;
                  setDateId(v);
                  // optional: auto-align month selector to the same month
                  setMonthId(v.slice(0, 7));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Monthly control */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Monthly</p>
                <p className="text-xs text-gray-600 mt-1">Selected: {monthId}</p>
              </div>

              <button
                onClick={() => setMonthId(monthIdFromDateId(getLocalISODate()))}
                className="px-3 py-2 rounded-md text-sm font-bold bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 transition-colors"
              >
                Current Month
              </button>
            </div>

            <div className="mt-3">
              <label htmlFor="monthly-month" className="block text-xs font-bold text-gray-600 mb-1">
                Select Month
              </label>
              <input
                id="monthly-month"
                type="month"
                value={monthId}
                onChange={(e) => setMonthId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {(dailyError || monthlyError) && (
        <div className="mt-4 space-y-2">
          {dailyError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-semibold">
              Daily: {dailyError}
            </div>
          )}
          {monthlyError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-semibold">
              Monthly: {monthlyError}
            </div>
          )}
        </div>
      )}

      {/* Daily Summary Cards */}
      <div className="mt-6">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-bold text-gray-900">Daily Summary</h2>
          <p className="text-xs text-gray-500">Date: {dateId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <p className="text-sm font-bold text-gray-600 uppercase mb-2">NLB</p>
            <p className="text-3xl font-bold text-gray-900">{dailyLoading ? "…" : daily.nlbQty}</p>
            <p className="text-xs text-gray-500 mt-2">Quantity</p>
            <p className="mt-3 text-sm font-bold text-green-700">
              Commission: Rs {dailyLoading ? "…" : formatCurrency(daily.nlbCommission)}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <p className="text-sm font-bold text-gray-600 uppercase mb-2">DLB</p>
            <p className="text-3xl font-bold text-gray-900">{dailyLoading ? "…" : daily.dlbQty}</p>
            <p className="text-xs text-gray-500 mt-2">Quantity</p>
            <p className="mt-3 text-sm font-bold text-green-700">
              Commission: Rs {dailyLoading ? "…" : formatCurrency(daily.dlbCommission)}
            </p>
          </div>

          <div className="bg-blue-900 text-white rounded-xl shadow-sm p-6">
            <p className="text-sm font-bold text-blue-100 uppercase mb-2">Total</p>
            <p className="text-3xl font-bold">{dailyLoading ? "…" : daily.totalQty}</p>
            <p className="text-xs text-blue-200 mt-2">Total quantity</p>
            <p className="mt-3 text-sm font-bold text-emerald-200">
              Commission: Rs {dailyLoading ? "…" : formatCurrency(daily.totalCommission)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-bold text-gray-900">Monthly Summary</h2>
          <p className="text-xs text-gray-500">Month: {monthId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <p className="text-sm font-bold text-gray-600 uppercase mb-2">NLB</p>
            <p className="text-3xl font-bold text-gray-900">{monthlyLoading ? "…" : monthlyComputed.nlbQty}</p>
            <p className="text-xs text-gray-500 mt-2">Monthly quantity</p>
            <p className="mt-3 text-sm font-bold text-green-700">
              Commission: Rs {monthlyLoading ? "…" : formatCurrency(monthlyComputed.nlbCommission)}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <p className="text-sm font-bold text-gray-600 uppercase mb-2">DLB</p>
            <p className="text-3xl font-bold text-gray-900">{monthlyLoading ? "…" : monthlyComputed.dlbQty}</p>
            <p className="text-xs text-gray-500 mt-2">Monthly quantity</p>
            <p className="mt-3 text-sm font-bold text-green-700">
              Commission: Rs {monthlyLoading ? "…" : formatCurrency(monthlyComputed.dlbCommission)}
            </p>
          </div>

          <div className="bg-indigo-900 text-white rounded-xl shadow-sm p-6">
            <p className="text-sm font-bold text-indigo-100 uppercase mb-2">Total</p>
            <p className="text-3xl font-bold">{monthlyLoading ? "…" : monthlyComputed.totalQty}</p>
            <p className="text-xs text-indigo-200 mt-2">Monthly total quantity</p>
            <p className="mt-3 text-sm font-bold text-emerald-200">
              Commission: Rs {monthlyLoading ? "…" : formatCurrency(monthlyComputed.totalCommission)}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="mt-10 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Daily Breakdown</h3>
            <p className="text-xs text-gray-500 mt-1">Per item commission (Board + Code)</p>
          </div>
          <div className="text-xs text-gray-500">
            Rule: Qty × Rs {COMMISSION_PER_TICKET.toFixed(2)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left">
                <th className="px-6 py-3 font-bold text-gray-600">Board</th>
                <th className="px-6 py-3 font-bold text-gray-600">Code</th>
                <th className="px-6 py-3 font-bold text-gray-600">Quantity</th>
                <th className="px-6 py-3 font-bold text-gray-600">Commission (Rs)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {dailyLoading ? (
                <tr>
                  <td className="px-6 py-5 text-gray-600" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-6 py-5 text-gray-600" colSpan={4}>
                    No items found for this date.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={`${r.board}-${r.code}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">{r.board}</td>
                    <td className="px-6 py-3 text-gray-800">{r.code}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900">{r.qty}</td>
                    <td className="px-6 py-3 font-bold text-green-700">{formatCurrency(r.commission)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary line */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800">
            Daily total commission:{" "}
            <span className="text-green-700">
              Rs {dailyLoading ? "…" : formatCurrency(daily.totalCommission)}
            </span>
          </p>
          <p className="text-xs text-gray-500">Date: {dateId}</p>
        </div>
      </div>
    </main>
  );
}