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
  type DailyCodePoint
} from "@/lib/sales";

import { kmeans, type KMeansResult } from "@/lib/kmeans";

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
  Legend
} from "recharts";

/* ---------------- helpers ---------------- */

function shortDate(dateId: string): string {
  const m = dateId.slice(5, 7);
  const d = dateId.slice(8, 10);
  return `${m}/${d}`;
}

function formatNumber(v: number): string {
  return new Intl.NumberFormat("en-US").format(v);
}

function isWeekend(dateId: string): boolean {
  const d = new Date(dateId);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function dayOfWeek(dateId: string): number {
  const d = new Date(dateId);
  return d.getDay();
}

/* ---------------- page ---------------- */

export default function Home() {

  /* ================= SALES TREND ================= */

  const [trend, setTrend] = useState<DailyTotalPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await listDailyTotals();
      setTrend(data);
      setTrendLoading(false);
    }
    load();
  }, []);

  const chartData = useMemo(() => {

    const MAX = 60;

    const slice =
      trend.length > MAX
        ? trend.slice(trend.length - MAX)
        : trend;

    return slice.map((p) => ({
      dateId: p.dateId,
      label: shortDate(p.dateId),
      totalQty: p.totalQty
    }));

  }, [trend]);

  const weekendMarkers = useMemo(() => {
    return chartData
      .filter((x) => isWeekend(x.dateId))
      .map((x) => x.label);
  }, [chartData]);

  /* ================= KMEANS ================= */

  const [clusterCode, setClusterCode] = useState("");
  const [kValue, setKValue] = useState(3);

  const [series, setSeries] = useState<DailyCodePoint[]>([]);
  const [clusterRes, setClusterRes] = useState<KMeansResult | null>(null);
  const [clusterLoading, setClusterLoading] = useState(false);

  async function runClustering() {

    setClusterLoading(true);

    const data = await listDailyTotalsByCode(clusterCode);
    setSeries(data);

    const X = data.map((p) => [
      p.qty,
      dayOfWeek(p.dateId),
      isWeekend(p.dateId) ? 1 : 0
    ]);

    const result = kmeans(X, kValue);

    setClusterRes(result);

    setClusterLoading(false);
  }

  const clusterChartData = useMemo(() => {

    if (!clusterRes) return [];

    return series.map((p, i) => ({
      qty: p.qty,
      dow: dayOfWeek(p.dateId),
      cluster: clusterRes.labels[i],
      dateId: p.dateId
    }));

  }, [series, clusterRes]);

  /* ================= UI ================= */

  return (
    <RequireAuth>

      <main className="min-h-screen bg-white">

        {/* HEADER */}

        <div className="bg-blue-900 text-white">

          <div className="max-w-6xl mx-auto px-6 py-12">

            <div className="flex justify-between items-end">

              <div>

                <h1 className="text-4xl font-bold mb-3">
                  Lottery Sales Dashboard
                </h1>

                <p className="text-blue-100">
                  Analytics, trends and ML insights
                </p>

              </div>

              <LogoutButton />

            </div>

          </div>

        </div>

        {/* CONTENT */}

        <div className="max-w-6xl mx-auto px-6 py-12">

          {/* DAILY OVERVIEW */}

          <DailyOverview />

          {/* ================= SALES TREND ================= */}

          <section className="mt-12">

            <h2 className="text-2xl font-bold mb-4">
              Sales Trend
            </h2>

            <div className="bg-white border rounded-xl p-6 shadow-sm">

              <div className="h-72">

                {trendLoading ? (
                  <div className="flex items-center justify-center h-full">
                    Loading...
                  </div>
                ) : (

                  <ResponsiveContainer width="100%" height="100%">

                    <LineChart data={chartData}>

                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis dataKey="label" />

                      <YAxis />

                      <Tooltip
                        formatter={(v) => [formatNumber(Number(v)), "Sales"]}
                      />

                      {weekendMarkers.map((m, i) => (
                        <ReferenceLine
                          key={i}
                          x={m}
                          stroke="red"
                          strokeDasharray="3 3"
                        />
                      ))}

                      <Line
                        dataKey="totalQty"
                        stroke="#1e40af"
                        strokeWidth={2}
                        dot={false}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                )}

              </div>

            </div>

          </section>

          {/* ================= KMEANS ================= */}

          <section className="mt-16">

            <h2 className="text-2xl font-bold mb-4">
              K-Means Lottery Pattern Detection
            </h2>

            <div className="bg-white border rounded-xl p-6 shadow-sm">

              {/* controls */}

              <div className="flex gap-3 mb-6">

                <input
                  value={clusterCode}
                  onChange={(e) => setClusterCode(e.target.value)}
                  placeholder="Lottery code (MSE etc)"
                  className="border px-4 py-2 rounded"
                />

                <select
                  value={kValue}
                  onChange={(e) => setKValue(Number(e.target.value))}
                  className="border px-3 py-2 rounded"
                >
                  {[2,3,4,5].map(k => (
                    <option key={k}>{k}</option>
                  ))}
                </select>

                <button
                  onClick={runClustering}
                  className="bg-blue-900 text-white px-5 py-2 rounded font-bold"
                >
                  {clusterLoading ? "Running..." : "Run Clustering"}
                </button>

              </div>

              {/* chart */}

              <div className="h-80">

                {!clusterRes ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Run clustering to visualize patterns
                  </div>
                ) : (

                  <ResponsiveContainer width="100%" height="100%">

                    <ScatterChart>

                      <CartesianGrid />

                      <XAxis
                        dataKey="dow"
                        name="Day"
                        type="number"
                        domain={[0,6]}
                      />

                      <YAxis
                        dataKey="qty"
                        name="Qty"
                      />

                      <Tooltip
                        formatter={(v) => [formatNumber(Number(v)), "Qty"]}
                      />

                      <Legend />

                      {Array.from(
                        { length: clusterRes.centroids.length }
                      ).map((_, c) => (

                        <Scatter
                          key={c}
                          name={`Cluster ${c}`}
                          data={clusterChartData.filter(d => d.cluster === c)}
                        />

                      ))}

                    </ScatterChart>

                  </ResponsiveContainer>

                )}

              </div>

            </div>

          </section>

          {/* CTA */}

          <section className="text-center mt-16">

            <Link
              href="/sales"
              className="bg-blue-900 text-white px-8 py-3 rounded font-bold"
            >
              Go To Sales Entry
            </Link>

          </section>

        </div>

      </main>

    </RequireAuth>
  );
}