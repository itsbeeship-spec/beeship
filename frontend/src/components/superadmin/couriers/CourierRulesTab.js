"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function CourierRulesTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courierFilter, setCourierFilter] = useState("all");
  const [toast, setToast] = useState(null);
  
  // Custom filter dropdown toggles
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [courierFilterOpen, setCourierFilterOpen] = useState(false);

  // Custom modal dropdown toggles
  const [zoneOpen, setZoneOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [weightCondOpen, setWeightCondOpen] = useState(false);
  const [prefCourierOpen, setPrefCourierOpen] = useState(false);
  const [fallCourierOpen, setFallCourierOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Rule Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    zone: "Zone A",
    weightCond: "Less Than",
    weightVal: "2",
    payment: "Any",
    preferredCourier: "BlueDart",
    fallbackCourier: "Delhivery",
    priority: "1",
    status: "Active"
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Rules from DB
  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ["superadminCourierRulesList"],
    queryFn: () => api.get("/admin/rules").then((res) => res || {}),
  });

  const rulesList = responseData?.data || [];

  // Metrics
  const metrics = {
    total: rulesList.length,
    active: rulesList.filter(r => r.enabled).length,
    inactive: rulesList.filter(r => !r.enabled).length,
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("all");
    setCourierFilter("all");
  };

  const handleToggleRule = async (ruleId) => {
    try {
      const res = await api.put(`/admin/rules/${ruleId}/toggle`);
      if (res && res.success) {
        showToast(res.message || "Rule status updated.", "success");
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to update rule status.", "error");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      const res = await api.delete(`/admin/rules/${ruleId}`);
      if (res && res.success) {
        showToast("Rule deleted successfully.", "success");
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to delete rule.", "error");
    }
  };

  const handleCreateRuleSubmit = async (e) => {
    e.preventDefault();
    if (!newRule.name.trim()) return showToast("Rule name is required.", "error");
    setIsSaving(true);
    try {
      // Build conditions array
      const configurations = [
        { field: "zone", condition: "eq", value: newRule.zone },
        { field: "weight", condition: newRule.weightCond === "Less Than" ? "lt" : newRule.weightCond === "Greater Than" ? "gt" : "eq", value: `${newRule.weightVal}kg` },
        { field: "payment", condition: "eq", value: newRule.payment }
      ];

      const priorities = {
        preferred: newRule.preferredCourier,
        fallback: newRule.fallbackCourier
      };

      const res = await api.post("/admin/rules", {
        name: newRule.name,
        priority: parseInt(newRule.priority, 10) || 1,
        enabled: newRule.status === "Active",
        conditionsJoin: "AND",
        configurations,
        priorities
      });

      if (res && res.success) {
        showToast("Courier rule created successfully.", "success");
        setCreateModalOpen(false);
        setNewRule({
          name: "",
          zone: "Zone A",
          weightCond: "Less Than",
          weightVal: "2",
          payment: "Any",
          preferredCourier: "BlueDart",
          fallbackCourier: "Delhivery",
          priority: "1",
          status: "Active"
        });
        refetch();
      }
    } catch (err) {
      showToast(err.message || "Failed to save rule.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Local Filter logic
  const filteredList = rulesList.filter(r => {
    if (search.trim()) {
      if (!r.name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (statusFilter !== "all") {
      const wantEnabled = statusFilter === "active";
      if (r.enabled !== wantEnabled) return false;
    }
    if (courierFilter !== "all") {
      const preferred = r.priorities?.preferred || "";
      if (preferred.toLowerCase() !== courierFilter.toLowerCase()) return false;
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

      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Courier Rules</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Configure courier assignment and routing rules.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
        >
          + Create Rule
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 max-w-sm select-none">
        {[
          { label: "Total Rules", count: metrics.total, border: "border-[#1e293b] bg-slate-500/5 text-slate-300" },
          { label: "Active", count: metrics.active, border: "border-emerald-500/15 bg-emerald-500/5 text-emerald-400" },
          { label: "Inactive", count: metrics.inactive, border: "border-rose-500/15 bg-rose-500/5 text-rose-400" }
        ].map((item, idx) => (
          <div key={idx} className={`border rounded-xl p-3 flex flex-col justify-between h-20 text-left ${item.border}`}>
            <span className="text-[10px] font-black uppercase tracking-wider opacity-85">{item.label}</span>
            <span className="text-xl font-black">{item.count.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center z-30 relative select-none">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules..."
            className="w-full bg-[#0b1120] border border-[#1e293b] focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setStatusFilterOpen(!statusFilterOpen); setCourierFilterOpen(false); }}
            className="flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[130px]"
          >
            <span>{statusFilter === "all" ? "All Statuses" : statusFilter === "active" ? "Active" : "Inactive"}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${statusFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {statusFilterOpen && (
            <div className="absolute left-0 mt-1.5 w-full min-w-[140px] bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
              {[
                { label: "All Statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setStatusFilter(opt.value); setStatusFilterOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${statusFilter === opt.value ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt.label}</span>
                  {statusFilter === opt.value && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Courier Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setCourierFilterOpen(!courierFilterOpen); setStatusFilterOpen(false); }}
            className="flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[140px]"
          >
            <span>{courierFilter === "all" ? "All Couriers" : courierFilter}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${courierFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {courierFilterOpen && (
            <div className="absolute left-0 mt-1.5 w-full min-w-[150px] bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
              {[
                { label: "All Couriers", value: "all" },
                { label: "BlueDart", value: "BlueDart" },
                { label: "Delhivery", value: "Delhivery" },
                { label: "Xpressbees", value: "Xpressbees" },
                { label: "Amazon Shipping", value: "Amazon Shipping" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setCourierFilter(opt.value); setCourierFilterOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${courierFilter === opt.value ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt.label}</span>
                  {courierFilter === opt.value && <span className="text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Rules Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-[#080d1a]/85 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              <th className="px-4 py-3">Rule</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Courier</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-500">
                  No auto-assign rules found.
                </td>
              </tr>
            ) : (
              filteredList.map((item) => {
                // Parse conditions into readable text
                const zoneObj = item.configurations?.find(c => c.field === "zone");
                const weightObj = item.configurations?.find(c => c.field === "weight");
                const condText = `${zoneObj ? zoneObj.value : "Any Zone"} + Weight ${weightObj ? (weightObj.condition === "lt" ? "<" : ">") + " " + weightObj.value : "Any"}`;

                return (
                  <tr key={item.id} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30">
                    <td className="px-4 py-3 text-white font-bold">{item.name}</td>
                    <td className="px-4 py-3 text-slate-400">{condText}</td>
                    <td className="px-4 py-3 text-slate-200 font-semibold">{item.priorities?.preferred || "Auto"}</td>
                    <td className="px-4 py-3 font-mono font-black">{item.priority}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${
                        item.enabled 
                          ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
                          : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                      }`}>
                        {item.enabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleRule(item.id)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded transition cursor-pointer"
                      >
                        {item.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(item.id)}
                        className="px-2 py-1 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 text-rose-400 text-[10px] rounded transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Rule Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateRuleSubmit} className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs overflow-visible">
            <div>
              <h3 className="text-sm font-black text-white">Create Courier Rule</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Route shipments dynamically based on rule weight & zone priority.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi Express"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="border-t border-[#1e293b]/50 pt-2 select-none">
                <span className="text-[9px] font-black uppercase text-indigo-400">Conditions</span>
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-30">
                {/* Zone Select */}
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Zone</label>
                  <button
                    type="button"
                    onClick={() => { setZoneOpen(!zoneOpen); setPaymentOpen(false); setWeightCondOpen(false); setPrefCourierOpen(false); setFallCourierOpen(false); setStatusOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <span>{newRule.zone}</span>
                    <svg className={`w-3 h-3 text-slate-400 transition-transform ${zoneOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {zoneOpen && (
                    <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
                      {["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setNewRule({ ...newRule, zone: opt }); setZoneOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${newRule.zone === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                        >
                          <span>{opt}</span>
                          {newRule.zone === opt && <span className="text-indigo-400">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Select */}
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Payment Type</label>
                  <button
                    type="button"
                    onClick={() => { setPaymentOpen(!paymentOpen); setZoneOpen(false); setWeightCondOpen(false); setPrefCourierOpen(false); setFallCourierOpen(false); setStatusOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <span>{newRule.payment}</span>
                    <svg className={`w-3 h-3 text-slate-400 transition-transform ${paymentOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {paymentOpen && (
                    <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
                      {["Any", "COD", "Prepaid"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setNewRule({ ...newRule, payment: opt }); setPaymentOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${newRule.payment === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                        >
                          <span>{opt}</span>
                          {newRule.payment === opt && <span className="text-indigo-400">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weight Condition Select */}
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Weight Condition</label>
                  <button
                    type="button"
                    onClick={() => { setWeightCondOpen(!weightCondOpen); setZoneOpen(false); setPaymentOpen(false); setPrefCourierOpen(false); setFallCourierOpen(false); setStatusOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <span>{newRule.weightCond}</span>
                    <svg className={`w-3 h-3 text-slate-400 transition-transform ${weightCondOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {weightCondOpen && (
                    <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
                      {["Less Than", "Greater Than"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setNewRule({ ...newRule, weightCond: opt }); setWeightCondOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${newRule.weightCond === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                        >
                          <span>{opt}</span>
                          {newRule.weightCond === opt && <span className="text-indigo-400">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weight Input */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Weight Value (KG)</label>
                  <input
                    type="number"
                    value={newRule.weightVal}
                    onChange={(e) => setNewRule({ ...newRule, weightVal: e.target.value })}
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="border-t border-[#1e293b]/50 pt-2 select-none">
                <span className="text-[9px] font-black uppercase text-indigo-400">Action</span>
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-20">
                {/* Preferred Courier Select */}
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Preferred Courier</label>
                  <button
                    type="button"
                    onClick={() => { setPrefCourierOpen(!prefCourierOpen); setZoneOpen(false); setPaymentOpen(false); setWeightCondOpen(false); setFallCourierOpen(false); setStatusOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <span>{newRule.preferredCourier}</span>
                    <svg className={`w-3 h-3 text-slate-400 transition-transform ${prefCourierOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {prefCourierOpen && (
                    <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
                      {["BlueDart", "Delhivery", "Xpressbees", "Amazon Shipping"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setNewRule({ ...newRule, preferredCourier: opt }); setPrefCourierOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${newRule.preferredCourier === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                        >
                          <span>{opt}</span>
                          {newRule.preferredCourier === opt && <span className="text-indigo-400">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fallback Courier Select */}
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Fallback Courier</label>
                  <button
                    type="button"
                    onClick={() => { setFallCourierOpen(!fallCourierOpen); setZoneOpen(false); setPaymentOpen(false); setWeightCondOpen(false); setPrefCourierOpen(false); setStatusOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <span>{newRule.fallbackCourier}</span>
                    <svg className={`w-3 h-3 text-slate-400 transition-transform ${fallCourierOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {fallCourierOpen && (
                    <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
                      {["Delhivery", "BlueDart", "Xpressbees", "Amazon Shipping"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setNewRule({ ...newRule, fallbackCourier: opt }); setFallCourierOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${newRule.fallbackCourier === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                        >
                          <span>{opt}</span>
                          {newRule.fallbackCourier === opt && <span className="text-indigo-400">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority Input */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Priority Score</label>
                  <input
                    type="number"
                    value={newRule.priority}
                    onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })}
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Status Select */}
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Status</label>
                  <button
                    type="button"
                    onClick={() => { setStatusOpen(!statusOpen); setZoneOpen(false); setPaymentOpen(false); setWeightCondOpen(false); setPrefCourierOpen(false); setFallCourierOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <span>{newRule.status}</span>
                    <svg className={`w-3 h-3 text-slate-400 transition-transform ${statusOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {statusOpen && (
                    <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in select-none">
                      {["Active", "Inactive"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setNewRule({ ...newRule, status: opt }); setStatusOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${newRule.status === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                        >
                          <span>{opt}</span>
                          {newRule.status === opt && <span className="text-indigo-400">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 select-none">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="flex-1 px-4 py-2 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Rule"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
