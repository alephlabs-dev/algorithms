/// <reference types="node" />
import { readFileSync } from "node:fs";
import { variables, type CanvasColors } from "./theme";

/* For tests: the theme colors as src/index.css defines them now, dark in @theme, light overriding it. */

const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const block = (selector: string) => {
  const open = css.indexOf(`${selector} {`);
  return css.slice(open, css.indexOf("\n}", open));
};
const colorsIn = (...blocks: string[]) =>
  Object.fromEntries(
    Object.entries(variables).map(([key, name]) => {
      // A later block overrides an earlier one, like the cascade.
      const value = blocks.reduce<string | undefined>(
        (found, b) => b.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})\\s*;`, "i"))?.[1] ?? found,
        undefined,
      );
      return [key, value];
    }),
  ) as CanvasColors;

export const cssColors = {
  dark: colorsIn(block("@theme")),
  light: colorsIn(block("@theme"), block(':root[data-theme="light"]')),
};
