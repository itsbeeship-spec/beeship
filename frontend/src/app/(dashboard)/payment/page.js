"use client";

import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";

const PaymentView = dynamic(() => import("@/components/PaymentView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function PaymentPage() {
  return <PaymentView />;
}
