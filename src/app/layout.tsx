import type { Metadata } from "next";
import { Bodoni_Moda, EB_Garamond } from "next/font/google";
import { PageTracker } from "./page-tracker";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Z’esprit Watch — Vintage Watches, Restored",
  description:
    "A curated collection of vintage luxury watches, hand-inspected and restored to keep time again.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodoniModa.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PageTracker />
        {children}
      </body>
    </html>
  );
}
