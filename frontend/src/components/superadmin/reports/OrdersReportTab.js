"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function OrdersReportTab() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReportOrders"],
    queryFn: () => api.get("/admin/reports/orders").then((res) => res?.data || res || {}),
  });

  const raw = reportData?.data || reportData || {};
  const total = raw?.totalOrders || 0;
  const prepaid = raw?.prepaidOrders || 0;
  const cod = raw?.codOrders || 0;
  const cancelled = raw?.cancelledOrders || 0;
  const delivered = raw?.deliveredOrders || 0;
  const pending = raw?.pendingOrders || 0;
  const rate = raw?.fulfillmentRate || "0.0";

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>📦</span> Order Volume & Fulfillment Analytics
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Total order volume, prepaid vs COD split, cancellation rate, and overall fulfillment success.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Orders</span>
          <div className="text-2xl font-black text-white">{total}</div>
          <p className="text-[10px] text-slate-400">All system orders</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Fulfilled Orders</span>
          <div className="text-2xl font-black text-emerald-400">{delivered}</div>
          <p className="text-[10px] text-slate-400">Successfully shipped</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Pending / Unfulfilled</span>
          <div className="text-2xl font-black text-amber-400">{pending >= 0 ? pending : total - delivered - cancelled}</div>
          <p className="text-[10px] text-slate-400">Awaiting shipment</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Prepaid vs COD</span>
          <div className="text-lg font-black text-indigo-400">
            {prepaid} <span className="text-xs text-slate-400">Prepaid</span> / {cod} <span className="text-xs text-amber-400">COD</span>
          </div>
          <p className="text-[10px] text-slate-400">Payment mode split</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Fulfillment Rate</span>
          <div className="text-2xl font-black text-emerald-400">{rate}%</div>
          <p className="text-[10px] text-slate-400">Successfully fulfilled</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Cancelled Orders</span>
          <div className="text-2xl font-black text-rose-400">{cancelled}</div>
          <p className="text-[10px] text-slate-400">Merchant/buyer cancellations</p>
        </div>
      </div>
    </div>
  );
}
