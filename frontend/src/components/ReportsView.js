"use client";

import { useState } from "react";

export default function ReportsView() {
  const metrics = [
    { title: "Avg. Delivery Time", value: "2.4 Days", trend: "-12% improvement", isPositive: true },
    { title: "NDR Ratio", value: "4.8%", trend: "-0.5% decrease", isPositive: true },
    { title: "COD to Prepaid Ratio", value: "62% / 38%", trend: "Prepaid growing +4%", isPositive: true },
    { title: "RTO Ratio", value: "3.2%", trend: "+0.1% increase", isPositive: false }
  ];

  return (
    <div className="w-full animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports & Analytics</h2>
          <p className="text-xs text-slate-500">Analyze courier performance, shipping spends and delivery latencies.</p>
        </div>
        <button className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-lg text-white transition">
          Generate Custom Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, idx) => (
          <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{metric.title}</span>
            <span className="text-xl font-extrabold text-slate-800 block mb-2">{metric.value}</span>
            <span className={`text-[10px] font-bold ${metric.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {metric.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Analytics Graph Simulation */}
      <div className="border border-slate-150 rounded-2xl p-6 bg-slate-50/50">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-6">Courier Share & Cost Distribution</h3>
        <div className="flex flex-col gap-4">
          {[
            { partner: "Delhivery Surface", share: "55%", color: "bg-blue-500", volume: "240 shipments" },
            { partner: "BlueDart Express", share: "25%", color: "bg-indigo-500", volume: "110 shipments" },
            { partner: "Xpressbees Lite", share: "20%", color: "bg-violet-500", volume: "85 shipments" }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-800">{item.partner}</span>
                <span className="text-slate-500">{item.share} ({item.volume})</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: item.share }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
