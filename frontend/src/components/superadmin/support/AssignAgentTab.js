"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function AssignAgentTab() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    autoAssignEnabled: true,
    assignmentMode: "ROUND_ROBIN",
    maxActiveTicketsPerAgent: 15,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: responseData } = useQuery({
    queryKey: ["adminSupportAssignRules"],
    queryFn: () => api.get("/admin/support/assign-rules").then((res) => res.data || {}),
  });

  useEffect(() => {
    if (responseData) {
      setForm({
        autoAssignEnabled: responseData.autoAssignEnabled ?? true,
        assignmentMode: responseData.assignmentMode || "ROUND_ROBIN",
        maxActiveTicketsPerAgent: responseData.maxActiveTicketsPerAgent || 15,
      });
    }
  }, [responseData]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/admin/support/assign-rules", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["adminSupportAssignRules"]);
      showToast(res.message || "Routing rules saved!");
    },
    onError: (err) => {
      showToast(err.message || "Failed to save routing rules.", "error");
    },
  });

  const agents = responseData?.agents || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-slide-in">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>👤</span> Support Agent Assignment & Routing Rules
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Configure round-robin auto-assignment algorithms and monitor support agent ticket capacities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
            Auto-Routing Controls
          </h3>

          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-[#0b1120] border border-[#1e293b] p-3.5 rounded-xl">
              <div>
                <span className="font-bold text-white block">Auto-Assign Tickets & Chats</span>
                <span className="text-[10px] text-slate-400">Automatically distribute new incoming support inquiries</span>
              </div>
              <input
                type="checkbox"
                checked={form.autoAssignEnabled}
                onChange={(e) => setForm({ ...form, autoAssignEnabled: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Routing Algorithm</label>
                <select
                  value={form.assignmentMode}
                  onChange={(e) => setForm({ ...form, assignmentMode: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="ROUND_ROBIN">Round-Robin (Sequential)</option>
                  <option value="LOAD_BALANCED">Load Balanced (Lowest Capacity)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Max Active Cap per Agent</label>
                <input
                  type="number"
                  value={form.maxActiveTicketsPerAgent}
                  onChange={(e) => setForm({ ...form, maxActiveTicketsPerAgent: parseInt(e.target.value, 10) || 15 })}
                  placeholder="15"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saveMutation.isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                {saveMutation.isLoading ? "Saving Rules..." : "Save Assignment Rules"}
              </button>
            </div>
          </form>
        </div>

        {/* Agent Capacity Workload Panel */}
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
            Agent Workload Capacities
          </h3>

          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-[#0b1120] border border-[#1e293b] p-3 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{agent.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    agent.status === "ONLINE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Active Tickets: {agent.activeTickets}/{agent.maxCapacity}</span>
                  <span>{Math.round((agent.activeTickets / agent.maxCapacity) * 100)}% Cap</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${(agent.activeTickets / agent.maxCapacity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
