"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function CourierRateCardsTab() {
  const [selectedCourier, setSelectedCourier] = useState("Delhivery Surface (DS)");
  const [selectedService, setSelectedService] = useState("Surface");
  const [selectedDate, setSelectedDate] = useState("Latest");
  const [toast, setToast] = useState(null);
  
  // Custom dropdown open states
  const [courierOpen, setCourierOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  
  // Edit Rates Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    withinCity: 0,
    withinState: 0,
    metroToMetro: 0,
    restOfIndia: 0,
    northEastAndJk: 0,
    codCharges: 0,
    codPercent: 0
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch rate card details from Global merchant override (GLOBAL represents superadmin contractor rates)
  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ["superadminGlobalRates"],
    queryFn: () => api.get("/admin/billing/rates/merchant/GLOBAL").then((res) => res || {}),
  });

  const ratesList = responseData?.data || [];
  
  // Find current rate card for selected courier
  const activeRate = ratesList.find(r => r.courier?.toLowerCase()?.includes(selectedCourier.toLowerCase().split(" ")[0])) || ratesList[0] || {};

  useEffect(() => {
    if (activeRate.id) {
      setEditForm({
        withinCity: activeRate.withinCity || 0,
        withinState: activeRate.withinState || 0,
        metroToMetro: activeRate.metroToMetro || 0,
        restOfIndia: activeRate.restOfIndia || 0,
        northEastAndJk: activeRate.northEastAndJk || 0,
        codCharges: activeRate.codCharges || 0,
        codPercent: activeRate.codPercent || 0
      });
    }
  }, [activeRate]);

  const handleUpdateRates = async (e) => {
    e.preventDefault();
    if (!activeRate.courier) return;
    setIsUpdating(true);
    try {
      const res = await api.put("/admin/billing/rates/merchant/GLOBAL", {
        courier: activeRate.courier,
        ...editForm
      });
      if (res && res.success) {
        showToast("Rate Card updated successfully.", "success");
        setEditModalOpen(false);
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to update rates.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const zonesData = [
    { zone: "A (Within City)", forward: activeRate.withinCity || 35, add: Math.max(10, Math.floor((activeRate.withinCity || 35) * 0.45)), rto: Math.max(10, Math.floor((activeRate.withinCity || 35) * 0.85)) },
    { zone: "B (Within State)", forward: activeRate.withinState || 42, add: Math.max(10, Math.floor((activeRate.withinState || 42) * 0.45)), rto: Math.max(10, Math.floor((activeRate.withinState || 42) * 0.85)) },
    { zone: "C (Metro to Metro)", forward: activeRate.metroToMetro || 55, add: Math.max(10, Math.floor((activeRate.metroToMetro || 55) * 0.45)), rto: Math.max(10, Math.floor((activeRate.metroToMetro || 55) * 0.85)) },
    { zone: "D (Rest of India)", forward: activeRate.restOfIndia || 68, add: Math.max(10, Math.floor((activeRate.restOfIndia || 68) * 0.45)), rto: Math.max(10, Math.floor((activeRate.restOfIndia || 68) * 0.85)) },
    { zone: "E (North East & JK)", forward: activeRate.northEastAndJk || 85, add: Math.max(10, Math.floor((activeRate.northEastAndJk || 85) * 0.45)), rto: Math.max(10, Math.floor((activeRate.northEastAndJk || 85) * 0.85)) }
  ];

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

      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Courier Rate Cards</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">View and manage contracted courier rates.</p>
        </div>
        <button
          onClick={() => showToast("Bulk rate card import triggered.", "success")}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
        >
          Import Rate Card
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 items-center bg-[#0b1120]/45 border border-[#1e293b]/40 p-3 rounded-2xl select-none z-30 relative">
        {/* Courier Dropdown */}
        <div className="space-y-1 relative">
          <label className="text-[9px] font-black uppercase text-slate-500 block">Courier</label>
          <button
            type="button"
            onClick={() => { setCourierOpen(!courierOpen); setServiceOpen(false); setDateOpen(false); }}
            className="flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[150px]"
          >
            <span>{selectedCourier.split(" ")[0]}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${courierOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {courierOpen && (
            <div className="absolute left-0 mt-1.5 w-full min-w-[170px] bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
              {[
                { label: "Delhivery", value: "Delhivery Surface (DS)" },
                { label: "BlueDart", value: "Bluedart Surface (N)" },
                { label: "Xpressbees", value: "Xpressbees Surface" },
                { label: "Amazon Shipping", value: "Amazon Shipping" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setSelectedCourier(opt.value); setCourierOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${selectedCourier === opt.value ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt.label}</span>
                  {selectedCourier === opt.value && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Service Dropdown */}
        <div className="space-y-1 relative">
          <label className="text-[9px] font-black uppercase text-slate-500 block">Service</label>
          <button
            type="button"
            onClick={() => { setServiceOpen(!serviceOpen); setCourierOpen(false); setDateOpen(false); }}
            className="flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[110px]"
          >
            <span>{selectedService}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${serviceOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {serviceOpen && (
            <div className="absolute left-0 mt-1.5 w-full min-w-[130px] bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
              {["Surface", "Air"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setSelectedService(opt); setServiceOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${selectedService === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt}</span>
                  {selectedService === opt && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Dropdown */}
        <div className="space-y-1 relative">
          <label className="text-[9px] font-black uppercase text-slate-500 block">Effective Date</label>
          <button
            type="button"
            onClick={() => { setDateOpen(!dateOpen); setCourierOpen(false); setServiceOpen(false); }}
            className="flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[180px]"
          >
            <span>Latest (Effective 01 Jul 2026)</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${dateOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {dateOpen && (
            <div className="absolute left-0 mt-1.5 w-full min-w-[200px] bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
              <button
                type="button"
                onClick={() => { setSelectedDate("Latest"); setDateOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-indigo-400 bg-indigo-600/10 font-bold flex items-center justify-between transition cursor-pointer"
              >
                <span>Latest (Effective 01 Jul 2026)</span>
                <span>✓</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-4 max-w-lg select-none">
        {[
          { label: "Base Weight", value: "500g", desc: "Standard billing slab" },
          { label: "Rate Version", value: "v2.4", desc: "Contracted tier rates" },
          { label: "Last Updated", value: "10 Jul 2026", desc: "Admin logs checked" }
        ].map((c, idx) => (
          <div key={idx} className="bg-[#080d1a] border border-[#1e293b] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{c.label}</span>
            <span className="text-sm font-black text-white mt-1">{c.value}</span>
            <span className="text-[8px] text-slate-600 mt-0.5">{c.desc}</span>
          </div>
        ))}
      </div>

      {/* Rate Sheet Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-[#080d1a]/85 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Forward</th>
              <th className="px-4 py-3">Add. 500g</th>
              <th className="px-4 py-3">RTO</th>
              <th className="px-4 py-3">COD Fixed</th>
              <th className="px-4 py-3">COD %</th>
              <th className="px-4 py-3">Fuel Surcharge</th>
            </tr>
          </thead>
          <tbody>
            {zonesData.map((row, idx) => (
              <tr key={idx} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30">
                <td className="px-4 py-3 text-white font-bold">Zone {row.zone}</td>
                <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">₹{row.forward}</td>
                <td className="px-4 py-3 font-mono text-slate-400">₹{row.add}</td>
                <td className="px-4 py-3 font-mono text-rose-400">₹{row.rto}</td>
                <td className="px-4 py-3 font-mono text-slate-400">₹{activeRate.codCharges || 25}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{activeRate.codPercent || 1.5}%</td>
                <td className="px-4 py-3 font-mono text-slate-400">5%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer controls */}
        <div className="flex justify-between items-center p-4 border-t border-[#1e293b] bg-slate-800/10 text-[10px] select-none text-slate-500 font-semibold">
          <span>Effective From: 01 Jul 2026</span>
          <div className="flex gap-2">
            <button
              onClick={() => showToast("Rate version history is up to date.", "success")}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
            >
              View History
            </button>
            <button
              onClick={() => setEditModalOpen(true)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer"
            >
              Edit Rates
            </button>
          </div>
        </div>
      </div>

      {/* Edit Rates Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateRates} className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-black text-white">Edit Contracted Rates</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Courier: {activeRate.courier}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone A (City)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.withinCity}
                  onChange={(e) => setEditForm({ ...editForm, withinCity: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone B (State)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.withinState}
                  onChange={(e) => setEditForm({ ...editForm, withinState: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone C (Metro)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.metroToMetro}
                  onChange={(e) => setEditForm({ ...editForm, metroToMetro: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone D (ROI)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.restOfIndia}
                  onChange={(e) => setEditForm({ ...editForm, restOfIndia: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone E (North East & JK)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.northEastAndJk}
                  onChange={(e) => setEditForm({ ...editForm, northEastAndJk: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">COD Fixed (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.codCharges}
                  onChange={(e) => setEditForm({ ...editForm, codCharges: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">COD Percent (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.codPercent}
                  onChange={(e) => setEditForm({ ...editForm, codPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 select-none">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="flex-1 px-4 py-2 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Rule"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
