import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk, Caveat } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Web3Provider from "@/providers/Web3Provider";

const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

const hand = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
});

export const metadata: Metadata = {
  title: "MEME SLOT — SPIN. MIX. CREATE.",
  description:
    "Three reels. Infinite meme combinations. Spin the machine and discover your next meme.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hand.variable}`}>
      <body className="font-body bg-[#fafafa] text-black">
        <Web3Provider>
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <footer className="border-t border-black/5 py-10 text-center text-xs tracking-[0.2em] text-black/40">
            MEME SLOT — SAME MEMES. NEW POSSIBILITIES. · UNAUDITED SOFTWARE
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
