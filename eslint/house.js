// House rules from UX.md: only our own components, only theme colors.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

// Module boundaries (docs/adr/0003): each module lives in src/modules/<id>/ and keeps to its folder.
// Paths are compared from the repo root (this file's parent folder, whatever ESLint's cwd), with "@/" read as src/.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const posix = (file) => file.split(path.sep).join("/");
const withoutExtension = (file) => file.replace(/\.(tsx?|jsx?)$/, "");

/** Where an import points, from the repo root and without its extension; null for a package. */
const resolveImport = (source, filename, root) => {
  if (source.startsWith("@/")) return withoutExtension(posix(path.join("src", source.slice(2))));
  if (source.startsWith(".")) return withoutExtension(posix(path.relative(root, path.resolve(path.dirname(filename), source))));
  return null;
};

/**
 * The module a file belongs to and its path inside the module's folder ("index" for the folder
 * itself), or null for shared code, such as the registries next to the folders.
 */
const moduleOf = (file, root) => {
  const match = /^src\/modules\/([^/]+)(?:\/(.+))?$/.exec(file ?? "");
  if (!match) return null;
  if (match[2] !== undefined) return { id: match[1], file: withoutExtension(match[2]) };
  const isFolder = fs.statSync(path.join(root, file), { throwIfNoEntry: false })?.isDirectory();
  return isFolder ? { id: match[1], file: "index" } : null;
};

/** An import that brings in types only (`import type`, or every name marked `type`), erased at runtime. */
const onlyTypes = (node) =>
  node.type === "ImportDeclaration" &&
  (node.importKind === "type" || (node.specifiers.length > 0 && node.specifiers.every((s) => s.importKind === "type")));

/**
 * Code the prerender can't load: it reads the browser (window, document) when it loads, or leads to code that does.
 * The store, the app's entry, the interface and slice registries, and every module's interface and slice.
 */
const browserOnly = (file, root) => {
  if (["src/store", "src/main", "src/modules/index", "src/modules/engine"].includes(file)) return true;
  const target = moduleOf(file, root);
  return target?.file === "ui" || target?.file === "slice";
};

/** The file on disk an import resolves to (repo-relative, without extension), or null for none. */
const fileOnDisk = (file, root) => {
  for (const suffix of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const full = path.join(root, file + suffix);
    if (fs.existsSync(full)) return full;
  }
  return null;
};

// Every import, export-from and dynamic import(), with what it brings in.
const IMPORT = /(?:^|[\n;])\s*(?:import|export)\s+(type\s+)?(?:([\s\S]*?)\s+from\s+)?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/g;
const typesOnly = (names) => /^\{[\s\S]*\}$/.test(names) && names.slice(1, -1).split(",").every((n) => !n.trim() || /^type\s/.test(n.trim()));

const importsCache = new Map();
/** The files a file imports values from (repo-relative, without extension), read from disk. */
const valueImports = (full, root) => {
  const mtime = fs.statSync(full).mtimeMs;
  const cached = importsCache.get(full);
  if (cached?.mtime === mtime) return cached.imports;
  const imports = [];
  for (const [, type, names, source, dynamic] of fs.readFileSync(full, "utf8").matchAll(IMPORT)) {
    if (type || (names && typesOnly(names.trim()))) continue;
    const resolved = resolveImport(source ?? dynamic, full, root);
    if (resolved) imports.push(resolved);
  }
  importsCache.set(full, { mtime, imports });
  return imports;
};

/** The file an import names, as found on disk ("src/modules" is "src/modules/index"). */
const canonical = (file, root) => {
  const full = fileOnDisk(file, root);
  return full ? withoutExtension(posix(path.relative(root, full))) : file;
};

/** The shortest chain of imports from `file` to browser-only code, or null when there's none. */
const pathToBrowser = (start, root) => {
  const file = canonical(start, root);
  const queue = [[file]];
  const seen = new Set([file]);
  while (queue.length > 0) {
    const chain = queue.shift();
    const last = chain[chain.length - 1];
    if (browserOnly(last, root)) return chain;
    const full = fileOnDisk(last, root);
    if (!full) continue;
    for (const next of valueImports(full, root).map((f) => canonical(f, root))) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push([...chain, next]);
    }
  }
  return null;
};

const moduleBoundaries = {
  meta: {
    type: "problem",
    schema: [
      {
        type: "object",
        properties: {
          registries: { type: "object", additionalProperties: { type: "string" } },
          // Shared files the prerender renders in Node (besides each module's content), from the repo root.
          prerender: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      manifest:
        "A manifest runs in Node (e2e, prerender): it may import only its own types.ts and algorithms.ts, src/i18n.ts and src/routes.ts (docs/adr/0003).",
      algorithms:
        "A module's algorithms.ts runs in Node through its manifest: it may import only its own types.ts, src/i18n.ts and src/routes.ts, plus types from its own folder or shared code (docs/adr/0003).",
      registry:
        "Shared code reaches module {{to}} only through the registries: its manifest from src/modules/manifests.ts, its slice from src/modules/engine.ts, its interface from src/modules/index.ts (docs/adr/0003).",
      prerender:
        "The prerender renders this file in Node, where there's no window: it can't reach {{target}}{{via}}. A module's content (articles, thumbnail) reaches only Node-safe code; the store, interfaces and slices are the browser's side (docs/adr/0003).",
      otherModule: "Module {{from}} can't import from module {{to}}'s folder. Move what both need to shared code (docs/adr/0003).",
    },
  },
  create: (context) => {
    const root = ROOT;
    const from = posix(path.relative(root, context.filename));
    const importer = moduleOf(withoutExtension(from), root);
    // The piece of every module this file registers ("slice", "ui"), if it's a registry.
    const registers = context.options[0]?.registries?.[from];
    // Rendered by the prerender in Node: a module's content, or a shared file listed as such.
    const prerendered = importer?.file === "content" || (context.options[0]?.prerender ?? []).includes(from);
    const check = (node) => {
      if (typeof node.source?.value !== "string") return;
      const resolved = resolveImport(node.source.value, context.filename, root);
      const target = moduleOf(resolved, root);
      // The manifest and the algorithms.ts it reads run in Node: no browser, React or bundler.
      if (importer?.file === "manifest" || importer?.file === "algorithms") {
        const own = (file) => target?.id === importer.id && target.file === file;
        const nodeSafe = resolved === "src/i18n" || resolved === "src/routes" || own("types");
        if (importer.file === "manifest") {
          if (!nodeSafe && !own("algorithms")) context.report({ node: node.source, messageId: "manifest" });
        } else if (!nodeSafe && !(onlyTypes(node) && resolved !== null && (!target || target.id === importer.id))) {
          context.report({ node: node.source, messageId: "algorithms" });
        }
        return;
      }
      if (prerendered && resolved !== null && !onlyTypes(node)) {
        const chain = pathToBrowser(resolved, root);
        if (chain) {
          const through = chain.slice(0, -1);
          const via = through.length > 0 ? ` (through ${through.join(" → ")})` : "";
          context.report({ node: node.source, messageId: "prerender", data: { target: chain[chain.length - 1], via } });
          return;
        }
      }
      if (!target) return;
      if (!importer) {
        if (target.file !== registers) context.report({ node: node.source, messageId: "registry", data: { to: target.id } });
      } else if (importer.id !== target.id) {
        context.report({ node: node.source, messageId: "otherModule", data: { from: importer.id, to: target.id } });
      }
    };
    return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check, ImportExpression: check };
  },
};

export const house = {
  rules: { "no-native-controls": noNativeControls, "no-raw-colors": noRawColors, "module-boundaries": moduleBoundaries },
};
