import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces, Shantell_Sans } from "next/font/google";
import { RouteCurtain } from "@/components/RouteCurtain";
import { PawTrailCanvas } from "@/components/layout/PawTrailCanvas";
import { SiteFooter, WhatsAppBar } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "WONK", "opsz"], display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const shantell = Shantell_Sans({ subsets: ["latin"], variable: "--font-shantell", axes: ["BNCE", "INFM"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "TeddyPups U.A.E. — Premium teacup puppies in Dubai", template: "%s | TeddyPups U.A.E." },
  description: "Teddy bear and teacup puppies in Dubai. Meet local puppies in our Downtown Dubai showroom or bring home a rare breed imported from trusted breeders.",
  openGraph: { siteName: "TeddyPups U.A.E.", type: "website", images: ["/brand/logo.png"] },
};

export const viewport: Viewport = { themeColor: "#fffdf8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${figtree.variable} ${shantell.variable}`}>
      <body>
        <RouteCurtain />
        <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-cocoa px-5 py-3 font-semibold text-milk">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">
          {children}
        </main>
        <SiteFooter />
        <WhatsAppBar />
        <SmoothScroll />
        <PawTrailCanvas />
      </body>
    </html>
  );
}
