"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function TemplatesTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    channel: "EMAIL",
    eventKey: "ORDER_CREATED",
    title: "",
    subject: "",
    content: "",
    dltTemplateId: "",
    waApproved: true,
    active: true,
  });

  const placeholders = [
    "{{customer_name}}",
    "{{seller_brand_name}}",
    "{{order_id}}",
    "{{awb_number}}",
    "{{courier_name}}",
    "{{tracking_url}}",
    "{{order_amount}}",
  ];

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["adminNotificationTemplates"],
    queryFn: () => api.get("/admin/notifications/templates").then((res) => res.data || []),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editingTemplate) {
        return api.put(`/admin/notifications/templates/${editingTemplate.id}`, payload);
      }
      return api.post("/admin/notifications/templates", payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(["adminNotificationTemplates"]);
      showToast(res.message || "Template saved successfully!");
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      showToast(err.message || "Failed to save template.", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/notifications/templates/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["adminNotificationTemplates"]);
      showToast(res.message || "Template deleted!");
    },
  });

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      channel: "EMAIL",
      eventKey: "ORDER_CREATED",
      title: "",
      subject: "",
      content: "",
      dltTemplateId: "",
      waApproved: true,
      active: true,
    });
  };

  const handleEdit = (tpl) => {
    setEditingTemplate(tpl);
    setFormData({
      channel: tpl.channel,
      eventKey: tpl.eventKey,
      title: tpl.title || "",
      subject: tpl.subject || "",
      content: tpl.content || "",
      dltTemplateId: tpl.dltTemplateId || "",
      waApproved: Boolean(tpl.waApproved),
      active: Boolean(tpl.active),
    });
    setModalOpen(true);
  };

  const handleInsertTag = (tag) => {
    setFormData((prev) => ({ ...prev, content: prev.content + " " + tag }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showToast("Title and Content are required.", "error");
      return;
    }
    saveMutation.mutate(formData);
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
            <span>📝</span> Dynamic Multi-Channel Templates Manager
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Configure automated message templates across Email, SMS, WhatsApp and Push channels with dynamic tag substitution.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span> Create Template
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3.5">Channel</th>
              <th className="px-4 py-3.5">Event Trigger</th>
              <th className="px-4 py-3.5">Template Title</th>
              <th className="px-4 py-3.5">DLT / WABA Status</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-400 font-semibold">
                  Loading templates...
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-400 font-semibold">
                  No templates created yet. Click "+ Create Template" to add one.
                </td>
              </tr>
            ) : (
              templates.map((tpl) => (
                <tr key={tpl.id} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30 transition">
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                      tpl.channel === "EMAIL" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      tpl.channel === "SMS" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      tpl.channel === "WHATSAPP" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {tpl.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-200 text-xs">
                    {tpl.eventKey}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-white">
                    {tpl.title}
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-slate-400 font-mono">
                    {tpl.dltTemplateId ? `DLT: ${tpl.dltTemplateId}` : tpl.waApproved ? "WABA Approved ✓" : "Standard"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${
                      tpl.active 
                        ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
                        : "text-slate-400 border-slate-700/50 bg-slate-800/30"
                    }`}>
                      {tpl.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(tpl)}
                        className="px-2.5 py-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete template ${tpl.title}?`)) {
                            deleteMutation.mutate(tpl.id);
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

      {/* Modal for Create/Edit Template */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-black text-white">
                {editingTemplate ? "Edit Template" : "Create Notification Template"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Configure content and placeholders for automated customer triggers.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Target Channel</label>
                  <select
                    disabled={Boolean(editingTemplate)}
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="PUSH">Push Notification</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Event Key *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingTemplate)}
                    value={formData.eventKey}
                    onChange={(e) => setFormData({ ...formData, eventKey: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. ORDER_CREATED"
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono font-bold uppercase text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Template Display Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Order Confirmation Email"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              {formData.channel === "EMAIL" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Email Subject Line</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Order Confirmed - #{{order_id}}"
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {formData.channel === "SMS" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">DLT Template ID (India)</label>
                  <input
                    type="text"
                    value={formData.dltTemplateId}
                    onChange={(e) => setFormData({ ...formData, dltTemplateId: e.target.value })}
                    placeholder="e.g. DLT-10092834"
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Template Content *</label>
                  <span className="text-[9px] text-indigo-400 font-semibold">Click tag to insert:</span>
                </div>

                {/* Available Placeholder Tags Toolbar */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#0b1120] border border-[#1e293b] rounded-xl">
                  {placeholders.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-mono transition cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter message body with placeholders..."
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
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
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {saveMutation.isLoading ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
