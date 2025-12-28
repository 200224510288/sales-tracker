"use client";

import { useMemo, useState } from "react";
import type { SaleItem } from "@/lib/types";
import { WEEKDAY_GAMES } from "@/lib/weekdayGames";
import { getWeekdayIndex, getWeekdayLabel } from "@/lib/dateUtils";

interface TemplateRow {
  board: SaleItem["board"];
  code: string;
}

interface Props {
  dateId: string;
  onLoad: (rows: TemplateRow[]) => Promise<void>;
}

export default function TemplateLoader({ dateId, onLoad }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 🔹 Stable weekday handling
  const weekdayIndex = useMemo(() => getWeekdayIndex(dateId), [dateId]);
  const weekdayLabel = useMemo(
    () => getWeekdayLabel(weekdayIndex),
    [weekdayIndex]
  );

  const config = WEEKDAY_GAMES[weekdayIndex];

  async function load(): Promise<void> {
    if (!config) {
      setError(`No template defined for ${weekdayLabel}`);
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const template: TemplateRow[] = [
        ...config.NLB.map((c) => ({ board: "NLB" as const, code: c })),
        ...config.DLB.map((c) => ({ board: "DLB" as const, code: c })),
      ];

      await onLoad(template);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Daily Template – {weekdayLabel}
          </h2>

          {config ? (
            <p className="text-sm text-gray-600">
              Load {config.NLB.length} NLB and {config.DLB.length} DLB games
            </p>
          ) : (
            <p className="text-sm text-red-600 font-semibold">
              No template available for this date
            </p>
          )}

          {config && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold text-gray-700 mb-1">NLB</p>
                <p className="text-gray-600">
                  {config.NLB.length > 0 ? config.NLB.join(", ") : "—"}
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-700 mb-1">DLB</p>
                <p className="text-gray-600">
                  {config.DLB.length > 0 ? config.DLB.join(", ") : "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={load}
          disabled={isLoading || !config}
          className={`px-6 py-2 font-bold rounded transition-colors ${
            isLoading || !config
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {isLoading ? "Loading..." : "Load Template"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded font-semibold">
          {error}
        </div>
      )}
    </div>
  );
}
