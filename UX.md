# UX rules

How every screen of this app should feel. Read this before UI work. `/ux-review` checks screens against it, and reviewers check UI diffs against it.

Each rule says what it means here and gives one example from a screen that already follows it.

## 1. One purpose per view; everything else is secondary

Each view exists for one thing. Everything else on it supports that thing and gives way to it.

- **In this app:** a module page is for watching the run on the stage (`src/components/AlgorithmVisualizer/`, the module stages under `src/components/<Module>/`). Pickers, settings, pseudocode and the written explanation support it.
- **Example:** on a sorting algorithm page the bars fill the stage. The pseudocode card (`NowCard` in `src/components/Pseudocode.tsx`) only sits beside it on wide screens (`hidden xl:flex` in `src/App.tsx`), and the explanation lives below the fold in `src/components/About.tsx`.

## 2. Clear hierarchy: the primary thing is seen first and stands out

The primary thing is the first thing the eye lands on, and it looks different from the rest: bigger, brighter or alone.

- **In this app:** stages are near black (`--color-background`) and color is kept for the data (`--color-bar`, `--color-primary`, `--color-secondary`, `--color-tertiary` in `src/index.css`). Of the controls, the one main action in a group is the `primary` variant of `src/components/ui/button.tsx` (filled); everything else is `secondary` (an outlined pill) or `ghost`.
- **Example:** in the playback dock (`src/components/Controls/Controls.tsx`) Play is the only filled button; step back, step forward and new run are outlined icon buttons around it.

## 3. Generous whitespace; never crowded, even if that means showing less

Leave room around things. When a screen gets crowded, show less on it, not smaller things.

- **In this app:** the spacing scale is 4 · 8 · 12 · 16 · 24 · 40 px (Tailwind 1 · 2 · 3 · 4 · 6 · 10), written down in the `@theme` comment in `src/index.css`. Floating surfaces are `rounded-3xl`, controls are pills.
- **Example:** on phones the module's tools (presets, sizes) don't sit above the stage at all: "Phones keep the module's tools in the settings sheet, so the stage gets the room" (`src/App.tsx`, `Tools` is `hidden md:flex`).

## 4. Secondary content hides behind tabs, collapsible sections, drawers/sheets, or sliders for settings

Secondary content isn't laid out next to the primary one. It sits behind one of these and comes out when asked for.

- **In this app:** drawers/sheets are `src/components/ui/drawer.tsx`; popovers are `src/components/ui/popover.ts` with Radix Popover; tab-like switches are `src/components/ui/segmented.tsx` (for example Visualize / Race in `src/components/ViewSwitch.tsx`). `src/components/ui/slider.tsx` exists, but today it only scrubs playback (`src/components/Controls/Progress.tsx`), no setting uses it. There's no collapsible-section component yet.
- **Example:** on phones the pseudocode opens from a drawer (`src/components/Pseudocode.tsx`), and on desktop the longer explanation of a module opens from the ⓘ button as a popover (`AboutButton` in `src/components/TopBar.tsx`).

## 5. Every screen has a clear flow: where the user clicks and in what order

At any moment it's obvious what to press next, and the steps come in an order that makes sense.

- **In this app:** each module's guided tour (`src/modules/tours.tsx`) spells that order out, and screens should match it.
- **Example:** the sorting tour goes pick an algorithm → the array → play it → follow each step → set the pace → change the array → the guessing game → race them. Guess mode has its own short flow: turn Guess on (`GameToggle` in `src/components/Game.tsx`), press Play, answer in the panel under the stage, read the result.

## 6. Only theme colors

Every color comes from the theme. No hex, `rgb()`, `hsl()` or `oklch()` values in components, and no Tailwind default palette (`bg-black`, `text-red-500`, …).

- **In this app:** the theme is the `--color-*` tokens in `src/index.css`, with a light-theme block under `:root[data-theme="light"]`, used as Tailwind classes (`bg-surface`, `text-foreground`, `border-edge`, …). Canvas renderers read the same tokens through `src/canvas/theme.ts` (`readColors`).
- **Example:** the sorted-section highlight on the sorting stage is `--color-tertiary` (yellow in dark, blue in light), read by `src/canvas/barsRenderer.ts` through `readColors`, so it switches with the theme.

## 7. Only our own components, never native browser controls

Controls come from `src/components/ui/`, styled like the rest of the app. No native `<select>`, checkboxes, radios, range inputs or other browser controls.

- **In this app:** `src/components/ui/` holds `button`, `segmented`, `slider`, `drawer`, `popover`, `preset-buttons`, `list-item`, `badge`, `section-label`, `fact-line`, `tooltip`.
- **Example:** the array size in the sorting settings (`src/components/Settings/SettingsPanel.tsx`) is our `SegmentedControl` (role `radiogroup`), not a native `<select>` or radio buttons.

## Checked automatically

- **Tap targets (iPhone and iPad e2e projects):** every visible button, link and form control is at least 44×44 px.
- **Native controls (lint):** native form controls are only allowed inside `src/components/ui/`.
- **Raw colors (lint):** color literals and Tailwind default palette classes are only allowed in the theme.

## Open questions

These need a decision before the rules above can be applied to them.

1. **Tab or drawer on iPhone:** when does secondary content go in a tab, and when in a drawer/sheet? Today phones use drawers (pseudocode, settings, module switcher) and segmented controls for views (Visualize / Race).
2. **Collapsible sections:** rule 4 lists them, but the app has no collapsible-section component. Should one be added to `src/components/ui/`, and where should it be used first, for example the explanation under the stage?
3. **Sliders for settings:** rule 4 lists sliders for settings, but today every setting is a segmented control or preset buttons (array size, speed, grid size). Which settings, if any, should be sliders?
4. **Native select on phones:** the algorithm picker in `src/components/MobileTopBar.tsx` is a native `<select>` on purpose, so phones open their own picker (the iOS wheel). Rule 7 forbids it. Replace it with our own picker (drawer list?), or allow this one exception?
5. **Text and number entry:** the operation value in data structures (`src/components/Structures/StructureStage.tsx`) and the words in dynamic programming (`src/components/Dp/DpStage.tsx`) are native `<input>`s, styled as pills. There's no text-field component in `src/components/ui/`. Add one, or treat styled text/number inputs as allowed?
6. **Overlays and shadows:** the drawer overlay, the shortcuts dialog backdrop and the tour's spotlight dim the page with black or navy at some opacity. Should the theme get a token for that (a scrim color), so rule 6 covers it too?
