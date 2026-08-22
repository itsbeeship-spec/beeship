"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import PageLoader from "@/components/PageLoader";

const BillingView = dynamic(() => import("@/components/BillingView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function BillingPage() {
  const { user, showToast } = useAuth();
  const { walletBalance } = useDashboard();

  const handleRechargeClick = () => {
    if (user?.kycStatus !== "APPROVED") {
      showToast("KYC verification is required to recharge your wallet.", "warning");
    }
  };

  return <BillingView walletBalance={walletBalance} onRecharge={handleRechargeClick} />;
}
