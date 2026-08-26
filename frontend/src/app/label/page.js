"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

const code39Patterns = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
  '$': '010101000', '/': '010100010', '+': '010001010', '%': '000101010'
};

function Code39Barcode({ value, width = 1.0, height = 24 }) {
  if (!value) return null;
  const cleanStr = value.toString().toUpperCase().replace(/[^0-9A-Z\-\.\ \$\/\+\%]/g, "");
  const fullVal = `*${cleanStr}*`;
  const w = width;
  const wideW = width * 2.2;
  const gapW = width;
  const rects = [];
  let currentX = 0;
  for (let i = 0; i < fullVal.length; i++) {
    const char = fullVal[i];
    const pattern = code39Patterns[char];
    if (!pattern) continue;
    for (let pIdx = 0; pIdx < 9; pIdx++) {
      const isWide = pattern[pIdx] === '1';
      const elementWidth = isWide ? wideW : w;
      const isBar = pIdx % 2 === 0;
      if (isBar) {
        rects.push(
          <rect
            key={`${i}-${pIdx}`}
            x={currentX}
            y={0}
            width={elementWidth}
            height={height}
            fill="black"
          />
        );
      }
      currentX += elementWidth;
    }
    currentX += gapW;
  }
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${currentX} ${height}`} preserveAspectRatio="none" className="select-none">
      {rects}
    </svg>
  );
}

function LabelPrintContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [labelSettings, setLabelSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLabelData = async () => {
      const idsParam = searchParams.get("ids");
      if (!idsParam) {
        setLoading(false);
        return;
      }

      try {
        const idList = idsParam.split(",");

        // Fetch user context & label settings
        const [profileRes, settingsRes, warehouseRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/label-settings"),
          api.get("/warehouse")
        ]);

        if (profileRes.success) setUserProfile(profileRes.data);
        if (settingsRes.success) setLabelSettings(settingsRes.data);
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
        console.error("Failed to load label printing data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLabelData();
  }, [searchParams]);

  // Trigger print dialog once loaded
  useEffect(() => {
    if (!loading && orders.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans font-bold text-slate-400 text-xs">
        Loading printable shipping labels...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans font-bold text-slate-500 text-xs">
        No shipments selected to print labels.
      </div>
    );
  }

  // Resolve options from dynamic settings (fallback to defaults if settings are empty)
  const showLogo = labelSettings?.showLogo ?? true;
  const logoUrl = labelSettings?.logoUrl || "";
  const useChannelLogo = labelSettings?.useChannelLogo ?? false;
  const showSupportContact = labelSettings?.showSupportContact ?? true;
  const supportEmail = labelSettings?.supportEmail || "";
  const supportMobile = labelSettings?.supportMobile || "";
  const hideCustomerMobile = labelSettings?.hideCustomerMobile ?? false;
  const hideSku = labelSettings?.hideSku ?? false;
  const hideProduct = labelSettings?.hideProduct ?? false;
  const hideQty = labelSettings?.hideQty ?? false;
  const hideTotalAmount = labelSettings?.hideTotalAmount ?? false;
  const hideDiscountAmount = labelSettings?.hideDiscountAmount ?? false;
  const hideOrderAmount = labelSettings?.hideOrderAmount ?? false;
  const showCodAmount = labelSettings?.showCodAmount ?? true;
  const showPrepaidAmount = labelSettings?.showPrepaidAmount ?? false;
  const trimSkuUpto = labelSettings?.trimSkuUpto ?? 20;
  const trimProductNameUpto = labelSettings?.trimProductNameUpto ?? 50;
  const showLineItemsCount = labelSettings?.showLineItemsCount ?? 5;
  const labelSize = labelSettings?.labelSize || "4x6";

  // Resolve default/matching seller warehouse address
  const getPickupDetails = (order) => {
    // If order specifies a warehouse, try to find it
    const wh = warehouses.find(w => w.name === order.warehouseName || w.id === order.warehouseId) || warehouses.find(w => w.isDefault) || warehouses[0] || {};
    const name = wh.name || userProfile?.companyName || "BeeShip Partner";
    const person = wh.personName || (userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "");
    const address = wh.address1
      ? `${wh.address1}${wh.address2 ? `, ${wh.address2}` : ""}, ${wh.city}, ${wh.state} - ${wh.pincode}`
      : (userProfile?.addressLine1
          ? `${userProfile.addressLine1}, ${userProfile.city}, ${userProfile.state} - ${userProfile.pincode}`
          : "Logistics Fulfillment Center");
    const phone = wh.phone || userProfile?.mobile || "";
    return { name, person, address, phone };
  };

  const getRouteCode = (order) => {
    if (order.city && order.city.toLowerCase().includes("jabalpur")) {
      return "JBL / JBL / JBC";
    }
    const cityCode = order.city ? order.city.substring(0, 3).toUpperCase() : "DEL";
    const stateCode = order.state ? order.state.substring(0, 3).toUpperCase() : "DEL";
    return `${cityCode} / ${cityCode} / ${cityCode.charAt(0)}${stateCode.charAt(0)}C`;
  };

  return (
    <div className={`bg-slate-100 min-h-screen py-8 print:bg-white print:py-0 print:min-h-0 font-sans`}>
      {/* Dynamic CSS rules for page breaks and sizes in print mode */}
      <style dangerouslySetInnerHTML={{ __html: `
        * {
          box-sizing: border-box;
        }
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .a4-print-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            grid-gap: 6mm !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 12mm 10mm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
          .a4-print-item {
            width: 92mm !important;
            height: 132mm !important;
            border: 1px solid black !important;
            box-sizing: border-box !important;
            padding: 10px !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            border-radius: 0px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .thermal-print-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            padding: 2mm !important;
          }
          .thermal-print-item {
            width: 94mm !important;
            height: 142mm !important;
            border: 1px solid black !important;
            box-sizing: border-box !important;
            padding: 10px !important;
            margin: 0 auto !important;
            page-break-after: always !important;
            break-after: always !important;
            border-radius: 0px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: ${labelSize === "A4" ? "A4 portrait" : "4in 6in"};
            margin: 3mm !important;
          }
        }
      `}} />

      {/* Manual print helper banner (only visible on screen) */}
      <div className="no-print max-w-[340px] md:max-w-2xl mx-auto mb-6 bg-slate-900 text-white p-4.5 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold block">Label Sheet Ready for Printing</span>
          <span className="text-[10px] text-slate-400 font-medium">Configured size: {labelSize === "A4" ? "Standard A4 portrait" : "Thermal 4x6 Inches"}.</span>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-[#25a2fe] hover:bg-[#1a8ee4] text-white transition px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Now
        </button>
      </div>

      {/* Printable Cards List */}
      <div className={labelSize === "A4" ? "grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-6 print:a4-print-container print:gap-0" : "flex flex-col items-center gap-8 print:thermal-print-container"}>
        {orders.map((order, index) => {
          const seller = getPickupDetails(order);
          
          let displayProducts = [];
          let shippingVal = typeof order.shippingCharges === "number" ? order.shippingCharges : (order.shippingCharges ? parseFloat(order.shippingCharges) : 0);

          if (order.products && order.products.length > 0) {
            displayProducts = order.products;
          } else {
            const prodPrice = order.amount && order.amount > shippingVal ? (order.amount - shippingVal) : (order.amount || 0);
            displayProducts = [{
              name: order.product || "General Merchandise",
              qty: 1,
              price: prodPrice,
              rate: prodPrice,
              amount: prodPrice,
              total: prodPrice
            }];
          }

          const subtotalAmount = displayProducts.reduce((acc, p) => acc + (p.price || 0) * (p.qty || 1), 0);
          const hasShipping = shippingVal > 0;
          const grandTotal = order.amount || (subtotalAmount + shippingVal);

          return (
            <div
              key={order.id}
              className={labelSize === "A4" ? "a4-print-item bg-white p-3 flex flex-col justify-between box-border" : "thermal-print-item bg-white p-3 flex flex-col justify-between box-border"}
              style={{
                width: labelSize === "A4" ? "92mm" : "94mm",
                height: labelSize === "A4" ? "132mm" : "142mm",
                border: "1px solid black",
                boxSizing: "border-box"
              }}
            >
              <div>
                {/* Logo & Delivery section */}
                <div className="flex gap-2 justify-between items-start border-b border-black pb-1 mb-1">
                  {/* Logo block */}
                  <div className="w-[32%] pt-0.5">
                    {showLogo && (
                      useChannelLogo ? (
                        <div className="bg-slate-100 border border-black rounded p-1 text-[8px] font-bold text-black text-center uppercase tracking-tight">
                          {order.channel || "Shopify"}
                        </div>
                      ) : (
                        logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="h-10 max-w-full object-contain" />
                        ) : (
                          <span className="font-extrabold tracking-wider text-base text-black">
                            {userProfile?.companyName || "BeeShip"}
                            <span className="text-[7px] align-top">TM</span>
                          </span>
                        )
                      )
                    )}
                  </div>

                  {/* Delivery details */}
                  <div className="w-[68%] text-right flex flex-col gap-0 text-[7.5px]">
                    <span className="text-[7px] font-semibold text-black uppercase tracking-wide">DELIVER TO:</span>
                    <span className="font-semibold text-black text-[8.5px] uppercase">{order.customer}</span>
                    <span className="text-black font-normal leading-tight text-[7.5px]">
                      {order.address}, {order.city}, {order.state} - {order.pincode}
                    </span>
                    <span className="font-semibold text-black text-[7.5px]">
                      MOBILE NO: {hideCustomerMobile ? "**********" : (order.phone || "N/A")}
                    </span>
                    <span className="text-[7.5px] font-semibold text-black mt-0.5">
                      Route code - {getRouteCode(order)}
                    </span>
                  </div>
                </div>

                {/* Order Info & Shipping Info Grid */}
                <div className="grid grid-cols-2 gap-2 border-b border-black pb-1 mb-1 text-[7.5px] leading-normal">
                  {/* Left: Order Info */}
                  <div className="border-r border-black pr-1.5 flex flex-col gap-0.5">
                    <span className="font-semibold text-black uppercase border-b border-black/20 pb-0.5 text-[7.5px]">ORDER INFO</span>
                    <span className="text-black font-normal"><span className="font-semibold">Order Date:</span> {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "N/A"}</span>
                    <span className="text-black font-normal"><span className="font-semibold">Invoice No:</span> #{order.invoiceNo || order.orderId}</span>
                    {/* Barcode representation */}
                    <div className="flex flex-col items-center mt-0.5 select-none w-full">
                      <Code39Barcode value={order.invoiceNo || order.orderId} height={16} />
                      <span className="text-[6.5px] font-mono font-semibold text-black tracking-wider mt-0.5">{order.invoiceNo || order.orderId}</span>
                    </div>
                  </div>

                  {/* Right: Shipping Info */}
                  <div className="flex flex-col gap-0.5 text-black font-normal">
                    <span className="font-semibold text-black uppercase border-b border-black/20 pb-0.5 text-[7.5px]">SHIPPING INFO</span>
                    <span><span className="font-semibold">Courier Name :</span> <span className="font-semibold text-black">{order.vendor || order.courierPartner || "BLUEDART"}</span></span>
                    <span><span className="font-semibold">AWB Number :</span> <span className="font-semibold text-black">{order.awbNumber || "N/A"}</span></span>
                    <span><span className="font-semibold">Weight :</span> {order.weight || 0.5} KG</span>
                    <span><span className="font-semibold">Dimensions (cm):</span> {order.length || 0} x {order.breadth || 0} x {order.height || 0}</span>
                  </div>
                </div>

                {/* Pickup and Return Address */}
                <div className="border-b border-black pb-1 mb-1 text-[7.5px] text-black font-normal leading-normal">
                  <span className="font-semibold text-black block uppercase tracking-wide text-[7.5px] mb-0.5">PICKUP AND RETURN ADDRESS:</span>
                  <span>
                    {seller.name}{seller.person ? `, ${seller.person}` : ""}, {seller.address}{seller.phone ? `, Mob: ${seller.phone}` : ""}
                  </span>
                </div>

                {/* COD & Barcode Side-By-Side Row */}
                <div className="grid grid-cols-12 gap-2 border-b border-black pb-1 mb-1 items-center text-[7.5px]">
                  {/* Left COD block */}
                  <div className="col-span-4 flex flex-col items-center justify-center border-r border-black pr-1 text-center select-none">
                    <span className="text-[10px] font-bold text-black leading-none uppercase">
                      {order.method || "COD"}
                    </span>
                    <span className="text-[5.5px] font-semibold text-black uppercase tracking-tight mt-0.5 leading-tight">COLLECTABLE AMOUNT:</span>
                    <span className="text-[10px] font-bold text-black mt-0.5">₹{order.method === "COD" ? grandTotal : 0}</span>
                  </div>
                  {/* Right Barcode block */}
                  <div className="col-span-8 flex flex-col items-center justify-center">
                    <span className="text-[8px] font-semibold text-black mb-0.5">{order.awbNumber || "N/A"}</span>
                    {order.awbNumber ? (
                      <Code39Barcode value={order.awbNumber} height={26} />
                    ) : (
                      <div className="h-5 border border-dashed border-black w-full flex items-center justify-center text-[6.5px] text-black font-semibold">
                        No Barcode (No AWB)
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table with vertical side borders */}
                <div className="border border-black rounded-none overflow-hidden mb-1 text-[6.5px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-black text-black uppercase font-semibold text-[6.5px]">
                        {!hideProduct && <th className="py-0.5 px-1 text-left border-r border-black">ITEM</th>}
                        {!hideSku && <th className="py-0.5 px-1 text-center border-r border-black w-12">SKU</th>}
                        {!hideQty && <th className="py-0.5 px-1 text-center border-r border-black w-6">QTY</th>}
                        <th className="py-0.5 px-1 text-right border-r border-black w-9">RATE</th>
                        <th className="py-0.5 px-1 text-right border-r border-black w-10">AMOUNT</th>
                        {!hideTotalAmount && <th className="py-0.5 px-1 text-right w-10">TOTAL</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/20 font-normal text-black">
                      {displayProducts.slice(0, showLineItemsCount).map((item, idx) => {
                        const displayTitle = item.name.length > trimProductNameUpto
                          ? item.name.substring(0, trimProductNameUpto) + "..."
                          : item.name;
                        const displaySku = (item.sku || "").length > trimSkuUpto
                          ? item.sku.substring(0, trimSkuUpto) + "..."
                          : (item.sku || "-");
                        
                        const rate = item.rate || item.price || 0;
                        const amount = item.amount || (rate * (item.qty || 1));
                        const total = item.total || amount;

                        return (
                          <tr key={idx}>
                            {!hideProduct && <td className="py-0.5 px-1 leading-tight break-words border-r border-black">{displayTitle}</td>}
                            {!hideSku && <td className="py-0.5 px-1 font-mono text-[6px] text-center border-r border-black">{displaySku}</td>}
                            {!hideQty && <td className="py-0.5 px-1 text-center border-r border-black">{item.qty || 1}</td>}
                            <td className="py-0.5 px-1 text-right border-r border-black">₹{rate}</td>
                            <td className="py-0.5 px-1 text-right border-r border-black">₹{amount}</td>
                            {!hideTotalAmount && <td className="py-0.5 px-1 text-right font-semibold">₹{total}</td>}
                          </tr>
                        );
                      })}

                      {/* Shipping Charges row */}
                      {hasShipping && (
                        <tr className="border-t border-black">
                          {!hideProduct && <td className="py-0.5 px-1 font-semibold leading-tight border-r border-black">Shipping Charges</td>}
                          {!hideSku && <td className="py-0.5 px-1 font-mono text-[6px] text-center border-r border-black">-</td>}
                          {!hideQty && <td className="py-0.5 px-1 text-center border-r border-black">1</td>}
                          <td className="py-0.5 px-1 text-right border-r border-black">₹{(shippingVal / 1.18).toFixed(2)}</td>
                          <td className="py-0.5 px-1 text-right border-r border-black">₹{(shippingVal / 1.18).toFixed(2)}</td>
                          {!hideTotalAmount && <td className="py-0.5 px-1 text-right font-semibold">₹{shippingVal}</td>}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total amount footer */}
                {!hideOrderAmount && (
                  <div className="border-t border-black py-0.5 px-1.5 text-right font-semibold text-[7.5px] text-black mb-1">
                    Total : ₹{grandTotal}
                  </div>
                )}
              </div>

              {/* Bottom Support Disclaimer */}
              <div className="border-t border-black pt-1 flex flex-col gap-0 text-[7px] text-black text-center select-none font-normal leading-tight">
                <span>
                  For Support call at <span className="font-semibold">{supportMobile || "1234567898"}</span> also email to <span className="font-semibold">{supportEmail || "pradeep@gmail.com"}</span>
                </span>
                <span className="text-[6px] text-slate-700">
                  This is computer generated document, hence does not require signature.
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LabelPrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans font-bold text-slate-400 text-xs">
        Loading label...
      </div>
    }>
      <LabelPrintContent />
    </Suspense>
  );
}
