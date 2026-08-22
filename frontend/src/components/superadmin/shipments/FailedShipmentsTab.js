"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function FailedShipmentsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ["superadminFailedShipments", search, page],
    queryFn: () => {
      const q = new URLSearchParams({ page: String(page), limit: "20", hasAwb: "true", onlyFailed: "true" });
      if (search) q.append("search", search);
      return api.get(`/admin/orders?${q.toString()}`).then((res) => res || {});
    },
  });

  const shipments = responseData?.data || [];
  const meta = responseData?.meta || { total: 0, totalPages: 1 };

  const handleRetry = async (orderId) => {
    try {
      const res = await api.post(`/admin/orders/${orderId}/retry`);
      if (res && res.success) {
        showToast(res.message || "Shipment retry initiated successfully.", "success");
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to retry shipment.", "error");
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-bold ${
          toast.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div>
        <h3 className="text-sm font-black text-white">Failed / Stuck Shipments</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">Manage and retry failed, NDR, RTO, or stuck shipments.</p>
      </div>

      <div className="relative max-w-md select-none">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search failed shipments by AWB, Order ID, Seller..."
          className="w-full bg-[#0b1120] border border-[#1e293b] focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 px-4 text-xs text-white placeholder-slate-500 transition"
        />
      </div>

      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 bg-[#080d1a]/85 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              <th className="px-4 py-3">Shipment</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Courier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-slate-500">No failed shipments found.</td>
              </tr>
            ) : (
              shipments.map((item) => (
                <tr key={item.id} className="border-b border-[#1e293b]/50 text-slate-300">
                  <td className="px-4 py-3">
                    <p className="font-bold text-white">AWB: {item.awbNumber || "—"}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.orderId}</p>
                  </td>
                  <td className="px-4 py-3">{item.user?.companyName || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{item.vendor}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[9px] font-black uppercase">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRetry(item.id)}
                      className="px-3 py-1 bg-[#10b981] hover:bg-[#059669] text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
                    >
                      Retry Shipment
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
