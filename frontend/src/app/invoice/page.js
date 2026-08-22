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
    return "09"; // standard fallback
  };

  useEffect(() => {
    const loadInvoiceData = async () => {
      const idsParam = searchParams.get("ids");
      if (!idsParam) {
        setLoading(false);
        return;
      }

      try {
        const idList = idsParam.split(",");
        
        // Fetch all dependencies concurrently
        const [profileRes, settingsRes, warehouseRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/invoice-settings"),
          api.get("/warehouse")
        ]);

        if (profileRes.success) setUserProfile(profileRes.data);
        if (settingsRes.success) setInvoiceSettings(settingsRes.data);
        if (warehouseRes.success) setWarehouses(warehouseRes.data);

        // Fetch each order detail concurrently
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

  // Trigger print dialog once DOM is ready and loaded
  useEffect(() => {
    if (!loading && orders.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
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
      {/* Dynamic Printing CSS styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .invoice-page {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            page-break-after: always !important;
            break-after: always !important;
            box-shadow: none !important;
            border: 1px solid black !important;
            margin: 0 auto !important;
            padding: ${isThermal ? "4mm" : "10mm 15mm"} !important;
            width: ${isThermal ? "92mm" : "200mm"} !important;
            height: ${isThermal ? "142mm" : "auto"} !important;
            box-sizing: border-box !important;
            position: relative !important;
          }
          @page {
            size: ${isThermal ? "4in 6in" : "A4 portrait"};
            margin: 5mm !important;
          }
        }
      `}} />

      <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0 font-sans text-slate-900 select-text flex flex-col items-center">
        {orders.map((order, index) => {
          // Identify matching warehouse details
          const matchedWarehouse = warehouses.find(w => w.name === order.pickupWarehouse) || warehouses[0] || {};
          
          const prefix = invoiceSettings?.invoicePrefix || "";
          const displayInvoiceNo = `${prefix}${order.orderId}`;
          const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
          });

          // Product listing normalization
          const orderProducts = order.products && order.products.length > 0 
            ? order.products.map(item => ({
                title: item.title || item.name || "Product Item",
                qty: item.qty || item.quantity || 1,
                price: item.price || 0,
                sku: item.sku || "N/A"
              }))
            : [{
                title: order.product || "Product Item",
                qty: 1,
                price: order.amount || 0,
                sku: "N/A"
              }];

          const shippingTotal = order.shippingCharges || 50;
          const shippingRate = (shippingTotal / 1.18).toFixed(2);
          const shippingTax = (shippingTotal - parseFloat(shippingRate)).toFixed(2);
          const productsSubtotal = orderProducts.reduce((acc, p) => acc + (p.price * p.qty), 0);
          const grandTotal = order.amount || (productsSubtotal + shippingTotal);
          const discountVal = order.discount || Math.max(0, (productsSubtotal + shippingTotal) - grandTotal);
          const hasShipping = shippingTotal > 0;

          return (
            <div
              key={order.id}
              className={`invoice-page bg-white border border-black shadow-lg rounded-sm mb-8 print:mb-0 print:rounded-none print:shadow-none flex flex-col justify-start font-sans leading-relaxed text-xs ${
                isThermal 
                  ? "w-[4in] min-h-[6in] p-4 text-[10px] gap-3" 
                  : "w-[210mm] min-h-0 p-[15mm] gap-6"
              }`}
            >
              <div>
                {/* Header Row */}
                <div className={`flex justify-between items-start ${isThermal ? "mb-3" : "mb-6"}`}>
                  {/* Logo or Brand */}
                  <div>
                    {invoiceSettings?.showCompanyName && (
                      invoiceSettings.logoUrl ? (
                        <img src={invoiceSettings.logoUrl} alt="Logo" className={`${isThermal ? "h-6 max-w-[120px]" : "h-10 max-w-[200px]"} object-contain`} />
                      ) : (
                        <div className="flex items-center">
                          <span className={`font-extrabold tracking-wider text-slate-900 uppercase ${isThermal ? "text-sm" : "text-lg"}`}>
                            {userProfile?.companyName || "VELENCE"}
                            <span className="text-[8px] align-top">TM</span>
                          </span>
                        </div>
                      )
                    )}
                  </div>
                  
                  {/* Title & Metadata */}
                  <div className="text-right flex flex-col">
                    <h1 className={`font-bold tracking-normal text-black leading-none mb-2.5 ${isThermal ? "text-lg" : "text-[28px]"}`}>INVOICE</h1>
                    <div className={`flex flex-col gap-0.5 text-black ${isThermal ? "text-[9px]" : "text-xs"}`}>
                      <span><span className="font-bold">Invoice #:</span> {displayInvoiceNo}</span>
                      <span><span className="font-bold">Date:</span> {formattedDate}</span>
                      <span><span className="font-bold">Order #:</span> {order.orderId}</span>
                    </div>
                  </div>
                </div>

                {/* Main Black Border Rule */}
                <div className={`border-b-[1.5px] border-black ${isThermal ? "mb-3" : "mb-6"}`}></div>

                {/* Addresses Grid */}
                <div className={`grid grid-cols-12 ${isThermal ? "gap-4 mb-3 text-[9px]" : "gap-8 mb-6 text-xs"} text-black`}>
                  {/* Bill To */}
                  <div className="col-span-6 flex flex-col gap-1">
                    <h3 className="font-bold text-black border-b border-black pb-0.5 mb-1 text-[11px]">Bill To:</h3>
                    {!invoiceSettings?.hideConsigneeAddress ? (
                      <>
                        <span className="font-bold">{order.customer}</span>
                        <span className={`leading-tight text-slate-800 ${isThermal ? "max-w-[140px]" : "max-w-[280px]"}`}>
                          {order.address}, {order.city}, {order.state} - {order.pincode}
                        </span>
                        <span>Phone: {order.phone}</span>
                        <span>State Code: {getStateCode(order.state)}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-medium italic">Address Details Hidden</span>
                    )}
                  </div>

                  {/* Sold By */}
                  <div className="col-span-6 flex flex-col gap-1 text-right items-end">
                    <h3 className="font-bold text-black border-b border-black pb-0.5 mb-1 w-full text-right text-[11px]">Sold By:</h3>
                    {!invoiceSettings?.hideWarehouseAddress ? (
                      <>
                        <span className="font-bold">{matchedWarehouse.personName || userProfile?.firstName + " " + userProfile?.lastName}</span>
                        <span className="font-bold">{matchedWarehouse.name || userProfile?.companyName}</span>
                        <span className={`leading-tight text-slate-800 text-right ${isThermal ? "max-w-[140px]" : "max-w-[280px]"}`}>
                          {matchedWarehouse.address1 || userProfile?.addressLine1}{matchedWarehouse.address2 ? `, ${matchedWarehouse.address2}` : ""}, {matchedWarehouse.city || userProfile?.city}, {matchedWarehouse.state || userProfile?.state} - {matchedWarehouse.pincode || userProfile?.pincode}
                        </span>
                        <span>Phone: {matchedWarehouse.phone || userProfile?.mobile}</span>
                        {(matchedWarehouse.gstNumber || userProfile?.gstNumber) && (
                          <span>GST: <span className="font-mono">{matchedWarehouse.gstNumber || userProfile?.gstNumber}</span></span>
                        )}
                        <span>State Code: {getStateCode(matchedWarehouse.state || userProfile?.state)}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-medium italic">Warehouse Address Hidden</span>
                    )}
                  </div>
                </div>

                {/* Courier details & info panel */}
                <div className={`flex justify-between items-end text-black leading-relaxed border-b border-slate-200 ${isThermal ? "mb-3 pb-2 text-[9px]" : "mb-6 pb-4 text-xs"}`}>
                  <div className="flex flex-col">
                    <span><span className="font-bold">Order Date:</span> {formattedDate}</span>
                    <span><span className="font-bold">Payment Method:</span> {order.method || "COD"}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span><span className="font-bold">Courier:</span> {order.courierPartner || order.vendor || "Auto Assigned"}</span>
                    <span><span className="font-bold">AWB Number:</span> {order.awbNumber || "-"}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className={`border border-black rounded-none overflow-hidden ${isThermal ? "mb-3" : "mb-6"}`}>
                  {isThermal ? (
                    // Thermal 4-column compact table
                    <table className="w-full text-left border-collapse text-[10px] text-black">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-black font-bold">
                          <th className="py-1 px-1.5 border-r border-black w-[55%]">Item</th>
                          <th className="py-1 px-1 border-r border-black text-center w-8">Qty</th>
                          <th className="py-1 px-1 border-r border-black text-right w-12">Rate</th>
                          <th className="py-1 px-1.5 text-right w-16">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/30 font-semibold">
                        {orderProducts.map((prod, pIdx) => {
                          const totalCost = prod.qty * prod.price;
                          return (
                            <tr key={pIdx} className="leading-tight">
                              <td className="py-1 px-1.5 border-r border-black font-medium">
                                {prod.title}
                                {prod.sku && prod.sku !== "N/A" && (
                                  <span className="block text-[8px] text-slate-500 font-mono mt-0.5">SKU: {prod.sku}</span>
                                )}
                              </td>
                              <td className="py-1 px-1 border-r border-black text-center">{prod.qty}</td>
                              <td className="py-1 px-1 border-r border-black text-right">₹{prod.price}</td>
                              <td className="py-1 px-1.5 text-right font-bold">₹{totalCost}</td>
                            </tr>
                          );
                        })}
                        {hasShipping && (
                          <tr className="leading-tight">
                            <td className="py-1 px-1.5 border-r border-black font-medium">
                              Shipping Charges
                              <span className="block text-[8px] text-slate-500 font-normal mt-0.5">GST 18% (Rate: ₹{shippingRate}, Tax: ₹{shippingTax})</span>
                            </td>
                            <td className="py-1 px-1 border-r border-black text-center">1</td>
                            <td className="py-1 px-1 border-r border-black text-right">₹{shippingRate}</td>
                            <td className="py-1 px-1.5 text-right font-bold">₹{shippingTotal}</td>
                          </tr>
                        )}
                        {discountVal > 0 && (
                          <tr className="leading-tight">
                            <td colSpan={3} className="py-1 px-1.5 text-right font-bold border-r border-black">Discount</td>
                            <td className="py-1 px-1.5 text-right font-bold text-red-600">-₹{discountVal}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    // Standard A4 9-column table
                    <table className="w-full text-left border-collapse text-xs text-black">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-black font-bold">
                          <th className="py-2 px-3 border-r border-black w-2/5">Item</th>
                          <th className="py-2 px-2 border-r border-black text-center w-12">SKU</th>
                          <th className="py-2 px-2 border-r border-black text-center w-10">HSN</th>
                          <th className="py-2 px-2 border-r border-black text-center w-8">Qty</th>
                          <th className="py-2 px-2 border-r border-black text-right w-16">Rate</th>
                          <th className="py-2 px-2 border-r border-black text-right w-16">Amount</th>
                          <th className="py-2 px-2 border-r border-black text-center w-12">IGST%</th>
                          <th className="py-2 px-2 border-r border-black text-right w-16">IGST Amt</th>
                          <th className="py-2 px-3 text-right w-20">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/30 font-semibold">
                        {orderProducts.map((prod, pIdx) => {
                          const totalCost = prod.qty * prod.price;
                          return (
                            <tr key={pIdx} className="leading-tight">
                              <td className="py-2 px-3 border-r border-black font-medium">{prod.title}</td>
                              <td className="py-2 px-2 border-r border-black text-center font-mono">{prod.sku}</td>
                              <td className="py-2 px-2 border-r border-black text-center text-slate-400">-</td>
                              <td className="py-2 px-2 border-r border-black text-center">{prod.qty}</td>
                              <td className="py-2 px-2 border-r border-black text-right">₹{prod.price}</td>
                              <td className="py-2 px-2 border-r border-black text-right">₹{totalCost}</td>
                              <td className="py-2 px-2 border-r border-black text-center text-slate-400">-</td>
                              <td className="py-2 px-2 border-r border-black text-right">₹0</td>
                              <td className="py-2 px-3 text-right font-bold">₹{totalCost}</td>
                            </tr>
                          );
                        })}
                        {hasShipping && (
                          <tr className="leading-tight">
                            <td className="py-2 px-3 border-r border-black font-medium">Shipping Charges</td>
                            <td className="py-2 px-2 border-r border-black text-center font-mono">-</td>
                            <td className="py-2 px-2 border-r border-black text-center text-slate-400">9968</td>
                            <td className="py-2 px-2 border-r border-black text-center">1</td>
                            <td className="py-2 px-2 border-r border-black text-right">₹{shippingRate}</td>
                            <td className="py-2 px-2 border-r border-black text-right">₹{shippingRate}</td>
                            <td className="py-2 px-2 border-r border-black text-center font-mono">18%</td>
                            <td className="py-2 px-2 border-r border-black text-right">₹{shippingTax}</td>
                            <td className="py-2 px-3 text-right font-bold">₹{shippingTotal}</td>
                          </tr>
                        )}
                        {discountVal > 0 && (
                          <tr className="leading-tight">
                            <td colSpan={8} className="py-2 px-3 text-right font-bold border-r border-black">Discount</td>
                            <td className="py-2 px-3 text-right font-bold text-red-600">-₹{discountVal}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Total & Bottom Signature block */}
              <div>
                {/* Total Bar */}
                <div className={`border-t-[1.5px] border-black flex justify-end items-center ${isThermal ? "py-1.5 mb-2.5" : "py-2.5 mb-6"}`}>
                  <span className={`${isThermal ? "text-xs" : "text-sm"} font-extrabold text-black uppercase`}>
                    Total Amount: <span className={`font-extrabold ml-2 ${isThermal ? "text-sm" : "text-lg"}`}>₹{grandTotal}</span>
                  </span>
                </div>

                <div className={`border-b-[1.5px] border-black ${isThermal ? "mb-2.5" : "mb-6"}`}></div>

                {/* Footer and Signatory */}
                <div className="flex justify-between items-end mt-2">
                  <span className={`${isThermal ? "text-[8px]" : "text-[10px]"} text-slate-400 font-semibold select-none w-full text-center`}>
                    Thank you for your business!
                  </span>
                  
                  {/* Signature Zone */}
                  {invoiceSettings?.signatureUrl && (
                    <div className="flex flex-col items-center select-none shrink-0">
                      <img src={invoiceSettings.signatureUrl} alt="Signature" className={`${isThermal ? "h-6" : "h-10"} object-contain mb-1`} />
                      <span className={`${isThermal ? "text-[7px]" : "text-[8.5px]"} text-slate-400 font-bold uppercase tracking-wider border-t border-slate-200 pt-0.5`}>
                        Authorized Signatory
                      </span>
                    </div>
                  )}
                </div>
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

