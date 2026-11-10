import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import { house } from "./eslint/house.js";

// House rules from UX.md: only our own components, only theme colors.
export default defineConfig([
  globalIgnores(["dist", ".claude", "test-results", "playwright-report"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    plugins: { house },
    rules: {
      "house/no-native-controls": "error",
      "house/no-raw-colors": "error",
    },
  },
  // e2e: open pages with gotoApp, which waits for React to replace the prerendered HTML (#116).
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='goto']",
          message: "Use gotoApp(page, url) from e2e/goto.ts: it waits until the app has rendered the page.",
        },
      ],
    },
  },
  // Module boundaries (docs/adr/0003): a module keeps to its folder in src/modules/<id>/, shared code
  // (e2e included) reaches it only through the registries, and its manifest imports only Node-safe code.
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { house },
    rules: {
      "house/module-boundaries": [
        "error",
        { registries: { "src/modules/engine.ts": "slice", "src/modules/index.ts": "ui" } },
      ],
    },
  },
  // Our own components may wrap native controls.
  { files: ["src/components/ui/**"], rules: { "house/no-native-controls": "off" } },
  // The theme bridge: reads src/index.css's tokens for the canvas.
  { files: ["src/canvas/theme.ts"], rules: { "house/no-raw-colors": "off" } },
]);
