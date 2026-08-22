"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function InvoiceSettings() {
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [invoicePrefix, setInvoicePrefix] = useState("");
  const [hideConsigneeAddress, setHideConsigneeAddress] = useState(false);
  const [hideWarehouseAddress, setHideWarehouseAddress] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");
  const [pageSize, setPageSize] = useState("A4");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const queryClient = useQueryClient();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch settings via useQuery
  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: ["settings", "invoice"],
    queryFn: () => api.get("/invoice-settings").then(res => res.data),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  // Sync state from query cache
  useEffect(() => {
    if (queryData) {
      setShowCompanyName(queryData.showCompanyName !== undefined ? queryData.showCompanyName : true);
      setInvoicePrefix(queryData.invoicePrefix || "");
      setHideConsigneeAddress(!!queryData.hideConsigneeAddress);
      setHideWarehouseAddress(!!queryData.hideWarehouseAddress);
      setLogoUrl(queryData.logoUrl || "");
      setLogoPreview(queryData.logoUrl || "");
      setSignatureUrl(queryData.signatureUrl || "");
      setSignaturePreview(queryData.signatureUrl || "");
      setPageSize(queryData.pageSize || "A4");
    }
  }, [queryData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/invoice-settings", payload).then(res => {
      if (!res.success) throw new Error(res.message || "Failed to save settings");
      return res.data;
    }),
    onSuccess: (data) => {
      showToast("Invoice settings saved successfully!");
      queryClient.setQueryData(["settings", "invoice"], data);
      queryClient.invalidateQueries({ queryKey: ["settings", "invoice"] });
    },
    onError: (err) => {
      console.error("Failed to save invoice settings:", err);
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
      showCompanyName,
      invoicePrefix,
      hideConsigneeAddress,
      hideWarehouseAddress,
      logoUrl,
      signatureUrl,
      pageSize
    };
    saveMutation.mutate(payload);
  };

  // File Upload Handler
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", type === "logo" ? "Invoice Logo" : "Invoice Signature");

    showToast(`Uploading ${type === "logo" ? "Logo" : "Signature"}...`, "info");

    try {
      const res = await api.upload("/documents/upload", formData);
      if (res.success && res.data) {
        if (type === "logo") {
          setLogoUrl(res.data.s3Url);
          setLogoPreview(URL.createObjectURL(file));
        } else {
          setSignatureUrl(res.data.s3Url);
          setSignaturePreview(URL.createObjectURL(file));
        }
        showToast(`${type === "logo" ? "Logo" : "Signature"} uploaded successfully!`);
      } else {
        showToast("Upload failed.", "error");
      }
    } catch (err) {
      console.error("File upload failed:", err);
      showToast("Upload failed due to connection error.", "error");
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-sans font-bold text-slate-400 text-xs">
        Loading invoice settings...
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2z" />
          </svg>
          Invoice Settings
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">Customize your invoice templates and printing preferences.</p>
      </div>

      {/* Card 1: Company Settings */}
      <div className="border border-slate-150/70 hover:border-slate-200 rounded-2xl p-6 bg-white flex flex-col gap-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.08)] transition-all duration-300">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Company Settings</h4>
        
        {/* Company Name Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-slate-800">Show/Hide company name</span>
            <span className="text-[10px] text-slate-400 font-semibold">Display company name on invoices</span>
          </div>
          <button
            type="button"
            onClick={() => setShowCompanyName(!showCompanyName)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
              showCompanyName ? "bg-[#25a2fe]" : "bg-slate-200"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                showCompanyName ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Invoice Prefix Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Set Prefix For Your Invoice No.</label>
          <input
            type="text"
            value={invoicePrefix}
            onChange={(e) => setInvoicePrefix(e.target.value)}
            placeholder="Enter invoice prefix (e.g., INV-)"
            className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#25a2fe] focus:ring-2 focus:ring-[#25a2fe]/10 rounded-xl px-4 py-3 text-xs text-slate-700 font-semibold focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Card 2: Show/Hide Address */}
      <div className="border border-slate-150/70 hover:border-slate-200 rounded-2xl p-6 bg-white flex flex-col gap-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.08)] transition-all duration-300">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Show/Hide Address</h4>

        {/* Hide Consignee Address */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-slate-800 bg-">Hide consignee address</span>
            <span className="text-[10px] text-slate-400 font-semibold">Toggle to hide consignee address on invoices</span>
          </div>
          <button
            type="button"
            onClick={() => setHideConsigneeAddress(!hideConsigneeAddress)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
              hideConsigneeAddress ? "bg-[#25a2fe]" : "bg-slate-200"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                hideConsigneeAddress ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Hide Warehouse Address */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-slate-800">Hide warehouse address</span>
            <span className="text-[10px] text-slate-400 font-semibold">Toggle to hide warehouse address on invoices</span>
          </div>
          <button
            type="button"
            onClick={() => setHideWarehouseAddress(!hideWarehouseAddress)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer focus:outline-none shrink-0 ${
              hideWarehouseAddress ? "bg-[#25a2fe]" : "bg-slate-200"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                hideWarehouseAddress ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Card 3: Branding */}
      <div className="border border-slate-150/70 hover:border-slate-200 rounded-2xl p-6 bg-white flex flex-col gap-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.08)] transition-all duration-300">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Branding</h4>

        {/* Set Logo */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Set Logo</label>
          <input
            type="file"
            ref={logoInputRef}
            onChange={(e) => handleFileUpload(e, "logo")}
            accept="image/*"
            className="hidden"
          />
          {logoPreview ? (
            <div className="relative border-2 border-dashed border-slate-150 hover:border-[#25a2fe] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 bg-white transition-all duration-300">
              <button
                type="button"
                onClick={() => {
                  setLogoUrl("");
                  setLogoPreview("");
                }}
                className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img src={logoPreview} alt="Branding Logo" className="h-16 max-w-[200px] object-contain border border-slate-100 rounded-lg p-1 bg-white" />
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Logo uploaded
              </span>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="text-[10px] text-slate-400 hover:text-[#25a2fe] font-semibold cursor-pointer underline transition-colors"
              >
                Click to change logo
              </button>
            </div>
          ) : (
            <div
              onClick={() => logoInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-[#25a2fe] hover:bg-[#25a2fe]/5 rounded-2xl p-7 flex flex-col items-center justify-center gap-2.5 bg-slate-50/10 cursor-pointer transition-all duration-300 group"
            >
              <svg className="w-8 h-8 text-slate-400 group-hover:text-[#25a2fe] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-bold text-slate-800">Upload Logo</span>
                <span className="text-[9.5px] text-slate-400 font-semibold mt-1">Click to upload or drag and drop PNG, JPG or PDF (max. 5MB)</span>
              </div>
            </div>
          )}
        </div>

        {/* Set Signature */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Set Signature</label>
          <input
            type="file"
            ref={signatureInputRef}
            onChange={(e) => handleFileUpload(e, "signature")}
            accept="image/*"
            className="hidden"
          />
          {signaturePreview ? (
            <div className="relative border-2 border-dashed border-slate-150 hover:border-[#25a2fe] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 bg-white transition-all duration-300">
              <button
                type="button"
                onClick={() => {
                  setSignatureUrl("");
                  setSignaturePreview("");
                }}
                className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img src={signaturePreview} alt="Signature Preview" className="h-14 max-w-[200px] object-contain border border-slate-100 rounded-lg p-1 bg-white" />
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Signature uploaded
              </span>
              <button
                type="button"
                onClick={() => signatureInputRef.current?.click()}
                className="text-[10px] text-slate-400 hover:text-[#25a2fe] font-semibold cursor-pointer underline transition-colors"
              >
                Click to change signature
              </button>
            </div>
          ) : (
            <div
              onClick={() => signatureInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-[#25a2fe] hover:bg-[#25a2fe]/5 rounded-2xl p-7 flex flex-col items-center justify-center gap-2.5 bg-slate-50/10 cursor-pointer transition-all duration-300 group"
            >
              <svg className="w-8 h-8 text-slate-400 group-hover:text-[#25a2fe] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-bold text-slate-800">Upload Signature</span>
                <span className="text-[9.5px] text-slate-400 font-semibold mt-1">Click to upload or drag and drop PNG, JPG or PDF (max. 5MB)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 4: Page Setting */}
      <div className="border border-slate-150/70 hover:border-slate-200 rounded-2xl p-6 bg-white flex flex-col gap-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.08)] transition-all duration-300">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">Page Setting</h4>

        {/* Radio A4 */}
        <label className={`flex items-start gap-3.5 cursor-pointer p-4 rounded-xl border transition-all duration-200 group ${
          pageSize === "A4" 
            ? "border-[#25a2fe] bg-[#25a2fe]/5" 
            : "border-slate-150 hover:border-slate-250 bg-white"
        }`}>
          <input
            type="radio"
            name="pageSize"
            value="A4"
            checked={pageSize === "A4"}
            onChange={(e) => setPageSize(e.target.value)}
            className="w-4 h-4 text-[#25a2fe] focus:ring-[#25a2fe] border-slate-350 cursor-pointer mt-0.5 shrink-0"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition">Standard Desktop Printers - Size A4 (8"x11")</span>
            <span className="text-[10px] text-slate-400 font-semibold">(Single Invoice Printed on one Sheet)</span>
          </div>
        </label>

        {/* Radio 4x6 */}
        <label className={`flex items-start gap-3.5 cursor-pointer p-4 rounded-xl border transition-all duration-200 group ${
          pageSize === "4x6" 
            ? "border-[#25a2fe] bg-[#25a2fe]/5" 
            : "border-slate-150 hover:border-slate-250 bg-white"
        }`}>
          <input
            type="radio"
            name="pageSize"
            value="4x6"
            checked={pageSize === "4x6"}
            onChange={(e) => setPageSize(e.target.value)}
            className="w-4 h-4 text-[#25a2fe] focus:ring-[#25a2fe] border-slate-350 cursor-pointer mt-0.5 shrink-0"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition">Thermal Printers - Size (4"x6")</span>
            <span className="text-[10px] text-slate-400 font-semibold">(Single Invoice on one Sheet)</span>
          </div>
        </label>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-2">
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
              Saving Settings...
            </>
          ) : (
            "Save Invoice Settings"
          )}
        </button>
      </div>
    </div>
  );
}
