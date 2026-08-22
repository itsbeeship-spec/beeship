"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

// Local CustomSelect component to support rounded dropdown list menus
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
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold bg-white hover:border-[#017cf8] focus:outline-none focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] transition cursor-pointer text-left"
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

export default function ShipmentFilterPanel({ onSearch, onClear }) {
  const [isOpen, setIsOpen] = useState(false); // Default closed
  const [filters, setFilters] = useState({
    dateRange: "Last 30 days",
    orderNumber: "",
    channel: "",
    productSku: "",
    courier: "",
    awbNumber: "",
    orderType: "",
    warehouse: "",
    emailPhone: "",
    tags: "",
    vendor: ""
  });

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const dateRef = useRef(null);

  // Custom calendar picker states
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [warehouses, setWarehouses] = useState([]);
  const lastSearchedFiltersRef = useRef(filters);

  // Debounced/immediate automatic filter search submission for Shipments
  useEffect(() => {
    const changed = Object.keys(filters).some(
      key => filters[key] !== lastSearchedFiltersRef.current[key]
    );
    if (!changed) return;

    const textFields = ["orderNumber", "productSku", "awbNumber", "emailPhone", "tags"];
    const dropdownFields = ["dateRange", "channel", "courier", "orderType", "warehouse", "vendor"];

    const changedTextField = textFields.some(
      field => filters[field] !== lastSearchedFiltersRef.current[field]
    );
    const changedDropdownField = dropdownFields.some(
      field => filters[field] !== lastSearchedFiltersRef.current[field]
    );

    if (changedDropdownField && !changedTextField) {
      // Trigger search immediately for dropdown changes
      lastSearchedFiltersRef.current = { ...filters };
      onSearch(filters);
      return;
    }

    // Trigger search with a 400ms debounce for text changes
    const timer = setTimeout(() => {
      lastSearchedFiltersRef.current = { ...filters };
      onSearch(filters);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters, onSearch]);

  // Fetch warehouse list from shared React Query cache
  const { data: warehouseQueryData } = useQuery({
    queryKey: ["warehouse"],
    queryFn: () => api.get("/warehouse").then(res => res.data || []),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (warehouseQueryData) {
      setWarehouses(warehouseQueryData.map(w => w.name));
    }
  }, [warehouseQueryData]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    lastSearchedFiltersRef.current = { ...filters };
    onSearch(filters);
  };

  const handleClearAll = () => {
    const cleared = {
      dateRange: "Last 30 days",
      orderNumber: "",
      channel: "",
      productSku: "",
      courier: "",
      awbNumber: "",
      orderType: "",
      warehouse: "",
      emailPhone: "",
      tags: "",
      vendor: ""
    };
    setFilters(cleared);
    lastSearchedFiltersRef.current = cleared;
    setTempStart(null);
    setTempEnd(null);
    setStartDate(null);
    setEndDate(null);
    onClear(cleared);
  };

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
      handleInputChange("dateRange", label);
      setShowCustomPicker(false);
      
      const updatedFilters = { ...filters, dateRange: label };
      onSearch(updatedFilters);
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
      handleInputChange("dateRange", opt);
      setDateDropdownOpen(false);
      setShowCustomPicker(false);
      const updatedFilters = { ...filters, dateRange: opt };
      onSearch(updatedFilters);
    }
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

  return (
    <div className="w-full font-sans mb-6 relative">
      {/* Header Row of Filter Panel */}
      <div className="flex justify-between items-center mb-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition cursor-pointer"
        >
          {/* Funnel Filter Icon */}
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Options Grid */}
      {isOpen && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mt-3 shadow-sm animate-fadeIn">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Range Selector */}
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
                    <span>{filters.dateRange}</span>
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

                {/* Custom Date Picker Overlay matching screenshot */}
                {showCustomPicker && (
                  <div className="absolute left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 z-40 animate-fadeIn min-w-[530px] font-sans">
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

              {/* Order Number Input */}
              <input
                type="text"
                placeholder="Order Number"
                value={filters.orderNumber}
                onChange={(e) => handleInputChange("orderNumber", e.target.value)}
                className="w-full border border-slate-200 focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
              />

              {/* Sales Channel Custom Selector */}
              <CustomSelect
                value={filters.channel}
                placeholder="Sales Channel"
                options={["Manual", "Shopify"]}
                onChange={(val) => handleInputChange("channel", val)}
              />

              {/* Product/SKU Input */}
              <input
                type="text"
                placeholder="Product/SKU"
                value={filters.productSku}
                onChange={(e) => handleInputChange("productSku", e.target.value)}
                className="w-full border border-slate-200 focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Select Courier Custom Selector */}
              <CustomSelect
                value={filters.courier}
                placeholder="Select Courier"
                options={["Delhivery", "BlueDart", "Xpressbees"]}
                onChange={(val) => handleInputChange("courier", val)}
              />

              {/* AWB Number */}
              <input
                type="text"
                placeholder="AWB Number(s)"
                value={filters.awbNumber}
                onChange={(e) => handleInputChange("awbNumber", e.target.value)}
                className="w-full border border-slate-200 focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
              />

              {/* Order Type Custom Selector */}
              <CustomSelect
                value={filters.orderType}
                placeholder="Order Type"
                options={["COD", "Prepaid"]}
                onChange={(val) => handleInputChange("orderType", val)}
              />

              {/* Select Warehouse Custom Selector */}
              <CustomSelect
                value={filters.warehouse}
                placeholder="Select Warehouse"
                options={warehouses.length > 0 ? warehouses : ["Primary Warehouse"]}
                onChange={(val) => handleInputChange("warehouse", val)}
              />
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Email/Phone */}
              <input
                type="text"
                placeholder="Email/Phone"
                value={filters.emailPhone}
                onChange={(e) => handleInputChange("emailPhone", e.target.value)}
                className="w-full border border-slate-200 focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
              />

              {/* Select Tags */}
              <input
                type="text"
                placeholder="Select Tag(s)"
                value={filters.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                className="w-full border border-slate-200 focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
              />

              {/* Select Vendor Custom Selector */}
              <CustomSelect
                value={filters.vendor}
                placeholder="Select Vendor"
                options={["Delhivery", "BlueDart", "Xpressbees"]}
                onChange={(val) => handleInputChange("vendor", val)}
              />

              {/* Actions: Search & Clear All */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-[#017cf8] hover:bg-[#0062c7] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
