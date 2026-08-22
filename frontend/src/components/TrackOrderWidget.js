"use client";

import { useState } from "react";

export default function TrackOrderWidget() {
  const [activeTab, setActiveTab] = useState("awb"); // "awb", "mobile", "order"
  const [inputValue, setInputValue] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setTrackResult(null);

    // Simulate real AWB API search track lookup
    setTimeout(() => {
      setLoading(false);
      setTrackResult({
        status: "In Transit",
        location: "Delhi Sorting Hub",
        eta: "Tomorrow, 5:00 PM",
        carrier: "BlueDart Express",
      });
    }, 800);
  };

  const getPlaceholder = () => {
    switch (activeTab) {
      case "awb":
        return "Enter Airway Bill Number (AWB)";
      case "mobile":
        return "Enter registered mobile number";
      case "order":
        return "Enter Order ID (e.g. BS-90812)";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800 tracking-wide">Track your order</h4>
          <p className="text-xs text-slate-500">Get real-time updates on your shipments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-4 text-xs font-semibold text-slate-500">
        <button
          type="button"
          onClick={() => { setActiveTab("awb"); setTrackResult(null); setInputValue(""); }}
          className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "awb" ? "text-blue-600 border-blue-600 font-bold" : "border-transparent hover:text-slate-800"
          }`}
        >
          AWB Number
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("mobile"); setTrackResult(null); setInputValue(""); }}
          className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "mobile" ? "text-blue-600 border-blue-600 font-bold" : "border-transparent hover:text-slate-800"
          }`}
        >
          Mobile Number
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("order"); setTrackResult(null); setInputValue(""); }}
          className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "order" ? "text-blue-600 border-blue-600 font-bold" : "border-transparent hover:text-slate-800"
          }`}
        >
          Order ID
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleTrackSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-650 hover:bg-blue-600 disabled:bg-blue-800 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
        >
          {loading ? "Searching..." : "Track Order →"}
        </button>
      </form>

      {/* Track Result Display */}
      {trackResult && (
        <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100/80 rounded-xl text-xs flex flex-col gap-1.5 animate-fadeIn">
          <div className="flex justify-between">
            <span className="text-slate-500">Carrier:</span>
            <span className="font-semibold text-slate-700">{trackResult.carrier}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-bold text-emerald-600">{trackResult.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Current Hub:</span>
            <span className="text-slate-700">{trackResult.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Est. Delivery:</span>
            <span className="text-blue-600 font-semibold">{trackResult.eta}</span>
          </div>
        </div>
      )}
    </div>
  );
}
