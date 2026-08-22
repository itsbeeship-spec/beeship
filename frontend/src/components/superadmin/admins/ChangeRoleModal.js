import React, { useState, useEffect } from "react";

export default function ChangeRoleModal({
  isOpen = false,
  onClose = () => {},
  admin = null,
  onSave = () => {},
  isSaving = false,
}) {
  const [selectedRole, setSelectedRole] = useState("Operations Admin");

  useEffect(() => {
    if (admin) {
      setSelectedRole(admin.role || "Operations Admin");
    }
  }, [admin]);

  if (!isOpen || !admin) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(admin.id, selectedRole);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-5.5 shadow-2xl max-w-sm w-full mx-4 space-y-4 animate-scaleIn">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2.5 border-b border-[#1e293b]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Change Role
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Update access privileges for {admin.firstName} {admin.lastName}.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-[11px] font-semibold text-slate-300">
          
          {/* Role selection dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Access Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
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

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
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
              <span>{isSaving ? "Updating..." : "Update Role"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
