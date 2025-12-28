import { Suspense } from "react";
import SalesPageClient from "./SalesPageClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg font-semibold text-gray-600">
            Loading sales page...
          </p>
        </div>
      }
    >
      <SalesPageClient />
    </Suspense>
  );
}
