"use client";

import { useState } from "react";

interface DateBarProps {
  dateId: string;
  setDateId: (date: string) => void;
}

export default function DateBar({ dateId, setDateId }: DateBarProps) {
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  function formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const isToday = dateId === today();
  const selectedDateStr = formatDisplayDate(dateId);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Date Input */}
        <div>
          <label htmlFor="date-input" className="block text-sm font-bold text-gray-700 mb-2">
            Select Date
          </label>
          <input
            id="date-input"
            type="date"
            value={dateId}
            onChange={(e) => setDateId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded font-semibold text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Quick Buttons */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Quick Select</label>
          <div className="flex gap-2">
            <button
              onClick={() => setDateId(today())}
              className={`px-4 py-2 font-bold rounded text-sm transition-colors ${
                isToday
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateId(yesterday())}
              className={`px-4 py-2 font-bold rounded text-sm transition-colors ${
                dateId === yesterday()
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Display Date */}
        <div className="bg-gray-50 rounded p-4 border border-gray-200">
          <p className="text-xs font-bold text-gray-600 uppercase mb-1">Selected Date</p>
          <p className="text-lg font-bold text-gray-900">{selectedDateStr}</p>
        </div>
      </div>
    </div>
  );
}