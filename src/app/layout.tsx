import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { RevealFooter } from "@/components/layout/reveal-footer";
import { SoundBoot } from "@/components/sound-boot";
import { BootScreen } from "@/components/ui/boot-screen";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/* Display only. Same superfamily as the UI face, so the high-contrast serif
   reads as register rather than as a second brand. */
const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://severrir.dev"),
  title: {
    default: "severrir — systems engineering and full-stack development",
    template: "%s — severrir",
  },
  description:
    "Backend architecture, gameplay systems and interface work, delivered as modules your team can read, extend and maintain long after handover.",
  openGraph: {
    title: "severrir — systems engineering and full-stack development",
    description: "Systems engineered to outlive the build.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${plexSerif.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col font-sans">
        <SoundBoot />
        <BootScreen />
        <a
          href="#main"
          className="sr-only rounded-md bg-gold px-4 py-2 font-medium text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80]"
        >
          Skip to content
        </a>
        <SiteHeader />
        {/* Sits above the fixed footer so the footer is revealed as this scrolls off. */}
        <main id="main" className="relative z-10 flex-1 bg-bg">
          {children}
        </main>
        <RevealFooter />
      </body>
    </html>
  );
}
