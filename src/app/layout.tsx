import type { Metadata } from "next";
import { Fraunces, Syne } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JackPal - Your Audio Study Companion",
  description:
    "Convert your readings, PDFs, and notes into high-quality audio you can listen to anywhere. Offline-first, student-focused.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${syne.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
