"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const ProfileSettings = dynamic(() => import("@/components/settings/ProfileSettings"), { loading: () => <PageLoader />, ssr: false });
export default function ProfilePage() { return <ProfileSettings />; }
