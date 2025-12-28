"use client";

import { useEffect, useState } from "react";
import {
  ensureSalesDay,
  addSaleItem,
  getSaleItems,
  deleteSaleItem,
  updateSaleItem,
} from "@/lib/sales";

import type { SaleItem } from "@/lib/types";
import { useSearchParams } from "next/navigation";

import DateBar from "@/components/DateBar";
import SaleEntryForm from "@/components/SaleEntryForm";
import SalesTable from "@/components/SalesTable";
import TotalsBar from "@/components/TotalsBar";
import TemplateLoader from "@/components/TemplateLoader";
import PdfExport from "@/components/PdfExport";
import { getLocalISODate } from "@/lib/date";

export default function SalesPage() {

  const [items, setItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");


  const searchParams = useSearchParams();
const initialDate = searchParams.get("date") ?? getLocalISODate();
const [dateId, setDateId] = useState<string>(initialDate);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        setError("");
        setIsLoading(true);
        await ensureSalesDay(dateId);
        const data = await getSaleItems(dateId);
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load items");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [dateId]);

  async function add(item: Omit<SaleItem, "id">): Promise<void> {
    try {
      setError("");
      await addSaleItem(dateId, item);
      const data = await getSaleItems(dateId);
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add item";
      setError(message);
      throw err;
    }
  }

  async function del(id: string): Promise<void> {
    try {
      setError("");
      await deleteSaleItem(dateId, id);
      const data = await getSaleItems(dateId);
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete item";
      setError(message);
      throw err;
    }
  }

  async function update(item: SaleItem): Promise<void> {
    try {
      setError("");
      await updateSaleItem(dateId, item);
      const data = await getSaleItems(dateId);
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update item";
      setError(message);
      throw err;
    }
  }

  async function loadTemplate(rows: { board: SaleItem["board"]; code: string }[]): Promise<void> {
    try {
      setError("");
      for (const r of rows) {
        await addSaleItem(dateId, { ...r, gross: 0, deduction: 0, net: 0 });
      }
      const data = await getSaleItems(dateId);
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load template";
      setError(message);
      throw err;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-blue-900 text-white rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-2">Daily Sales Entry</h1>
          <p className="text-blue-100">Manage NLB and DLB lottery sales</p>
        </div>

        {/* Global Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded font-semibold">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
            <p className="text-gray-600 font-semibold text-lg">Loading...</p>
            
          </div>
        ) : (
          <>
            {/* Date Selection */}
            <DateBar dateId={dateId} setDateId={setDateId} />

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
<TemplateLoader dateId={dateId} onLoad={loadTemplate} />
              <PdfExport date={dateId} items={items} />
            </div>

            {/* Entry Form */}
            <SaleEntryForm dateId={dateId} onAdd={add} />

            {/* Summary */}
            {items.length > 0 && <TotalsBar items={items} />}

            {/* Table */}
            <SalesTable items={items} onDelete={del} onUpdate={update} />
          </>
        )}
      </div>
    </main>
  );
}