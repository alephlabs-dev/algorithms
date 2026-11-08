# Sorting Algorithms Visualizer

Interactive visualizer for sorting algorithms (and more): watch them run step by step to learn how they work.

## Stack

- Language: TypeScript, React 19, Zustand for state
- Build: Vite 8 with a custom prerender plugin (`vite-plugin-prerender.ts`), Tailwind CSS 4
- Package manager: pnpm 11, Node >= 24
- Tests: Vitest (unit), Playwright + axe (e2e); lint with ESLint
- Hosting: Vercel

## Commands

Hooks and CI only call these Makefile targets. When the stack changes, change the Makefile, nothing else.

- `make check`: typecheck + lint
- `make test`: unit tests
- `make ci`: everything CI runs
- `make e2e-quick`: browser tests on iPhone and desktop only. `SPEC=e2e/<file>.spec.ts make e2e-quick` runs one spec.
- `make e2e`: browser tests on iPhone, iPad (portrait and landscape) and desktop, without screenshot comparison. CI runs it split by device.
- `make e2e-sentences`: the slow check that every step sentence fits its caption at all four sizes (~2 min). `make e2e` skips it; CI runs it on every PR. Run it when you change a step sentence or the caption row.
- `PORT=<n> make e2e`: the same on another port, so runs in parallel worktrees don't test each other's builds (default 4173; 5173 is the human's dev server, never use it).
  Avoid port 4190: browsers block it and WebKit page loads hang. If the port is busy ("port in use"), kill the stale process on it (`lsof -ti :<port> | xargs kill`) instead of switching ports.

## Rules

- One branch per issue: `<issue-number>-<short-slug>`. Never commit or push to `main`; changes reach `main` through a PR.
- Found a bug or idea outside the current task: search open issues first (`gh issue list --search "<keywords>"`). If it's new, file it with `gh issue create --label needs-triage --label bug` (or `enhancement`) and a 3-line body (what, where, how to reproduce). Mention the number in your final report and keep going. Don't fix it now.
- Never skip, weaken or delete a test to make it pass. If a test looks wrong, stop and ask.
- Before finishing a task, run `make e2e-quick`. Run the full `make e2e` only when CI fails or the human asks. After small review fixes, rerun only the affected specs (`SPEC=... make e2e-quick`).
- Finish by reporting the commands you ran and their result.
- Before UI work, read UX.md. Before saying a UI change is done, run the /ux-review steps on the touched routes.
- New screen or flow: add one test for it in `e2e/` (it runs on all four device projects).

## Agent skills

### Issue tracker

GitHub Issues on `alephlabs-dev/algorithms`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary, each label equal to its role: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.
