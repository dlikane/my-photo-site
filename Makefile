.DEFAULT_GOAL := help

# Helper commands
.PHONY: help
help: ## Display this help message
	@echo Available commands:
	@awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: grab-all
grab-all: ## grab full source code
	img grab "./api/..." "./src/..." index.html package.json | clip

.PHONY: grab
grab: ## grab full source code
	img grab "./src/..." index.html | clip




