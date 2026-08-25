"use client";

import { useState, useRef, useEffect } from "react";

export default function ShipmentTabs({ shipments, filteredShipments, activeTab, setActiveTab }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTabCount = (list, tabVal) => {
    return list.filter(s => {
      const sStatus = s.status.toLowerCase();
      if (tabVal === "exception") return sStatus === "ndr";
      if (tabVal === "rto in transit") return sStatus === "rto";
      if (tabVal === "rto delivered") return sStatus === "rto delivered" || sStatus === "rto completed";
      return sStatus === tabVal;
    }).length;
  };

  const moreOptions = [
    { label: "Cancelled", value: "cancelled" },
    { label: "Exception", value: "exception" },
    { label: "RTO In Transit", value: "rto in transit" },
    { label: "RTO Delivered", value: "rto delivered" }
  ];
  const isMoreActive = moreOptions.some(opt => opt.value === activeTab);
  const activeMoreLabel = isMoreActive ? moreOptions.find(opt => opt.value === activeTab)?.label : "More";
  const moreActiveCount = getTabCount(filteredShipments, activeTab);

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-xl p-2 mb-6 shadow-xs flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-500 relative">
      {/* All Shipments */}
      <button
        type="button"
        onClick={() => {
          setActiveTab("all");
          setMoreOpen(false);
        }}
        className={`px-4 py-2 rounded-full flex items-center gap-2 transition cursor-pointer ${
          activeTab === "all" 
            ? "bg-[#25a2fe] text-white" 
            : "hover:bg-slate-50 text-slate-650"
        }`}
      >
        <span>All Shipments</span>
        {activeTab === "all" && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white animate-fadeIn">
            {filteredShipments.length}
          </span>
        )}
      </button>

      {/* Status Tab buttons */}
      {[
        { label: "Processing", value: "processing" },
        { label: "Booked", value: "booked" },
        { label: "Pending Pickup", value: "pending pickup" },
        { label: "In Transit", value: "in transit" },
        { label: "Out for Delivery", value: "out for delivery" },
        { label: "Delivered", value: "delivered" }
      ].map((tab) => {
        const count = getTabCount(filteredShipments, tab.value);
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveTab(tab.value);
              setMoreOpen(false);
            }}
            className={`px-4 py-2 rounded-full flex items-center gap-2 transition cursor-pointer ${
              isActive 
                ? "bg-[#25a2fe] text-white" 
                : "hover:bg-slate-50 text-slate-650"
            }`}
          >
            <span>{tab.label}</span>
            {isActive && count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white animate-fadeIn">
                {count}
              </span>
            )}
          </button>
        );
      })}

      {/* More Dropdown button */}
      <div className="relative" ref={moreRef}>
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={`px-4 py-2 border rounded-full flex items-center gap-1.5 transition cursor-pointer ${
            isMoreActive 
              ? "bg-[#25a2fe] text-white border-[#25a2fe]" 
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          }`}
        >
          <span>{activeMoreLabel}</span>
          {isMoreActive && moreActiveCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white animate-fadeIn">
              {moreActiveCount}
            </span>
          )}
          <svg className={`w-3.5 h-3.5 ${isMoreActive ? "text-white" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* More options list */}
        {moreOpen && (
          <div className="absolute left-0 mt-2 w-40 bg-white border border-slate-150 rounded-xl shadow-xl py-1.5 z-30 animate-slideUp">
            {moreOptions.map((opt) => {
              const optCount = getTabCount(filteredShipments, opt.value);
              const isOptActive = activeTab === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setActiveTab(opt.value);
                    setMoreOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition cursor-pointer text-xs font-semibold flex justify-between items-center ${
                    isOptActive ? "text-[#25a2fe] bg-[#25a2fe]/5" : "text-slate-700"
                  }`}
                >
                  <span>{opt.label}</span>
                  {optCount > 0 && (
                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                      {optCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
