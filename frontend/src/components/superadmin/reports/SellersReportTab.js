"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function SellersReportTab() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReportSellers"],
    queryFn: () => api.get("/admin/reports/sellers").then((res) => res.data || res || {}),
  });

  const raw = reportData?.data || reportData || {};
  const totalSellers = raw?.totalSellers || 0;
  const activeSellers = raw?.activeSellers || 0;
  const suspendedSellers = raw?.suspendedSellers || 0;
  const topSellers = raw?.topSellers || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>👥</span> Seller Growth & Activity Analytics
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Seller registration metrics, active ratio, and top volume merchant leaderboard.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Registered Sellers</span>
          <div className="text-2xl font-black text-white">{totalSellers}</div>
          <p className="text-[10px] text-slate-400">Registered merchant accounts</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Active Sellers Ratio</span>
          <div className="text-2xl font-black text-emerald-400">{activeSellers} Active</div>
          <p className="text-[10px] text-slate-400">Verified & active accounts</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Suspended Sellers</span>
          <div className="text-2xl font-black text-rose-400">{suspendedSellers}</div>
          <p className="text-[10px] text-slate-400">Accounts flagged/suspended</p>
        </div>
      </div>

      {/* Top Sellers Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a]">
        <div className="px-6 py-4 border-b border-[#1e293b]">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wide">
            Top Merchants Leaderboard
          </h3>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-6 py-3.5">Merchant Name</th>
              <th className="px-4 py-3.5">Company / Store</th>
              <th className="px-4 py-3.5">Email</th>
              <th className="px-4 py-3.5 text-center">Total Orders</th>
              <th className="px-6 py-3.5 text-right">Wallet Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-400">Loading sellers leaderboard...</td>
              </tr>
            ) : topSellers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-400">No active sellers found in database.</td>
              </tr>
            ) : (
              topSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-[#0c1324]/50 transition text-slate-300">
                  <td className="px-6 py-3.5 font-bold text-white">{seller.name}</td>
                  <td className="px-4 py-3.5 text-slate-400">{seller.company}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">{seller.email}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-indigo-400">{seller.totalOrders}</td>
                  <td className="px-6 py-3.5 text-right font-mono font-bold text-emerald-400">₹{(seller.walletBalance || 0).toLocaleString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
