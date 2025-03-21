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

.PHONY: grab-all
grab-all: ## grab full source code
	img grab "./api/..." "./src/..." index.html package.json | $(CLIP_COMMAND)

.PHONY: grab-all
grab-tailwind: ## grab full source code
	img grab postcss.config.js tailwind.config.ts vite.config.ts index.html package.json src/styles/index.css src/App.jsx src/main.jsx | $(CLIP_COMMAND)

.PHONY: grab
grab: ## grab full source code
	img grab "./src/..." index.html | $(CLIP_COMMAND)



