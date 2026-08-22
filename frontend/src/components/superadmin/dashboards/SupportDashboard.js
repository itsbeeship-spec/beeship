"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

function StatCard({ label, value, sub, color, icon }) {
  const colors = {
    sky:     { bg: "bg-sky-500/10",     border: "border-sky-500/20",     text: "text-sky-400",     icon: "bg-sky-500/20" },
    blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    icon: "bg-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "bg-emerald-500/20" },
    amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   icon: "bg-amber-500/20" },
  };
  const c = colors[color] || colors.sky;
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
    sky:     "from-sky-600/80 to-sky-700/80 hover:from-sky-500/90",
    blue:    "from-blue-600/80 to-blue-700/80 hover:from-blue-500/90",
    emerald: "from-emerald-600/80 to-emerald-700/80 hover:from-emerald-500/90",
    amber:   "from-amber-600/80 to-amber-700/80 hover:from-amber-500/90",
  };
  return (
    <a href={href} className={`bg-gradient-to-br ${colors[color] || colors.sky} rounded-xl p-4 flex flex-col gap-1 transition-all duration-200`}>
      <p className="text-white font-bold text-sm">{label}</p>
      <p className="text-white/60 text-[10px]">{desc}</p>
    </a>
  );
}

export default function SupportDashboard({ user }) {
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ["admin", "stats", "support"],
    queryFn: () => api.get("/admin/stats/support").catch(() => ({
      data: { openTickets: null, resolvedToday: null, avgResponseTime: null, activeChats: null }
    })).then(res => res.data),
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Welcome, {user?.firstName}! 🎧</h1>
        <p className="text-slate-400 text-sm mt-1">Support Admin Dashboard — Tickets, Chat & Seller Assistance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Tickets" value={loading ? "..." : (stats?.openTickets ?? "N/A")} sub="Pending resolution" color="sky" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
        } />
        <StatCard label="Resolved Today" value={loading ? "..." : (stats?.resolvedToday ?? "N/A")} sub="Last 24h" color="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <StatCard label="Active Chats" value={loading ? "..." : (stats?.activeChats ?? "N/A")} sub="Live right now" color="blue" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        } />
        <StatCard label="Avg Response" value={loading ? "..." : (stats?.avgResponseTime ?? "N/A")} sub="Response time" color="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink href="/superadmin/support/tickets"  label="Support Tickets"   desc="Manage all open tickets"        color="sky" />
          <QuickLink href="/superadmin/support/chat"     label="Live Chat"         desc="Join active chat sessions"      color="blue" />
          <QuickLink href="/superadmin/support/assign"   label="Assign Agent"      desc="Route tickets to agents"        color="emerald" />
          <QuickLink href="/superadmin/orders/all"       label="View Orders"       desc="Check order status for sellers" color="blue" />
          <QuickLink href="/superadmin/users/sellers"    label="Seller List"       desc="Find and assist sellers"        color="sky" />
          <QuickLink href="/superadmin/finance/wallets"  label="Wallet View"       desc="Check seller wallet balances"   color="amber" />
        </div>
      </div>
    </div>
  );
}
