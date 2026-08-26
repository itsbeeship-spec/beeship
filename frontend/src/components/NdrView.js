import React, { useState, useRef, useEffect } from "react";

// Local CustomSelect component to support rounded-xl dropdown list menus
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
        <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-155 rounded-xl shadow-xl py-1.5 z-30 animate-slideUp text-xs font-semibold text-slate-700 max-h-56 overflow-y-auto">
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

export default function NdrView() {
  const [reports, setReports] = useState([
    {
      id: "1",
      orderId: "#BeeShip3691",
      orderDate: "7/1/2026",
      customer: "manish garu",
      phone: "7023818797",
      address: "near jain temple bapu nagar gotan, nagaur, rajasthan, india, 342902",
      amount: 1148,
      method: "COD",
      collectable: 1148,
      products: [
        { name: "with matching panty - xxl", sku: "N/A", qty: 1 },
        { name: "valence plus size lace sheer bodysuit for women - deep v mesh teddy with side tie detail | romantic nightwear - 2xl", sku: "N/A", qty: 1 }
      ],
      productSummary: "valence pink sheer ba...",
      statusFlags: "exception",
      courier: "Amazon Shipping",
      awb: "370529591298",
      ndrRemark: "DeliveryAttempted",
      attempts: 1,
      lastActivity: "courier",
      lastActivityDate: "7/6/2026",
      status: "Action Required",
      history: [
        { title: "DeliveryAttempted", date: "7/6/2026, 1:28:12 PM", details: "Attempts: 1" }
      ]
    },
    {
      id: "2",
      orderId: "#BeeShip3688",
      orderDate: "6/29/2026",
      customer: "rahul sharma",
      phone: "9876543210",
      address: "sector 15, block C, house 402, noida, uttar pradesh, 201301",
      amount: 899,
      method: "Prepaid",
      collectable: 0,
      products: [
        { name: "men slim fit cotton casual shirt - xl", sku: "SHIRT-091", qty: 1 }
      ],
      productSummary: "men slim fit cotton...",
      statusFlags: "exception",
      courier: "Delhivery Surface",
      awb: "DELH8472910482",
      ndrRemark: "Customer Refused",
      attempts: 2,
      lastActivity: "courier",
      lastActivityDate: "7/5/2026",
      status: "Action Taken",
      history: [
        { title: "Address Incomplete", date: "7/4/2026, 11:15:00 AM", details: "Attempts: 1" },
        { title: "Customer Refused", date: "7/5/2026, 4:20:00 PM", details: "Attempts: 2" }
      ]
    },
    {
      id: "3",
      orderId: "#BeeShip3674",
      orderDate: "6/28/2026",
      customer: "amit verma",
      phone: "8887776665",
      address: "flat 203, green view apartments, whitefield, bangalore, karnataka, 560066",
      amount: 1450,
      method: "COD",
      collectable: 1450,
      products: [
        { name: "leather wallet black bi-fold", sku: "WAL-BK", qty: 2 }
      ],
      productSummary: "leather wallet black...",
      statusFlags: "rto",
      courier: "BlueDart Express",
      awb: "BLDR9274910283",
      ndrRemark: "RTO Confirmed",
      attempts: 3,
      lastActivity: "courier",
      lastActivityDate: "7/4/2026",
      status: "RTO",
      history: [
        { title: "Door Closed", date: "7/2/2026, 10:00:00 AM", details: "Attempts: 1" },
        { title: "Phone Switched Off", date: "7/3/2026, 2:30:00 PM", details: "Attempts: 2" },
        { title: "RTO Initiated", date: "7/4/2026, 9:00:00 AM", details: "Attempts: 3" }
      ]
    }
  ]);

  const [activeTab, setActiveTab] = useState("Action Required");
  const [expandedRows, setExpandedRows] = useState([]); // Default all rows collapsed
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionDropdownId, setActionDropdownId] = useState(null);
  const [hoveredReportId, setHoveredReportId] = useState(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [manageDropdownOpen, setManageDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Filter input states
  const [dateRange, setDateRange] = useState("Jun 06 - Jul 06, 2026");
  const [selectedCourier, setSelectedCourier] = useState("");
  const [awbSearch, setAwbSearch] = useState("");
  const [selectedAttempts, setSelectedAttempts] = useState("");

  // New Date Picker states
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Instruction Modal states
  const [instructionModalOpen, setInstructionModalOpen] = useState(false);
  const [activeAwb, setActiveAwb] = useState(null);
  const [ndrAction, setNdrAction] = useState("reattempt");
  const [remark, setRemark] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addressNotes, setAddressNotes] = useState("");

  const dropdownRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setManageDropdownOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleRow = (id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filtered) => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(r => r.id));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
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

  const formatLabelRange = (start, end) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const startM = months[start.getMonth()];
    const startD = String(start.getDate()).padStart(2, "0");
    const endM = months[end.getMonth()];
    const endD = String(end.getDate()).padStart(2, "0");
    const endY = end.getFullYear();
    return `${startM} ${startD} - ${endM} ${endD}, ${endY}`;
  };

  const handleApplyCustom = () => {
    if (tempStart && tempEnd) {
      setStartDate(tempStart);
      setEndDate(tempEnd);
      const label = formatLabelRange(tempStart, tempEnd);
      setDateRange(label);
      setShowCustomPicker(false);
      showToast("Custom date range applied.");
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
      let start = new Date();
      let end = new Date();
      const today = new Date();

      if (opt === "Today") {
        start = today;
        end = today;
      } else if (opt === "Yesterday") {
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      } else if (opt === "Last 7 days") {
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        end = today;
      } else if (opt === "Last 30 days") {
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
        end = today;
      } else if (opt === "This Month") {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
      } else if (opt === "Last Month") {
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        end = lastDayOfLastMonth;
      }

      setStartDate(start);
      setEndDate(end);
      const label = formatLabelRange(start, end);
      setDateRange(label);
      setDateDropdownOpen(false);
      setShowCustomPicker(false);
      showToast(`${opt} preset applied.`);
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
              cellClass += "text-slate-750 hover:bg-slate-50 hover:rounded-full ";
            }

            if (isStart || isEnd) {
              innerClass += "bg-[#017cf8] text-white font-bold ";
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

  const handleSearch = () => {
    showToast("Filters applied successfully!");
  };

  const handleClearAll = () => {
    setDateRange("Jun 06 - Jul 06, 2026");
    setSelectedCourier("");
    setAwbSearch("");
    setSelectedAttempts("");
    setStartDate(null);
    setEndDate(null);
    showToast("Filters cleared.");
  };

  const handleDownload = () => {
    setManageDropdownOpen(false);
    
    // Create CSV content
    const headers = ["Order ID", "Customer", "Failed Reason", "NDR Date", "Attempts", "Status", "Courier", "AWB Number"];
    const rows = reports.map(r => [
      r.orderId,
      r.customer,
      r.ndrRemark,
      r.lastActivityDate,
      r.attempts,
      r.status,
      r.courier,
      r.awb
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `beeship_ndr_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("NDR CSV downloaded successfully!");
  };

  const openInstructionModal = (awb) => {
    setActiveAwb(awb);
    setNdrAction("reattempt");
    setRemark("");
    setNewPhone("");
    setAddressNotes("");
    setInstructionModalOpen(true);
    setActionDropdownId(null);
  };

  const submitInstructions = (e) => {
    e.preventDefault();
    
    setReports(prev => prev.map(r => {
      if (r.awb === activeAwb) {
        return {
          ...r,
          status: ndrAction === "reattempt" ? "Action Taken" : "RTO",
          statusFlags: ndrAction === "reattempt" ? "exception" : "rto",
          history: [
            ...r.history,
            { title: ndrAction === "reattempt" ? "Re-attempt Instruction Submitted" : "RTO Instruction Submitted", date: new Date().toLocaleString(), details: remark }
          ]
        };
      }
      return r;
    }));

    setInstructionModalOpen(false);
    showToast(`Instructions submitted successfully for AWB ${activeAwb}!`);
  };

  // Filter logic
  let displayedReports = [...reports];
  
  // Tab filtering
  if (activeTab !== "All") {
    displayedReports = displayedReports.filter(r => r.status.toLowerCase() === activeTab.toLowerCase());
  }

  // Parameter filtering
  if (awbSearch.trim()) {
    displayedReports = displayedReports.filter(r => r.awb.includes(awbSearch.trim()));
  }
  if (selectedCourier) {
    displayedReports = displayedReports.filter(r => r.courier.toLowerCase().includes(selectedCourier.toLowerCase().split(" ")[0]));
  }
  if (selectedAttempts) {
    const numericAttempt = parseInt(selectedAttempts);
    displayedReports = displayedReports.filter(r => r.attempts === numericAttempt);
  }

  // Get status counts dynamically
  const actionRequiredCount = reports.filter(r => r.status === "Action Required").length;
  const actionTakenCount = reports.filter(r => r.status === "Action Taken").length;
  const rtoCount = reports.filter(r => r.status === "RTO").length;
  const deliveredCount = reports.filter(r => r.status === "Delivered").length;

  return (
    <div className="w-full animate-fadeIn select-none">
      {/* Toast Notification */}
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

      {/* Header Row */}
      <div className="flex justify-between items-center w-full mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">NDR</h2>
        </div>

        {/* Manage NDR Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setManageDropdownOpen(!manageDropdownOpen)}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-[#25a2fe] hover:bg-[#1a85db] text-white hover:shadow-md rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <span>Manage NDR</span>
            <svg className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${manageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Manage NDR Dropdown List */}
          {manageDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-44 bg-white border border-slate-150 rounded-xl shadow-xl py-2 z-40 animate-slideUp">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toggle Button */}
      <div className="mb-5 flex justify-start">
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition cursor-pointer"
        >
          <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          <svg className={`w-3 h-3 text-slate-550 transform transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expandable Filters Card */}
      {filtersOpen && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6.5 mb-6 shadow-sm animate-fadeIn">
          <div className="grid grid-cols-12 gap-5 items-end">
            
            {/* Date Range input */}
            <div className="col-span-12 md:col-span-3 relative" ref={dateRef}>
              <div className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-orange-500 font-bold uppercase tracking-wider z-10 select-none">
                Date Range
              </div>
              <button
                type="button"
                onClick={() => {
                  setDateDropdownOpen(!dateDropdownOpen);
                  setShowCustomPicker(false);
                }}
                className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold bg-white hover:border-slate-350 focus:outline-none transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{dateRange}</span>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dateDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-xl shadow-xl py-1.5 z-30 animate-slideUp text-xs font-semibold text-slate-700 max-h-72 overflow-y-auto">
                  {["Today", "Yesterday", "Last 7 days", "Last 30 days", "This Month", "Last Month", "Custom"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectDatePreset(preset)}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition cursor-pointer ${
                        preset === "Custom" ? "text-[#017cf8] border-t border-slate-100 font-bold flex items-center justify-between" : ""
                      }`}
                    >
                      <span>{preset}</span>
                      {preset === "Custom" && (
                        <svg className="w-3.5 h-3.5 text-[#017cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Calendar Picker Popup overlay */}
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

            {/* Courier Dropdown selector */}
            <div className="col-span-12 md:col-span-3">
              <CustomSelect
                value={selectedCourier}
                onChange={setSelectedCourier}
                placeholder="Courier"
                options={["Delhivery Surface", "Xpressbees Lite", "BlueDart Express", "Amazon Shipping"]}
              />
            </div>

            {/* AWB Numbers text input */}
            <div className="col-span-12 md:col-span-3">
              <input
                type="text"
                value={awbSearch}
                onChange={(e) => setAwbSearch(e.target.value)}
                placeholder="AWB Numbers"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold bg-white placeholder-slate-400 focus:outline-none focus:border-slate-350 transition"
              />
            </div>

            {/* Attempts Dropdown selector */}
            <div className="col-span-12 md:col-span-3">
              <CustomSelect
                value={selectedAttempts}
                onChange={setSelectedAttempts}
                placeholder="Attempts"
                options={["1", "2", "3"]}
              />
            </div>

            {/* Action buttons row */}
            <div className="col-span-12 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#25a2fe] hover:bg-[#1a85db] text-white hover:shadow-md rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <span>Clear All</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sub Tab Bar Menu */}
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-2 mb-5 shadow-xs flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-500 select-none">
        {[
          { label: "Action Required", count: actionRequiredCount },
          { label: "Action Taken", count: actionTakenCount },
          { label: "RTO", count: rtoCount },
          { label: "Delivered", count: deliveredCount },
          { label: "All", count: reports.length }
        ].map((tab) => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label)}
              className={`px-4.5 py-2 rounded-full flex items-center gap-2 transition cursor-pointer font-bold ${
                isActive 
                  ? "bg-[#25a2fe] text-white" 
                  : "hover:bg-slate-50 text-slate-660"
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* NDR Reports Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
                <th className="py-3 px-5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={displayedReports.length > 0 && selectedIds.length === displayedReports.length}
                    onChange={() => handleSelectAll(displayedReports)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                  />
                </th>
                <th className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Order</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Customer</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Total Amount</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Collectable</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Products</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21v8h-6l-1-1H5v7m-2 0h4" />
                    </svg>
                    <span>Status Flags</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                    </svg>
                    <span>Courier</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>NDR Remark</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Last Activity</span>
                  </div>
                </th>
                <th className="py-3 pr-5 pl-4 text-right font-bold">
                  <div className="flex items-center gap-1.5 justify-end">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span>Action</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
              {displayedReports.length > 0 ? (
                displayedReports.map((report, idx) => {
                  const isExpanded = expandedRows.includes(report.id);
                  const isSelected = selectedIds.includes(report.id);
                  return (
                    <React.Fragment key={report.id}>
                      <tr 
                        onClick={() => toggleRow(report.id)} 
                        className="hover:bg-slate-50/20 transition-all flex flex-col md:table-row cursor-pointer animate-fadeIn"
                      >
                        {/* Checkbox & Dropdown Arrow row cell */}
                        <td 
                          className="py-3 px-5 text-center w-12 md:table-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2 justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(report.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                            />
                            <button
                              type="button"
                              onClick={() => toggleRow(report.id)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer flex items-center justify-center shrink-0"
                            >
                              <svg
                                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                  isExpanded ? "rotate-90 text-slate-600" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>

                        {/* Order info cell */}
                        <td className="py-3 px-4 md:table-cell">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{report.orderId}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{report.orderDate}</span>
                          </div>
                        </td>

                        {/* Customer info cell */}
                        <td className="py-3 px-4 md:table-cell">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{report.customer}</span>
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {report.phone}
                            </span>
                          </div>
                        </td>

                        {/* Total Amount info cell */}
                        <td className="py-3 px-4 md:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-800 text-[13px]">₹{report.amount}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded border border-orange-200 text-orange-500 font-extrabold text-[9px] bg-orange-50/10">
                                {report.method}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Collectable info cell */}
                        <td className="py-3 px-4 md:table-cell text-emerald-600 font-bold">
                          ₹{report.collectable}
                        </td>

                        {/* Products info cell */}
                        <td className="py-3 px-4 md:table-cell relative">
                          <div
                            onMouseEnter={() => setHoveredReportId(report.id)}
                            onMouseLeave={() => setHoveredReportId(null)}
                            className="relative inline-block cursor-pointer max-w-[130px]"
                          >
                            <span className="block truncate text-slate-700 font-semibold" title={report.productSummary}>
                              {report.productSummary}
                            </span>

                            {/* Hover Popup */}
                            {hoveredReportId === report.id && (
                              <div className={`absolute left-0 ${idx < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden pointer-events-none animate-fadeIn select-none`}>
                                <div className="bg-[#25a2fe] text-white px-4 py-2 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                  <span className="font-bold text-xs">Products ({report.products.length})</span>
                                </div>
                                <div className="p-4 flex flex-col gap-3.5 max-h-60 overflow-y-auto">
                                  {report.products.map((prod, pIdx) => (
                                    <div key={pIdx} className="flex gap-3 items-start text-xs text-left normal-case tracking-normal">
                                      <span className="w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full font-bold text-[10px] flex-shrink-0">
                                        {prod.qty || 1}
                                      </span>
                                      <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-slate-700 font-semibold leading-relaxed break-words text-[11px]">
                                          {prod.name}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Flags cell */}
                        <td className="py-3 px-4 md:table-cell">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${
                            report.statusFlags === "exception" 
                              ? "bg-rose-50 border-rose-100 text-rose-500" 
                              : "bg-amber-50 border-amber-100 text-amber-500"
                          }`}>
                            {report.statusFlags}
                          </span>
                        </td>

                        {/* Courier cell */}
                        <td className="py-3 px-4 md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-700">{report.courier}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] text-blue-600 font-semibold">{report.awb}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(report.awb);
                                  showToast("AWB Copied to clipboard!");
                                }}
                                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                title="Copy AWB"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* NDR Remark cell */}
                        <td className="py-3 px-4 md:table-cell">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{report.ndrRemark}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Attempts: {report.attempts}</span>
                          </div>
                        </td>

                        {/* Last Activity cell */}
                        <td className="py-3 px-4 md:table-cell">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{report.lastActivity}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{report.lastActivityDate}</span>
                          </div>
                        </td>

                        {/* Actions dropdown cell */}
                        <td 
                          className="py-3 pr-5 pl-4 text-right md:table-cell relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setActionDropdownId(actionDropdownId === report.id ? null : report.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25a2fe] hover:bg-[#1a85db] text-white rounded-lg text-[10px] font-bold shadow-xs transition cursor-pointer"
                          >
                            <span>Actions</span>
                            <svg className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {actionDropdownId === report.id && (
                            <div className="absolute right-5 mt-1.5 w-32 bg-white border border-slate-150 rounded-xl shadow-xl py-1.5 z-40 animate-slideUp text-left select-none text-[10px] font-bold">
                              {report.status === "Action Required" && (
                                <button
                                  type="button"
                                  onClick={() => openInstructionModal(report.awb)}
                                  className="flex items-center gap-2 px-3 py-2 w-full hover:bg-slate-50 text-slate-700 transition"
                                >
                                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span>Re-Attempt</span>
                                </button>
                              )}
                              {report.status === "Action Required" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    openInstructionModal(report.awb);
                                    setNdrAction("rto");
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 w-full hover:bg-slate-50 text-slate-700 transition"
                                >
                                  <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                  <span>RTO</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  toggleRow(report.id);
                                  setActionDropdownId(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 w-full hover:bg-slate-50 text-slate-700 transition"
                              >
                                <svg className="w-3.5 h-3.5 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>View History</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Collapsible Detail Drawer Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/20 select-text" onClick={(e) => e.stopPropagation()}>
                          <td colSpan="11" className="p-0">
                            <div className="grid grid-cols-12 gap-8 px-12 py-5 text-xs text-slate-650 animate-slideDown">
                              
                              {/* SHIPPING INFO Column */}
                              <div className="col-span-12 md:col-span-3 flex flex-col gap-2.5">
                                <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5 mb-0.5 select-none">
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  <span>SHIPPING INFO</span>
                                </h4>
                                
                                <div className="flex items-center gap-2 font-bold text-slate-800 text-[12px]">
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>{report.customer}</span>
                                </div>

                                <div className="flex items-center gap-2 text-slate-500 font-medium">
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <span>{report.phone}</span>
                                </div>

                                {report.address && (
                                  <div className="flex items-start gap-2 text-slate-500 font-medium leading-relaxed text-[10.5px]">
                                    <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <span>{report.address}</span>
                                  </div>
                                )}
                              </div>

                              {/* PRODUCTS Column */}
                              <div className="col-span-12 md:col-span-4 flex flex-col gap-2.5">
                                <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5 mb-0.5 select-none">
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                  <span>PRODUCTS</span>
                                </h4>
                                <div className="flex flex-col gap-3 max-h-36 overflow-y-auto pr-2">
                                  {report.products.map((p, idx) => (
                                    <div key={idx} className="flex gap-2 items-start text-slate-800 leading-normal text-[11px]">
                                      <span className="text-slate-400 font-extrabold mt-0.5">•</span>
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">{p.name}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">SKU: {p.sku} • Qty: {p.qty}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* NDR INFO Column */}
                              <div className="col-span-12 md:col-span-3 flex flex-col gap-2.5">
                                <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5 mb-0.5 select-none">
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>NDR INFO</span>
                                </h4>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2 text-slate-800">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="font-bold">{report.ndrRemark}</span>
                                  </div>
                                  {report.history.map((hist, histIdx) => (
                                    <div key={histIdx} className="flex flex-col gap-1 border-l border-slate-200 pl-3.5 py-1">
                                      <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{hist.date}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-semibold">{hist.details}</span>
                                    </div>
                                  ))}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Attempts:</span>
                                    <span className="w-5.5 h-5.5 flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10.5px] font-extrabold">
                                      {report.attempts}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* ACTIONS Column */}
                              <div className="col-span-12 md:col-span-2 flex flex-col gap-2.5 md:border-l border-slate-200/80 md:pl-5">
                                <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1.5 mb-0.5 select-none">
                                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                  </svg>
                                  <span>ACTIONS</span>
                                </h4>
                                <div className="flex flex-col gap-1.5 w-full select-none text-[10px] font-bold">
                                  {report.status === "Action Required" ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openInstructionModal(report.awb)}
                                        className="flex items-center gap-2 px-3 py-2 w-full hover:bg-slate-100 rounded-lg text-slate-700 transition cursor-pointer"
                                      >
                                        <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>Re-Attempt</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          openInstructionModal(report.awb);
                                          setNdrAction("rto");
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 w-full hover:bg-slate-100 rounded-lg text-slate-700 transition cursor-pointer"
                                      >
                                        <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                        <span>RTO</span>
                                      </button>
                                    </>
                                  ) : (
                                    <p className="text-[9px] text-slate-450 italic leading-relaxed py-2 select-none">
                                      Instructions submitted. Pending update.
                                    </p>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => toggleRow(report.id)}
                                    className="flex items-center gap-2 px-3 py-2 w-full hover:bg-slate-100 rounded-lg text-slate-700 transition cursor-pointer border-t border-slate-100 mt-1 pt-2"
                                  >
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                    </svg>
                                    <span>Close Detail</span>
                                  </button>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400 font-semibold text-xs">
                    No NDR records found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
      </div>

      {/* Instruction Submission Modal / Dialog */}
      {instructionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-slate-150 rounded-3xl shadow-2xl p-6.5 animate-slideUp">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 select-none">
              <h3 className="text-sm font-bold text-slate-800">
                Provide Instructions for {activeAwb}
              </h3>
              <button
                type="button"
                onClick={() => setInstructionModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={submitInstructions} className="flex flex-col gap-4 text-xs font-semibold text-slate-700">
              
              {/* Select NDR Action option */}
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-500 font-bold">Action Option</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ndr_action"
                      value="reattempt"
                      checked={ndrAction === "reattempt"}
                      onChange={() => setNdrAction("reattempt")}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Re-attempt Delivery</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ndr_action"
                      value="rto"
                      checked={ndrAction === "rto"}
                      onChange={() => setNdrAction("rto")}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Return to Origin (RTO)</span>
                  </label>
                </div>
              </div>

              {/* Conditional Inputs */}
              {ndrAction === "reattempt" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-500 font-bold">New Phone (Optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-350 bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-500 font-bold">Address / Landmark Instructions (Optional)</span>
                    <textarea
                      placeholder="e.g. Deliver near yellow gate or landmark..."
                      value={addressNotes}
                      onChange={(e) => setAddressNotes(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-350 bg-white h-20 resize-none"
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-rose-500 leading-relaxed font-medium bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  Are you sure you want to return this shipment back to your warehouse? RTO shipping charges may apply.
                </p>
              )}

              {/* Remark */}
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-500 font-bold">Remarks / Comments</span>
                <input
                  type="text"
                  placeholder="e.g. Customer promised to pickup tomorrow..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-350 bg-white"
                  required
                />
              </div>

              {/* Footer Action buttons */}
              <div className="flex justify-end gap-3 mt-3.5 select-none">
                <button
                  type="button"
                  onClick={() => setInstructionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-550 hover:bg-rose-600 text-white rounded-xl shadow-sm cursor-pointer"
                >
                  Submit Instruction
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
