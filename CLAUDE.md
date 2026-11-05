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
- `make e2e`: browser tests on iPhone, iPad (portrait and landscape) and desktop, without screenshot comparison.

## Rules

- One branch per issue: `<issue-number>-<short-slug>`. Never commit or push to `main`; changes reach `main` through a PR.
- Found a bug or idea outside the current task: search open issues first (`gh issue list --search "<keywords>"`). If it's new, file it with `gh issue create --label needs-triage --label bug` (or `enhancement`) and a 3-line body (what, where, how to reproduce). Mention the number in your final report and keep going. Don't fix it now.
- Never skip, weaken or delete a test to make it pass. If a test looks wrong, stop and ask.
- Finish by reporting the commands you ran and their result.
- UI changes: before saying done, open the affected route at 393x852 (iPhone), 834x1194 (iPad) and 1280x800 (desktop) with the browser tool, check the console, and report what you saw at each size. No screenshots, no "done".
- Never run `--update-snapshots` or `make baselines`. If a visual change is intended, say so in the PR and I regenerate the baselines.
- New screen or flow: add one test for it in `e2e/` (it runs on all four device projects).

## Agent skills

### Issue tracker

GitHub Issues on `alephlabs-dev/algorithms`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary, each label equal to its role: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.
