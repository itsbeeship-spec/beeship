"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const InvoiceSettings = dynamic(() => import("@/components/settings/InvoiceSettings"), { loading: () => <PageLoader />, ssr: false });
export default function InvoiceSettingsPage() { return <InvoiceSettings />; }
