import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Syne } from "next/font/google";
import { AudioPlayerProvider } from "@/lib/AudioPlayerContext";
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${syne.variable} ${inter.variable}`}>
      <head>
        {/* Anti-flash: apply saved theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('jp-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <AudioPlayerProvider>
          {children}
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
