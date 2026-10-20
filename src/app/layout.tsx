import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  icons: { icon: "/icon.svg", shortcut: "/favicon.ico", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
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
    locale: "en_NG",
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
      lang="en-NG"
      className="font-sans"
    >
      <body className="min-h-screen flex flex-col bg-canvas text-ink antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
