# scripts

## opengraph-image.source.tsx

The generator that produced `src/app/opengraph-image.png`.

It does not live in `src/app/` because a metadata *route* emits an extensionless
file (`/opengraph-image`), and GitHub Pages serves those as
`application/octet-stream` — which every social crawler rejects. Shipping the
PNG as a static file instead gives it a real `.png` extension and content type.

To regenerate after changing the wording or palette:

1. `cp scripts/opengraph-image.source.tsx src/app/opengraph-image.tsx`
2. `npm run build`
3. `cp out/opengraph-image src/app/opengraph-image.png`
4. `rm src/app/opengraph-image.tsx`
5. `npm run build` again, and confirm `og:image` ends in `.png`

The display face is vendored at `src/assets/ibm-plex-serif-300.ttf` (OFL).
