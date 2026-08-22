"use client";

import React, { useState } from "react";
import api from "@/lib/api";

export default function ShipmentTimelineTab() {
  const [query, setQuery] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setShipment(null);

    try {
      // Find orders matching AWB or Order ID
      const res = await api.get(`/admin/orders?search=${encodeURIComponent(query.trim())}&hasAwb=true`);
      if (res && res.success && res.data && res.data.length > 0) {
        setShipment(res.data[0]);
      } else {
        setError("No active shipment found matching this AWB or Order ID.");
      }
    } catch (err) {
      setError(err.message || "Failed to search shipment timeline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h3 className="text-sm font-black text-white">Shipment Tracking & Timeline</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">Track live shipment checkpoints and transition milestones.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter AWB number or Order ID..."
          className="flex-1 bg-[#0b1120] border border-[#1e293b] focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 px-4 text-xs text-white placeholder-slate-500 transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          {loading ? "Tracking..." : "Track"}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {shipment && (
        <div className="bg-[#0b1120] border border-[#1e293b]/50 rounded-2xl p-5 space-y-6 text-xs">
          <div className="flex justify-between items-start border-b border-[#1e293b]/50 pb-3">
            <div>
              <h4 className="font-bold text-white text-sm">AWB: {shipment.awbNumber}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Order ID: #{shipment.orderId}</p>
            </div>
            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black uppercase text-[9px] rounded-lg">
              {shipment.status || "Booked"}
            </span>
          </div>

          <div className="space-y-4 pl-6 relative select-none">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#1e293b]" />
            
            {[
              { step: "Shipment Created", completed: true },
              { step: "Pickup Scheduled", completed: true },
              { step: "Picked Up", completed: shipment.status?.toLowerCase() !== "booked" },
              { step: "In Transit", completed: ["in transit", "out for delivery", "delivered", "fulfilled"].includes(shipment.status?.toLowerCase()) },
              { step: "Out for Delivery", completed: ["out for delivery", "delivered", "fulfilled"].includes(shipment.status?.toLowerCase()) },
              { step: "Delivered", completed: ["delivered", "fulfilled"].includes(shipment.status?.toLowerCase()) }
            ].map((t, idx) => {
              const checkColor = t.completed ? "bg-[#10b981]" : "bg-slate-700";
              return (
                <div key={idx} className="flex items-start gap-4 relative">
                  <div className={`w-3.5 h-3.5 rounded-full border-4 border-[#0b1120] z-10 -ml-[25px] mt-0.5 ${checkColor}`} />
                  <div>
                    <p className={`text-xs font-bold ${t.completed ? "text-white" : "text-slate-500"}`}>
                      {t.step}
                    </p>
                    <p className="text-[9px] text-slate-600 mt-0.5">
                      {t.completed ? `Verified - ${new Date(shipment.createdAt).toLocaleDateString()}` : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
