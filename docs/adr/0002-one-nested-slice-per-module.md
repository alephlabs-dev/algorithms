# One nested slice per module, written only by the shared store

Every module's state used to live flat in `src/store.ts`, about 60 prefixed fields (`path*`, `graph*`, `dp*`…), with each module wired in about 8 places and race runs cleared from hand-written lists that didn't match (#126). Now each module declares one slice in `src/modules/<id>.slice.ts`: its state, its actions, how to build its runs for a view, its new input, how to hydrate from its part of the link, an input that fits a changed screen (`fit`), its tour key and its engine (last index, step weight, pace, route, search, guess-mode questions). The store holds one nested object per module under its `ModuleId` (`s.pathfinding.grid`) and derives its type from the registry, so adding a module is one entry.

Slice actions are pure functions `(slice, ctx) => Partial<slice> | null` that read the shared context (view, screen shape, speed, module start) but never write it. Only the shared store writes, wrapping each action in `replaceRun`, so every action starts playback over; the two exceptions are declared by the slice, not left to callers: `settings` change tools without replacing the run (the pathfinding brush), and `playFrom` names actions that start playback themselves (one more structure operation plays just that operation). Entering a module or changing the view is a shared action written once: the active slice builds its race runs and every other slice drops them. Components call actions through `s.actions.<module>.<action>`, so slice state stays plain data. The store is built by `createAppStore({ url, isMobile, isPortrait, theme })`, so the one place that reads `window` and `localStorage` is the call that creates `useStore`, and slices and the switching rule are tested without a browser.

## Considered options

- **Zustand's flat slice pattern** (`...createPathSlice(set, get)`): field names and the 54 consumers would barely change, but the prefixed fields would stay, clearing race runs would still need lists of fields, and every slice could still write the others' state through `set`.
- **One Zustand store per module**: more isolated, but `replaceRun` (frame index, open guess question and run together) would have to keep two stores in step on every change.

## Consequences

- Components select single fields (`s.pathfinding.grid`), not a whole slice: a slice gets a new identity on every patch.
- An inactive module keeps its settings and its single run and drops its race runs, as before. Building inactive runs lazily is #130.
- The link codec (#128) only changes where `hydrate` gets its part of the link; the slice shape doesn't change.
