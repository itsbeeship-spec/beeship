"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function NDRReportTab() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReportNDR"],
    queryFn: () => api.get("/admin/reports/ndr").then((res) => res.data || res || {}),
  });

  const raw = reportData?.data || reportData || {};
  const total = raw?.totalNdr || 0;
  const resolved = raw?.resolvedNdr || 0;
  const pending = raw?.pendingNdr || 0;
  const rate = raw?.reattemptSuccessRate || "0%";
  const reasons = raw?.reasonsBreakdown || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>📋</span> NDR Trends & Delivery Exception Breakdown
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Non-delivery report counts, re-attempt delivery success rate, and failure reason category analytics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total NDR Exceptions</span>
          <div className="text-2xl font-black text-white">{total}</div>
          <p className="text-[10px] text-slate-400">Total failed delivery attempts</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Resolved vs Pending</span>
          <div className="text-xl font-black text-emerald-400">
            {resolved} <span className="text-xs text-slate-400">Resolved</span> / {pending} <span className="text-xs text-amber-400">Pending</span>
          </div>
          <p className="text-[10px] text-slate-400">NDR action resolution status</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Re-Attempt Success Rate</span>
          <div className="text-2xl font-black text-indigo-400">{rate}</div>
          <p className="text-[10px] text-slate-400">Successfully delivered after NDR</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Action Resolution Target</span>
          <div className="text-2xl font-black text-emerald-400">24 Hours</div>
          <p className="text-[10px] text-slate-400">Target response window</p>
        </div>
      </div>

      {/* Reasons Breakdown */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] p-6 space-y-4">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
          Failure Reason Category Distribution
        </h3>

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading NDR breakdown...</p>
          ) : reasons.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No NDR exceptions recorded in database.</p>
          ) : (
            reasons.map((r, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#0b1120] border border-[#1e293b] p-3 rounded-xl text-xs">
                <span className="font-bold text-white">{r.reason}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-slate-300 font-bold">{r.count} Cases</span>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono text-[10px] font-bold">
                    {r.percent}
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
