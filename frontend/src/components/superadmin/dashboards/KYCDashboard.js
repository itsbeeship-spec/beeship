"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

function StatCard({ label, value, sub, color, icon }) {
  const colors = {
    amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   icon: "bg-amber-500/20" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "bg-emerald-500/20" },
    rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    icon: "bg-rose-500/20" },
    blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    icon: "bg-blue-500/20" },
  };
  const c = colors[color] || colors.amber;
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
    amber:   "from-amber-600/80 to-amber-700/80 hover:from-amber-500/90",
    emerald: "from-emerald-600/80 to-emerald-700/80 hover:from-emerald-500/90",
    rose:    "from-rose-600/80 to-rose-700/80 hover:from-rose-500/90",
    blue:    "from-blue-600/80 to-blue-700/80 hover:from-blue-500/90",
  };
  return (
    <a href={href} className={`bg-gradient-to-br ${colors[color] || colors.amber} rounded-xl p-4 flex flex-col gap-1 transition-all duration-200`}>
      <p className="text-white font-bold text-sm">{label}</p>
      <p className="text-white/60 text-[10px]">{desc}</p>
    </a>
  );
}

export default function KYCDashboard({ user }) {
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ["admin", "stats", "kyc"],
    queryFn: () => api.get("/admin/stats/kyc").catch(() => ({
      data: { pending: null, approved: null, rejected: null, totalSellers: null }
    })).then(res => res.data),
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Welcome, {user?.firstName}! 📋</h1>
        <p className="text-slate-400 text-sm mt-1">KYC Admin Dashboard — Verification, Documents & Approvals</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending KYC" value={loading ? "..." : (stats?.pending ?? "N/A")} sub="Awaiting review" color="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <StatCard label="Approved" value={loading ? "..." : (stats?.approved ?? "N/A")} sub="Verified sellers" color="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <StatCard label="Rejected" value={loading ? "..." : (stats?.rejected ?? "N/A")} sub="Need re-submission" color="rose" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <StatCard label="Total Sellers" value={loading ? "..." : (stats?.totalSellers ?? "N/A")} sub="On platform" color="blue" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        } />
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink href="/superadmin/kyc/pending"   label="Pending Verification" desc="Review pending KYC requests"     color="amber" />
          <QuickLink href="/superadmin/kyc/approved"  label="Approved KYC"         desc="View verified sellers"           color="emerald" />
          <QuickLink href="/superadmin/kyc/rejected"  label="Rejected KYC"         desc="Handle rejected applications"   color="rose" />
          <QuickLink href="/superadmin/kyc/documents" label="Documents"            desc="GST / PAN / Aadhaar review"     color="amber" />
          <QuickLink href="/superadmin/users/sellers" label="Seller List"          desc="Browse all registered sellers"  color="blue" />
        </div>
      </div>
    </div>
  );
}
