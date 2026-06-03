import type { Metadata } from "next";
import "../styles/globals.css";
import { AppProviders } from "@/src/providers/app-providers";

export const metadata: Metadata = {
  title: "FreechargeIMS",
  description: "Enterprise asset and inventory operations platform built with Next.js 16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
