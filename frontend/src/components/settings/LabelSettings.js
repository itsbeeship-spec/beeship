"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function LabelSettings() {
  // Label Form configurations
  const [showLogo, setShowLogo] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [useChannelLogo, setUseChannelLogo] = useState(false);
  const [showSupportContact, setShowSupportContact] = useState(true);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMobile, setSupportMobile] = useState("");
  const [hideCustomerMobile, setHideCustomerMobile] = useState(false);
  const [hideSku, setHideSku] = useState(false);
  const [hideProduct, setHideProduct] = useState(false);
  const [hideQty, setHideQty] = useState(false);
  const [hideTotalAmount, setHideTotalAmount] = useState(false);
  const [hideDiscountAmount, setHideDiscountAmount] = useState(false);
  const [hideOrderAmount, setHideOrderAmount] = useState(false);
  const [showCodAmount, setShowCodAmount] = useState(true);
  const [showPrepaidAmount, setShowPrepaidAmount] = useState(false);
  const [trimSkuUpto, setTrimSkuUpto] = useState(20);
  const [trimProductNameUpto, setTrimProductNameUpto] = useState(50);
  const [showLineItemsCount, setShowLineItemsCount] = useState(5);
  const [labelSize, setLabelSize] = useState("4x6");

  const [userProfile, setUserProfile] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const logoInputRef = useRef(null);
  const queryClient = useQueryClient();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch settings via useQuery
  const { data: labelData, isLoading: labelLoading } = useQuery({
    queryKey: ["settings", "label"],
    queryFn: () => api.get("/label-settings").then(res => res.data),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const { data: meData } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/auth/me").then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: warehouseData } = useQuery({
    queryKey: ["warehouse"],
    queryFn: () => api.get("/warehouse").then(res => res.data || []),
    staleTime: 60 * 1000,
  });

  const loading = labelLoading;

  // Sync state from query cache
  useEffect(() => {
    if (labelData) {
      setShowLogo(labelData.showLogo);
      setLogoUrl(labelData.logoUrl || "");
      setLogoPreview(labelData.logoUrl || "");
      setUseChannelLogo(labelData.useChannelLogo);
      setShowSupportContact(labelData.showSupportContact);
      setSupportEmail(labelData.supportEmail || "");
      setSupportMobile(labelData.supportMobile || "");
      setHideCustomerMobile(labelData.hideCustomerMobile);
      setHideSku(labelData.hideSku);
      setHideProduct(labelData.hideProduct);
      setHideQty(labelData.hideQty);
      setHideTotalAmount(labelData.hideTotalAmount);
      setHideDiscountAmount(labelData.hideDiscountAmount);
      setHideOrderAmount(labelData.hideOrderAmount);
      setShowCodAmount(labelData.showCodAmount);
      setShowPrepaidAmount(labelData.showPrepaidAmount);
      setTrimSkuUpto(labelData.trimSkuUpto || 20);
      setTrimProductNameUpto(labelData.trimProductNameUpto || 50);
      setShowLineItemsCount(labelData.showLineItemsCount || 5);
      setLabelSize(labelData.labelSize || "4x6");
    }
  }, [labelData]);

  useEffect(() => {
    if (meData) {
      setUserProfile(meData);
    }
  }, [meData]);

  useEffect(() => {
    if (warehouseData) {
      setWarehouses(warehouseData);
    }
  }, [warehouseData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/label-settings", payload).then(res => {
      if (!res.success) throw new Error(res.message || "Failed to save settings");
      return res.data;
    }),
    onSuccess: (data) => {
      showToast("Label settings saved successfully!");
      queryClient.setQueryData(["settings", "label"], data);
      queryClient.invalidateQueries({ queryKey: ["settings", "label"] });
    },
    onError: (err) => {
      console.error("Failed to save label settings:", err);
      showToast(err.message || "Failed to save settings.", "error");
    },
    onSettled: () => {
      setSaving(false);
    }
  });

  // Save Settings handler
  const handleSave = () => {
    setSaving(true);
    const payload = {
      showLogo,
      logoUrl,
      useChannelLogo,
      showSupportContact,
      supportEmail,
      supportMobile,
      hideCustomerMobile,
      hideSku,
      hideProduct,
      hideQty,
      hideTotalAmount,
      hideDiscountAmount,
      hideOrderAmount,
      showCodAmount,
      showPrepaidAmount,
      trimSkuUpto: parseInt(trimSkuUpto, 10),
      trimProductNameUpto: parseInt(trimProductNameUpto, 10),
      showLineItemsCount: parseInt(showLineItemsCount, 10),
      labelSize
    };
    saveMutation.mutate(payload);
  };

  // Logo upload handler
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", "Label Branding Logo");

    showToast("Uploading logo...", "info");

    try {
      const res = await api.upload("/documents/upload", formData);
      if (res.success && res.data) {
        setLogoUrl(res.data.s3Url);
        setLogoPreview(URL.createObjectURL(file));
        showToast("Logo uploaded successfully!");
      } else {
        showToast("Upload failed.", "error");
      }
    } catch (err) {
      console.error("Logo upload failed:", err);
      showToast("Upload failed due to connection error.", "error");
    }
  };

  // Mock items for Label Preview rendering
  const mockLabelItems = [
    { name: "Pink Lace Babydoll Lingerie Set For Women - Sheer halter", sku: "", qty: 1, rate: 499, amount: 499, total: 499 },
    { name: "Shipping Charges", sku: "", qty: 1, rate: 42.37, amount: 42.37, total: 50 }
  ];

  const matchedWarehouse = warehouses.find(w => w.isDefault) || warehouses[0] || {};
  const displaySellerName = matchedWarehouse.personName || (userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "BeeShip Partner");
  const displayBusinessName = matchedWarehouse.name || userProfile?.companyName || "BeeShip Hub";
  const displayAddress = matchedWarehouse.address1 
    ? `${matchedWarehouse.address1}${matchedWarehouse.address2 ? `, ${matchedWarehouse.address2}` : ""}, ${matchedWarehouse.city}, ${matchedWarehouse.state} - ${matchedWarehouse.pincode}`
    : (userProfile?.addressLine1 
        ? `${userProfile.addressLine1}, ${userProfile.city}, ${userProfile.state} - ${userProfile.pincode}` 
        : "Plot No. 45, Sector 18, Udyog Vihar, Gurugram, Haryana - 122015");
  const displayPhone = matchedWarehouse.phone || userProfile?.mobile || "9999888877";

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-sans font-bold text-slate-400 text-xs">
        Loading label printing settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans text-slate-700">
      {/* Toast Notification */}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a8 8 0 11-16 0 8 8 0 0116 0z" />
          </svg>
          Label Printing Settings
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">Configure layout, margins and content visibility options for shipping labels.</p>
      </div>

      {/* Grid: Left Settings Form, Right Label Preview */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* Left Configurations: 65% width */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
          
          {/* Card 1: Common Settings */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4.5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5 select-none">Common Settings</h4>
            
            {/* Show Logo on Label */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-4 h-4 cursor-pointer"
                />
                Show Logo on Label
              </label>

              {showLogo && (
                <div className="pl-6.5 flex items-center gap-4">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="bg-[#25a2fe] hover:bg-[#1a8ee4] text-white transition px-4 py-2 rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Logo
                  </button>

                  {logoPreview ? (
                    <div className="relative border border-slate-200 rounded-lg p-1.5 bg-white flex items-center gap-2 group">
                      <img src={logoPreview} alt="Logo preview" className="h-7 max-w-[80px] object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrl("");
                          setLogoPreview("");
                        }}
                        className="bg-rose-50 text-rose-500 rounded p-0.5 hover:bg-rose-100 cursor-pointer transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold italic">No logo uploaded (falls back to business text)</span>
                  )}
                </div>
              )}
            </div>

            {/* Use Channel Logo */}
            <div className="pl-0">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={useChannelLogo}
                  onChange={(e) => setUseChannelLogo(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-4 h-4 cursor-pointer"
                />
                Use Channel Logo on Label
              </label>
            </div>

            {/* Show Support Contact */}
            <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-3.5 mt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={showSupportContact}
                  onChange={(e) => setShowSupportContact(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-4 h-4 cursor-pointer"
                />
                Show Support Email/Mobile No
              </label>
              
              {showSupportContact && (
                <div className="grid grid-cols-2 gap-4 pl-6.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Enter Email Id</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="e.g., support@domain.com"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#25a2fe] focus:ring-1 focus:ring-[#25a2fe]/20 rounded-lg px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Enter Mobile No</label>
                    <input
                      type="text"
                      value={supportMobile}
                      onChange={(e) => setSupportMobile(e.target.value)}
                      placeholder="e.g., 851088xxxx"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#25a2fe] focus:ring-1 focus:ring-[#25a2fe]/20 rounded-lg px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hide Customer Mobile */}
            <div className="border-t border-slate-100 pt-3.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={hideCustomerMobile}
                  onChange={(e) => setHideCustomerMobile(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-4 h-4 cursor-pointer"
                />
                Hide Customer Mobile Number
              </label>
              <span className="text-[10px] text-slate-400 font-medium block pl-6.5 mt-0.5">Masks customer phone numbers with asterisks on printable sheets.</span>
            </div>
          </div>

          {/* Card 2: Hide Product Details */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5 select-none">Hide Product Details</h4>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hideSku}
                  onChange={(e) => setHideSku(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-3.5 h-3.5 cursor-pointer"
                />
                Hide SKU
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hideProduct}
                  onChange={(e) => setHideProduct(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-3.5 h-3.5 cursor-pointer"
                />
                Hide Product Name
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hideQty}
                  onChange={(e) => setHideQty(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-3.5 h-3.5 cursor-pointer"
                />
                Hide QTY
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hideTotalAmount}
                  onChange={(e) => setHideTotalAmount(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-3.5 h-3.5 cursor-pointer"
                />
                Hide Total Amount
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hideDiscountAmount}
                  onChange={(e) => setHideDiscountAmount(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-3.5 h-3.5 cursor-pointer"
                />
                Hide Discount Amount
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hideOrderAmount}
                  onChange={(e) => setHideOrderAmount(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-3.5 h-3.5 cursor-pointer"
                />
                Hide Order Amount/Collectable
              </label>
            </div>
          </div>

          {/* Card 3: Order Amount Display Options */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5 select-none">Order Amount Display Options</h4>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showCodAmount}
                  onChange={(e) => setShowCodAmount(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-3.5 h-3.5 cursor-pointer"
                />
                Show Order Amount for COD
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showPrepaidAmount}
                  onChange={(e) => setShowPrepaidAmount(e.target.checked)}
                  className="rounded border-slate-300 text-[#25a2fe] focus:ring-[#25a2fe] w-3.5 h-3.5 cursor-pointer"
                />
                Show Order Amount for Prepaid
              </label>
            </div>
          </div>

          {/* Card 4: Limit & Trimming Options */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5 select-none">Limits & Trimming Options</h4>

            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trim SKU Upto</label>
                  <span className="text-[10px] text-[#25a2fe] font-bold">{trimSkuUpto} chars</span>
                </div>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={trimSkuUpto}
                  onChange={(e) => setTrimSkuUpto(Math.max(5, parseInt(e.target.value) || 5))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#25a2fe] focus:ring-1 focus:ring-[#25a2fe]/20 rounded-lg px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trim Product Name Upto</label>
                  <span className="text-[10px] text-[#25a2fe] font-bold">{trimProductNameUpto} chars</span>
                </div>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={trimProductNameUpto}
                  onChange={(e) => setTrimProductNameUpto(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#25a2fe] focus:ring-1 focus:ring-[#25a2fe]/20 rounded-lg px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Show Number of Line Items</label>
                  <span className="text-[10px] text-[#25a2fe] font-bold">{showLineItemsCount} items max</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={showLineItemsCount}
                  onChange={(e) => setShowLineItemsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#25a2fe] focus:ring-1 focus:ring-[#25a2fe]/20 rounded-lg px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 5: Label Size Selectors */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5 select-none">Label Paper Size</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Option A4 */}
              <div 
                onClick={() => setLabelSize("A4")}
                className={`border rounded-2xl p-5 flex flex-col items-center relative cursor-pointer transition-all duration-300 ${
                  labelSize === "A4" 
                    ? "border-[#25a2fe] bg-[#25a2fe]/5 shadow-[0_4px_16px_-4px_rgba(37,162,254,0.15)]" 
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                {labelSize === "A4" && (
                  <div className="absolute top-3 right-3 bg-[#25a2fe] text-white rounded-full p-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="text-center w-full">
                  <span className="text-xs font-bold text-slate-800 block">A4</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Standard A4 paper size for regular printers</span>
                  <span className="text-[10px] text-slate-455 font-bold mt-1.5 block">Dimensions: 8.27" x 11.69" inches</span>
                </div>

                {/* Visual block */}
                <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50 w-[95px] h-[134px] relative my-6 select-none shrink-0">
                  <span className="text-[9px] font-bold text-slate-400">A4</span>
                  <span className="text-[7.5px] text-slate-350 mt-1 font-mono font-bold">8.27" x 11.69"</span>
                  {/* dimension lines */}
                  <div className="absolute right-[-14px] top-0 bottom-0 flex items-center">
                    <span className="text-[6.5px] text-slate-400 font-mono rotate-90 origin-center">11.69"</span>
                  </div>
                  <div className="absolute bottom-[-15px] left-0 right-0 flex justify-center">
                    <span className="text-[6.5px] text-slate-400 font-mono">8.27"</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 ${
                    labelSize === "A4" 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {labelSize === "A4" ? "Currently Selected" : "Select This Format"}
                </button>
              </div>

              {/* Option Thermal (4x6) */}
              <div 
                onClick={() => setLabelSize("4x6")}
                className={`border rounded-2xl p-5 flex flex-col items-center relative cursor-pointer transition-all duration-300 ${
                  labelSize === "4x6" 
                    ? "border-[#25a2fe] bg-[#25a2fe]/5 shadow-[0_4px_16px_-4px_rgba(37,162,254,0.15)]" 
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                {labelSize === "4x6" && (
                  <div className="absolute top-3 right-3 bg-[#25a2fe] text-white rounded-full p-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="text-center w-full">
                  <span className="text-xs font-bold text-slate-800 block">Thermal</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Thermal printer labels for shipping</span>
                  <span className="text-[10px] text-slate-455 font-bold mt-1.5 block">Dimensions: 4" x 6" inches</span>
                </div>

                {/* Visual block */}
                <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50 w-[90px] h-[135px] relative my-6 select-none shrink-0">
                  <span className="text-[9px] font-bold text-slate-400">Thermal 4"x6"</span>
                  <span className="text-[7.5px] text-slate-350 mt-1 font-mono font-bold">4" x 6"</span>
                  {/* dimension lines */}
                  <div className="absolute right-[-14px] top-0 bottom-0 flex items-center">
                    <span className="text-[6.5px] text-slate-400 font-mono rotate-90 origin-center">6"</span>
                  </div>
                  <div className="absolute bottom-[-15px] left-0 right-0 flex justify-center">
                    <span className="text-[6.5px] text-slate-400 font-mono">4"</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl text-[10px] font-bold transition-all duration-200 ${
                    labelSize === "4x6" 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {labelSize === "4x6" ? "Currently Selected" : "Select This Format"}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#25a2fe] hover:bg-[#1a8ee4] text-white transition-all duration-200 px-7 py-3.5 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2 transform active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving Format...
                </>
              ) : (
                "Save Label Format"
              )}
            </button>
          </div>
        </div>

        {/* Right Label Live Preview: 35% width (Sticky) */}
        <div className="col-span-12 lg:col-span-5 lg:sticky lg:top-4 bg-slate-50/50 border border-slate-200/60 rounded-3xl p-5 flex flex-col gap-4 shadow-sm select-none">
          <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Live Label Preview
            </h4>
            <span className="text-[9.5px] text-slate-400 font-bold bg-slate-200/50 px-2 py-0.5 rounded-md font-mono">{labelSize === "A4" ? "A4 SHEET" : "4 x 6 IN"}</span>
          </div>

          {/* Label Container Box */}
          <div className="bg-white border border-slate-300 rounded-lg p-4.5 font-sans leading-relaxed text-[10px] text-slate-900 shadow-sm w-full max-w-[340px] mx-auto min-h-[480px] flex flex-col justify-between select-none">
            <div>
              {/* Logo & Delivery section */}
              <div className="flex gap-3 justify-between items-start border-b border-slate-200 pb-3 mb-3">
                {/* Logo Area */}
                <div className="w-[30%]">
                  {showLogo && (
                    useChannelLogo ? (
                      <div className="bg-slate-100 border border-slate-200 rounded p-1 text-[8px] font-bold text-slate-500 text-center uppercase tracking-tight">
                        Shopify
                      </div>
                    ) : (
                      logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-7 w-full object-contain" />
                      ) : (
                        <div className="bg-slate-100 border border-slate-200 rounded p-1 text-[8px] font-extrabold text-slate-700 text-center uppercase truncate">
                          Brand Logo
                        </div>
                      )
                    )
                  )}
                </div>

                {/* Delivery Area */}
                <div className="w-[70%] text-right flex flex-col gap-0.5 text-[9.5px]">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Deliver To:</span>
                  <span className="font-extrabold text-slate-950">Jack Jack</span>
                  <span className="text-slate-500 font-medium leading-tight">
                    H.No 12-4-88, Flat 302, Cyber Heights, HITEC City, Hyderabad, Telangana - 500081
                  </span>
                  <span className="font-bold text-slate-800">
                    MOBILE NO: {hideCustomerMobile ? "**********" : "8899661463"}
                  </span>
                  <span className="text-[9px] font-bold text-slate-455">Route code - HYD/SEC</span>
                </div>
              </div>

              {/* Order Info & Shipping Info Grid */}
              <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3 mb-3 text-[9px] leading-relaxed">
                {/* Left: Order Info */}
                <div className="border-r border-slate-200 pr-2 flex flex-col gap-1">
                  <span className="font-bold text-slate-950 uppercase border-b border-slate-100 pb-0.5">Order Info</span>
                  <span className="text-slate-500 font-medium">Order Date: Jul 07, 2026</span>
                  <span className="text-slate-500 font-medium">Invoice No: #order4469</span>
                  {/* SVG Barcode simulation */}
                  <div className="flex flex-col items-center mt-1 select-none">
                    <svg className="w-24 h-6 text-slate-950" viewBox="0 0 100 24">
                      <rect width="100%" height="100%" fill="white"/>
                      <rect x="2" y="2" width="2" height="20" fill="black"/>
                      <rect x="6" y="2" width="4" height="20" fill="black"/>
                      <rect x="12" y="2" width="1" height="20" fill="black"/>
                      <rect x="15" y="2" width="3" height="20" fill="black"/>
                      <rect x="20" y="2" width="2" height="20" fill="black"/>
                      <rect x="24" y="2" width="4" height="20" fill="black"/>
                      <rect x="30" y="2" width="1" height="20" fill="black"/>
                      <rect x="33" y="2" width="2" height="20" fill="black"/>
                      <rect x="37" y="2" width="4" height="20" fill="black"/>
                      <rect x="43" y="2" width="2" height="20" fill="black"/>
                      <rect x="47" y="2" width="3" height="20" fill="black"/>
                      <rect x="52" y="2" width="1" height="20" fill="black"/>
                      <rect x="55" y="2" width="4" height="20" fill="black"/>
                      <rect x="61" y="2" width="2" height="20" fill="black"/>
                      <rect x="65" y="2" width="1" height="20" fill="black"/>
                      <rect x="68" y="2" width="3" height="20" fill="black"/>
                      <rect x="73" y="2" width="4" height="20" fill="black"/>
                      <rect x="79" y="2" width="1" height="20" fill="black"/>
                      <rect x="82" y="2" width="2" height="20" fill="black"/>
                      <rect x="86" y="2" width="3" height="20" fill="black"/>
                      <rect x="91" y="2" width="1" height="20" fill="black"/>
                      <rect x="94" y="2" width="4" height="20" fill="black"/>
                    </svg>
                    <span className="text-[7.5px] font-mono text-slate-500 font-semibold tracking-wider mt-0.5">order4469</span>
                  </div>
                </div>

                {/* Right: Shipping Info */}
                <div className="flex flex-col gap-1 text-slate-600 font-medium">
                  <span className="font-bold text-slate-950 uppercase border-b border-slate-100 pb-0.5">Shipping Info</span>
                  <span>Courier Name: <span className="font-extrabold text-slate-800">DELHIVERY</span></span>
                  <span>AWB Number : <span className="font-bold text-slate-800">45946715331771</span></span>
                  <span>Weight : 0.25 KG</span>
                  <span>Dimensions (cm): 0 X 0 X 0</span>
                </div>
              </div>

              {/* Pickup and Return Address (Moved above COD) */}
              <div className="border-b border-slate-200 pb-3 mb-3 text-[8.5px] text-slate-700 font-medium">
                <span className="font-bold text-slate-750 block uppercase tracking-wide text-[7.5px] mb-0.5">Pickup and Return Address:</span>
                <span>{displayBusinessName} ({displaySellerName}), {displayAddress} (Ph: {displayPhone})</span>
              </div>

              {/* COD & Barcode Side-By-Side Row */}
              <div className="grid grid-cols-12 gap-3 border-b border-slate-200 pb-3 mb-3 items-center text-[9px]">
                {/* Left COD block */}
                <div className="col-span-4 flex flex-col items-center justify-center border-r border-slate-200 pr-2 text-center select-none">
                  <span className="text-sm font-black text-slate-900 leading-none">
                    {showCodAmount ? "COD" : "Prepaid"}
                  </span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tight mt-1 leading-tight">Collectable Amount:</span>
                  <span className="text-xs font-black text-slate-900 mt-0.5">₹549</span>
                </div>
                {/* Right Barcode block */}
                <div className="col-span-8 flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold text-slate-500 mb-0.5">45946715331771</span>
                  <svg className="w-full h-8 text-slate-950" viewBox="0 0 200 32">
                    <rect width="100%" height="100%" fill="white"/>
                    <rect x="10" y="2" width="2" height="28" fill="black"/>
                    <rect x="15" y="2" width="4" height="28" fill="black"/>
                    <rect x="22" y="2" width="1" height="28" fill="black"/>
                    <rect x="25" y="2" width="3" height="28" fill="black"/>
                    <rect x="30" y="2" width="2" height="28" fill="black"/>
                    <rect x="34" y="2" width="4" height="28" fill="black"/>
                    <rect x="42" y="2" width="1" height="28" fill="black"/>
                    <rect x="45" y="2" width="2" height="28" fill="black"/>
                    <rect x="50" y="2" width="5" height="28" fill="black"/>
                    <rect x="57" y="2" width="1" height="28" fill="black"/>
                    <rect x="60" y="2" width="3" height="28" fill="black"/>
                    <rect x="65" y="2" width="2" height="28" fill="black"/>
                    <rect x="70" y="2" width="4" height="28" fill="black"/>
                    <rect x="76" y="2" width="1" height="28" fill="black"/>
                    <rect x="80" y="2" width="3" height="28" fill="black"/>
                    <rect x="85" y="2" width="5" height="28" fill="black"/>
                    <rect x="92" y="2" width="2" height="28" fill="black"/>
                    <rect x="96" y="2" width="1" height="28" fill="black"/>
                    <rect x="100" y="2" width="3" height="28" fill="black"/>
                    <rect x="105" y="2" width="4" height="28" fill="black"/>
                    <rect x="111" y="2" width="1" height="28" fill="black"/>
                    <rect x="114" y="2" width="3" height="28" fill="black"/>
                    <rect x="120" y="2" width="5" height="28" fill="black"/>
                    <rect x="127" y="2" width="2" height="28" fill="black"/>
                    <rect x="131" y="2" width="1" height="28" fill="black"/>
                    <rect x="135" y="2" width="3" height="28" fill="black"/>
                    <rect x="140" y="2" width="4" height="28" fill="black"/>
                    <rect x="146" y="2" width="1" height="28" fill="black"/>
                    <rect x="150" y="2" width="3" height="28" fill="black"/>
                    <rect x="155" y="2" width="5" height="28" fill="black"/>
                    <rect x="162" y="2" width="2" height="28" fill="black"/>
                    <rect x="166" y="2" width="1" height="28" fill="black"/>
                    <rect x="170" y="2" width="3" height="28" fill="black"/>
                    <rect x="175" y="2" width="4" height="28" fill="black"/>
                    <rect x="182" y="2" width="2" height="28" fill="black"/>
                    <rect x="186" y="2" width="4" height="28" fill="black"/>
                  </svg>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded overflow-hidden mb-2 text-[8px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[7.5px]">
                      {!hideProduct && <th className="py-1 px-2 text-left">Item</th>}
                      {!hideSku && <th className="py-1 px-2 text-left">SKU</th>}
                      {!hideQty && <th className="py-1 px-2 text-center">Qty</th>}
                      <th className="py-1 px-2 text-right">Rate</th>
                      <th className="py-1 px-2 text-right">Amount</th>
                      {!hideTotalAmount && <th className="py-1 px-2 text-right">Total</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {mockLabelItems.slice(0, showLineItemsCount).map((item, idx) => {
                      const displayTitle = item.name.length > trimProductNameUpto
                        ? item.name.substring(0, trimProductNameUpto) + "..."
                        : item.name;
                      const displaySku = item.sku.length > trimSkuUpto
                        ? item.sku.substring(0, trimSkuUpto) + "..."
                        : item.sku;
                      return (
                        <tr key={idx}>
                          {!hideProduct && <td className="py-1 px-2 text-slate-800 leading-tight max-w-[110px] break-words">{displayTitle}</td>}
                          {!hideSku && <td className="py-1 px-2 font-mono text-[7px]">{displaySku}</td>}
                          {!hideQty && <td className="py-1 px-2 text-center">{item.qty}</td>}
                          <td className="py-1 px-2 text-right">₹{item.rate}</td>
                          <td className="py-1 px-2 text-right">₹{item.amount}</td>
                          {!hideTotalAmount && <td className="py-1 px-2 text-right">₹{item.total}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total amount bar */}
              {!hideOrderAmount && (
                <div className="text-right font-extrabold text-[9.5px] text-slate-900 pr-1 mb-3">
                  Total : ₹549
                </div>
              )}
            </div>

            {/* Bottom Support Disclaimer */}
            <div className="border-t border-slate-200 pt-2 flex flex-col gap-1 text-[7.5px] text-slate-500 font-medium text-center">
              {showSupportContact && (supportEmail || supportMobile) && (
                <span>
                  For Support call at <span className="font-bold text-slate-700">{supportMobile || "8510881550"}</span> also email to <span className="font-bold text-slate-700">{supportEmail || "support@example.com"}</span>
                </span>
              )}
              <span className="text-[7px] text-slate-400 italic mt-0.5">This is computer generated document,hence does not required signature.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
