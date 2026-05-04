import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SessionProvider } from "./components/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.radiamex.com"),
  title: "A/C Radiamex",
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
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
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

