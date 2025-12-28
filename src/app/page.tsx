"use client";

import Link from "next/link";
import DailyOverview from "@/components/DailyOverview";

export default function Home() {
  const features = [
    { id: "entry", icon: "📊", title: "Data Entry", description: "Simple and efficient sales data entry system" },
    { id: "summary", icon: "📈", title: "Summaries", description: "Real-time totals for NLB and DLB" },
    { id: "template", icon: "⚡", title: "Templates", description: "Quick load all daily lottery codes" },
    { id: "edit", icon: "✏️", title: "Editing", description: "Edit entries directly in the table" },
    { id: "export", icon: "📄", title: "Reports", description: "Export professional PDF reports" },
    { id: "history", icon: "📅", title: "History", description: "Access sales data from any date" },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
                Lottery Sales Management
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-2xl">
                Quick daily overview for owners and a simple sales entry workflow for staff.
              </p>
            </div>

            <Link
              href="/sales"
              className="
                w-full md:w-auto
                px-6 py-3
                bg-white text-blue-900 font-bold rounded
                hover:bg-blue-50 transition-colors
                text-center
              "
            >
              Go to Sales Entry
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {/* Owner Overview at Top */}
        <DailyOverview />

        {/* Features Grid */}
        <section className="mb-12 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 md:mb-10">
            Features
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="
                  bg-white border border-gray-200 rounded-lg
                  p-4 md:p-6
                  hover:shadow-md transition-shadow
                "
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12 md:mb-14 bg-gray-50 rounded-lg border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 md:mb-10">
            How It Works
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { step: "1", title: "Select Date", desc: "Choose the date for your sales" },
              { step: "2", title: "Load Template", desc: "Load daily lottery codes" },
              { step: "3", title: "Enter Sales", desc: "Input sales amounts" },
              { step: "4", title: "Export Report", desc: "Generate PDF report" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center mb-3 md:mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/sales"
            className="
              w-full sm:w-auto
              inline-block
              px-8 py-3
              bg-blue-900 text-white font-bold rounded
              hover:bg-blue-800 transition-colors
            "
          >
            Go to Sales Entry
          </Link>
        </section>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 text-sm">
          <p>Professional Lottery Sales Management System</p>
        </div>
      </div>
    </main>
  );
}
