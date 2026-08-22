"use client";

import { useState } from "react";

export default function VendorSettings() {
  const [vendors, setVendors] = useState([
    { id: "delhivery", name: "Delhivery Surface", active: true, rating: "4.8" },
    { id: "xpressbees", name: "Xpressbees Surface", active: true, rating: "4.6" },
    { id: "amazon", name: "Amazon Shipping", active: false, rating: "4.7" },
    { id: "bluedart", name: "Bluedart Surface", active: true, rating: "4.9" }
  ]);

  const toggleVendor = (id) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, active: !v.active } : v));
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      <div>
        <h3 className="text-base font-bold text-slate-900">Vendor Courier Management</h3>
        <p className="text-xs text-slate-500 mt-1">Enable or disable specific courier partners for rate calculations and routing.</p>
      </div>

      <div className="flex flex-col gap-4">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="border border-slate-150 rounded-2xl p-5 bg-white flex justify-between items-center shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-800">{vendor.name}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Quality Index: ★ {vendor.rating}</span>
            </div>
            
            <button 
              onClick={() => toggleVendor(vendor.id)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${vendor.active ? "bg-blue-600" : "bg-slate-200"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${vendor.active ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
