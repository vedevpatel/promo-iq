// app/layout.tsx
import type { Metadata } from "next";
import { Header } from "@/components/Header"; 
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PromoIQ | Tailored AI for Marketing",
  description: "Generate winning ads and marketing strategies with AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}