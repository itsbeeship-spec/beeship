"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";

export default function ShipmentTable({ displayedShipments, showToast, selectedAwbs, setSelectedAwbs, onTagsClick }) {
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState([]);
  const [hoveredProductId, setHoveredProductId] = useState(null);

  const toggleRowDetails = (awb) => {
    setExpandedRows((prev) =>
      prev.includes(awb) ? prev.filter((id) => id !== awb) : [...prev, awb]
    );
  };

  const handleSelectAll = () => {
    if (selectedAwbs.length === displayedShipments.length) {
      setSelectedAwbs([]);
    } else {
      setSelectedAwbs(displayedShipments.map((s) => s.awb));
    }
  };

  const handleSelectOne = (awb) => {
    setSelectedAwbs((prev) =>
      prev.includes(awb) ? prev.filter((id) => id !== awb) : [...prev, awb]
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toISOString().split("T")[0];
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden select-none pb-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-450 font-semibold uppercase tracking-wider text-[9px]">
              {/* Checkbox Header */}
              <th className="py-4 pl-6 pr-2 w-8">
                <div className="flex items-center justify-center w-5 h-5">
                  <input
                    type="checkbox"
                    checked={
                      displayedShipments.length > 0 &&
                      selectedAwbs.length === displayedShipments.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                  />
                </div>
              </th>
              {/* Expand Header */}
              <th className="py-4 px-2 w-6"></th>

              {/* Orders Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Orders</span>
                </div>
              </th>

              {/* Customer Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Customer</span>
                </div>
              </th>

              {/* Amount Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2z" />
                  </svg>
                  <span>Amount</span>
                </div>
              </th>

              {/* Collectable Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Collectable</span>
                </div>
              </th>

              {/* Products Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Products</span>
                </div>
              </th>

              {/* Vendors Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Vendors</span>
                </div>
              </th>

              {/* Tags Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 002.122 0l4.318-4.318a1.5 1.5 0 000-2.122L11.16 3.659A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5z" />
                  </svg>
                  <span>Tags</span>
                </div>
              </th>

              {/* Courier Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  <span>Courier</span>
                </div>
              </th>

              {/* Status Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Status</span>
                </div>
              </th>

              {/* EDD Header */}
              <th className="py-4 px-3">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>EDD</span>
                </div>
              </th>

              {/* Action Header */}
              <th className="py-4 pr-6 pl-3 text-right sticky right-0 bg-white shadow-[-4px_0_10px_-3px_rgba(0,0,0,0.05)] z-10">
                <div className="flex items-center justify-end gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Action</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-900">
            {displayedShipments.length > 0 ? (
              displayedShipments.map((ship, idx) => {
                const isExpanded = expandedRows.includes(ship.awb);
                const isSelected = selectedAwbs.includes(ship.awb);
                return (
                  <Fragment key={ship.awb}>
                    <tr
                      onClick={() => toggleRowDetails(ship.awb)}
                      className={`group hover:bg-slate-50/40 transition-colors cursor-pointer ${
                        isExpanded ? "bg-slate-50/30" : ""
                      }`}
                    >
                      {/* Checkbox Column (Wrapped in flex to prevent squishing) */}
                      <td className="py-4 pl-6 pr-2">
                        <div className="flex items-center justify-center w-5 h-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectOne(ship.awb);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                          />
                        </div>
                      </td>

                      {/* Chevron Toggle */}
                      <td className="py-4 px-2">
                        <div className="flex items-center justify-center w-5 h-5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowDetails(ship.awb);
                            }}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer flex items-center justify-center"
                          >
                            <svg
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? "rotate-90 text-[#017cf8]" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* Orders Column */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-[11.5px] whitespace-nowrap">
                            #{ship.orderId}
                          </span>
                          <span className="text-[9.5px] text-slate-500 font-semibold mt-0.5">
                            {formatDate(ship.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Customer Column */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-[11.5px] leading-snug truncate max-w-[100px]" title={ship.customer}>
                            {ship.customer}
                          </span>
                          <div className="flex items-center gap-1 text-[9.5px] text-slate-500 font-semibold mt-0.5">
                            <svg
                              className="w-3 h-3 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            <span>{ship.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Amount Column */}
                      <td className="py-4 px-3 font-extrabold text-slate-900 text-[11.5px] whitespace-nowrap">
                        ₹{ship.amount}
                      </td>

                      {/* Collectable Column */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-emerald-600 text-xs">
                            ₹{ship.method === "COD" ? ship.collectableAmount || ship.amount : 0}
                          </span>
                          <div>
                            <span
                              className={`px-1.5 py-0.5 border rounded font-extrabold text-[8px] uppercase tracking-wider ${
                                ship.method === "COD"
                                  ? "bg-orange-50 border-orange-200 text-orange-600"
                                  : "bg-blue-50 border-blue-200 text-blue-600"
                              }`}
                            >
                              {ship.method}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Products Column */}
                      <td className="py-4 px-3 font-medium text-slate-800 text-[11.5px] whitespace-nowrap">
                        <div
                          onMouseEnter={() => setHoveredProductId(ship.awb)}
                          onMouseLeave={() => setHoveredProductId(null)}
                          className="relative inline-block cursor-pointer max-w-[130px]"
                        >
                          <span className="block truncate" title={ship.product}>{ship.product}</span>
                          
                          {/* Hover Popup */}
                          {hoveredProductId === ship.awb && (
                            <div className={`absolute left-0 ${idx < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden pointer-events-none animate-fadeIn`}>
                              <div className="bg-[#017cf8] text-white px-4 py-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span className="font-bold text-xs">Products ({ship.products?.length || 1})</span>
                              </div>
                              <div className="p-4 flex flex-col gap-3.5 max-h-60 overflow-y-auto">
                                {ship.products && ship.products.length > 0 ? (
                                  ship.products.map((prod, pIdx) => (
                                    <div key={pIdx} className="flex gap-3 items-start text-xs text-left normal-case tracking-normal">
                                      <span className="w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full font-bold text-[10px] flex-shrink-0">
                                        {prod.qty || prod.quantity || 1}
                                      </span>
                                      <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-slate-700 font-semibold leading-relaxed break-words">
                                          {prod.title || prod.name}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex gap-3 items-start text-xs text-left normal-case tracking-normal">
                                    <span className="w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full font-bold text-[10px] flex-shrink-0">
                                      1
                                    </span>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <span className="text-slate-700 font-semibold leading-relaxed break-words">
                                        {ship.product}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Vendors Column */}
                      <td className="py-4 px-3 font-bold text-slate-600 text-[11px] whitespace-nowrap">
                        {ship.tags?.includes("Shopify") ? "Shopify Store" : "Manual Order"}
                      </td>

                      {/* Tags Column */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        {ship.tags && ship.tags.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTagsClick(ship);
                              }}
                              className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-650 truncate max-w-[65px] hover:bg-white hover:border-slate-350 hover:-translate-y-[1px] active:translate-y-0 transition-all duration-150 cursor-pointer text-left"
                              title={ship.tags[0]}
                            >
                              {ship.tags[0]}
                            </button>
                            {ship.tags.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTagsClick(ship);
                                }}
                                className="text-slate-400 font-bold text-[9px] hover:text-slate-650 cursor-pointer transition-colors"
                              >
                                +{ship.tags.length - 1}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTagsClick(ship);
                            }}
                            className="border border-dashed border-slate-300 px-2 py-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50 hover:border-slate-400 font-semibold text-[8px] flex items-center gap-1 hover:-translate-y-[1px] active:translate-y-0 transition-all duration-150 cursor-pointer"
                          >
                            + Tag
                          </button>
                        )}
                      </td>

                      {/* Courier Column */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-[11.5px] truncate max-w-[140px]" title={ship.partner}>
                            {ship.partner}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push("/tracking");
                              }}
                              className="text-[#017cf8] font-semibold text-left hover:underline cursor-pointer text-[11px] truncate max-w-[115px]"
                              title={ship.awb}
                            >
                              {ship.awb}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(ship.awb);
                                if (showToast) {
                                  showToast(`AWB ${ship.awb} copied successfully!`);
                                }
                              }}
                              className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-[#017cf8] transition cursor-pointer flex items-center justify-center shrink-0"
                              title="Copy AWB Number"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect width="14" height="14" x="8" y="8" rx="1.5" ry="1.5" strokeWidth="2" />
                                <path strokeWidth="2" d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                            ship.status === "Delivered"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                              : ship.status === "In Transit"
                              ? "bg-blue-50 border-blue-100 text-blue-600"
                              : ship.status === "Out For Delivery"
                              ? "bg-cyan-50 border-cyan-100 text-cyan-600"
                              : ship.status === "NDR"
                              ? "bg-amber-50 border-amber-100 text-amber-600"
                              : ship.status === "RTO" || ship.status === "Cancelled"
                              ? "bg-rose-50 border-rose-100 text-rose-600"
                              : "bg-slate-50 border-slate-150 text-slate-500"
                          }`}
                        >
                          {ship.status}
                        </span>
                      </td>

                      {/* EDD Column */}
                      <td className="py-4 px-3 font-medium text-slate-800 text-[11.5px]">
                        {ship.eta}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 pr-6 pl-3 text-right sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors shadow-[-4px_0_10px_-3px_rgba(0,0,0,0.05)] z-10 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowDetails(ship.awb);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b2438] hover:bg-slate-900 text-white rounded-lg text-[10px] font-semibold shadow-sm transition cursor-pointer whitespace-nowrap"
                        >
                          <span>View Detail</span>
                        </button>
                      </td>
                    </tr>

                    {/* Collapsible Detail Drawer Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/20 select-text">
                        <td colSpan="13" className="p-0 border-b border-slate-100">
                          <div className="grid grid-cols-12 gap-8 px-12 py-5 text-xs text-slate-650 animate-slideDown">
                            
                            {/* SHIPPING INFO Column */}
                            <div className="col-span-12 md:col-span-3 flex flex-col gap-2.5">
                              <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5 mb-0.5 select-none">
                                <span className="font-sans">$</span>
                                <span>SHIPPING INFO</span>
                              </h4>
                              
                              <div className="flex items-center gap-2 font-semibold text-slate-800 text-[12px]">
                                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{ship.customer}</span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-500 font-medium">
                                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{ship.phone}</span>
                              </div>

                              {ship.address && (
                                <div className="flex items-start gap-2 text-slate-450 font-medium leading-relaxed text-[11px]">
                                  <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>
                                    {ship.address}, {ship.city}, {ship.state} - {ship.pincode}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* PRODUCTS Column */}
                            <div className="col-span-12 md:col-span-3 flex flex-col gap-2.5">
                              <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5 mb-0.5 select-none">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span>PRODUCTS</span>
                              </h4>

                              <div className="flex flex-col gap-2 font-medium text-slate-600 leading-relaxed">
                                {ship.products && ship.products.length > 0 ? (
                                  ship.products.map((prod, pIdx) => (
                                    <div key={pIdx} className="flex items-start gap-2">
                                      <span className="text-slate-400 mt-0.5 select-none">•</span>
                                      <div className="flex flex-col">
                                        <span className="text-slate-750 font-semibold text-[11.5px]">{prod.title || prod.name}</span>
                                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                          SKU: {prod.sku || "N/A"} - Qty: {prod.qty || prod.quantity || 1}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-start gap-2">
                                    <span className="text-slate-400 mt-0.5 select-none">•</span>
                                    <div className="flex flex-col">
                                      <span className="text-slate-750 font-semibold text-[11.5px]">{ship.product}</span>
                                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">SKU: N/A - Qty: 1</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* TAGS Column */}
                            <div className="col-span-12 md:col-span-2 flex flex-col gap-2.5">
                              <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5 mb-0.5 select-none">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 002.122 0l4.318-4.318a1.5 1.5 0 000-2.122L11.16 3.659A2.25 2.25 0 009.568 3z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5z" />
                                </svg>
                                <span>TAGS</span>
                              </h4>
                              
                              <div className="text-[11px] text-slate-400 font-medium italic">
                                No tags available
                              </div>
                            </div>

                            {/* WAREHOUSE Column */}
                            <div className="col-span-12 md:col-span-2 flex flex-col gap-2.5">
                              <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5 mb-0.5 select-none">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>WAREHOUSE</span>
                              </h4>

                              <div className="flex items-center gap-2 font-semibold text-slate-700 text-[11.5px]">
                                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{ship.source || "-"}</span>
                              </div>
                            </div>

                            {/* Action Sidebar Column */}
                            <div className="col-span-12 md:col-span-2 flex flex-col gap-3.5 border-l border-slate-100 pl-6 select-none">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (ship.labelUrl) {
                                    window.open(`/label?ids=${ship.orderId}`, "_blank");
                                  } else {
                                    alert("Label is not available for this shipment yet.");
                                  }
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition text-left cursor-pointer whitespace-nowrap"
                              >
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span>Print Label</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/invoice?ids=${ship.orderId}`, "_blank");
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition text-left cursor-pointer whitespace-nowrap"
                              >
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2z" />
                                </svg>
                                <span>Print Invoice</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTagsClick(ship);
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition text-left cursor-pointer whitespace-nowrap"
                              >
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 002.122 0l4.318-4.318a1.5 1.5 0 000-2.122L11.16 3.659A2.25 2.25 0 009.568 3z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5z" />
                                </svg>
                                <span>Tags</span>
                              </button>

                              <button
                                type="button"
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg text-xs font-semibold transition text-left cursor-pointer whitespace-nowrap"
                              >
                                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Cancel</span>
                              </button>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="13" className="py-12 text-center text-slate-400 font-semibold text-xs">
                  No shipments match your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
