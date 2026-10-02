
import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { TerminalWidget } from "@/components/terminal-widget";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Cross-Market Signals | Hamzeh Hamdan",
  description:
    "How economic information propagates between U.S. and Chinese equity markets — Harvard College Senior Thesis by Hamzeh Hamdan",
  openGraph: {
    title: "Cross-Market Signals — Harvard Senior Thesis",
    description:
      "A factor-based map of U.S.–China market interdependence by Hamzeh Hamdan, Harvard College.",
  },
  alternates: { canonical: "/thesis" },
};

export default function ThesisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${playfair.variable} antialiased`}>
      <SiteHeader />
      {children}
      <TerminalWidget />
    </div>
  );
}
