# Command contract. Claude Code hooks and CI call ONLY these targets.
# The stack lives inside the recipes: if the stack changes, edit this file and nothing else.
# Recipes must use a tab, not spaces.

.PHONY: check test ci

check: ## typecheck + lint
	pnpm exec tsc -b
	pnpm lint

test: ## unit tests
	pnpm test

ci: check test ## everything CI runs

# ---- web module (appended by /project-kit) ----
# Keep this tag equal to the installed @playwright/test version (pnpm exec playwright --version).
PLAYWRIGHT_IMAGE := mcr.microsoft.com/playwright:v1.64.1-noble

.PHONY: e2e e2e-visual baselines

e2e: ## browser tests on iPhone/iPad/desktop, no screenshot comparison (local, fast)
	pnpm exec playwright test --ignore-snapshots

e2e-visual: ## full run including screenshot comparison (CI, Linux only)
	pnpm exec playwright test

baselines: ## regenerate screenshot baselines inside Linux. Needs Docker. Human only.
	docker run --rm --ipc=host -v "$(CURDIR)":/work -v /work/node_modules -w /work $(PLAYWRIGHT_IMAGE) \
		sh -c "corepack enable && pnpm install --frozen-lockfile && pnpm exec playwright test --update-snapshots"
