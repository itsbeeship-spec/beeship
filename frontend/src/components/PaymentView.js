"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const DATE_PRESETS = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "This Month", "Last Month", "Custom"];
const STATUS_OPTIONS = ["All", "Transferred"];

function formatLabelRange(start, end) {
  if (!start || !end) return "";
  const opt = { day: '2-digit', month: 'short', year: 'numeric' };
  return `${start.toLocaleDateString('en-GB', opt)} - ${end.toLocaleDateString('en-GB', opt)}`;
}

// Local CustomSelect component matching other pages
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
    <div className="relative w-full select-none font-sans" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-705 font-bold bg-white hover:border-slate-350 focus:outline-none transition cursor-pointer text-left shadow-sm"
      >
        <span className={!value || value === "All" ? "text-slate-400 font-bold" : "text-slate-700 font-extrabold capitalize"}>
          {value === "All" ? placeholder : value}
        </span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2 text-xs text-left transition capitalize font-semibold ${
                value === opt ? "bg-slate-50 text-[#25a2fe] font-bold" : "text-slate-600 hover:bg-slate-50/70 hover:text-slate-900"
              }`}
            >
              {opt === "All" ? placeholder : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaymentView() {
  const [payouts, setPayouts] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(65310.70);
  const [nextRemittanceAmount, setNextRemittanceAmount] = useState(27261.10);

  // Filters state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchStatus, setSearchStatus] = useState("All");

  // Date range states
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
  });
  const [endDate, setEndDate] = useState(() => new Date());
  const [dateLabel, setDateLabel] = useState(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    return formatLabelRange(start, today);
  });
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("Last 30 days");
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const dateRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
        setShowCustomPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch payouts data via useQuery
  const { data: payoutsPayload, isLoading: loading } = useQuery({
    queryKey: ["billing", "payouts"],
    queryFn: () => api.get("/billing/payouts"),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (payoutsPayload && payoutsPayload.success && payoutsPayload.data) {
      setPayouts(payoutsPayload.data);
      if (payoutsPayload.totalOutstanding !== undefined) setTotalOutstanding(payoutsPayload.totalOutstanding);
      if (payoutsPayload.nextRemittanceAmount !== undefined) setNextRemittanceAmount(payoutsPayload.nextRemittanceAmount);
    }
  }, [payoutsPayload]);

  // Preset Handlers
  const handlePresetClick = (opt) => {
    if (opt === "Custom") {
      setShowCustomPicker(true);
      const today = new Date();
      setTempStart(startDate || today);
      setTempEnd(endDate || today);
      setCalMonth((startDate || today).getMonth());
      setCalYear((startDate || today).getFullYear());
      return;
    }
    setShowCustomPicker(false);
    const today = new Date();
    let start = today, end = today;
    if (opt === "Today") { start = end = today; }
    else if (opt === "Yesterday") { start = end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1); }
    else if (opt === "Last 7 days") { start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6); end = today; }
    else if (opt === "Last 30 days") { start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29); end = today; }
    else if (opt === "This Month") { start = new Date(today.getFullYear(), today.getMonth(), 1); end = today; }
    else if (opt === "Last Month") { start = new Date(today.getFullYear(), today.getMonth() - 1, 1); end = new Date(today.getFullYear(), today.getMonth(), 0); }
    
    setStartDate(start);
    setEndDate(end);
    setSelectedPreset(opt);
    setDateLabel(formatLabelRange(start, end));
    setDateDropdownOpen(false);
  };

  const handleDateClick = (date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date); setTempEnd(null);
    } else {
      if (date < tempStart) { setTempStart(date); setTempEnd(null); }
      else setTempEnd(date);
    }
  };

  const handleApplyCustom = () => {
    if (tempStart && tempEnd) {
      setStartDate(tempStart);
      setEndDate(tempEnd);
      setDateLabel(formatLabelRange(tempStart, tempEnd));
      setSelectedPreset("Custom");
      setShowCustomPicker(false);
      setDateDropdownOpen(false);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonths = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextMonths = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
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
      <div className="w-[200px] select-none text-[11px] font-sans" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
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
              cellClass += "text-slate-750 hover:bg-slate-50 hover:rounded-full ";
            }

            if (isStart || isEnd) {
              innerClass += "bg-[#25a2fe] text-white font-bold ";
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

  const handleSearchClick = () => {
    setSearchStatus(selectedStatus);
  };

  const handleClearFilters = () => {
    setSelectedStatus("All");
    setSearchStatus("All");
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    setStartDate(start);
    setEndDate(today);
    setDateLabel(formatLabelRange(start, today));
    setSelectedPreset("Last 30 days");
  };

  // Filter payouts
  const filteredPayouts = payouts.filter(p => {
    // 1. Status Filter
    const matchStatus = searchStatus === "All" || p.status.toLowerCase() === searchStatus.toLowerCase() || (searchStatus === "Transferred" && p.status === "Transferred");
    
    // 2. Date Filter
    const pDate = new Date(p.date);
    const startCompare = new Date(startDate);
    startCompare.setHours(0,0,0,0);
    const endCompare = new Date(endDate);
    endCompare.setHours(23,59,59,999);
    const matchDate = pDate >= startCompare && pDate <= endCompare;

    return matchStatus && matchDate;
  });

  return (
    <div className="w-full animate-fadeIn font-sans select-none" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Payments Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track COD collections, remittance cycles, and check payouts history.</p>
        </div>
      </div>

      {/* Expandable filters button */}
      <div className="mb-4">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          <svg className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Filters Card block */}
      {filtersOpen && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-5 shadow-sm flex flex-col md:flex-row items-center gap-4 animate-fadeIn">
          {/* Date Preset Input selection */}
          <div className="relative w-full md:w-64" ref={dateRef}>
            <button
              type="button"
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setShowCustomPicker(false);
              }}
              className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold bg-white hover:border-slate-350 focus:outline-none transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-450" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-700 font-bold">{selectedPreset === "Custom" ? dateLabel : selectedPreset}</span>
              </div>
              <svg className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Date Presets Dropdown */}
            {dateDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden w-full">
                {DATE_PRESETS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handlePresetClick(opt)}
                    className={`w-full flex items-center justify-between px-4 py-2 transition font-semibold text-xs
                      ${selectedPreset === opt ? "text-[#25a2fe] font-extrabold" : "text-slate-700 hover:bg-slate-50"}
                    `}
                  >
                    <span>{opt}</span>
                    {opt === "Custom" && (
                      <svg className="w-3.5 h-3.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Custom Calendar Picker */}
            {showCustomPicker && (
              <div className="absolute left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 z-45 animate-fadeIn min-w-[530px] font-sans">
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

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 text-[11px] font-bold text-slate-600 font-sans">
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
                      className="px-4 py-2 bg-[#25a2fe] hover:bg-[#1f8ce0] text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Select dropdown */}
          <div className="w-full md:w-48">
            <CustomSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Status"
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Action buttons Search & Reset */}
          <div className="flex gap-2 w-full md:w-auto md:ml-auto shrink-0 select-none">
            <button
              onClick={handleSearchClick}
              className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2.5 border border-slate-250 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Highlights Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        
        {/* Total Outstanding Card */}
        <div className="p-4.5 border border-slate-200/80 rounded-2xl bg-white flex flex-col justify-between min-h-[100px] shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-700">Total Outstanding</span>
          </div>
          <div className="self-end text-lg font-extrabold text-slate-900 mt-3 tracking-tight font-sans">
            ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Next Remittance Card */}
        <div className="p-4.5 border border-slate-200/80 rounded-2xl bg-white flex flex-col justify-between min-h-[100px] shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-700">Next Remittance Amount</span>
          </div>
          <div className="self-end text-lg font-extrabold text-slate-900 mt-3 tracking-tight font-sans">
            ₹{nextRemittanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-6.5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4 select-none">Remittance History</h3>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-t-transparent border-[#25a2fe] rounded-full animate-spin" />
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            No remittance payouts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                  <th className="py-4 px-4">Remittance Date</th>
                  <th className="py-4 px-4">Remittance ID</th>
                  <th className="py-4 px-4">Remittance Amount</th>
                  <th className="py-4 px-4">Freight Deductions</th>
                  <th className="py-4 px-4">Paid to Bank</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Payment Ref#</th>
                  <th className="py-4 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold select-none animate-fadeIn">
                {filteredPayouts.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/30 transition">
                    <td className="py-4.5 px-4 font-bold text-slate-750">
                      {new Date(pay.date).toLocaleDateString("en-CA")}
                    </td>
                    <td className="py-4.5 px-4 font-sans font-bold text-slate-800">{pay.payoutId}</td>
                    <td className="py-4.5 px-4 font-bold text-slate-800">
                      ₹{pay.codCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4.5 px-4 text-rose-600 font-bold">
                      ₹{pay.feeCharged.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="py-4.5 px-4 text-emerald-600 font-bold">
                      ₹{pay.netRemitted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-4.5 px-4 font-semibold text-slate-600 font-mono">{pay.paymentRef || "-"}</td>
                    <td className="py-4.5 px-4 text-center">
                      <button 
                        type="button"
                        onClick={() => {
                          alert(`Downloading receipt for Remittance ID: ${pay.payoutId}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 rounded-xl transition cursor-pointer shadow-xs"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
