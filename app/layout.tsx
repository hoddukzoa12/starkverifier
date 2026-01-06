import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STARK Stylus Verifier | 10-18x Gas Savings",
  description:
    "Mini STARK Verifier demonstrating 10-18x gas savings on Arbitrum Stylus compared to Solidity. Built for Arbitrum APAC Mini Hackathon.",
  keywords: [
    "STARK",
    "Stylus",
    "Arbitrum",
    "Poseidon",
    "Merkle",
    "ZK",
    "Gas Optimization",
  ],
  authors: [{ name: "hodduk" }],
  openGraph: {
    title: "STARK Stylus Verifier",
    description: "10-18x gas savings for STARK verification on Arbitrum Stylus",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
