import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";

import { Header } from "@/components/Header";
import { ScrollToTop } from "@/components/ScrollToTop";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: { default: "Darmalton Pharmacy", template: "%s | Darmalton Pharmacy" },
  description: "A safe, clear online pharmacy demonstration."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable}`}>
        <Header />
        <ScrollToTop />
        <main>{children}</main>
        <footer>
          <p>Milestone 1 demonstration · Prices and stock are always validated at checkout.</p>
        </footer>
      </body>
    </html>
  );
}
