"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function WhatsAppTab() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [testMobile, setTestMobile] = useState("");
  const [testing, setTesting] = useState(false);

  const [form, setForm] = useState({
    waProvider: "META_WABA",
    waPhoneNumberId: "",
    waWabaId: "",
    waAccessToken: "",
    waPhoneNumber: "+91 98765 43210",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: responseData } = useQuery({
    queryKey: ["globalNotificationSettings"],
    queryFn: () => api.get("/admin/notifications/settings").then((res) => res.data || {}),
  });

  useEffect(() => {
    if (responseData) {
      setForm({
        waProvider: responseData.waProvider || "META_WABA",
        waPhoneNumberId: responseData.waPhoneNumberId || "",
        waWabaId: responseData.waWabaId || "",
        waAccessToken: responseData.waAccessToken || "",
        waPhoneNumber: responseData.waPhoneNumber || "+91 98765 43210",
      });
    }
  }, [responseData]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/admin/notifications/settings", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["globalNotificationSettings"]);
      showToast(res.message || "WhatsApp API settings saved!");
    },
    onError: (err) => {
      showToast(err.message || "Failed to save settings.", "error");
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleTestSend = async () => {
    if (!testMobile) {
      showToast("Please enter a test WhatsApp mobile number.", "error");
      return;
    }
    setTesting(true);
    try {
      const res = await api.post("/admin/notifications/test-send", {
        channel: "WHATSAPP",
        recipient: testMobile,
        message: "Test WhatsApp message from BeeShip WABA Gateway",
      });
      showToast(res.message || "Test WhatsApp message sent!");
    } catch (err) {
      showToast(err.message || "Test message failed.", "error");
    } finally {
      setTesting(false);
    }
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
            <span>💚</span> Global WhatsApp Business API (WABA) Configuration
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Connect Meta WABA Cloud API or Interakt/AiSensy. Single WABA subscription dispatches all WhatsApp shipping alerts.
          </p>
        </div>
        <span className="px-2.5 py-1 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg text-[10px] font-black uppercase">
          🟢 WABA Connected
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
            Meta WABA Credentials
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">WhatsApp Provider</label>
                <select
                  value={form.waProvider}
                  onChange={(e) => setForm({ ...form, waProvider: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="META_WABA">Meta WhatsApp Cloud API (Direct)</option>
                  <option value="INTERAKT">Interakt.ai Gateway</option>
                  <option value="AISENSY">AiSensy WhatsApp Gateway</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Sender WhatsApp Number</label>
                <input
                  type="text"
                  required
                  value={form.waPhoneNumber}
                  onChange={(e) => setForm({ ...form, waPhoneNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">WABA Phone Number ID</label>
                <input
                  type="text"
                  required
                  value={form.waPhoneNumberId}
                  onChange={(e) => setForm({ ...form, waPhoneNumberId: e.target.value })}
                  placeholder="e.g. 109283746192837"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">WABA Account ID</label>
                <input
                  type="text"
                  required
                  value={form.waWabaId}
                  onChange={(e) => setForm({ ...form, waWabaId: e.target.value })}
                  placeholder="e.g. 98712365412398"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">Permanent Access Token</label>
              <input
                type="password"
                required
                value={form.waAccessToken}
                onChange={(e) => setForm({ ...form, waAccessToken: e.target.value })}
                placeholder="EAAG...."
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saveMutation.isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                {saveMutation.isLoading ? "Saving Settings..." : "Save WhatsApp WABA Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* Test WhatsApp Panel */}
        <div className="space-y-4">
          <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
              🧪 Send Test WhatsApp Alert
            </h3>
            <p className="text-[10px] text-slate-400">
              Verify your WhatsApp Business API connection with a test message.
            </p>
            <div className="space-y-2">
              <input
                type="tel"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
                placeholder="Enter +91 WhatsApp number..."
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestSend}
                disabled={testing}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {testing ? "Dispatching..." : "Send Test WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
