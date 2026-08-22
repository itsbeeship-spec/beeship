"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function EmailTab() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  const [form, setForm] = useState({
    emailProvider: "SMTP",
    emailHost: "smtp.gmail.com",
    emailPort: 587,
    emailUser: "notifications@beeship.com",
    emailPass: "••••••••",
    fromEmail: "notifications@beeship.com",
    fromName: "BeeShip Alerts",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["globalNotificationSettings"],
    queryFn: () => api.get("/admin/notifications/settings").then((res) => res.data || {}),
  });

  useEffect(() => {
    if (responseData) {
      setForm({
        emailProvider: responseData.emailProvider || "SMTP",
        emailHost: responseData.emailHost || "smtp.gmail.com",
        emailPort: responseData.emailPort || 587,
        emailUser: responseData.emailUser || "notifications@beeship.com",
        emailPass: responseData.emailPass || "••••••••",
        fromEmail: responseData.fromEmail || "notifications@beeship.com",
        fromName: responseData.fromName || "BeeShip Alerts",
      });
    }
  }, [responseData]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/admin/notifications/settings", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["globalNotificationSettings"]);
      showToast(res.message || "Email gateway settings saved!");
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
    if (!testEmail) {
      showToast("Please enter a test recipient email address.", "error");
      return;
    }
    setTesting(true);
    try {
      const res = await api.post("/admin/notifications/test-send", {
        channel: "EMAIL",
        recipient: testEmail,
        message: "Test email from BeeShip Global Email Gateway",
      });
      showToast(res.message || "Test email sent!");
    } catch (err) {
      showToast(err.message || "Test email failed.", "error");
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
            <span>📧</span> Global Email Gateway Configuration
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Configure central SMTP or AWS SES credentials. All transactional emails for buyers & sellers are dispatched via this single subscription.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg text-[10px] font-black uppercase">
            🟢 Status: Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
            Mail Provider Credentials
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Email Provider</label>
                <select
                  value={form.emailProvider}
                  onChange={(e) => setForm({ ...form, emailProvider: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition font-bold"
                >
                  <option value="SMTP">Custom SMTP Server</option>
                  <option value="SES">Amazon SES / SendGrid API</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">SMTP Host / Endpoint</label>
                <input
                  type="text"
                  required
                  value={form.emailHost}
                  onChange={(e) => setForm({ ...form, emailHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">SMTP Port</label>
                <input
                  type="number"
                  required
                  value={form.emailPort}
                  onChange={(e) => setForm({ ...form, emailPort: parseInt(e.target.value, 10) || 587 })}
                  placeholder="587"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Username / API Key</label>
                <input
                  type="text"
                  required
                  value={form.emailUser}
                  onChange={(e) => setForm({ ...form, emailUser: e.target.value })}
                  placeholder="notifications@beeship.com"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Password / Secret Key</label>
                <input
                  type="password"
                  required
                  value={form.emailPass}
                  onChange={(e) => setForm({ ...form, emailPass: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Default Sender Name</label>
                <input
                  type="text"
                  required
                  value={form.fromName}
                  onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                  placeholder="BeeShip Alerts"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">From Email Address</label>
              <input
                type="email"
                required
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                placeholder="notifications@beeship.com"
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saveMutation.isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                {saveMutation.isLoading ? "Saving Settings..." : "Save Email Gateway Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* Test Email & Information Panel */}
        <div className="space-y-4">
          <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wide border-b border-[#1e293b] pb-3">
              🧪 Dispatch Test Email
            </h3>
            <p className="text-[10px] text-slate-400">
              Verify your SMTP connection by sending a real-time test mail.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter recipient email..."
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestSend}
                disabled={testing}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {testing ? "Dispatching..." : "Send Test Email"}
              </button>
            </div>
          </div>

          <div className="border border-[#1e293b] rounded-2xl bg-[#0c1324] p-5 space-y-2 text-[11px] text-slate-300">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>ℹ️</span> Multi-Tenant Branding Note
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Emails sent to buyers will display the individual Seller's Store Name in the footer and subject line automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
