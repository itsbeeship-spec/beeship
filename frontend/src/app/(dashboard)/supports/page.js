"use client";

import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";

const SupportsView = dynamic(() => import("@/components/SupportsView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function SupportsPage() {
  return <SupportsView />;
}
