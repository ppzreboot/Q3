import { copyFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages serves the site from /Q3/, not the domain root
  base: "/Q3/",
  plugins: [
    react(),
    {
      name: "github-pages-spa",
      apply: "build",
      closeBundle() {
        // unknown routes like /Q3/doors have no file; Pages serves 404.html and keeps the URL
        copyFileSync("dist/index.html", "dist/404.html");
      },
    },
  ],
  appType: "spa",
});
