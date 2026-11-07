# UX rules

How every screen of this app should feel. Read this before UI work. `/ux-review` checks screens against it, and reviewers check UI diffs against it.

Each rule says what it means here and gives one example from a screen that already follows it.

## 1. One purpose per view; everything else is secondary

Each view exists for one thing. Everything else on it supports that thing and gives way to it.

- **In this app:** a module page is for watching the run on the stage (`src/components/AlgorithmVisualizer/`, the module stages under `src/components/<Module>/`). Pickers, settings, pseudocode and the written explanation support it.
- **Example:** on a sorting algorithm page the bars fill the stage. The pseudocode (`NowCard` in `src/components/Pseudocode.tsx`) waits behind a tab of the side panel on wide screens (`SidePanel` in `src/components/Settings/ModuleSettings.tsx`), and the explanation lives below the fold in `src/components/About.tsx`.
- **The stage stays put:** nothing above the stage changes height during playback, so the stage doesn't move while a run plays. The step sentence over it always takes two lines of room, one line or two (`StepCaption` in `src/components/Pseudocode.tsx`; checked by `e2e/stage-stays-put.spec.ts`).

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

- **In this app:** drawers/sheets are `src/components/ui/drawer.tsx`; popovers are `src/components/ui/popover.ts` with Radix Popover; tab-like switches are `src/components/ui/segmented.tsx` (for example Visualize / Race in `src/components/ViewSwitch.tsx`). `src/components/ui/slider.tsx` scrubs playback (`Slider` in `src/components/Controls/Progress.tsx`) and picks settings with fixed steps (`StepSlider`, the array size in `src/components/Settings/SettingsPanel.tsx`). Collapsible sections are `src/components/ui/disclosure.tsx` (the explanations under the stage, `Explanation` in `src/components/About.tsx`).
- **Example:** on phones the pseudocode opens from a sheet (`CodeSheet` in `src/components/Pseudocode.tsx`), and on desktop the longer explanation of a module opens from the ⓘ button as a popover (`AboutButton` in `src/components/TopBar.tsx`).

## 5. Every screen has a clear flow: where the user clicks and in what order

At any moment it's obvious what to press next, and the steps come in an order that makes sense.

- **In this app:** each module's guided tour (`src/modules/tours.tsx`) spells that order out, and screens should match it.
- **Example:** the sorting tour goes pick an algorithm → the array → play it → follow each step → set the pace → change the array → the guessing game → race them. Guess mode has its own short flow: turn Guess on (`GameToggle` in `src/components/Game.tsx`), press Play, answer in the panel under the stage, read the result.

## 6. Only theme colors

Every color comes from the theme. No hex, `rgb()`, `hsl()` or `oklch()` values in components, and no Tailwind default palette (`bg-black`, `text-red-500`, …).

- **In this app:** the theme is the `--color-*` tokens in `src/index.css`, with a light-theme block under `:root[data-theme="light"]`, used as Tailwind classes (`bg-surface`, `text-foreground`, `border-edge`, …). Canvas renderers read the same tokens through `src/canvas/theme.ts` (`readColors`).
- **Example:** the sorted-section highlight on the sorting stage is `--color-tertiary` (yellow in dark, blue in light), read by `src/canvas/barsRenderer.ts` through `readColors`, so it switches with the theme.

## 7. Never controls with the browser's default look

Never controls with the browser's default look. Every control lives in `src/components/ui/`; those components may use the native element inside, always with our own styles and theme colors.

- **In this app:** `src/components/ui/` holds `button`, `segmented`, `slider`, `drawer`, `popover`, `preset-buttons`, `list-item`, `badge`, `section-label`, `fact-line`, `tooltip`, `disclosure`, `text-field`, `native-select`.
- **Example:** the speed control (`src/components/Controls/SpeedControl.tsx`) is our `SegmentedControl` (role `radiogroup`), not a native `<select>` or radio buttons.

## 8. Secondary content on phones and tablets

- Phones and iPad portrait: settings open in a modal bottom sheet over the stage, with the `--color-scrim` backdrop. The stage never resizes or moves under it, and opening or closing it doesn't change playback. It closes with its ✕, a swipe down, a tap on the backdrop or Escape. Its content fits without scrolling (rule 14).
- Play and speed stay in the dock, never in the settings sheet.
- Explanatory content followed during playback (the pseudocode) may open in its own non-modal sheet.
- Choices that don't fit inline open in a modal sheet with a close button. Never stack sheets.
- Tabs or segmented controls switch between content the learner doesn't need to see at the same time. A separate route only for long, independent content.
- iPad landscape and desktop: a side panel beside the stage, never covering it, with two tabs: Settings (the default; fits without scrolling, rule 14) and Pseudocode. It keeps the last tab picked for the session.
- Which control a choice uses is rule 10; the algorithm picker is rule 11.

## 9. Collapsible sections

- Only explanatory content (How X works, About), never controls. Closed on entry, no nesting, several can be open, opening one doesn't scroll the page.
- Built with `ui/Disclosure`: a heading containing a button with `aria-expanded` and `aria-controls`.

## 10. Choosing a control

- Up to 5 named values: segmented. More than 5 ordered numeric values where approximate is fine: a slider with fixed steps, its value always visible beside it (never under the finger), live effect. An exact value in a small range, picked a step at a time: a stepper. A value the learner types (a number to insert, a word): a text field (rule 12).
- Speed is segmented with 4–5 fixed values; array size is a stepped slider.

## 11. Algorithm picker

- Desktop and iPad landscape: the picker pill in the top bar opens a popover with the algorithms (`PickerPill` in `src/components/TopBar.tsx`). The rest of this rule is phones and tablets.
- `ui/NativeSelect`: a styled closed trigger (`appearance: none`, theme colors, our own icon) over a native `<select>`.
- Modules with 5 or fewer algorithms show all options inline instead: one row of equal segments with their short names, on its own line. If a module's names don't fit that row at 393px in every language, it keeps the `NativeSelect`; never invent shorter names (`namesTooLongForSegments` in the module, measured by `e2e/algorithm-picker.spec.ts`).

## 12. Text fields

- `ui/TextField` wraps a native `<input>`: visible label above, optional hint, error linked with `aria-describedby`, font size at least 16px on touch devices. Never block zoom in the viewport meta.
- Numbers: `type="text"` with `inputmode="numeric"` or `"decimal"`; the component validates.

## 13. Overlays

- Every backdrop behind a modal sheet, drawer or dialog uses the `--color-scrim` token (light: black at 32–40%, dark: black at 50–60%). Non-modal sheets have no backdrop.

## 14. Controls never scroll

- Controls are never inside a scrolling container. At the smallest size of each layout (393×852 phone, 834×1194 iPad portrait, 1194×834 iPad landscape, 1280×800 desktop), every control is visible without scrolling.
- Explanatory content (the pseudocode) may scroll inside its own card; controls may not.
- When the controls don't fit, regroup them (a select instead of a list, fewer words of help); never add a scroll.

## Checked automatically

- **Tap targets (iPhone and iPad e2e projects, `e2e/tap-targets.spec.ts`):** every visible button, link and form control is at least 44×44 px.
  - **How:** grow the hit area, not the look, and only on touch screens (`@media (pointer: coarse)`). Use the `tap-target` utility in `src/index.css`: an invisible `::after` of at least 44×44 centred on the element, which needs a position (`relative`). For a list of links use `tap-rows` on the `<ul>`: each row is at least 44 px tall and its link covers the whole row. Grow the visible size only when there's no other way, such as text inputs, which can't have a `::after` (`pointer-coarse:h-11`).
  - **Exception:** links inside running text, that is inside a `<p>`, are exempt. They can't grow without breaking the line spacing.
- **Settings fit (every e2e project, `e2e/settings-fit.spec.ts`):** on every module page at its layout's smallest size, the settings container (marked `data-settings`) doesn't overflow: `scrollHeight` ≤ `clientHeight`, and it sits inside the screen.
- **Native controls (lint):** native form controls are only allowed inside `src/components/ui/`.
- **Raw colors (lint):** color literals and Tailwind default palette classes are only allowed in the theme.

## Sources

Apple Human Interface Guidelines, Material 3, Nielsen Norman Group, GOV.UK Design System, WAI-ARIA Authoring Practices Guide.
