"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function SupportReportsTab() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminSupportReports"],
    queryFn: () => api.get("/admin/support/reports").then((res) => res.data || {}),
  });

  const total = reportData?.totalTicketsThisMonth || 0;
  const resolved = reportData?.resolvedTickets || 0;
  const firstReply = reportData?.avgFirstResponseTime || "0 Mins";
  const avgRes = reportData?.avgResolutionTime || "0 Hours";
  const breach = reportData?.slaBreachRate || "0%";
  const csat = reportData?.csatScore || "0.0";
  const agents = reportData?.agentMetrics || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>📊</span> Support Team Performance & CSAT Analytics
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Support ticket volume, agent resolution times, SLA breach rates, and customer satisfaction scores.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Monthly Tickets</span>
          <div className="text-2xl font-black text-white">{total}</div>
          <p className="text-[10px] text-slate-400">Total tickets received</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Avg First Reply Time</span>
          <div className="text-2xl font-black text-emerald-400">{firstReply}</div>
          <p className="text-[10px] text-slate-400">Average time to first response</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Avg Resolution Time</span>
          <div className="text-2xl font-black text-indigo-400">{avgRes}</div>
          <p className="text-[10px] text-slate-400">Average time to ticket close</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">CSAT Rating Score</span>
          <div className="text-2xl font-black text-amber-400">{csat}</div>
          <p className="text-[10px] text-slate-400">Merchant feedback rating</p>
        </div>
      </div>

      {/* Agent Performance Leaderboard Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        <div className="px-6 py-4 border-b border-[#1e293b]">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wide">
            🏆 Agent Performance Metrics
          </h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3.5">Support Agent</th>
              <th className="px-4 py-3.5">Tickets Resolved</th>
              <th className="px-4 py-3.5">Avg Resolution Time</th>
              <th className="px-4 py-3.5 text-right">CSAT Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-400 font-semibold">
                  Loading agent metrics...
                </td>
              </tr>
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-400 font-semibold">
                  No agent performance data recorded yet.
                </td>
              </tr>
            ) : (
              agents.map((agent, idx) => (
                <tr key={idx} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30 transition">
                  <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    {agent.agent}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">{agent.resolved} Resolved</td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{agent.avgTime}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-amber-400 font-mono">{agent.csat}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
