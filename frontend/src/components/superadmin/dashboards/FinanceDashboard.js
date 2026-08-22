"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

function StatCard({ label, value, sub, color, icon }) {
  const colors = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "bg-emerald-500/20" },
    blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    icon: "bg-blue-500/20" },
    amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   icon: "bg-amber-500/20" },
    rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    icon: "bg-rose-500/20" },
  };
  const c = colors[color] || colors.emerald;
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
    emerald: "from-emerald-600/80 to-emerald-700/80 hover:from-emerald-500/90",
    blue:    "from-blue-600/80 to-blue-700/80 hover:from-blue-500/90",
    amber:   "from-amber-600/80 to-amber-700/80 hover:from-amber-500/90",
    rose:    "from-rose-600/80 to-rose-700/80 hover:from-rose-500/90",
  };
  return (
    <a href={href} className={`bg-gradient-to-br ${colors[color] || colors.emerald} rounded-xl p-4 flex flex-col gap-1 transition-all duration-200`}>
      <p className="text-white font-bold text-sm">{label}</p>
      <p className="text-white/60 text-[10px]">{desc}</p>
    </a>
  );
}

export default function FinanceDashboard({ user }) {
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ["admin", "stats", "finance"],
    queryFn: async () => {
      const [walletRes, txRes] = await Promise.all([
        api.get("/admin/stats/wallets").catch(() => ({ data: { totalBalance: null, totalSellers: null } })),
        api.get("/admin/stats/transactions").catch(() => ({ data: { today: null, pending: null } })),
      ]);
      return { wallet: walletRes.data, tx: txRes.data };
    },
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Welcome, {user?.firstName}! 💰</h1>
        <p className="text-slate-400 text-sm mt-1">Finance Admin Dashboard — Wallet, Transactions & Financial Reports</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Wallet Balance" value={loading ? "..." : (stats?.wallet?.totalBalance != null ? `₹${stats.wallet.totalBalance}` : "N/A")} sub="All sellers combined" color="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
        } />
        <StatCard label="Today's Transactions" value={loading ? "..." : (stats?.tx?.today ?? "N/A")} sub="Last 24h" color="blue" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        } />
        <StatCard label="Pending Refunds" value={loading ? "..." : (stats?.tx?.pending ?? "N/A")} sub="Awaiting processing" color="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        } />
        <StatCard label="Wallet Sellers" value={loading ? "..." : (stats?.wallet?.totalSellers ?? "N/A")} sub="With active wallet" color="rose" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        } />
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink href="/superadmin/finance/wallets"        label="Seller Wallets"     desc="View all seller wallets"        color="emerald" />
          <QuickLink href="/superadmin/finance/transactions"   label="Transactions"       desc="All transaction history"        color="blue" />
          <QuickLink href="/superadmin/finance/refunds"        label="Refunds"            desc="Process pending refunds"        color="amber" />
          <QuickLink href="/superadmin/finance/cod-settlement" label="COD Settlement"     desc="Manage COD payouts"             color="emerald" />
          <QuickLink href="/superadmin/finance/gst-reports"    label="GST Reports"        desc="Download financial reports"     color="blue" />
          <QuickLink href="/superadmin/reports/revenue"        label="Revenue Report"     desc="Platform revenue analytics"     color="rose" />
        </div>
      </div>
    </div>
  );
}
