import type { Metadata } from "next";
import "../styles/globals.css";
import { AppProviders } from "@/src/providers/app-providers";

export const metadata: Metadata = {
  title: "FreechargeIMS IMS",
  description: "Enterprise inventory management frontend built with Next.js App Router",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(255,107,53,0.18),_rgba(255,250,246,0.92)_40%,_rgba(255,255,255,1)_100%)] text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
