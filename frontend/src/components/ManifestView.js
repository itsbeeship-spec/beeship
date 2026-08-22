"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";

// CustomSelect for Manifest filters
function CustomSelect({ value, onChange, placeholder, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full select-none" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold bg-white hover:border-slate-350 focus:outline-none transition cursor-pointer text-left"
      >
        <span className={!value ? "text-slate-400 font-medium" : "text-slate-700 font-semibold"}>
          {value || placeholder}
        </span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-xl shadow-xl py-1.5 z-30 animate-slideUp text-xs font-semibold text-slate-700 max-h-56 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-50 transition text-slate-400 font-medium"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 transition cursor-pointer"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManifestView() {
  const [manifests, setManifests] = useState([]);
  const [filteredManifests, setFilteredManifests] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [activeTab, setActiveTab] = useState("Open Manifests"); // Open Manifests, Dispatched Manifests
  const [selectedManifest, setSelectedManifest] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  // Date Picker States
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({ dateRange: "" });
  const dateRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
        setShowCustomPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filters State
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    courier: "",
    warehouse: "",
    manifestId: "",
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch manifests via useQuery
  const { data: rawOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", { status: "booked", limit: 100 }],
    queryFn: () => api.get("/orders?status=booked&limit=100").then(res => res.data || []),
    staleTime: 10 * 1000,
  });

  const { data: warehouseData } = useQuery({
    queryKey: ["warehouse"],
    queryFn: () => api.get("/warehouse").then(res => res.data || []),
    staleTime: 60 * 1000,
  });

  const loading = ordersLoading;

  useEffect(() => {
    if (warehouseData) {
      setWarehouses(warehouseData.map(w => w.name));
    }
  }, [warehouseData]);

  useEffect(() => {
    if (rawOrders) {
      const shippedOrders = rawOrders.filter(o => o.awbNumber);
      
      const groups = {};
      shippedOrders.forEach(order => {
        const dateStr = new Date(order.createdAt).toLocaleDateString();
        const vendor = order.vendor || "Delhivery Surface";
        const wh = order.pickupWarehouse || "Primary Warehouse";
        
        const key = `${dateStr}_${vendor}_${wh}`;
        if (!groups[key]) {
          const prefix = vendor.split(" ")[0].toUpperCase();
          const dateHash = dateStr.replace(/\//g, "");
          const groupIndex = Object.keys(groups).length + 1;
          const manifestId = `BG-${prefix}-${dateHash}${groupIndex > 1 ? `-${groupIndex}` : ""}`;
          
          groups[key] = {
            id: manifestId,
            created: dateStr,
            courier: vendor,
            count: 0,
            status: "open",
            warehouse: wh,
            pickupRef: order.pincode || "814032",
            orders: []
          };
        }
        groups[key].count += 1;
        groups[key].orders.push(order);
      });

      const list = Object.values(groups);
      setManifests(list);
      setFilteredManifests(list);
    }
  }, [rawOrders]);

  // Calendar Helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonths = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonths = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const handleDateClick = (date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else {
      if (date < tempStart) {
        setTempStart(date);
        setTempEnd(null);
      } else {
        setTempEnd(date);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  };

  const handleApplyCustom = () => {
    if (tempStart && tempEnd) {
      setStartDate(tempStart);
      setEndDate(tempEnd);
      const label = `${formatDate(tempStart)} - ${formatDate(tempEnd)}`;
      setFilterValues(prev => ({ ...prev, dateRange: label }));
      setShowCustomPicker(false);
      
      const updatedFilters = { ...filterValues, dateRange: label };
      triggerSearch(updatedFilters);
    } else {
      alert("Please select both a start and an end date.");
    }
  };

  const handleSelectDatePreset = (opt) => {
    if (opt === "Custom") {
      const today = new Date();
      setTempStart(startDate || today);
      setTempEnd(endDate || today);
      setCalMonth((startDate || today).getMonth());
      setCalYear((startDate || today).getFullYear());
      setShowCustomPicker(true);
      setDateDropdownOpen(false);
    } else {
      setFilterValues(prev => ({ ...prev, dateRange: opt }));
      setDateDropdownOpen(false);
      setShowCustomPicker(false);
      const updatedFilters = { ...filterValues, dateRange: opt };
      triggerSearch(updatedFilters);
    }
  };

  const triggerSearch = (filters) => {
    let result = [...manifests];

    if (filters.warehouse) {
      result = result.filter(m => m.warehouse.toLowerCase().includes(filters.warehouse.toLowerCase()));
    }
    if (filters.status) {
      result = result.filter(m => m.status === filters.status.toLowerCase());
    }
    if (filters.courier) {
      result = result.filter(m => m.courier.toLowerCase().includes(filters.courier.toLowerCase()));
    }

    if (filters.dateRange && filters.dateRange !== "All Time") {
      const today = new Date();
      const cutoff = new Date();
      if (filters.dateRange === "Today") {
        cutoff.setHours(0,0,0,0);
      } else if (filters.dateRange === "Yesterday") {
        cutoff.setDate(today.getDate() - 1);
        cutoff.setHours(0,0,0,0);
      } else if (filters.dateRange === "Last 7 days") {
        cutoff.setDate(today.getDate() - 7);
      } else if (filters.dateRange === "Last 30 days") {
        cutoff.setDate(today.getDate() - 30);
      } else if (filters.dateRange.includes("-")) {
        const [startStr, endStr] = filters.dateRange.split(" - ");
        const start = new Date(startStr);
        const end = new Date(endStr);
        end.setHours(23,59,59,999);
        result = result.filter(m => {
          const mDate = new Date(m.created);
          return mDate >= start && mDate <= end;
        });
        setFilteredManifests(result);
        setCurrentPage(1);
        return;
      }
      result = result.filter(m => new Date(m.created) >= cutoff);
    }

    setFilteredManifests(result);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    triggerSearch(filterValues);
  };

  const handleClearAll = () => {
    const cleared = { dateRange: "Last 30 days", warehouse: "", status: "", courier: "" };
    setFilterValues(cleared);
    setTempStart(null);
    setTempEnd(null);
    setStartDate(null);
    setEndDate(null);
    setFilteredManifests(manifests);
    setCurrentPage(1);
  };

  // Escalate handover issue action
  const handleEscalate = (id, courier) => {
    showToast(`Handover issue escalated successfully for Manifest ${id} to ${courier}!`, "warning");
  };

  // CSV download function for specific Manifest
  const handleDownloadManifest = (id, courier, count) => {
    const headers = ["Manifest ID", "Order ID", "Product", "AWB Number", "Courier Partner", "Customer", "Handover Time"];
    const rows = Array.from({ length: count }).map((_, idx) => [
      id,
      `ORD-99${String(idx).padStart(2, '0')}`,
      "Mechanical Keyboard",
      `AWB-2019${String(100 + idx)}`,
      courier,
      `Customer Name ${idx + 1}`,
      new Date().toLocaleDateString()
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Beeship_Manifest_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Manifest ${id} downloaded successfully!`);
  };

  const renderCalendarGrid = (year, month) => {
    const totalDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const totalDaysPrev = getDaysInMonth(prevYear, prevMonth);

    const dayCells = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = totalDaysPrev - i;
      dayCells.push({ day, date: new Date(prevYear, prevMonth, day), isCurrentMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      dayCells.push({ day: i, date: new Date(year, month, i), isCurrentMonth: true });
    }
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    let nextDay = 1;
    while (dayCells.length < 42) {
      dayCells.push({ day: nextDay, date: new Date(nextYear, nextMonth, nextDay), isCurrentMonth: false });
      nextDay++;
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return (
      <div className="w-[240px] select-none text-[11px] font-sans">
        <h4 className="text-center font-bold text-slate-800 text-xs mb-3">
          {monthNames[month]} {year}
        </h4>
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[10px] mb-2">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        <div className="grid grid-cols-7 gap-y-1.5 gap-x-0.5 text-center">
          {dayCells.map((cell, idx) => {
            const timeVal = cell.date.getTime();
            const startVal = tempStart ? new Date(tempStart.getFullYear(), tempStart.getMonth(), tempStart.getDate()).getTime() : null;
            const endVal = tempEnd ? new Date(tempEnd.getFullYear(), tempEnd.getMonth(), tempEnd.getDate()).getTime() : null;
            const currentVal = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate()).getTime();
            
            const isStart = startVal && currentVal === startVal;
            const isEnd = endVal && currentVal === endVal;
            const inRange = startVal && endVal && currentVal > startVal && currentVal < endVal;

            let cellClass = "py-1 cursor-pointer font-semibold transition-all relative flex items-center justify-center ";
            let innerClass = "w-6 h-6 flex items-center justify-center rounded-full ";

            if (!cell.isCurrentMonth) {
              cellClass += "text-slate-350 pointer-events-none ";
            } else {
              cellClass += "text-slate-700 hover:bg-slate-50 hover:rounded-full ";
            }

            if (isStart || isEnd) {
              innerClass += "bg-[#017cf8] text-white font-bold ";
              cellClass += "z-10 ";
            } else if (inRange) {
              cellClass += "bg-blue-50/70 text-slate-855 ";
              innerClass += "rounded-none ";
            }

            return (
              <div 
                key={idx} 
                onClick={() => cell.isCurrentMonth && handleDateClick(cell.date)}
                className={`${cellClass}`}
              >
                <span className={innerClass}>
                  {cell.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Pagination calculation
  const totalEntries = filteredManifests.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const currentEntries = filteredManifests.slice(startIndex, endIndex);

  return (
    <div className="w-full select-none animate-fadeIn font-sans pb-10">
      {/* Toast popup */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border animate-slideDown text-xs font-semibold ${
          toast.type === "warning" ? "bg-amber-50 border-amber-100 text-amber-700" :
          "bg-emerald-50 border-emerald-100 text-emerald-700"
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          {toast.message}
        </div>
      )}

      {/* Back to Shipment breadcrumb */}
      <div className="mb-4">
        <Link 
          href="/shipments" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#017cf8] transition cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Shipment</span>
        </Link>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-slate-800 mb-6">Manifest</h2>

      {/* Filters Toggle Button (Standalone) */}
      <div className="w-full mb-6 relative">
        <div className="flex justify-between items-center mb-1">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Dynamic Filters Form - Exactly matching user screenshot */}
        {filtersOpen && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 mt-3 shadow-sm animate-fadeIn">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Date Range Input Selector */}
                <div className="relative" ref={dateRef}>
                  <div className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-orange-500 font-bold uppercase tracking-wider z-10">
                    Date Range
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDateDropdownOpen(!dateDropdownOpen);
                      setShowCustomPicker(false);
                    }}
                    className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold bg-white hover:border-[#017cf8] focus:outline-none focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{filterValues.dateRange}</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dateDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-xl shadow-xl py-2 z-30 animate-slideUp">
                      {["Today", "Yesterday", "Last 7 days", "Last 30 days", "Custom"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSelectDatePreset(preset)}
                          className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer ${preset === "Custom" ? "text-[#017cf8] border-t border-slate-100 font-bold" : ""}`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Double Month Custom Date Calendar Overlay */}
                  {showCustomPicker && (
                    <div className="absolute left-0 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 z-40 animate-fadeIn min-w-[530px] font-sans">
                      <h3 className="text-slate-550 font-bold text-[10px] uppercase tracking-wider mb-4">
                        SELECT CUSTOM RANGE
                      </h3>
                      <div className="relative flex items-start gap-4">
                        <button 
                          type="button"
                          onClick={handlePrevMonths}
                          className="absolute left-0 top-0.5 p-1 rounded-full border border-slate-150 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer z-10"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className="pl-6">
                          {renderCalendarGrid(calYear, calMonth)}
                        </div>
                        <div>
                          {renderCalendarGrid(calMonth === 11 ? calYear + 1 : calYear, calMonth === 11 ? 0 : calMonth + 1)}
                        </div>

                        <button 
                          type="button"
                          onClick={handleNextMonths}
                          className="absolute right-0 top-0.5 p-1 rounded-full border border-slate-150 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer z-10"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 text-[11px] font-bold text-slate-650">
                        <span>
                          {tempStart ? formatDate(tempStart) : "--/--/----"} to {tempEnd ? formatDate(tempEnd) : "--/--/----"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCustomPicker(false)}
                            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyCustom}
                            className="px-4 py-2 bg-[#017cf8] hover:bg-[#0062c7] text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Warehouse Name Select */}
                <CustomSelect
                  value={filterValues.warehouse}
                  placeholder="Warehouse Name"
                  options={warehouses.length > 0 ? warehouses : ["Primary Warehouse"]}
                  onChange={(val) => setFilterValues(prev => ({ ...prev, warehouse: val }))}
                />

                {/* 3. Status Select */}
                <CustomSelect
                  value={filterValues.status}
                  placeholder="Status"
                  options={["Open", "Closed"]}
                  onChange={(val) => setFilterValues(prev => ({ ...prev, status: val }))}
                />

                {/* 4. Select Courier Select */}
                <CustomSelect
                  value={filterValues.courier}
                  placeholder="Select Courier"
                  options={["Bluedart Surface (N)", "Delhivery Surface (DS)", "Xpressbees Surface"]}
                  onChange={(val) => setFilterValues(prev => ({ ...prev, courier: val }))}
                />
              </div>

              {/* Row 2 Actions: Right Aligned */}
              <div className="flex items-center justify-end gap-3 mt-1">
                <button
                  type="submit"
                  className="px-5 py-2 inline-flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer bg-white"
                >
                  Clear All
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Manifests Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden mb-6">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#017cf8] rounded-full animate-spin"></div>
            <p className="text-xs text-slate-450 font-semibold">Loading manifests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                  <th className="py-4 px-6">Manifest ID</th>
                  <th className="py-4 px-4">Created</th>
                  <th className="py-4 px-4">Courier</th>
                  <th className="py-4 px-4 text-center">Number of Orders</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4">Warehouse</th>
                  <th className="py-4 px-4">Pickup Ref. No.</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentEntries.length > 0 ? (
                  currentEntries.map((m, idx) => (
                    <tr key={`${m.id}-${idx}`} className="hover:bg-slate-50/45 transition">
                      <td className="py-4.5 px-6 font-mono font-bold text-slate-800">{m.id}</td>
                      <td className="py-4.5 px-4 font-medium text-slate-500">{m.created}</td>
                      <td className="py-4.5 px-4 font-semibold text-slate-700">{m.courier}</td>
                      <td className="py-4.5 px-4 text-center font-mono font-bold text-slate-650">{m.count}</td>
                      <td className="py-4.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          m.status === "open" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                          "bg-slate-100 border-slate-200 text-slate-500"
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-4 font-semibold text-slate-600">{m.warehouse}</td>
                      <td className="py-4.5 px-4 font-mono font-bold text-slate-500">{m.pickupRef}</td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          <button
                            onClick={() => handleEscalate(m.id, m.courier)}
                            className="px-2.5 py-1 border border-red-100 bg-red-50/40 hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-200 text-[10px] font-bold rounded-lg transition shadow-xs cursor-pointer"
                          >
                            Escalate
                          </button>
                          
                          <button
                            onClick={() => handleDownloadManifest(m.id, m.courier, m.count)}
                            className="p-1 hover:bg-slate-50 text-slate-500 hover:text-[#017cf8] rounded transition cursor-pointer"
                            title="Print / Download Manifest"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400 font-semibold text-xs">
                      No manifests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        {/* Info label */}
        <div className="text-xs font-semibold text-slate-450">
          Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
        </div>

        {/* Prev / Next Pagination page numbers */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              &lt; Previous
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pNum = idx + 1;
              const isActive = currentPage === pNum;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    isActive 
                      ? "bg-[#017cf8] text-white shadow-sm" 
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              Next &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
