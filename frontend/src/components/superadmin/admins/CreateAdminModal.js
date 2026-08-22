import React, { useState } from "react";

export default function CreateAdminModal({
  isOpen = false,
  onClose = () => {},
  onCreate = () => {},
  isSaving = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    role: "Operations Admin",
    status: "ACTIVE",
    sendInvitation: false,
    password: "",
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData({
      fullName: "",
      email: "",
      mobile: "",
      role: "Operations Admin",
      status: "ACTIVE",
      sendInvitation: false,
      password: "",
    });
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.password.trim()) {
      return;
    }
    onCreate(formData);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6.5 shadow-2xl max-w-md w-full mx-4 space-y-4 animate-scaleIn">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-[#1e293b]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Create Admin
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Register a new platform administrator account.</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-[11px] font-semibold text-slate-300">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
            <input
              type="text"
              required
              placeholder="Enter full name..."
              value={formData.fullName}
              onChange={(e) => handleFieldChange("fullName", e.target.value)}
              className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
            <input
              type="email"
              required
              placeholder="Enter email address..."
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="Enter phone number..."
              value={formData.mobile}
              onChange={(e) => handleFieldChange("mobile", e.target.value)}
              className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Set admin account password..."
                value={formData.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                autoComplete="new-password"
                className="w-full pl-3 pr-9 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Role and Status Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Role select */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleFieldChange("role", e.target.value)}
                className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="Operations Admin">Operations Admin</option>
                <option value="Finance Admin">Finance Admin</option>
                <option value="KYC Admin">KYC Admin</option>
                <option value="Support Admin">Support Admin</option>
                <option value="Technical Admin">Technical Admin</option>
                <option value="Custom Role">Custom Role</option>
              </select>
            </div>

            {/* Status select */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Send Invitation Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="send-invitation"
              checked={formData.sendInvitation}
              onChange={(e) => handleFieldChange("sendInvitation", e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#0d1527] bg-slate-900 border-[#1e293b] cursor-pointer"
            />
            <label htmlFor="send-invitation" className="text-[10.5px] text-slate-400 select-none cursor-pointer">
              Send invitation email
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3.5 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white disabled:opacity-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 rounded-xl text-[11px] font-bold text-white transition cursor-pointer flex items-center gap-1.5"
            >
              {isSaving && (
                <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <span>{isSaving ? "Saving..." : "Create Admin"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
