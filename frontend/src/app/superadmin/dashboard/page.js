"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

// Role-specific dashboards (lazy loaded)
const OperationsDashboard = dynamic(() => import("@/components/superadmin/dashboards/OperationsDashboard"), { ssr: false });
const FinanceDashboard    = dynamic(() => import("@/components/superadmin/dashboards/FinanceDashboard"),    { ssr: false });
const KYCDashboard        = dynamic(() => import("@/components/superadmin/dashboards/KYCDashboard"),        { ssr: false });
const SupportDashboard    = dynamic(() => import("@/components/superadmin/dashboards/SupportDashboard"),    { ssr: false });
const TechnicalDashboard  = dynamic(() => import("@/components/superadmin/dashboards/TechnicalDashboard"),  { ssr: false });

const FILTER_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7days", label: "Last 7 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "custom", label: "Custom" },
];

// ── Super Admin Full Dashboard (for SUPER_ADMIN and Custom Role) ───────────────
function SuperAdminFullDashboard() {
  const [selectedFilter, setSelectedFilter] = useState("7days");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Date range states
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });

  // Calendar Base Date (represented by left month displayed)
  const [calendarBaseDate, setCalendarBaseDate] = useState(() => new Date());

  // Temporary selected dates inside modal
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  // Refs for dropdown toggle
  const dropdownRef = useRef(null);

  // Format Date for Display
  const formatDateDisplay = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Helper to calculate date presets
  const getPresetDates = (preset) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (preset) {
      case "today":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "7days":
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "30days":
        start.setDate(now.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
        start.setMonth(now.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setMonth(now.getMonth() - 1);
        end.setDate(lastDay.getDate());
        end.setHours(23, 59, 59, 999);
        break;
      default:
        break;
    }
    return { start, end };
  };

  // Preset Selection Click handler
  const handlePresetSelect = (preset) => {
    setDropdownOpen(false);
    setSelectedFilter(preset);

    if (preset === "custom") {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setCalendarBaseDate(startDate || new Date());
      setCalendarModalOpen(true);
    } else {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch real platform stats from the backend
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["superadminStats", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => {
      const params = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const queryStr = new URLSearchParams(params).toString();
      return api.get(`/admin/dashboard/stats${queryStr ? "?" + queryStr : ""}`).then((res) => res.data || {});
    },
  });

  // Calendar render details
  const renderCalendarMonth = (baseDate, isRight = false) => {
    const targetDate = new Date(baseDate);
    if (isRight) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }
    const year = targetDate.getFullYear();
    const monthIndex = targetDate.getMonth();
    const monthName = targetDate.toLocaleDateString("en-US", { month: "long" });

    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const startOfWeekDay = new Date(year, monthIndex, 1).getDay();

    const days = [];
    // Prefix empty days
    for (let i = 0; i < startOfWeekDay; i++) {
      days.push(null);
    }
    // Fill month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, monthIndex, i));
    }

    const handleDateClick = (clickedDate) => {
      if (!tempStartDate || (tempStartDate && tempEndDate)) {
        setTempStartDate(clickedDate);
        setTempEndDate(null);
      } else if (tempStartDate && !tempEndDate) {
        if (clickedDate >= tempStartDate) {
          setTempEndDate(clickedDate);
        } else {
          setTempStartDate(clickedDate);
          setTempEndDate(null);
        }
      }
    };

    return (
      <div className="space-y-4">
        {/* Month Title */}
        <h4 className="text-xs font-bold text-center text-slate-200">
          {monthName} {year}
        </h4>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] select-none">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((wd) => (
            <span key={wd} className="text-slate-500 font-bold py-1">
              {wd}
            </span>
          ))}

          {days.map((day, idx) => {
            if (!day) return <span key={`empty-${idx}`} className="py-1"></span>;

            const isStart = tempStartDate && day.toDateString() === tempStartDate.toDateString();
            const isEnd = tempEndDate && day.toDateString() === tempEndDate.toDateString();
            const inRange =
              tempStartDate &&
              tempEndDate &&
              day > tempStartDate &&
              day < tempEndDate;

            const isFuture = day > new Date();

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={isFuture}
                onClick={() => handleDateClick(day)}
                className={`py-1.5 rounded-lg font-semibold text-center cursor-pointer transition text-[11px] disabled:text-slate-700 disabled:hover:bg-transparent ${
                  isStart || isEnd
                    ? "bg-indigo-600 text-white font-bold"
                    : inRange
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleApplyCustomDates = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setCalendarModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-slate-800 rounded-lg"></div>
            <div className="h-3 w-64 bg-slate-800 rounded-lg"></div>
          </div>
          <div className="h-9 w-28 bg-slate-800 rounded-xl"></div>
        </div>

        {/* Top Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-[#0d1527] border border-[#1e293b] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-3.5 w-20 bg-slate-800 rounded"></div>
                <div className="h-5 w-5 bg-slate-800 rounded-full"></div>
              </div>
              <div className="h-6 w-12 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 animate-fadeIn">
        <span className="text-4xl">⚠️</span>
        <h3 className="text-sm font-bold text-slate-100">Failed to load Dashboard stats</h3>
        <p className="text-xs text-slate-400 max-w-sm">{error.message || "Please check your network and try again."}</p>
        <button
          onClick={() => refetch()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const {
    metrics = {},
    trendData = [],
    statusChart = [],
    courierPerformance = [],
    financials = {},
    alerts = [],
    recentActivities = [],
    health = {},
  } = data;

  // Formatting helpers
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // SVG Chart Computations
  const maxRevenue = Math.max(...trendData.map((d) => d.revenue), 100);
  const maxOrders = Math.max(...trendData.map((d) => d.orders), 10);
  const chartHeight = 240;
  const chartWidth = 900;
  const paddingX = 50;
  const paddingY = 30;

  // Generate SVG points for lines
  const getPoints = (type) => {
    if (trendData.length === 0) return "";
    const stepX = trendData.length > 1 ? (chartWidth - paddingX * 2) / (trendData.length - 1) : 0;
    return trendData
      .map((d, index) => {
        const x = trendData.length > 1 ? paddingX + index * stepX : chartWidth / 2;
        const maxVal = type === "revenue" ? maxRevenue : maxOrders;
        const val = type === "revenue" ? d.revenue : d.orders;
        const y = chartHeight - paddingY - (val / maxVal) * (chartHeight - paddingY * 2);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const revenuePoints = getPoints("revenue");
  const ordersPoints = getPoints("orders");

  // Filled area path data
  const getAreaPath = (points) => {
    if (!points) return "";
    const firstPoint = points.split(" ")[0];
    const lastPoint = points.split(" ")[points.split(" ").length - 1];
    return `M ${firstPoint.split(",")[0]},${chartHeight - paddingY} L ${points} L ${
      lastPoint.split(",")[0]
    },${chartHeight - paddingY} Z`;
  };

  const revenueAreaPath = getAreaPath(revenuePoints);
  const ordersAreaPath = getAreaPath(ordersPoints);

  // Get display label of selected filter
  const currentFilterLabel =
    selectedFilter === "custom"
      ? `${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`
      : FILTER_PRESETS.find((f) => f.value === selectedFilter)?.label || "Select Date Range";

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Super Admin Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform oversight, transactions, and courier metrics.
          </p>
        </div>
        
        {/* Date Filter & Action Panel */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          {/* Dropdown Toggle Button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-4 py-2 border border-[#1e293b] rounded-xl bg-[#0d1527] hover:bg-[#15203b] transition text-[11px] font-bold text-slate-200 cursor-pointer shadow-sm select-none"
          >
            {/* Calendar Icon */}
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{currentFilterLabel}</span>
            {/* Chevron Arrow */}
            <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Preset Options Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-11 mt-1 w-52 bg-[#0d1527] border border-[#1e293b] rounded-xl shadow-2xl py-1 z-30 text-[11px] font-bold text-slate-200 select-none animate-slideUp">
              {FILTER_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-800 transition cursor-pointer flex items-center justify-between ${
                    selectedFilter === preset.value ? "text-indigo-400 bg-indigo-500/5" : ""
                  }`}
                >
                  <span>{preset.label}</span>
                  {selectedFilter === preset.value && (
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            className="p-2 border border-[#1e293b] rounded-xl bg-[#0d1527] hover:bg-[#15203b] transition cursor-pointer text-slate-400 hover:text-white shadow-sm"
            title="Refresh Data"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* Custom Date Picker Modal Popup */}
      {calendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 shadow-2xl max-w-2xl w-full mx-4 space-y-6">
            
            <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Please select the date range</h3>
              <button
                onClick={() => setCalendarModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Side-by-side Calendar Month Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
              {/* Left Navigate Month Arrow */}
              <button
                onClick={() => {
                  const prev = new Date(calendarBaseDate);
                  prev.setMonth(prev.getMonth() - 1);
                  setCalendarBaseDate(prev);
                }}
                className="absolute left-[-10px] top-[4px] p-1.5 border border-[#1e293b] rounded-lg bg-[#0d1527] hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Month 1 */}
              {renderCalendarMonth(calendarBaseDate, false)}

              {/* Month 2 */}
              {renderCalendarMonth(calendarBaseDate, true)}

              {/* Right Navigate Month Arrow */}
              <button
                onClick={() => {
                  const next = new Date(calendarBaseDate);
                  next.setMonth(next.getMonth() + 1);
                  setCalendarBaseDate(next);
                }}
                className="absolute right-[-10px] top-[4px] p-1.5 border border-[#1e293b] rounded-lg bg-[#0d1527] hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Selected Summary and Confirm Panel */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-[#1e293b]">
              <div className="text-[11px] font-bold text-slate-300">
                Selected:{" "}
                {tempStartDate ? (
                  <span className="text-white">
                    {formatDateDisplay(tempStartDate)}
                    {tempEndDate ? ` to ${formatDateDisplay(tempEndDate)}` : " (Select End Date)"}
                  </span>
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setCalendarModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!tempStartDate || !tempEndDate}
                  onClick={handleApplyCustomDates}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded-xl text-[11px] font-bold text-white transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Row 1 Metrics: Key Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric: Total Sellers */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sellers</span>
            <h3 className="text-xl font-extrabold text-white">{metrics.totalSellers}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>

        {/* Metric: Today's Orders */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {selectedFilter === "today" ? "Today's Orders" : "Orders in Range"}
            </span>
            <h3 className="text-xl font-extrabold text-white">{metrics.todayOrders}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
        </div>

        {/* Metric: Total Shipments */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shipments in Range</span>
            <h3 className="text-xl font-extrabold text-white">{metrics.totalShipments}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        </div>

        {/* Metric: Revenue */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue in Range</span>
            <h3 className="text-xl font-extrabold text-emerald-400">{formatCurrency(metrics.totalRevenue)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Row 2 Metrics: Performance & Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric: Pending KYC */}
        <Link
          href="/superadmin/kyc/pending"
          className="bg-[#0d1527] border border-[#1e293b]/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-200 flex items-center justify-between group"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-400 transition">
              Pending KYC
            </span>
            <h3 className="text-xl font-extrabold text-white">{metrics.pendingKyc}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </Link>

        {/* Metric: Open Tickets */}
        <Link
          href="/superadmin/support/tickets"
          className="bg-[#0d1527] border border-[#1e293b]/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-200 flex items-center justify-between group"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-400 transition">
              Open Tickets
            </span>
            <h3 className="text-xl font-extrabold text-white">{metrics.openTickets}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
        </Link>

        {/* Metric: RTO % */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RTO Rate</span>
            <h3 className="text-xl font-extrabold text-white">{metrics.rtoPercent}%</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 15v-6a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </div>

        {/* Metric: NDR % */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NDR Rate</span>
            <h3 className="text-xl font-extrabold text-white">{metrics.ndrPercent}%</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Row 3: Revenue & Order Trend Chart */}
      <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-3xl p-5.5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5">
          <div>
            <h2 className="text-sm font-bold text-white">Revenue & Order Trend</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Daily billing revenue and order count.</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
              <span className="text-slate-400">Shipping Revenue (₹)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-sky-400 rounded-full inline-block"></span>
              <span className="text-slate-400">Orders Count</span>
            </div>
          </div>
        </div>

        {/* SVG Responsive Area & Line Chart */}
        <div className="relative w-full overflow-x-auto no-scrollbar">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full min-w-[700px] h-[220px] select-none"
          >
            <defs>
              {/* Revenue Area Gradient */}
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
              {/* Orders Area Gradient */}
              <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Explicit Horizontal Grid Lines */}
            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#1e293b" strokeWidth="1" />
            <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#1e293b" strokeWidth="1" />
            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#1e293b" strokeWidth="1" />

            {/* Area Path for Orders */}
            {ordersAreaPath && <path d={ordersAreaPath} fill="url(#ordersGrad)" />}

            {/* Area Path for Revenue */}
            {revenueAreaPath && <path d={revenueAreaPath} fill="url(#revenueGrad)" />}

            {/* Line Path for Revenue */}
            {revenuePoints && (
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={revenuePoints}
              />
            )}

            {/* Line Path for Orders */}
            {ordersPoints && (
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={ordersPoints}
              />
            )}

            {/* Left Y-Axis Label (Shipping Revenue) */}
            <text x={paddingX - 8} y={paddingY + 3} textAnchor="end" className="text-[9px] font-bold fill-slate-500">
              {formatCurrency(maxRevenue)}
            </text>
            <text x={paddingX - 8} y={chartHeight / 2 + 3} textAnchor="end" className="text-[9px] font-bold fill-slate-500">
              {formatCurrency(maxRevenue / 2)}
            </text>
            <text x={paddingX - 8} y={chartHeight - paddingY + 3} textAnchor="end" className="text-[9px] font-bold fill-slate-500">
              ₹0
            </text>

            {/* Right Y-Axis Label (Orders Count) */}
            <text x={chartWidth - paddingX + 8} y={paddingY + 3} textAnchor="start" className="text-[9px] font-bold fill-cyan-400">
              {maxOrders} Orders
            </text>
            <text x={chartWidth - paddingX + 8} y={chartHeight / 2 + 3} textAnchor="start" className="text-[9px] font-bold fill-cyan-500/80">
              {Math.round(maxOrders / 2)}
            </text>
            <text x={chartWidth - paddingX + 8} y={chartHeight - paddingY + 3} textAnchor="start" className="text-[9px] font-bold fill-cyan-600/60">
              0
            </text>

            {/* X-Axis Labels (Dates) & Circles */}
            {trendData.map((d, index) => {
              const stepX = trendData.length > 1 ? (chartWidth - paddingX * 2) / (trendData.length - 1) : 0;
              const x = trendData.length > 1 ? paddingX + index * stepX : chartWidth / 2;

              // Calculate exact y positions
              const ry = chartHeight - paddingY - (d.revenue / maxRevenue) * (chartHeight - paddingY * 2);
              const oy = chartHeight - paddingY - (d.orders / maxOrders) * (chartHeight - paddingY * 2);

              return (
                <g key={index}>
                  <text
                    x={x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="text-[9px] font-bold fill-slate-500"
                  >
                    {d.date}
                  </text>
                  {/* Point circles for Revenue */}
                  <circle cx={x} cy={ry} r="3.5" fill="#0d1527" stroke="#4f46e5" strokeWidth="2" />
                  {/* Point circles for Orders */}
                  <circle cx={x} cy={oy} r="3.5" fill="#0d1527" stroke="#06b6d4" strokeWidth="2" />
                </g>
              );
            })}

            {/* Hover Guideline & Floating Tooltip Card */}
            {hoveredIndex !== null && trendData[hoveredIndex] && (() => {
              const stepX = trendData.length > 1 ? (chartWidth - paddingX * 2) / (trendData.length - 1) : 0;
              const hx = trendData.length > 1 ? paddingX + hoveredIndex * stepX : chartWidth / 2;
              const ry = chartHeight - paddingY - (trendData[hoveredIndex].revenue / maxRevenue) * (chartHeight - paddingY * 2);
              const oy = chartHeight - paddingY - (trendData[hoveredIndex].orders / maxOrders) * (chartHeight - paddingY * 2);
              const isRightHalf = hx > chartWidth / 2;

              return (
                <g>
                  {/* Vertical dotted guideline */}
                  <line
                    x1={hx}
                    y1={paddingY}
                    x2={hx}
                    y2={chartHeight - paddingY}
                    stroke="#4f46e5"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                  {/* Glowing active circle points */}
                  <circle cx={hx} cy={ry} r="5" fill="#4f46e5" opacity="0.4" />
                  <circle cx={hx} cy={oy} r="5" fill="#06b6d4" opacity="0.4" />

                  {/* Tooltip Card Box */}
                  <g transform={`translate(${isRightHalf ? hx - 160 : hx + 15}, ${paddingY + 15})`}>
                    {/* Tooltip Card Border/Background */}
                    <rect
                      width="145"
                      height="65"
                      rx="8"
                      fill="#16203b"
                      stroke="#1e293b"
                      strokeWidth="1.5"
                    />
                    {/* Date Title */}
                    <text x="12" y="16" className="text-[10px] font-black fill-slate-300">
                      {trendData[hoveredIndex].date}
                    </text>
                    {/* Shipping Revenue Dot & Text */}
                    <circle cx="16" cy="32" r="3" fill="#4f46e5" />
                    <text x="24" y="35" className="text-[9.5px] font-semibold fill-slate-400">
                      Revenue:
                    </text>
                    <text x="75" y="35" className="text-[9.5px] font-bold fill-white">
                      {formatCurrency(trendData[hoveredIndex].revenue)}
                    </text>
                    {/* Orders Count Dot & Text */}
                    <circle cx="16" cy="48" r="3" fill="#06b6d4" />
                    <text x="24" y="51" className="text-[9.5px] font-semibold fill-slate-400">
                      Orders:
                    </text>
                    <text x="75" y="51" className="text-[9.5px] font-bold fill-white">
                      {trendData[hoveredIndex].orders} Orders
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* Transparent Hover Columns Triggering tooltips */}
            {trendData.map((_, index) => {
              const stepX = trendData.length > 1 ? (chartWidth - paddingX * 2) / (trendData.length - 1) : 0;
              const x = trendData.length > 1 ? paddingX + index * stepX : chartWidth / 2;
              const colWidth = trendData.length > 1 ? stepX : chartWidth;
              const startX = trendData.length > 1 ? x - stepX / 2 : 0;

              return (
                <rect
                  key={`hover-col-${index}`}
                  x={startX}
                  y={paddingY}
                  width={colWidth}
                  height={chartHeight - paddingY * 2}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Row 4: Status Breakdown & Courier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Shipment Status Chart */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-3xl p-5.5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Shipment Status Breakdown</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Orders count categorized by status.</p>
          </div>

          <div className="space-y-3.5 my-5">
            {statusChart.length === 0 ? (
              <div className="text-center text-[11px] text-slate-400 py-8">No order status data available.</div>
            ) : (
              statusChart.map((s) => {
                const total = statusChart.reduce((sum, item) => sum + item.count, 0);
                const percent = total > 0 ? (s.count / total) * 100 : 0;
                const getStatusColor = (status) => {
                  const val = status.toLowerCase();
                  if (val.includes("deliver")) return "bg-emerald-500";
                  if (val.includes("transit") || val.includes("ship")) return "bg-blue-500";
                  if (val.includes("rto")) return "bg-orange-500";
                  if (val.includes("ndr") || val.includes("fail")) return "bg-red-500";
                  return "bg-slate-400";
                };

                return (
                  <div key={s.status} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-200">
                      <span className="capitalize">{s.status}</span>
                      <span>
                        {s.count} ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getStatusColor(s.status)} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Courier Performance Grid */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-3xl p-5.5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Courier Performance Snap</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Success rates and total load distribution.</p>
          </div>

          <div className="overflow-x-auto no-scrollbar my-3">
            <table className="w-full text-left text-[11px] font-semibold text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2">Partner</th>
                  <th className="py-2 text-center">Shipments</th>
                  <th className="py-2 text-center">Delivered</th>
                  <th className="py-2 text-center">RTO Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {courierPerformance.map((c) => (
                  <tr key={c.courier} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 font-bold text-white">{c.courier}</td>
                    <td className="py-2.5 text-center font-mono">{c.totalShipments}</td>
                    <td className="py-2.5 text-center">
                      <span className="text-emerald-400 font-bold">{c.deliveryRate}%</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="text-rose-400 font-bold">{c.rtoRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 5: Financial Overview & Important Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Financial Overview */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-3xl p-5.5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Financial Overview</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Combined merchant wallets and COD remitted stats.</p>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div className="bg-slate-900/50 p-3 rounded-xl border border-[#1e293b] space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Wallets</span>
              <h4 className="text-xs font-extrabold text-slate-100">{formatCurrency(financials.totalWalletBalance)}</h4>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-[#1e293b] space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">COD Collected</span>
              <h4 className="text-xs font-extrabold text-slate-100">{formatCurrency(financials.codCollected)}</h4>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-[#1e293b] space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">COD Remitted</span>
              <h4 className="text-xs font-extrabold text-slate-100">{formatCurrency(financials.codRemitted)}</h4>
            </div>
          </div>
        </div>

        {/* Important Alerts */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-3xl p-5.5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Important Alerts</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Critical system updates requiring action.</p>
          </div>

          <div className="space-y-2.5">
            {alerts.length === 0 ? (
              <div className="text-center text-[11px] text-slate-400 py-6">All systems nominal. No alerts active.</div>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-[11px] font-semibold ${
                    a.type === "danger"
                      ? "bg-rose-950/20 border-rose-900/40 text-rose-400"
                      : a.type === "warning"
                      ? "bg-amber-950/20 border-amber-900/40 text-amber-400"
                      : "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{a.type === "danger" ? "🚨" : a.type === "warning" ? "⚠️" : "✅"}</span>
                    <span>{a.message}</span>
                  </div>
                  {a.action && (
                    <Link
                      href={a.action}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-2 py-0.5 rounded-lg text-[9px] font-extrabold shadow-sm transition"
                    >
                      Resolve
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 6: Recent Activities & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activities */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-3xl p-5.5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Activity Feed</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time actions occurring across BeeShip.</p>
          </div>

          <div className="space-y-3 pt-1">
            {recentActivities.length === 0 ? (
              <div className="text-center text-[11px] text-slate-400 py-6">No recent activities.</div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="flex gap-2.5 text-[11px] select-none">
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full ring-4 ring-indigo-950/60 mt-1.5 shrink-0" />
                    <div className="w-0.5 flex-1 bg-slate-800" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-300 leading-snug">{act.message}</p>
                    <span className="text-[9.5px] font-bold text-slate-500">
                      {act.date} at {act.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-3xl p-5.5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">System Health & APIs</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Service connections and logistics nodes.</p>
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Core HTTP Server", status: health.apiStatus },
              { label: "PostgreSQL Database", status: health.dbStatus },
              { label: "Redis Buffer Cache", status: health.redisStatus },
              { label: "Active Courier Webhooks", status: `${health.activeCouriers} Nodes Connected` },
            ].map((node) => (
              <div key={node.label} className="flex items-center justify-between text-[11px] font-semibold border-b border-slate-800 pb-2.5 last:border-b-0">
                <span className="text-slate-400">{node.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                  <span className="text-slate-200 font-bold">{node.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// ── Role Router — picks the right dashboard per role ─────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === "Operations Admin") return <OperationsDashboard user={user} />;
  if (role === "Finance Admin")    return <FinanceDashboard    user={user} />;
  if (role === "KYC Admin")        return <KYCDashboard        user={user} />;
  if (role === "Support Admin")    return <SupportDashboard    user={user} />;
  if (role === "Technical Admin")  return <TechnicalDashboard  user={user} />;

  // SUPER_ADMIN and Custom Role see the full dashboard
  return <SuperAdminFullDashboard />;
}
