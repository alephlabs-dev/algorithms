import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// vitest/config re-exports Vite's defineConfig with the `test` options typed.
import { configDefaults, defineConfig } from "vitest/config";
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
  test: {
    // Agent worktrees live under .claude/ and carry their own copy of the tests.
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
