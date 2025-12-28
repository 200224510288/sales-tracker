"use client";

import { useMemo, useState } from "react";
import type { SaleBoard, SaleItem } from "@/lib/types";

interface Props {
  items: SaleItem[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: (item: SaleItem) => Promise<void>;
}

type EditDraft = {
  board: SaleBoard;
  code: string;
  gross: number;
  deduction: number;
};

export default function SalesTable({ items, onDelete, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const canEdit = useMemo(() => (id?: string) => typeof id === "string" && id.length > 0, []);

  function startEdit(item: SaleItem) {
    if (!item.id) return;
    setError("");
    setEditingId(item.id);
    setDraft({
      board: item.board,
      code: item.code,
      gross: item.gross,
      deduction: item.deduction,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
    setError("");
  }

  async function saveEdit(original: SaleItem) {
    if (!original.id || !draft) return;
    setError("");

    const cleanedCode = draft.code.trim().toUpperCase();
    if (!cleanedCode) {
      setError("Code is required");
      return;
    }
    if (draft.gross < 0 || draft.deduction < 0) {
      setError("Values cannot be negative");
      return;
    }
    if (draft.deduction > draft.gross) {
      setError("Return cannot exceed Gross");
      return;
    }

    try {
      setIsLoading(true);
      const updated: SaleItem = {
        id: original.id,
        board: draft.board,
        code: cleanedCode,
        gross: Number(draft.gross),
        deduction: Number(draft.deduction),
        net: Number(draft.gross) - Number(draft.deduction),
      };

      await onUpdate(updated);
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        setIsLoading(true);
        setError("");
        await onDelete(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete item");
      } finally {
        setIsLoading(false);
      }
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
        <p className="text-gray-600 text-lg font-semibold">No entries for this date</p>
        <p className="text-gray-500 text-sm mt-2">Add new entries or load the daily template</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Error Message */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200 text-red-700 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Board</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Code</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Gross</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Return</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Net</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {items.map((x, idx) => {
              const isEditing = x.id === editingId && draft !== null;
              const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";

              return (
                <tr key={x.id ?? `${x.board}-${x.code}-${x.gross}-${x.deduction}`} className={rowBg}>
                  {/* Board */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        value={draft.board}
                        onChange={(e) =>
                          setDraft({ ...draft, board: e.target.value as SaleBoard })
                        }
                        className="px-3 py-1 border border-gray-300 rounded font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="NLB">NLB</option>
                        <option value="DLB">DLB</option>
                      </select>
                    ) : (
                      <span className="font-bold text-gray-900">{x.board}</span>
                    )}
                  </td>

                  {/* Code */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={draft.code}
                        onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                        className="px-3 py-1 border border-gray-300 rounded font-bold uppercase text-center w-20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    ) : (
                      <span className="font-semibold text-gray-900">{x.code}</span>
                    )}
                  </td>

                  {/* Gross */}
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={draft.gross}
                        onChange={(e) =>
                          setDraft({ ...draft, gross: Math.max(0, Number(e.target.value)) })
                        }
                        className="px-3 py-1 border border-gray-300 rounded font-bold w-20 text-right focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                        min="0"
                      />
                    ) : (
                      <span className="text-gray-900 font-semibold">{x.gross}</span>
                    )}
                  </td>

                  {/* Return */}
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={draft.deduction}
                        onChange={(e) =>
                          setDraft({ ...draft, deduction: Math.max(0, Number(e.target.value)) })
                        }
                        className="px-3 py-1 border border-gray-300 rounded font-bold w-20 text-right focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                        min="0"
                      />
                    ) : (
                      <span className="text-gray-900 font-semibold">{x.deduction}</span>
                    )}
                  </td>

                  {/* Net */}
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <span className="font-bold text-gray-900">
                        {Math.max(0, draft.gross - draft.deduction)}
                      </span>
                    ) : (
                      <span className="font-bold text-gray-900">{x.net}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {canEdit(x.id) ? (
                      isEditing ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => saveEdit(x)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={isLoading}
                            className="px-3 py-1 bg-gray-400 text-white rounded text-sm font-bold hover:bg-gray-500 disabled:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => startEdit(x)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(x.id!)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}