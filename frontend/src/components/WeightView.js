"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const ITEMS_PER_PAGE = 20;

const COURIER_OPTIONS = ["All Couriers", "Bluedart Surface (N)", "Delhivery Air", "Amazon Express", "DTDC Express", "Ecom Express"];
const DATE_PRESETS = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "This Month", "Last Month", "Custom"];
const TABS = [
  { id: "All Weights", label: "All Weights" },
  { id: "Action Required", label: "Action Required" },
  { id: "Accepted", label: "Accepted" },
  { id: "Open Disputes", label: "Open Disputes" },
  { id: "Closed Disputes", label: "Closed Disputes" },
];

function formatLabelRange(start, end) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[start.getMonth()]} ${String(start.getDate()).padStart(2, "0")} - ${months[end.getMonth()]} ${String(end.getDate()).padStart(2, "0")}, ${end.getFullYear()}`;
}

export default function WeightView() {
  const queryClient = useQueryClient();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All Weights");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // dispute object for action/details
  const [disputeNote, setDisputeNote] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    orderId: "",
    awb: "",
    courier: "Bluedart Surface (N)",
    appliedWeight: "0.50",
    courierWeight: "1.00",
    chargeDiff: "75",
    status: "Dispute Open",
  });

  // Filter states
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

  // Fetch fresh weight orders — refetches every 30s when tab is active
  const { data: ordersArray, isLoading: ordersLoading, refetch: refetchWeightOrders } = useQuery({
    queryKey: ["weightOrdersList"],
    queryFn: async () => {
      const res = await api.get("/orders?limit=200&status=all");
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
      return [];
    },
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    setLoading(ordersLoading);
    if (!ordersLoading) {
      const ordersList = Array.isArray(ordersArray) ? ordersArray : [];
      const mapped = ordersList
        .filter(order => {
          const tags = Array.isArray(order.tags) ? order.tags : [];
          return tags.some(t => typeof t === "string" && t.startsWith("WEIGHT_DISCREPANCY:"));
        })
        .map((order, idx) => {
          const applied = order.weight || 0.5;
          const tags = Array.isArray(order.tags) ? order.tags : [];
          const weightTag = tags.find(t => typeof t === "string" && t.startsWith("WEIGHT_DISCREPANCY:"));
          let weightData = {};
          if (weightTag) {
            try {
              weightData = JSON.parse(weightTag.replace("WEIGHT_DISCREPANCY:", ""));
            } catch (e) {
              weightData = {};
            }
          }

          const courierWt = parseFloat(weightData?.courierWeight || applied).toFixed(2);
          const diffVal = (parseFloat(courierWt) - applied).toFixed(2);
          const diffStr = diffVal > 0 ? `+${diffVal}` : `${diffVal}`;
          const chargesStr = `₹${weightData?.chargeDiff || 0}`;
          const statusVal = weightData?.status || "Action Required";

          const dateStr = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "Today";

          return {
            id: `WDT-${1000 + idx}`,
            orderId: order.orderId ? (order.orderId.startsWith("#") ? order.orderId : `#${order.orderId}`) : `#${order.id}`,
            rawOrderId: order.orderId || order.id,
            awb: order.awbNumber || "N/A",
            courier: order.courierPartner || "Delhivery Surface",
            appliedWeight: `${applied.toFixed(2)} kg`,
            courierWeight: `${courierWt} kg`,
            discrepancy: `${diffStr} kg`,
            chargeDiff: chargesStr,
            status: statusVal,
            deadline: "Within 7 Days",
            date: dateStr,
            remark: weightData?.remark || ""
          };
        });
      setDisputes(mapped);
    }
  }, [ordersArray, ordersLoading]);

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
            ${isStart || isEnd ? "bg-[#2563eb] text-white" : ""}
            ${isInRange ? "bg-[#2563eb]/10 text-[#2563eb]" : ""}
            ${!isStart && !isEnd && !isInRange ? "hover:bg-slate-100 text-slate-700" : ""}
          `}
        >{d}</div>
      );
    }
    return cells;
  };

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Filter logic
  const filtered = disputes.filter((d) => {
    const matchCourier = searchCourier === "All Couriers" || d.courier === searchCourier;
    const matchAwb = !searchQuery || d.awb.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase()) || d.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchTab = true;
    if (activeTab === "Action Required") matchTab = d.status === "Action Required";
    else if (activeTab === "Accepted") matchTab = d.status === "Accepted";
    else if (activeTab === "Open Disputes") matchTab = d.status === "Dispute Open" || d.status === "Under Dispute";
    else if (activeTab === "Closed Disputes") matchTab = d.status === "Closed" || d.status === "Rejected";

    return matchCourier && matchAwb && matchTab;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, searchCourier, selectedPreset]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Select all logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk actions connected to backend API
  const handleBulkAccept = async () => {
    if (!selectedIds.length) return;
    try {
      showToast("Accepting selected weight charges...", "info");
      const selectedItems = disputes.filter(d => selectedIds.includes(d.id));
      for (const item of selectedItems) {
        await api.post("/orders/weight-action", {
          orderId: item.rawOrderId || item.orderId,
          awbNumber: item.awb,
          status: "Accepted"
        });
      }
      showToast("Selected weight charges accepted successfully!");
      setSelectedIds([]);
      refetchWeightOrders();
    } catch (err) {
      showToast("Bulk accept failed: " + (err.data?.message || err.message), "error");
    }
  };

  const handleBulkDispute = async () => {
    if (!selectedIds.length) return;
    try {
      showToast("Raising dispute for selected items...", "info");
      const selectedItems = disputes.filter(d => selectedIds.includes(d.id));
      for (const item of selectedItems) {
        await api.post("/orders/weight-action", {
          orderId: item.rawOrderId || item.orderId,
          awbNumber: item.awb,
          status: "Dispute Open",
          remark: "Bulk dispute raised by seller"
        });
      }
      showToast("Disputes raised successfully!");
      setSelectedIds([]);
      refetchWeightOrders();
    } catch (err) {
      showToast("Bulk dispute failed: " + (err.data?.message || err.message), "error");
    }
  };

  // CSV Export function with Blob & UTF-8 BOM support (prevents # and character truncation)
  const handleExportCSV = () => {
    const headers = ["Dispute ID", "Applied Date", "Order ID", "AWB Number", "Courier", "Booked Wt", "Courier Slab", "Weight Diff", "Charges", "Status"];
    
    const escapeCsv = (val) => {
      const stringVal = String(val ?? "").replace(/"/g, '""');
      return `"${stringVal}"`;
    };

    const rows = filtered.map((d) => [
      escapeCsv(d.id),
      escapeCsv(d.date),
      escapeCsv(d.orderId),
      escapeCsv(d.awb),
      escapeCsv(d.courier),
      escapeCsv(d.appliedWeight),
      escapeCsv(d.courierWeight),
      escapeCsv(d.discrepancy),
      escapeCsv(d.chargeDiff),
      escapeCsv(d.status),
    ]);

    const csvContent = [headers.map(escapeCsv).join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `weight_discrepancies_${activeTab.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setManageOpen(false);
    showToast("CSV report downloaded successfully!");
  };

  // Update status connected to backend API
  const handleUpdateStatus = async (itemOrId, newStatus) => {
    const targetObj = typeof itemOrId === "object" ? itemOrId : disputes.find(d => d.id === itemOrId);
    if (!targetObj) return;

    try {
      showToast(`Updating weight dispute status to ${newStatus}...`, "info");
      const targetOrderId = targetObj.rawOrderId || targetObj.orderId;
      const res = await api.post("/orders/weight-action", {
        orderId: targetOrderId,
        awbNumber: targetObj.awb,
        status: newStatus,
        remark: disputeNote || targetObj.remark || `Status updated to ${newStatus}`
      });

      if (res.success) {
        showToast(res.message || `Discrepancy updated to ${newStatus}!`);
        setActiveModal(null);
        setDisputeNote("");
        refetchWeightOrders();
      } else {
        showToast(res.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error("Error updating weight status:", err);
      showToast("Error: " + (err.data?.message || err.message), "error");
    }
  };

  // Create new real entry connected to backend API
  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.orderId || !newEntry.awb) return;

    try {
      showToast("Saving new weight discrepancy record...", "info");
      const res = await api.post("/orders/weight-discrepancy", {
        orderId: newEntry.orderId,
        awbNumber: newEntry.awb,
        courierWeight: parseFloat(newEntry.courierWeight) || 1.0,
        chargeDiff: parseFloat(newEntry.chargeDiff) || 50,
        status: newEntry.status,
        remark: "Manual weight discrepancy entry"
      });

      if (res.success) {
        showToast("Weight discrepancy record saved successfully!");
        setShowAddModal(false);
        setNewEntry({
          orderId: "",
          awb: "",
          courier: "Bluedart Surface (N)",
          appliedWeight: "0.50",
          courierWeight: "1.00",
          chargeDiff: "75",
          status: "Dispute Open",
        });
        refetchWeightOrders();
      } else {
        showToast(res.message || "Failed to save weight record", "error");
      }
    } catch (err) {
      showToast("Error saving weight record: " + (err.data?.message || err.message), "error");
    }
  };

  // Open modal and prefill saved remark
  const handleOpenModal = (disp) => {
    setActiveModal(disp);
    setDisputeNote(disp.remark || "");
  };

  return (
    <div className="w-full font-sans antialiased bg-white p-3 sm:p-5 rounded-2xl min-h-screen">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[99999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border animate-slideDown text-xs font-semibold ${
          toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-700" :
          toast.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-700" :
          toast.type === "info" ? "bg-blue-50 border-blue-200 text-blue-700" :
          "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          {toast.message}
        </div>
      )}

      {/* Top Header & Manage Weight Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Weight Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">View and manage courier weight discrepancies and disputes.</p>
        </div>
        <div className="flex items-center gap-2.5" ref={manageRef}>
          <button
            onClick={() => setFiltersOpen((p) => !p)}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200/90 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span>Filters</span>
            <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${filtersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setManageOpen((p) => !p)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
              style={{ backgroundColor: "#2563eb" }}
            >
              <span>Manage Weight</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${manageOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {manageOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden py-1">
                <button 
                  onClick={handleExportCSV} 
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition text-left"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Filters Drawer (if toggled) */}
      {filtersOpen && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs mb-4 animate-fadeIn">
          <div className="flex flex-wrap gap-3 items-end">
            
            {/* Date Range */}
            <div className="flex flex-col gap-1 min-w-[200px] relative" ref={dateRef}>
              <label className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wide">Date Filter</label>
              <button
                onClick={() => setDateDropdownOpen((p) => !p)}
                className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs text-slate-700 font-medium hover:border-[#2563eb]/50 transition w-full"
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
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition font-medium
                        ${selectedPreset === opt ? "text-[#2563eb] font-bold bg-blue-50/50" : "text-slate-700 hover:bg-slate-50"}
                      `}
                    >
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Calendar Picker */}
              {showCustomPicker && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 min-w-[260px]">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-1 hover:bg-slate-100 rounded-lg transition">
                      <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-xs font-bold text-slate-700">{MONTH_NAMES[calMonth]} {calYear}</span>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-1 hover:bg-slate-100 rounded-lg transition">
                      <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
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
                    <button onClick={handleApplyCustom} disabled={!tempStart || !tempEnd} className="px-3 py-1.5 text-xs text-white rounded-lg transition font-bold disabled:opacity-40" style={{ backgroundColor: "#2563eb" }}>Apply</button>
                  </div>
                </div>
              )}
            </div>

            {/* Courier Selection */}
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Courier Partner</label>
              <select
                value={selectedCourier}
                onChange={(e) => setSelectedCourier(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 font-medium focus:outline-none focus:border-[#2563eb]/60 cursor-pointer"
              >
                {COURIER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* AWB Search Input */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Search AWB / Order</label>
              <input
                type="text"
                placeholder="Search AWB or Order ID..."
                value={awbSearch}
                onChange={(e) => setAwbSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 font-medium focus:outline-none focus:border-[#2563eb]/60 w-full"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 items-center">
              <button 
                onClick={handleSearch} 
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-xs hover:bg-blue-700" 
                style={{ backgroundColor: "#2563eb" }}
              >
                Search
              </button>
              <button 
                onClick={handleReset} 
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs OR Selection Action Bar (matching user screenshot) */}
      {selectedIds.length > 0 ? (
        <div className="bg-white rounded-2xl px-6 py-3.5 mb-4 shadow-xs flex items-center justify-between border border-slate-200/60 animate-fadeIn">
          <span className="text-xs font-bold text-slate-700">
            {selectedIds.length} {selectedIds.length === 1 ? "item" : "items"} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkAccept}
              className="bg-[#1c2434] hover:bg-slate-900 text-white rounded-full px-6 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Accept Weight
            </button>
            <button
              onClick={handleBulkDispute}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full px-6 py-2 text-xs font-bold transition cursor-pointer"
            >
              Raise Dispute
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-2 mb-4 shadow-xs flex items-center gap-1.5 overflow-x-auto border border-slate-200/60">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer select-none
                  ${isActive 
                    ? "bg-[#2563eb] text-white shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-white">
                <th className="py-4 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>APPLIED DATE</span>
                  </div>
                </th>
                <th className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>SHIPMENT DETAILS</span>
                  </div>
                </th>
                <th className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l9-4 9 4v12l-9 4-9-4V6z" />
                    </svg>
                    <span>BOOKED WT.</span>
                  </div>
                </th>
                <th className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>COURIER SLAB</span>
                  </div>
                </th>
                <th className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>WEIGHT DIFF</span>
                  </div>
                </th>
                <th className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>CHARGES</span>
                  </div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>STATUS / ACTION</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-xs font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading weight records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-xs font-medium">
                    No weight records found. Click "Add Weight Entry" to add a new record.
                  </td>
                </tr>
              ) : (
                paginatedData.map((disp) => {
                  const isSelected = selectedIds.includes(disp.id);
                  return (
                    <tr 
                      key={disp.id} 
                      className={`hover:bg-slate-50/80 transition cursor-default ${isSelected ? "bg-blue-50/30" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(disp.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Applied Date */}
                      <td className="py-4 px-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                        {disp.date}
                      </td>

                      {/* Shipment Details */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 text-xs tracking-tight">{disp.orderId}</span>
                          <span 
                            onClick={() => handleOpenModal(disp)} 
                            className="text-blue-600 font-semibold text-[11px] hover:underline cursor-pointer tracking-tight"
                          >
                            {disp.awb}
                          </span>
                          <span className="text-slate-400 text-[11px] font-normal">{disp.courier}</span>
                        </div>
                      </td>

                      {/* Booked Wt */}
                      <td className="py-4 px-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                        {disp.appliedWeight}
                      </td>

                      {/* Courier Slab */}
                      <td className="py-4 px-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                        {disp.courierWeight}
                      </td>

                      {/* Weight Diff */}
                      <td className="py-4 px-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                        {disp.discrepancy}
                      </td>

                      {/* Charges */}
                      <td className="py-4 px-4 font-extrabold text-slate-900 text-xs whitespace-nowrap">
                        {disp.chargeDiff}
                      </td>

                      {/* Status / Action Button */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenModal(disp)}
                          className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[11px] font-semibold border border-rose-300/80 bg-rose-50/50 text-rose-600 hover:bg-rose-100/70 hover:border-rose-400 transition cursor-pointer shadow-2xs"
                        >
                          {disp.status}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with 20-item Pagination */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing <span className="font-bold text-slate-800">{filtered.length > 0 ? startIndex + 1 : 0}</span> to{" "}
              <span className="font-bold text-slate-800">{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</span> of{" "}
              <span className="font-bold text-slate-800">{filtered.length}</span> records
            </span>
            {selectedIds.length > 0 && (
              <span className="font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 text-[11px]">
                {selectedIds.length} item(s) selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 select-none">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Modal for Dispute Action / Details */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Weight Dispute Details</h3>
                <p className="text-[11px] text-slate-400">{activeModal.id} • {activeModal.orderId}</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">AWB Number</span>
                  <span className="font-bold text-blue-600">{activeModal.awb}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Courier</span>
                  <span className="font-bold text-slate-700">{activeModal.courier}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Booked Weight</span>
                  <span className="font-bold text-slate-700">{activeModal.appliedWeight}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Courier Slab</span>
                  <span className="font-bold text-slate-700">{activeModal.courierWeight}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Discrepancy</span>
                  <span className="font-bold text-rose-600">{activeModal.discrepancy}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Extra Charges</span>
                  <span className="font-extrabold text-slate-900">{activeModal.chargeDiff}</span>
                </div>
              </div>

              {activeModal.remark && (
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 text-xs text-slate-700">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide block mb-0.5">Saved Dispute Reason / Remark:</span>
                  <p className="text-slate-800 font-medium italic">{activeModal.remark}</p>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Add / Update Remark</label>
                <textarea
                  rows={2}
                  placeholder="Enter remarks for dispute verification..."
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2 justify-end border-t border-slate-100">
                {activeModal.status === "Accepted" ? (
                  <>
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-xl text-xs flex items-center gap-1.5 mr-auto">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      Charge Accepted & Settled
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(activeModal, "Accepted")}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Accept Charge
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(activeModal, "Dispute Open")}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs cursor-pointer"
                      style={{ backgroundColor: "#2563eb" }}
                    >
                      Raise / Update Dispute
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding New Entry */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="font-bold text-slate-800 text-sm">Add New Weight Record</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-5 space-y-3 text-xs text-slate-700">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Order ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. #BeeShip3147"
                  value={newEntry.orderId}
                  onChange={(e) => setNewEntry((p) => ({ ...p, orderId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">AWB Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 77841344895"
                  value={newEntry.awb}
                  onChange={(e) => setNewEntry((p) => ({ ...p, awb: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Courier Partner</label>
                  <select
                    value={newEntry.courier}
                    onChange={(e) => setNewEntry((p) => ({ ...p, courier: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {COURIER_OPTIONS.filter(c => c !== "All Couriers").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                  <select
                    value={newEntry.status}
                    onChange={(e) => setNewEntry((p) => ({ ...p, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Dispute Open">Dispute Open</option>
                    <option value="Action Required">Action Required</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Booked Wt (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.appliedWeight}
                    onChange={(e) => setNewEntry((p) => ({ ...p, appliedWeight: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Courier Slab (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.courierWeight}
                    onChange={(e) => setNewEntry((p) => ({ ...p, courierWeight: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Charge Diff (₹)</label>
                  <input
                    type="number"
                    value={newEntry.chargeDiff}
                    onChange={(e) => setNewEntry((p) => ({ ...p, chargeDiff: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs cursor-pointer"
                  style={{ backgroundColor: "#2563eb" }}
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}