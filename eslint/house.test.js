import { RuleTester } from "eslint";
import path from "node:path";
import tseslint from "typescript-eslint";
import { afterAll, describe, it } from "vitest";
import { house } from "./house.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

const native = (name) => [{ messageId: "native", data: { name } }];

// The rule itself; src/components/ui/ is let off in eslint.config.js.
tester.run("no-native-controls", house.rules["no-native-controls"], {
  valid: [
    { code: "<TextField label='Value' />" },
    { code: "<Button type='button' />" },
    { code: "<form><label>Value</label></form>" },
  ],
  invalid: [
    { code: "<input />", errors: native("input") },
    { code: "<input type='text' />", errors: native("input") },
    { code: "<input type='number' />", errors: native("input") },
    { code: "<input type='search' />", errors: native("input") },
    { code: "<input type='checkbox' />", errors: native("input") },
    { code: "<input type={kind} />", errors: native("input") },
    { code: "<select />", errors: native("select") },
    { code: "<textarea />", errors: native("textarea") },
  ],
});

// Module boundaries (docs/adr/0003): the files are named from the repo root.
const at = (file) => path.join(import.meta.dirname, "..", file);
const boundaries = house.rules["module-boundaries"];
const registries = [
  {
    registries: {
      "src/modules/manifests.ts": "manifest",
      "src/modules/engine.ts": "slice",
      "src/modules/index.ts": "ui",
      "src/modules/contents.ts": "content",
    },
    prerender: ["src/components/About.tsx"],
  },
];
// TypeScript's parser, for `import type`.
const moduleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

moduleTester.run("module-boundaries", boundaries, {
  valid: [
    // A module imports its own files, shared code and packages.
    { code: "import { MazeRun } from './run';", filename: at("src/modules/mazes/slice.ts"), options: registries },
    { code: "import { x } from '@/modules/mazes/run';", filename: at("src/modules/mazes/ui.tsx"), options: registries },
    { code: "import { theme } from '@/canvas/theme';", filename: at("src/modules/mazes/paint.ts"), options: registries },
    { code: "import { create } from 'zustand';", filename: at("src/modules/mazes/slice.ts"), options: registries },
    // Each registry imports its piece of every module.
    { code: "import { mazesSlice } from './mazes/slice';", filename: at("src/modules/engine.ts"), options: registries },
    { code: "import { mazesUI } from '@/modules/mazes/ui';", filename: at("src/modules/index.ts"), options: registries },
    { code: "import { mazesManifest } from './mazes/manifest';", filename: at("src/modules/manifests.ts"), options: registries },
    // A manifest runs in Node: its own types, i18n and routes only.
    { code: "import type { MazeAlgorithm } from './types';", filename: at("src/modules/mazes/manifest.ts"), options: registries },
    { code: "import { localized } from '@/i18n';", filename: at("src/modules/mazes/manifest.ts"), options: registries },
    { code: "import { localized } from '../../i18n.ts';", filename: at("src/modules/mazes/manifest.ts"), options: registries },
    { code: "import type { Pages } from '../../routes';", filename: at("src/modules/mazes/manifest.ts"), options: registries },
    { code: "import { mazeAlgorithms } from './algorithms';", filename: at("src/modules/mazes/manifest.ts"), options: registries },
    // So is its algorithms.ts, which the manifest reads names from; types it only borrows are erased.
    { code: "import { localized } from '@/i18n';", filename: at("src/modules/mazes/algorithms.ts"), options: registries },
    { code: "import { MAZE_ALGORITHMS } from './types';", filename: at("src/modules/mazes/algorithms.ts"), options: registries },
    { code: "import type { Method } from './work';", filename: at("src/modules/dp/algorithms.ts"), options: registries },
    { code: "import type { GridSize } from '@/utils/gridSize';", filename: at("src/modules/mazes/algorithms.ts"), options: registries },
    // Shared files next to the module folders aren't modules.
    { code: "import { defineModule } from './slice';", filename: at("src/modules/sorting.slice.ts"), options: registries },
    // A module's content and the prerendered pages reach Node-safe code, and types from anywhere.
    { code: "import { MazeArticle } from './articles';", filename: at("src/modules/mazes/content.tsx"), options: registries },
    { code: "import type { Theme } from '@/store';", filename: at("src/modules/mazes/content.tsx"), options: registries },
    { code: "import { type Theme } from '@/store';", filename: at("src/modules/mazes/content.tsx"), options: registries },
    { code: "import { moduleContents } from '@/modules/contents';", filename: at("src/components/About.tsx"), options: registries },
  ],
  invalid: [
    {
      code: "import { x } from '@/modules/pathfinding/grid';",
      filename: at("src/modules/mazes/slice.ts"),
      options: registries,
      errors: [{ messageId: "otherModule", data: { from: "mazes", to: "pathfinding" } }],
    },
    {
      code: "import { x } from '../pathfinding/grid';",
      filename: at("src/modules/mazes/slice.ts"),
      options: registries,
      errors: [{ messageId: "otherModule", data: { from: "mazes", to: "pathfinding" } }],
    },
    // Shared code reaches a module only through the registries.
    {
      code: "import { mazeAlgorithms } from '@/modules/mazes/algorithms';",
      filename: at("src/components/About.tsx"),
      options: registries,
      errors: [{ messageId: "registry", data: { to: "mazes" } }],
    },
    {
      code: "export { MazeRun } from '../src/modules/mazes/run';",
      filename: at("e2e/mazes.spec.ts"),
      options: registries,
      errors: [{ messageId: "registry", data: { to: "mazes" } }],
    },
    {
      code: "const ui = import('./modules/mazes/ui');",
      filename: at("src/App.tsx"),
      options: registries,
      errors: [{ messageId: "registry", data: { to: "mazes" } }],
    },
    // A manifest imports nothing that may need a browser, React or the bundler.
    ...[
      "import { MAZE_ALGORITHMS } from './generators';",
      "import { useStore } from '@/store';",
      "import { mazesUI } from './ui';",
      "import { useState } from 'react';",
      "import type { PathAlgorithm } from '@/modules/pathfinding/types';",
    ].map((code) => ({
      code,
      filename: at("src/modules/mazes/manifest.ts"),
      options: registries,
      errors: [{ messageId: "manifest" }],
    })),
    // Nor does its algorithms.ts, except for types.
    ...[
      "import { MAZE_ALGORITHMS } from './generators';",
      "import { gridDimensions } from '@/utils/gridSize';",
      "import { useState } from 'react';",
      "import type { PathAlgorithm } from '@/modules/pathfinding/types';",
    ].map((code) => ({
      code,
      filename: at("src/modules/mazes/algorithms.ts"),
      options: registries,
      errors: [{ messageId: "algorithms" }],
    })),
    {
      code: "import { mazeAlgorithms } from './mazes/algorithms';",
      filename: at("src/modules/manifests.ts"),
      options: registries,
      errors: [{ messageId: "registry", data: { to: "mazes" } }],
    },
    // A registry imports only its own piece, and the module's folder isn't an entry point.
    {
      code: "import { mazesUI } from './mazes/ui';",
      filename: at("src/modules/engine.ts"),
      options: registries,
      errors: [{ messageId: "registry", data: { to: "mazes" } }],
    },
    {
      code: "import { mazesSlice } from './mazes';",
      filename: at("src/modules/engine.ts"),
      options: registries,
      errors: [{ messageId: "registry", data: { to: "mazes" } }],
    },
    // A module's content is rendered by the prerender in Node: it never reaches the browser's store.
    {
      code: "import { useStore } from '@/store';",
      filename: at("src/modules/mazes/content.tsx"),
      options: registries,
      errors: [{ messageId: "prerender", data: { target: "src/store", via: "" } }],
    },
    // Nor through another file: sorting's settings read the store.
    {
      code: "import { SortingSettings } from './Settings';",
      filename: at("src/modules/sorting/content.tsx"),
      options: registries,
      errors: [{ messageId: "prerender", data: { target: "src/store", via: " (through src/modules/sorting/Settings)" } }],
    },
    // Nor its own interface or slice.
    ...["import { mazesUI } from './ui';", "import { mazesSlice } from './slice';"].map((code) => ({
      code,
      filename: at("src/modules/mazes/content.tsx"),
      options: registries,
      errors: [{ messageId: "prerender" }],
    })),
    // The shared files the prerender renders keep to the same side: modules only through their content.
    {
      code: "import { moduleUIs } from '@/modules';",
      filename: at("src/components/About.tsx"),
      options: registries,
      errors: [{ messageId: "prerender", data: { target: "src/modules/index", via: "" } }],
    },
  ],
});
