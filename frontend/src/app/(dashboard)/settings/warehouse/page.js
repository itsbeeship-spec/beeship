"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const WarehouseSettings = dynamic(() => import("@/components/settings/WarehouseSettings"), { loading: () => <PageLoader />, ssr: false });
export default function WarehousePage() { return <WarehouseSettings />; }
