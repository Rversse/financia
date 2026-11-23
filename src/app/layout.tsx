import type { Metadata, Viewport } from "next";

import { PwaRegister } from "@/components/pwa-register";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FINANCIA",
    template: "%s | FINANCIA"
  },
  description:
    "Pengelolaan keuangan keluarga yang privat, terpusat, dan transparan.",
  applicationName: "FINANCIA",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/financia.svg",
    shortcut: "/icons/financia.svg"
  },
  appleWebApp: {
    capable: true,
    title: "FINANCIA",
    statusBarStyle: "default"
  },
  robots: {
    index: false,
    follow: false
  }
};

export const viewport: Viewport = {
  themeColor: "#14243a",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
