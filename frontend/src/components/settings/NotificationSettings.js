"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function NotificationSettings() {
  // SMS settings hooks
  const [smsBrandName, setSmsBrandName] = useState("");
  const [smsUseChannelName, setSmsUseChannelName] = useState(false);
  const [smsBooked, setSmsBooked] = useState(true);
  const [smsInTransit, setSmsInTransit] = useState(false);
  const [smsOutForDelivery, setSmsOutForDelivery] = useState(true);
  const [smsDelivered, setSmsDelivered] = useState(true);
  const [smsCancelled, setSmsCancelled] = useState(false);
  const [smsNdr, setSmsNdr] = useState(true);

  // WhatsApp settings hooks
  const [waBrandName, setWaBrandName] = useState("");
  const [waUseChannelName, setWaUseChannelName] = useState(false);
  const [waBooked, setWaBooked] = useState(false);
  const [waInTransit, setWaInTransit] = useState(false);
  const [waOutForDelivery, setWaOutForDelivery] = useState(true);
  const [waDelivered, setWaDelivered] = useState(false);
  const [waCancelled, setWaCancelled] = useState(false);
  const [waNdr, setWaNdr] = useState(false);

  const [savingSms, setSavingSms] = useState(false);
  const [savingWa, setSavingWa] = useState(false);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch settings via useQuery
  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: ["settings", "notification"],
    queryFn: () => api.get("/notification-settings").then(res => res.data),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  // Sync state from query cache
  useEffect(() => {
    if (queryData) {
      setSmsBrandName(queryData.smsBrandName || "");
      setSmsUseChannelName(!!queryData.smsUseChannelName);
      setSmsBooked(queryData.smsBooked !== undefined ? queryData.smsBooked : true);
      setSmsInTransit(!!queryData.smsInTransit);
      setSmsOutForDelivery(queryData.smsOutForDelivery !== undefined ? queryData.smsOutForDelivery : true);
      setSmsDelivered(queryData.smsDelivered !== undefined ? queryData.smsDelivered : true);
      setSmsCancelled(!!queryData.smsCancelled);
      setSmsNdr(queryData.smsNdr !== undefined ? queryData.smsNdr : true);

      setWaBrandName(queryData.waBrandName || "");
      setWaUseChannelName(!!queryData.waUseChannelName);
      setWaBooked(!!queryData.waBooked);
      setWaInTransit(!!queryData.waInTransit);
      setWaOutForDelivery(queryData.waOutForDelivery !== undefined ? queryData.waOutForDelivery : true);
      setWaDelivered(!!queryData.waDelivered);
      setWaCancelled(!!queryData.waCancelled);
      setWaNdr(!!queryData.waNdr);
    }
  }, [queryData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/notification-settings", payload).then(res => {
      if (!res.success) throw new Error(res.message || "Failed to save settings");
      return res.data;
    }),
    onSuccess: (data, variables) => {
      if (variables._type === "sms") {
        showToast("SMS notification settings saved successfully!");
      } else {
        showToast("WhatsApp notification settings saved successfully!");
      }
      queryClient.setQueryData(["settings", "notification"], data);
      queryClient.invalidateQueries({ queryKey: ["settings", "notification"] });
    },
    onError: (err) => {
      console.error(err);
      showToast(err.message || "Failed to save settings.", "error");
    },
    onSettled: (data, err, variables) => {
      if (variables._type === "sms") {
        setSavingSms(false);
      } else {
        setSavingWa(false);
      }
    }
  });

  // Save SMS settings
  const handleSaveSms = () => {
    setSavingSms(true);
    saveMutation.mutate({
      _type: "sms",
      smsBrandName,
      smsUseChannelName,
      smsBooked,
      smsInTransit,
      smsOutForDelivery,
      smsDelivered,
      smsCancelled,
      smsNdr,
      waBrandName,
      waUseChannelName,
      waBooked,
      waInTransit,
      waOutForDelivery,
      waDelivered,
      waCancelled,
      waNdr
    });
  };

  // Save WhatsApp settings
  const handleSaveWa = () => {
    setSavingWa(true);
    saveMutation.mutate({
      _type: "wa",
      smsBrandName,
      smsUseChannelName,
      smsBooked,
      smsInTransit,
      smsOutForDelivery,
      smsDelivered,
      smsCancelled,
      smsNdr,
      waBrandName,
      waUseChannelName,
      waBooked,
      waInTransit,
      waOutForDelivery,
      waDelivered,
      waCancelled,
      waNdr
    });
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-sans font-bold text-slate-400 text-xs">
        Loading notification settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans text-slate-700 select-none">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all border ${
          toast.type === "success" ? "bg-emerald-50 border-emerald-150 text-emerald-600" :
          toast.type === "error" ? "bg-rose-50 border-rose-150 text-rose-600" :
          "bg-blue-50 border-blue-150 text-blue-600"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notification Settings
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">Manage SMS and WhatsApp notifications for order status updates.</p>
      </div>

      {/* Grid container: SMS Settings (Left), WhatsApp Settings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Side: SMS Settings Column */}
        <div className="flex flex-col gap-6">
          
          {/* Card 1: SMS Brand Info */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">SMS Brand Information</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Set Brand Name and Channel Name for SMS</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Use Brand Name in SMS</label>
              <input
                type="text"
                value={smsBrandName}
                onChange={(e) => setSmsBrandName(e.target.value)}
                placeholder="Enter Brand Name (e.g. MYBRAND)"
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#25a2fe] focus:ring-1 focus:ring-[#25a2fe]/20 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition-all"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-t border-slate-100 mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Use Channel Names as Brand Name</span>
                <span className="w-4 h-4 text-slate-400 cursor-pointer flex items-center justify-center border border-slate-300 rounded-full text-[9px] font-bold" title="Uses channel name like Shopify instead of default string">i</span>
              </div>
              <button
                type="button"
                onClick={() => setSmsUseChannelName(!smsUseChannelName)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                  smsUseChannelName ? "bg-[#25a2fe]" : "bg-slate-200"
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${smsUseChannelName ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          {/* Card 2: SMS Status Switch List */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5M12 14v7" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">SMS Order Status Notifications</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Choose order updates you want to send via SMS</p>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 border-t border-slate-100 pt-2.5">
              {/* Switch: Booked */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">📅</span>
                  <span className="text-xs font-bold text-slate-750">Booked</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsBooked(!smsBooked)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    smsBooked ? "bg-[#25a2fe]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${smsBooked ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: In Transit */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">🚚</span>
                  <span className="text-xs font-bold text-slate-750">In Transit</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsInTransit(!smsInTransit)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    smsInTransit ? "bg-[#25a2fe]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${smsInTransit ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: Out for Delivery */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">🛵</span>
                  <span className="text-xs font-bold text-slate-750">Out for Delivery</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsOutForDelivery(!smsOutForDelivery)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    smsOutForDelivery ? "bg-[#25a2fe]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${smsOutForDelivery ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: Delivered */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">✔</span>
                  <span className="text-xs font-bold text-slate-750">Delivered</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsDelivered(!smsDelivered)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    smsDelivered ? "bg-[#25a2fe]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${smsDelivered ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: Cancelled */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">✖</span>
                  <span className="text-xs font-bold text-slate-750">Cancelled</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsCancelled(!smsCancelled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    smsCancelled ? "bg-[#25a2fe]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${smsCancelled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: NDR */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">❗</span>
                  <span className="text-xs font-bold text-slate-750">NDR</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsNdr(!smsNdr)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    smsNdr ? "bg-[#25a2fe]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${smsNdr ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Action button SMS */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSms}
              disabled={savingSms}
              className="bg-[#25a2fe] hover:bg-[#1a8ee4] text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer w-full justify-center md:w-auto"
            >
              {savingSms ? "Saving SMS Settings..." : "Save SMS Settings"}
            </button>
          </div>
        </div>

        {/* Right Side: WhatsApp Settings Column */}
        <div className="flex flex-col gap-6">
          
          {/* Card 1: WhatsApp Brand Info */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.01 2c-5.5 0-9.96 4.43-9.97 9.9 0 2.01.6 3.96 1.73 5.61L2.1 21.9l4.57-1.19c1.6.87 3.4 1.33 5.24 1.33h.01c5.5 0 9.96-4.43 9.97-9.9.01-2.65-1.02-5.14-2.9-7.01A9.9 9.9 0 0012.01 2zm5.29 13.9c-.22.61-1.28 1.13-1.77 1.17-.45.04-.89.02-2.88-.75-2.55-.99-4.2-3.55-4.32-3.71-.13-.17-1.04-1.37-1.04-2.6 0-1.25.66-1.85.89-2.1.23-.25.5-.32.67-.32l.48.01c.14 0 .34-.05.52.37.19.46.66 1.62.72 1.74.06.12.1.27.02.43-.08.17-.12.27-.25.42-.12.15-.26.34-.37.45-.13.13-.26.27-.11.53.15.26.66 1.07 1.41 1.73.97.85 1.79 1.12 2.05 1.25.26.13.41.11.56-.05.15-.17.65-.74.82-1 .17-.25.34-.21.58-.12.23.09 1.48.69 1.73.81.25.13.42.19.48.29.06.11.06.63-.16 1.24z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">WhatsApp Brand Information</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Set Brand Name and Channel Name for WhatsApp</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Use Brand Name in WhatsApp</label>
              <input
                type="text"
                value={waBrandName}
                onChange={(e) => setWaBrandName(e.target.value)}
                placeholder="Enter Brand Name (e.g. MYBRAND)"
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/20 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition-all"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-t border-slate-100 mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Use Channel Names as Brand Name</span>
                <span className="w-4 h-4 text-slate-400 cursor-pointer flex items-center justify-center border border-slate-300 rounded-full text-[9px] font-bold" title="Uses channel name like Shopify instead of default string">i</span>
              </div>
              <button
                type="button"
                onClick={() => setWaUseChannelName(!waUseChannelName)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                  waUseChannelName ? "bg-[#10b981]" : "bg-slate-200"
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${waUseChannelName ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          {/* Card 2: WhatsApp Status Switch List */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5M12 14v7" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">WhatsApp Order Status Notifications</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Choose order updates you want to send via WhatsApp</p>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 border-t border-slate-100 pt-2.5">
              {/* Switch: Booked */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">📅</span>
                  <span className="text-xs font-bold text-slate-750">Booked</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWaBooked(!waBooked)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    waBooked ? "bg-[#10b981]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${waBooked ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: In Transit */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">🚚</span>
                  <span className="text-xs font-bold text-slate-750">In Transit</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWaInTransit(!waInTransit)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    waInTransit ? "bg-[#10b981]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${waInTransit ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: Out for Delivery */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">🛵</span>
                  <span className="text-xs font-bold text-slate-750">Out for Delivery</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWaOutForDelivery(!waOutForDelivery)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    waOutForDelivery ? "bg-[#10b981]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${waOutForDelivery ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: Delivered */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">✔</span>
                  <span className="text-xs font-bold text-slate-750">Delivered</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWaDelivered(!waDelivered)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    waDelivered ? "bg-[#10b981]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${waDelivered ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: Cancelled */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">✖</span>
                  <span className="text-xs font-bold text-slate-750">Cancelled</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWaCancelled(!waCancelled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    waCancelled ? "bg-[#10b981]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${waCancelled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Switch: NDR */}
              <div className="flex justify-between items-center py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">❗</span>
                  <span className="text-xs font-bold text-slate-750">NDR</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWaNdr(!waNdr)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
                    waNdr ? "bg-[#10b981]" : "bg-slate-200"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${waNdr ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Action button WhatsApp */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveWa}
              disabled={savingWa}
              className="bg-[#10b981] hover:bg-[#0ea571] text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer w-full justify-center md:w-auto"
            >
              {savingWa ? "Saving WhatsApp Settings..." : "Save WhatsApp Settings"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
