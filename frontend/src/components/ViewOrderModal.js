"use client";

import { useEffect } from "react";

export default function ViewOrderModal({ isOpen, onClose, order }) {
  // Lock background scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !order) return null;

  // Calculate items subtotal dynamically (real subtotal sum of products)
  const subtotal = order.products && Array.isArray(order.products) && order.products.length > 0 
    ? order.products.reduce((acc, p) => acc + (parseFloat(p.price || 0) * (p.quantity || p.qty || 1)), 0) 
    : (order.amount - (order.shippingCharges || 0) - (order.codCharges || 0) + (order.discount || 0) - (order.taxAmount || 0));

  // Helper to format currency
  const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return `₹${num.toLocaleString("en-IN")}`;
  };

  // Helper to format date as DD-MM-YYYY, HH:MM
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const pad = (n) => n.toString().padStart(2, '0');
    
    // Check if the date string has a time component (contains 'T' or ':')
    const hasTime = dateStr.toString().includes("T") || dateStr.toString().includes(":");
    if (hasTime) {
      return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  };

  const statusColors = {
    unfulfilled: "bg-amber-50 border-amber-200 text-amber-600",
    fulfilled: "bg-emerald-50 border-emerald-200 text-emerald-600",
    cancelled: "bg-rose-50 border-rose-200 text-rose-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl z-10 border border-slate-150 animate-scaleUp font-sans flex flex-col max-h-[85vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            Order Details <span className="text-slate-400 font-medium ml-1.5">{order.id}</span>
          </h2>
          <span
            className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${
              statusColors[order.status] || "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="p-8 overflow-y-auto flex flex-col gap-6 no-scrollbar">
          
          {/* Top Summary Header Grid */}
          <div className="grid grid-cols-4 gap-4 bg-slate-50/50 border border-slate-150 rounded-2xl p-5 text-xs font-semibold">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Date</p>
              <p className="text-slate-800 font-bold mt-1.5">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Method</p>
              <p className="text-slate-800 font-bold mt-1.5">{order.method || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Channel Name</p>
              <p className="text-slate-800 font-bold mt-1.5">
                {order.tags && order.tags.includes("Shopify") ? "Shopify Store" : "Manual Store"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Status</p>
              <p className="text-slate-800 font-bold mt-1.5">
                {order.status === "fulfilled" || order.status === "booked" 
                  ? "Booked" 
                  : order.status === "unfulfilled" 
                  ? "Pending" 
                  : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Customer, Shipping & Products */}
            <div className="col-span-12 md:col-span-7 flex flex-col gap-6">
              
              {/* Customer / Shipping Details Card */}
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Customer & Shipping Details
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs font-medium text-slate-600">
                  <div>
                    <p className="text-[10px] text-slate-400">Customer Name</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{order.customer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Phone Number</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{order.phone || "—"}</p>
                  </div>
                  {order.companyName && (
                    <div>
                      <p className="text-[10px] text-slate-400">Company Name</p>
                      <p className="text-slate-800 font-bold mt-0.5">{order.companyName}</p>
                    </div>
                  )}
                  {order.gstNumber && (
                    <div>
                      <p className="text-[10px] text-slate-400">GST Number</p>
                      <p className="text-slate-800 font-bold mt-0.5">{order.gstNumber}</p>
                    </div>
                  )}
                  <div className="col-span-2 border-t border-slate-100 pt-3">
                    <p className="text-[10px] text-slate-400">Delivery Address</p>
                    <p className="text-slate-800 leading-relaxed font-bold mt-0.5 uppercase text-[11px]">
                      {order.address}
                    </p>
                  </div>
                  {order.city && (
                    <div>
                      <p className="text-[10px] text-slate-400">City / State</p>
                      <p className="text-slate-800 font-bold mt-0.5">{order.city}, {order.state}</p>
                    </div>
                  )}
                  {order.pincode && (
                    <div>
                      <p className="text-[10px] text-slate-400">Pincode</p>
                      <p className="text-slate-800 font-bold mt-0.5">{order.pincode}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Billing Details Card */}
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Billing Details</span>
                  {order.billingSame && (
                    <span className="bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-full text-[9px] text-blue-600 font-bold lowercase tracking-normal">
                      same as shipping
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs font-medium text-slate-600">
                  <div>
                    <p className="text-[10px] text-slate-400">Billing Customer Name</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{order.customer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Billing Phone</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">
                      {order.billingSame ? order.phone : order.billingPhone || "—"}
                    </p>
                  </div>
                  
                  {((order.billingSame && order.companyName) || (!order.billingSame && order.billingCompanyName)) && (
                    <div>
                      <p className="text-[10px] text-slate-400">Billing Company</p>
                      <p className="text-slate-800 font-bold mt-0.5">
                        {order.billingSame ? order.companyName : order.billingCompanyName}
                      </p>
                    </div>
                  )}

                  {((order.billingSame && order.gstNumber) || (!order.billingSame && order.billingGstNumber)) && (
                    <div>
                      <p className="text-[10px] text-slate-400">Billing GST</p>
                      <p className="text-slate-800 font-bold mt-0.5">
                        {order.billingSame ? order.gstNumber : order.billingGstNumber}
                      </p>
                    </div>
                  )}

                  <div className="col-span-2 border-t border-slate-100 pt-3">
                    <p className="text-[10px] text-slate-400">Billing Address</p>
                    <p className="text-slate-800 leading-relaxed font-bold mt-0.5 uppercase text-[11px]">
                      {order.billingSame ? order.address : order.billingAddress}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">City / State</p>
                    <p className="text-slate-800 font-bold mt-0.5">
                      {order.billingSame 
                        ? `${order.city || ""}, ${order.state || ""}` 
                        : `${order.billingCity || ""}, ${order.billingState || ""}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">Pincode</p>
                    <p className="text-slate-800 font-bold mt-0.5">
                      {order.billingSame ? order.pincode : order.billingPincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Products Table Card */}
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Items Summary
                </h3>
                {order.products && order.products.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-[10px] uppercase">
                          <th className="py-2.5 px-4">Product Name</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-4 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {order.products.map((item, index) => (
                          <tr key={index}>
                            <td className="py-3 px-4 font-bold text-slate-800">{item.name || item.title || "—"}</td>
                            <td className="py-3 px-3">{item.sku || "—"}</td>
                            <td className="py-3 px-3 text-center font-bold">{item.quantity || item.qty || 1}</td>
                            <td className="py-3 px-4 text-right font-extrabold">{formatCurrency(item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-slate-150 rounded-xl p-3 bg-white flex justify-between items-center text-xs font-semibold text-slate-700">
                    <div>
                      <p className="font-bold text-slate-800">{order.product}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">SKU: {order.sku || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-slate-800">{formatCurrency(order.amount)}</p>
                      <p className="text-[10px] text-slate-450 mt-0.5">Qty: {order.qty || 1}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column - Pricing Summary & Package Details */}
            <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
              
              {/* Order / Pricing Summary Card */}
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Order & Pricing Summary
                </h3>
                <div className="flex flex-col gap-3.5 text-xs font-medium text-slate-600">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <p className="text-slate-400">Payment Method</p>
                    <span className={`px-2 py-0.5 border rounded-md font-bold text-[9px] ${
                      order.method === "COD" 
                        ? "bg-orange-50 border-orange-200 text-orange-600" 
                        : "bg-blue-50 border-blue-200 text-blue-600"
                    }`}>
                      {order.method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Subtotal (Items Price)</p>
                    <p className="text-slate-800 font-bold">{formatCurrency(subtotal)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Shipping Charges</p>
                    <p className="text-slate-800 font-bold">{formatCurrency(order.shippingCharges)}</p>
                  </div>
                  {order.method === "COD" && (
                    <div className="flex justify-between">
                      <p className="text-slate-400">COD Charges</p>
                      <p className="text-slate-800 font-bold">{formatCurrency(order.codCharges)}</p>
                    </div>
                  )}
                  <div className="flex justify-between text-rose-500 font-semibold">
                    <p className="text-slate-400">Discount</p>
                    <p>-{formatCurrency(order.discount)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-slate-400">Tax / GST Amount</p>
                    <p className="text-slate-800 font-bold">{formatCurrency(order.taxAmount)}</p>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-sm">
                    <p className="text-slate-900 font-bold">Total Amount</p>
                    <p className="text-slate-900 font-extrabold text-sm">
                      {formatCurrency(order.amount)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-150 pt-3 text-sm">
                    <p className="text-slate-900 font-bold">Collectable Amount</p>
                    <p className="text-emerald-600 font-extrabold text-base">
                      {formatCurrency(order.method === "COD" ? order.collectableAmount || order.amount : 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package & Weight Dimensions Card */}
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Package Dimensions & Weight
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                  <div>
                    <p className="text-[10px] text-slate-400">Physical Weight</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{order.weight ?? 0.0} kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Dimensions (L x B x H)</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">
                      {order.length || "0"} x {order.breadth || "0"} x {order.height || "0"} cm
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Tags Card */}
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Assigned Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {order.tags && order.tags.length > 0 ? (
                    order.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] text-slate-600 font-bold flex items-center gap-1.5"
                      >
                        <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 002.122 0l4.318-4.318a1.5 1.5 0 000-2.122L11.16 3.659A2.25 2.25 0 009.568 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5z" />
                        </svg>
                        <span>{tag}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold italic">No tags assigned to this order.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/40 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#1e293b] text-white rounded-lg px-6 py-2.5 text-xs font-bold hover:bg-slate-800 hover:-translate-y-[1px] active:translate-y-0 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
