# Contributing

Ideas, bug reports and pull requests are welcome. Open an issue first for anything bigger than a small fix, so we can agree on the shape before you write code.

## Setup

Needs Node 24+ and pnpm 11.

```bash
git clone https://github.com/alephlabs-dev/algorithms.git && cd algorithms
pnpm install
pnpm dev   # http://localhost:5173
```

## Commands

CI and the agent hooks call only these `make` targets.

| Command | What it does |
| --- | --- |
| `make check` | Typecheck and lint |
| `make test` | Unit tests (Vitest) |
| `make ci` | Everything CI runs |
| `make e2e-quick` | Browser tests on iPhone and desktop. `SPEC=e2e/<file>.spec.ts make e2e-quick` runs one spec |
| `make e2e` | Browser tests on iPhone, iPad (portrait and landscape) and desktop |
| `make e2e-sentences` | Checks that every step sentence fits its caption at all four sizes (slow) |
| `make readme-media` | Records the README's GIFs and hero video (see below) |

Browser tests serve a production build on port 4173; `PORT=<n>` picks another.

## How it works

Each algorithm is a generator that yields the steps it takes (compare, swap, visit a cell, place a queen…) plus the pseudocode line, without touching React or timers. A timeline runs it once and records every frame, with a full snapshot every so often, so any frame can be rebuilt quickly. The UI just picks a frame: pausing, stepping, seeking and racing are all index changes.

The app is split into **modules** (sorting, pathfinding, graphs…). A module is a manifest, a state slice, an interface and its prerendered content, and the shared UI never asks which module is on stage. [`src/modules/README.md`](src/modules/README.md) explains the pieces and how to add a module. Stages draw on a canvas, and the animation loop only runs while something moves.

The words we use for things (a *run*, a *racer*, an *input*, a *key moment*) are in [`GLOSSARY.md`](GLOSSARY.md), and the decisions behind the design are in [`docs/adr/`](docs/adr). UI work follows [`UX.md`](UX.md); code follows [`CODING_STANDARDS.md`](CODING_STANDARDS.md).

## Workflow

- One branch per issue, named `<issue-number>-<short-slug>`. Changes reach `main` through a pull request.
- Never skip, weaken or delete a test to make it pass.
- A new screen or flow gets a browser test in `e2e/`.
- Run `make check`, `make test` and `make e2e-quick` before opening a pull request.

Much of the work here is done by AI agents following [`CLAUDE.md`](CLAUDE.md); the same rules apply to people.

## README media

The README's clips are recorded from fixed links, so they show the same run every time. After a UI change:

1. `make readme-media` (needs ffmpeg). It builds the app, records each module, and writes `docs/readme/<module>.gif` and `docs/readme/hero.mp4`.
2. Commit the GIFs.
3. The hero video isn't committed: GitHub only plays videos uploaded as attachments. Drag `docs/readme/hero.mp4` into a GitHub comment or PR description, copy the `https://github.com/user-attachments/assets/…` link it produces, and put that link on its own line where the README's hero goes (in both `README.md` and `README.es.md`).

Adding a module to the README means adding one entry to `CLIPS` in [`scripts/readme-media.mjs`](scripts/readme-media.mjs) and a tile in both READMEs.
