import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "StudentOS Africa — Scholarships, Internships & Student Benefits",
    template: "%s | StudentOS Africa",
  },
  description:
    "The discovery platform for African students. Find scholarships, internships, fellowships, grants, student benefits, and free tools — all in one place.",
  keywords: [
    "scholarships for African students",
    "internships Africa",
    "fellowships",
    "student benefits Nigeria",
    "GitHub Student Pack",
    "free tools for students",
    "StudentOS",
  ],
  authors: [{ name: "StudentOS Africa" }],
  creator: "StudentOS Africa",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "StudentOS Africa",
    title: "StudentOS Africa — Discover Opportunities",
    description:
      "Scholarships, internships, fellowships, student benefits and free tools for African students.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudentOS Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudentOS Africa",
    description: "Discover scholarships, internships, and student benefits.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0E5C2F",
  width: "device-width",
  initialScale: 1,
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-canvas text-ink antialiased" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
