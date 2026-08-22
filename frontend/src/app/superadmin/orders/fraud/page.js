"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import SectionLayout from "@/components/superadmin/SectionLayout";

const SECTION = {
  title: "Orders Management",
  icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  description: "Monitor and manage orders across all sellers on the platform."
};

const TABS = [
  {
    id: "all",
    label: "All Orders",
    href: "/superadmin/orders/all",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    description: "Complete list of all orders across all sellers."
  },
  {
    id: "fraud",
    label: "Fraud Orders",
    href: "/superadmin/orders/fraud",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    description: "Flagged and potential fraud orders awaiting manual audit."
  },
  {
    id: "disputed",
    label: "Disputed Orders",
    href: "/superadmin/orders/disputed",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5" />
      </svg>
    ),
    description: "Orders with dispute requests or courier claims."
  }
];

export default function FraudOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1, counts: { total: 0, new: 0, processing: 0, delivered: 0, cancelled: 0 } });
  
  // Filtering & searching
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [date, setDate] = useState("");
  
  // Custom select states
  const [statusOpen, setStatusOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Active action rows
  const [activeMenuRow, setActiveMenuRow] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");

  // Status modification overlay
  const [statusUpdateOrder, setStatusUpdateOrder] = useState(null);
  const [newStatusValue, setNewStatusValue] = useState("");

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: "20", tag: "Fraud" });
      if (search) q.append("search", search);
      if (status !== "all") q.append("status", status);
      if (payment !== "all") q.append("payment", payment);
      if (date) q.append("date", date);

      const res = await api.get(`/admin/orders?${q.toString()}`);
      if (res && res.success) {
        setOrders(res.data || []);
        setMeta(res.meta || { total: 0, page: 1, limit: 20, totalPages: 1, counts: { total: 0, new: 0, processing: 0, delivered: 0, cancelled: 0 } });
      }
    } catch (err) {
      console.error("Failed to load admin fraud orders:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, payment, date]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setStatusOpen(false);
        setPaymentOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setPayment("all");
    setDate("");
  };

  const handleUpdateStatus = async (orderId, targetStatus) => {
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, { status: targetStatus });
      if (res && res.success) {
        alert(res.message || "Status updated successfully.");
        fetchOrders(meta.page);
      }
    } catch (err) {
      alert(err.message || "Failed to update status.");
    } finally {
      setStatusUpdateOrder(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await api.post(`/admin/orders/${orderId}/cancel`);
      if (res && res.success) {
        alert(res.message || "Order cancelled successfully.");
        fetchOrders(meta.page);
      }
    } catch (err) {
      alert(err.message || "Failed to cancel order.");
    }
  };

  const exportSingleOrder = (ord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ord, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `order_${ord.orderId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportAllToCSV = () => {
    if (orders.length === 0) return;
    const headers = ["Order ID", "Seller Name", "Seller ID", "Customer Name", "City", "Amount", "Method", "Status", "Date"];
    const rows = orders.map(o => [
      o.orderId,
      o.user ? `${o.user.firstName} ${o.user.lastName}` : "—",
      o.user?.id?.slice(0, 8)?.toUpperCase() || "—",
      o.customer,
      o.city || "—",
      o.amount,
      o.method,
      o.status,
      new Date(o.createdAt).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fraud_orders.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getStatusBadge = (s) => {
    const val = s?.toLowerCase() || "";
    if (val === "new" || val === "pending" || val === "unfulfilled") {
      return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase">New/Pending</span>;
    }
    if (val === "processing") {
      return <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase">Processing</span>;
    }
    if (val === "fulfilled" || val === "delivered") {
      return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase">Delivered</span>;
    }
    if (val === "cancelled") {
      return <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase">Cancelled</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-black uppercase">{s}</span>;
  };

  return (
    <SectionLayout section={SECTION} tabs={TABS}>
      <div className="space-y-6">
        
        {/* Upper Action Bar */}
        <div className="flex justify-between items-center select-none pb-1 border-b border-[#1e293b]/40">
          <div>
            <h2 className="text-sm font-black text-white">Fraud Orders</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Flagged and potential fraud orders awaiting manual audit.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportAllToCSV}
              className="px-3 py-1.5 bg-[#080d1a] hover:bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={() => fetchOrders(meta.page)}
              className="px-3 py-1.5 bg-[#080d1a] hover:bg-[#0f172a] border border-[#1e293b] text-slate-300 hover:text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div ref={dropdownRef} className="flex flex-wrap gap-3 items-center">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[220px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search Order ID, Seller, Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setStatusOpen(!statusOpen); setPaymentOpen(false); }}
              className="px-3.5 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition select-none cursor-pointer"
            >
              <span>Status: {status.toUpperCase()}</span>
              <svg className={`w-3 h-3 transition-transform ${statusOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {statusOpen && (
              <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-[#0b1120] border border-[#1e293b] shadow-xl overflow-hidden z-20">
                {["all", "pending", "processing", "fulfilled", "cancelled"].map((st) => (
                  <button
                    key={st}
                    onClick={() => { setStatus(st); setStatusOpen(false); }}
                    className="w-full text-left px-3.5 py-2 text-[11px] text-slate-300 hover:bg-slate-800/40 hover:text-white transition font-medium cursor-pointer"
                  >
                    {st === "all" ? "All Statuses" : st.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setPaymentOpen(!paymentOpen); setStatusOpen(false); }}
              className="px-3.5 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition select-none cursor-pointer"
            >
              <span>Payment: {payment.toUpperCase()}</span>
              <svg className={`w-3 h-3 transition-transform ${paymentOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {paymentOpen && (
              <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-[#0b1120] border border-[#1e293b] shadow-xl overflow-hidden z-20">
                {["all", "prepaid", "cod"].map((pay) => (
                  <button
                    key={pay}
                    onClick={() => { setPayment(pay); setPaymentOpen(false); }}
                    className="w-full text-left px-3.5 py-2 text-[11px] text-slate-300 hover:bg-slate-800/40 hover:text-white transition font-medium cursor-pointer"
                  >
                    {pay === "all" ? "All Methods" : pay.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          />

          {/* Reset Button */}
          {(search || status !== "all" || payment !== "all" || date) && (
            <button
              onClick={handleReset}
              className="px-3.5 py-2 border border-[#1e293b] text-[10px] font-bold text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Orders Table */}
        <div className="border border-[#1e293b] rounded-xl overflow-hidden bg-[#070b19]/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1e293b] select-none">
                  {["Order ID", "Seller", "Customer", "Amount", "Payment", "Status", "Date", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-slate-500">Loading orders...</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <p className="text-xs font-bold text-slate-500">No fraud orders found matching parameters.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const productsList = ord.products || [];
                    const itemsCount = productsList.reduce((acc, p) => acc + (p.quantity || 1), 0) || (ord.product ? 1 : 0);
                    const formattedDate = new Date(ord.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric"
                    });
                    const formattedTime = new Date(ord.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit", hour12: true
                    });
                    return (
                      <tr key={ord.id} className="border-b border-[#1e293b]/60 hover:bg-white/[0.01] transition-colors relative">
                        {/* Order ID & Items */}
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-bold text-white">#{ord.orderId}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{itemsCount} {itemsCount === 1 ? "Item" : "Items"}</p>
                        </td>
                        {/* Seller */}
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-bold text-slate-300">{ord.user?.companyName || "—"}</p>
                          <p className="text-[9px] font-mono text-slate-500 mt-0.5">ID: {ord.user?.id?.slice(0, 8)?.toUpperCase() || "—"}</p>
                        </td>
                        {/* Customer */}
                        <td className="px-4 py-3">
                          <p className="text-[11px] text-slate-200">{ord.customer}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{ord.city || "—"}</p>
                        </td>
                        {/* Amount */}
                        <td className="px-4 py-3 font-mono text-[11px] font-bold text-white">
                          ₹{ord.amount?.toLocaleString("en-IN")}
                        </td>
                        {/* Payment Method */}
                        <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-400">
                          {ord.method?.toUpperCase()}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(ord.status)}
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-[11px] font-semibold text-slate-300">{formattedDate}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{formattedTime}</p>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuRow(activeMenuRow === ord.id ? null : ord.id)}
                              className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                              </svg>
                            </button>

                            {activeMenuRow === ord.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-[#0c1324] border border-[#1e293b] rounded-xl shadow-xl z-30 py-1.5 overflow-hidden select-none">
                                <button
                                  onClick={() => { setSelectedOrder(ord); setActiveMenuRow(null); setDetailTab("overview"); }}
                                  className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => { setSelectedOrder(ord); setActiveMenuRow(null); setDetailTab("shipment"); }}
                                  className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                  <span>Shipment / Tracking</span>
                                </button>
                                <button
                                  onClick={() => { setSelectedOrder(ord); setActiveMenuRow(null); setDetailTab("timeline"); }}
                                  className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>View Timeline</span>
                                </button>
                                <button
                                  onClick={() => { setStatusUpdateOrder(ord); setNewStatusValue(ord.status); setActiveMenuRow(null); }}
                                  className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition border-t border-[#1e293b]/60 pt-2 mt-1 cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                                  </svg>
                                  <span>Update Status</span>
                                </button>
                                <button
                                  onClick={() => { handleCancelOrder(ord.id); setActiveMenuRow(null); }}
                                  disabled={ord.status?.toLowerCase() === "cancelled"}
                                  className="w-full text-left px-3 py-2 text-[10px] text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-2 transition cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  <span>Cancel Order</span>
                                </button>
                                <button
                                  onClick={() => { exportSingleOrder(ord); setActiveMenuRow(null); }}
                                  className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold flex items-center gap-2 transition border-t border-[#1e293b]/60 pt-2 mt-1 cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span>Export Order</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && meta.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-[#1e293b] select-none text-[11px] text-slate-400">
              <span>
                Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString()}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => fetchOrders(meta.page - 1)}
                  className="px-3 py-1.5 bg-[#080d1a] hover:bg-[#0c1324] border border-[#1e293b] disabled:opacity-30 rounded-xl transition cursor-pointer"
                >
                  ‹ Previous
                </button>
                <span className="px-3 py-1.5 border border-[#1e293b] bg-slate-800/20 text-white font-bold rounded-xl select-none">
                  {meta.page}
                </span>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => fetchOrders(meta.page + 1)}
                  className="px-3 py-1.5 bg-[#080d1a] hover:bg-[#0c1324] border border-[#1e293b] disabled:opacity-30 rounded-xl transition cursor-pointer"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Slide Over Detail Panel ────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-[#080d1a] border-l border-[#1e293b] shadow-2xl h-full flex flex-col animate-slide-in overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  Order #{selectedOrder.orderId}
                  {getStatusBadge(selectedOrder.status)}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Created on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#1e293b] bg-[#0c1324]/40 select-none">
              {["overview", "items", "shipment", "payment", "timeline"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`flex-1 py-3 text-[10px] uppercase tracking-wider font-black transition-all ${
                    detailTab === tab 
                      ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/10"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* 1. Overview Tab */}
              {detailTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Info */}
                  <div className="bg-[#0b1120] border border-[#1e293b]/50 p-4 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Order Info</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">Order ID:</span><span className="text-white font-bold">#{selectedOrder.orderId}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Amount:</span><span className="text-white font-bold">₹{selectedOrder.amount}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Payment:</span><span className="text-slate-300 uppercase">{selectedOrder.method}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">AWB Num:</span><span className="text-slate-300 font-mono">{selectedOrder.awbNumber || "—"}</span></div>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="bg-[#0b1120] border border-[#1e293b]/50 p-4 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Seller Details</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">Company:</span><span className="text-white font-bold">{selectedOrder.user?.companyName || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="text-slate-300">{selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="text-slate-300">{selectedOrder.user?.email || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Mobile:</span><span className="text-slate-300">{selectedOrder.user?.mobile || "—"}</span></div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-[#0b1120] border border-[#1e293b]/50 p-4 rounded-2xl space-y-3 md:col-span-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Customer Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="text-white font-bold">{selectedOrder.customer}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="text-slate-300">{selectedOrder.phone || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Pincode:</span><span className="text-slate-300 font-mono">{selectedOrder.pincode || "—"}</span></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">City:</span><span className="text-slate-300">{selectedOrder.city || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">State:</span><span className="text-slate-300">{selectedOrder.state || "—"}</span></div>
                        <div>
                          <p className="text-slate-500">Delivery Address:</p>
                          <p className="text-slate-200 mt-1 font-medium bg-black/40 p-2 border border-[#1e293b]/40 rounded-xl leading-relaxed">{selectedOrder.address || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Items Tab */}
              {detailTab === "items" && (
                <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#0b1120]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1e293b] select-none text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.products || []).length === 0 ? (
                        <tr>
                          <td className="px-4 py-3 text-white font-semibold">{selectedOrder.product || "General Merchandise"}</td>
                          <td className="px-4 py-3 text-slate-500">—</td>
                          <td className="px-4 py-3 text-center text-slate-300">1</td>
                          <td className="px-4 py-3 text-right text-slate-300">₹{selectedOrder.amount}</td>
                          <td className="px-4 py-3 text-right text-white font-bold">₹{selectedOrder.amount}</td>
                        </tr>
                      ) : (
                        (selectedOrder.products || []).map((prod, idx) => (
                          <tr key={idx} className="border-b border-[#1e293b]/60 text-slate-300">
                            <td className="px-4 py-3 font-bold text-white">{prod.name}</td>
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{prod.sku || "—"}</td>
                            <td className="px-4 py-3 text-center">{prod.quantity}</td>
                            <td className="px-4 py-3 text-right">₹{prod.price}</td>
                            <td className="px-4 py-3 text-right font-bold text-white">₹{prod.price * prod.quantity}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. Shipment Tab */}
              {detailTab === "shipment" && (
                <div className="space-y-6">
                  <div className="bg-[#0b1120] border border-[#1e293b]/50 p-4 rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Logistics Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-500">Courier Partner</p>
                        <p className="text-white font-bold mt-1">{selectedOrder.vendor || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">AWB Tracking Number</p>
                        <p className="text-white font-mono font-bold mt-1">{selectedOrder.awbNumber || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Pickup Warehouse</p>
                        <p className="text-slate-300 mt-1">{selectedOrder.pickupWarehouse || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Weight</p>
                        <p className="text-slate-300 mt-1">{selectedOrder.weight ? `${selectedOrder.weight} kg` : "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500">Dimensions (L x B x H)</p>
                        <p className="text-slate-300 mt-1">
                          {selectedOrder.length || "0"} x {selectedOrder.breadth || "0"} x {selectedOrder.height || "0"} cm
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.awbNumber && (
                    <div className="p-4 border border-[#1e293b] rounded-2xl bg-black/20 flex flex-col gap-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Courier Tracking</p>
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
                        <span className="text-xs text-slate-300">Live courier monitoring updates generated successfully.</span>
                      </div>
                      {selectedOrder.labelUrl && (
                        <a
                          href={selectedOrder.labelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-fit px-4 py-2 mt-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                        >
                          Print Shipping Label
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Payment Tab */}
              {detailTab === "payment" && (
                <div className="bg-[#0b1120] border border-[#1e293b]/50 p-5 rounded-2xl max-w-md mx-auto space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400 border-b border-[#1e293b] pb-2">Payment Summary</h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="text-slate-300 font-mono">₹{(selectedOrder.amount - (selectedOrder.shippingCharges || 0) - (selectedOrder.codCharges || 0) - (selectedOrder.taxAmount || 0) + (selectedOrder.discount || 0)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Shipping Charges</span>
                      <span className="text-slate-300 font-mono">+ ₹{selectedOrder.shippingCharges || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">COD Collection Fee</span>
                      <span className="text-slate-300 font-mono">+ ₹{selectedOrder.codCharges || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GST / Tax</span>
                      <span className="text-slate-300 font-mono">+ ₹{selectedOrder.taxAmount || 0}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1e293b]/50 pb-2">
                      <span className="text-slate-500">Discounts Applied</span>
                      <span className="text-emerald-400 font-mono">- ₹{selectedOrder.discount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black pt-1">
                      <span className="text-white">Grand Total</span>
                      <span className="text-indigo-400 font-mono">₹{selectedOrder.amount?.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Timeline Tab */}
              {detailTab === "timeline" && (
                <div className="p-4 max-w-md mx-auto space-y-6 select-none relative">
                  <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-[#1e293b]" />
                  
                  {/* Step 1 */}
                  <div className="flex items-start gap-4 relative">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-4 border-[#080d1a] z-10 mt-1" />
                    <div>
                      <p className="text-xs font-bold text-white">Order Created</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{new Date(selectedOrder.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4 relative">
                    <div className={`w-3.5 h-3.5 rounded-full border-4 border-[#080d1a] z-10 mt-1 ${selectedOrder.awbNumber ? "bg-emerald-500" : "bg-slate-700"}`} />
                    <div>
                      <p className="text-xs font-bold text-white">Shipped / AWB Assigned</p>
                      {selectedOrder.awbNumber ? (
                        <p className="text-[10px] text-slate-300 mt-1 font-mono">AWB: {selectedOrder.awbNumber}</p>
                      ) : (
                        <p className="text-[10px] text-slate-500 mt-0.5">Awaiting fulfillment</p>
                      )}
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4 relative">
                    <div className={`w-3.5 h-3.5 rounded-full border-4 border-[#080d1a] z-10 mt-1 ${selectedOrder.status?.toLowerCase() === "delivered" || selectedOrder.status?.toLowerCase() === "fulfilled" ? "bg-emerald-500" : "bg-slate-700"}`} />
                    <div>
                      <p className="text-xs font-bold text-white">Delivered</p>
                      {selectedOrder.status?.toLowerCase() === "delivered" || selectedOrder.status?.toLowerCase() === "fulfilled" ? (
                        <p className="text-[10px] text-slate-500 mt-0.5">Delivered to recipient</p>
                      ) : (
                        <p className="text-[10px] text-slate-500 mt-0.5">Out for delivery / pending</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Status Update Modal ─────────────────────────────────────────── */}
      {statusUpdateOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0b1120] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div>
              <h3 className="text-sm font-black text-white">Update Order Status</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Order ID: #{statusUpdateOrder.orderId}</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select New Status</label>
              <div className="space-y-2">
                {[
                  { value: "unfulfilled", label: "New / Pending" },
                  { value: "processing",  label: "Processing" },
                  { value: "fulfilled",   label: "Delivered" },
                  { value: "cancelled",   label: "Cancelled" }
                ].map((s) => (
                  <label key={s.value} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="orderStatusOption"
                      value={s.value}
                      checked={newStatusValue === s.value}
                      onChange={(e) => setNewStatusValue(e.target.value)}
                      className="accent-indigo-500"
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setStatusUpdateOrder(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(statusUpdateOrder.id, newStatusValue)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

    </SectionLayout>
  );
}
