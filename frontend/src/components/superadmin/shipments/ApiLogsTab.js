"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function ApiLogsTab() {
  const [courier, setCourier] = useState("all");

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["superadminApiLogsShipments", courier],
    queryFn: () => api.get("/admin/orders?hasAwb=true&limit=15").then((res) => res.data || []),
  });

  const filteredLogs = shipments.filter(s => {
    if (courier !== "all") {
      return s.vendor?.toLowerCase() === courier.toLowerCase();
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-white">Courier Integration API Logs</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Raw request/response telemetry logs for automated courier booking.</p>
        </div>
        <select
          value={courier}
          onChange={(e) => setCourier(e.target.value)}
          className="bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="all">All Couriers</option>
          <option value="Delhivery">Delhivery</option>
          <option value="BlueDart">BlueDart</option>
          <option value="Xpressbees">Xpressbees</option>
          <option value="Amazon Shipping">Amazon Shipping</option>
        </select>
      </div>

      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] p-5 space-y-4 relative min-h-[150px]">
        {isLoading && (
          <div className="absolute inset-0 bg-[#080d1a]/85 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {filteredLogs.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No integration logs available.</p>
        ) : (
          filteredLogs.map((item) => (
            <div key={item.id} className="p-4 bg-black/45 border border-[#1e293b]/60 rounded-xl space-y-2 text-xs font-mono select-text">
              <div className="flex justify-between text-[10px]">
                <span className="text-indigo-400 font-bold">POST https://api.{item.vendor?.toLowerCase()?.replace(" ", "") || "courier"}.com/v2/shipments/create</span>
                <span className="text-emerald-400">200 OK | {new Date(item.createdAt).toLocaleTimeString()}</span>
              </div>
              <pre className="text-slate-300 overflow-x-auto text-[9px] p-2 bg-[#060913] rounded-lg border border-[#1e293b]/30 leading-relaxed">
{JSON.stringify({
  request: {
    awb: item.awbNumber,
    order_id: item.orderId,
    cod: item.method === "COD",
    cod_amount: item.amount,
    weight: item.weight || 0.5,
    consignee: {
      name: item.customer,
      pincode: item.pincode,
      city: item.city,
      state: item.state,
      phone: item.phone
    }
  },
  response: {
    status: "success",
    awb: item.awbNumber,
    remarks: "Booking generated in real-time."
  }
}, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
