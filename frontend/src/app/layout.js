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
  icons: {
    icon: "/Companye Logo.png",
    shortcut: "/Companye Logo.png",
    apple: "/Companye Logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/Companye Logo.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/Companye Logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Companye Logo.png" />
      </head>
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
