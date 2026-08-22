"use client";

import { useState } from "react";

export default function CourierPerformance({ courierData = [] }) {
  return (
    <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm font-sans select-none flex flex-col gap-5 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Courier Performance</h2>
          <p className="text-xs text-slate-450">Shipment status by courier partner</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
          <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
          </svg>
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto w-full border border-slate-100 rounded-2xl scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
              <th className="py-4 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Courier</th>
              <th className="py-4 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Booked</th>
              <th className="py-4 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Pending Pickup</th>
              <th className="py-4 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">In Transit</th>
              <th className="py-4 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Out for Delivery</th>
              <th className="py-4 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Delivered</th>
              <th className="py-4 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">RTO</th>
              <th className="py-4 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Exception</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {courierData.map((courier, idx) => (
              <tr key={idx} className="hover:bg-slate-50/30 transition">
                {/* Courier Name */}
                <td className="py-4 px-5 font-bold text-slate-800 text-xs">
                  {courier.name}
                </td>
                
                {/* Booked */}
                <td className="py-4 px-5 font-extrabold text-slate-500 text-center text-xs">
                  {courier.booked}
                </td>
                
                {/* Pending Pickup (Amber highlight capsule) */}
                <td className="py-3 px-5 text-center">
                  <span className="inline-block min-w-[50px] text-[11px] font-extrabold px-2.5 py-1 rounded-lg text-[#b25e00] bg-amber-50 border border-amber-100/70">
                    {courier.pendingPickup}
                  </span>
                </td>
                
                {/* In Transit (Blue highlight capsule) */}
                <td className="py-3 px-5 text-center">
                  <span className="inline-block min-w-[50px] text-[11px] font-extrabold px-2.5 py-1 rounded-lg text-blue-600 bg-blue-50/50 border border-blue-100/70">
                    {courier.inTransit}
                  </span>
                </td>
                
                {/* Out for Delivery (Purple highlight capsule) */}
                <td className="py-3 px-5 text-center">
                  <span className={`inline-block min-w-[50px] text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${
                    courier.outForDelivery > 0 
                      ? "text-purple-600 bg-purple-50/50 border border-purple-100/70"
                      : "text-slate-400 bg-slate-50 border border-slate-100"
                  }`}>
                    {courier.outForDelivery}
                  </span>
                </td>
                
                {/* Delivered */}
                <td className="py-4 px-5 font-extrabold text-slate-650 text-center text-xs">
                  {courier.delivered}
                </td>
                
                {/* RTO */}
                <td className="py-4 px-5 font-extrabold text-slate-500 text-center text-xs">
                  {courier.rto}
                </td>
                
                {/* Exception */}
                <td className="py-4 px-5 font-extrabold text-slate-400 text-center text-xs">
                  {courier.exception}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
