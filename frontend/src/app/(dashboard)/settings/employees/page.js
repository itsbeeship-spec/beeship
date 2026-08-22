"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const EmployeeSettings = dynamic(() => import("@/components/settings/EmployeeSettings"), { loading: () => <PageLoader />, ssr: false });
export default function EmployeesPage() { return <EmployeeSettings />; }
