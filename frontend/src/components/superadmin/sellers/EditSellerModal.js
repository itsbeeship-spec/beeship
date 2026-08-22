import React, { useState, useEffect } from "react";

export default function EditSellerModal({
  isOpen = false,
  onClose = () => {},
  seller = null,
  onSave = () => {},
  isSaving = false,
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    companyName: "",
    plan: "Basic",
  });

  const [errorMsg, setErrorMsg] = useState("");

  // Populate data when seller shifts
  useEffect(() => {
    if (seller) {
      setFormData({
        firstName: seller.firstName || "",
        lastName: seller.lastName || "",
        email: seller.email || "",
        mobile: seller.mobile || "",
        companyName: seller.companyName || "",
        plan: seller.plan || "Basic",
      });
      setErrorMsg("");
    }
  }, [seller]);

  if (!isOpen || !seller) return null;

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation checks
    if (!formData.firstName.trim()) return setErrorMsg("First name is required.");
    if (!formData.lastName.trim()) return setErrorMsg("Last name is required.");
    if (!formData.email.trim()) return setErrorMsg("Email address is required.");
    if (!formData.mobile.trim()) return setErrorMsg("Mobile number is required.");

    onSave(seller.id, formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 space-y-6">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2.5 border-b border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Edit Seller Profile</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-[11px] font-semibold text-slate-300">
          
          {errorMsg && (
            <p className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">
              ⚠️ {errorMsg}
            </p>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-slate-400">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Mobile */}
          <div className="space-y-1">
            <label className="text-slate-400">Mobile Number</label>
            <input
              type="text"
              value={formData.mobile}
              onChange={(e) => handleInputChange("mobile", e.target.value)}
              className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-slate-400">Company Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Plan */}
          <div className="space-y-1">
            <label className="text-slate-400">Pricing Plan</label>
            <select
              value={formData.plan}
              onChange={(e) => handleInputChange("plan", e.target.value)}
              className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Basic">Basic</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl text-[11px] font-bold text-white transition cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
