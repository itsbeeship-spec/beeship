"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function CouriersReportTab() {
  const { data: reportRes, isLoading } = useQuery({
    queryKey: ["adminReportCouriers"],
    queryFn: () => api.get("/admin/reports/couriers").then((res) => res?.data || res || []),
  });

  const courierStats = Array.isArray(reportRes)
    ? reportRes
    : Array.isArray(reportRes?.data)
    ? reportRes.data
    : [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🏍️</span> Courier Partner Performance Comparison
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Compare Delhivery, Xpressbees, Shadowfax delivery success rates, SLA TAT, and RTO percentages.
          </p>
        </div>
      </div>

      {/* Courier Performance Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3.5">Courier Partner</th>
              <th className="px-4 py-3.5">System Status</th>
              <th className="px-4 py-3.5">Total Volume</th>
              <th className="px-4 py-3.5">Delivery Success Rate</th>
              <th className="px-4 py-3.5">Average TAT</th>
              <th className="px-4 py-3.5 text-right">RTO Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-400 font-semibold">
                  Loading courier statistics...
                </td>
              </tr>
            ) : courierStats.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-400 font-semibold">
                  No courier partner data found in database.
                </td>
              </tr>
            ) : (
              courierStats.map((c) => (
                <tr key={c.id || c.name} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30 transition">
                  <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                    <span className="text-base">🚚</span>
                    {c.name} {c.code ? `(${c.code})` : ""}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg text-[9px] font-black uppercase">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-indigo-300">
                    {c.totalVolume} Packages
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                    {c.deliverySuccessRate}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">
                    {c.avgTat}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-400">
                    {c.rtoRate}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
