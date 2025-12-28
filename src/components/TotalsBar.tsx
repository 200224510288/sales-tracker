import type { SaleItem } from "@/lib/types";

interface Props {
  items: SaleItem[];
}

export default function TotalsBar({ items }: Props) {
  const nlbItems = items.filter((x) => x.board === "NLB");
  const dlbItems = items.filter((x) => x.board === "DLB");

  const nlb = nlbItems.reduce((s, x) => s + x.net, 0);
  const dlb = dlbItems.reduce((s, x) => s + x.net, 0);
  const grand = nlb + dlb;

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* NLB Total */}
        <div className="bg-gray-50 border border-gray-200 rounded p-6">
          <p className="text-sm font-bold text-gray-600 uppercase mb-2">NLB Net</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(nlb)}</p>
          <p className="text-xs text-gray-500 mt-3">{nlbItems.length} entries</p>
        </div>

        {/* DLB Total */}
        <div className="bg-gray-50 border border-gray-200 rounded p-6">
          <p className="text-sm font-bold text-gray-600 uppercase mb-2">DLB Net</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(dlb)}</p>
          <p className="text-xs text-gray-500 mt-3">{dlbItems.length} entries</p>
        </div>

        {/* Grand Total */}
        <div className="bg-blue-900 text-white rounded p-6">
          <p className="text-sm font-bold text-blue-100 uppercase mb-2">Grand Total</p>
          <p className="text-3xl font-bold">{formatCurrency(grand)}</p>
          <p className="text-xs text-blue-200 mt-3">{items.length} total entries</p>
        </div>
      </div>
    </div>
  );
}