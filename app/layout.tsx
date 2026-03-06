import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Available globally as var(--font-playfair) for editorial/manifesto sections
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const siteUrl = "https://www.hamzehhamdan.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hamzeh Hamdan | AI Software Engineer",
    template: "%s | Hamzeh Hamdan",
  },
  description:
    "AI Software Engineer at Cresset Capital. Harvard graduate in Computer Science & Statistics. Building intelligent systems at the intersection of AI and quantitative finance.",
  keywords: [
    "Hamzeh Hamdan",
    "AI Engineer",
    "Software Engineer",
    "Harvard",
    "Machine Learning",
    "Data Science",
    "Quantitative Finance",
    "LLMs",
    "React",
    "Next.js",
    "Python",
  ],
  authors: [{ name: "Hamzeh Hamdan", url: siteUrl }],
  creator: "Hamzeh Hamdan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Hamzeh Hamdan",
    title: "Hamzeh Hamdan | AI Software Engineer",
    description:
      "AI Software Engineer at Cresset Capital. Harvard graduate building intelligent systems at the intersection of AI and quantitative finance.",
    images: [
      {
        url: "/portrait.png",
        width: 1200,
        height: 630,
        alt: "Hamzeh Hamdan — AI Software Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hamzeh Hamdan | AI Software Engineer",
    description:
      "AI Software Engineer at Cresset Capital. Harvard graduate building intelligent systems at the intersection of AI and quantitative finance.",
    images: ["/portrait.png"],
    creator: "@hamzehbhamdan",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
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
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
        {/* Plausible analytics — privacy-friendly, no cookies */}
        <Script
          defer
          data-domain="hamzehhamdan.com"
          src="https://plausible.io/js/script.js"
        />
      </body>
    </html>
  );
}
