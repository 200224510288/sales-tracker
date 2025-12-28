"use client";

import { useState } from "react";
import type { SaleItem } from "@/lib/types";

interface Props {
  date: string;
  items: SaleItem[];
}

export default function PdfExport({ date, items }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const nlbTotal = items
    .filter((x) => x.board === "NLB")
    .reduce((s, x) => s + x.net, 0);

  const dlbTotal = items
    .filter((x) => x.board === "DLB")
    .reduce((s, x) => s + x.net, 0);

  const grandTotal = nlbTotal + dlbTotal;

  async function generatePDF(): Promise<void> {
    try {
      setError("");
      setIsGenerating(true);

      const printWindow = window.open("", "", "width=900,height=1000");
      if (!printWindow) {
        setError("Please enable popups to generate PDF");
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sales Report - ${formatDate(date)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #003366;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #003366;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .summary {
              display: flex;
              justify-content: space-around;
              margin: 30px 0;
              padding: 20px;
              background: #f5f5f5;
              border-left: 4px solid #003366;
            }
            .summary-item {
              text-align: center;
            }
            .summary-item label {
              display: block;
              font-weight: bold;
              margin-bottom: 8px;
              color: #666;
              font-size: 12px;
            }
            .summary-item .value {
              font-size: 24px;
              font-weight: bold;
              color: #003366;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: #003366;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              font-size: 12px;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            .text-right {
              text-align: right;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sales Report</h1>
            <p>Date: ${formatDate(date)}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <label>NLB Total</label>
              <div class="value">${formatCurrency(nlbTotal)}</div>
            </div>
            <div class="summary-item">
              <label>DLB Total</label>
              <div class="value">${formatCurrency(dlbTotal)}</div>
            </div>
            <div class="summary-item">
              <label>Grand Total</label>
              <div class="value">${formatCurrency(grandTotal)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Board</th>
                <th>Code</th>
                <th class="text-right">Gross</th>
                <th class="text-right">Return</th>
                <th class="text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>${item.board}</td>
                  <td>${item.code}</td>
                  <td class="text-right">${item.gross}</td>
                  <td class="text-right">${item.deduction}</td>
                  <td class="text-right"><strong>${item.net}</strong></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>Total Entries: ${items.length}</p>
            <p>This is an automatically generated report.</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  const canExport = items.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Export Report</h2>
          <p className="text-sm text-gray-600">
            {canExport
              ? `Download PDF report (${items.length} entries)`
              : "Add entries to enable export"}
          </p>
        </div>

        <button
          onClick={generatePDF}
          disabled={!canExport || isGenerating}
          className={`px-6 py-2 font-bold rounded whitespace-nowrap transition-colors ${
            canExport && !isGenerating
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isGenerating ? "Generating..." : "Export PDF"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded font-semibold">
          {error}
        </div>
      )}
    </div>
  );
}