"use client";

import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";

const ShipmentView = dynamic(() => import("@/components/ShipmentView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function ShipmentsPage() {
  return <ShipmentView />;
}
