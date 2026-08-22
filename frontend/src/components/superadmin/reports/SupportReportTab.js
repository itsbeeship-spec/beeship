"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function SupportReportTab() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReportSupport"],
    queryFn: () => api.get("/admin/reports/support").then((res) => res.data || res || {}),
  });

  const raw = reportData?.data || reportData || {};
  const total = raw?.totalTickets || 0;
  const open = raw?.openTickets || 0;
  const resolved = raw?.resolvedTickets || 0;
  const avgHours = raw?.avgResolutionHours || "0 Hours";
  const sla = raw?.slaComplianceRate || "0%";

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🎧</span> Support Desk Resolution Performance
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Customer support ticket resolution time, compliance percentage, and customer satisfaction scores.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Support Tickets</span>
          <div className="text-2xl font-black text-white">{total}</div>
          <p className="text-[10px] text-slate-400">Total raised tickets</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Resolved vs Open</span>
          <div className="text-xl font-black text-emerald-400">
            {resolved} <span className="text-xs text-slate-400">Resolved</span> / {open} <span className="text-xs text-amber-400">Open</span>
          </div>
          <p className="text-[10px] text-slate-400">Ticket status split</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Average Resolution Time</span>
          <div className="text-2xl font-black text-indigo-400">{avgHours}</div>
          <p className="text-[10px] text-slate-400">Average ticket turnaround</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Resolution Compliance</span>
          <div className="text-2xl font-black text-amber-400">{sla}</div>
          <p className="text-[10px] text-slate-400">Resolved within target window</p>
        </div>
      </div>
    </div>
  );
}
