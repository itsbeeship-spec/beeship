"use client";

import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";

const ReportsView = dynamic(() => import("@/components/ReportsView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function ReportsPage() {
  return <ReportsView />;
}
