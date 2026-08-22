"use client";

import { useState } from "react";

export default function TaxSettings() {
  const [taxMap, setTaxMap] = useState([
    { id: 1, category: "Apparel & Clothing", hsnCode: "6109", gstPercent: 12 },
    { id: 2, category: "Electronics Accessories", hsnCode: "8504", gstPercent: 18 }
  ]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900">Product Tax Mapping (GST)</h3>
          <p className="text-xs text-slate-500 mt-1">Map product groups to HSN codes and GST slab parameters.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 transition text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm">
          + Add Mapping
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {taxMap.map((tax) => (
          <div key={tax.id} className="border border-slate-150 rounded-2xl p-5 bg-white flex justify-between items-center shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-800">{tax.category}</span>
              <span className="text-[10px] text-slate-400 font-semibold">HSN Code: {tax.hsnCode}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase">
                {tax.gstPercent}% GST
              </span>
              <button className="text-rose-500 hover:text-rose-700 font-bold text-[10px] cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
