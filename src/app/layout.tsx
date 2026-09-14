import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "eRT/RW Digital — Sistem Manajemen RT/RW",
  description: "Aplikasi Manajemen RT/RW Digital berbasis Vercel Serverless Functions: transparan, mudah, modern.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
