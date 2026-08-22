"use client";

import { useState, useEffect, useRef } from "react";

/**
 * GlobalFilterPanel - Reusable filter component with orange floating fieldset-like labels.
 * Handles toggle expansion on "Filters" button click, with Search and Clear All actions.
 * 
 * Props:
 * - visibleFields: Array of strings specifying which fields to render, e.g.:
 *   ['dateRange', 'orderNumber', 'channel', 'sku', 'orderType', 'tags', 'search', 'vendor']
 * - values: Current filter values object
 * - onSearchSubmit: Callback when the "Search" button is clicked (receives current values)
 * - onClearAll: Callback when the "Clear All" button is clicked
 */
export default function GlobalFilterPanel({ 
  visibleFields = ['dateRange', 'orderNumber', 'channel', 'sku', 'orderType', 'tags', 'search', 'vendor'],
  values = {},
  onSearchSubmit,
  onClearAll
}) {
  const initialValues = {
    dateRange: "Last 30 days",
    orderNumber: "",
    channel: "",
    sku: "",
    orderType: "",
    tags: "",
    search: "",
    vendor: "",
    ...values
  };

  const [isOpen, setIsOpen] = useState(false);
  const [localValues, setLocalValues] = useState(initialValues);

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const dateRef = useRef(null);
  const typeRef = useRef(null);

  // Custom calendar picker states
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const lastSearchedValuesRef = useRef(initialValues);

  // Sync parent updates
  useEffect(() => {
    setLocalValues(prev => ({ ...prev, ...values }));
    lastSearchedValuesRef.current = { ...lastSearchedValuesRef.current, ...values };
  }, [values]);

  // Debounced/immediate automatic filter search submission
  useEffect(() => {
    const changed = Object.keys(localValues).some(
      key => localValues[key] !== lastSearchedValuesRef.current[key]
    );
    if (!changed) return;

    const textFields = ["orderNumber", "sku", "tags", "search"];
    const dropdownFields = ["dateRange", "channel", "orderType", "vendor"];

    const changedTextField = textFields.some(
      field => localValues[field] !== lastSearchedValuesRef.current[field]
    );
    const changedDropdownField = dropdownFields.some(
      field => localValues[field] !== lastSearchedValuesRef.current[field]
    );

    if (changedDropdownField && !changedTextField) {
      // Trigger search immediately for dropdown changes
      lastSearchedValuesRef.current = { ...localValues };
      if (onSearchSubmit) {
        onSearchSubmit(localValues);
      }
      return;
    }

    // Trigger search with a 400ms debounce for text changes
    const timer = setTimeout(() => {
      lastSearchedValuesRef.current = { ...localValues };
      if (onSearchSubmit) {
        onSearchSubmit(localValues);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localValues, onSearchSubmit]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
        setShowCustomPicker(false);
      }
      if (typeRef.current && !typeRef.current.contains(e.target)) {
        setTypeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateField = (field, val) => {
    setLocalValues(prev => ({ ...prev, [field]: val }));
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
      updateField('dateRange', label);
      setShowCustomPicker(false);
    } else {
      alert("Please select both a start and an end date.");
    }
  };

  const handleSelectDatePreset = (opt) => {
    if (opt === "Custom") {
      setTempStart(startDate || new Date());
      setTempEnd(endDate || new Date());
      setCalMonth((startDate || new Date()).getMonth());
      setCalYear((startDate || new Date()).getFullYear());
      setShowCustomPicker(true);
      setDateDropdownOpen(false);
    } else {
      updateField('dateRange', opt);
      setDateDropdownOpen(false);
      setShowCustomPicker(false);
    }
  };

  // Calendar cell renderer grid
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
      <div className="w-[240px] select-none text-[11px]">
        <h4 className="text-center font-bold text-slate-800 text-xs mb-2">
          {monthNames[month]} {year}
        </h4>
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[10px] mb-1">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
          {dayCells.map((cell, idx) => {
            const timeVal = cell.date.getTime();
            const startVal = tempStart ? tempStart.getTime() : null;
            const endVal = tempEnd ? tempEnd.getTime() : null;
            const isStart = startVal && timeVal === startVal;
            const isEnd = endVal && timeVal === endVal;
            const inRange = startVal && endVal && timeVal > startVal && timeVal < endVal;

            let cellClass = "py-1.5 cursor-pointer font-medium transition-all relative flex items-center justify-center ";
            let innerClass = "w-6 h-6 flex items-center justify-center rounded-lg ";

            if (!cell.isCurrentMonth) {
              cellClass += "text-slate-300 pointer-events-none ";
            } else {
              cellClass += "text-slate-700 hover:bg-slate-50 hover:rounded-lg ";
            }

            if (isStart || isEnd) {
              innerClass += "bg-[#013c9c] text-white font-extrabold ";
              cellClass += "z-10 ";
            } else if (inRange) {
              cellClass += "bg-blue-50/70 text-slate-800 ";
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

  const handleSearchSubmit = () => {
    lastSearchedValuesRef.current = { ...localValues };
    if (onSearchSubmit) {
      onSearchSubmit(localValues);
    }
  };

  const handleClearAll = () => {
    const cleared = {
      dateRange: "Last 30 days",
      orderNumber: "",
      channel: "",
      sku: "",
      orderType: "",
      tags: "",
      search: "",
      vendor: ""
    };
    setLocalValues(cleared);
    lastSearchedValuesRef.current = cleared;
    if (onClearAll) {
      onClearAll(cleared);
    }
  };

  const showField = (fieldName) => visibleFields.includes(fieldName);

  return (
    <div className="w-full flex flex-col gap-4 select-none font-sans">
      
      {/* Filters Button Trigger */}
      <div className="flex">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Filter Panel Card */}
      {isOpen && (
        <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col gap-5 animate-slideDown">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            
            {/* 1. Date Range Dropdown with Floating Orange Label */}
            {showField('dateRange') && (
              <div className="relative" ref={dateRef}>
                <div className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-[#f97316] font-bold tracking-wide">
                  Date Range
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDateDropdownOpen(!dateDropdownOpen);
                    setShowCustomPicker(false);
                  }}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold text-left flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{localValues.dateRange || "Select date range"}</span>
                  </div>
                  <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dateDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 animate-slideUp text-xs font-semibold text-slate-700">
                    {["Today", "Yesterday", "Last 7 days", "Last 30 days", "Custom"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectDatePreset(opt)}
                        className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition cursor-pointer ${opt === "Custom" ? "text-[#013c9c] border-t border-slate-100 font-bold" : ""}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Date Picker Card Overlay */}
                {showCustomPicker && (
                  <div className="absolute left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-40 animate-fadeIn min-w-[530px]">
                    <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-4">
                      Select custom range
                    </h3>
                    <div className="relative flex items-start gap-4">
                      <button 
                        type="button"
                        onClick={handlePrevMonths}
                        className="absolute left-0 top-0.5 p-1 rounded-lg border border-slate-150 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer z-10"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
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
                        className="absolute right-0 top-0.5 p-1 rounded-lg border border-slate-150 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer z-10"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 text-[10px]">
                      <span className="text-slate-600 font-bold">
                        {tempStart ? formatDate(tempStart) : "--/--/----"} to {tempEnd ? formatDate(tempEnd) : "--/--/----"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCustomPicker(false)}
                          className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyCustom}
                          className="px-3.5 py-1.5 bg-[#013c9c] hover:bg-[#002f80] text-white rounded-lg font-bold transition shadow-sm cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Order Number Text Input */}
            {showField('orderNumber') && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Order Number"
                  value={localValues.orderNumber}
                  onChange={(e) => updateField('orderNumber', e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            )}

            {/* 3. Sale Channel Dropdown select */}
            {showField('channel') && (
              <div className="relative">
                <select
                  value={localValues.channel}
                  onChange={(e) => updateField('channel', e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition appearance-none cursor-pointer placeholder:text-slate-400"
                >
                  <option value="" disabled hidden>Sale Channel</option>
                  <option value="all">All Channels</option>
                  <option value="shopify">Shopify</option>
                  <option value="manual">Manual</option>
                </select>
                <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

            {/* 4. Product/SKU Text Input */}
            {showField('sku') && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Product/SKU"
                  value={localValues.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-355 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            )}

            {/* 5. Order Type Select Dropdown with Floating Orange Label */}
            {showField('orderType') && (
              <div className="relative" ref={typeRef}>
                <div className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-[#f97316] font-bold tracking-wide">
                  Order Type
                </div>
                <button
                  type="button"
                  onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold text-left flex items-center justify-between transition cursor-pointer"
                >
                  <span>{localValues.orderType || "Select order type"}</span>
                  <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {typeDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 animate-slideUp text-xs font-semibold text-slate-700">
                    {["Cash on Delivery", "Prepaid", "Reverse"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { updateField('orderType', opt); setTypeDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. Select Tag(s) Input */}
            {showField('tags') && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Select Tag(s)"
                  value={localValues.tags}
                  onChange={(e) => updateField('tags', e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            )}

            {/* 7. Name or Phone... Search Input */}
            {showField('search') && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name or Phone..."
                  value={localValues.search}
                  onChange={(e) => updateField('search', e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            )}

            {/* 8. Select Vendor Dropdown select */}
            {showField('vendor') && (
              <div className="relative">
                <select
                  value={localValues.vendor}
                  onChange={(e) => updateField('vendor', e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition appearance-none cursor-pointer placeholder:text-slate-400"
                >
                  <option value="" disabled hidden>Select Vendor</option>
                  <option value="all">All Vendors</option>
                  <option value="vendor_a">Vendor A</option>
                  <option value="vendor_b">Vendor B</option>
                </select>
                <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

          </div>

          {/* Action Row: Search and Clear All Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1b2438] text-white hover:bg-slate-900 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
