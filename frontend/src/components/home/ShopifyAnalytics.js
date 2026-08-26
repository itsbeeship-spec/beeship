"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";


export default function ShopifyAnalytics({ orders = [], loading = false }) {
  const [shopifyData, setShopifyData] = useState(null);

  useEffect(() => {
    if (!orders || loading) return;
    const list = orders;
    const totalShipments = list.length;
    const notShippedOrders = list.filter(o => o.status === "unfulfilled").length;
    const shippedOrders = list.filter(o => o.status === "fulfilled" || o.status === "booked").length;
    const codOrders = list.filter(o => o.method === "COD").length;
    const prepaidOrders = list.filter(o => o.method === "Prepaid").length;
    const delivered = list.filter(o => o.status === "fulfilled" || o.status === "delivered").length;
    const rto = list.filter(o => o.status === "cancelled").length;
    const deliveredList = list.filter(o => o.status === "fulfilled" || o.status === "delivered");
    const totalDeliveredValue = deliveredList.reduce((sum, o) => sum + (o.amount || 0), 0);
    const readyToDispatch = notShippedOrders;
    const inTransit = list.filter(o => o.status === "booked").length;

    setShopifyData({
      totalDeliveredValue,
      notShippedOrders,
      shippedOrders,
      codOrders,
      prepaidOrders,
      totalShipments,
      readyToDispatch,
      inTransit,
      delivered,
      rto
    });
  }, [orders, loading]);

  // Show clean Skeleton Shimmer loader while data is fetching — NEVER flash 0 values!
  if (loading || !shopifyData) {
    return (
      <div className="flex flex-col gap-5 w-full font-sans select-none animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-100/90 border border-slate-200/60 rounded-2xl h-[92px] animate-pulse" />
          <div className="bg-slate-100/90 border border-slate-200/60 rounded-2xl h-[92px] animate-pulse" />
          <div className="bg-slate-100/90 border border-slate-200/60 rounded-2xl h-[92px] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
          <div className="bg-slate-100/90 border border-slate-200/60 rounded-2xl h-20 animate-pulse" />
          <div className="bg-slate-100/90 border border-slate-200/60 rounded-2xl h-20 animate-pulse" />
          <div className="bg-slate-100/90 border border-slate-200/60 rounded-2xl h-20 animate-pulse" />
          <div className="bg-slate-100/90 border border-slate-200/60 rounded-2xl h-20 animate-pulse" />
          <div className="bg-slate-100/90 border border-slate-200/60 rounded-2xl h-20 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full font-sans select-none">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Delivered Value */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Total Delivered Value</span>
            <span className="text-2xl font-extrabold text-slate-800">
              Rs. {shopifyData.totalDeliveredValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Not Shipped / Shipped Orders */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          {/* Left Portion: Not Shipped */}
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-11 h-11 rounded-xl bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
              <svg className="w-5.5 h-5.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Not Shipped Orders</span>
              <span className="text-xl font-extrabold text-slate-800">{shopifyData.notShippedOrders}</span>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-slate-150 mx-4 shrink-0" />

          {/* Right Portion: Shipped */}
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-11 h-11 rounded-xl bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
              <svg className="w-5.5 h-5.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Shipped Orders</span>
              <span className="text-xl font-extrabold text-slate-800">{shopifyData.shippedOrders}</span>
            </div>
          </div>
        </div>

        {/* Card 3: COD / Prepaid */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          {/* Left Portion: COD */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">COD</span>
              <span className="text-xl font-extrabold text-slate-800">{shopifyData.codOrders}</span>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-slate-150 mx-4 shrink-0" />

          {/* Right Portion: Prepaid */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Prepaid</span>
              <span className="text-xl font-extrabold text-slate-800">{shopifyData.prepaidOrders}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
        {/* Card 4: Total Shipments */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Shipments</span>
            <span className="text-lg font-extrabold text-slate-800">{shopifyData.totalShipments}</span>
          </div>
          <div className="w-8.5 h-8.5 rounded-lg bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
        </div>

        {/* Card 5: Ready to Dispatch */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ready to Dispatch</span>
            <span className="text-lg font-extrabold text-slate-800">{shopifyData.readyToDispatch}</span>
          </div>
          <div className="w-8.5 h-8.5 rounded-lg bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* Card 6: In Transit */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">In Transit</span>
            <span className="text-lg font-extrabold text-slate-800">{shopifyData.inTransit}</span>
          </div>
          <div className="w-8.5 h-8.5 rounded-lg bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Card 7: Delivered */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Delivered</span>
            <span className="text-lg font-extrabold text-slate-800">{shopifyData.delivered}</span>
          </div>
          <div className="w-8.5 h-8.5 rounded-lg bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Card 8: RTO */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">RTO</span>
            <span className="text-lg font-extrabold text-slate-800">{shopifyData.rto}</span>
          </div>
          <div className="w-8.5 h-8.5 rounded-lg bg-[#25a2fe]/10 border border-[#25a2fe]/20 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
