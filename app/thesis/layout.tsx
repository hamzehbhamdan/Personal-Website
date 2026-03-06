
import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
};

export default function ThesisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${playfair.variable} antialiased`}>
      {/* Back-to-site header */}
      <div className="sticky top-0 z-50 border-b border-stone-200 bg-[#f9f8f6]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-10 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-[#A51C30] transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            hamzehhamdan.com
          </Link>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-stone-300">
            Senior Thesis
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
