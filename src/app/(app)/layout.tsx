import type { Metadata } from "next";
import { Merriweather, Open_Sans } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/providers";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["400", "700"],
  subsets: ["latin"],
});
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "BCLearns", template: "%s | BCLearns" },
  description: "BCLearns tutor and client management",
};

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${merriweather.variable} ${openSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
