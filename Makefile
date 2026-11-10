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
.PHONY: e2e e2e-quick e2e-sentences

e2e: ## browser tests on iPhone/iPad/desktop; ARGS= passes extra Playwright flags (CI: ARGS=--project=<device>)
	pnpm exec playwright test $(ARGS)

e2e-quick: ## iPhone + desktop only; SPEC=<file> to run one spec. Run before finishing a task
	pnpm exec playwright test --project=iphone --project=desktop $(SPEC)

e2e-sentences: ## every step sentence fits its caption at every size; slow, so make e2e skips it (CI runs it)
	STEP_SENTENCES=1 pnpm exec playwright test e2e/step-sentences-fit.spec.ts

# ---- README media ----
.PHONY: readme-media
READMEPORT ?= $(or $(PORT),4173)

readme-media: ## records docs/readme/*.gif and the hero video from a production build; needs ffmpeg
	pnpm build
	pnpm exec vite preview --port $(READMEPORT) --strictPort > /dev/null & server=$$!; \
	trap "kill $$server" EXIT; \
	until curl -sf http://localhost:$(READMEPORT) > /dev/null; do sleep 0.5; done; \
	PORT=$(READMEPORT) node scripts/readme-media.mjs
