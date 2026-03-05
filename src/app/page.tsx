"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import DailyOverview from "@/components/DailyOverview";
import RequireAuth from "@/components/RequireAuth";
import LogoutButton from "@/components/LogoutButton";

import {
  listDailyTotals,
  listDailyTotalsByCode,
  type DailyTotalPoint,
  type DailyCodePoint,
} from "@/lib/sales";

import { kmeans, type KMeansResult } from "@/lib/kmeans";
import { seasonalForecast, type ForecastPoint } from "@/lib/sarima";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";

/* ---------------- helpers ---------------- */

function shortDate(dateId: string): string {
  // YYYY-MM-DD -> MM/DD
  const m = dateId.slice(5, 7);
  const d = dateId.slice(8, 10);
  return `${m}/${d}`;
}

function formatNumber(v: number): string {
  return new Intl.NumberFormat("en-US").format(v);
}

function dayOfWeek(dateId: string): number {
  // dateId must be YYYY-MM-DD
  const d = new Date(dateId + "T00:00:00");
  return d.getDay(); // 0..6
}

function isWeekend(dateId: string): boolean {
  const dow = dayOfWeek(dateId);
  return dow === 0 || dow === 6;
}

type TrendChartRow = {
  dateId: string; // unique x-axis key
  totalQty: number | null; // actual
  forecast: number | null; // predicted
};

type ScatterRow = {
  dateId: string;
  qty: number;
  dow: number; // 0..6
  cluster: number;
  weekend: 0 | 1;
};

export default function Home() {
  /* ================== TREND (Actual + Forecast) ================== */

  const [trend, setTrend] = useState<DailyTotalPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState<boolean>(true);
  const [trendError, setTrendError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadTrend(): Promise<void> {
      try {
        setTrendError("");
        setTrendLoading(true);

        const data = await listDailyTotals();

        if (!cancelled) {
          setTrend(data);
        }
      } catch (err) {
        if (!cancelled) {
          setTrendError(err instanceof Error ? err.message : "Failed to load trend data");
          setTrend([]);
        }
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    }

    loadTrend();
    return () => {
      cancelled = true;
    };
  }, []);

  // Limit history shown in chart (for readability)
  const trendHistory = useMemo(() => {
    const MAX_DAYS = 60;
    const slice = trend.length > MAX_DAYS ? trend.slice(trend.length - MAX_DAYS) : trend;
    return slice;
  }, [trend]);

  const forecastPoints: ForecastPoint[] = useMemo(() => {
    if (trendHistory.length < 10) return [];

    const values = trendHistory.map((x) => x.totalQty);
    const lastDateId = trendHistory[trendHistory.length - 1]?.dateId;
    if (!lastDateId) return [];

    // forecast next 7 days (adjust horizon if needed)
    return seasonalForecast(values, lastDateId, 7);
  }, [trendHistory]);

  const fullTrendChartData: TrendChartRow[] = useMemo(() => {
    const hist: TrendChartRow[] = trendHistory.map((p) => ({
      dateId: p.dateId,
      totalQty: p.totalQty,
      forecast: null,
    }));

    const fc: TrendChartRow[] = forecastPoints.map((p) => ({
      dateId: p.dateId,
      totalQty: null,
      forecast: p.predicted,
    }));

    return [...hist, ...fc];
  }, [trendHistory, forecastPoints]);

  const weekendMarkers = useMemo(() => {
    // mark weekends on both actual + forecast range
    return fullTrendChartData
      .filter((r) => isWeekend(r.dateId))
      .map((r) => r.dateId);
  }, [fullTrendChartData]);

  const trendStats = useMemo(() => {
    if (!trendHistory.length) return { min: 0, max: 0, avg: 0, latest: 0 };

    let min = Number.POSITIVE_INFINITY;
    let max = 0;
    let sum = 0;

    for (const p of trendHistory) {
      min = Math.min(min, p.totalQty);
      max = Math.max(max, p.totalQty);
      sum += p.totalQty;
    }

    const avg = sum / trendHistory.length;
    const latest = trendHistory[trendHistory.length - 1]?.totalQty ?? 0;

    return {
      min: Number.isFinite(min) ? min : 0,
      max,
      avg,
      latest,
    };
  }, [trendHistory]);

  /* ================== K-MEANS CLUSTERING ================== */

  const [clusterCode, setClusterCode] = useState<string>("");
  const [kValue, setKValue] = useState<number>(3);

  const [series, setSeries] = useState<DailyCodePoint[]>([]);
  const [clusterRes, setClusterRes] = useState<KMeansResult | null>(null);

  const [clusterLoading, setClusterLoading] = useState<boolean>(false);
  const [clusterError, setClusterError] = useState<string>("");

  async function runClustering(): Promise<void> {
    try {
      const code = clusterCode.trim();
      if (!code) {
        setClusterError("Enter a lottery code first (example: MSE, GSB, etc.)");
        setSeries([]);
        setClusterRes(null);
        return;
      }

      setClusterError("");
      setClusterLoading(true);
      setClusterRes(null);

      const data = await listDailyTotalsByCode(code);
      setSeries(data);

      if (data.length < 5) {
        setClusterError("Not enough days to cluster. Need more historical days.");
        setClusterRes(null);
        return;
      }

      // Features: [qty, dayOfWeek, weekendFlag]
      const X = data.map((p) => [
        Number(p.qty || 0),
        dayOfWeek(p.dateId),
        isWeekend(p.dateId) ? 1 : 0,
      ]);

      const safeK = Math.max(2, Math.min(kValue, X.length));
      const res = kmeans(X, safeK, 60);

      setClusterRes(res);
    } catch (err) {
      setClusterError(err instanceof Error ? err.message : "Clustering failed");
      setSeries([]);
      setClusterRes(null);
    } finally {
      setClusterLoading(false);
    }
  }

  const clusterChartData: ScatterRow[] = useMemo(() => {
    if (!clusterRes) return [];

    return series.map((p, i) => ({
      dateId: p.dateId,
      qty: p.qty,
      dow: dayOfWeek(p.dateId),
      weekend: isWeekend(p.dateId) ? 1 : 0,
      cluster: clusterRes.labels[i] ?? 0,
    }));
  }, [series, clusterRes]);

  const clusterSummary = useMemo(() => {
    if (!clusterRes || clusterChartData.length === 0) return [];

    const k = clusterRes.centroids.length;

    const buckets = Array.from({ length: k }, () => ({
      count: 0,
      sumQty: 0,
      minQty: Number.POSITIVE_INFINITY,
      maxQty: 0,
      weekendCount: 0,
    }));

    for (const row of clusterChartData) {
      const b = buckets[row.cluster];
      if (!b) continue;

      b.count += 1;
      b.sumQty += row.qty;
      b.minQty = Math.min(b.minQty, row.qty);
      b.maxQty = Math.max(b.maxQty, row.qty);
      b.weekendCount += row.weekend;
    }

    return buckets.map((b, idx) => {
      const avgQty = b.count > 0 ? b.sumQty / b.count : 0;
      const weekendPct = b.count > 0 ? (b.weekendCount / b.count) * 100 : 0;

      return {
        cluster: idx,
        days: b.count,
        avgQty,
        minQty: b.minQty === Number.POSITIVE_INFINITY ? 0 : b.minQty,
        maxQty: b.maxQty,
        weekendPct,
      };
    });
  }, [clusterRes, clusterChartData]);

  /* ================== UI ================== */

  return (
    <RequireAuth>
      <main className="min-h-screen bg-white">
        {/* HEADER */}
        <div className="bg-blue-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
                  Lottery Sales Management
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-2xl">
                  Trends, forecasting, and pattern discovery (K-Means).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <Link
                  href="/sales"
                  className="w-full md:w-auto px-6 py-3 bg-white text-blue-900 font-bold rounded hover:bg-blue-50 transition-colors text-center"
                >
                  Go to Sales Entry
                </Link>

                <LogoutButton />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          {/* Overview */}
          <DailyOverview />

          {/* TREND + FORECAST */}
          <section className="mb-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Total Sales Trend
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Blue = actual sales quantity, Green dashed = SARIMA-style seasonal forecast. Red dotted lines = weekends.
                </p>
              </div>

              {!trendLoading && !trendError && trendHistory.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Latest</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatNumber(trendStats.latest)}
                  </p>
                </div>
              )}
            </div>

            {trendError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded font-semibold">
                {trendError}
              </div>
            )}

            <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-sm font-bold text-gray-800">
                  {trendLoading ? "Loading trend…" : `Showing last ${trendHistory.length} days + ${forecastPoints.length} forecast days`}
                </p>

                {!trendLoading && !trendError && trendHistory.length > 0 && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
                    <span>
                      Avg:{" "}
                      <span className="font-semibold text-gray-900">
                        {formatNumber(Math.round(trendStats.avg))}
                      </span>
                    </span>
                    <span>
                      Min:{" "}
                      <span className="font-semibold text-gray-900">
                        {formatNumber(trendStats.min)}
                      </span>
                    </span>
                    <span>
                      Max:{" "}
                      <span className="font-semibold text-gray-900">
                        {formatNumber(trendStats.max)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="h-72">
                  {trendLoading ? (
                    <div className="h-full flex items-center justify-center text-sm font-semibold text-gray-600">
                      Loading…
                    </div>
                  ) : fullTrendChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm font-semibold text-gray-600">
                      No trend data found yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fullTrendChartData}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                          dataKey="dateId"
                          tickFormatter={shortDate}
                          tickMargin={8}
                        />

                        <YAxis tickMargin={8} />

                        <Tooltip
                          formatter={(value: unknown, name: unknown) => {
                            const n = typeof value === "number" ? value : Number(value);
                            const label = typeof name === "string" ? name : "Value";
                            return [formatNumber(Number.isFinite(n) ? n : 0), label];
                          }}
                          labelFormatter={(label: unknown) => {
                            return typeof label === "string" ? label : "";
                          }}
                        />

                        {/* Weekend markers */}
                        {weekendMarkers.map((dateId) => (
                          <ReferenceLine
                            key={dateId}
                            x={dateId}
                            stroke="red"
                            strokeDasharray="3 3"
                            strokeOpacity={0.55}
                          />
                        ))}

                        {/* Actual line */}
                        <Line
                          type="monotone"
                          dataKey="totalQty"
                          name="Actual"
                          stroke="#1e40af"
                          strokeWidth={2}
                          dot={false}
                          connectNulls={false}
                        />

                        {/* Forecast line */}
                        <Line
                          type="monotone"
                          dataKey="forecast"
                          name="Forecast"
                          stroke="#16a34a"
                          strokeWidth={2}
                          strokeDasharray="6 6"
                          dot={false}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* K-MEANS CLUSTERING (below trend) */}
          <section className="mb-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  K-Means Lottery Patterns
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Cluster daily behavior for a selected lottery code (pattern discovery).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  value={clusterCode}
                  onChange={(e) => setClusterCode(e.target.value)}
                  placeholder="Enter code (ex: MSE)"
                  className="px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-900"
                />

                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-gray-700">K</label>
                  <select
                    value={kValue}
                    onChange={(e) => setKValue(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md font-semibold text-gray-900"
                  >
                    {[2, 3, 4, 5].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={runClustering}
                  className="px-4 py-2 rounded-md font-bold bg-blue-900 text-white hover:bg-blue-800 transition-colors"
                >
                  {clusterLoading ? "Running…" : "Run Clustering"}
                </button>
              </div>
            </div>

            {clusterError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded font-semibold">
                {clusterError}
              </div>
            )}

            <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-sm font-bold text-gray-800">
                  {clusterRes
                    ? `Code: ${clusterCode.trim().toUpperCase()} • Clusters: ${clusterRes.centroids.length}`
                    : "Not clustered yet"}
                </p>
                <p className="text-xs text-gray-500">
                  Features: Qty, Day-of-Week, Weekend flag
                </p>
              </div>

              <div className="p-5">
                <div className="h-80">
                  {!clusterRes || clusterChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm font-semibold text-gray-600">
                      Enter a code and click “Run Clustering”.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                          dataKey="dow"
                          type="number"
                          domain={[0, 6]}
                          tickCount={7}
                          tickFormatter={(v: unknown) => {
                            const n = typeof v === "number" ? v : Number(v);
                            // 0 Sun ... 6 Sat
                            const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                            return names[n] ?? String(n);
                          }}
                        />

                        <YAxis
                          dataKey="qty"
                          type="number"
                          tickFormatter={(v: unknown) => {
                            const n = typeof v === "number" ? v : Number(v);
                            return formatNumber(Number.isFinite(n) ? n : 0);
                          }}
                        />

                        <Tooltip
                          formatter={(value: unknown) => {
                            const n = typeof value === "number" ? value : Number(value);
                            return [formatNumber(Number.isFinite(n) ? n : 0), "Qty"];
                          }}
                          labelFormatter={() => ""}
                        />

                        <Legend />

                        {Array.from({ length: clusterRes.centroids.length }).map((_, c) => (
                          <Scatter
                            key={c}
                            name={`Cluster ${c}`}
                            data={clusterChartData.filter((r) => r.cluster === c)}
                          />
                        ))}
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Cluster summary table */}
                {clusterRes && clusterSummary.length > 0 && (
                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border border-gray-200">
                        <tr className="text-left">
                          <th className="px-4 py-3 font-bold text-gray-600">Cluster</th>
                          <th className="px-4 py-3 font-bold text-gray-600">Days</th>
                          <th className="px-4 py-3 font-bold text-gray-600">Avg Qty</th>
                          <th className="px-4 py-3 font-bold text-gray-600">Min</th>
                          <th className="px-4 py-3 font-bold text-gray-600">Max</th>
                          <th className="px-4 py-3 font-bold text-gray-600">Weekend %</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {clusterSummary.map((r) => (
                          <tr key={r.cluster} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{r.cluster}</td>
                            <td className="px-4 py-3">{r.days}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {formatNumber(Math.round(r.avgQty))}
                            </td>
                            <td className="px-4 py-3">{formatNumber(r.minQty)}</td>
                            <td className="px-4 py-3">{formatNumber(r.maxQty)}</td>
                            <td className="px-4 py-3">{r.weekendPct.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* CTA row */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    Tip: try K=3 (Low / Medium / High demand clusters). Use weekend % to detect weekend-driven lotteries.
                  </p>
                  <Link
                    href="/sales"
                    className="px-4 py-2 rounded-md font-bold bg-green-600 text-white hover:bg-green-700 transition-colors text-center"
                  >
                    Enter Sales
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER CTA */}
          <section className="text-center">
            <Link
              href="/sales"
              className="inline-block px-8 py-3 bg-blue-900 text-white font-bold rounded hover:bg-blue-800 transition-colors"
            >
              Go to Sales Entry
            </Link>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 mt-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 text-sm">
            <p>Professional Lottery Sales Management System</p>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}