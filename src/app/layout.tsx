import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { RevealFooter } from "@/components/layout/reveal-footer";
import { SoundBoot } from "@/components/sound-boot";
import { BootScreen } from "@/components/ui/boot-screen";
import { VisitTracker } from "@/components/visit-tracker";
import { AuthProvider } from "@/lib/auth-context";
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
  // The live origin. It must match where the site is actually served or every
  // absolute OG/canonical URL resolves to a host that does not exist.
  metadataBase: new URL("https://severrir.github.io"),
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
    url: "/",
    siteName: "severrir",
    locale: "en_US",
  },
  twitter: {
    // summary_large_image is what turns a pasted link into a full-width card
    // instead of a thumbnail beside two lines of text.
    card: "summary_large_image",
    title: "severrir — systems engineering and full-stack development",
    description: "Systems engineered to outlive the build.",
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior is required as of Next 16: it no longer forces
    // scroll-behavior:auto during route changes, so without this the outgoing
    // page smooth-scrolls to the top before the swap and navigation feels laggy.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      /* The script below sets data-booting on this element before React
         hydrates, which is the whole point of it — the curtain has to be
         decided on the first frame. That guarantees the server HTML and the
         client tree disagree here, and React logs a hydration mismatch for an
         attribute it was never meant to own. This says so out loud; it
         suppresses the warning for this element's attributes only, never for
         anything rendered inside it. */
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} ${plexSerif.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col font-sans">
        {/*
         * Runs before the curtain paints, so the decision to show it is made on
         * the first frame rather than after hydration. Returning visitors and
         * anyone who prefers reduced motion never see it; without JavaScript the
         * attribute is never set and the curtain stays display:none.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!localStorage.getItem('severrir:booted')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-booting','')}}catch(e){}",
          }}
        />
        <SoundBoot />
        <BootScreen />
        {/*
         * Wraps everything below rather than only the routes that need a
         * session: the header shows signed-in state on every page, and the
         * visitor counter has to know whether it is looking at the owner before
         * it counts anyone.
         */}
        <AuthProvider>
          <VisitTracker />
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
        </AuthProvider>
      </body>
    </html>
  );
}
