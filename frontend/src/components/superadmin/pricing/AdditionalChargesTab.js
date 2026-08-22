"use client";

import React, { useState, useEffect, useRef } from "react";

export default function AdditionalChargesTab() {
  const [toast, setToast] = useState(null);
  const [actionMenuRow, setActionMenuRow] = useState(null);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const [selectedCharge, setSelectedCharge] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [charges, setCharges] = useState([]);

  // Form input states
  const [newCharge, setNewCharge] = useState({ name: "", type: "Percentage", value: "", appliesTo: "All Shipments", status: "Active" });
  const [typeOpen, setTypeOpen] = useState(false);
  const [appliesOpen, setAppliesOpen] = useState(false);

  const menuRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load from localstorage on mount
  useEffect(() => {
    const cached = localStorage.getItem("superadmin_additional_charges");
    if (cached) {
      setCharges(JSON.parse(cached));
    } else {
      const defaults = [
        { id: "chg-1", name: "Fuel Surcharge", type: "Percentage", value: "5%", appliesTo: "All Shipments", status: "Active", history: ["Created by Admin - 01 Jul 2026", "Updated fuel coefficient - 10 Jul 2026"] },
        { id: "chg-2", name: "ODA Charge", type: "Fixed", value: "₹50", appliesTo: "Remote Areas", status: "Active", history: ["Created by Admin - 01 Jul 2026"] },
        { id: "chg-3", name: "Handling Charge", type: "Fixed", value: "₹10", appliesTo: "Heavy Shipments", status: "Active", history: ["Created by Admin - 05 Jul 2026"] }
      ];
      setCharges(defaults);
      localStorage.setItem("superadmin_additional_charges", JSON.stringify(defaults));
    }
  }, []);

  // Save to localstorage
  const saveCharges = (newList) => {
    setCharges(newList);
    localStorage.setItem("superadmin_additional_charges", JSON.stringify(newList));
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActionMenuRow(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newCharge.name || !newCharge.value) return;
    setIsSaving(true);

    setTimeout(() => {
      const added = {
        id: `chg-${Date.now()}`,
        name: newCharge.name,
        type: newCharge.type,
        value: newCharge.type === "Percentage" ? `${newCharge.value}%` : `₹${newCharge.value}`,
        appliesTo: newCharge.appliesTo,
        status: newCharge.status,
        history: [`Created by Admin - ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`]
      };
      const list = [...charges, added];
      saveCharges(list);
      showToast(`Charge "${added.name}" created successfully.`, "success");
      setAddModalOpen(false);
      setNewCharge({ name: "", type: "Percentage", value: "", appliesTo: "All Shipments", status: "Active" });
      setIsSaving(false);
    }, 600);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      const list = charges.map(c => {
        if (c.id === selectedCharge.id) {
          return {
            ...selectedCharge,
            history: [...selectedCharge.history, `Modified by Admin - ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`]
          };
        }
        return c;
      });
      saveCharges(list);
      showToast(`Charge "${selectedCharge.name}" updated successfully.`, "success");
      setEditModalOpen(false);
      setIsSaving(false);
    }, 600);
  };

  const handleDuplicate = (c) => {
    setActionMenuRow(null);
    const duplicated = {
      ...c,
      id: `chg-${Date.now()}`,
      name: `${c.name} (Copy)`,
      history: [`Duplicated from ${c.name} - ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`]
    };
    const list = [...charges, duplicated];
    saveCharges(list);
    showToast(`Charge duplicated as "${duplicated.name}"`, "success");
  };

  const handleToggleStatus = (c) => {
    setActionMenuRow(null);
    const nextStatus = c.status === "Active" ? "Inactive" : "Active";
    const list = charges.map(item => {
      if (item.id === c.id) {
        return { ...item, status: nextStatus };
      }
      return item;
    });
    saveCharges(list);
    showToast(`Charge status changed to ${nextStatus}`, "success");
  };

  const handleDelete = (c) => {
    setActionMenuRow(null);
    const list = charges.filter(item => item.id !== c.id);
    saveCharges(list);
    showToast(`Charge "${c.name}" deleted successfully.`, "success");
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
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Additional Charges</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Manage applicable surcharges and additional fees.</p>
        </div>
        <button
          onClick={() => { setAddModalOpen(true); setNewCharge({ name: "", type: "Percentage", value: "", appliesTo: "All Shipments", status: "Active" }); }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
        >
          + Add Charge
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative min-h-[160px]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3.5">Charge Name</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-4 py-3.5">Value</th>
              <th className="px-4 py-3.5">Applies To</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-center">⋮</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((row) => (
              <tr key={row.id} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30">
                <td className="px-4 py-3.5 font-bold text-white text-sm">{row.name}</td>
                <td className="px-4 py-3.5 text-slate-300">{row.type}</td>
                <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold text-sm">{row.value}</td>
                <td className="px-4 py-3.5 text-slate-400">{row.appliesTo}</td>
                <td className="px-4 py-3.5">
                  <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${
                    row.status === "Active"
                      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
                      : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center relative" ref={actionMenuRow === row.id ? menuRef : null}>
                  <button
                    onClick={() => setActionMenuRow(actionMenuRow === row.id ? null : row.id)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>

                  {/* Action Dropdown Menu - Rounded and clean SVG icons only */}
                  {actionMenuRow === row.id && (
                    <div className="absolute right-4 mt-1 w-48 bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-30 py-1.5 text-left overflow-hidden select-none">
                      <button
                        onClick={() => { setSelectedCharge(row); setDetailModalOpen(true); setActionMenuRow(null); }}
                        className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View Details
                      </button>
                      <button
                        onClick={() => { setSelectedCharge(row); setEditModalOpen(true); setActionMenuRow(null); }}
                        className="w-full text-left px-3 py-1.5 text-[10px] text-indigo-400 hover:bg-indigo-500/10 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit Charge
                      </button>
                      <button
                        onClick={() => handleDuplicate(row)}
                        className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        Duplicate Charge
                      </button>
                      <button
                        onClick={() => { setSelectedCharge(row); setHistoryModalOpen(true); setActionMenuRow(null); }}
                        className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        View Change History
                      </button>

                      <div className="border-t border-[#1e293b] my-1" />

                      <button
                        onClick={() => handleToggleStatus(row)}
                        className="w-full text-left px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        {row.status === "Active" ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Disable Charge
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Enable Charge
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(row)}
                        className="w-full text-left px-3 py-1.5 text-[10px] text-rose-500 hover:bg-rose-500/10 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete Charge
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Charge Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs overflow-visible">
            <div>
              <h3 className="text-sm font-black text-white">Add Additional Charge</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Publish new global surcharges or custom heavy fees.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Charge Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handling Charge"
                  value={newCharge.name}
                  onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Type */}
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Type</label>
                  <button
                    type="button"
                    onClick={() => { setTypeOpen(!typeOpen); setAppliesOpen(false); }}
                    className="w-full flex items-center justify-between bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                  >
                    <span>{newCharge.type}</span>
                    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {typeOpen && (
                    <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-45 py-1">
                      {["Percentage", "Fixed"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setNewCharge({ ...newCharge, type: opt }); setTypeOpen(false); }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Value */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Value (e.g. 5 or 50)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5"
                    value={newCharge.value}
                    onChange={(e) => setNewCharge({ ...newCharge, value: e.target.value })}
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Applies To */}
              <div className="space-y-1 relative">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Applies To</label>
                <button
                  type="button"
                  onClick={() => { setAppliesOpen(!appliesOpen); setTypeOpen(false); }}
                  className="w-full flex items-center justify-between bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  <span>{newCharge.appliesTo}</span>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {appliesOpen && (
                  <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-45 py-1">
                    {["All Shipments", "Remote Areas", "Heavy Shipments"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setNewCharge({ ...newCharge, appliesTo: opt }); setAppliesOpen(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 select-none">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
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

      {/* Edit Charge Modal */}
      {editModalOpen && selectedCharge && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditSubmit} className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-black text-white">Edit Surcharge</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Surcharge: {selectedCharge.name}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Value</label>
                <input
                  type="text"
                  required
                  value={selectedCharge.value}
                  onChange={(e) => setSelectedCharge({ ...selectedCharge, value: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
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

      {/* Details Modal */}
      {detailModalOpen && selectedCharge && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
              <h3 className="text-sm font-black text-white">Surcharge Details</h3>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-500 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="text-white font-bold">{selectedCharge.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Type:</span><span className="text-slate-200">{selectedCharge.type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Value:</span><span className="text-emerald-400 font-mono font-bold">{selectedCharge.value}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Applies To:</span><span className="text-slate-300 font-semibold">{selectedCharge.appliesTo}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="text-white font-bold uppercase">{selectedCharge.status}</span></div>
            </div>
            <button
              onClick={() => setDetailModalOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && selectedCharge && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
              <h3 className="text-sm font-black text-white">Change History</h3>
              <button onClick={() => setHistoryModalOpen(false)} className="text-slate-500 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedCharge.history.map((h, i) => (
                <div key={i} className="border-b border-[#1e293b]/40 pb-2 text-slate-300 font-semibold">
                  {h}
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
