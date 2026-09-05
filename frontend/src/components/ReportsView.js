"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "This Month", value: "this_month" },
  { label: "All Time", value: "all" },
];

export default function ReportsView() {
  const [selectedPreset, setSelectedPreset] = useState("Last 30 days");
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState(() => new Date());

  // Export Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const dropdownRef = useRef(null);

  // Close preset dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPresetDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handle preset change
  const handlePresetSelect = (preset) => {
    const today = new Date();
    let s = new Date();
    let e = new Date();

    if (preset.value === "today") {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
    } else if (preset.value === "yesterday") {
      s.setDate(today.getDate() - 1);
      s.setHours(0, 0, 0, 0);
      e.setDate(today.getDate() - 1);
      e.setHours(23, 59, 59, 999);
    } else if (preset.value === "7days") {
      s.setDate(today.getDate() - 7);
    } else if (preset.value === "30days") {
      s.setDate(today.getDate() - 30);
    } else if (preset.value === "this_month") {
      s = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset.value === "all") {
      s = null;
      e = null;
    }

    setStartDate(s);
    setEndDate(e);
    setSelectedPreset(preset.label);
    setPresetDropdownOpen(false);
  };

  // Query Real Analytics from Backend
  const { data: analyticsPayload, isLoading: loading, refetch } = useQuery({
    queryKey: ["reports", "analytics", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (startDate) q.append("startDate", startDate.toISOString());
      if (endDate) q.append("endDate", endDate.toISOString());
      const res = await api.get(`/reports/analytics?${q.toString()}`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const stats = analyticsPayload || {
    totalOrders: 0,
    totalShipments: 0,
    totalRevenue: 0,
    totalShippingSpend: 0,
    avgDeliveryDays: 0,
    ndrRatio: 0,
    rtoRatio: 0,
    codRatio: 0,
    prepaidRatio: 0,
    statusBreakdown: {
      unfulfilled: 0,
      delivered: 0,
      inTransit: 0,
      outForDelivery: 0,
      pendingPickup: 0,
      ndr: 0,
      rto: 0,
      cancelled: 0,
    },
    courierDistribution: [],
  };

  // Handle Export CSV
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const q = new URLSearchParams();
      if (startDate) q.append("startDate", startDate.toISOString());
      if (endDate) q.append("endDate", endDate.toISOString());
      if (exportStatus && exportStatus !== "all") q.append("status", exportStatus);

      // Fetch matching orders via standard authenticated api client
      const res = await api.get(`/reports/export-orders?${q.toString()}`);
      const orders = (res && res.success && Array.isArray(res.data)) ? res.data : [];

      if (orders.length === 0) {
        alert("No shipment orders found matching the selected filter criteria.");
        setIsExporting(false);
        return;
      }

      const headers = [
        "Order ID",
        "AWB Number",
        "Customer",
        "Phone",
        "City",
        "State",
        "Pincode",
        "Payment Method",
        "Order Amount",
        "Shipping Charges",
        "Courier Partner",
        "Status",
        "Date"
      ];

      const rows = orders.map((o) => [
        `"${o.orderId}"`,
        `"${o.awbNumber || "-"}"`,
        `"${(o.customer || "").replace(/"/g, '""')}"`,
        `"${o.phone || "-"}"`,
        `"${(o.city || "").replace(/"/g, '""')}"`,
        `"${(o.state || "").replace(/"/g, '""')}"`,
        `"${o.pincode || "-"}"`,
        `"${o.method}"`,
        `"${o.amount}"`,
        `"${(o.shippingCharges || 0) + (o.codCharges || 0)}"`,
        `"${o.vendor || "-"}"`,
        `"${o.status}"`,
        `"${new Date(o.createdAt).toLocaleDateString("en-GB")}"`
      ]);

      // Add UTF-8 BOM so Excel opens cleanly without encoding glitches
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `BeeShip_Report_${exportStatus}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setExportModalOpen(false);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export report: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const getPartnerColor = (idx) => {
    const colors = [
      "bg-[#25a2fe]",
      "bg-indigo-600",
      "bg-purple-600",
      "bg-emerald-500",
      "bg-amber-500",
    ];
    return colors[idx % colors.length];
  };

  return (
    <div className="w-full animate-fadeIn font-sans select-none" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time delivery performance, courier splits, and shipping spend telemetry.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Preset Date Filter */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:border-slate-350 bg-white rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{selectedPreset}</span>
              <svg className={`w-3 h-3 text-slate-400 transition-transform ${presetDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {presetDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-fadeIn">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePresetSelect(p)}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                      selectedPreset === p.label
                        ? "bg-slate-50 text-[#25a2fe] font-bold"
                        : "text-slate-700 hover:bg-slate-50/80"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generate Custom Report Modal Trigger */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm ml-auto sm:ml-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generate Custom Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-t-transparent border-[#25a2fe] rounded-full animate-spin" />
        </div>
      ) : stats.totalOrders === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center gap-4 my-4 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#25a2fe]">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Shipping Activity Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are no recorded orders for the selected period ({selectedPreset}). Start shipping parcels to view live delivery and courier insights.
            </p>
          </div>
          <Link
            href="/orders"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#25a2fe] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <span>View Orders</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            {/* Avg. Delivery Time */}
            <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs flex flex-col justify-between hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Avg. Delivery Latency</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#25a2fe]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900 block font-sans">
                  {stats.avgDeliveryDays > 0 ? `${stats.avgDeliveryDays} Days` : "In Transit"}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 mt-1 inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{stats.statusBreakdown?.delivered || 0} parcels delivered</span>
                </span>
              </div>
            </div>

            {/* NDR Ratio */}
            <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs flex flex-col justify-between hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">NDR Exception Ratio</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900 block font-sans">{stats.ndrRatio}%</span>
                <span className={`text-[10px] font-bold mt-1 inline-block ${stats.ndrRatio > 5 ? "text-rose-600" : "text-slate-500"}`}>
                  {stats.statusBreakdown?.ndr || 0} non-delivery events
                </span>
              </div>
            </div>

            {/* COD to Prepaid Ratio */}
            <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs flex flex-col justify-between hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">COD vs Prepaid Mix</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900 block font-sans">
                  {stats.codRatio}% / {stats.prepaidRatio}%
                </span>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                  <span className="text-amber-600">{stats.codRatio}% COD</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600">{stats.prepaidRatio}% Prepaid</span>
                </div>
              </div>
            </div>

            {/* RTO Ratio */}
            <div className="p-5 border border-slate-200/80 rounded-2xl bg-white shadow-xs flex flex-col justify-between hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">RTO Return Rate</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M16 15v-1a4 4 0 00-4-4H4m0 0l3-3m-3 3l3 3m5 4v1a4 4 0 004 4h8m0 0l-3-3m3 3l-3 3" />
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900 block font-sans">{stats.rtoRatio}%</span>
                <span className={`text-[10px] font-bold mt-1 inline-block ${stats.rtoRatio > 4 ? "text-rose-600" : "text-slate-500"}`}>
                  {stats.statusBreakdown?.rto || 0} returned shipments
                </span>
              </div>
            </div>

          </div>

          {/* Lifecycle Journey Funnel Row */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 mb-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Shipment Lifecycle Breakdown</h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {stats.totalOrders} total orders • {stats.totalShipments} dispatched shipments
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col justify-between">
                <span className="text-[10px] text-amber-700 font-bold uppercase">Unfulfilled Orders</span>
                <span className="text-lg font-black text-amber-900 mt-1">{stats.statusBreakdown?.unfulfilled || 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-150 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Pending Pickup</span>
                <span className="text-lg font-black text-slate-800 mt-1">{stats.statusBreakdown?.pendingPickup || 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-100 flex flex-col justify-between">
                <span className="text-[10px] text-blue-600 font-bold uppercase">In Transit</span>
                <span className="text-lg font-black text-blue-900 mt-1">{stats.statusBreakdown?.inTransit || 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex flex-col justify-between">
                <span className="text-[10px] text-indigo-600 font-bold uppercase">Out for Delivery</span>
                <span className="text-lg font-black text-indigo-900 mt-1">{stats.statusBreakdown?.outForDelivery || 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col justify-between">
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Delivered</span>
                <span className="text-lg font-black text-emerald-900 mt-1">{stats.statusBreakdown?.delivered || 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/30 border border-rose-100 flex flex-col justify-between">
                <span className="text-[10px] text-rose-600 font-bold uppercase">Exceptions / NDR</span>
                <span className="text-lg font-black text-rose-900 mt-1">{stats.statusBreakdown?.ndr || 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-50/40 border border-red-100 flex flex-col justify-between">
                <span className="text-[10px] text-red-600 font-bold uppercase">RTO Returns</span>
                <span className="text-lg font-black text-red-900 mt-1">{stats.statusBreakdown?.rto || 0}</span>
              </div>

            </div>
          </div>

          {/* Courier Performance & Share Distribution */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6.5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Courier Share & Cost Distribution</h3>
                <p className="text-[11px] text-slate-450 mt-0.5 font-medium">Shipment volume share across integrated carrier partner networks.</p>
              </div>
              <div className="text-xs font-bold text-slate-700">
                Total Spend: <span className="font-extrabold text-slate-900">₹{stats.totalShippingSpend.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {stats.courierDistribution.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                No courier allocations found for this filter range.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.courierDistribution.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getPartnerColor(idx)}`} />
                        <span className="text-slate-800 font-bold">{item.partner}</span>
                      </div>
                      <div className="text-slate-500 font-sans">
                        <span className="font-extrabold text-slate-900 mr-1">{item.share}%</span>
                        <span>({item.volume} shipments)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getPartnerColor(idx)} transition-all duration-500`}
                        style={{ width: `${item.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Export Report Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Generate Custom Shipping Report</h3>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Export comprehensive shipping metrics including AWB numbers, customer details, courier partners, and fulfillment statuses in CSV format.
            </p>

            <div className="flex flex-col gap-3.5 mb-6 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Time Period</label>
                <div className="p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-semibold">
                  {selectedPreset} ({startDate ? startDate.toLocaleDateString('en-GB') : "Inception"} - {endDate ? endDate.toLocaleDateString('en-GB') : "Present"})
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Filter</label>
                <select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#25a2fe] cursor-pointer bg-white"
                >
                  <option value="all">All Orders / Shipments</option>
                  <option value="unfulfilled">Unfulfilled Orders (Pending Ship)</option>
                  <option value="pending pickup">Pending Pickup / Booked</option>
                  <option value="in transit">In Transit</option>
                  <option value="out for delivery">Out For Delivery</option>
                  <option value="delivered">Delivered Only</option>
                  <option value="ndr">Exceptions / NDR</option>
                  <option value="rto">RTO Returns</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="px-5 py-2 bg-[#25a2fe] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download CSV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
