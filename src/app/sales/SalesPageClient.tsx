"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  ensureSalesDay,
  addSaleItem,
  getSaleItems,
  deleteSaleItem,
  updateSaleItem,
} from "@/lib/sales";

import type { SaleItem } from "@/lib/types";
import DateBar from "@/components/DateBar";
import SaleEntryForm from "@/components/SaleEntryForm";
import SalesTable from "@/components/SalesTable";
import TotalsBar from "@/components/TotalsBar";
import TemplateLoader from "@/components/TemplateLoader";
import PdfExport from "@/components/PdfExport";
import { getLocalISODate } from "@/lib/date";

function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function SalesPageClient() {
  const searchParams = useSearchParams();

  const [dateId, setDateId] = useState<string>(getLocalISODate());
  const [items, setItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // 🔹 Read date from URL once
  useEffect(() => {
    const urlDate = searchParams.get("date");
    if (urlDate && isISODate(urlDate)) {
      setDateId(urlDate);
    }
  }, [searchParams]);

  // 🔹 Load data when date changes
  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        setError("");
        setIsLoading(true);

        await ensureSalesDay(dateId);
        const data = await getSaleItems(dateId);

        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load items");
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

  async function add(item: Omit<SaleItem, "id">): Promise<void> {
    setError("");
    await addSaleItem(dateId, item);
    setItems(await getSaleItems(dateId));
  }

  async function del(id: string): Promise<void> {
    setError("");
    await deleteSaleItem(dateId, id);
    setItems(await getSaleItems(dateId));
  }

  async function update(item: SaleItem): Promise<void> {
    setError("");
    await updateSaleItem(dateId, item);
    setItems(await getSaleItems(dateId));
  }

  async function loadTemplate(
    rows: { board: SaleItem["board"]; code: string }[]
  ): Promise<void> {
    setError("");
    for (const r of rows) {
      await addSaleItem(dateId, {
        ...r,
        gross: 0,
        deduction: 0,
        net: 0,
      });
    }
    setItems(await getSaleItems(dateId));
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-blue-900 text-white rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-2">Daily Sales Entry</h1>
          <p className="text-blue-100">Manage NLB and DLB lottery sales</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded font-semibold">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
            <p className="text-gray-600 font-semibold text-lg">Loading...</p>
          </div>
        ) : (
          <>
            <DateBar dateId={dateId} setDateId={setDateId} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <TemplateLoader dateId={dateId} onLoad={loadTemplate} />
              <PdfExport date={dateId} items={items} />
            </div>

            <SaleEntryForm dateId={dateId} onAdd={add} />

            {items.length > 0 && <TotalsBar items={items} />}

            <SalesTable items={items} onDelete={del} onUpdate={update} />
          </>
        )}
      </div>
    </main>
  );
}
