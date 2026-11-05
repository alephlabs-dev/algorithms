import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// vitest/config re-exports Vite's defineConfig with the `test` options typed.
import { configDefaults, defineConfig } from "vitest/config";
import { prerender } from "./vite-plugin-prerender.ts";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    prerender(),
  ],
  build: {
    // One bundle of ~500 kB (~155 kB gzipped) for the whole app; splitting it buys little here.
    chunkSizeWarningLimit: 600,
  },
  test: {
    // Agent worktrees live under .claude/ and carry their own copy of the tests; e2e/ is Playwright.
    exclude: [...configDefaults.exclude, ".claude/**", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
