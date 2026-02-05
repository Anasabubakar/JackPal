import type { Metadata } from "next";
import { Lexend, Noto_Sans } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AudioLearn Student Dashboard",
  description: "JackPal (AudioLearn) - Student-first audio learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body
        className={`${lexend.variable} ${notoSans.variable} antialiased bg-white dark:bg-[#111722] text-slate-900 dark:text-white font-noto-sans`}
      >
        {children}
      </body>
    </html>
  );
}
