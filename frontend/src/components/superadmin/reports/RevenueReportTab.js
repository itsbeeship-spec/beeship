"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function RevenueReportTab() {
  const [range, setRange] = useState("30");

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReportRevenue", range],
    queryFn: () => api.get(`/admin/reports/revenue?range=${range}`).then((res) => res?.data || res || {}),
  });

  const raw = reportData?.data || reportData || {};
  const gross = raw?.totalGrossRevenue || 0;
  const freight = raw?.totalShippingFreight || 0;
  const margin = raw?.estimatedMarginProfit || 0;
  const breakdown = raw?.breakdown || [];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>💹</span> Revenue & Platform Earnings Analytics
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Gross revenue, freight charges, COD handling fee collection, and platform margin profits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-[#0b1120] border border-[#1e293b] text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Gross Revenue</span>
          <div className="text-2xl font-black text-emerald-400">₹{gross.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400">Sum of all order amounts</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Shipping Freight Volume</span>
          <div className="text-2xl font-black text-indigo-400">₹{freight.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400">Total freight charged to sellers</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Estimated Platform Margin</span>
          <div className="text-2xl font-black text-amber-400">₹{margin.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400">~18% estimated profit margin</p>
        </div>
      </div>

      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] p-6 space-y-4">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
          Revenue Category Breakdown
        </h3>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading revenue metrics...</p>
          ) : breakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No revenue data available — no orders placed yet.</p>
          ) : (
            breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#0b1120] border border-[#1e293b] p-3 rounded-xl text-xs">
                <span className="font-bold text-white">{item.category}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-slate-300 font-bold">₹{item.amount.toLocaleString("en-IN")}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono text-[10px] font-bold">
                    {item.percent}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
