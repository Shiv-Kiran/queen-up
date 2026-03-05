import type { Metadata } from "next";
import { Manrope, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";

const fontBody = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const fontDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const fontUi = Space_Grotesk({
  variable: "--font-ui",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://queenup.shivkiranbagathi.com");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Queen Puzzle",
  description: "Daily LinkedIn-style Queens puzzle",
  openGraph: {
    title: "Queen Puzzle",
    description: "Daily LinkedIn-style Queens puzzle",
    url: siteUrl,
    siteName: "Queen Puzzle",
    type: "website",
    images: [
      {
        url: "/queenUp.png",
        width: 1386,
        height: 846,
        alt: "Queen Puzzle social preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Queen Puzzle",
    description: "Daily LinkedIn-style Queens puzzle",
    images: ["/queenUp.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontBody.variable} ${fontDisplay.variable} ${fontUi.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
