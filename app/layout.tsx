import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans, Oxanium } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ['400', '500', '600'],
  variable: "--font-dm",
  subsets: ["latin"],
  display: "swap",
});

const oxanium = Oxanium({
  weight: ['400', '500', '600', '700'],
  variable: "--font-oxanium",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Million Dollar Grid",
  description: "Own a piece of the internet. Forever.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${dmSans.variable} ${oxanium.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
