"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function CourierPerformanceTab() {
  const [selectedCourier, setSelectedCourier] = useState("all");
  const [selectedDays, setSelectedDays] = useState("30");
  const [toast, setToast] = useState(null);

  // Custom dropdown open states
  const [courierOpen, setCourierOpen] = useState(false);
  const [daysOpen, setDaysOpen] = useState(false);
  const [headerDaysOpen, setHeaderDaysOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Couriers from Admin API to get dynamic shipments count
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["superadminCouriersPerformanceList"],
    queryFn: () => api.get("/admin/couriers").then((res) => res || {}),
  });

  const courierList = responseData?.data || [];

  // Calculate dynamic stats
  const totalShipments = courierList.reduce((acc, c) => acc + c.shipments, 0);

  const defaultPerformance = [
    { name: "BlueDart", shipments: courierList.find(c => c.name === "BlueDart")?.shipments || 8240, delivered: "96.8%", time: "2.4 Days", ndr: "2.1%", rto: "3.2%", score: "9.4/10" },
    { name: "Delhivery", shipments: courierList.find(c => c.name === "Delhivery")?.shipments || 12450, delivered: "94.2%", time: "3.1 Days", ndr: "3.8%", rto: "5.1%", score: "8.8/10" },
    { name: "Xpressbees", shipments: courierList.find(c => c.name === "Xpressbees")?.shipments || 4760, delivered: "91.4%", time: "4.2 Days", ndr: "5.2%", rto: "7.8%", score: "7.9/10" },
    { name: "Amazon Shipping", shipments: courierList.find(c => c.name === "Amazon Shipping")?.shipments || 2150, delivered: "93.5%", time: "3.5 Days", ndr: "4.1%", rto: "6.2%", score: "8.2/10" },
  ];

  const filteredPerformance = defaultPerformance.filter(p => {
    if (selectedCourier !== "all" && p.name.toLowerCase() !== selectedCourier.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border shadow-xl flex items-center gap-2 animate-slide-in text-xs font-bold ${
          toast.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        }`}>
          {toast.type === "error" ? (
            <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          ) : (
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Courier Performance</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Compare delivery performance across courier partners.</p>
        </div>
        <div className="flex gap-2 relative items-center">
          {/* Header Date Range Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setHeaderDaysOpen(!headerDaysOpen); }}
              className="flex items-center justify-between gap-2 bg-[#080d1a] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none transition cursor-pointer min-w-[130px]"
            >
              <span>{selectedDays === "30" ? "Last 30 Days" : "Last 90 Days"}</span>
              <svg className={`w-3 h-3 text-slate-400 transition-transform ${headerDaysOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {headerDaysOpen && (
              <div className="absolute right-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
                {[
                  { label: "Last 30 Days", value: "30" },
                  { label: "Last 90 Days", value: "90" }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setSelectedDays(opt.value); setHeaderDaysOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${selectedDays === opt.value ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                  >
                    <span>{opt.label}</span>
                    {selectedDays === opt.value && <span className="text-indigo-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => showToast("Exporting performance analysis...", "success")}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 select-none">
        {[
          { label: "Shipments", val: totalShipments || "25,450", border: "border-[#1e293b] bg-slate-500/5 text-slate-300" },
          { label: "Delivery Rate", val: "94.8%", border: "border-emerald-500/15 bg-emerald-500/5 text-emerald-400" },
          { label: "Avg Delivery", val: "3.2 Days", border: "border-indigo-500/15 bg-indigo-500/5 text-indigo-400" },
          { label: "NDR %", val: "3.5%", border: "border-rose-500/15 bg-rose-500/5 text-rose-400" },
          { label: "RTO %", val: "5.2%", border: "border-slate-500/15 bg-slate-800/10 text-slate-400" }
        ].map((item, idx) => (
          <div key={idx} className={`border rounded-xl p-3 flex flex-col justify-between h-20 text-left ${item.border}`}>
            <span className="text-[10px] font-black uppercase tracking-wider opacity-85">{item.label}</span>
            <span className="text-xl font-black">{item.val}</span>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 items-center bg-[#0b1120]/45 border border-[#1e293b]/40 p-3 rounded-2xl select-none max-w-md z-30 relative">
        {/* Courier Dropdown */}
        <div className="space-y-1 relative">
          <label className="text-[9px] font-black uppercase text-slate-500 block">Courier</label>
          <button
            type="button"
            onClick={() => { setCourierOpen(!courierOpen); setDaysOpen(false); }}
            className="flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[150px]"
          >
            <span>{selectedCourier === "all" ? "All Couriers" : selectedCourier}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${courierOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {courierOpen && (
            <div className="absolute left-0 mt-1.5 w-full min-w-[160px] bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
              {[
                { label: "All Couriers", value: "all" },
                { label: "BlueDart", value: "BlueDart" },
                { label: "Delhivery", value: "Delhivery" },
                { label: "Xpressbees", value: "Xpressbees" },
                { label: "Amazon Shipping", value: "Amazon Shipping" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setSelectedCourier(opt.value); setCourierOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${selectedCourier === opt.value ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt.label}</span>
                  {selectedCourier === opt.value && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Dropdown */}
        <div className="space-y-1 relative">
          <label className="text-[9px] font-black uppercase text-slate-500 block">Date Range</label>
          <button
            type="button"
            onClick={() => { setDaysOpen(!daysOpen); setCourierOpen(false); }}
            className="flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[130px]"
          >
            <span>{selectedDays === "30" ? "Last 30 Days" : "Last 90 Days"}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${daysOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {daysOpen && (
            <div className="absolute left-0 mt-1.5 w-full min-w-[140px] bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
              {[
                { label: "Last 30 Days", value: "30" },
                { label: "Last 90 Days", value: "90" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setSelectedDays(opt.value); setDaysOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${selectedDays === opt.value ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt.label}</span>
                  {selectedDays === opt.value && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-[#080d1a]/85 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              <th className="px-4 py-3">Courier</th>
              <th className="px-4 py-3">Shipments</th>
              <th className="px-4 py-3">Delivered</th>
              <th className="px-4 py-3">Avg Time</th>
              <th className="px-4 py-3">NDR %</th>
              <th className="px-4 py-3">RTO %</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredPerformance.map((row, idx) => (
              <tr key={idx} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30">
                <td className="px-4 py-3 text-white font-bold">{row.name}</td>
                <td className="px-4 py-3 font-mono font-semibold text-slate-200">{row.shipments.toLocaleString()}</td>
                <td className="px-4 py-3 text-emerald-400 font-semibold">{row.delivered}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{row.time}</td>
                <td className="px-4 py-3 font-mono text-rose-400">{row.ndr}</td>
                <td className="px-4 py-3 font-mono text-rose-400">{row.rto}</td>
                <td className="px-4 py-3 font-bold text-indigo-400">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Performance Trend Cards */}
      <div className="bg-[#0b1120]/30 border border-[#1e293b]/50 rounded-2xl p-5 select-none space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-wider">Delivery Performance Trend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          {defaultPerformance.map((item, idx) => {
            const pct = parseInt(item.delivered.replace("%", ""), 10);
            return (
              <div key={idx} className="bg-[#080d1a]/85 border border-[#1e293b]/80 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white font-bold">{item.name}</span>
                  <span className="text-emerald-400 font-black font-mono">{item.delivered}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
