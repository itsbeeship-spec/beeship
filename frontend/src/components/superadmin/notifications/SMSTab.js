"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function SMSTab() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [testMobile, setTestMobile] = useState("");
  const [testing, setTesting] = useState(false);

  const [form, setForm] = useState({
    smsProvider: "FAST2SMS",
    smsApiKey: "",
    smsSenderId: "BEESHIP",
    smsDltEntityId: "",
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
        smsProvider: responseData.smsProvider || "FAST2SMS",
        smsApiKey: responseData.smsApiKey || "",
        smsSenderId: responseData.smsSenderId || "BEESHIP",
        smsDltEntityId: responseData.smsDltEntityId || "",
      });
    }
  }, [responseData]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/admin/notifications/settings", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["globalNotificationSettings"]);
      showToast(res.message || "SMS gateway settings saved!");
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
      showToast("Please enter a test mobile number.", "error");
      return;
    }
    setTesting(true);
    try {
      const res = await api.post("/admin/notifications/test-send", {
        channel: "SMS",
        recipient: testMobile,
        message: "Test SMS alert from BeeShip Global Gateway",
      });
      showToast(res.message || "Test SMS dispatched!");
    } catch (err) {
      showToast(err.message || "Test SMS failed.", "error");
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
            <span>📱</span> Global SMS Gateway Configuration
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Configure Fast2SMS or MSG91 API key, Sender ID, and DLT Entity ID for buyer SMS updates.
          </p>
        </div>
        <span className="px-2.5 py-1 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg text-[10px] font-black uppercase">
          🟢 SMS Gateway Ready
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
            SMS Provider & DLT Settings
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">SMS Gateway Provider</label>
                <select
                  value={form.smsProvider}
                  onChange={(e) => setForm({ ...form, smsProvider: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="FAST2SMS">Fast2SMS (Quick / Transactional)</option>
                  <option value="MSG91">MSG91 India DLT Gateway</option>
                  <option value="TWILIO">Twilio SMS International</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Header / Sender ID (6 Chars)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={form.smsSenderId}
                  onChange={(e) => setForm({ ...form, smsSenderId: e.target.value.toUpperCase() })}
                  placeholder="BEESHIP"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono font-bold uppercase text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">API Key / Auth Token</label>
              <input
                type="password"
                required
                value={form.smsApiKey}
                onChange={(e) => setForm({ ...form, smsApiKey: e.target.value })}
                placeholder="Enter SMS provider authorization key..."
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">TRAI DLT Entity ID (India Mandate)</label>
              <input
                type="text"
                value={form.smsDltEntityId}
                onChange={(e) => setForm({ ...form, smsDltEntityId: e.target.value })}
                placeholder="e.g. 130115980029312384"
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Required for Indian DLT TRAI compliance rules.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saveMutation.isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                {saveMutation.isLoading ? "Saving Settings..." : "Save SMS Gateway Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* Test SMS Panel */}
        <div className="space-y-4">
          <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
              🧪 Send Test SMS
            </h3>
            <p className="text-[10px] text-slate-400">
              Test your SMS provider credentials with a test mobile alert.
            </p>
            <div className="space-y-2">
              <input
                type="tel"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
                placeholder="Enter +91 mobile number..."
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestSend}
                disabled={testing}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {testing ? "Dispatching..." : "Send Test SMS"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
