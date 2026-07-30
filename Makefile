.DEFAULT_GOAL := help

# Helper commands
.PHONY: help
help: ## Display this help message
	@echo Available commands:
	@awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Detect OS and set the correct clipboard command
ifeq ($(OS),Windows_NT)
  CLIP_COMMAND = clip
else
  ifeq ($(shell uname), Darwin)
    CLIP_COMMAND = pbcopy
  else
    CLIP_COMMAND = cat
  endif
endif

.PHONY: grab-api
grab-api: ## grab full source code
	img grab "./api/..." package.json | $(CLIP_COMMAND)

.PHONY: grab-src
grab-ui: ## grab full source code
	img grab "./src/..." package.json index.html postcss.config.js tailwind.config.ts vercel.json vite.config.ts | $(CLIP_COMMAND)

code: ## run with make code code=1234
	@node tools/hash-code.js $(code)

# collage-studio backend (Python/FastAPI, local-only -- the frontend is part
# of this site's own React app under /collage-studio; only this backend
# process needs to run separately, on your own machine, alongside `pnpm dev`)
COLLAGE_BACKEND := collage-studio-backend
COLLAGE_VENV := $(COLLAGE_BACKEND)/.venv
COLLAGE_RUN_DIR := $(COLLAGE_BACKEND)/.run
COLLAGE_BACKEND_PORT := 8756

.PHONY: collage-install
collage-install: ## Install collage-studio backend deps (venv)
	@echo "Setting up collage-studio backend venv..."
	@test -d "$(COLLAGE_VENV)" || python -m venv "$(COLLAGE_VENV)"
	"$(COLLAGE_VENV)/Scripts/python.exe" -m pip install -q -r $(COLLAGE_BACKEND)/requirements.txt

.PHONY: collage-start
collage-start: ## Start collage-studio backend on http://127.0.0.1:8756 (run `pnpm dev` separately for the frontend)
	@mkdir -p $(COLLAGE_RUN_DIR)
	@echo "Starting collage-studio backend on http://127.0.0.1:$(COLLAGE_BACKEND_PORT) ..."
	@cd $(COLLAGE_BACKEND) && ( "$$(pwd)/.venv/Scripts/python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port $(COLLAGE_BACKEND_PORT) > .run/backend.log 2>&1 & echo $$! > .run/backend.pid )
	@echo "collage-studio backend running (pid $$(cat $(COLLAGE_RUN_DIR)/backend.pid)). Visit http://localhost:5173/collage-studio"

.PHONY: collage-stop
collage-stop: ## Stop the collage-studio backend
	@if [ -f $(COLLAGE_RUN_DIR)/backend.pid ]; then kill $$(cat $(COLLAGE_RUN_DIR)/backend.pid) 2>/dev/null || true; rm -f $(COLLAGE_RUN_DIR)/backend.pid; fi
	@echo "collage-studio backend stopped."

