"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function RateCalculatorConfigTab() {
  const [toast, setToast] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState("Delhivery Surface (DS)");
  const [slabStep, setSlabStep] = useState("0.5");
  const [isSaving, setIsSaving] = useState(false);

  // Form state for 5 zones (Base Rate & Additional Rate)
  const [form, setForm] = useState({
    withinCity: "40",
    addWithinCity: "25",
    withinState: "47",
    addWithinState: "30",
    metroToMetro: "60",
    addMetroToMetro: "35",
    restOfIndia: "72",
    addRestOfIndia: "45",
    northEastAndJk: "88",
    addNorthEastAndJk: "55",
    codCharges: "35",
    codPercent: "2"
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Calculator Specific Rates (isolated from GLOBAL default rate cards)
  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ["superadminCalculatorRatesList"],
    queryFn: () => api.get("/admin/billing/rates/merchant/CALCULATOR").then((res) => res || {}),
    staleTime: 5 * 60 * 1000,
  });

  const rawRatesList = responseData?.data || [];

  // Update local form state when selected courier changes or rates are loaded
  React.useEffect(() => {
    const rateEntry = rawRatesList.find(r => r.courier === selectedCourier);
    if (rateEntry) {
      setForm({
        withinCity: (rateEntry.withinCity ?? 40).toString(),
        addWithinCity: (rateEntry.addWithinCity ?? Math.round((rateEntry.withinCity || 40) * 0.6)).toString(),
        withinState: (rateEntry.withinState ?? 47).toString(),
        addWithinState: (rateEntry.addWithinState ?? Math.round((rateEntry.withinState || 47) * 0.6)).toString(),
        metroToMetro: (rateEntry.metroToMetro ?? 60).toString(),
        addMetroToMetro: (rateEntry.addMetroToMetro ?? Math.round((rateEntry.metroToMetro || 60) * 0.6)).toString(),
        restOfIndia: (rateEntry.restOfIndia ?? 72).toString(),
        addRestOfIndia: (rateEntry.addRestOfIndia ?? Math.round((rateEntry.restOfIndia || 72) * 0.6)).toString(),
        northEastAndJk: (rateEntry.northEastAndJk ?? 88).toString(),
        addNorthEastAndJk: (rateEntry.addNorthEastAndJk ?? Math.round((rateEntry.northEastAndJk || 88) * 0.6)).toString(),
        codCharges: (rateEntry.codCharges ?? 35).toString(),
        codPercent: (rateEntry.codPercent ?? 2).toString()
      });
      if (rateEntry.weightSlabStep) {
        setSlabStep(rateEntry.weightSlabStep.toString());
      }
    }
  }, [selectedCourier, responseData]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        courier: selectedCourier,
        withinCity: parseFloat(form.withinCity) || 0,
        addWithinCity: parseFloat(form.addWithinCity) || 0,
        withinState: parseFloat(form.withinState) || 0,
        addWithinState: parseFloat(form.addWithinState) || 0,
        metroToMetro: parseFloat(form.metroToMetro) || 0,
        addMetroToMetro: parseFloat(form.addMetroToMetro) || 0,
        restOfIndia: parseFloat(form.restOfIndia) || 0,
        addRestOfIndia: parseFloat(form.addRestOfIndia) || 0,
        northEastAndJk: parseFloat(form.northEastAndJk) || 0,
        addNorthEastAndJk: parseFloat(form.addNorthEastAndJk) || 0,
        weightSlabStep: parseFloat(slabStep) || 0.5,
        codCharges: parseFloat(form.codCharges) || 35,
        codPercent: parseFloat(form.codPercent) || 2
      };

      const res = await api.put(`/admin/billing/rates/merchant/CALCULATOR`, payload);

      if (res && (res.success || res.status === 200)) {
        showToast(`Rate Calculator settings for ${selectedCourier} saved successfully!`, "success");
        refetch();
      } else {
        showToast("Rate sheet saved.", "success");
        refetch();
      }
    } catch (err) {
      console.error("Save Rate Calculator settings error:", err);
      showToast(err.message || "Failed to update Rate Calculator settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const couriersList = [
    "Delhivery Surface (DS)",
    "Bluedart Surface (N)",
    "Xpressbees Surface",
    "Amazon Shipping"
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 border rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-slide-in ${
          toast.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        }`}>
          <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/50 border border-blue-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🧮</span>
              <h2 className="text-lg font-extrabold text-white tracking-wide">Rate Calculator & Weight Slab Control</h2>
            </div>
            <p className="text-xs text-slate-350 mt-1 max-w-2xl leading-relaxed">
              Configure Zone-wise **Base Rates (First 0.5kg)** and **Additional Rates (Extra 0.5kg)** for the B2C Rate Calculator and all shipping cost estimations across the platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300">Courier Partner:</span>
            <select
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              className="bg-slate-800/90 border border-slate-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              {couriersList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Configuration Form Card */}
      <form onSubmit={handleSaveConfig} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Slab Step Selector */}
        <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-xl">
          <div>
            <h4 className="text-xs font-bold text-white">Weight Slab Step Size</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Select step increment size used for slab calculations</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSlabStep("0.5")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                slabStep === "0.5"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              0.5 kg (Standard)
            </button>
            <button
              type="button"
              onClick={() => setSlabStep("1.0")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                slabStep === "1.0"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              1.0 kg (Heavy)
            </button>
          </div>
        </div>

        {/* Rates Matrix Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">
            Zone-Wise Base & Additional Rate Matrix ({selectedCourier})
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-extrabold">
                <tr>
                  <th className="py-3 px-4">Zone Description</th>
                  <th className="py-3 px-4">First {slabStep} kg (Base Rate ₹)</th>
                  <th className="py-3 px-4">Every Extra {slabStep} kg (Additional Rate ₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {/* Zone A */}
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-bold text-white">Zone A (Within City)</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.withinCity}
                      onChange={(e) => setForm(prev => ({ ...prev, withinCity: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.addWithinCity}
                      onChange={(e) => setForm(prev => ({ ...prev, addWithinCity: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </td>
                </tr>

                {/* Zone B */}
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-bold text-white">Zone B (Within State)</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.withinState}
                      onChange={(e) => setForm(prev => ({ ...prev, withinState: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.addWithinState}
                      onChange={(e) => setForm(prev => ({ ...prev, addWithinState: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </td>
                </tr>

                {/* Zone C */}
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-bold text-white">Zone C (Metro to Metro)</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.metroToMetro}
                      onChange={(e) => setForm(prev => ({ ...prev, metroToMetro: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.addMetroToMetro}
                      onChange={(e) => setForm(prev => ({ ...prev, addMetroToMetro: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </td>
                </tr>

                {/* Zone D */}
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-bold text-white">Zone D (Rest of India)</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.restOfIndia}
                      onChange={(e) => setForm(prev => ({ ...prev, restOfIndia: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.addRestOfIndia}
                      onChange={(e) => setForm(prev => ({ ...prev, addRestOfIndia: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </td>
                </tr>

                {/* Zone E */}
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-bold text-white">Zone E (North East & J&K)</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.northEastAndJk}
                      onChange={(e) => setForm(prev => ({ ...prev, northEastAndJk: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.addNorthEastAndJk}
                      onChange={(e) => setForm(prev => ({ ...prev, addNorthEastAndJk: e.target.value }))}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* COD Charges Config Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/40 border border-slate-800 rounded-xl">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">COD Minimum Flat Fee (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.codCharges}
              onChange={(e) => setForm(prev => ({ ...prev, codCharges: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">COD Collection Fee (%)</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.codPercent}
              onChange={(e) => setForm(prev => ({ ...prev, codPercent: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2 ${
              isSaving ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving Configuration...</span>
              </>
            ) : (
              <span>Save Rate Calculator Configuration</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
