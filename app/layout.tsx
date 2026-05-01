import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SessionProvider } from "./components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.radiamex.com"),
  title: "A/C Radiamex (v2.2)",
  description: "Venta de radiadores y sistemas de enfriamiento con gestión de inventario y flotas",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/radiamex-tab.svg", type: "image/svg+xml" },
    ],
    shortcut: "/radiamex-tab.svg",
    apple: "/radiamex-tab.svg",
  },
};

import AppShell from "./components/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SessionProvider>
          <LanguageProvider>
            <AppShell>
              {children}
            </AppShell>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

