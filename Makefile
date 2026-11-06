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
.PHONY: e2e

e2e: ## browser tests on iPhone/iPad/desktop (CI runs this too)
	pnpm exec playwright test
