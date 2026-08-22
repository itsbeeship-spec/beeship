"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const AutoAssignSettings = dynamic(() => import("@/components/settings/AutoAssignSettings"), { loading: () => <PageLoader />, ssr: false });
export default function AutoAssignCouriersPage() { return <AutoAssignSettings />; }
