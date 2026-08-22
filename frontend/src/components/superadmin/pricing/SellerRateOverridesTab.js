"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const COURIER_PARTNERS = [
  "Delhivery Surface (DS)",
  "Bluedart Surface (N)",
  "Xpressbees Surface",
  "Amazon Shipping"
];

const SERVICE_OPTIONS = ["Surface", "Express", "Air"];

const COURIER_SERVICE_RATES = {
  "Delhivery Surface (DS)": {
    Surface: { withinCity: 40, withinState: 47, metroToMetro: 60, restOfIndia: 72, northEastAndJk: 88 },
    Express: { withinCity: 50, withinState: 58, metroToMetro: 75, restOfIndia: 90, northEastAndJk: 110 },
  },
  "Bluedart Surface (N)": {
    Surface: { withinCity: 45, withinState: 52, metroToMetro: 65, restOfIndia: 78, northEastAndJk: 95 },
    Express: { withinCity: 58, withinState: 68, metroToMetro: 85, restOfIndia: 102, northEastAndJk: 125 },
  },
  "Xpressbees Surface": {
    Surface: { withinCity: 38, withinState: 44, metroToMetro: 56, restOfIndia: 68, northEastAndJk: 82 },
    Express: { withinCity: 48, withinState: 55, metroToMetro: 70, restOfIndia: 85, northEastAndJk: 105 },
  },
  "Amazon Shipping": {
    Surface: { withinCity: 35, withinState: 42, metroToMetro: 52, restOfIndia: 64, northEastAndJk: 78 },
    Express: { withinCity: 46, withinState: 54, metroToMetro: 68, restOfIndia: 82, northEastAndJk: 100 },
  },
  "DTDC Express": {
    Surface: { withinCity: 42, withinState: 49, metroToMetro: 62, restOfIndia: 75, northEastAndJk: 90 },
    Express: { withinCity: 54, withinState: 62, metroToMetro: 78, restOfIndia: 95, northEastAndJk: 115 },
  },
  "Ecom Express": {
    Surface: { withinCity: 37, withinState: 43, metroToMetro: 55, restOfIndia: 66, northEastAndJk: 80 },
    Express: { withinCity: 47, withinState: 54, metroToMetro: 69, restOfIndia: 84, northEastAndJk: 102 },
  },
};

// Helper to construct multi-courier rates for a seller
const generateAllCourierRates = (discount = 5) => {
  const result = {};
  COURIER_PARTNERS.forEach(c => {
    const base = COURIER_SERVICE_RATES[c]?.Surface || { withinCity: 40, withinState: 47, metroToMetro: 60, restOfIndia: 72, northEastAndJk: 88 };
    result[c] = {
      withinCity: String(Math.max(10, base.withinCity - discount)),
      withinState: String(Math.max(10, base.withinState - discount)),
      metroToMetro: String(Math.max(10, base.metroToMetro - discount)),
      restOfIndia: String(Math.max(10, base.restOfIndia - discount)),
      northEastAndJk: String(Math.max(10, base.northEastAndJk - discount)),
    };
  });
  return result;
};

const DEFAULT_OVERRIDES_LIST = [
  {
    id: "ovr-1",
    sellerId: "BS-10241",
    sellerName: "Bee Store",
    sellerEmail: "beestore@gmail.com",
    courier: "All Couriers (6)",
    service: "Surface & Express",
    overrides: "5 Zones",
    validity: "No Expiry",
    status: "Active",
    allRates: generateAllCourierRates(5)
  },
  {
    id: "ovr-2",
    sellerId: "BS-10242",
    sellerName: "RK Traders",
    sellerEmail: "rktraders@gmail.com",
    courier: "All Couriers (6)",
    service: "Surface & Express",
    overrides: "5 Zones",
    validity: "31 Dec 26",
    status: "Active",
    allRates: generateAllCourierRates(4)
  }
];

export default function SellerRateOverridesTab() {
  const [search, setSearch] = useState("");
  const [courierFilter, setCourierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);

  // Dropdown states
  const [courierOpen, setCourierOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [actionMenuRow, setActionMenuRow] = useState(null);

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null); // null = add new, object = edit
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerOpen, setSellerOpen] = useState(false);
  const [selectedCourierTab, setSelectedCourierTab] = useState("Delhivery Surface (DS)");
  const [selectedService, setSelectedService] = useState("Surface");
  const [serviceOpenModal, setServiceOpenModal] = useState(false);
  const [statusModal, setStatusModal] = useState("Active");
  const [statusOpenModal, setStatusOpenModal] = useState(false);

  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // View Details Modal State
  const [viewDetailsRow, setViewDetailsRow] = useState(null);

  // Delete Confirmation Warning Modal State
  const [deleteConfirmRow, setDeleteConfirmRow] = useState(null);

  // Rates for all couriers in modal
  const [modalCourierRates, setModalCourierRates] = useState(generateAllCourierRates(5));

  // Active custom rates currently edited in input boxes
  const [customRates, setCustomRates] = useState({
    withinCity: "35",
    withinState: "42",
    metroToMetro: "55",
    restOfIndia: "67",
    northEastAndJk: "83"
  });

  const [defaultRates, setDefaultRates] = useState({
    withinCity: 40,
    withinState: 47,
    metroToMetro: 60,
    restOfIndia: 72,
    northEastAndJk: 88
  });

  const menuRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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

  // Fetch Sellers List
  const { data: sellersData } = useQuery({
    queryKey: ["superadminSellersListForOverrides"],
    queryFn: () => api.get("/admin/sellers?limit=100").then(res => res?.data?.sellers || []),
    staleTime: 5 * 60 * 1000,
  });
  const sellers = sellersData || [];

  // Fetch Connected Global Couriers dynamically from DB
  const { data: globalRatesData } = useQuery({
    queryKey: ["globalBillingRatesForOverrides"],
    queryFn: () => api.get("/admin/billing/rates/merchant/GLOBAL").then(res => res?.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const activeCouriers = (globalRatesData && globalRatesData.length > 0)
    ? globalRatesData.map(r => r.courier)
    : COURIER_PARTNERS;

  // Query to fetch live DB rates for viewDetailsRow seller
  const { data: dbMerchantRatesPayload, isLoading: loadingDbMerchantRates } = useQuery({
    queryKey: ["merchantBillingRatesViewDetails", viewDetailsRow?.sellerId],
    queryFn: () => api.get(`/admin/billing/rates/merchant/${viewDetailsRow.sellerId}`).then(res => res?.data || []),
    enabled: !!viewDetailsRow?.sellerId,
  });

  // Overrides state initialized from LocalStorage to ensure PERMANENCE across refreshes
  const [overrides, setOverrides] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("beeship_seller_rate_overrides");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error("Failed to parse saved rate overrides", e);
        }
      }
    }
    return DEFAULT_OVERRIDES_LIST;
  });

  // Save to LocalStorage whenever overrides state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("beeship_seller_rate_overrides", JSON.stringify(overrides));
    }
  }, [overrides]);

  // Sync active customRates when Courier Tab changes inside Modal
  useEffect(() => {
    if (addModalOpen) {
      if (selectedCourierTab === "All Couriers") {
        setDefaultRates({ withinCity: 40, withinState: 47, metroToMetro: 60, restOfIndia: 72, northEastAndJk: 88 });
      } else {
        const base = COURIER_SERVICE_RATES[selectedCourierTab]?.Surface || { withinCity: 40, withinState: 47, metroToMetro: 60, restOfIndia: 72, northEastAndJk: 88 };
        setDefaultRates(base);
        if (modalCourierRates[selectedCourierTab]) {
          setCustomRates(modalCourierRates[selectedCourierTab]);
        }
      }
    }
  }, [selectedCourierTab, addModalOpen]);

  // Handle Rate Input Change in Modal
  const handleRateInputChange = (zoneKey, value) => {
    const updatedRates = { ...customRates, [zoneKey]: value };
    setCustomRates(updatedRates);

    if (selectedCourierTab === "All Couriers") {
      // Update ALL couriers in bulk
      const newAllRates = {};
      COURIER_PARTNERS.forEach(c => {
        const base = COURIER_SERVICE_RATES[c]?.Surface || { withinCity: 40, withinState: 47, metroToMetro: 60, restOfIndia: 72, northEastAndJk: 88 };
        const diff = (defaultRates[zoneKey] || 40) - parseFloat(value || 0);
        newAllRates[c] = {
          ...(modalCourierRates[c] || {}),
          [zoneKey]: String(Math.max(5, base[zoneKey] - diff))
        };
      });
      setModalCourierRates(newAllRates);
    } else {
      // Update specific courier
      setModalCourierRates(prev => ({
        ...prev,
        [selectedCourierTab]: updatedRates
      }));
    }
  };

  // Open modal for ADD
  const handleOpenAddModal = () => {
    setEditingRow(null);
    setSelectedSeller(sellers.length > 0 ? sellers[0] : null);
    setSelectedCourierTab("All Couriers");
    setSelectedService("Surface & Express");
    setStatusModal("Active");
    setValidFrom("");
    setValidUntil("");
    const defaultRatesMap = generateAllCourierRates(5);
    setModalCourierRates(defaultRatesMap);
    setCustomRates({
      withinCity: "35",
      withinState: "42",
      metroToMetro: "55",
      restOfIndia: "67",
      northEastAndJk: "83"
    });
    setAddModalOpen(true);
  };

  // Open modal for EDIT
  const handleOpenEditModal = (row) => {
    setEditingRow(row);
    const matchedSeller = sellers.find(s => s.id === row.sellerId || (s.companyName && s.companyName.toLowerCase().trim() === row.sellerName.toLowerCase().trim())) || {
      id: row.sellerId,
      companyName: row.sellerName,
      firstName: row.sellerName,
      lastName: ""
    };
    setSelectedSeller(matchedSeller);
    setSelectedCourierTab("All Couriers");
    setSelectedService(row.service || "Surface & Express");
    setStatusModal(row.status || "Active");
    setValidFrom("");
    setValidUntil("");
    
    const existingRates = row.allRates || generateAllCourierRates(5);
    setModalCourierRates(existingRates);
    setCustomRates(existingRates["Delhivery Surface (DS)"] || { withinCity: "35", withinState: "42", metroToMetro: "55", restOfIndia: "67", northEastAndJk: "83" });
    setActionMenuRow(null);
    setAddModalOpen(true);
  };

  // Delete override
  const handleDeleteOverride = (row) => {
    setOverrides((prev) => {
      const updated = prev.filter((item) => item.id !== row.id);
      if (typeof window !== "undefined") {
        localStorage.setItem("beeship_seller_rate_overrides", JSON.stringify(updated));
      }
      return updated;
    });
    setActionMenuRow(null);
    showToast(`Rate override deleted for ${row.sellerName}`, "info");
  };

  const filteredOverrides = overrides.filter(ovr => {
    if (search.trim() && !ovr.sellerName.toLowerCase().includes(search.toLowerCase()) && !ovr.sellerId.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && ovr.status !== statusFilter) return false;
    return true;
  });

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!selectedSeller) return showToast("Please select a seller.", "error");
    setIsSaving(true);
    
    try {
      const sellerDisplayName = selectedSeller.companyName || `${selectedSeller.firstName || ''} ${selectedSeller.lastName || ''}`.trim() || "Seller";
      const sellerIdVal = selectedSeller.id || `BS-${Math.floor(10000 + Math.random() * 90000)}`;
      const validityStr = validUntil 
        ? new Date(validUntil).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) 
        : "No Expiry";

      const finalAllRates = { ...modalCourierRates };
      // Make sure every courier has a set of rates
      COURIER_PARTNERS.forEach(c => {
        if (!finalAllRates[c]) {
          const base = COURIER_SERVICE_RATES[c]?.Surface || { withinCity: 40, withinState: 47, metroToMetro: 60, restOfIndia: 72, northEastAndJk: 88 };
          finalAllRates[c] = {
            withinCity: String(base.withinCity - 5),
            withinState: String(base.withinState - 5),
            metroToMetro: String(base.metroToMetro - 5),
            restOfIndia: String(base.restOfIndia - 5),
            northEastAndJk: String(base.northEastAndJk - 5),
          };
        }
      });

      // Save overrides in database for all courier partners for this seller
      if (selectedSeller.id) {
        const courierNames = Object.keys(finalAllRates);
        await Promise.all(
          courierNames.map(async (cName) => {
            const ratesObj = finalAllRates[cName];
            if (ratesObj) {
              return api.put(`/admin/billing/rates/merchant/${selectedSeller.id}`, {
                courier: cName,
                withinCity: parseFloat(ratesObj.withinCity) || 0,
                withinState: parseFloat(ratesObj.withinState) || 0,
                metroToMetro: parseFloat(ratesObj.metroToMetro) || 0,
                restOfIndia: parseFloat(ratesObj.restOfIndia) || 0,
                northEastAndJk: parseFloat(ratesObj.northEastAndJk) || 0,
                codCharges: parseFloat(ratesObj.codCharges) || 35,
                codPercent: parseFloat(ratesObj.codPercent) || 2
              }).catch((err) => console.error(`DB rate save failed for ${cName}:`, err));
            }
          })
        );
      }

      setOverrides(prev => {
        const existingIndex = prev.findIndex(
          item => item.id === (editingRow ? editingRow.id : null) || item.sellerId === sellerIdVal || item.sellerName.toLowerCase().trim() === sellerDisplayName.toLowerCase().trim()
        );

        const newItem = {
          id: existingIndex >= 0 ? prev[existingIndex].id : `ovr-${Date.now()}`,
          sellerId: sellerIdVal,
          sellerName: sellerDisplayName,
          sellerEmail: selectedSeller.email || "",
          courier: "All Couriers (6)",
          service: "Surface & Express",
          overrides: "5 Zones",
          validity: validityStr,
          status: statusModal,
          allRates: finalAllRates
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newItem;
          return updated;
        } else {
          return [newItem, ...prev];
        }
      });

      showToast(`Rate overrides saved for ALL courier partners for ${sellerDisplayName}`, "success");

      setSearch("");
      setCourierFilter("all");
      setStatusFilter("all");

      setAddModalOpen(false);
      setEditingRow(null);
    } catch (err) {
      showToast(err.message || "Failed to save rate override.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSearch("");
    setCourierFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6 font-sans">
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
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Seller Rate Overrides</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Manage special negotiated rates across all courier partners for sellers.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <span>+ Add Rate Override</span>
        </button>
      </div>

      {/* Search & Filters */}
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
            placeholder="Search seller..."
            className="w-full bg-[#0b1120] border border-[#1e293b] focus:border-indigo-500 focus:outline-none rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 transition"
          />
        </div>

        {/* Status Dropdown Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setStatusOpen(!statusOpen); setCourierOpen(false); }}
            className="flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer min-w-[130px]"
          >
            <span>{statusFilter === "all" ? "Status: All" : `Status: ${statusFilter}`}</span>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${statusOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {statusOpen && (
            <div className="absolute left-0 mt-1.5 w-full min-w-[140px] bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-fade-in">
              {["all", "Active", "Inactive"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setStatusFilter(opt); setStatusOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer flex items-center justify-between ${statusFilter === opt ? "bg-indigo-600/10 text-indigo-400 font-bold" : ""}`}
                >
                  <span>{opt === "all" ? "All Statuses" : opt}</span>
                  {statusFilter === opt && <span className="text-indigo-400">✓</span>}
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

      {/* Table - Single Row Per Seller with All Couriers Badge */}
      <div className="border border-[#1e293b] rounded-2xl bg-[#080d1a] relative">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Courier Partners</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Overrides</th>
              <th className="px-4 py-3">Validity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOverrides.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-semibold">
                  No seller rate overrides found.
                </td>
              </tr>
            ) : (
              filteredOverrides.map((row) => (
                <tr key={row.id} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white text-xs">
                      {row.sellerName} {row.sellerEmail ? <span className="text-slate-400 font-normal">({row.sellerEmail})</span> : ""}
                    </div>
                    <div className="text-[9px] text-indigo-400 font-mono mt-0.5">{row.sellerId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-[10.5px]">
                      <span>Configured Couriers ({activeCouriers.length})</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-medium">{row.service || "Surface & Express"}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">{row.overrides || "5 Zones"}</td>
                  <td className="px-4 py-3 text-slate-400">{row.validity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${
                      row.status === "Active"
                        ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
                        : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center relative" ref={actionMenuRow === row.id ? menuRef : null}>
                    <button
                      onClick={() => setActionMenuRow(actionMenuRow === row.id ? null : row.id)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {actionMenuRow === row.id && (
                      <div className="absolute right-2 top-full mt-1 w-44 bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-2xl z-50 py-1.5 text-left select-none">
                        <button
                          onClick={() => { setViewDetailsRow(row); setActionMenuRow(null); }}
                          className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:bg-slate-800/60 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          View Details
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="w-full text-left px-3 py-2 text-[10px] text-indigo-400 hover:bg-indigo-500/10 font-bold flex items-center gap-2 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit Override
                        </button>
                        <button
                          onClick={() => { setDeleteConfirmRow(row); setActionMenuRow(null); }}
                          className="w-full text-left px-3 py-2 text-[10px] text-rose-400 hover:bg-rose-500/10 font-bold flex items-center gap-2 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Delete Override
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

      {/* Delete Confirmation Warning Modal */}
      {deleteConfirmRow && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-5 shadow-2xl space-y-4 text-xs animate-fade-in select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Delete Rate Override?</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-[#0c1324] border border-[#1e293b] rounded-xl text-slate-300">
              <p className="font-semibold text-white">{deleteConfirmRow.sellerName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">All 6 Courier Partner Rate Overrides</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmRow(null)}
                className="flex-1 px-4 py-2 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteOverride(deleteConfirmRow);
                  setDeleteConfirmRow(null);
                }}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-rose-950/40"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal - Shows ALL Courier Partner Rate Cards for Seller */}
      {viewDetailsRow && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#1e293b] pb-3">
              <div>
                <h3 className="text-base font-black text-white">{viewDetailsRow.sellerName}</h3>
                <p className="text-[10px] text-indigo-400 font-mono mt-0.5">
                  {viewDetailsRow.sellerId} • All Courier Partners Negotiated Rates ({activeCouriers.length} Couriers)
                </p>
              </div>
              <button onClick={() => setViewDetailsRow(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
            </div>

            {/* Grid of ALL Courier Partners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {loadingDbMerchantRates ? (
                <div className="col-span-2 py-8 text-center text-slate-400 font-semibold animate-pulse">
                  Loading live seller rate overrides from database...
                </div>
              ) : (
                (dbMerchantRatesPayload && dbMerchantRatesPayload.length > 0
                  ? dbMerchantRatesPayload
                  : COURIER_PARTNERS.map(cName => {
                      const partnerRates = (viewDetailsRow?.allRates && viewDetailsRow.allRates[cName]) || {};
                      return {
                        courier: cName,
                        withinCity: partnerRates.withinCity || 35,
                        withinState: partnerRates.withinState || 42,
                        metroToMetro: partnerRates.metroToMetro || 55,
                        restOfIndia: partnerRates.restOfIndia || 67,
                        northEastAndJk: partnerRates.northEastAndJk || 83,
                        isOverride: true
                      };
                    })
                ).map((item) => {
                  const courierName = item.courier;

                  return (
                    <div key={courierName} className="space-y-2 border border-[#1e293b] rounded-xl p-3 bg-[#0c1324]/60 shadow-sm">
                      <div className="flex justify-between items-center border-b border-[#1e293b]/60 pb-1.5">
                        <span className="font-black text-white text-xs">{courierName}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                          item.isOverride
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-slate-400 bg-slate-800/40 border-slate-700/30"
                        }`}>
                          {item.isOverride ? "CUSTOM OVERRIDE" : "DEFAULT RATE"}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        {[
                          { label: "Zone A (City)", key: "withinCity" },
                          { label: "Zone B (State)", key: "withinState" },
                          { label: "Zone C (Metro)", key: "metroToMetro" },
                          { label: "Zone D (ROI)", key: "restOfIndia" },
                          { label: "Zone E (NE/JK)", key: "northEastAndJk" }
                        ].map((z) => {
                          const defaultVal = COURIER_SERVICE_RATES[courierName]?.Surface?.[z.key] || 45;
                          const rateVal = item[z.key] !== undefined ? item[z.key] : (defaultVal - 5);
                          const savings = (defaultVal - parseFloat(rateVal)).toFixed(1);

                          return (
                            <div key={z.key} className="flex justify-between items-center px-2.5 py-1 rounded-lg bg-[#0b1120] border border-[#1e293b]/40 text-slate-300">
                              <span className="font-bold text-slate-200 text-[10.5px]">{z.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9.5px] text-slate-500 line-through">₹{defaultVal}</span>
                                <span className="font-black text-emerald-400 text-xs">₹{rateVal}</span>
                                {parseFloat(savings) > 0 && (
                                  <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded">
                                    -₹{savings}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 select-none">
              <button
                onClick={() => setViewDetailsRow(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Rate Override Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveOverride} className="w-full max-w-xl bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs overflow-visible">
            <div>
              <h3 className="text-sm font-black text-white">
                {editingRow ? "Edit Rate Override" : "Add Rate Override"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {editingRow ? `Modify negotiated rates for ${editingRow.sellerName}` : "Configure special negotiated pricing rules across all courier partners."}
              </p>
            </div>

            <div className="space-y-3">
              {/* Seller combobox */}
              <div className="space-y-1 relative">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Seller</label>
                <button
                  type="button"
                  onClick={() => setSellerOpen(!sellerOpen)}
                  className="w-full flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <span>
                    {selectedSeller
                      ? `${selectedSeller.companyName || `${selectedSeller.firstName || ''} ${selectedSeller.lastName || ''}`.trim()}${selectedSeller.email ? ` (${selectedSeller.email})` : ''}`
                      : "Select Seller"}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {sellerOpen && (
                  <div className="absolute left-0 mt-1.5 w-full max-h-48 overflow-y-auto bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-45 py-1">
                    {sellers.map((s) => {
                      const nameStr = s.companyName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Seller';
                      const emailStr = s.email ? ` (${s.email})` : '';
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setSelectedSeller(s); setSellerOpen(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer flex flex-col"
                        >
                          <span className="font-bold text-white">{nameStr}</span>
                          {s.email && <span className="text-[10px] text-slate-400 font-mono mt-0.5">{s.email}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Courier Partner Tabs inside Modal */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Courier Partner Settings</label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
                  {COURIER_PARTNERS.map((cName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => setSelectedCourierTab(cName)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                        selectedCourierTab === cName
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-[#0b1120] border border-[#1e293b] text-slate-400 hover:text-white"
                      }`}
                    >
                      {cName.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service selection dropdown */}
              <div className="space-y-1 relative">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Service</label>
                <button
                  type="button"
                  onClick={() => setServiceOpenModal(!serviceOpenModal)}
                  className="w-full flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <span>{selectedService || "Surface"}</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {serviceOpenModal && (
                  <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-45 py-1">
                    {["Surface", "Express", "Air"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setSelectedService(opt); setServiceOpenModal(false); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Rates Override Matrix (Zones A, B, C, D, E) */}
              <div className="space-y-2 border border-[#1e293b]/60 rounded-xl p-3 bg-[#0c1324]/30 max-h-48 overflow-y-auto">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black uppercase text-indigo-400">Rates Matrix Overrides (Zones)</span>
                  <span className="text-[9px] font-bold text-slate-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {COURIER_PARTNERS.includes(selectedCourierTab) ? selectedCourierTab : COURIER_PARTNERS[0]}
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Zone A (City)", key: "withinCity" },
                    { label: "Zone B (State)", key: "withinState" },
                    { label: "Zone C (Metro)", key: "metroToMetro" },
                    { label: "Zone D (ROI)", key: "restOfIndia" },
                    { label: "Zone E (NE/JK)", key: "northEastAndJk" },
                    { label: "COD Flat Charge (₹)", key: "codCharges" },
                    { label: "COD Percentage (%)", key: "codPercent" }
                  ].map((z) => (
                    <div key={z.key} className="flex items-center justify-between gap-4">
                      <span className="font-bold text-white">{z.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[10px]">
                          {z.key === "codCharges" ? "Default: ₹35" : z.key === "codPercent" ? "Default: 2%" : `Default: ₹${defaultRates[z.key]}`}
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          value={customRates[z.key] !== undefined ? customRates[z.key] : (z.key === "codCharges" ? "35" : z.key === "codPercent" ? "2" : "")}
                          onChange={(e) => handleRateInputChange(z.key, e.target.value)}
                          className="w-20 bg-[#0b1120] border border-[#1e293b] text-emerald-400 text-xs rounded-lg px-2 py-1 text-center focus:outline-none font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates Validation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Valid From</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Valid Until (Optional)</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1 relative">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Status</label>
                <button
                  type="button"
                  onClick={() => setStatusOpenModal(!statusOpenModal)}
                  className="w-full flex items-center justify-between gap-2 bg-[#0b1120] border border-[#1e293b] text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <span>{statusModal}</span>
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {statusOpenModal && (
                  <div className="absolute left-0 mt-1.5 w-full bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-45 py-1">
                    {["Active", "Inactive"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setStatusModal(opt); setStatusOpenModal(false); }}
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
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-950/40"
              >
                {isSaving ? "Saving..." : (editingRow ? "Update Override" : "Save Override")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
