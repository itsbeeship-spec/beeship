"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function RTOReportTab() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReportRTO"],
    queryFn: () => api.get("/admin/reports/rto").then((res) => res.data || res || {}),
  });

  const raw = reportData?.data || reportData || {};
  const total = raw?.totalRto || 0;
  const percentage = raw?.rtoPercentage || "0.0";
  const loss = raw?.rtoLossAmount || 0;
  const couriers = raw?.topRtoCouriers || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>↩️</span> Return-to-Origin (RTO) Analytics & Loss Estimation
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            RTO order volume, overall RTO percentage against orders, estimated freight loss, and courier RTO rankings.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total RTO Shipments</span>
          <div className="text-2xl font-black text-rose-400">{total}</div>
          <p className="text-[10px] text-slate-400">Returned parcels</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">System RTO Rate</span>
          <div className="text-2xl font-black text-amber-400">{percentage}%</div>
          <p className="text-[10px] text-slate-400">Percentage of total orders</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Estimated Reverse Freight Loss</span>
          <div className="text-2xl font-black text-rose-500">₹{loss.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400">Reverse shipping cost loss</p>
        </div>
      </div>
    </div>
  );
}
