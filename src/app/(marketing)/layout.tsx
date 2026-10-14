import type { Metadata } from "next";
import { Merriweather, Open_Sans } from "next/font/google";
import "./marketing.css";

const merriweather = Merriweather({ variable: "--font-merriweather", weight: ["400", "700"], subsets: ["latin"], display: "swap" });
const openSans = Open_Sans({ variable: "--font-open-sans", weight: ["400", "600"], subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "BCLearns",
  description:
    "Expert tutoring and consulting from highly qualified students at the Bergen County Academies.",
};

export default function MarketingRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${merriweather.variable} ${openSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
