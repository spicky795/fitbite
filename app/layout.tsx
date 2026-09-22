import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "../context/AppContext";

export const metadata: Metadata = {
  title: "FitBite — Smarter Calorie & Nutrition Tracker",
  description: "Your daily guide to smarter eating. Clean, fast food search, Indian dishes, and macro tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F6F4] text-[#111418] antialiased selection:bg-[#D4F672] selection:text-black">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
