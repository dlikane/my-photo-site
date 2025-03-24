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
grab-src: ## grab full source code
	img grab "./src/..." package.json index.html postcss.config.js tailwind.config.ts vercel.json vite.config.ts | $(CLIP_COMMAND)



