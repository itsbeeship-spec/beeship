"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function BroadcastTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    subject: "",
    message: "",
    targetType: "ALL",
    targetSellerId: "",
    channels: ["EMAIL", "WHATSAPP"],
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Broadcast History
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["adminBroadcastLogs"],
    queryFn: () => api.get("/admin/notifications/broadcast").then((res) => res.data || []),
  });

  // Fetch Sellers for specific selection
  const { data: sellers = [] } = useQuery({
    queryKey: ["adminSellersListBroadcast"],
    queryFn: () => api.get("/admin/sellers?limit=200").then((res) => res.data?.sellers || res.sellers || []),
    staleTime: 5 * 60 * 1000,
  });

  // Create Broadcast Mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editingLog) {
        return api.put(`/admin/notifications/broadcast/${editingLog.id}`, payload);
      }
      return api.post("/admin/notifications/broadcast", payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(["adminBroadcastLogs"]);
      queryClient.invalidateQueries(["activePushBroadcast"]);
      showToast(res.message || (editingLog ? "Broadcast updated!" : "Broadcast dispatched!"));
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      showToast(err.message || "Failed to save broadcast.", "error");
    },
  });

  // Delete Broadcast Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/notifications/broadcast/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["adminBroadcastLogs"]);
      queryClient.invalidateQueries(["activePushBroadcast"]);
      showToast(res.message || "Broadcast deleted successfully!");
    },
    onError: (err) => {
      showToast(err.message || "Failed to delete broadcast.", "error");
    },
  });

  const resetForm = () => {
    setEditingLog(null);
    setForm({
      subject: "",
      message: "",
      targetType: "ALL",
      targetSellerId: "",
      channels: ["EMAIL", "WHATSAPP"],
    });
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setForm({
      subject: log.subject || "",
      message: log.message || "",
      targetType: log.targetType || "ALL",
      targetSellerId: log.targetSellerId || "",
      channels: log.channels || ["EMAIL"],
    });
    setModalOpen(true);
  };

  const handleChannelToggle = (ch) => {
    setForm((prev) => {
      const exists = prev.channels.includes(ch);
      const nextChannels = exists ? prev.channels.filter((c) => c !== ch) : [...prev.channels, ch];
      return { ...prev, channels: nextChannels };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      showToast("Subject and Message are required.", "error");
      return;
    }
    if (form.channels.length === 0) {
      showToast("Please select at least 1 channel.", "error");
      return;
    }
    saveMutation.mutate(form);
  };

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
            <span>📢</span> Mass Broadcast & Announcement Messenger
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Send platform announcements, maintenance notices or promotional offers to all sellers or targeted seller groups.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span> New Broadcast
        </button>
      </div>

      {/* Broadcast History Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3.5">Subject / Title</th>
              <th className="px-4 py-3.5">Target Audience</th>
              <th className="px-4 py-3.5">Channels Dispatched</th>
              <th className="px-4 py-3.5">Recipients</th>
              <th className="px-4 py-3.5">Date & Time</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-400 font-semibold">
                  Loading broadcast history...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-400 font-semibold">
                  No broadcasts dispatched yet. Click "+ New Broadcast" to send your first message.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30 transition">
                  <td className="px-4 py-3.5 font-bold text-white">
                    {log.subject}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700/50 rounded-lg text-[10px] font-bold">
                      {log.targetType === "ALL" ? "🌐 ALL Sellers" : log.targetType === "ACTIVE" ? "🟢 Active Sellers" : "👤 Specific Seller"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {log.channels.map((ch) => (
                        <span key={ch} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[9px] font-mono font-bold">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-200">
                    {log.recipientCount} Seller(s)
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                    {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg text-[9px] font-black uppercase">
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(log)}
                        className="px-2.5 py-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete broadcast message "${log.subject}"?`)) {
                            deleteMutation.mutate(log.id);
                          }
                        }}
                        className="px-2.5 py-1 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Broadcast Modal for Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-black text-white">
                {editingLog ? "Edit Broadcast Message" : "Create Mass Broadcast"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Send real-time alerts across Email, SMS, WhatsApp, or Push notifications.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Target Audience *</label>
                <select
                  value={form.targetType}
                  onChange={(e) => setForm({ ...form, targetType: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="ALL">🌐 ALL Registered Sellers</option>
                  <option value="ACTIVE">🟢 Active Sellers Only</option>
                  <option value="SPECIFIC">👤 Specific Individual Seller</option>
                </select>
              </div>

              {form.targetType === "SPECIFIC" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Select Seller</label>
                  <select
                    value={form.targetSellerId}
                    onChange={(e) => setForm({ ...form, targetSellerId: e.target.value })}
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="">Choose a seller...</option>
                    {Array.isArray(sellers) && sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        👤 {s.firstName} {s.lastName} — {s.companyName ? `${s.companyName} (${s.email})` : s.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Dispatch Channels *</label>
                <div className="grid grid-cols-4 gap-2">
                  {["EMAIL", "SMS", "WHATSAPP", "PUSH"].map((ch) => {
                    const active = form.channels.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => handleChannelToggle(ch)}
                        className={`py-1.5 text-center text-[10px] font-bold rounded-xl border transition cursor-pointer ${
                          active
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                            : "bg-[#0b1120] text-slate-400 border-[#1e293b] hover:bg-slate-800"
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
                {form.channels.includes("PUSH") && (
                  <p className="text-[10px] text-amber-300 font-semibold mt-1">
                    ⚡ PUSH messages flash as a Top Announcement Banner on Seller Dashboards!
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Subject / Title *</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Scheduled System Maintenance Alert"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Broadcast Message Body *</label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write announcement text..."
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
                >
                  {saveMutation.isLoading ? "Saving..." : editingLog ? "Save Changes" : "Dispatch Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
