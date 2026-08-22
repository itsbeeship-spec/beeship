"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function PushTab() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [testToken, setTestToken] = useState("");
  const [testing, setTesting] = useState(false);

  const [form, setForm] = useState({
    fcmServerKey: "",
    fcmVapidKey: "",
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
        fcmServerKey: responseData.fcmServerKey || "",
        fcmVapidKey: responseData.fcmVapidKey || "",
      });
    }
  }, [responseData]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/admin/notifications/settings", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["globalNotificationSettings"]);
      showToast(res.message || "Push Notification credentials saved!");
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
    if (!testToken) {
      showToast("Please enter a test FCM registration token.", "error");
      return;
    }
    setTesting(true);
    try {
      const res = await api.post("/admin/notifications/test-send", {
        channel: "PUSH",
        recipient: testToken,
        message: "Test Push Notification from BeeShip FCM Gateway",
      });
      showToast(res.message || "Test Push notification sent!");
    } catch (err) {
      showToast(err.message || "Test push failed.", "error");
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
            <span>🔔</span> Firebase Web & Mobile Push Notification Config
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Configure Firebase Cloud Messaging (FCM) server key and VAPID key to push real-time web & mobile browser popups.
          </p>
        </div>
        <span className="px-2.5 py-1 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg text-[10px] font-black uppercase">
          🟢 FCM Gateway Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
            Firebase Cloud Messaging Credentials
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">FCM Server Key / Service Account Key</label>
              <textarea
                rows={3}
                required
                value={form.fcmServerKey}
                onChange={(e) => setForm({ ...form, fcmServerKey: e.target.value })}
                placeholder="AAAA...."
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">FCM Web Push VAPID Key</label>
              <input
                type="text"
                required
                value={form.fcmVapidKey}
                onChange={(e) => setForm({ ...form, fcmVapidKey: e.target.value })}
                placeholder="BElq...."
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saveMutation.isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                {saveMutation.isLoading ? "Saving Settings..." : "Save FCM Push Credentials"}
              </button>
            </div>
          </form>
        </div>

        {/* Test Push Panel */}
        <div className="space-y-4">
          <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
              🧪 Dispatch Test Push
            </h3>
            <p className="text-[10px] text-slate-400">
              Verify your FCM push setup by sending a test push alert.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                placeholder="Enter FCM Device Token..."
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestSend}
                disabled={testing}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {testing ? "Dispatching..." : "Send Test Push"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
