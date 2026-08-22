"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const VendorSettings = dynamic(() => import("@/components/settings/VendorSettings"), { loading: () => <PageLoader />, ssr: false });
export default function VendorManagementPage() { return <VendorSettings />; }
