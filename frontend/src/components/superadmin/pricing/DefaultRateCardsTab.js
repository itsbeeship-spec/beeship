"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function DefaultRateCardsTab() {
  const [toast, setToast] = useState(null);
  const [courier, setCourier] = useState("Delhivery Surface (DS)");
  const [service, setService] = useState("Surface");
  const [weightSlab, setWeightSlab] = useState("500g");

  // Filter dropdown toggles
  const [courierOpen, setCourierOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for modal
  const [editForm, setEditForm] = useState({
    withinCity: "45",
    withinState: "52",
    metroToMetro: "65",
    restOfIndia: "78",
    northEastAndJk: "95"
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Default Rates from DB (merchant = GLOBAL)
  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ["superadminDefaultRateCardsDbList"],
    queryFn: () => api.get("/admin/billing/rates/merchant/GLOBAL").then((res) => res || {}),
    staleTime: 5 * 60 * 1000,
  });

  const rawRatesList = responseData?.data || [];

  // Find rate for selected courier
  const selectedRate = rawRatesList.find(r => r.courier === courier) || {
    withinCity: 45, withinState: 52, metroToMetro: 65, restOfIndia: 78, northEastAndJk: 95, codCharges: 35, codPercent: 2
  };

  const handleEditClick = () => {
    setEditForm({
      withinCity: selectedRate.withinCity.toString(),
      withinState: selectedRate.withinState.toString(),
      metroToMetro: selectedRate.metroToMetro.toString(),
      restOfIndia: selectedRate.restOfIndia.toString(),
      northEastAndJk: selectedRate.northEastAndJk.toString()
    });
    setEditModalOpen(true);
  };

  const handleSaveRates = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put(`/admin/billing/rates/merchant/GLOBAL`, {
        courier,
        withinCity: parseFloat(editForm.withinCity) || 0,
        withinState: parseFloat(editForm.withinState) || 0,
        metroToMetro: parseFloat(editForm.metroToMetro) || 0,
        restOfIndia: parseFloat(editForm.restOfIndia) || 0,
        northEastAndJk: parseFloat(editForm.northEastAndJk) || 0,
        codCharges: selectedRate.codCharges || 35,
        codPercent: selectedRate.codPercent || 2
      });

      if (res && res.success) {
        showToast(`Default rates for ${courier} updated successfully.`, "success");
        setEditModalOpen(false);
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to save rate sheets.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const couriersList = rawRatesList.map(r => r.courier).length > 0
    ? rawRatesList.map(r => r.courier)
    : ["Delhivery Surface (DS)", "Bluedart Surface (N)", "Xpressbees Surface", "Amazon Shipping"];

  const servicesList = ["Surface", "Express", "Air"];
  const weightSlabsList = ["500g", "1kg", "2kg", "5kg"];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-slide-in">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Default Rate Cards</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Manage default shipping rates applied to sellers.</p>
        </div>
        <button
          onClick={handleEditClick}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
        >
          Edit Rates
        </button>
      </div>

      {/* Custom Selectors Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center z-30 relative select-none">
        {/* Courier Dropdown */}
        <div className="relative">
          <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Courier</label>
          <button
            type="button"
            onClick={() => { setCourierOpen(!courierOpen); setServiceOpen(false); setWeightOpen(false); }}
            className="flex items-center justify-between gap-3 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[170px]"
          >
            <span>{courier}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${courierOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {courierOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in">
              {couriersList.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setCourier(opt); setCourierOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${courier === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt}</span>
                  {courier === opt && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Service Dropdown */}
        <div className="relative">
          <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Service</label>
          <button
            type="button"
            onClick={() => { setServiceOpen(!serviceOpen); setCourierOpen(false); setWeightOpen(false); }}
            className="flex items-center justify-between gap-3 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[130px]"
          >
            <span>{service}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${serviceOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {serviceOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in">
              {servicesList.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setService(opt); setServiceOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${service === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt}</span>
                  {service === opt && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Weight Slab Dropdown */}
        <div className="relative">
          <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Weight Slab</label>
          <button
            type="button"
            onClick={() => { setWeightOpen(!weightOpen); setCourierOpen(false); setServiceOpen(false); }}
            className="flex items-center justify-between gap-3 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[130px]"
          >
            <span>{weightSlab}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${weightOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {weightOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in">
              {weightSlabsList.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setWeightSlab(opt); setWeightOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${weightSlab === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt}</span>
                  {weightSlab === opt && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rates Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-[#080d1a]/85 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3.5">Zone</th>
              <th className="px-4 py-3.5">Base Rate</th>
              <th className="px-4 py-3.5">Add. 500g</th>
              <th className="px-4 py-3.5">RTO Rate</th>
              <th className="px-4 py-3.5">Effective From</th>
            </tr>
          </thead>
          <tbody>
            {[
              { zone: "A", base: selectedRate.withinCity, add: 18, rto: 40 },
              { zone: "B", base: selectedRate.withinState, add: 22, rto: 48 },
              { zone: "C", base: selectedRate.metroToMetro, add: 28, rto: 60 },
              { zone: "D", base: selectedRate.restOfIndia, add: 34, rto: 72 },
              { zone: "E", base: selectedRate.northEastAndJk, add: 42, rto: 88 }
            ].map((row) => (
              <tr key={row.zone} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30">
                <td className="px-4 py-3.5 font-bold text-white text-sm">Zone {row.zone}</td>
                <td className="px-4 py-3.5 font-mono font-bold text-slate-200 text-sm">₹{row.base}</td>
                <td className="px-4 py-3.5 font-mono text-slate-400 text-sm">₹{row.add}</td>
                <td className="px-4 py-3.5 font-mono text-slate-400 text-sm">₹{row.rto}</td>
                <td className="px-4 py-3.5 text-slate-400">01 Jul 2026</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer controls */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold select-none pt-2 bg-transparent">
        <span>Last Updated: 10 Jul 2026</span>
        <button
          onClick={() => setHistoryModalOpen(true)}
          className="px-3 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
        >
          View Rate History
        </button>
      </div>

      {/* Edit Rates Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveRates} className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-black text-white">Edit Default Rate Sheets</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Slabs config for {courier}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone A Base Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={editForm.withinCity}
                  onChange={(e) => setEditForm({ ...editForm, withinCity: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone B Base Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={editForm.withinState}
                  onChange={(e) => setEditForm({ ...editForm, withinState: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone C Base Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={editForm.metroToMetro}
                  onChange={(e) => setEditForm({ ...editForm, metroToMetro: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone D Base Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={editForm.restOfIndia}
                  onChange={(e) => setEditForm({ ...editForm, restOfIndia: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Zone E Base Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={editForm.northEastAndJk}
                  onChange={(e) => setEditForm({ ...editForm, northEastAndJk: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
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
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Override"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
              <h3 className="text-sm font-black text-white">Rate Slabs History</h3>
              <button onClick={() => setHistoryModalOpen(false)} className="text-slate-500 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {[
                { date: "10 Jul 2026", user: "Admin (Siyam)", change: "Base rates updated by ₹2 for Zone D" },
                { date: "01 Jul 2026", user: "System", change: "Initial FY 26-27 Rate Sheet published" }
              ].map((h, i) => (
                <div key={i} className="border-b border-[#1e293b]/50 pb-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                    <span>{h.date}</span>
                    <span>{h.user}</span>
                  </div>
                  <div className="text-slate-300 font-semibold">{h.change}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setHistoryModalOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
