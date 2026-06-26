import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { copyFileSync, existsSync } from "node:fs";

// GitHub Pages has no SPA fallback: a hard load / refresh of a client-side route
// like /services would otherwise return GitHub's own 404. Copying the built
// index.html to 404.html makes Pages serve the app for any unknown path, and
// React Router then renders the right page from the URL.
function spaFallback() {
  return {
    name: "spa-404-fallback",
    closeBundle() {
      const index = fileURLToPath(new URL("./dist/index.html", import.meta.url));
      const notFound = fileURLToPath(new URL("./dist/404.html", import.meta.url));
      if (existsSync(index)) copyFileSync(index, notFound);
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
