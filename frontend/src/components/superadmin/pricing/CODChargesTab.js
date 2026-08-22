"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function CODChargesTab() {
  const [toast, setToast] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch standard rates containing COD details
  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ["superadminCODChargesDbList"],
    queryFn: () => api.get("/admin/billing/rates/merchant/GLOBAL").then((res) => res || {}),
    staleTime: 5 * 60 * 1000,
  });

  const rawRatesList = responseData?.data || [];

  // Form states
  const [editForm, setEditForm] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEditClick = () => {
    const nextForm = {};
    rawRatesList.forEach(c => {
      nextForm[c.courier] = { fixed: c.codCharges.toString(), percentage: c.codPercent.toString() };
    });
    setEditForm(nextForm);
    setEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Loop over rates list and save changes for each courier in DB
      for (const item of rawRatesList) {
        const formVals = editForm[item.courier];
        if (formVals) {
          await api.put(`/admin/billing/rates/merchant/GLOBAL`, {
            courier: item.courier,
            withinCity: item.withinCity,
            withinState: item.withinState,
            metroToMetro: item.metroToMetro,
            restOfIndia: item.restOfIndia,
            northEastAndJk: item.northEastAndJk,
            codCharges: parseFloat(formVals.fixed) || 0,
            codPercent: parseFloat(formVals.percentage) || 0
          });
        }
      }
      showToast("COD charges updated successfully in DB.", "success");
      setEditModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err.message || "Failed to update COD charges.", "error");
    } finally {
      setIsSaving(false);
    }
  };

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
          <h2 className="text-sm font-black text-white uppercase tracking-wider">COD Charges</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Configure COD fees charged to sellers.</p>
        </div>
        <button
          onClick={handleEditClick}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
        >
          Edit Charges
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-[#080d1a]/85 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3.5">Courier</th>
              <th className="px-4 py-3.5">Fixed Charge</th>
              <th className="px-4 py-3.5">Percentage</th>
              <th className="px-4 py-3.5">Calculation</th>
              <th className="px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rawRatesList.map((row) => (
              <tr key={row.id} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30">
                <td className="px-4 py-3.5 font-bold text-white text-sm">{row.courier}</td>
                <td className="px-4 py-3.5 font-mono text-slate-200 text-sm">₹{row.codCharges}</td>
                <td className="px-4 py-3.5 font-mono text-slate-400 text-sm">{row.codPercent}%</td>
                <td className="px-4 py-3.5 text-slate-400 text-sm">Whichever is higher</td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg text-[9px] font-black uppercase">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Charges Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-black text-white">Edit COD Fee Thresholds</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Define min base and percentage variables.</p>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {rawRatesList.map((c) => (
                <div key={c.id} className="border border-[#1e293b]/50 rounded-xl p-3 bg-[#0c1324]/20 space-y-3">
                  <div className="font-bold text-white text-[11px]">{c.courier}</div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-500">Fixed Charge (₹)</label>
                      <input
                        type="number"
                        required
                        value={editForm[c.courier]?.fixed || ""}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          [c.courier]: { ...editForm[c.courier], fixed: e.target.value }
                        })}
                        className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-500">Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editForm[c.courier]?.percentage || ""}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          [c.courier]: { ...editForm[c.courier], percentage: e.target.value }
                        })}
                        className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
