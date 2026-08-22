"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const TaxSettings = dynamic(() => import("@/components/settings/TaxSettings"), { loading: () => <PageLoader />, ssr: false });
export default function ProductTaxMappingPage() { return <TaxSettings />; }
