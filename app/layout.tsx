import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WhopThemeProvider } from "@whop-apps/sdk";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PixelFlow - Whop App",
  description: "Track and manage your pixel events across Facebook, TikTok, and Google Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WhopThemeProvider>
          {children}
        </WhopThemeProvider>
      </body>
    </html>
  );
}
