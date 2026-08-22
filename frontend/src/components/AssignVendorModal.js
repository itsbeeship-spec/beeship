"use client";

import { useState, useEffect } from "react";

const COURIER_OPTIONS = [];

export default function AssignVendorModal({ isOpen, onClose, order, selectedCount, onAssign }) {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSelectedVendor("");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;
    
    setIsSubmitting(true);
    try {
      await onAssign(selectedVendor);
      onClose();
    } catch (err) {
      console.error("Error submitting vendor assignment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn" 
        onClick={onClose} 
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 overflow-hidden animate-scaleUp font-sans z-10">
        {/* Header Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#013c9c] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h2.25m-2.25 0v-7.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21m-4.75-9h.008v.008H12V12zm3.75 0h.008v.008h-.008V12zm-7.5 0h.008v.008H8.25V12zm0 3.75h.008v.008H8.25v-.008zm3.75 0h.008v.008H12v-.008zm3.75 0h.008v.008h-.008v-.008zm-11.25 4.5h.008v.008H4.5v-.008zm3.75 0h.008v.008H8.25v-.008z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">Assign Vendor</h3>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 tracking-wide">Select Vendor</label>
            <div className="relative">
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
              >
                <option value="">Choose a vendor</option>
                {COURIER_OPTIONS.map((courier) => (
                  <option key={courier.id} value={courier.name}>
                    {courier.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 font-medium mt-1">
              {order ? (
                <>Assigning order <span className="font-bold text-slate-600">{order.id}</span> to this vendor.</>
              ) : (
                <>Assigning <span className="font-bold text-slate-600">{selectedCount}</span> selected orders to this vendor.</>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-350 rounded-xl text-xs font-bold text-slate-500 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedVendor || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer flex items-center gap-1.5 ${
                !selectedVendor || isSubmitting
                  ? "bg-slate-300 cursor-not-allowed shadow-none text-slate-400"
                  : "bg-slate-700 hover:bg-slate-800"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Assign Vendor</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
