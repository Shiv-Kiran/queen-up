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

export const metadata: Metadata = {
  title: "Queen Puzzle",
  description: "Daily LinkedIn-style Queens puzzle",
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
