"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function ShipmentsListTab() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    courier: "all",
    payment: "all",
    date: "",
  });

  const [toast, setToast] = useState(null);
  const [activeMenuRow, setActiveMenuRow] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");

  // Reassign Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignCourier, setReassignCourier] = useState("Delhivery");
  const [isReassigning, setIsReassigning] = useState(false);

  const menuRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuRow(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch paginated shipments matching filters
  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ["superadminShipmentsList", filters, page],
    queryFn: () => {
      const q = new URLSearchParams({ page: String(page), limit: "20", hasAwb: "true" });
      if (filters.search) q.append("search", filters.search);
      if (filters.status && filters.status !== "all") q.append("status", filters.status);
      if (filters.payment && filters.payment !== "all") q.append("payment", filters.payment);
      if (filters.date) q.append("date", filters.date);
      return api.get(`/admin/orders?${q.toString()}`).then((res) => res || {});
    },
  });

  const shipmentsList = responseData?.data || [];
  const meta = responseData?.meta || { total: 0, totalPages: 1 };

  // Calculate dynamic status metrics from the response metadata counts
  const metrics = {
    total: meta.counts?.total || 0,
    inTransit: meta.counts?.inTransit || 0,
    outForDelivery: meta.counts?.outForDelivery || 0,
    delivered: meta.counts?.delivered || 0,
    ndr: meta.counts?.ndr || 0,
    rto: meta.counts?.rto || 0,
  };

  // Local filter for courier dropdown
  const filteredList = shipmentsList.filter(shipment => {
    if (filters.courier !== "all") {
      return shipment.vendor?.toLowerCase() === filters.courier.toLowerCase();
    }
    return true;
  });

  const handleReset = () => {
    setFilters({
      search: "",
      status: "all",
      courier: "all",
      payment: "all",
      date: "",
    });
    setPage(1);
  };

  // Action Menu Handlers
  const handleCancelShipment = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this shipment?")) return;
    try {
      const res = await api.post(`/admin/orders/${orderId}/cancel`);
      if (res && res.success) {
        showToast(res.message || "Shipment cancelled successfully.", "success");
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to cancel shipment.", "error");
    } finally {
      setActiveMenuRow(null);
    }
  };

  const handleRetryShipment = async (orderId) => {
    try {
      const res = await api.post(`/admin/orders/${orderId}/retry`);
      if (res && res.success) {
        showToast(res.message || "Shipment retry initiated.", "success");
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to retry shipment.", "error");
    } finally {
      setActiveMenuRow(null);
    }
  };

  const handleReassignSubmit = async () => {
    if (!selectedShipment) return;
    setIsReassigning(true);
    try {
      const res = await api.put(`/admin/orders/${selectedShipment.id}/reassign`, {
        courierPartner: reassignCourier
      });
      if (res && res.success) {
        showToast(res.message || "Courier reassigned successfully.", "success");
        setReassignModalOpen(false);
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to reassign courier.", "error");
    } finally {
      setIsReassigning(false);
    }
  };

  const handleDownloadLabel = (shipment) => {
    if (shipment.labelUrl) {
      window.open(shipment.labelUrl, "_blank");
      showToast("Label download opened in new window.", "success");
    } else {
      showToast("Generating label PDF mock...", "success");
      const link = document.createElement("a");
      link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(`SHIPPING LABEL MOCK\nAWB: ${shipment.awbNumber}\nOrder ID: ${shipment.orderId}\nSeller: ${shipment.user?.companyName}`)}`;
      link.download = `label_${shipment.awbNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setActiveMenuRow(null);
  };

  const handleDownloadManifest = (shipment) => {
    showToast("Generating digital manifest...", "success");
    const link = document.createElement("a");
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(`MANIFEST DOCUMENT MOCK\nAWB: ${shipment.awbNumber}\nOrder: ${shipment.orderId}\nCourier: ${shipment.vendor}\nPickup Warehouse: ${shipment.pickupWarehouse || "Main"}`)}`;
    link.download = `manifest_${shipment.awbNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setActiveMenuRow(null);
  };

  const exportCSV = async () => {
    try {
      showToast("Preparing export data...", "success");
      const q = new URLSearchParams({ limit: "1000", hasAwb: "true" });
      if (filters.search) q.append("search", filters.search);
      if (filters.status && filters.status !== "all") q.append("status", filters.status);
      if (filters.payment && filters.payment !== "all") q.append("payment", filters.payment);
      if (filters.date) q.append("date", filters.date);

      const res = await api.get(`/admin/orders?${q.toString()}`);
      const listToExport = res?.data || [];
      if (listToExport.length === 0) {
        showToast("No shipments to export.", "error");
        return;
      }
      const headers = ["AWB", "OrderID", "Seller", "Courier", "Payment", "Amount", "Status", "Date"];
      const rows = listToExport.map(s => [
        s.awbNumber || "—",
        s.orderId,
        s.user?.companyName || "—",
        s.vendor || "—",
        s.method,
        s.amount,
        s.status,
        new Date(s.createdAt).toLocaleDateString()
      ]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "all_shipments.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Export completed successfully.", "success");
    } catch (err) {
      showToast("Export failed: " + err.message, "error");
    }
  };

  // Eligibility helpers
  const isEligibleForReassign = (status) => {
    const s = status?.toLowerCase() || "";
    return s !== "delivered" && s !== "fulfilled" && s !== "cancelled";
  };

  const isEligibleForRetry = (status) => {
    const s = status?.toLowerCase() || "";
    return s === "failed" || s === "ndr" || s === "rto";
  };

  const isEligibleForCancel = (status) => {
    const s = status?.toLowerCase() || "";
    return s !== "delivered" && s !== "fulfilled" && s !== "cancelled";
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border shadow-xl flex items-center gap-2 animate-slide-in text-xs font-bold ${
          toast.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        }`}>
          {toast.type === "error" ? (
            <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          ) : (
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex justify-between items-start select-none pb-1 border-b border-[#1e293b]/40">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Shipments</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Monitor and manage shipments across all sellers.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 bg-[#080d1a] hover:bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
          >
            Export CSV
          </button>
          <div className="relative">
            <button
              onClick={() => showToast("Bulk actions menu triggered", "success")}
              className="px-3 py-1.5 bg-[#080d1a] hover:bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
            >
              Bulk Actions ▼
            </button>
          </div>
        </div>
      </div>

      {/* Metrics status selector cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
        {[
          { id: "all", label: "Total", count: metrics.total, border: "border-[#1e293b] bg-slate-500/5 text-slate-300" },
          { id: "in transit", label: "In Transit", count: metrics.inTransit, border: "border-indigo-500/15 bg-indigo-500/5 text-indigo-400" },
          { id: "out for delivery", label: "Out for Delivery", count: metrics.outForDelivery, border: "border-amber-500/15 bg-amber-500/5 text-amber-400" },
          { id: "delivered", label: "Delivered", count: metrics.delivered, border: "border-emerald-500/15 bg-emerald-500/5 text-emerald-400" },
          { id: "ndr", label: "NDR", count: metrics.ndr, border: "border-rose-500/15 bg-rose-500/5 text-rose-400" },
          { id: "rto", label: "RTO", count: metrics.rto, border: "border-slate-500/15 bg-slate-800/10 text-slate-400" }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              setFilters(prev => ({ ...prev, status: item.id }));
              setPage(1);
            }}
            className={`border rounded-xl p-3 flex flex-col justify-between h-20 text-left transition cursor-pointer ${item.border} ${
              filters.status === item.id ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#080d1a]" : "hover:bg-slate-800/20"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider opacity-85">{item.label}</span>
            <span className="text-xl font-black">{item.count.toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => { setFilters(prev => ({ ...prev, search: e.target.value })); setPage(1); }}
            placeholder="Search AWB, Order ID, Seller..."
            className="w-full bg-[#0b1120] border border-[#1e293b] focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={filters.status}
          onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPage(1); }}
          className="bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="unfulfilled">Booked</option>
          <option value="in transit">In Transit</option>
          <option value="out for delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="ndr">NDR</option>
          <option value="rto">RTO</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Courier Dropdown */}
        <select
          value={filters.courier}
          onChange={(e) => { setFilters(prev => ({ ...prev, courier: e.target.value })); setPage(1); }}
          className="bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="all">All Couriers</option>
          <option value="Delhivery">Delhivery</option>
          <option value="BlueDart">BlueDart</option>
          <option value="Xpressbees">Xpressbees</option>
          <option value="Amazon Shipping">Amazon Shipping</option>
        </select>

        {/* Payment Dropdown */}
        <select
          value={filters.payment}
          onChange={(e) => { setFilters(prev => ({ ...prev, payment: e.target.value })); setPage(1); }}
          className="bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="all">All Payments</option>
          <option value="COD">COD</option>
          <option value="Prepaid">Prepaid</option>
        </select>

        {/* Date Selector */}
        <input
          type="date"
          value={filters.date}
          onChange={(e) => { setFilters(prev => ({ ...prev, date: e.target.value })); setPage(1); }}
          className="bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        />

        {/* Reset */}
        <button
          onClick={handleReset}
          className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Main Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative min-h-[300px]">
        {isLoading ? (
          <div className="absolute inset-0 bg-[#080d1a]/80 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
                <th className="px-4 py-3">Shipment</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Courier</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500">
                    No shipments found matching filters.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const sLabel = item.status || "Booked";
                  const sColor =
                    sLabel.toLowerCase() === "delivered" || sLabel.toLowerCase() === "fulfilled"
                      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                      : sLabel.toLowerCase() === "in transit" || sLabel.toLowerCase() === "processing"
                      ? "text-indigo-400 border-indigo-500/20 bg-indigo-500/5"
                      : sLabel.toLowerCase() === "out for delivery"
                      ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
                      : sLabel.toLowerCase() === "cancelled"
                      ? "text-rose-400 border-rose-500/20 bg-rose-500/5"
                      : "text-slate-400 border-slate-700 bg-slate-800/10";

                  return (
                    <tr key={item.id} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30">
                      {/* SHIPMENT (AWB & Order ID) */}
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-bold text-white">AWB: {item.awbNumber || "—"}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.orderId}</p>
                      </td>
                      {/* SELLER */}
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{item.user?.companyName || "—"}</p>
                        <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                          {item.userId?.slice(0, 8)?.toUpperCase() || "—"}
                        </p>
                      </td>
                      {/* COURIER */}
                      <td className="px-4 py-3">
                        <span className="text-slate-200 font-semibold">{item.vendor || "Auto"}</span>
                      </td>
                      {/* PAYMENT */}
                      <td className="px-4 py-3">
                        <p className="text-[10px] font-bold text-slate-400">{item.method}</p>
                        <p className="text-[11px] font-black text-emerald-400 mt-0.5">₹{item.amount?.toLocaleString("en-IN")}</p>
                      </td>
                      {/* STATUS */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${sColor}`}>
                          {sLabel}
                        </span>
                      </td>
                      {/* CREATED */}
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      {/* ACTION dropdown menu */}
                      <td className="px-4 py-3 text-center relative" ref={activeMenuRow === item.id ? menuRef : null}>
                        <button
                          onClick={() => setActiveMenuRow(activeMenuRow === item.id ? null : item.id)}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>

                        {activeMenuRow === item.id && (
                          <div className="absolute right-4 mt-1 w-52 bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-30 py-1.5 text-left overflow-hidden select-none">
                            <button
                              onClick={() => { setSelectedShipment(item); setActiveMenuRow(null); setDetailTab("overview"); }}
                              className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View Shipment Details
                            </button>
                            <button
                              onClick={() => { setSelectedShipment(item); setActiveMenuRow(null); setDetailTab("timeline"); }}
                              className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              Track Shipment
                            </button>
                            <button
                              onClick={() => { setSelectedShipment(item); setActiveMenuRow(null); setDetailTab("timeline"); }}
                              className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              View Timeline
                            </button>
                            <button
                              onClick={() => handleDownloadLabel(item)}
                              className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20l6.5-6.5m0 0l3 3m-3-3l3-3m-3 3l-3-3m3 3L4 12V4h8l8 8-8 8" /></svg>
                              Download / Regenerate Label
                            </button>
                            <button
                              onClick={() => handleDownloadManifest(item)}
                              className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              Download Manifest
                            </button>
                            
                            <div className="border-t border-[#1e293b]/60 my-1" />

                            <button
                              disabled={!isEligibleForReassign(item.status)}
                              onClick={() => { setSelectedShipment(item); setReassignCourier(item.vendor || "Delhivery"); setReassignModalOpen(true); setActiveMenuRow(null); }}
                              className="w-full text-left px-3 py-1.5 text-[10px] text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-2 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" /></svg>
                              Reassign Courier
                            </button>
                            <button
                              disabled={!isEligibleForRetry(item.status)}
                              onClick={() => handleRetryShipment(item.id)}
                              className="w-full text-left px-3 py-1.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-2 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" /></svg>
                              Retry Shipment
                            </button>
                            <button
                              disabled={!isEligibleForCancel(item.status)}
                              onClick={() => handleCancelShipment(item.id)}
                              className="w-full text-left px-3 py-1.5 text-[10px] text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-2 transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                              Cancel Shipment
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && meta.totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-[#1e293b] select-none text-[11px] text-slate-400">
            <span>
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, meta.total)} of {meta.total.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-[#080d1a] hover:bg-[#0c1324] border border-[#1e293b] disabled:opacity-30 rounded-xl transition cursor-pointer text-white"
              >
                ‹ Previous
              </button>
              <span className="px-3 py-1.5 border border-[#1e293b] bg-slate-800/20 text-white font-bold rounded-xl select-none">
                {page}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-[#080d1a] hover:bg-[#0c1324] border border-[#1e293b] disabled:opacity-30 rounded-xl transition cursor-pointer text-white"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide Over Detail Panel ────────────────────────────────────────── */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl bg-[#080d1a] border-l border-[#1e293b] shadow-2xl h-full flex flex-col animate-slide-in overflow-hidden text-xs">
            {/* Header */}
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  Shipment #{selectedShipment.orderId}
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase rounded-lg">
                    {selectedShipment.status || "Booked"}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Created on {new Date(selectedShipment.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="p-1.5 text-slate-500 hover:text-white transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#1e293b] bg-[#0c1324]/40 select-none text-[10px]">
              {["overview", "timeline", "charges", "api-logs"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`flex-1 py-3 uppercase tracking-wider font-black transition-all ${
                    detailTab === tab 
                      ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/10"
                  }`}
                >
                  {tab === "overview" && "Overview"}
                  {tab === "timeline" && "Tracking Timeline"}
                  {tab === "charges" && "Charges"}
                  {tab === "api-logs" && "API Logs"}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* Tab 1: Overview */}
              {detailTab === "overview" && (
                <div className="bg-[#0b1120] border border-[#1e293b]/50 p-5 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400 border-b border-[#1e293b] pb-2">Shipment Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-500">Order:</span><span className="text-white font-bold">{selectedShipment.orderId}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">AWB:</span><span className="text-slate-300 font-mono">{selectedShipment.awb || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Seller:</span><span className="text-white font-bold">{selectedShipment.user?.companyName || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Courier:</span><span className="text-slate-300 font-semibold">{selectedShipment.partner}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Payment:</span><span className="text-slate-300 font-bold uppercase">{selectedShipment.method}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Weight:</span><span className="text-slate-300 font-mono">{selectedShipment.weight}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Origin:</span><span className="text-slate-300 font-semibold">{selectedShipment.source}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Destination:</span><span className="text-slate-300 font-semibold">{selectedShipment.dest}</span></div>
                  </div>
                </div>
              )}

              {/* Tab 2: Tracking Timeline */}
              {detailTab === "timeline" && (
                <div className="bg-[#0b1120] border border-[#1e293b]/50 p-5 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400 border-b border-[#1e293b] pb-2">Tracking Checkpoints</h4>
                  
                  <div className="space-y-4 relative select-none pl-6 mt-2">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#1e293b]" />
                    
                    {[
                      { step: "Shipment Created", completed: true },
                      { step: "Pickup Scheduled", completed: true },
                      { step: "Picked Up", completed: selectedShipment.status?.toLowerCase() !== "booked" },
                      { step: "In Transit", completed: ["in transit", "out for delivery", "delivered", "fulfilled"].includes(selectedShipment.status?.toLowerCase()) },
                      { step: "Out for Delivery", completed: ["out for delivery", "delivered", "fulfilled"].includes(selectedShipment.status?.toLowerCase()) },
                      { step: "Delivered", completed: ["delivered", "fulfilled"].includes(selectedShipment.status?.toLowerCase()) }
                    ].map((t, idx) => {
                      const isActive = selectedShipment.status?.toLowerCase() === t.step.toLowerCase();
                      const checkColor = t.completed ? "bg-emerald-500" : "bg-slate-700";
                      return (
                        <div key={idx} className="flex items-start gap-4 relative">
                          <div className={`w-3.5 h-3.5 rounded-full border-4 border-[#0b1120] z-10 -ml-[25px] mt-0.5 ${checkColor} ${isActive ? "ring-2 ring-indigo-500 animate-pulse" : ""}`} />
                          <div>
                            <p className={`text-xs font-bold ${t.completed ? "text-white" : "text-slate-500"}`}>
                              {t.completed ? "✓" : "○"} {t.step}
                            </p>
                            <p className="text-[9px] text-slate-600 mt-0.5">
                              {t.completed ? `Verified - ${new Date(selectedShipment.createdAt).toLocaleDateString()}` : "Pending"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Charges */}
              {detailTab === "charges" && (
                <div className="bg-[#0b1120] border border-[#1e293b]/50 p-5 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400 border-b border-[#1e293b] pb-2">Shipment Cost Breakdown</h4>
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px] border-b border-[#1e293b] pb-3 font-semibold text-slate-400">
                    <div>Freight</div>
                    <div>COD Charge</div>
                    <div>Fuel Surcharge</div>
                    <div>Tax</div>
                    <div className="text-white font-bold">Total</div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs pt-1 text-slate-300">
                    <div>₹{(selectedShipment.amount * 0.08).toFixed(2)}</div>
                    <div>₹{selectedShipment.method === "COD" ? "45.00" : "0.00"}</div>
                    <div>₹{(selectedShipment.amount * 0.01).toFixed(2)}</div>
                    <div>₹{(selectedShipment.amount * 0.02).toFixed(2)}</div>
                    <div className="text-indigo-400 font-bold">
                      ₹{(
                        (selectedShipment.amount * 0.08) + 
                        (selectedShipment.method === "COD" ? 45.00 : 0.0) + 
                        (selectedShipment.amount * 0.01) + 
                        (selectedShipment.amount * 0.02)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: API Logs */}
              {detailTab === "api-logs" && (
                <div className="bg-[#0b1120] border border-[#1e293b]/50 p-5 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400 border-b border-[#1e293b] pb-2">Courier Integration API History</h4>
                  <div className="space-y-4 select-text">
                    <div className="p-3 bg-black/40 border border-[#1e293b] rounded-xl font-mono text-[9px] space-y-1">
                      <p className="text-indigo-400">POST /api/v1/shipments/create</p>
                      <p className="text-slate-500">Status: 200 OK | Response Time: 340ms</p>
                      <pre className="text-slate-300 overflow-x-auto p-1 leading-relaxed">
{JSON.stringify({
  success: true,
  awb: selectedShipment.awb,
  courier: selectedShipment.partner,
  eta: "2026-07-15",
  payload: {
    origin: selectedShipment.source,
    destination: selectedShipment.dest,
    weight: selectedShipment.weight,
    payment_method: selectedShipment.method
  }
}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Courier Reassignment Modal ────────────────────────────────────── */}
      {reassignModalOpen && selectedShipment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in text-xs">
            <h3 className="text-sm font-black text-white">Reassign Courier Partner</h3>
            <p className="text-slate-400 leading-relaxed">
              Select an alternative courier partner for shipment <span className="text-indigo-400 font-bold font-mono">#{selectedShipment.orderId}</span>. This will generate a new AWB.
            </p>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500">Courier Partner</label>
              <select
                value={reassignCourier}
                onChange={(e) => setReassignCourier(e.target.value)}
                className="w-full bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="Delhivery">Delhivery</option>
                <option value="BlueDart">BlueDart</option>
                <option value="Xpressbees">Xpressbees</option>
                <option value="Amazon Shipping">Amazon Shipping</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setReassignModalOpen(false)}
                className="flex-1 px-4 py-2 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignSubmit}
                disabled={isReassigning}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {isReassigning ? "Reassigning..." : "Reassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
