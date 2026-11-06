// House rules from UX.md: only our own components, only theme colors.

// Native controls with no styling of our own. Every <input>, whatever its type: text fields are ui/TextField.
const NATIVE_ELEMENTS = new Set(["input", "select", "option", "optgroup", "datalist", "textarea", "progress", "meter"]);

const noNativeControls = {
  meta: { type: "problem", messages: { native: "Native <{{name}}>: use a component from src/components/ui/ (UX.md rule 7)." } },
  create: (context) => ({
    JSXOpeningElement(node) {
      if (node.name.type !== "JSXIdentifier") return;
      const name = node.name.name;
      if (NATIVE_ELEMENTS.has(name)) context.report({ node, messageId: "native", data: { name } });
    },
  }),
};

// Raw colors: hex, rgb()/hsl()/oklch()… with literal numbers (computed ones like `rgb(${r} …)` read the theme),
// and Tailwind's default palette (bg-black, text-red-500…), which isn't ours.
const HEX = /(^|[^\w&])#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\w-])/i;
// No \b before the name: in Tailwind arbitrary values it follows "_" (shadow-[0_0_0_4px_rgb(0_0_0/0.5)]).
const COLOR_FUNCTION = /(?<![a-z-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*[\d.]/i;
const PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|decoration|divide|accent|caret|placeholder)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b/;
const rawColor = (text) => HEX.test(text) || COLOR_FUNCTION.test(text) || PALETTE.test(text);

const noRawColors = {
  meta: {
    type: "problem",
    messages: { raw: "Raw color: use a theme token from src/index.css (UX.md rule 6)." },
  },
  create: (context) => ({
    Literal(node) {
      if (typeof node.value === "string" && rawColor(node.value)) context.report({ node, messageId: "raw" });
    },
    TemplateElement(node) {
      if (rawColor(node.value.raw)) context.report({ node, messageId: "raw" });
    },
  }),
};

export const house = { rules: { "no-native-controls": noNativeControls, "no-raw-colors": noRawColors } };
