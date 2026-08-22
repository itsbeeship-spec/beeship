"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";


export default function KycSettings({ user, fetchUserProfile }) {
  const queryClient = useQueryClient();
  const kycMutation = useMutation({
    mutationFn: (payload) => api.post("/auth/kyc/submit", payload).then(res => {
      if (!res.success) throw new Error(res.message || "Failed to submit KYC details");
      return res.data;
    })
  });

  const [activeTab, setActiveTab] = useState("basic-info"); // basic-info, kyc-details, bank-account
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1: Basic Info Form State
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || "");
  const [addressLine1, setAddressLine1] = useState(user?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(user?.addressLine2 || "");
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [pincode, setPincode] = useState(user?.pincode || "");
  const [gstDocName, setGstDocName] = useState(user?.gstUrl ? "gst_certificate_uploaded.pdf" : "");

  // Step 2: KYC Details Form State
  const [businessType, setBusinessType] = useState(user?.businessType || "Sole Proprietorship");
  const [panNumber, setPanNumber] = useState(user?.panNumber || "");
  const [panName, setPanName] = useState(user?.panName || "");
  const [panDocName, setPanDocName] = useState(user?.panUrl ? "pancard_image_uploaded.jpg" : "");
  const [documentType, setDocumentType] = useState("Aadhar Card");
  const [aadhaarNumber, setAadhaarNumber] = useState(user?.aadhaarNumber || "");
  const [aadhaarName, setAadhaarName] = useState(user?.aadhaarName || "");
  const [aadhaarFrontName, setAadhaarFrontName] = useState(user?.aadhaarFrontUrl ? "aadhaar_front_uploaded.jpg" : "");
  const [aadhaarBackName, setAadhaarBackName] = useState(user?.aadhaarBackUrl ? "aadhaar_back_uploaded.jpg" : "");

  // Step 3: Bank Account Form State
  const [bankHolderName, setBankHolderName] = useState(user?.bankHolderName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankAccountNumber || "");
  const [bankName, setBankName] = useState(user?.bankName || "");
  const [bankBranch, setBankBranch] = useState(user?.bankBranch || "");
  const [bankAccountType, setBankAccountType] = useState(user?.bankAccountType || "Current Account");
  const [bankIfsc, setBankIfsc] = useState(user?.bankIfsc || "");
  const [chequeDocName, setChequeDocName] = useState(user?.bankChequeUrl ? "cancelled_cheque_uploaded.jpg" : "");

  // File input refs for real file picker
  const gstRef = useRef(null);
  const panRef = useRef(null);
  const aadhaarFrontRef = useRef(null);
  const aadhaarBackRef = useRef(null);
  const chequeRef = useRef(null);

  // File objects for actual upload
  const [gstFile, setGstFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
  const [chequeFile, setChequeFile] = useState(null);

  // Update states if user profile changes
  useEffect(() => {
    if (user) {
      setCompanyName(user.companyName || "");
      setEmail(user.email || "");
      setMobile(user.mobile || "");
      setGstNumber(user.gstNumber || "");
      setAddressLine1(user.addressLine1 || "");
      setAddressLine2(user.addressLine2 || "");
      setCity(user.city || "");
      setState(user.state || "");
      setPincode(user.pincode || "");
      setGstDocName(user.gstUrl ? "gst_certificate_uploaded.pdf" : "");
      setBusinessType(user.businessType || "Sole Proprietorship");
      setPanNumber(user.panNumber || "");
      setPanName(user.panName || "");
      setPanDocName(user.panUrl ? "pancard_image_uploaded.jpg" : "");
      setAadhaarNumber(user.aadhaarNumber || "");
      setAadhaarName(user.aadhaarName || "");
      setAadhaarFrontName(user.aadhaarFrontUrl ? "aadhaar_front_uploaded.jpg" : "");
      setAadhaarBackName(user.aadhaarBackUrl ? "aadhaar_back_uploaded.jpg" : "");
      setBankHolderName(user.bankHolderName || "");
      setBankAccountNumber(user.bankAccountNumber || "");
      setBankName(user.bankName || "");
      setBankBranch(user.bankBranch || "");
      setBankAccountType(user.bankAccountType || "Current Account");
      setBankIfsc(user.bankIfsc || "");
      setChequeDocName(user.bankChequeUrl ? "cancelled_cheque_uploaded.jpg" : "");
    }
  }, [user]);

  const handleFileSelect = (docType, file) => {
    if (!file) return;
    if (docType === "GST")   { setGstFile(file);          setGstDocName(file.name); }
    if (docType === "PAN")   { setPanFile(file);          setPanDocName(file.name); }
    if (docType === "Front") { setAadhaarFrontFile(file); setAadhaarFrontName(file.name); }
    if (docType === "Back")  { setAadhaarBackFile(file);  setAadhaarBackName(file.name); }
    if (docType === "Cheque"){ setChequeFile(file);       setChequeDocName(file.name); }
  };

  const handleClearDoc = (docType) => {
    if (docType === "GST")   { setGstDocName("");        setGstFile(null);          if (gstRef.current) gstRef.current.value = ""; }
    if (docType === "PAN")   { setPanDocName("");        setPanFile(null);          if (panRef.current) panRef.current.value = ""; }
    if (docType === "Front") { setAadhaarFrontName(""); setAadhaarFrontFile(null); if (aadhaarFrontRef.current) aadhaarFrontRef.current.value = ""; }
    if (docType === "Back")  { setAadhaarBackName("");  setAadhaarBackFile(null);  if (aadhaarBackRef.current) aadhaarBackRef.current.value = ""; }
    if (docType === "Cheque"){ setChequeDocName("");     setChequeFile(null);       if (chequeRef.current) chequeRef.current.value = ""; }
  };


  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const uploadKycFile = async (file, title, currentUrl) => {
      if (!file) return currentUrl;
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);

        const res = await api.upload("/documents/upload", formData);
        if (res.success && res.data) {
          return res.data.s3Url;
        }
      } catch (uploadErr) {
        console.error(`S3 upload failed for ${title}:`, uploadErr);
        throw new Error(`Failed to upload ${title} to storage.`);
      }
      return currentUrl;
    };

    try {
      // 1. Upload selected files to S3 sequentially
      const gstUrl = await uploadKycFile(gstFile, "GST Certificate", user?.gstUrl);
      const panUrl = await uploadKycFile(panFile, "PAN Card", user?.panUrl);
      const aadhaarFrontUrl = await uploadKycFile(aadhaarFrontFile, "Aadhaar Front Side", user?.aadhaarFrontUrl);
      const aadhaarBackUrl = await uploadKycFile(aadhaarBackFile, "Aadhaar Back Side", user?.aadhaarBackUrl);
      const bankChequeUrl = await uploadKycFile(chequeFile, "Cancelled Cheque Scan", user?.bankChequeUrl);

      // 2. Submit form metadata with actual S3 URLs
      const payload = {
        companyName,
        email,
        mobile,
        gstNumber: gstNumber || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        pincode,
        gstUrl,
        businessType,
        panNumber,
        panName,
        panUrl,
        aadhaarNumber,
        aadhaarName,
        aadhaarFrontUrl,
        aadhaarBackUrl,
        bankHolderName,
        bankAccountNumber,
        bankName,
        bankBranch: bankBranch || null,
        bankAccountType,
        bankIfsc,
        bankChequeUrl,
      };

      await kycMutation.mutateAsync(payload);
      setSuccessMsg("KYC details submitted successfully! Your account status is now PENDING verification.");
      if (fetchUserProfile) {
        await fetchUserProfile();
      }
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err) {
      if (err.data?.error?.details) {
        const details = err.data.error.details.map(d => `${d.field} (${d.message})`).join(", ");
        setErrorMsg(`Validation failed: ${details}`);
      } else {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentKycStatus = user?.kycStatus || "NOT_SUBMITTED";

  // If already APPROVED or PENDING, show standard status card instead of editable forms
  if (currentKycStatus === "PENDING") {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn font-sans">
        <div>
          <h3 className="text-base font-bold text-slate-900">KYC Verification</h3>
          <p className="text-xs text-slate-500 mt-1">Complete your Know Your Customer verification to unlock all features.</p>
        </div>
        <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Verification in Progress</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              We have received your KYC documents. Our team is currently reviewing your company and bank account details. This process typically takes 2-4 business hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentKycStatus === "APPROVED") {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn font-sans">
        <div>
          <h3 className="text-base font-bold text-slate-900">KYC Verification</h3>
          <p className="text-xs text-slate-500 mt-1">Complete your Know Your Customer verification to unlock all features.</p>
        </div>
        <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">KYC Status: APPROVED</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Your identity and company bank account details are verified. You can now use all platform capabilities, including wallet recharges and active shipping services.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      <div>
        <h3 className="text-base font-bold text-slate-900">KYC Verification</h3>
        <p className="text-xs text-slate-500 mt-1">Complete your Know Your Customer verification to unlock all features.</p>
      </div>

      {user?.kycRejectReason && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold">
          ⚠️ KYC Rejected Reason: {user.kycRejectReason}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold">
          ❌ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-xs font-semibold">
          🟢 {successMsg}
        </div>
      )}

      {/* Tabs Header Navigation */}
      <div className="flex border border-slate-100 rounded-xl p-1 bg-slate-50 select-none">
        <button
          onClick={() => setActiveTab("basic-info")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "basic-info" ? "bg-[#25a2fe] text-white shadow-xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-150/30"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>Basic Info</span>
        </button>
        <button
          onClick={() => setActiveTab("kyc-details")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "kyc-details" ? "bg-[#25a2fe] text-white shadow-xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-150/30"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>KYC Details</span>
        </button>
        <button
          onClick={() => setActiveTab("bank-account")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "bank-account" ? "bg-[#25a2fe] text-white shadow-xs" : "text-slate-500 hover:text-slate-800 hover:bg-slate-150/30"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Bank Account</span>
        </button>
      </div>

      {/* STEP 1: Basic Info Tab Form */}
      {activeTab === "basic-info" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Company Information */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-2">Company Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Company Name *</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address *</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="e.g. contact@acme.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Number *</label>
                <input 
                  type="text" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="e.g. 9953023068"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GST Number</label>
                <input 
                  type="text" 
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none uppercase" 
                  placeholder="e.g. 07AHBPN4757B2ZI"
                />
              </div>
            </div>
          </div>

          {/* Company Address */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-2">Company Address</h4>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address Line 1 *</label>
                <input 
                  type="text" 
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="Street address, plot number"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Address Line 2</label>
                <input 
                  type="text" 
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="Apartment, suite, unit, landmark"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">City *</label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                    placeholder="New Delhi"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">State *</label>
                  <input 
                    type="text" 
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                    placeholder="Delhi"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pincode *</label>
                  <input 
                    type="text" 
                    maxLength="6"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                    placeholder="110031"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-2">Document Uploads</h4>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GST Document (PDF)</label>
              {gstDocName ? (
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-blue-700">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <span>📄</span>
                    <span className="truncate">{gstDocName}</span>
                  </div>
                  <button onClick={() => handleClearDoc("GST")} className="text-rose-500 hover:text-rose-700 text-xs shrink-0 cursor-pointer">×</button>
                </div>
              ) : (
                <>
                  <input ref={gstRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect("GST", e.target.files[0])} />
                  <button 
                    onClick={() => gstRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <span>Upload GST Certificate</span>
                    <span className="text-[9px] text-slate-400 font-normal">Click to upload PDF, PNG or JPG (Max 5MB)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end select-none">
            <button 
              onClick={() => setActiveTab("kyc-details")}
              disabled={!companyName || !email || !mobile || !addressLine1 || !city || !state || !pincode}
              className="bg-[#25a2fe] hover:bg-[#198ee0] disabled:opacity-45 disabled:cursor-not-allowed transition text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              Save & Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: KYC Details Tab Form */}
      {activeTab === "kyc-details" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Business Type Selection */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-855 border-b border-slate-100 pb-2">Business Type Selection</h4>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Type of Business *</label>
              <select 
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Private Limited">Private Limited Company</option>
                <option value="Public Limited">Public Limited Company</option>
                <option value="Individual">Individual Seller</option>
              </select>
            </div>
          </div>

          {/* Document 1: PAN Card */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-2">Document 1 - PAN Card</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PAN Card Number *</label>
                <input 
                  type="text" 
                  maxLength="10"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none uppercase" 
                  placeholder="e.g. AHBPN4757B"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enter Name on PAN Card *</label>
                <input 
                  type="text" 
                  value={panName}
                  onChange={(e) => setPanName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="Name as printed on PAN card"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Upload PAN Card Image *</label>
              {panDocName ? (
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-blue-700">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <span>📄</span>
                    <span className="truncate">{panDocName}</span>
                  </div>
                  <button onClick={() => handleClearDoc("PAN")} className="text-rose-500 hover:text-rose-700 text-xs shrink-0 cursor-pointer">×</button>
                </div>
              ) : (
                <>
                  <input ref={panRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect("PAN", e.target.files[0])} />
                  <button 
                    onClick={() => panRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <span>Upload PAN Card copy</span>
                    <span className="text-[9px] text-slate-400 font-normal">Click to upload PDF, PNG or JPG</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Document 2: Aadhaar Card */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-2">Document 2</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Document Type *</label>
                <select 
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Aadhar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Document Number *</label>
                <input 
                  type="text" 
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="e.g. 581042415993"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Name on Document *</label>
                <input 
                  type="text" 
                  value={aadhaarName}
                  onChange={(e) => setAadhaarName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="Name as printed on Aadhaar"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Upload Document Front Image *</label>
                {aadhaarFrontName ? (
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-blue-700">
                    <div className="flex items-center gap-2 truncate pr-4">
                      <span>📄</span>
                      <span className="truncate">{aadhaarFrontName}</span>
                    </div>
                    <button onClick={() => handleClearDoc("Front")} className="text-rose-500 hover:text-rose-700 text-xs shrink-0 cursor-pointer">×</button>
                  </div>
                ) : (
                  <>
                    <input ref={aadhaarFrontRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect("Front", e.target.files[0])} />
                    <button 
                      onClick={() => aadhaarFrontRef.current?.click()}
                      className="w-full py-5 border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <span>Upload Front Side</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Upload Document Back Image *</label>
                {aadhaarBackName ? (
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-blue-700">
                    <div className="flex items-center gap-2 truncate pr-4">
                      <span>📄</span>
                      <span className="truncate">{aadhaarBackName}</span>
                    </div>
                    <button onClick={() => handleClearDoc("Back")} className="text-rose-500 hover:text-rose-700 text-xs shrink-0 cursor-pointer">×</button>
                  </div>
                ) : (
                  <>
                    <input ref={aadhaarBackRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect("Back", e.target.files[0])} />
                    <button 
                      onClick={() => aadhaarBackRef.current?.click()}
                      className="w-full py-5 border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <span>Upload Back Side</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between select-none">
            <button 
              onClick={() => setActiveTab("basic-info")}
              className="bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 transition text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer"
            >
              Back
            </button>
            <button 
              onClick={() => setActiveTab("bank-account")}
              disabled={!panNumber || !panName || !aadhaarNumber || !aadhaarName || !panDocName || !aadhaarFrontName || !aadhaarBackName}
              className="bg-[#25a2fe] hover:bg-[#198ee0] disabled:opacity-45 disabled:cursor-not-allowed transition text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              Submit KYC Details
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Bank Account Tab Form */}
      {activeTab === "bank-account" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Bank Account Details */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-2">Bank Account Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Holder Name *</label>
                <input 
                  type="text" 
                  value={bankHolderName}
                  onChange={(e) => setBankHolderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="e.g. Meet enterprises"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Number *</label>
                <input 
                  type="text" 
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="e.g. 5750391262"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bank Name *</label>
                <input 
                  type="text" 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="e.g. Kotak Mahindra Bank"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bank Branch</label>
                <input 
                  type="text" 
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none" 
                  placeholder="e.g. 137 NOIDA"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Type *</label>
                <select 
                  value={bankAccountType}
                  onChange={(e) => setBankAccountType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Current Account">Current Account</option>
                  <option value="Savings Account">Savings Account</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">IFSC Code *</label>
                <input 
                  type="text" 
                  maxLength="11"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-none uppercase" 
                  placeholder="e.g. KKBK0005040"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Upload Cancelled Cheque *</label>
              {chequeDocName ? (
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-blue-700">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <span>📄</span>
                    <span className="truncate">{chequeDocName}</span>
                  </div>
                  <button onClick={() => handleClearDoc("Cheque")} className="text-rose-500 hover:text-rose-700 text-xs shrink-0 cursor-pointer">×</button>
                </div>
              ) : (
                <>
                  <input ref={chequeRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect("Cheque", e.target.files[0])} />
                  <button 
                    onClick={() => chequeRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <span>Upload Cheque Scan copy</span>
                    <span className="text-[9px] text-slate-400 font-normal">Click to upload PDF, PNG or JPG</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Save Bank Details / Final Submit */}
          <div className="flex justify-between select-none">
            <button 
              onClick={() => setActiveTab("kyc-details")}
              className="bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 transition text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer"
            >
              Back
            </button>
            <button 
              onClick={handleFinalSubmit}
              disabled={loading || !bankHolderName || !bankAccountNumber || !bankName || !bankIfsc || !chequeDocName}
              className="bg-[#25a2fe] hover:bg-[#198ee0] disabled:opacity-45 disabled:cursor-not-allowed transition text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Save Bank Details</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
