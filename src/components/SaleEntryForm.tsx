"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SaleBoard, SaleItem } from "@/lib/types";
import { WEEKDAY_GAMES } from "@/lib/weekdayGames";
import { getWeekdayIndex, getWeekdayLabel } from "@/lib/dateUtils";

interface Props {
  dateId: string;
  onAdd: (item: Omit<SaleItem, "id">) => Promise<void>;
}

export default function SaleEntryForm({ dateId, onAdd }: Props) {
  const [board, setBoard] = useState<SaleBoard>("NLB");
  const [code, setCode] = useState<string>("");
  const [gross, setGross] = useState<number>(0);
  const [deduction, setDeduction] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // 🔹 Refs for focus management
  const boardRef = useRef<HTMLSelectElement>(null);
  const codeRef = useRef<HTMLSelectElement>(null);
  const grossRef = useRef<HTMLInputElement>(null);
  const deductionRef = useRef<HTMLInputElement>(null);

  // 🔹 Stable weekday handling (0–6)
  const weekdayIndex = useMemo(() => getWeekdayIndex(dateId), [dateId]);
  const weekdayLabel = useMemo(
    () => getWeekdayLabel(weekdayIndex),
    [weekdayIndex]
  );

  // 🔹 Allowed codes for selected day + board
  const allowedCodes = useMemo(() => {
    return WEEKDAY_GAMES[weekdayIndex]?.[board] ?? [];
  }, [weekdayIndex, board]);

  // 🔹 Reset code when date or board changes
  useEffect(() => {
    setCode("");
  }, [weekdayIndex, board]);

  // 🔹 Calculations & validation
  const net = Math.max(0, gross - deduction);
  const isEmpty = code.trim().length === 0;
  const isNegative = gross < 0 || deduction < 0;
  const exceedsGross = deduction > gross;

  const isValid =
    !isEmpty &&
    !isNegative &&
    !exceedsGross &&
    (gross > 0 || deduction > 0);

  async function submit(): Promise<void> {
    setError("");
    setSuccess("");

    if (!isValid) {
      setError("Please complete all fields correctly");
      return;
    }

    try {
      setIsLoading(true);

      await onAdd({
        board,
        code,
        gross,
        deduction,
        net,
      });

      // Success feedback
      setSuccess(`✓ Entry added: ${code} - Net: ${net.toFixed(2)}`);
      
      // reset after submit
      setCode("");
      setGross(0);
      setDeduction(0);
      
      // Focus back to first field
      setTimeout(() => {
        boardRef.current?.focus();
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setIsLoading(false);
    }
  }

  // 🔹 Handle Enter key to move to next field or submit
  const handleKeyDown = (
    e: React.KeyboardEvent,
    nextRef: React.RefObject<HTMLInputElement | HTMLSelectElement> | null
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (nextRef) {
        // Move to next field
        setTimeout(() => nextRef.current?.focus(), 0);
      } else {
        // Last field - submit form
        if (isValid && !isLoading) {
          submit();
        }
      }
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-8 mb-8 shadow-md">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black mb-2">
          Add New Entry
        </h2>
        <p className="text-gray-700 font-medium">
          {weekdayLabel} - {board === "NLB" ? "National Lottery Board" : "Daily Lottery Board"}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-800 font-semibold text-sm">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <p className="text-green-800 font-semibold text-sm">{success}</p>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Board Selection */}
        <div>
          <label className="block text-sm font-bold text-black mb-3">
            Board <span className="text-blue-600">1</span>
          </label>
          <select
            ref={boardRef}
            value={board}
            onChange={(e) => setBoard(e.target.value as SaleBoard)}
            onKeyDown={(e) => handleKeyDown(e, codeRef)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="NLB">NLB</option>
            <option value="DLB">DLB</option>
          </select>
        </div>

        {/* Code Selection */}
        <div>
          <label className="block text-sm font-bold text-black mb-3">
            Code <span className="text-blue-600">2</span>
          </label>
          <select
            ref={codeRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, grossRef)}
            className={`w-full px-4 py-3 border-2 rounded-lg text-black font-semibold uppercase text-center bg-white focus:outline-none focus:ring-2 focus:border-transparent transition ${
              isEmpty && code !== ""
                ? "border-red-400 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          >
            <option value="">Select Code</option>
            {allowedCodes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Gross Amount */}
        <div>
          <label className="block text-sm font-bold text-black mb-3">
            Gross Sale <span className="text-blue-600">3</span>
          </label>
          <input
            ref={grossRef}
            type="number"
            value={gross || ""}
            onChange={(e) => setGross(Math.max(0, Number(e.target.value) || 0))}
            onKeyDown={(e) => handleKeyDown(e, deductionRef)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-black font-semibold text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Deduction/Return */}
        <div>
          <label className="block text-sm font-bold text-black mb-3">
            Return <span className="text-blue-600">4</span>
          </label>
          <input
            ref={deductionRef}
            type="number"
            value={deduction || ""}
            onChange={(e) =>
              setDeduction(Math.max(0, Number(e.target.value) || 0))
            }
            onKeyDown={(e) => handleKeyDown(e, null)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`w-full px-4 py-3 border-2 rounded-lg text-black font-semibold text-right bg-white focus:outline-none focus:ring-2 focus:border-transparent transition ${
              exceedsGross
                ? "border-red-400 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
        </div>

        {/* Net Amount (Display) */}
        <div>
          <label className="block text-sm font-bold text-black mb-3">
            Net Amount
          </label>
          <div className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg text-black font-bold text-right bg-blue-50">
            {net.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={!isValid || isLoading}
          className={`flex-1 px-6 py-3 font-bold rounded-lg text-lg transition ${
            isValid && !isLoading
              ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {isLoading ? "Adding Entry..." : "Add Entry"}
        </button>
      </div>

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-gray-800 text-sm font-medium mb-2">
          <span className="font-bold">📋 Step-by-Step Flow:</span>
        </p>
        <ul className="text-gray-700 text-sm space-y-1">
          <li>✓ <span className="font-semibold">Step 1:</span> Select Board → Press <span className="font-bold">Enter</span></li>
          <li>✓ <span className="font-semibold">Step 2:</span> Select Code → Press <span className="font-bold">Enter</span></li>
          <li>✓ <span className="font-semibold">Step 3:</span> Enter Gross Sale → Press <span className="font-bold">Enter</span></li>
          <li>✓ <span className="font-semibold">Step 4:</span> Enter Return → Press <span className="font-bold">Enter</span> to Submit</li>
        </ul>
      </div>
    </div>
  );
}