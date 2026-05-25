import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../src/auth/authContext";

export const metadata: Metadata = {
  title: "FreechargeIMS",
  description: "Frontend for the FreechargeIMS asset and space workflow platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,_rgba(255,107,53,0.22),_rgba(15,23,42,1)_55%)] text-orange-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
