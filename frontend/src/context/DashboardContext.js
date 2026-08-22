"use client";

import { createContext, useContext, useState } from "react";

import api from "@/lib/api";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [walletBalance, setWalletBalance] = useState(133.09);
  const [activeSettingsTab, setActiveSettingsTab] = useState("auto-assign");
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [initialCoupon, setInitialCoupon] = useState("");

  const openRechargeModal = (coupon = "") => {
    setInitialCoupon(typeof coupon === "string" ? coupon : "");
    setRechargeModalOpen(true);
  };

  const closeRechargeModal = () => {
    setRechargeModalOpen(false);
    setInitialCoupon("");
  };

  const handleRechargeSuccess = async (amount, couponCode = null) => {
    try {
      const res = await api.post("/billing/recharge", { amount, couponCode });
      if (res && res.success && res.balance !== undefined) {
        setWalletBalance(res.balance);
      } else {
        setWalletBalance((prev) => parseFloat((prev + parseFloat(amount)).toFixed(2)));
      }
    } catch (err) {
      console.error("Failed to post recharge transaction:", err);
      setWalletBalance((prev) => parseFloat((prev + parseFloat(amount)).toFixed(2)));
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        walletBalance,
        setWalletBalance,
        handleRechargeSuccess,
        activeSettingsTab,
        setActiveSettingsTab,
        rechargeModalOpen,
        initialCoupon,
        openRechargeModal,
        closeRechargeModal,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
