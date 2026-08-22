"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

// CustomSelect component to support rounded dropdown list menus (rounded-xl)
function CustomSelect({ value, onChange, placeholder, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-slate-200 hover:border-slate-350 focus:border-slate-400 rounded-xl px-4 py-3 text-xs text-slate-700 font-semibold bg-slate-50 focus:outline-none transition cursor-pointer text-left"
      >
        <span className={!value ? "text-slate-400 font-medium" : "text-slate-700 font-semibold"}>
          {value || placeholder}
        </span>
        <svg className={`w-3.5 h-3.5 text-slate-450 transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-xl shadow-xl py-1.5 z-30 animate-slideUp text-xs font-semibold text-slate-700 max-h-56 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 transition cursor-pointer text-slate-700 font-semibold"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



export default function ShipOrderModal({ isOpen, onClose, order, onSubmit }) {
  const [pickupWarehouse, setPickupWarehouse] = useState("Primary Warehouse");
  const [rtoWarehouse, setRTOWarehouse] = useState("Primary Warehouse");
  const [autoAssign, setAutoAssign] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [couriers, setCouriers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch warehouse list from shared React Query cache
  const { data: warehouseList } = useQuery({
    queryKey: ["warehouse"],
    queryFn: () => api.get("/warehouse").then(res => res.data || []),
    staleTime: 60 * 1000,
    enabled: isOpen,
  });

  useEffect(() => {
    if (warehouseList) {
      setWarehouses(warehouseList);
      const defaultWh = warehouseList.find(w => w.isDefault) || warehouseList[0];
      if (defaultWh) {
        setPickupWarehouse(defaultWh.name);
        setRTOWarehouse(defaultWh.name);
      }
    }
  }, [warehouseList]);

  // Lock background scroll when modal is open and fetch couriers
  useEffect(() => {
    if (isOpen && order) {
      document.body.style.overflow = "hidden";
      fetchCouriers();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, order]);

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const targetId = order?.orderId || order?.id || "";
      const cleanOrderId = targetId.startsWith("#") ? targetId.slice(1) : targetId;
      const data = await api.get(`/orders/couriers?orderId=${encodeURIComponent(cleanOrderId)}`);
      
      const list = (data && data.success && Array.isArray(data.data)) 
        ? data.data 
        : (Array.isArray(data) ? data : []);

      setCouriers(list);
      if (list.length > 0) {
        setSelectedCourier(list[0].name);
      }
    } catch (err) {
      console.error("Failed to load couriers:", err);
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = () => {
    onSubmit({
      pickupWarehouse,
      rtoWarehouse,
      autoAssign,
      courierPartner: autoAssign && !selectedCourier ? "Auto Assigned" : selectedCourier
    });
  };

  // Avatar/icon colors matching screenshot
  const avatarColors = {
    X: "bg-cyan-50 text-cyan-600 border border-cyan-100",
    A: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    D: "bg-yellow-50 text-yellow-600 border border-yellow-100",
    B: "bg-indigo-50 text-indigo-600 border border-indigo-100",
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl z-10 border border-slate-100 animate-scaleUp font-sans flex flex-col max-h-[90vh] overflow-hidden">
        {/* Close button */}
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
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Ship Order <span className="text-slate-400 font-medium ml-1.5">{order.id}</span>
            </h2>
            <p className="text-[10px] text-slate-450 mt-0.5 font-medium">Configure shipping details for this order</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto flex flex-col gap-6 no-scrollbar">
          {/* Warehouse Dropdowns Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-2">
                Pickup Warehouse
              </label>
              <CustomSelect
                value={pickupWarehouse}
                placeholder="Select Warehouse"
                options={warehouses.length > 0 ? warehouses.map(w => w.name) : ["Primary Warehouse"]}
                onChange={setPickupWarehouse}
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-2">
                RTO Warehouse
              </label>
              <CustomSelect
                value={rtoWarehouse}
                placeholder="Select Warehouse"
                options={warehouses.length > 0 ? warehouses.map(w => w.name) : ["Primary Warehouse"]}
                onChange={setRTOWarehouse}
              />
            </div>
          </div>

          {/* Auto Assign Couriers Card */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex-1 pr-6">
              <h3 className="text-xs font-bold text-slate-800">Auto assign couriers</h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-semibold">
                Note: When Auto Assign is enabled, selecting a courier is optional. If selected, orders will be assigned to that courier first.
              </p>
            </div>
            
            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setAutoAssign(!autoAssign)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                autoAssign ? "bg-[#013c9c]" : "bg-slate-200"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  autoAssign ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Select Courier Partner Header */}
          <div className="flex items-center gap-2 mt-2">
            <svg className="w-4 h-4 text-slate-450" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <h3 className="text-xs font-bold text-slate-800">Select Courier Partner</h3>
          </div>

          {/* Courier Card List Grid */}
          {loading ? (
            <div className="h-44 flex items-center justify-center text-xs font-bold text-slate-400">
              Loading courier partners...
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin select-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {couriers.map((courier) => {
                  const isSelected = selectedCourier === courier.name;
                  const isCourierDisabled = !autoAssign && !selectedCourier;

                  return (
                    <div
                      key={courier.id}
                      onClick={() => setSelectedCourier(courier.name)}
                      className={`border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-[#013c9c] bg-slate-50/50 shadow-sm translate-y-[-1px]"
                          : "border-slate-150 hover:border-slate-300 hover:shadow-xs active:translate-y-0"
                      }`}
                    >
                      {/* Left: Radio + Avatar + Name */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? "border-[#013c9c] bg-[#013c9c]" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-scaleUp" />
                          )}
                        </div>

                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 select-none ${
                            avatarColors[courier.avatar] || "bg-slate-50 text-slate-500 border border-slate-100"
                          }`}
                        >
                          {courier.avatar}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">
                            {courier.name}
                          </p>
                        </div>
                      </div>

                      {/* Right: EDD + Price */}
                      <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                        <span className="bg-orange-50/60 border border-orange-200/50 text-orange-600 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide">
                          EDD: {courier.edd || "7 days"}
                        </span>
                        <div>
                          <p className="text-xs font-black text-slate-900">
                            ₹{courier.price || 95}
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold leading-none">Est. cost</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/40 flex justify-end gap-3 shrink-0 select-none">
          <button
            onClick={onClose}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-5 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!autoAssign && !selectedCourier}
            className="bg-[#1e293b] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 text-xs font-bold flex items-center gap-2 hover:-translate-y-[1px] active:translate-y-0 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span>Ship Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
