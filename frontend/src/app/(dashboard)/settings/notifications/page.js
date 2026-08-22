"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const NotificationSettings = dynamic(() => import("@/components/settings/NotificationSettings"), { loading: () => <PageLoader />, ssr: false });
export default function NotificationsPage() { return <NotificationSettings />; }
