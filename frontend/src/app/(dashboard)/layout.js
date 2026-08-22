"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import DashboardSidebar from "@/components/DashboardSidebar";
import RechargeModal from "@/components/RechargeModal";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

function DashboardShell({ children }) {
  const { user, sessionChecking, showToast } = useAuth();
  const {
    walletBalance,
    setWalletBalance,
    handleRechargeSuccess,
    rechargeModalOpen,
    initialCoupon,
    openRechargeModal,
    closeRechargeModal,
  } = useDashboard();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Fetch real wallet balance on mount & prefetch dashboard queries (only for regular users)
  useEffect(() => {
    const isStaff = ["ADMIN", "SUPER_ADMIN", "SUPPORT"].includes(user?.role);
    if (user && !isStaff) {
      // Single fetchQuery — populates cache AND returns data (no duplicate raw call)
      queryClient.fetchQuery({
        queryKey: ["billing", "transactions"],
        queryFn: () => api.get("/billing/transactions"),
        staleTime: 30 * 1000, // 30s cache — prevents re-fetch on every navigation
      }).then(res => {
        if (res && res.success && res.balance !== undefined) {
          setWalletBalance(res.balance);
        }
      }).catch(err => console.error("Failed to load wallet balance:", err));

      queryClient.prefetchQuery({
        queryKey: ["warehouse"],
        queryFn: () => api.get("/warehouse").then(res => res.data || []),
        staleTime: 60 * 1000,
      });
    }
  }, [user, setWalletBalance, queryClient]);

  // Protect route: redirect to /login if unauthenticated
  useEffect(() => {
    if (!sessionChecking && !user) {
      router.replace("/login");
    }
  }, [sessionChecking, user, router]);

  // Disable background scrolling when recharge modal is open
  useEffect(() => {
    if (rechargeModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [rechargeModalOpen]);

  const handleRechargeClick = (coupon = "") => {
    if (user?.kycStatus !== "APPROVED") {
      showToast("KYC verification is required to recharge your wallet.", "warning");
    } else {
      openRechargeModal(typeof coupon === "string" ? coupon : "");
    }
  };

  // KYC banner: navigate directly to /settings/kyc route
  const handleCompleteKyc = () => {
    router.push("/settings/kyc");
  };

  if (sessionChecking) {
    return (
      <div className="min-h-screen bg-[#f4f6fc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">
          <img src="/Companye Logo.png" alt="BeeShip" className="h-10 animate-pulse object-contain" />
          <div className="w-8 h-8 border-4 border-[#2b7fff] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Syncing session data...</p>
        </div>
      </div>
    );
  }

  if (!user) return null; // redirect in progress

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-[#f4f6fc] relative">
      <DashboardSidebar onRechargeClick={handleRechargeClick} />

      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* KYC Banner — only for regular users */}
        {user?.role === "USER" && user?.kycStatus !== "APPROVED" && (
          <div
            className={`border-b px-6 py-3 flex items-center justify-between gap-3 text-xs select-none shrink-0 ${
              user?.kycStatus === "PENDING"
                ? "bg-blue-50/50 border-blue-150 text-blue-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <span>{user?.kycStatus === "PENDING" ? "ℹ️" : "⚠️"}</span>
              <span>
                {user?.kycStatus === "PENDING"
                  ? "Your KYC details are pending verification. Once approved, shipping and wallet functions will be unlocked."
                  : "Your KYC is not completed. Please complete KYC to unlock shipping and wallet functions."}
              </span>
            </div>
            {user?.kycStatus !== "PENDING" && (
              <button
                onClick={handleCompleteKyc}
                className="bg-amber-600 hover:bg-amber-700 transition text-white px-3 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer shrink-0"
              >
                Complete KYC Now
              </button>
            )}
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto w-full font-sans animate-fadeIn">
          {children}
        </div>
      </div>

      <RechargeModal
        isOpen={rechargeModalOpen}
        onClose={closeRechargeModal}
        onSuccess={handleRechargeSuccess}
        initialCoupon={initialCoupon}
      />
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
