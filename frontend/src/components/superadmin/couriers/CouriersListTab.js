"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function CouriersListTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [activeMenuRow, setActiveMenuRow] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);
  
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

  // Fetch Couriers from Admin API
  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ["superadminCouriersList"],
    queryFn: () => api.get("/admin/couriers").then((res) => res || {}),
  });

  const courierList = responseData?.data || [];

  // Metrics
  const metrics = {
    total: courierList.length,
    active: courierList.filter(c => c.status === "Active").length,
    inactive: courierList.filter(c => c.status === "Inactive").length,
    services: 9, // Total service types mapped
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("all");
    setServiceFilter("all");
  };

  const handleToggleStatus = async (courierName) => {
    try {
      const res = await api.put(`/admin/couriers/${courierName}/toggle`);
      if (res && res.success) {
        showToast(res.message, "success");
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to update courier status.", "error");
    } finally {
      setActiveMenuRow(null);
    }
  };

  // Filters
  const filteredList = courierList.filter(c => {
    if (search.trim()) {
      const s = search.toLowerCase();
      if (!c.name.toLowerCase().includes(s) && !c.services.toLowerCase().includes(s)) {
        return false;
      }
    }
    if (statusFilter !== "all" && c.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (serviceFilter !== "all" && !c.services.toLowerCase().includes(serviceFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

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
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Couriers</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Manage and monitor integrated courier partners.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 bg-[#080d1a] hover:bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 select-none">
        {[
          { label: "Total Couriers", count: metrics.total, border: "border-[#1e293b] bg-slate-500/5 text-slate-300" },
          { label: "Active", count: metrics.active, border: "border-emerald-500/15 bg-emerald-500/5 text-emerald-400" },
          { label: "Inactive", count: metrics.inactive, border: "border-rose-500/15 bg-rose-500/5 text-rose-400" },
          { label: "Available Services", count: metrics.services, border: "border-indigo-500/15 bg-indigo-500/5 text-indigo-400" }
        ].map((item, idx) => (
          <div key={idx} className={`border rounded-xl p-3 flex flex-col justify-between h-20 text-left ${item.border}`}>
            <span className="text-[10px] font-black uppercase tracking-wider opacity-85">{item.label}</span>
            <span className="text-xl font-black">{item.count.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courier..."
            className="w-full bg-[#0b1120] border border-[#1e293b] focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Service Type Dropdown */}
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="all">All Services</option>
          <option value="surface">Surface</option>
          <option value="express">Express</option>
          <option value="air">Air</option>
        </select>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative min-h-[200px]">
        {isLoading ? (
          <div className="absolute inset-0 bg-[#080d1a]/85 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              <th className="px-4 py-3">Courier</th>
              <th className="px-4 py-3">Services</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Shipments</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-slate-500">
                  No couriers found matching filters.
                </td>
              </tr>
            ) : (
              filteredList.map((item, idx) => (
                <tr key={idx} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30">
                  <td className="px-4 py-3 text-white font-bold">{item.name}</td>
                  <td className="px-4 py-3 text-slate-400">{item.services}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${
                      item.status === "Active" 
                        ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
                        : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-200">
                    {item.shipments?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center relative" ref={activeMenuRow === item.name ? menuRef : null}>
                    <button
                      onClick={() => setActiveMenuRow(activeMenuRow === item.name ? null : item.name)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {activeMenuRow === item.name && (
                      <div className="absolute right-4 mt-1 w-44 bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-30 py-1.5 text-left overflow-hidden">
                        <button
                          onClick={() => { setSelectedCourier(item); setActiveMenuRow(null); }}
                          className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          View Details
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item.name)}
                          className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          {item.status === "Active" ? "Disable Courier" : "Enable Courier"}
                        </button>
                        <button
                          onClick={() => { window.location.href = `/superadmin/couriers/zones`; }}
                          className="w-full text-left px-3 py-1.5 text-[10px] text-indigo-400 hover:bg-indigo-500/10 font-bold flex items-center gap-2 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          View Rate Card
                        </button>
                        <button
                          onClick={() => { window.location.href = `/superadmin/couriers/performance`; }}
                          className="w-full text-left px-3 py-1.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10 font-bold flex items-center gap-2 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          View Performance
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Slide Over */}
      {selectedCourier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-sm bg-[#080d1a] border-l border-[#1e293b] shadow-2xl h-full p-6 flex flex-col justify-between animate-slide-in text-xs">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-[#1e293b]">
                <h3 className="text-sm font-black text-white">{selectedCourier.name} Details</h3>
                <button onClick={() => setSelectedCourier(null)} className="text-slate-500 hover:text-white cursor-pointer">✕</button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between"><span className="text-slate-500">Courier Name:</span><span className="text-white font-bold">{selectedCourier.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Service Channels:</span><span className="text-slate-300 font-semibold">{selectedCourier.services}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Current Status:</span><span className="text-white font-bold uppercase">{selectedCourier.status}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Booked Shipments:</span><span className="text-white font-bold font-mono">{selectedCourier.shipments.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Average Transit SLA:</span><span className="text-slate-300 font-semibold">3.4 Days</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Pickup TAT Score:</span><span className="text-slate-300 font-semibold">96.5%</span></div>
              </div>
            </div>
            <button
              onClick={() => setSelectedCourier(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
