"use client";

import { useState, useEffect, useRef } from "react";

export default function DateFilter({ onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("Last 7 days");
  
  // Date states
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());

  // Temp states for custom picker selection
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);

  // Month navigation for custom calendar (Left calendar month/year)
  const [calMonth, setCalMonth] = useState(5); // June (0-indexed: 5)
  const [calYear, setCalYear] = useState(2026);

  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Preset Options
  const presets = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "7days" },
    { label: "Last 30 days", value: "30days" },
    { label: "This Month", value: "this_month" },
    { label: "Last Month", value: "last_month" },
    { label: "Custom", value: "custom" }
  ];

  const handleSelectPreset = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset.value) {
      case "today":
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        break;
      case "yesterday":
        start.setDate(today.getDate() - 1);
        start.setHours(0,0,0,0);
        end.setDate(today.getDate() - 1);
        end.setHours(23,59,59,999);
        break;
      case "7days":
        start.setDate(today.getDate() - 7);
        break;
      case "30days":
        start.setDate(today.getDate() - 30);
        break;
      case "this_month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "last_month":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "custom":
        setTempStart(startDate);
        setTempEnd(endDate);
        // Initialize calendar view to start date's month
        setCalMonth(startDate.getMonth());
        setCalYear(startDate.getFullYear());
        setShowCustomPicker(true);
        return;
      default:
        break;
    }

    if (preset.value !== "custom") {
      setStartDate(start);
      setEndDate(end);
      setSelectedLabel(preset.label);
      setIsOpen(false);
      if (onChange) {
        onChange({ startDate: start, endDate: end, label: preset.label });
      }
    }
  };

  // Helper: Format Date as MM/DD/YYYY
  const formatDate = (date) => {
    if (!date) return "";
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  };

  // Helper: Format Date label
  const getDisplayLabel = () => {
    if (selectedLabel === "Custom") {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return selectedLabel;
  };

  // Calendar Helper functions
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

  const handleApplyCustom = () => {
    if (tempStart && tempEnd) {
      setStartDate(tempStart);
      setEndDate(tempEnd);
      setSelectedLabel("Custom");
      setShowCustomPicker(false);
      setIsOpen(false);
      if (onChange) {
        onChange({ startDate: tempStart, endDate: tempEnd, label: "Custom" });
      }
    } else {
      alert("Please select both a start and an end date.");
    }
  };

  const handleCancelCustom = () => {
    setShowCustomPicker(false);
  };

  // Render month calendar grid
  const renderCalendarGrid = (year, month) => {
    const totalDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Get days of previous month to fill header padding
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const totalDaysPrev = getDaysInMonth(prevYear, prevMonth);

    const dayCells = [];

    // Muted days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = totalDaysPrev - i;
      dayCells.push({
        day,
        date: new Date(prevYear, prevMonth, day),
        isCurrentMonth: false
      });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      dayCells.push({
        day: i,
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Muted days from next month to pad end of grid (6 rows * 7 days = 42 cells)
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    let nextDay = 1;
    while (dayCells.length < 42) {
      dayCells.push({
        day: nextDay,
        date: new Date(nextYear, nextMonth, nextDay),
        isCurrentMonth: false
      });
      nextDay++;
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return (
      <div className="w-[280px] select-none">
        <h4 className="text-center font-bold text-slate-800 text-sm mb-3">
          {monthNames[month]} {year}
        </h4>
        
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-xs mb-2">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center text-xs">
          {dayCells.map((cell, idx) => {
            const timeVal = cell.date.getTime();
            const startVal = tempStart ? tempStart.getTime() : null;
            const endVal = tempEnd ? tempEnd.getTime() : null;

            const isStart = startVal && timeVal === startVal;
            const isEnd = endVal && timeVal === endVal;
            const inRange = startVal && endVal && timeVal > startVal && timeVal < endVal;

            let cellClass = "py-2 cursor-pointer font-medium transition-all relative flex items-center justify-center ";
            let innerClass = "w-7 h-7 flex items-center justify-center rounded-lg ";

            if (!cell.isCurrentMonth) {
              cellClass += "text-slate-300 pointer-events-none ";
            } else {
              cellClass += "text-slate-700 hover:bg-slate-50 hover:rounded-lg ";
            }

            if (isStart || isEnd) {
              innerClass += "bg-[#0f172a] text-white font-extrabold ";
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

  // Get right calendar month/year values
  const nextCalMonth = calMonth === 11 ? 0 : calMonth + 1;
  const nextCalYear = calMonth === 11 ? calYear + 1 : calYear;

  return (
    <div className="relative font-sans text-xs" ref={containerRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-slate-200/80 shadow-sm rounded-xl px-4 py-2 flex items-center gap-2 cursor-pointer text-slate-700 hover:bg-slate-50 transition font-bold select-none text-xs"
      >
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{getDisplayLabel()}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Preset List Dropdown */}
      {isOpen && !showCustomPicker && (
        <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-150 rounded-xl shadow-xl z-30 py-1.5 animate-fadeIn">
          {presets.map((preset) => {
            const isSelected = selectedLabel === preset.label;
            return (
              <button
                key={preset.value}
                onClick={() => handleSelectPreset(preset)}
                className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? "bg-slate-50 text-blue-600 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                } ${preset.value === "custom" ? "text-[#2b7fff] border-t border-slate-100 mt-1 pt-2 font-bold" : ""}`}
              >
                <span>{preset.label}</span>
                {isSelected && preset.value !== "custom" && (
                  <span className="text-blue-500 font-bold text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Custom Date Picker Card Overlay */}
      {isOpen && showCustomPicker && (
        <div className="absolute right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 z-40 animate-fadeIn min-w-[620px]">
          
          <h3 className="text-slate-500 font-bold text-xs mb-6 select-none">
            Please select the date range
          </h3>

          {/* Dual Calendar Container */}
          <div className="relative flex items-start gap-8">
            
            {/* Left Nav Arrow */}
            <button 
              onClick={handlePrevMonths}
              className="absolute left-0 top-0.5 p-1 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Left Calendar Grid */}
            <div className="pl-6">
              {renderCalendarGrid(calYear, calMonth)}
            </div>

            {/* Right Calendar Grid */}
            <div className="pr-6">
              {renderCalendarGrid(nextCalYear, nextCalMonth)}
            </div>

            {/* Right Nav Arrow */}
            <button 
              onClick={handleNextMonths}
              className="absolute right-0 top-0.5 p-1 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-6 text-xs">
            <span className="text-slate-600 font-semibold select-none">
              Selected: {tempStart ? formatDate(tempStart) : "--/--/----"} to {tempEnd ? formatDate(tempEnd) : "--/--/----"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelCustom}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
