"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function TicketsTab() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [replyMessage, setReplyMessage] = useState("");
  const [assignAgent, setAssignAgent] = useState("");
  const [ticketStatus, setTicketStatus] = useState("RESOLVED");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch real support tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["adminSupportTickets"],
    queryFn: () => api.get("/admin/support/tickets").then((res) => res.data || []),
  });

  // Fetch real DB staff agents
  const { data: assignRulesRes } = useQuery({
    queryKey: ["adminSupportAssignRules"],
    queryFn: () => api.get("/admin/support/assign-rules").then((res) => res.data || {}),
  });

  const dbAgents = assignRulesRes?.agents || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/admin/support/tickets/${id}`, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["adminSupportTickets"]);
      showToast(res.message || "Ticket updated successfully!");
      setSelectedTicket(null);
      setReplyMessage("");
    },
    onError: (err) => {
      showToast(err.message || "Failed to update ticket.", "error");
    },
  });

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  const handleOpenModal = (ticket) => {
    setSelectedTicket(ticket);
    setAssignAgent(ticket.assignedAgent || (dbAgents[0]?.name || "Unassigned"));
    setTicketStatus(ticket.status === "RESOLVED" ? "RESOLVED" : "IN_PROGRESS");
    setReplyMessage("");
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    updateMutation.mutate({
      id: selectedTicket.id,
      payload: {
        status: ticketStatus,
        assignedAgent: assignAgent,
        ...(replyMessage ? { replyMessage } : {}),
      },
    });
  };

  const handleQuickAssign = (ticketId, agentName) => {
    updateMutation.mutate({
      id: ticketId,
      payload: {
        assignedAgent: agentName,
        status: "IN_PROGRESS",
      },
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-slide-in ${
          toast.type === "error" ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🎫</span> Merchant Support & Helpdesk Tickets
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Manage merchant escalations, assign support agents from DB, and send official resolution replies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0b1120] border border-[#1e293b] text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3.5">Ticket ID</th>
              <th className="px-4 py-3.5">Merchant Store</th>
              <th className="px-4 py-3.5">Subject & Category</th>
              <th className="px-4 py-3.5">Assigned Agent</th>
              <th className="px-4 py-3.5">Priority</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-400 font-semibold">
                  Loading support tickets...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-400 font-semibold">
                  No tickets found matching the selected filter.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
                <tr key={t.id} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/50 transition">
                  <td className="px-4 py-3.5 font-mono font-bold text-indigo-400">
                    {t.id}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-white">{t.sellerName}</div>
                    <div className="text-[10px] font-mono text-slate-500">{t.email}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-200">{t.subject}</div>
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded inline-block mt-0.5">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {/* Dynamic Real Agent Assignment Selector */}
                    <select
                      value={t.assignedAgent || "Unassigned"}
                      onChange={(e) => handleQuickAssign(t.id, e.target.value)}
                      className="bg-[#0b1120] border border-[#1e293b] text-slate-200 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer hover:border-indigo-500 transition"
                    >
                      <option value="Unassigned">👤 Unassigned</option>
                      {dbAgents.map((agent) => (
                        <option key={agent.id} value={agent.name}>
                          👤 {agent.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                      t.priority === "URGENT" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      t.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${
                      t.status === "RESOLVED" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                      t.status === "IN_PROGRESS" ? "text-indigo-400 border-indigo-500/20 bg-indigo-500/5" :
                      "text-amber-400 border-amber-500/20 bg-amber-500/5"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleOpenModal(t)}
                      className="px-3 py-1.5 text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      Reply & Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Reply & Management Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-scaleUp">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#1e293b] pb-3">
              <div>
                <span className="font-mono text-[10px] text-indigo-400 font-bold">{selectedTicket.id}</span>
                <h3 className="text-sm font-black text-white">{selectedTicket.subject}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">By {selectedTicket.sellerName} ({selectedTicket.email})</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white text-base font-bold transition cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Last Update */}
              <div className="bg-[#0b1120] border border-[#1e293b] p-3 rounded-xl text-slate-300 text-xs">
                <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Ticket Content / Last Update</span>
                <p className="leading-relaxed whitespace-pre-line">{selectedTicket.lastReply || selectedTicket.subject}</p>
              </div>

              <form onSubmit={handleReplySubmit} className="space-y-4">
                {/* Agent Assignment & Status Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Assign Support Agent</label>
                    <select
                      value={assignAgent}
                      onChange={(e) => setAssignAgent(e.target.value)}
                      className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Unassigned">Unassigned</option>
                      {dbAgents.map((agent) => (
                        <option key={agent.id} value={agent.name}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Update Status</label>
                    <select
                      value={ticketStatus}
                      onChange={(e) => setTicketStatus(e.target.value)}
                      className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved / Closed</option>
                      <option value="OPEN">Keep Open</option>
                    </select>
                  </div>
                </div>

                {/* Support Response Textarea */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 block">Support Agent Official Response</label>
                  <textarea
                    rows={4}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type official response or update to merchant..."
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1 px-4 py-2.5 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    {updateMutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{updateMutation.isPending ? "Updating..." : "Save & Submit Response"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
