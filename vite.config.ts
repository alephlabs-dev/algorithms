import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePluginUmami } from "./vite-plugin-umami";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePluginUmami({
      // Umami script injection
      umami: {
        id: "aa14b196-a56e-46d3-a3a6-a97f59209dd0",
        src: "https://unami-murex.vercel.app/umami.js",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
