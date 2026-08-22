"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function ProfileSettings() {
  const { user, fetchUserProfile } = useAuth();

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Show/hide password toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setMobile(user.mobile || "");
    }
  }, [user]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const profileMutation = useMutation({
    mutationFn: (payload) => api.put("/auth/profile", payload),
    onSuccess: async (res) => {
      if (res.success) {
        await fetchUserProfile();
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        showToast("Profile updated successfully!");
      } else {
        showToast(res.message || "Failed to update profile.", "error");
      }
    },
    onError: (err) => {
      showToast(err.message || "Something went wrong.", "error");
    },
    onSettled: () => {
      setProfileSaving(false);
    }
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast("First name and last name are required.", "error");
      return;
    }
    setProfileSaving(true);
    profileMutation.mutate({ firstName, lastName, email, mobile });
  };

  const passwordMutation = useMutation({
    mutationFn: (payload) => api.put("/auth/password", payload),
    onSuccess: (res) => {
      if (res.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showToast("Password changed successfully!");
      } else {
        showToast(res.message || "Failed to change password.", "error");
      }
    },
    onError: (err) => {
      showToast(err.message || "Something went wrong.", "error");
    },
    onSettled: () => {
      setPasswordSaving(false);
    }
  });

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New password and confirm password do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }
    setPasswordSaving(true);
    passwordMutation.mutate({ currentPassword, newPassword, confirmPassword });
  };

  const EyeIcon = ({ show, onClick }) => (
    <button type="button" onClick={onClick} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition">
      {show ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="w-full animate-fadeIn font-sans select-none" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border animate-slideDown text-xs font-semibold ${
          toast.type === "error" ? "bg-rose-50 border-rose-100 text-rose-700" :
          toast.type === "warning" ? "bg-amber-50 border-amber-100 text-amber-700" :
          "bg-emerald-50 border-emerald-100 text-emerald-700"
        }`}>
          {toast.type === "error" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your profile information and account preferences.</p>
      </div>

      {/* Profile Info Card */}
      <form onSubmit={handleProfileSave}>
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm mb-5">
          <h3 className="text-sm font-bold text-slate-800 mb-5 pb-4 border-b border-slate-100">Personal Information</h3>

          <div className="flex flex-col gap-4">

            {/* Full Name row */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">Full Name</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs w-full"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs w-full"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">Email</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-slate-100 bg-slate-50/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs w-full"
              />
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">Mobile Number</label>
              <input
                type="text"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs w-full"
              />
            </div>

          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-5 mt-1 border-t border-slate-100">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {profileSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>

      {/* Change Password Card */}
      <form onSubmit={handlePasswordSave}>
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-5 pb-4 border-b border-slate-100">Change Password</h3>

          <div className="flex flex-col gap-4">

            {/* Current Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="border border-slate-100 bg-slate-50/60 rounded-xl px-3.5 py-2.5 pr-9 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs w-full"
                />
                <EyeIcon show={showCurrent} onClick={() => setShowCurrent(!showCurrent)} />
              </div>
            </div>

            {/* New + Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 pr-9 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs w-full"
                  />
                  <EyeIcon show={showNew} onClick={() => setShowNew(!showNew)} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 pr-9 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs w-full"
                  />
                  <EyeIcon show={showConfirm} onClick={() => setShowConfirm(!showConfirm)} />
                </div>
              </div>
            </div>

          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-5 mt-1 border-t border-slate-100">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {passwordSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
