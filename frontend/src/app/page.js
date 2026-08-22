import { redirect } from "next/navigation";

// Root "/" redirects to /login.
// The (auth)/login/page.js will redirect to /dashboard if already authenticated.
export default function RootPage() {
  redirect("/login");
}
