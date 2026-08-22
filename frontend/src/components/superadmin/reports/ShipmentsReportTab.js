"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function ShipmentsReportTab() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["adminReportShipments"],
    queryFn: () => api.get("/admin/reports/shipments").then((res) => res?.data || res || {}),
  });

  const raw = reportData?.data || reportData || {};
  const total = raw?.totalShipments || 0;
  const delivered = raw?.delivered || 0;
  const inTransit = raw?.inTransit || 0;
  const cancelled = raw?.cancelled || 0;
  const rate = raw?.onTimeDeliveryRate || "0%";

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🚚</span> Logistics & Shipment Performance
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Logistics status distribution, in-transit parcels, and on-time delivery rates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Orders/Shipments</span>
          <div className="text-2xl font-black text-white">{total}</div>
          <p className="text-[10px] text-slate-400">Total manifest/AWB volume</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Fulfilled (Delivered)</span>
          <div className="text-2xl font-black text-emerald-400">{delivered}</div>
          <p className="text-[10px] text-slate-400">Successfully delivered</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">In Transit / Pending</span>
          <div className="text-2xl font-black text-indigo-400">{inTransit}</div>
          <p className="text-[10px] text-slate-400">Unfulfilled / in-flight</p>
        </div>

        <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] p-5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Delivery Rate</span>
          <div className="text-2xl font-black text-emerald-400">{rate}</div>
          <p className="text-[10px] text-slate-400">Fulfilled / total ratio</p>
        </div>
      </div>
    </div>
  );
}
