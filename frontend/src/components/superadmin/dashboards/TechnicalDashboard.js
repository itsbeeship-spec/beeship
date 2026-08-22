"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

function StatCard({ label, value, sub, color, icon }) {
  const colors = {
    violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-400",  icon: "bg-violet-500/20" },
    blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    icon: "bg-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "bg-emerald-500/20" },
    rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    icon: "bg-rose-500/20" },
  };
  const c = colors[color] || colors.violet;
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${c.bg} ${c.border}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
        <span className={c.text}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${c.text}`}>{value ?? "—"}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function QuickLink({ href, label, desc, color }) {
  const colors = {
    violet:  "from-violet-600/80 to-violet-700/80 hover:from-violet-500/90",
    blue:    "from-blue-600/80 to-blue-700/80 hover:from-blue-500/90",
    emerald: "from-emerald-600/80 to-emerald-700/80 hover:from-emerald-500/90",
    rose:    "from-rose-600/80 to-rose-700/80 hover:from-rose-500/90",
  };
  return (
    <a href={href} className={`bg-gradient-to-br ${colors[color] || colors.violet} rounded-xl p-4 flex flex-col gap-1 transition-all duration-200`}>
      <p className="text-white font-bold text-sm">{label}</p>
      <p className="text-white/60 text-[10px]">{desc}</p>
    </a>
  );
}

export default function TechnicalDashboard({ user }) {
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ["admin", "stats", "system"],
    queryFn: () => api.get("/admin/stats/system").catch(() => ({
      data: { apiCallsToday: null, errorRate: null, queueJobs: null, activeWebhooks: null }
    })).then(res => res.data),
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Welcome, {user?.firstName}! ⚙️</h1>
        <p className="text-slate-400 text-sm mt-1">Technical Admin Dashboard — APIs, Logs, Queue & System Health</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="API Calls Today" value={loading ? "..." : (stats?.apiCallsToday ?? "N/A")} sub="Total requests" color="violet" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        } />
        <StatCard label="Error Rate" value={loading ? "..." : (stats?.errorRate != null ? `${stats.errorRate}%` : "N/A")} sub="Last 24h" color="rose" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        } />
        <StatCard label="Queue Jobs" value={loading ? "..." : (stats?.queueJobs ?? "N/A")} sub="Pending in queue" color="blue" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
        } />
        <StatCard label="Active Webhooks" value={loading ? "..." : (stats?.activeWebhooks ?? "N/A")} sub="Configured endpoints" color="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        } />
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink href="/superadmin/api/keys"         label="API Keys"           desc="Manage API access keys"         color="violet" />
          <QuickLink href="/superadmin/api/webhooks"     label="Webhooks"           desc="Configure webhook endpoints"    color="blue" />
          <QuickLink href="/superadmin/api/logs"         label="API Logs"           desc="Review recent API calls"        color="violet" />
          <QuickLink href="/superadmin/monitoring/queue" label="Queue Monitor"      desc="View and manage job queue"      color="blue" />
          <QuickLink href="/superadmin/monitoring/cron"  label="Cron Jobs"          desc="Manage scheduled jobs"          color="emerald" />
          <QuickLink href="/superadmin/monitoring/errors" label="Error Logs"        desc="Review system errors"           color="rose" />
        </div>
      </div>
    </div>
  );
}
