---
name: ux-review
description: Review routes of this app against UX.md at phone, tablet and desktop sizes, and report findings with severity. Only reports, never fixes.
disable-model-invocation: true
---

# UX review

Judge screens against `UX.md` the way a learner would see them. **Only report. Don't edit any file, don't fix anything, don't open issues.**

## 1. Pick the routes

- If the user passed routes (`/sorting/insertion-sort`, `/es/graphs`, …), review exactly those.
- Otherwise take the routes touched by the current diff: `git diff --name-only main...HEAD` plus uncommitted changes (`git status --short`), mapped like this:

  | Changed path | Routes |
  |---|---|
  | `src/components/Landing/**` | `/` |
  | `src/modules/<module>/**` | that module's start page, one algorithm/problem page (slugs in `src/routes.ts`) and its race page if it has one (`/sorting/race`, …) |
  | `src/canvas/**` (shared renderers and theme) | one page of each module that draws with the changed file |
  | `src/components/Race/**` | the race pages of the modules touched (`/sorting/race`, `/pathfinding/race`, …) |
  | `src/game/**`, `src/components/Game.tsx`, a module's `questions.ts` | one page per module with Guess mode, with Guess turned on |
  | Shared UI: `src/App.tsx`, `src/components/ui/**`, `TopBar.tsx`, `MobileTopBar.tsx`, `Controls/**`, `Settings/**`, `Tour.tsx`, `src/index.css` | `/`, `/sorting/insertion-sort` and one other module page |
  | Copy or i18n (`src/i18n.ts`, `localized(...)` text) | the same routes under `/es` too |

  Say which routes you picked and why. If nothing UI-related changed, say so and stop.

## 2. Serve the production build

`pnpm build`, then `pnpm preview --port <port> --strictPort` in the background on a free port from 4173 up. **Never use 5173**, which is the human's dev server. Note the PID; stop only that process at the end.

## 3. Look at every route at every size

For each route, in **both themes** (dark and light), at **393×852** (iPhone), **834×1194** (iPad) and **1280×800** (desktop):

1. Open it with the browser tool, with the first-visit tour skipped and the theme set. Before the page loads, set these `localStorage` keys: every module's tour key to `"true"` (each module's `tourKey`, under `src/modules/<module>/`: `tour-done`, `tour-done-<module>`), and `theme` to `"dark"` or `"light"`. The app reads its theme only from `localStorage.theme`; it ignores `prefers-color-scheme`, so `colorScheme`/`emulateMedia` alone does nothing. If no browser tool is available, drive the project's Playwright from a Node script kept in the scratchpad (import from `<repo>/node_modules/@playwright/test/index.mjs`).
   **Check the rendered theme after every load**, before any screenshot: `document.documentElement.dataset.theme` must be `"light"` for light and unset for dark (`undefined` in the page; Playwright's `evaluate` returns it as `null`). On a mismatch, **stop the review**: don't judge any screenshot, report `Theme mismatch on <route> at <size>: requested <theme>, rendered <data-theme value>`, and stop the preview you started.
2. Bring the screen to the state the change is about: press Play, open the drawer or popover that changed, turn Guess on and wait for a question, and so on. Default to a run paused a few steps in, where something is lit.
3. Take a screenshot and **look at it yourself**. Read the console; errors count as findings.
4. Judge it against each rule in `UX.md`:
   1. One purpose per view: is it obvious what this screen is for? Does anything compete with it?
   2. Hierarchy: is the primary thing seen first and does it stand out?
   3. Whitespace: is anything crowded, cramped or touching?
   4. Secondary content: is it behind a tab, collapsible section, drawer/sheet, or slider, rather than laid out next to the primary thing?
   5. Flow: is it clear what to press next, and in what order?
   6. Only theme colors: anything that doesn't look like the theme? Judge it in both themes; something that works in one and breaks in the other is a finding for the theme where it breaks.
   7. Only our own components: any native browser control (select wheel, checkbox, range input, default-styled field)?

   And as a learner: every number or name a prompt, caption or option mentions is readable on screen; nothing covers the stage; nothing is cut off or too small to read; tap targets look at least 44×44 on phone and tablet.

## 4. Report

One section per route; inside it, one line per finding:

`[high|medium|low] <size> <dark|light> — <what's wrong, where on the screen> — breaks UX.md rule <n> (or: learner check)`

- **high:** the view's purpose is blocked or hard to use: the stage covered, an answer impossible to read, a control that can't be reached, a console error.
- **medium:** a rule is clearly broken but the screen still works.
- **low:** polish: spacing, alignment, a slightly weak hierarchy.

When a route is clean at a size and theme, say so in one line. Don't invent findings. If something looks off but no rule in `UX.md` covers it, list it under **Not covered by UX.md**. End with the counts per severity and the screenshots' paths. Then stop the preview you started.
