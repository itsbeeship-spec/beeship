"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/config";

export default function TrackOrderWidget() {
  const [activeTab, setActiveTab] = useState("awb"); // "awb", "mobile", "order"
  const [inputValue, setInputValue] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper to generate dynamic tracking milestone history based on database dates
  const getMilestones = (order) => {
    const status = order.status.toLowerCase();
    const isCancelled = status === "cancelled";
    
    const createdDate = new Date(order.date);
    
    const formatDate = (date) => {
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    };

    // Simulate standard transit milestone timelines relative to order creation date
    const pickupDate = new Date(createdDate.getTime() + 4 * 60 * 60 * 1000); // +4 hours
    const transitDate = new Date(createdDate.getTime() + 18 * 60 * 60 * 1000); // +18 hours
    const outForDeliveryDate = new Date(createdDate.getTime() + 32 * 60 * 60 * 1000); // +32 hours
    const deliveredDate = new Date(createdDate.getTime() + 40 * 60 * 60 * 1000); // +40 hours

    const milestones = [
      {
        title: "Shipment Created",
        desc: "Order details successfully registered on BeeShip.",
        completed: true,
        time: formatDate(createdDate)
      },
      {
        title: "Pickup Scheduled",
        desc: "First-mile pickup request confirmed with courier partner.",
        completed: !isCancelled,
        time: !isCancelled ? formatDate(pickupDate) : null
      }
    ];

    if (isCancelled) {
      milestones.push({
        title: "Cancelled",
        desc: "This shipment was cancelled by the merchant or courier.",
        completed: true,
        time: formatDate(createdDate)
      });
      return milestones;
    }

    const isPickedUp = !["booked", "pending", "pending pickup"].includes(status);
    const isInTransit = ["in transit", "out for delivery", "delivered"].includes(status);
    const isOutForDelivery = ["out for delivery", "delivered"].includes(status);
    const isDelivered = status === "delivered";

    milestones.push({
      title: "Picked Up",
      desc: "Package collected by courier courier executive.",
      completed: isPickedUp,
      time: isPickedUp ? formatDate(pickupDate) : "Pending"
    });

    milestones.push({
      title: "In Transit",
      desc: "Package departed from source hub and is in transit.",
      completed: isInTransit,
      time: isInTransit ? formatDate(transitDate) : "Pending"
    });

    milestones.push({
      title: "Out for Delivery",
      desc: "Package is out for local delivery in destination city.",
      completed: isOutForDelivery,
      time: isOutForDelivery ? formatDate(outForDeliveryDate) : "Pending"
    });

    milestones.push({
      title: "Delivered",
      desc: "Package successfully delivered to the recipient.",
      completed: isDelivered,
      time: isDelivered ? formatDate(deliveredDate) : "Pending"
    });

    return milestones;
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setTrackResult(null);

    try {
      // Fetch public order tracking from backend API dynamically using API_BASE config
      const res = await fetch(`${API_BASE}/orders/public/track?query=${encodeURIComponent(inputValue.trim())}`);
      const data = await res.json();

      if (data && data.success && data.data) {
        const o = data.data;
        const isDelivered = o.status.toLowerCase() === "delivered";
        const isCancelled = o.status.toLowerCase() === "cancelled";

        // Format Date beautifully
        const dateObj = new Date(o.date);
        const formattedDate = dateObj.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        // Fetch visual milestones
        const milestones = getMilestones({ ...o, date: o.date });

        setTrackResult({
          carrier: o.carrier,
          status: o.status,
          location: o.destination || "-",
          eta: isDelivered ? "Completed" : isCancelled ? "Cancelled" : "In 2 Days",
          awb: o.awbNumber || "-",
          date: formattedDate,
          milestones: milestones
        });
      } else {
        setTrackResult({
          carrier: "Lookup Failed",
          status: "Not Found",
          location: "Check AWB or Order ID",
          eta: "N/A",
          awb: "-",
          date: "-",
          milestones: []
        });
      }
    } catch (err) {
      console.error("Public tracking search error:", err);
      setTrackResult({
        carrier: "Error",
        status: "Network Error",
        location: "Failed to connect to server",
        eta: "N/A",
        awb: "-",
        date: "-",
        milestones: []
      });
    } finally {
      setLoading(false);
    }
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
        <div className="mt-5 p-4 bg-blue-50/40 border border-blue-150 rounded-2xl text-xs flex flex-col gap-4 animate-fadeIn">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-blue-100/50">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">AWB Number</p>
              <p className="font-bold text-slate-800 mt-0.5">{trackResult.awb}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Courier Partner</p>
              <p className="font-bold text-slate-800 mt-0.5">{trackResult.carrier}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Destination</p>
              <p className="font-bold text-slate-800 mt-0.5">{trackResult.location}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Current Status</p>
              <p className="font-bold text-emerald-600 mt-0.5">{trackResult.status}</p>
            </div>
          </div>

          {/* Stepper Timeline History */}
          <div className="flex flex-col gap-5 pl-4 relative select-none mt-2">
            {/* Vertical Line */}
            <div className="absolute left-[5px] top-2.5 bottom-2.5 w-[2px] bg-slate-200" />

            {trackResult.milestones?.map((step, idx) => {
              const isActive = step.completed;
              return (
                <div key={idx} className="flex items-start gap-4 relative">
                  {/* Stepper Dot */}
                  <div
                    className={`w-3 h-3 rounded-full border-2 border-white z-10 -ml-[21px] mt-1 shadow-sm transition-all duration-300 ${
                      isActive ? "bg-emerald-500 scale-110 ring-4 ring-emerald-50" : "bg-slate-300 scale-90"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-xs font-bold ${isActive ? "text-slate-800" : "text-slate-400 font-semibold"}`}>
                        {step.title}
                      </p>
                      {step.time && step.time !== "Pending" && (
                        <span className="text-[9px] text-slate-450 font-bold bg-white border border-slate-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                          {step.time}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isActive ? "text-slate-500" : "text-slate-400"}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
