"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import api from "@/lib/api";

const DATE_PRESETS = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "This Month", "Last Month", "Custom"];
const CATEGORIES = ["All", "shipping", "recharge", "refund", "rto", "dispute"];

function formatLabelRange(start, end) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[start.getMonth()]} ${String(start.getDate()).padStart(2, "0")} - ${months[end.getMonth()]} ${String(end.getDate()).padStart(2, "0")}, ${end.getFullYear()}`;
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
    <div className="relative w-full select-none font-sans text-xs text-slate-700" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold bg-white hover:border-slate-350 focus:outline-none transition cursor-pointer text-left shadow-sm"
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
              className={`w-full px-3.5 py-2.5 text-xs text-left transition capitalize font-semibold ${
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

const ITEMS_PER_PAGE = 20;

export default function BillingView() {
  const { user, showToast } = useAuth();
  const { walletBalance, setWalletBalance } = useDashboard();
  const queryClient = useQueryClient();

  const [rates, setRates] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("Wallet Transactions");
  const [txPage, setTxPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);

  // Fetch courier rates via useQuery
  const { data: ratesPayload, isLoading: ratesLoading } = useQuery({
    queryKey: ["billing", "rates"],
    queryFn: () => api.get("/billing/rates").then(res => res.data || []),
    staleTime: 30 * 1000, // 30s — rates don't change that often
    enabled: activeTab === "Pricing",
  });

  // Fetch wallet transactions via useQuery
  const { data: txPayload, isLoading: txLoading } = useQuery({
    queryKey: ["billing", "transactions"],
    queryFn: () => api.get("/billing/transactions"),
    staleTime: 30 * 1000, // 30s — shared cache with layout prefetch
    enabled: activeTab === "Wallet Transactions",
  });

  // Fetch shipped orders via useQuery — same queryKey as ShipmentView to share the cache
  const { data: ordersPayload, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", { status: "booked", limit: 100 }],
    queryFn: () => api.get("/orders?status=booked&limit=100").then(res => res.data || []),
    staleTime: 10 * 1000,
    enabled: activeTab === "Shipping Charges",
  });

  useEffect(() => {
    if (ratesPayload) {
      setRates(ratesPayload);
    }
  }, [ratesPayload]);

  useEffect(() => {
    if (txPayload && txPayload.success) {
      setTransactions(txPayload.data || []);
      if (txPayload.balance !== undefined) {
        setWalletBalance(txPayload.balance);
      }
    }
  }, [txPayload]);

  useEffect(() => {
    if (ordersPayload) {
      const shipped = ordersPayload.filter(o => o.shippingCharges > 0 || o.awbNumber);
      setOrders(shipped);
    }
  }, [ordersPayload]);

  // Filter States
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [awbSearch, setAwbSearch] = useState("");
  const [searchAwb, setSearchAwb] = useState("");
  const [searchCategory, setSearchCategory] = useState("All");

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

  // Calculator Modal states
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcForm, setCalcForm] = useState({
    sourcePincode: "201301",
    destPincode: "801505",
    weight: "2",
    length: "3",
    width: "5",
    height: "3",
    collectableAmount: "2000",
    type: "Prepaid",
  });
  const [calcResults, setCalcResults] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Recharge Modal states
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);

  // Handle Preset Click
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

  // Search filter click
  const handleSearchClick = () => {
    setSearchAwb(awbSearch);
    setSearchCategory(selectedCategory);
  };

  // Clear filters
  const handleClearFilters = () => {
    setAwbSearch("");
    setSearchAwb("");
    setSelectedCategory("All");
    setSearchCategory("All");
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    setStartDate(start);
    setEndDate(today);
    setDateLabel(formatLabelRange(start, today));
    setSelectedPreset("Last 30 days");
  };

  // Handle B2C Calculation
  const handleCalculate = async (e) => {
    e.preventDefault();
    setCalcLoading(true);
    setCalcResults(null);
    try {
      const res = await api.post("/billing/calculator", calcForm);
      if (res.success && res.data) {
        setCalcResults(res.data);
      }
    } catch (err) {
      showToast(err.message || "Failed to calculate shipping charges", "error");
    } finally {
      setCalcLoading(false);
    }
  };

  const rechargeMutation = useMutation({
    mutationFn: (amt) => api.post("/billing/recharge", { amount: amt }),
    onSuccess: (res, amt) => {
      if (res.success) {
        showToast(`₹${amt} recharged successfully!`, "success");
        setRechargeOpen(false);
        setRechargeAmount("");
        if (res.balance !== undefined) {
          setWalletBalance(res.balance);
        }
        queryClient.invalidateQueries({ queryKey: ["billing", "transactions"] });
      } else {
        showToast(res.message || "Recharge failed", "error");
      }
    },
    onError: (err) => {
      showToast(err.message || "Recharge failed", "error");
    },
    onSettled: () => {
      setRechargeLoading(false);
    }
  });

  // Handle Wallet Recharge
  const handleRecharge = (e) => {
    e.preventDefault();
    if (user?.kycStatus !== "APPROVED") {
      showToast("KYC verification is required to recharge your wallet.", "warning");
      setRechargeOpen(false);
      return;
    }

    const amt = parseFloat(rechargeAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Please enter a valid amount.", "warning");
      return;
    }

    setRechargeLoading(true);
    rechargeMutation.mutate(amt);
  };

  // Pre-calculate closing balance dynamically based on dates, search AWB, category filter
  // Sort all transactions ascending to correctly compute historical closing balance
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let currentBalance = 8420.00; // base initial balance
  const precalculatedTransactions = sortedTransactions.map((tx) => {
    currentBalance = currentBalance + tx.amount;
    return { ...tx, closingBalance: currentBalance };
  });

  // Sort back to descending order (newest first) for UI presentation
  const descTransactions = precalculatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Now apply filter criteria on the descTransactions array
  const filteredTx = descTransactions.filter((tx) => {
    // 1. AWB Search
    const matchAwb = !searchAwb || (tx.awb && tx.awb.toLowerCase().includes(searchAwb.toLowerCase()));
    
    // 2. Category Search
    const matchCat = searchCategory === "All" || tx.type === searchCategory;

    // 3. Date Search
    const txDate = new Date(tx.date);
    const startCompare = new Date(startDate);
    startCompare.setHours(0, 0, 0, 0);
    const endCompare = new Date(endDate);
    endCompare.setHours(23, 59, 59, 999);
    const matchDate = txDate >= startCompare && txDate <= endCompare;

    return matchAwb && matchCat && matchDate;
  });

  // Reset page when filters change
  useEffect(() => {
    setTxPage(1);
    setOrdersPage(1);
  }, [searchAwb, searchCategory, startDate, endDate, activeTab]);

  // Wallet transactions pagination
  const totalTxPages = Math.ceil(filteredTx.length / ITEMS_PER_PAGE) || 1;
  const txStartIndex = (txPage - 1) * ITEMS_PER_PAGE;
  const paginatedTx = filteredTx.slice(txStartIndex, txStartIndex + ITEMS_PER_PAGE);

  // Export transaction ledger to CSV
  const handleExport = () => {
    if (filteredTx.length === 0) {
      showToast("No data to export.", "warning");
      return;
    }
    const headers = ["Date", "Transaction Type", "AWB Number", "Amount Credit/Debit", "Closing Balance", "Description"];
    
    const escapeCsv = (val) => {
      const stringVal = String(val ?? "").replace(/"/g, '""');
      return `"${stringVal}"`;
    };

    const rows = filteredTx.map(tx => {
      const dateStr = tx.date
        ? new Date(tx.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : "—";
      const amtStr = tx.amount > 0 ? `₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`;
      const closingStr = `₹${(tx.closingBalance || 0).toFixed(2)}`;

      return [
        escapeCsv(dateStr),
        escapeCsv(tx.type),
        escapeCsv(tx.awb || "—"),
        escapeCsv(amtStr),
        escapeCsv(closingStr),
        escapeCsv(tx.description)
      ];
    });

    const csvContent = [headers.map(escapeCsv).join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `wallet_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Wallet ledger CSV downloaded successfully!");
  };

  const filteredOrders = orders.filter((o) => {
    // 1. AWB Search
    const matchAwb = !searchAwb || (o.awbNumber && o.awbNumber.toLowerCase().includes(searchAwb.toLowerCase()));
    
    // 2. Date Search
    const oDate = new Date(o.createdAt || o.date);
    const startCompare = new Date(startDate);
    startCompare.setHours(0, 0, 0, 0);
    const endCompare = new Date(endDate);
    endCompare.setHours(23, 59, 59, 999);
    const matchDate = oDate >= startCompare && oDate <= endCompare;

    return matchAwb && matchDate;
  });

  // Shipping charges orders pagination
  const totalOrdersPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const ordersStartIndex = (ordersPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(ordersStartIndex, ordersStartIndex + ITEMS_PER_PAGE);

  const handleExportOrders = () => {
    if (filteredOrders.length === 0) {
      showToast("No data to export.", "warning");
      return;
    }
    const headers = ["Shipment Created", "Courier", "AWB Number", "Status", "Forward Freight", "COD Freight", "RTO Freight", "Extra Wt Freight", "RTO Extra Wt Freight", "Booking Weight"];
    
    const escapeCsv = (val) => {
      const stringVal = String(val ?? "").replace(/"/g, '""');
      return `"${stringVal}"`;
    };

    const rows = filteredOrders.map(o => {
      const forward = o.shippingCharges || 60;
      const cod = o.method === "COD" ? (o.codCharges || 35) : 0;
      const dateStr = new Date(o.createdAt || o.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });

      return [
        escapeCsv(dateStr),
        escapeCsv(o.courier || o.vendor || "Delhivery Surface (DS)"),
        escapeCsv(o.awbNumber || "—"),
        escapeCsv(o.status || "pending pickup"),
        escapeCsv(`₹${forward}`),
        escapeCsv(`₹${cod}`),
        escapeCsv(`₹${o.rtoFreight || 0}`),
        escapeCsv(`₹${o.extraWtFreight || 0}`),
        escapeCsv(`₹${o.rtoExtraWtFreight || 0}`),
        escapeCsv(`${o.weight || 0.5} kg`)
      ];
    });

    const csvContent = [headers.map(escapeCsv).join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `shipping_charges_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Shipping charges CSV downloaded successfully!");
  };

  // Helper render for calendar days
  const renderCalendarDays = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const arr = [];
    for (let i = 0; i < firstDay; i++) {
      arr.push(<div key={`empty-${i}`} className="p-2" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(calYear, calMonth, d);
      const isSelected = (tempStart && tempStart.toDateString() === thisDate.toDateString()) ||
                         (tempEnd && tempEnd.toDateString() === thisDate.toDateString());
      const inRange = tempStart && tempEnd && thisDate > tempStart && thisDate < tempEnd;
      arr.push(
        <button
          key={`day-${d}`}
          type="button"
          onClick={() => handleDateClick(thisDate)}
          className={`p-2 w-full text-center text-xs font-bold rounded-lg cursor-pointer transition ${
            isSelected
              ? "bg-[#25a2fe] text-white"
              : inRange
                ? "bg-blue-50 text-blue-600"
                : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          {d}
        </button>
      );
    }
    return arr;
  };

  return (
    <div className="w-full animate-fadeIn font-sans select-none" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      
      {/* Header and Balance card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Billing & Wallet</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage shipping credits, view charges, and calculate shipping estimations.</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-2 mb-6 shadow-xs flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-500 select-none">
        {["Pricing", "Wallet Transactions", "Shipping Charges"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4.5 py-2.5 rounded-full transition cursor-pointer font-bold text-xs ${
                isActive
                  ? "bg-[#25a2fe] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Expandable filters button - FOR WALLET TRANSACTIONS & SHIPPING CHARGES TAB */}
      {(activeTab === "Wallet Transactions" || activeTab === "Shipping Charges") && (
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
      )}

      {/* Expanded Filters Card block */}
      {(activeTab === "Wallet Transactions" || activeTab === "Shipping Charges") && filtersOpen && (
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

          {/* Category Select Input dropdown */}
          {activeTab === "Wallet Transactions" && (
            <div className="w-full md:w-48">
              <CustomSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="Category"
                options={CATEGORIES}
              />
            </div>
          )}

          {/* Text separator OR */}
          {activeTab === "Wallet Transactions" && (
            <span className="text-slate-400 font-bold text-xs">OR</span>
          )}

          {/* AWB input box */}
          <div className="w-full md:flex-1 relative">
            <input
              type="text"
              value={awbSearch}
              onChange={(e) => setAwbSearch(e.target.value)}
              placeholder="AWB Number"
              className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-350 bg-white font-bold text-slate-700 placeholder-slate-450"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Action buttons Search & Reset */}
          <div className="flex gap-2 w-full md:w-auto shrink-0 select-none">
            <button
              onClick={handleSearchClick}
              className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
            >
              Search
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

      {/* Tab Contents: Pricing */}
      {activeTab === "Pricing" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6.5 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
            <h3 className="text-sm font-bold text-slate-800">Courier Billing Rates</h3>
            <button
              onClick={() => {
                setCalcOpen(true);
                setCalcResults(null);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>B2C Calculator</span>
            </button>
          </div>

          {ratesLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-t-transparent border-[#25a2fe] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                    <th className="py-3.5 px-5">Courier</th>
                    <th className="py-3.5 px-5">Within City</th>
                    <th className="py-3.5 px-5">Within State</th>
                    <th className="py-3.5 px-5">Metro to Metro</th>
                    <th className="py-3.5 px-5">Rest of India</th>
                    <th className="py-3.5 px-5">North East and J&K</th>
                    <th className="py-3.5 px-5">COD Charges</th>
                    <th className="py-3.5 px-5">COD %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-900 select-none">
                  {rates.map((rate, idx) => (
                    <tr key={`${rate.courier}-${rate.id || idx}`} className="hover:bg-slate-50/45 transition">
                      <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">{rate.courier}</td>
                      <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">₹{rate.withinCity}</td>
                      <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">₹{rate.withinState}</td>
                      <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">₹{rate.metroToMetro}</td>
                      <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">₹{rate.restOfIndia}</td>
                      <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">₹{rate.northEastAndJk}</td>
                      <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">₹{rate.codCharges}</td>
                      <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">{rate.codPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-[10px] text-slate-400 italic">
                ℹ Note: All prices are inclusive of GST
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Wallet Transactions (UPDATED EXACT TO USER SCREENSHOT) */}
      {activeTab === "Wallet Transactions" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6.5 shadow-sm animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 select-none">
            <h3 className="text-sm font-bold text-slate-800">Wallet</h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4.5 py-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export</span>
            </button>
          </div>

          {txLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-t-transparent border-[#25a2fe] rounded-full animate-spin" />
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold">
              No transactions found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                      <th className="py-3.5 px-5">DATE</th>
                      <th className="py-3.5 px-5">TRANSACTION TYPE</th>
                      <th className="py-3.5 px-5">AWB NUMBER</th>
                      <th className="py-3.5 px-5">AMOUNT CREDIT/DEBIT</th>
                      <th className="py-3.5 px-5">CLOSING BALANCE</th>
                      <th className="py-3.5 px-5">DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-900 select-none">
                    {paginatedTx.map((tx) => {
                      const isCredit = tx.amount > 0;
                      const typeColors = {
                        shipping: "bg-slate-100 text-slate-600 border border-slate-200",
                        recharge: "bg-emerald-50 text-emerald-600 border border-emerald-200",
                        refund: "bg-amber-50 text-amber-600 border border-amber-200",
                        rto: "bg-rose-50 text-rose-600 border border-rose-200",
                        dispute: "bg-blue-50 text-blue-600 border border-blue-200",
                      };
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/45 transition">
                          <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px] whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })} {new Date(tx.date).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </td>
                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black tracking-wide uppercase ${typeColors[tx.type] || "bg-slate-100 text-slate-600"}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-mono text-[#017cf8] font-bold text-[11.5px] whitespace-nowrap">{tx.awb || "—"}</td>
                          <td className={`py-4 px-5 font-extrabold text-[11.5px] whitespace-nowrap ${isCredit ? "text-emerald-600" : "text-slate-900"}`}>
                            {isCredit ? "+" : "-"}₹{Math.abs(tx.amount).toFixed(0)}
                          </td>
                          <td className="py-4 px-5 font-extrabold text-slate-900 text-[11.5px] whitespace-nowrap">
                            ₹{tx.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-5 font-medium text-slate-800 text-[11.5px]">{tx.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Pagination Controls */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Showing <span className="font-bold text-slate-800">{filteredTx.length > 0 ? txStartIndex + 1 : 0}</span> to{" "}
                  <span className="font-bold text-slate-800">{Math.min(txStartIndex + ITEMS_PER_PAGE, filteredTx.length)}</span> of{" "}
                  <span className="font-bold text-slate-800">{filteredTx.length}</span> transactions
                </div>

                <div className="flex items-center gap-2 select-none">
                  <button
                    onClick={() => setTxPage((p) => Math.max(p - 1, 1))}
                    disabled={txPage === 1}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-slate-600 px-2">
                    Page {txPage} of {totalTxPages}
                  </span>
                  <button
                    onClick={() => setTxPage((p) => Math.min(p + 1, totalTxPages))}
                    disabled={txPage >= totalTxPages}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab Contents: Shipping Charges */}
      {activeTab === "Shipping Charges" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6.5 shadow-sm animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 select-none">
            <h3 className="text-sm font-bold text-slate-800">Shipping Charges</h3>
            <button
              onClick={handleExportOrders}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export</span>
            </button>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-t-transparent border-[#25a2fe] rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold">
              No shipment charges found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                      <th className="py-3.5 px-5">SHIPMENT CREATED</th>
                      <th className="py-3.5 px-5">COURIER</th>
                      <th className="py-3.5 px-5">AWB NUMBER</th>
                      <th className="py-3.5 px-5">STATUS</th>
                      <th className="py-3.5 px-5">FORWARD FREIGHT</th>
                      <th className="py-3.5 px-5">COD FREIGHT</th>
                      <th className="py-3.5 px-5">RTO FREIGHT</th>
                      <th className="py-3.5 px-5">EXTRA WT FREIGHT</th>
                      <th className="py-3.5 px-5">RTO EXTRA WT FREIGHT</th>
                      <th className="py-3.5 px-5">BOOKING WEIGHT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-900 select-none">
                    {paginatedOrders.map((o) => {
                      const forward = o.shippingCharges || 60;
                      const cod = o.method === "COD" ? (o.codCharges || 35) : 0;
                      const statusText = (o.status || "pending pickup").toLowerCase();
                      const statusColors = statusText.includes("deliver") 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-slate-50 text-slate-450 border border-slate-200";

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/45 transition">
                          <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px] whitespace-nowrap">
                            {new Date(o.createdAt || o.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">{o.courier || o.vendor || "Delhivery Surface (DS)"}</td>
                          <td className="py-4 px-5 font-mono text-[#017cf8] font-bold text-[11.5px] whitespace-nowrap">{o.awbNumber || "—"}</td>
                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase border ${statusColors}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">₹{forward}</td>
                          <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">₹{cod}</td>
                          <td className="py-4 px-5 font-bold text-slate-500 text-[11.5px]">₹{o.rtoFreight || 0}</td>
                          <td className="py-4 px-5 font-bold text-slate-500 text-[11.5px]">₹{o.extraWtFreight || 0}</td>
                          <td className="py-4 px-5 font-bold text-slate-500 text-[11.5px]">₹{o.rtoExtraWtFreight || 0}</td>
                          <td className="py-4 px-5 font-bold text-slate-900 text-[11.5px]">{o.weight || 0.5} kg</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Pagination Controls */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Showing <span className="font-bold text-slate-800">{filteredOrders.length > 0 ? ordersStartIndex + 1 : 0}</span> to{" "}
                  <span className="font-bold text-slate-800">{Math.min(ordersStartIndex + ITEMS_PER_PAGE, filteredOrders.length)}</span> of{" "}
                  <span className="font-bold text-slate-800">{filteredOrders.length}</span> shipments
                </div>

                <div className="flex items-center gap-2 select-none">
                  <button
                    onClick={() => setOrdersPage((p) => Math.max(p - 1, 1))}
                    disabled={ordersPage === 1}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-slate-600 px-2">
                    Page {ordersPage} of {totalOrdersPages}
                  </span>
                  <button
                    onClick={() => setOrdersPage((p) => Math.min(p + 1, totalOrdersPages))}
                    disabled={ordersPage >= totalOrdersPages}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* B2C Calculator modal */}
      {calcOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-55 animate-fadeIn select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-6.5 w-full max-w-lg shadow-2xl animate-scaleUp">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <div>
                <h4 className="text-sm font-bold text-slate-900">B2C Calculator</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Calculate shipping costs for B2C orders</p>
              </div>
              <button
                onClick={() => setCalcOpen(false)}
                className="text-slate-450 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {!calcResults ? (
              /* INPUT FORM VIEW */
              <form onSubmit={handleCalculate} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700">Pick-up Pincode</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 201301"
                      value={calcForm.sourcePincode}
                      onChange={(e) => setCalcForm(prev => ({ ...prev, sourcePincode: e.target.value }))}
                      className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700">Delivery Pincode</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 801505"
                      value={calcForm.destPincode}
                      onChange={(e) => setCalcForm(prev => ({ ...prev, destPincode: e.target.value }))}
                      className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700">Weight (Kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2"
                    value={calcForm.weight}
                    onChange={(e) => setCalcForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>

                {/* Dimensions Group */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700">Dimensions (cm)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-400 font-bold">Length</span>
                      <input
                        type="number"
                        required
                        placeholder="3"
                        value={calcForm.length}
                        onChange={(e) => setCalcForm(prev => ({ ...prev, length: e.target.value }))}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-400 font-bold">Width</span>
                      <input
                        type="number"
                        required
                        placeholder="5"
                        value={calcForm.width}
                        onChange={(e) => setCalcForm(prev => ({ ...prev, width: e.target.value }))}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-400 font-bold">Height</span>
                      <input
                        type="number"
                        required
                        placeholder="3"
                        value={calcForm.height}
                        onChange={(e) => setCalcForm(prev => ({ ...prev, height: e.target.value }))}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700">Price (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2000"
                    value={calcForm.collectableAmount}
                    onChange={(e) => setCalcForm(prev => ({ ...prev, collectableAmount: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700">Payment Type</label>
                  <select
                    value={calcForm.type}
                    onChange={(e) => setCalcForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-705 font-bold focus:outline-none focus:border-[#25a2fe] bg-white cursor-pointer shadow-xs"
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="COD">COD (Cash on Delivery)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={calcLoading}
                  className="w-full mt-2 py-3.5 bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {calcLoading ? "Calculating..." : "Calculate"}
                </button>
              </form>
            ) : (
              /* RESULTS TABLE VIEW */
              <div className="flex flex-col animate-fadeIn">
                <button
                  onClick={() => setCalcResults(null)}
                  className="self-start px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer mb-5 shadow-xs"
                >
                  ← Back to Calculator
                </button>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                        <th className="py-3 px-2">S.No</th>
                        <th className="py-3 px-2">Provider</th>
                        <th className="py-3 px-2">Courier Charge</th>
                        <th className="py-3 px-2">COD Charge</th>
                        <th className="py-3 px-2">Total Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold select-none">
                      {calcResults.map((res, index) => (
                        <tr key={res.courier} className="hover:bg-slate-50/30 transition">
                          <td className="py-4.5 px-2 text-slate-400">{index + 1}</td>
                          <td className="py-4.5 px-2 text-slate-900 font-extrabold">{res.courier}</td>
                          <td className="py-4.5 px-2 font-mono">₹{res.freightCharge}</td>
                          <td className="py-4.5 px-2 text-slate-450">
                            {res.codCharge > 0 ? `₹${res.codCharge}` : "N/A"}
                          </td>
                          <td className="py-4.5 px-2 font-mono font-extrabold text-slate-900">
                            ₹{res.totalCharge}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recharge modal */}
      {rechargeOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-55 animate-fadeIn select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-6.5 w-full max-w-sm shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-bold text-slate-900">Recharge Shipping Wallet</h4>
              <button
                onClick={() => setRechargeOpen(false)}
                className="text-slate-450 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRecharge} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-extrabold text-slate-450 uppercase">Amount to Recharge (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#25a2fe]"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRechargeOpen(false)}
                  className="bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 text-[11px] font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rechargeLoading}
                  className="bg-[#25a2fe] hover:bg-[#1f8ce0] text-white text-[11px] font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {rechargeLoading ? "Processing..." : "Recharge Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
