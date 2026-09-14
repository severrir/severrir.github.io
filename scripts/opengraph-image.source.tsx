import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Required under output:"export" — the image is rendered once at build time.
export const dynamic = "force-static";

export const alt = "severrir — systems engineering and full-stack development";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Satori cannot read the next/font faces the rest of the site uses, and it
 * refuses to lay out with no font at all, so the display face is vendored at
 * src/assets and read from disk. Fetching it from Google at build time was the
 * obvious alternative and is rejected deliberately: it makes every deploy depend
 * on a third party being reachable, and a miss there fails the build rather than
 * degrading. IBM Plex is OFL, so shipping the file is fine.
 */
const FONT = join(process.cwd(), "src/assets/ibm-plex-serif-300.ttf");

export default async function Image() {
  const serif = await readFile(FONT);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#030712",
          // The hero's cobalt bloom, top-centre, so the card reads as the site.
          backgroundImage:
            "radial-gradient(1100px 620px at 50% -22%, #0A1128 0%, rgba(3,7,18,0) 68%)",
          padding: "84px 96px",
          position: "relative",
        }}
      >
        {/* Gold hairline along the top edge — the site's specular lip. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, rgba(212,175,55,0) 0%, #D4AF37 50%, rgba(212,175,55,0) 100%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 28, height: 1, background: "#D4AF37" }} />
          <div
            style={{
              fontSize: 27,
              color: "#94A3B8",
              letterSpacing: "0.01em",
            }}
          >
            severrir
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.06,
              color: "#F8FAFC",
              letterSpacing: "-0.03em",
              fontFamily: "Plex Serif",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Systems engineered</span>
            <span>to outlive the build.</span>
          </div>
          <div
            style={{
              marginTop: 34,
              fontSize: 30,
              color: "#94A3B8",
              letterSpacing: "0.005em",
            }}
          >
            Backend architecture, gameplay systems and interface work.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ fontSize: 25, color: "#D4AF37" }}>severrir.github.io</div>
          <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.22)" }} />
          <div style={{ fontSize: 25, color: "#94A3B8" }}>Commissions open</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Plex Serif", data: serif, style: "normal", weight: 300 }],
    },
  );
}
