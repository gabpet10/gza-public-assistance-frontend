import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/core/providers/app-providers";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "GZA Public Assistance",
  description:
    "Console amministrativa per la gestione di volontari, utenti e organizzazioni.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className={`${manrope.variable} ${plexMono.variable} app-noise`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
