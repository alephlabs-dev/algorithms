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
  // Our own components may wrap native controls.
  { files: ["src/components/ui/**"], rules: { "house/no-native-controls": "off" } },
  // The theme bridge: reads src/index.css's tokens for the canvas.
  { files: ["src/canvas/theme.ts"], rules: { "house/no-raw-colors": "off" } },
]);
