"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function CODReportTab() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReportCOD"],
    queryFn: () => api.get("/admin/reports/cod").then((res) => res.data || res || {}),
  });

  const raw = reportData?.data || reportData || {};
  const orders = raw?.codOrders || 0;
  const collected = raw?.totalCodCollected || 0;
  const remitted = raw?.totalRemitted || 0;
  const pending = raw?.pendingRemittance || 0;
  const rate = raw?.remittanceSuccessRate || "0%";

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>💵</span> COD Collection & Remittance Analytics
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Cash on Delivery collections from couriers, remitted payouts to merchants, and unsettled balance aging.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total COD Collected</span>
          <div className="text-2xl font-black text-emerald-400">₹{collected.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400">Cash received from couriers ({orders} COD Orders)</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Remitted to Sellers</span>
          <div className="text-2xl font-black text-indigo-400">₹{remitted.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400">Transferred to seller bank accounts</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Pending Remittance</span>
          <div className="text-2xl font-black text-amber-400">₹{pending.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400">In settlement cycle</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Settlement Rate</span>
          <div className="text-2xl font-black text-white">{rate}</div>
          <p className="text-[10px] text-slate-400">On-time remittance rate</p>
        </div>
      </div>
    </div>
  );
}
