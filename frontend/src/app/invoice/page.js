"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

function InvoicePrintContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [invoiceSettings, setInvoiceSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to map Indian State to standard State Code
  const getStateCode = (stateName) => {
    const s = (stateName || "").toLowerCase().trim();
    if (s.includes("jammu") || s.includes("kashmir")) return "01";
    if (s.includes("himachal")) return "02";
    if (s.includes("punjab")) return "03";
    if (s.includes("chandigarh")) return "04";
    if (s.includes("uttarakhand")) return "05";
    if (s.includes("haryana")) return "06";
    if (s.includes("delhi")) return "07";
    if (s.includes("rajasthan")) return "08";
    if (s.includes("uttar") || s.includes("up")) return "09";
    if (s.includes("bihar")) return "10";
    if (s.includes("sikkim")) return "11";
    if (s.includes("arunachal")) return "12";
    if (s.includes("nagaland")) return "13";
    if (s.includes("manipur")) return "14";
    if (s.includes("mizoram")) return "15";
    if (s.includes("tripura")) return "16";
    if (s.includes("meghalaya")) return "17";
    if (s.includes("assam")) return "18";
    if (s.includes("west") || s.includes("bengal")) return "19";
    if (s.includes("jharkhand")) return "20";
    if (s.includes("odisha") || s.includes("orissa")) return "21";
    if (s.includes("chhattisgarh")) return "22";
    if (s.includes("madhya") || s.includes("mp")) return "23";
    if (s.includes("gujarat")) return "24";
    if (s.includes("daman") || s.includes("diu")) return "25";
    if (s.includes("dadra")) return "26";
    if (s.includes("maharashtra")) return "27";
    if (s.includes("andhra")) return "28";
    if (s.includes("karnataka")) return "29";
    if (s.includes("goa")) return "30";
    if (s.includes("lakshadweep")) return "31";
    if (s.includes("kerala")) return "32";
    if (s.includes("tamil") || s.includes("nadu")) return "33";
    if (s.includes("puducherry") || s.includes("pondicherry")) return "34";
    if (s.includes("telangana")) return "36";
    return "09";
  };

  useEffect(() => {
    const loadInvoiceData = async () => {
      const idsParam = searchParams.get("ids");
      if (!idsParam) { setLoading(false); return; }
      try {
        const idList = idsParam.split(",");
        const [profileRes, settingsRes, warehouseRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/invoice-settings"),
          api.get("/warehouse")
        ]);
        if (profileRes.success) setUserProfile(profileRes.data);
        if (settingsRes.success) setInvoiceSettings(settingsRes.data);
        if (warehouseRes.success) setWarehouses(warehouseRes.data);

        const orderPromises = idList.map(id => api.get(`/orders/${id}`));
        const orderResults = await Promise.allSettled(orderPromises);
        const fetchedOrders = [];
        orderResults.forEach(res => {
          if (res.status === "fulfilled" && res.value?.success) {
            fetchedOrders.push(res.value.data);
          }
        });
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Failed to load invoice print data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInvoiceData();
  }, [searchParams]);

  useEffect(() => {
    if (!loading && orders.length > 0) {
      const timer = setTimeout(() => { window.print(); }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, orders]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-sans font-semibold text-slate-400 text-xs">
        Preparing invoices for print...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-sans gap-3">
        <span className="text-slate-400 text-xs font-semibold">No order invoices found to print.</span>
        <button onClick={() => window.close()} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer">
          Close Window
        </button>
      </div>
    );
  }

  const isThermal = invoiceSettings?.pageSize === "4x6";

  return (
    <>
      {/* Dynamic Printing CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .invoice-page {
            display: block !important;
            page-break-after: always !important;
            break-after: always !important;
            box-shadow: none !important;
            border: 1px solid black !important;
            margin: 0 auto !important;
            padding: ${isThermal ? "4mm" : "6mm 8mm"} !important;
            width: ${isThermal ? "92mm" : "200mm"} !important;
            height: ${isThermal ? "142mm" : "auto"} !important;
            position: relative !important;
          }
          @page {
            size: ${isThermal ? "4in 6in" : "A4 portrait"};
            margin: 5mm !important;
          }
        }
      `}} />

      <div className="bg-slate-100 min-h-screen py-6 print:bg-white print:py-0 font-sans text-slate-900 select-text flex flex-col items-center gap-4 print:gap-0">
        {orders.map((order) => {
          const matchedWarehouse = warehouses.find(w => w.name === order.pickupWarehouse) || warehouses[0] || {};
          const prefix = invoiceSettings?.invoicePrefix || "";
          const displayInvoiceNo = `${prefix}${order.orderId}`;
          const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
            year: "numeric", month: "short", day: "numeric"
          });

          const orderProducts = order.products && order.products.length > 0
            ? order.products.map(item => ({
                title: item.title || item.name || "Product Item",
                qty: item.qty || item.quantity || 1,
                price: item.price || 0,
                sku: item.sku || ""
              }))
            : [{
                title: order.product || "Product Item",
                qty: 1,
                price: order.amount || 0,
                sku: ""
              }];

          const shippingTotal = typeof order.shippingCharges === "number" ? order.shippingCharges : (order.shippingCharges ? parseFloat(order.shippingCharges) : 0);
          const shippingRate = shippingTotal > 0 ? (shippingTotal / 1.18).toFixed(2) : "0.00";
          const shippingTax = shippingTotal > 0 ? (shippingTotal - parseFloat(shippingRate)).toFixed(2) : "0.00";
          const productsSubtotal = orderProducts.reduce((acc, p) => acc + (p.price * p.qty), 0);
          const grandTotal = order.amount || (productsSubtotal + shippingTotal);
          const discountVal = order.discount || Math.max(0, (productsSubtotal + shippingTotal) - grandTotal);
          const hasShipping = shippingTotal > 0;

          if (isThermal) {
            // ── THERMAL 4×6 layout (unchanged compact style) ──────────────────
            return (
              <div
                key={order.id}
                className="invoice-page bg-white border border-black shadow-md print:shadow-none print:rounded-none flex flex-col font-sans text-[10px] w-[4in] min-h-[6in] p-4 gap-2.5"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-1">
                  <div>
                    {invoiceSettings?.showCompanyName && (
                      invoiceSettings.logoUrl
                        ? <img src={invoiceSettings.logoUrl} alt="Logo" className="h-6 max-w-[120px] object-contain" />
                        : <span className="font-extrabold tracking-wider text-slate-900 uppercase text-sm">
                            {userProfile?.companyName || "COMPANY"}
                            <span className="text-[7px] align-top">TM</span>
                          </span>
                    )}
                  </div>
                  <div className="text-right">
                    <h1 className="font-bold text-black text-lg leading-none mb-1">INVOICE</h1>
                    <div className="flex flex-col gap-0 text-[8.5px] text-black">
                      <span><span className="font-bold">Invoice #:</span> {displayInvoiceNo}</span>
                      <span><span className="font-bold">Date:</span> {formattedDate}</span>
                    </div>
                  </div>
                </div>
                <div className="border-b border-black mb-1" />
                {/* Addresses */}
                <div className="grid grid-cols-2 gap-2 text-[8.5px] text-black mb-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold border-b border-black pb-0.5 mb-0.5">Bill To:</span>
                    {!invoiceSettings?.hideConsigneeAddress ? (
                      <>
                        <span className="font-bold">{order.customer}</span>
                        <span className="leading-tight text-slate-700 max-w-[140px]">{order.address}, {order.city}, {order.state} - {order.pincode}</span>
                        <span>Ph: {order.phone}</span>
                      </>
                    ) : <span className="italic text-slate-400">Address Hidden</span>}
                  </div>
                  <div className="flex flex-col gap-0.5 text-right items-end">
                    <span className="font-bold border-b border-black pb-0.5 mb-0.5 w-full text-right">Sold By:</span>
                    {!invoiceSettings?.hideWarehouseAddress ? (
                      <>
                        <span className="font-bold">{matchedWarehouse.name || userProfile?.companyName}</span>
                        <span className="leading-tight text-slate-700 text-right max-w-[140px]">{matchedWarehouse.address1 || userProfile?.addressLine1}, {matchedWarehouse.city || userProfile?.city}</span>
                        <span>Ph: {matchedWarehouse.phone || userProfile?.mobile}</span>
                      </>
                    ) : <span className="italic text-slate-400">Address Hidden</span>}
                  </div>
                </div>
                {/* Courier info */}
                <div className="flex justify-between text-[8px] text-black border-b border-slate-300 pb-1 mb-1">
                  <div><span className="font-bold">Order Date:</span> {formattedDate}<br /><span className="font-bold">Payment:</span> {order.method || "COD"}</div>
                  <div className="text-right"><span className="font-bold">Courier:</span> {order.courierPartner || order.vendor || "-"}<br /><span className="font-bold">AWB:</span> {order.awbNumber || "-"}</div>
                </div>
                {/* Products */}
                <div className="border border-black mb-1">
                  <table className="w-full text-left border-collapse text-[9px] text-black">
                    <thead>
                      <tr className="border-b border-black font-bold bg-slate-50">
                        <th className="py-0.5 px-1.5 border-r border-black">Item</th>
                        <th className="py-0.5 px-1 border-r border-black text-center w-6">Qty</th>
                        <th className="py-0.5 px-1 border-r border-black text-right w-12">Rate</th>
                        <th className="py-0.5 px-1.5 text-right w-14">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderProducts.map((prod, pIdx) => {
                        const totalCost = prod.qty * prod.price;
                        return (
                          <tr key={pIdx} className="border-b border-black/20">
                            <td className="py-0.5 px-1.5 border-r border-black font-medium leading-tight">
                              {prod.title}
                              {prod.sku && <span className="block text-[7px] text-slate-400 font-mono">SKU: {prod.sku}</span>}
                            </td>
                            <td className="py-0.5 px-1 border-r border-black text-center">{prod.qty}</td>
                            <td className="py-0.5 px-1 border-r border-black text-right">₹{prod.price}</td>
                            <td className="py-0.5 px-1.5 text-right font-bold">₹{totalCost}</td>
                          </tr>
                        );
                      })}
                      {hasShipping && (
                        <tr>
                          <td className="py-0.5 px-1.5 border-r border-black font-medium leading-tight">
                            Shipping Charges
                            <span className="block text-[7px] text-slate-400">GST 18%  Tax: ₹{shippingTax}</span>
                          </td>
                          <td className="py-0.5 px-1 border-r border-black text-center">1</td>
                          <td className="py-0.5 px-1 border-r border-black text-right">₹{shippingRate}</td>
                          <td className="py-0.5 px-1.5 text-right font-bold">₹{shippingTotal}</td>
                        </tr>
                      )}
                      {discountVal > 0 && (
                        <tr>
                          <td colSpan={3} className="py-0.5 px-1.5 text-right font-bold border-r border-black">Discount</td>
                          <td className="py-0.5 px-1.5 text-right font-bold text-red-600">-₹{discountVal}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Total */}
                <div className="border-t-[1.5px] border-black flex justify-end py-1">
                  <span className="text-xs font-extrabold text-black uppercase">
                    Total Amount: <span className="text-sm ml-1">₹{grandTotal}</span>
                  </span>
                </div>
                <div className="border-b border-black mb-1" />
                <div className="flex justify-between items-end">
                  <span className="text-[7px] text-slate-400 font-semibold">Thank you for your business!</span>
                  {invoiceSettings?.signatureUrl && (
                    <div className="flex flex-col items-center">
                      <img src={invoiceSettings.signatureUrl} alt="Signature" className="h-5 object-contain mb-0.5" />
                      <span className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider border-t border-slate-200 pt-0.5">Authorized Signatory</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // ── COMPACT HALF-PAGE A4 layout (main layout matching user's image) ──
          return (
            <div
              key={order.id}
              className="invoice-page bg-white border border-black shadow-md print:shadow-none print:rounded-none font-sans text-[10px] text-black w-[200mm] p-[6mm_8mm]"
              style={{ fontFamily: "'Arial', sans-serif" }}
            >
              {/* ── ROW 1: Logo + Invoice Title ── */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  {invoiceSettings?.showCompanyName && (
                    invoiceSettings.logoUrl
                      ? <img src={invoiceSettings.logoUrl} alt="Logo" className="h-8 max-w-[160px] object-contain" />
                      : <span className="font-extrabold tracking-wider text-slate-900 uppercase text-base">
                          {userProfile?.companyName || "COMPANY"}
                          <span className="text-[7px] align-top">TM</span>
                        </span>
                  )}
                </div>
                <div className="text-right">
                  <h1 className="font-extrabold text-black text-xl leading-none mb-1">INVOICE</h1>
                  <div className="flex flex-col gap-0 text-[9px] text-black">
                    <span><span className="font-extrabold">Invoice #:</span> {displayInvoiceNo}</span>
                    <span><span className="font-extrabold">Date:</span> {formattedDate}</span>
                    <span><span className="font-extrabold">Order #:</span> {order.orderId}</span>
                  </div>
                </div>
              </div>

              {/* ── Thick rule ── */}
              <div className="border-b-[1.5px] border-black mb-2" />

              {/* ── ROW 2: Bill To / Sold By ── */}
              <div className="grid grid-cols-2 gap-4 mb-2 text-[9px]">
                <div className="flex flex-col gap-0.5">
                  <span className="font-extrabold border-b border-black pb-0.5 mb-0.5 text-[9px]">Bill To:</span>
                  {!invoiceSettings?.hideConsigneeAddress ? (
                    <>
                      <span className="font-extrabold text-black">{order.customer}</span>
                      <span className="leading-snug text-slate-800">{order.address}, {order.city}, {order.state} - {order.pincode}</span>
                      <span><span className="font-extrabold">Phone:</span> {order.phone} &nbsp;|&nbsp; <span className="font-extrabold">State Code:</span> {getStateCode(order.state)}</span>
                    </>
                  ) : <span className="italic text-slate-400">Address Hidden</span>}
                </div>
                <div className="flex flex-col gap-0.5 text-right items-end">
                  <span className="font-extrabold border-b border-black pb-0.5 mb-0.5 text-[9px] w-full text-right">Sold By:</span>
                  {!invoiceSettings?.hideWarehouseAddress ? (
                    <>
                      <span className="font-extrabold text-black">{matchedWarehouse.name || userProfile?.companyName}</span>
                      <span className="leading-snug text-slate-800 text-right">{matchedWarehouse.address1 || userProfile?.addressLine1}{matchedWarehouse.address2 ? `, ${matchedWarehouse.address2}` : ""}, {matchedWarehouse.city || userProfile?.city}, {matchedWarehouse.state || userProfile?.state} - {matchedWarehouse.pincode || userProfile?.pincode}</span>
                      <span><span className="font-extrabold">Phone:</span> {matchedWarehouse.phone || userProfile?.mobile}</span>
                      {(matchedWarehouse.gstNumber || userProfile?.gstNumber) && (
                        <span><span className="font-extrabold">GST:</span> <span className="font-mono">{matchedWarehouse.gstNumber || userProfile?.gstNumber}</span></span>
                      )}
                      <span><span className="font-extrabold">State Code:</span> {getStateCode(matchedWarehouse.state || userProfile?.state)}</span>
                    </>
                  ) : <span className="italic text-slate-400">Address Hidden</span>}
                </div>
              </div>

              {/* ── ROW 3: Order/Courier info bar ── */}
              <div className="flex justify-between text-[9px] border-b border-black pb-1.5 mb-2">
                <div className="flex gap-4">
                  <span><span className="font-extrabold">Order Date:</span> {formattedDate}</span>
                  <span><span className="font-extrabold">Payment Method:</span> {order.method || "COD"}</span>
                </div>
                <div className="flex gap-4 text-right">
                  <span><span className="font-extrabold">Courier:</span> {order.courierPartner || order.vendor || "Auto Assigned"}</span>
                  <span><span className="font-extrabold">AWB Number:</span> {order.awbNumber || "-"}</span>
                </div>
              </div>

              {/* ── ROW 4: Products table ── */}
              <div className="border border-black mb-2">
                <table className="w-full text-left border-collapse text-[9px] text-black">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black font-extrabold">
                      <th className="py-1 px-2 border-r border-black font-extrabold">Item</th>
                      <th className="py-1 px-1.5 border-r border-black text-center w-10 font-extrabold">SKU</th>
                      <th className="py-1 px-1.5 border-r border-black text-center w-9 font-extrabold">HSN</th>
                      <th className="py-1 px-1.5 border-r border-black text-center w-7 font-extrabold">Qty</th>
                      <th className="py-1 px-1.5 border-r border-black text-right w-14 font-extrabold">Rate</th>
                      <th className="py-1 px-1.5 border-r border-black text-right w-14 font-extrabold">Amount</th>
                      <th className="py-1 px-1.5 border-r border-black text-center w-10 font-extrabold">IGST%</th>
                      <th className="py-1 px-1.5 border-r border-black text-right w-14 font-extrabold">IGST Amt</th>
                      <th className="py-1 px-2 text-right w-16 font-extrabold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderProducts.map((prod, pIdx) => {
                      const totalCost = prod.qty * prod.price;
                      return (
                        <tr key={pIdx} className={pIdx < orderProducts.length - 1 ? "border-b border-black/20" : ""}>
                          <td className="py-1 px-2 border-r border-black font-medium leading-snug">{prod.title}</td>
                          <td className="py-1 px-1.5 border-r border-black text-center font-mono text-[8px]">{prod.sku || "-"}</td>
                          <td className="py-1 px-1.5 border-r border-black text-center text-slate-400">-</td>
                          <td className="py-1 px-1.5 border-r border-black text-center">{prod.qty}</td>
                          <td className="py-1 px-1.5 border-r border-black text-right">₹{prod.price}</td>
                          <td className="py-1 px-1.5 border-r border-black text-right">₹{totalCost}</td>
                          <td className="py-1 px-1.5 border-r border-black text-center text-slate-400">-</td>
                          <td className="py-1 px-1.5 border-r border-black text-right">₹0</td>
                          <td className="py-1 px-2 text-right font-bold">₹{totalCost}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Shipping Charges — separate standalone right-aligned box ── */}
              {hasShipping && (
                <div className="flex justify-end mb-2">
                  <div className="border border-black overflow-hidden" style={{ minWidth: "340px" }}>
                    <table className="text-left border-collapse text-[9px] text-black w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-black font-extrabold">
                          <th className="py-1 px-2 border-r border-black font-extrabold">Item</th>
                          <th className="py-1 px-1.5 border-r border-black text-right w-16 font-extrabold">Rate</th>
                          <th className="py-1 px-1.5 border-r border-black text-right w-16 font-extrabold">Amount</th>
                          <th className="py-1 px-1.5 border-r border-black text-center w-10 font-extrabold">IGST%</th>
                          <th className="py-1 px-1.5 border-r border-black text-right w-14 font-extrabold">IGST Amt</th>
                          <th className="py-1 px-2 text-right w-14 font-extrabold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-1 px-2 border-r border-black font-bold">Shipping Charges</td>
                          <td className="py-1 px-1.5 border-r border-black text-right">₹{shippingRate}</td>
                          <td className="py-1 px-1.5 border-r border-black text-right">₹{shippingRate}</td>
                          <td className="py-1 px-1.5 border-r border-black text-center">18%</td>
                          <td className="py-1 px-1.5 border-r border-black text-right">₹{shippingTax}</td>
                          <td className="py-1 px-2 text-right font-bold">₹{shippingTotal}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Discount line ── */}
              {discountVal > 0 && (
                <div className="flex justify-end pt-1 pr-0.5 text-[9px]">
                  <span className="font-bold text-slate-600 mr-1">Discount:</span>
                  <span className="font-bold text-red-600">-₹{discountVal}</span>
                </div>
              )}

              {/* ── Total bar ── */}
              <div className="border-t-[1.5px] border-black flex justify-end items-center py-1.5 mt-1">
                <span className="text-[10px] font-extrabold text-black uppercase">
                  Total Amount: <span className="text-sm ml-1.5">₹{grandTotal}</span>
                </span>
              </div>

              {/* ── Footer rule + signature ── */}
              <div className="border-b-[1.5px] border-black mb-1.5" />
              <div className="flex justify-between items-end">
                <span className="text-[8px] text-slate-400 font-semibold">Thank you for your business!</span>
                {invoiceSettings?.signatureUrl && (
                  <div className="flex flex-col items-center">
                    <img src={invoiceSettings.signatureUrl} alt="Signature" className="h-7 object-contain mb-0.5" />
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider border-t border-slate-200 pt-0.5">Authorized Signatory</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function InvoicePrintPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center font-sans font-semibold text-slate-400 text-xs">
        Loading components...
      </div>
    }>
      <InvoicePrintContent />
    </Suspense>
  );
}
