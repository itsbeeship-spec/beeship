import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/context/QueryProvider";
import Toast from "@/components/Toast";

const inter = Inter({
  weight: ["100", "200", "300", "300", "300", "300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "BeeShip - Ship Smarter, Grow Faster",
  description: "Next-gen logistics and shipping management platform for growing businesses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toast />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
