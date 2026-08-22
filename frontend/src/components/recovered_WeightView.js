"use client";

import { useState, useRef, useEffect } from "react";

const SAMPLE_DISPUTES = [
  {
    id: "WDT-9821",
    awb: "AWB-2019873",
    orderId: "ORD-20198",
    courier: "Amazon Shipping",
    appliedWeight: "0.50 kg",
    courierWeight: "1.20 kg",
    discrepancy: "+0.70 kg",
    chargeDiff: "₹45.00",
    status: "Under Dispute",
    deadline: "July 10, 2026",
    date: "July 01, 2026",
  },
  {
    id: "WDT-9804",
    awb: "AWB-2019661",
    orderId: "ORD-19661",
    courier: "Delhivery",
    appliedWeight: "1.50 kg",
    courierWeight: "2.00 kg",
    discrepancy: "+0.50 kg",
    chargeDiff: "₹30.00",
    status: "Accepted",
    deadline: "Closed",
    date: "June 28, 2026",
  },
  {
    id: "WDT-9788",
    awb: "AWB-2019500",
    orderId: "ORD-19500",
    courier: "BlueDart",
    appliedWeight: "2.00 kg",
    courierWeight: "3.50 kg",
    discrepancy: "+1.50 kg",
    chargeDiff: "₹90.00",
    status: "Rejected",
    deadline: "Closed",
    date: "June 25, 2026",
  },
  {
    id: "WDT-9775",
    awb: "AWB-2019445",
    orderId: "ORD-19445",
    courier: "DTDC",
    appliedWeight: "0.75 kg",
    courierWeight: "1.00 kg",
    discrepancy: "+0.25 kg",
    chargeDiff: "₹15.00",
    status: "Under Dispute",
    deadline: "July 12, 2026",
    date: "June 22, 2026",
  },
  {
    id: "WDT-9760",
    awb: "AWB-2019312",
    orderId: "ORD-19312",
    courier: "Ecom Express",
    appliedWeight: "1.00 kg",
    courierWeight: "1.75 kg",
    discrepancy: "+0.75 kg",
    chargeDiff: "₹50.00",
    status: "Accepted",
    deadline: "Closed",
    date: "June 18, 2026",
  },
];

const COURIER_OPTIONS = ["All Couriers", "Amazon Shipping", "Delhivery", "BlueDart", "DTDC", "Ecom Express"];
const DATE_PRESETS = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "This Month", "Last Month", "Custom"];

function StatusBadge({ status }) {
  const styles = {
    "Under Dispute": "bg-amber-50 text-amber-600 border border-amber-200",
    Accepted: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    Rejected: "bg-rose-50 text-rose-600 border border-rose-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function formatLabelRange(start, end) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[start.getMonth()]} ${String(start.getDate()).padStart(2, "0")} - ${months[end.getMonth()]} ${String(end.getDate()).padStart(2, "0")}, ${end.getFullYear()}`;
}

export default function WeightView() {
  const [disputes] = useState(SAMPLE_DISPUTES);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState("All Couriers");
  const [awbSearch, setAwbSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCourier, setSearchCourier] = useState("All Couriers");

  // Date range states
  const [dateLabel, setDateLabel] = useState("Last 30 days");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("Last 30 days");
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const manageRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (manageRef.current && !manageRef.current.contains(e.target)) setManageOpen(false);
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
        setShowCustomPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = () => {
    setSearchQuery(awbSearch);
    setSearchCourier(selectedCourier);
  };

  const handleReset = () => {
    setAwbSearch("");
    setSearchQuery("");
    setSelectedCourier("All Couriers");
    setSearchCourier("All Couriers");
    setDateLabel("Last 30 days");
    setSelectedPreset("Last 30 days");
    setShowCustomPicker(false);
  };

  const handlePresetClick = (opt) => {
    if (opt === "Custom") {
      setShowCustomPicker(true);
      const today = new Date();
      setTempStart(today);
      setTempEnd(today);
      setCalMonth(today.getMonth());
      setCalYear(today.getFullYear());
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
      setDateLabel(formatLabelRange(tempStart, tempEnd));
      setSelectedPreset("Custom");
      setShowCustomPicker(false);
      setDateDropdownOpen(false);
    }
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  const renderCalendar = () => {
    const totalDays = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDay(calYear, calMonth);
    const prevDays = getDaysInMonth(calYear, calMonth === 0 ? 11 : calMonth - 1);
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(<div key={`p${i}`} className="text-center py-1 text-[11px] text-slate-300">{prevDays - i}</div>);
    }
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(calYear, calMonth, d);
      const isStart = tempStart && date.toDateString() === tempStart.toDateString();
      const isEnd = tempEnd && date.toDateString() === tempEnd.toDateString();
      const isInRange = tempStart && tempEnd && date > tempStart && date < tempEnd;
      cells.push(
        <div
          key={d}
          onClick={() => handleDateClick(date)}
          className={`text-center py-1.5 text-[11px] rounded-lg cursor-pointer select-none transition font-medium
            ${isStart || isEnd ? "bg-[#25a2fe] text-white" : ""}
            ${isInRange ? "bg-[#25a2fe]/10 text-[#25a2fe]" : ""}
            ${!isStart && !isEnd && !isInRange ? "hover:bg-slate-100 text-slate-700" : ""}
          `}
        >{d}</div>
      );
    }
    return cells;
  };

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const filtered = disputes.filter((d) => {
    const matchCourier = searchCourier === "All Couriers" || d.courier === searchCourier;
    const matchAwb = !searchQuery || d.awb.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCourier && matchAwb;
  });

  return (
    <div className="w-full animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Weight Discrepancies</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and dispute weight differences charged by courier partners.</p>
        </div>
        <div className="flex items-center gap-2" ref={manageRef}>
          <div className="relative">
            <button
              onClick={() => setManageOpen((p) => !p)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
              style={{ background: "#25a2fe" }}
            >
              <span>Manage Weight</span>
              <svg className={`w-4 h-4 transition-transform ${manageOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {manageOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
                <button className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition text-left" onClick={() => setManageOpen(false)}>
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Toggle Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs mb-4">
        {/* Pill-style Filter button row */}
        <div className="p-3">
          <button
            onClick={() => setFiltersOpen((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 transition select-none"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span>Filters</span>
            <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${filtersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {filtersOpen && (
          <div className="border-t border-slate-100 px-3 py-3 flex flex-wrap gap-3 items-end">

            {/* Date Range */}
            <div className="flex flex-col gap-1 min-w-[190px] relative" ref={dateRef}>
              <label className="text-[10px] font-bold text-[#25a2fe] uppercase tracking-wide">Search by Date</label>
              <button
                onClick={() => setDateDropdownOpen((p) => !p)}
                className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs text-slate-700 font-medium hover:border-[#25a2fe]/50 transition w-full"
              >
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="flex-1 text-left truncate">{dateLabel}</span>
                <svg className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${dateDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Date Presets Dropdown */}
              {dateDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden min-w-[180px]">
                  {DATE_PRESETS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handlePresetClick(opt)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition font-medium
                        ${selectedPreset === opt ? "text-[#25a2fe] font-bold" : "text-slate-700 hover:bg-slate-50"}
                      `}
                    >
                      <span>{opt}</span>
                      {opt === "Custom" && (
                        <svg className="w-3.5 h-3.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Calendar Picker */}
              {showCustomPicker && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 min-w-[260px]">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-1 hover:bg-slate-100 rounded-lg transition">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-xs font-bold text-slate-700">{MONTH_NAMES[calMonth]} {calYear}</span>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-1 hover:bg-slate-100 rounded-lg transition">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 mb-1">
                    {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">{renderCalendar()}</div>
                  <div className="mt-3 flex gap-2 justify-end">
                    <button onClick={() => setShowCustomPicker(false)} className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition font-semibold">Cancel</button>
                    <button onClick={handleApplyCustom} disabled={!tempStart || !tempEnd} className="px-3 py-1.5 text-xs text-white rounded-lg transition font-bold disabled:opacity-40" style={{ background: "#25a2fe" }}>Apply</button>
                  </div>
                </div>
              )}
            </div>

            {/* Courier */}
            <div className="flex flex-col gap-1 min-w-[170px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide invisible">Courier</label>
              <select
                value={selectedCourier}
                onChange={(e) => setSelectedCourier(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 bg-slate-50 font-medium focus:outline-none focus:border-[#25a2fe]/50 cursor-pointer"
              >
                {COURIER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* AWB Search */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide invisible">AWB</label>
              <input
                type="text"
                placeholder="AWB Number(s)"
                value={awbSearch}
                onChange={(e) => setAwbSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 font-medium focus:outline-none focus:border-[#25a2fe]/60 w-full"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 items-center">
              <button onClick={handleSearch} className="px-5 py-2 rounded-xl text-xs font-bold text-white transition" style={{ background: "#25a2fe" }}>
                Search
              </button>
              <button onClick={handleReset} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wide bg-slate-50/70">
                <th className="py-3.5 px-5">Dispute ID</th>
                <th className="py-3.5 px-5">AWB Number</th>
                <th className="py-3.5 px-5">Order</th>
                <th className="py-3.5 px-5">Courier</th>
                <th className="py-3.5 px-5">Your Weight</th>
                <th className="py-3.5 px-5">Courier Weight</th>
                <th className="py-3.5 px-5">Discrepancy</th>
                <th className="py-3.5 px-5">Charge Diff</th>
                <th className="py-3.5 px-5">Deadline</th>
                <th className="py-3.5 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400 text-xs font-medium">
                    No weight disputes found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((disp) => (
                  <tr key={disp.id} className="hover:bg-slate-50/60 transition cursor-default">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800 text-[11px]">{disp.id}</td>
                    <td className="py-3.5 px-5 font-mono text-[#25a2fe] font-semibold text-[11px]">{disp.awb}</td>
                    <td className="py-3.5 px-5 text-slate-600">{disp.orderId}</td>
                    <td className="py-3.5 px-5 text-slate-600">{disp.courier}</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-700">{disp.appliedWeight}</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-700">{disp.courierWeight}</td>
                    <td className="py-3.5 px-5 text-rose-600 font-bold font-mono">{disp.discrepancy}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">{disp.chargeDiff}</td>
                    <td className="py-3.5 px-5 text-slate-500">{disp.deadline}</td>
                    <td className="py-3.5 px-5 text-right">
                      <StatusBadge status={disp.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Showing <span className="font-bold text-slate-600">{filtered.length}</span> of <span className="font-bold text-slate-600">{disputes.length}</span> disputes</span>
          <span className="font-medium">Last updated: Jul 06, 2026</span>
        </div>
      </div>
    </div>
  );
}
