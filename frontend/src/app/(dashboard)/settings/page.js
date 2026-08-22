import { redirect } from "next/navigation";

// /settings → redirect to default section
export default function SettingsIndexPage() {
  redirect("/settings/auto-assign-couriers");
}
