"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import * as XLSX from "xlsx";

import DateFilter from "./DateFilter";
import ShopifyAnalytics from "./home/ShopifyAnalytics";
import CourierPerformance from "./home/CourierPerformance";
import AnalyticsCharts from "./home/AnalyticsCharts";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";

const AddOrderModal = dynamic(() => import("@/components/AddOrderModal"), {
  ssr: false,
});

export default function HomeView({
  user,
  health,
  fetchHealth,
  loadingHealth,
  documents,
  fetchDocuments,
  loadingDocs,
  docCacheHeader,
  fetchingDocsTime,
  title,
  setTitle,
  fileName,
  setFileName,
  mimeType,
  setMimeType,
  fileSize,
  setFileSize,
  uploadResult,
  submittingDoc,
  handleUploadSubmit,
  setActiveTab
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useAuth();
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCSVFile, setSelectedCSVFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvRowsCount, setCsvRowsCount] = useState(0);
  const [csvDragActive, setCsvDragActive] = useState(false);

  // CSV parser and uploader handler
  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!selectedCSVFile) {
      showToast("Please choose a CSV file first.", "error");
      return;
    }
    
    setCsvUploading(true);
    showToast("Processing CSV orders...", "info");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          showToast("CSV file is empty or missing headers.", "error");
          setCsvUploading(false);
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
        const parsedOrders = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = [];
          let currentVal = "";
          let inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentVal.trim());
              currentVal = "";
            } else {
              currentVal += char;
            }
          }
          values.push(currentVal.trim());

          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || "";
          });

          // Normalize values
          const customer = (rowData.customer || rowData.customername || rowData.name || rowData.consignee || "").replace(/^"|"$/g, '').trim();
          const product = (rowData.product || rowData.productname || rowData.item || rowData.description || "").replace(/^"|"$/g, '').trim();
          const amount = parseFloat((rowData.amount || rowData.price || rowData.total || "0").replace(/^"|"$/g, ''));
          
          let method = "COD";
          const payment = (rowData.method || rowData.payment || rowData.paymentmethod || "").replace(/^"|"$/g, '').toLowerCase().trim();
          if (payment.includes("prepaid") || payment === "online" || payment === "card" || payment === "upi") {
            method = "Prepaid";
          }

          let status = "unfulfilled";
          const orderStatus = (rowData.status || "").replace(/^"|"$/g, '').toLowerCase().trim();
          if (["fulfilled", "unfulfilled", "cancelled"].includes(orderStatus)) {
            status = orderStatus;
          }

          if (!customer && !product && isNaN(amount)) continue;

          parsedOrders.push({
            customer: customer || "Guest Customer",
            product: product || "General Merchandise",
            amount: isNaN(amount) || amount <= 0 ? 999 : amount,
            method,
            status
          });
        }

        if (parsedOrders.length === 0) {
          showToast("No valid orders found in CSV file.", "error");
          setCsvUploading(false);
          return;
        }

        const data = await api.post("/orders/bulk", { orders: parsedOrders });
        if (data.success) {
          showToast(`Bulk upload complete! ${data.count} orders successfully imported.`);
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          setUploadModalOpen(false);
          setSelectedCSVFile(null);
        } else {
          showToast("Upload failed: " + data.message, "error");
        }
      } catch (err) {
        console.error("Bulk upload CSV error:", err);
        showToast("Error parsing or uploading CSV file.", "error");
      } finally {
        setCsvUploading(false);
      }
    };
    reader.readAsText(selectedCSVFile);
  };

  const handleCsvDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setCsvDragActive(true);
    } else if (e.type === "dragleave") {
      setCsvDragActive(false);
    }
  };

  const handleCsvDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCsvDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".csv")) {
        setSelectedCSVFile(file);
        parseCSVRowsCount(file);
      } else {
        showToast("Please upload a valid CSV file.", "error");
      }
    }
  };

  const parseCSVRowsCount = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      setCsvRowsCount(Math.max(0, lines.length - 1));
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = (e) => {
    e.preventDefault();
    const csvHeaders = "Customer,Product,Amount,Method,Status";
    const sampleData = "\nJohn Doe,Premium Leather Wallet,1299,COD,unfulfilled\nJane Smith,Wireless Bluetooth Earbuds,2499,Prepaid,unfulfilled";
    const csvContent = csvHeaders + sampleData;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "BeeShip_Bulk_Orders_Template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Template downloaded!");
  };

  const [courierData, setCourierData] = useState([
    { name: "Bluedart Surface (N)", booked: 0, pendingPickup: 0, inTransit: 0, outForDelivery: 0, delivered: 0, rto: 0, exception: 0 },
    { name: "Delhivery Surface (DS)", booked: 0, pendingPickup: 0, inTransit: 0, outForDelivery: 0, delivered: 0, rto: 0, exception: 0 },
    { name: "Xpressbees Surface", booked: 0, pendingPickup: 0, inTransit: 0, outForDelivery: 0, delivered: 0, rto: 0, exception: 0 }
  ]);
  const [ordersList, setOrdersList] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    })(),
    endDate: (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d;
    })()
  });

  // Fetch orders via useQuery
  const { data: rawOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get("/orders").then(res => res.data || []),
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    if (rawOrders) {
      // Filter rawOrders locally by date range
      const filtered = rawOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= selectedDateRange.startDate && orderDate <= selectedDateRange.endDate;
      });

      setOrdersList(filtered);
      
      let bd = { name: "Bluedart Surface (N)", booked: 0, pendingPickup: 0, inTransit: 0, outForDelivery: 0, delivered: 0, rto: 0, exception: 0 };
      let dl = { name: "Delhivery Surface (DS)", booked: 0, pendingPickup: 0, inTransit: 0, outForDelivery: 0, delivered: 0, rto: 0, exception: 0 };
      let xb = { name: "Xpressbees Surface", booked: 0, pendingPickup: 0, inTransit: 0, outForDelivery: 0, delivered: 0, rto: 0, exception: 0 };
      
      filtered.forEach((order, index) => {
        let courier = index % 3 === 0 ? bd : index % 3 === 1 ? dl : xb;
        if (order.status === "unfulfilled") {
          courier.pendingPickup += 1;
        } else if (order.status === "booked") {
          courier.booked += 1;
          courier.inTransit += 1;
        } else if (order.status === "fulfilled" || order.status === "delivered") {
          courier.delivered += 1;
        } else if (order.status === "cancelled") {
          courier.rto += 1;
        }
      });
      
      setCourierData([bd, dl, xb]);
    }
  }, [rawOrders, selectedDateRange]);

  // Modal open states
  const [rateCalcOpen, setRateCalcOpen] = useState(false);

  // Rate calculator states
  const [calcForm, setCalcForm] = useState({
    sourcePincode: "",
    destPincode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    cod: "Prepaid",
    amount: ""
  });
  const [calcResults, setCalcResults] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");

  // Rate calculation submit handler
  const handleCalculateRate = async (e) => {
    e.preventDefault();
    if (!calcForm.sourcePincode || !calcForm.destPincode || !calcForm.weight) {
      alert("Please fill in source, destination pincode, and weight.");
      return;
    }
    setCalcLoading(true);
    setCalcResults(null);
    setCalcError("");
    try {
      const res = await api.post("/billing/calculator", {
        sourcePincode: calcForm.sourcePincode,
        destPincode: calcForm.destPincode,
        weight: calcForm.weight,
        length: calcForm.length || "0",
        width: calcForm.width || "0",
        height: calcForm.height || "0",
        collectableAmount: calcForm.amount || "0",
        type: calcForm.cod
      });
      if (res.success && res.data) {
        setCalcResults(res.data);
      } else {
        setCalcError(res.message || "Failed to calculate rates. Please try again.");
      }
    } catch (err) {
      console.error("Failed to calculate rate:", err);
      setCalcError(err?.response?.data?.message || err?.message || "Failed to calculate rate. Please check details and try again.");
    } finally {
      setCalcLoading(false);
    }
  };

  // Disable background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = addOrderOpen || uploadModalOpen || rateCalcOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [addOrderOpen, uploadModalOpen, rateCalcOpen]);

  // Fetch featured coupon, active push broadcast, and first-time user status
  const [pushDismissed, setPushDismissed] = useState(false);
  const { openRechargeModal } = useDashboard();
  const { data: couponData } = useQuery({
    queryKey: ["featuredCoupon"],
    queryFn: () => api.get("/coupons/featured").then(res => res.data || {}),
    staleTime: 30 * 1000,
  });

  const { data: pushData } = useQuery({
    queryKey: ["activePushBroadcast"],
    queryFn: () => api.get("/notification-settings/active-push").then(res => res.data || null),
    staleTime: 15 * 1000,
  });

  const activePush = pushData && !pushDismissed ? pushData : null;
  const welcomeOfferBonus = couponData?.welcomeOfferBonus || 100;
  const isFirstTimeUser = (couponData?.isFirstTimeUser ?? false) && welcomeOfferBonus > 0;
  const featuredCoupon = couponData?.featuredCoupon || null;

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn font-sans">
      {/* ─── COUPON & PUSH ANNOUNCEMENT BANNERS SECTION ───────────────────────── */}
      <div className="flex flex-col gap-3 w-full">
        {/* 0. Active System Push Broadcast Announcement Banner */}
        {activePush && (
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4.5 rounded-2xl shadow-lg border border-blue-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                📢
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">System Announcement</span>
                  <span className="text-[10px] font-semibold text-blue-100 font-mono">
                    {new Date(activePush.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold tracking-wide mt-0.5">
                  {activePush.subject}
                </h3>
                <p className="text-xs text-blue-100 mt-1 font-medium leading-relaxed">
                  {activePush.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPushDismissed(true)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 self-start sm:self-center"
            >
              Dismiss ✕
            </button>
          </div>
        )}

        {/* 1. First-Time User Welcome Offer Flash Banner (Auto-Applies on 1st Recharge, disappears on 1st recharge) */}
        {isFirstTimeUser && (
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4.5 rounded-2xl shadow-lg border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                🎁
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">First Recharge Special</span>
                  <span className="text-[10px] font-semibold text-emerald-100">Limited Time</span>
                </div>
                <h3 className="text-sm font-extrabold tracking-wide mt-0.5">
                  Get <span className="text-amber-300 font-black">₹{welcomeOfferBonus} Extra Bonus</span> automatically on your 1st wallet recharge!
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:block bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-50 select-none">
                ✨ Auto-applies
              </div>
              <button
                type="button"
                onClick={() => openRechargeModal("WELCOME100")}
                className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Recharge Now</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 2. Custom Featured Promo Coupon Flash Banner (With Apply Button) */}
        {featuredCoupon && (
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white p-4.5 rounded-2xl shadow-lg border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">Featured Promo</span>
                  <span className="font-mono text-xs font-black text-amber-300 bg-white/10 px-2 py-0.5 rounded">CODE: {featuredCoupon.code}</span>
                </div>
                <h3 className="text-sm font-extrabold tracking-wide mt-0.5">
                  {featuredCoupon.title || "Special Recharge Offer"} — Use code <span className="text-amber-300">{featuredCoupon.code}</span> for extra bonus!
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openRechargeModal(featuredCoupon.code)}
              className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>Apply Coupon</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Home Header with DateFilter at Top Right */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Welcome, {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "User"}
          </h2>
          <p className="text-xs text-slate-550">Monitor your shipping stats, system health services, and database logs.</p>
        </div>
        <DateFilter onChange={(range) => setSelectedDateRange({ startDate: range.startDate, endDate: range.endDate })} />
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full select-none">
        {/* Create Shipment */}
        <div 
          onClick={() => setAddOrderOpen(true)}
          className="flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-350 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25a2fe]/10 flex items-center justify-center text-[#25a2fe] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 leading-tight">Create Shipment</h4>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-medium">Create new shipment in seconds</p>
            </div>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Bulk Upload */}
        <div 
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-355 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25a2fe]/10 flex items-center justify-center text-[#25a2fe] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 leading-tight">Bulk Upload</h4>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-medium">Upload multiple orders at once</p>
            </div>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Rate Calculator */}
        <div 
          onClick={() => setRateCalcOpen(true)}
          className="flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-355 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25a2fe]/10 flex items-center justify-center text-[#25a2fe] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 leading-tight">Rate Calculator</h4>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-medium">Compare courier rates and save more</p>
            </div>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Track Shipment */}
        <div 
          onClick={() => setActiveTab ? setActiveTab("ndr") : router.push("/ndr")}
          className="flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-355 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25a2fe]/10 flex items-center justify-center text-[#25a2fe] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 leading-tight">Track Shipment</h4>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-medium">Track real-time status of shipments</p>
            </div>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>

      </div>

      {/* Shopify Analytics Dashboard Row (Encapsulated Component) */}
      <ShopifyAnalytics orders={ordersList} loading={loadingOrders} />

      {/* Courier Performance Section (Encapsulated Component) */}
      <CourierPerformance courierData={courierData} />

      {/* Analytics Doughnut Charts Row (Encapsulated Component) */}
      <AnalyticsCharts courierData={courierData} />



      {/* Rate Calculator Modal */}
      {rateCalcOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={() => { setRateCalcOpen(false); setCalcResults(null); setCalcError(""); }} />
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-slideUp font-sans" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">B2C Rate Calculator</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Estimate shipping courier charges instantly</p>
              </div>
              <button 
                onClick={() => { setRateCalcOpen(false); setCalcResults(null); setCalcError(""); }}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!calcResults ? (
              <form onSubmit={handleCalculateRate} className="p-6 flex flex-col gap-4">
                {calcError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold">
                    {calcError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Pick-up Pincode</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 110001" 
                      value={calcForm.sourcePincode}
                      onChange={(e) => setCalcForm(prev => ({ ...prev, sourcePincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#25a2fe] transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Delivery Pincode</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 400001" 
                      value={calcForm.destPincode}
                      onChange={(e) => setCalcForm(prev => ({ ...prev, destPincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#25a2fe] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.1"
                    required 
                    placeholder="e.g. 0.5" 
                    value={calcForm.weight}
                    onChange={(e) => setCalcForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#25a2fe] transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Dimensions (cm)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">Length</span>
                      <input 
                        type="number" required placeholder="10"
                        value={calcForm.length}
                        onChange={(e) => setCalcForm(prev => ({ ...prev, length: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#25a2fe] transition"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">Width</span>
                      <input 
                        type="number" required placeholder="10"
                        value={calcForm.width}
                        onChange={(e) => setCalcForm(prev => ({ ...prev, width: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#25a2fe] transition"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">Height</span>
                      <input 
                        type="number" required placeholder="10"
                        value={calcForm.height}
                        onChange={(e) => setCalcForm(prev => ({ ...prev, height: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#25a2fe] transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Price (INR)</label>
                    <input 
                      type="number" required placeholder="e.g. 2000"
                      value={calcForm.collectableAmount}
                      onChange={(e) => setCalcForm(prev => ({ ...prev, collectableAmount: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#25a2fe] transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Payment Type</label>
                    <select 
                      value={calcForm.type}
                      onChange={(e) => setCalcForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#25a2fe] transition appearance-none cursor-pointer"
                    >
                      <option value="Prepaid">Prepaid</option>
                      <option value="COD">COD (Cash on Delivery)</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={calcLoading}
                  className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {calcLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Calculating...
                    </>
                  ) : "Calculate Delivery Rates"}
                </button>
              </form>
            ) : (
              /* Results Table */
              <div className="p-6 flex flex-col gap-4 animate-fadeIn">
                <button
                  onClick={() => setCalcResults(null)}
                  className="self-start px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  ← Back
                </button>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                        <th className="py-3 px-2">Provider</th>
                        <th className="py-3 px-2">Courier Charge</th>
                        <th className="py-3 px-2">COD Charge</th>
                        <th className="py-3 px-2">Total Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {calcResults.map((res) => (
                        <tr key={res.courier} className="hover:bg-slate-50/30 transition">
                          <td className="py-3.5 px-2 font-bold text-slate-900">{res.courier}</td>
                          <td className="py-3.5 px-2 font-mono">₹{res.freightCharge}</td>
                          <td className="py-3.5 px-2 text-slate-450">{res.codCharge > 0 ? `₹${res.codCharge}` : "N/A"}</td>
                          <td className="py-3.5 px-2 font-mono font-extrabold text-[#25a2fe]">₹{res.totalCharge}</td>
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


    {/* Add New Order Modal */}
      <AddOrderModal
        isOpen={addOrderOpen}
        onClose={() => setAddOrderOpen(false)}
        onSubmitSuccess={(createdOrder, isOffline) => {
          showToast(isOffline ? "Order created successfully (Offline fallback)!" : "Order created successfully!");
          setAddOrderOpen(false);
          router.push("/orders");
        }}
        orderToEdit={null}
      />

      {/* CSV Bulk Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={() => setUploadModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-slideUp font-sans">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Bulk Upload Orders</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Upload sales orders list using a spreadsheet CSV template</p>
              </div>
              <button 
                onClick={() => setUploadModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCSVUpload} className="p-6 flex flex-col gap-5">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                id="order-csv-file-home" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedCSVFile(e.target.files[0]);
                    parseCSVRowsCount(e.target.files[0]);
                  }
                }}
              />
              
              <div 
                onDragEnter={handleCsvDrag}
                onDragOver={handleCsvDrag}
                onDragLeave={handleCsvDrag}
                onDrop={handleCsvDrop}
                onClick={() => document.getElementById("order-csv-file-home").click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  csvDragActive 
                    ? "border-blue-500 bg-blue-50/50" 
                    : "border-slate-200 hover:border-slate-350"
                }`}
              >
                {!selectedCSVFile ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Choose CSV file or drag it here</p>
                      <p className="text-[10px] text-slate-400 mt-1">Accepts only standard CSV templates (.csv)</p>
                    </div>
                    <label 
                      htmlFor="order-csv-file-home" 
                      onClick={(e) => e.stopPropagation()} 
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 transition text-[10px] font-bold text-slate-700 rounded-xl cursor-pointer mt-1"
                    >
                      Browse File
                    </label>
                  </>
                ) : (
                  <div className="w-full flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-100">
                      CSV
                    </div>
                    <div className="max-w-full">
                      <p className="text-xs font-bold text-slate-800 truncate px-2">{selectedCSVFile.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {(selectedCSVFile.size / 1024).toFixed(2)} KB • {csvRowsCount} orders detected
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCSVFile(null);
                        setCsvRowsCount(0);
                        document.getElementById("order-csv-file-home").value = "";
                      }}
                      className="mt-2 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-rose-600 rounded-lg transition"
                    >
                      Remove File
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-[10px] text-slate-500 font-semibold leading-relaxed">
                <span>Need sample CSV format?</span>
                <a 
                  href="#" 
                  onClick={downloadCSVTemplate}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Download Template
                </a>
              </div>

              <button 
                type="submit"
                disabled={csvUploading || !selectedCSVFile}
                className={`w-full py-3 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                  csvUploading || !selectedCSVFile
                    ? "bg-slate-350 cursor-not-allowed shadow-none"
                    : "bg-[#013c9c] hover:bg-[#002f80]"
                }`}
              >
                {csvUploading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload & Process Orders</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
