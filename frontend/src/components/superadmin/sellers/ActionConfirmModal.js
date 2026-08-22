import React, { useState } from "react";

export default function ActionConfirmModal({
  isOpen = false,
  onClose = () => {},
  onConfirm = () => {},
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  type = "confirm", // confirm, danger, input, reset-password
  inputPlaceholder = "Enter value...",
  inputValue = "",
  onInputChange = () => {},
  confirmText = "Confirm",
  isPending = false,

  // Password reset specific fields
  resetData = { newPassword: "", confirmPassword: "" },
  onResetDataChange = () => {},
}) {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  // Eye SVG icons
  const EyeIcon = () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-5.5 shadow-2xl max-w-sm w-full mx-4 space-y-4 animate-scaleIn">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2.5 border-b border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3.5 text-[11px] text-slate-300 font-semibold">
          <p className="leading-relaxed">{message}</p>

          {/* Type: input (Generic input alert) */}
          {type === "input" && (
            <div className="space-y-1">
              <input
                type="text"
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          )}

          {/* Type: reset-password (Dynamic fields with hide/show toggles) */}
          {type === "reset-password" && (
            <div className="space-y-3 pt-1">
              {/* New Password Field */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter new password..."
                    value={resetData.newPassword}
                    onChange={(e) => onResetDataChange("newPassword", e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showNew ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm new password..."
                    value={resetData.confirmPassword}
                    onChange={(e) => onResetDataChange("confirmPassword", e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white disabled:opacity-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={
              isPending ||
              (type === "input" && !inputValue.trim()) ||
              (type === "reset-password" &&
                (!resetData.newPassword.trim() ||
                  !resetData.confirmPassword.trim()))
            }
            className={`px-4 py-2 rounded-xl text-[11px] font-bold text-white transition cursor-pointer flex items-center gap-1.5 ${
              type === "danger"
                ? "bg-rose-600 hover:bg-rose-700 disabled:bg-slate-800"
                : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800"
            }`}
          >
            {isPending && (
              <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{isPending ? "Processing..." : confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
