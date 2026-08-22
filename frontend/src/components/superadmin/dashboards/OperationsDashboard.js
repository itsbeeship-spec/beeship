"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  const colors = {
    blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    icon: "bg-blue-500/20" },
    indigo:  { bg: "bg-indigo-500/10",  border: "border-indigo-500/20",  text: "text-indigo-400",  icon: "bg-indigo-500/20" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "bg-emerald-500/20" },
    rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    icon: "bg-rose-500/20" },
    amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   icon: "bg-amber-500/20" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${c.bg} ${c.border}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
        <span className={`${c.text}`}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${c.text}`}>{value ?? "—"}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Quick Link ─────────────────────────────────────────────────────────────────
function QuickLink({ href, label, desc, color }) {
  const colors = {
    blue:    "from-blue-600/80 to-blue-700/80 hover:from-blue-500/90 hover:to-blue-600/90",
    emerald: "from-emerald-600/80 to-emerald-700/80 hover:from-emerald-500/90 hover:to-emerald-600/90",
    rose:    "from-rose-600/80 to-rose-700/80 hover:from-rose-500/90 hover:to-rose-600/90",
    amber:   "from-amber-600/80 to-amber-700/80 hover:from-amber-500/90 hover:to-amber-600/90",
    indigo:  "from-indigo-600/80 to-indigo-700/80 hover:from-indigo-500/90 hover:to-indigo-600/90",
  };
  return (
    <a
      href={href}
      className={`bg-gradient-to-br ${colors[color] || colors.blue} rounded-xl p-4 flex flex-col gap-1 transition-all duration-200 cursor-pointer`}
    >
      <p className="text-white font-bold text-sm">{label}</p>
      <p className="text-white/60 text-[10px]">{desc}</p>
    </a>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function OperationsDashboard({ user }) {
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ["admin", "stats", "operations"],
    queryFn: async () => {
      const [ordersRes, shipmentsRes, sellersRes] = await Promise.all([
        api.get("/admin/stats/orders").catch(() => ({ data: { total: null, today: null } })),
        api.get("/admin/stats/shipments").catch(() => ({ data: { total: null, active: null } })),
        api.get("/admin/stats/sellers").catch(() => ({ data: { total: null } })),
      ]);
      return {
        orders: ordersRes.data,
        shipments: shipmentsRes.data,
        sellers: sellersRes.data,
      };
    },
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Welcome, {user?.firstName}! 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Operations Admin Dashboard — Orders, Shipments & Courier Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={loading ? "..." : (stats?.orders?.total ?? "N/A")}
          sub="All time"
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        <StatCard
          label="Today's Orders"
          value={loading ? "..." : (stats?.orders?.today ?? "N/A")}
          sub="Last 24h"
          color="indigo"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Shipments"
          value={loading ? "..." : (stats?.shipments?.active ?? "N/A")}
          sub="In transit"
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          }
        />
        <StatCard
          label="Active Sellers"
          value={loading ? "..." : (stats?.sellers?.total ?? "N/A")}
          sub="On platform"
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink href="/superadmin/orders/all"       label="View All Orders"     desc="Browse and manage all orders"       color="blue" />
          <QuickLink href="/superadmin/shipments/all"    label="View Shipments"      desc="Track active shipments"             color="indigo" />
          <QuickLink href="/superadmin/orders/cancel"    label="Cancel Orders"       desc="Process cancellations"              color="rose" />
          <QuickLink href="/superadmin/shipments/reassign" label="Reassign Courier"  desc="Change courier for shipment"        color="amber" />
          <QuickLink href="/superadmin/couriers/ndr"     label="NDR Report"          desc="Non-delivery review"                color="rose" />
          <QuickLink href="/superadmin/couriers/rto"     label="RTO Report"          desc="Return-to-origin shipments"         color="emerald" />
        </div>
      </div>
    </div>
  );
}
