"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function WalletReportTab() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReportWallet"],
    queryFn: () => api.get("/admin/reports/wallet").then((res) => res?.data || res || {}),
  });

  const raw = reportData?.data || reportData || {};
  const totalTx = raw?.totalTransactions || 0;
  const recharged = raw?.totalRecharged || 0;
  const spent = raw?.totalSpent || 0;
  const avgRecharge = raw?.avgRechargeValue || "0.00";

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>💰</span> Wallet Recharges & Spend Analytics
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Total wallet recharges collected, shipping debits, and average top-up size.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Wallet Recharges</span>
          <div className="text-2xl font-black text-emerald-400">₹{recharged.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400">Total credited to wallets</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Shipping Debits</span>
          <div className="text-2xl font-black text-indigo-400">₹{spent.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400">Deducted for freight & labels</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Average Recharge Value</span>
          <div className="text-2xl font-black text-amber-400">₹{avgRecharge}</div>
          <p className="text-[10px] text-slate-400">Per recharge transaction</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Ledger Entries</span>
          <div className="text-2xl font-black text-white">{totalTx}</div>
          <p className="text-[10px] text-slate-400">Ledger audit records</p>
        </div>
      </div>
    </div>
  );
}
