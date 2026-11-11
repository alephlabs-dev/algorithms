/*
 * Shared by every module's Thumbnail.tsx: small, still pictures of each module, drawn with plain
 * elements so they render in the prerendered HTML too. Each comes from a real run.
 */

// The grid's own palette, mixed from the theme's colors so it follows light and dark.
export const mix = (color: string, amount: number) =>
  `color-mix(in srgb, var(--color-${color}) ${amount}%, var(--color-background))`;
