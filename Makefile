# Makefile for the Polyglot Development Environment

# Variables
NU = nu
BASH = bash

# Default target
.PHONY: help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  setup         - Set up the development environment"
	@echo "  validate      - Validate the environment"
	@echo "  generate-env  - Generate the devcontainer.json for a language"
	@echo "  provision     - Provision a new devpod workspace for a language"
	@echo "  test          - Run tests for a specific language"
	@echo "  clean         - Clean up generated files"
	@echo ""
	@echo "Examples:"
	@echo "  make generate-env lang=python"
	@echo "  make provision lang=go"
	@echo "  make test lang=rust"

.PHONY: setup
setup:
	@echo "Setting up the development environment..."
	@$(NU) -c "source nushell-env/common.nu; setup"

.PHONY: validate
validate:
	@echo "Validating the environment..."
	@$(BASH) scripts/validate-all.sh

.PHONY: generate-env
generate-env:
	@echo "Generating devcontainer.json for $(lang)..."
	@$(BASH) devpod-automation/generate-devcontainer.sh $(lang)

.PHONY: provision
provision:
	@echo "Provisioning new devpod workspace for $(lang)..."
	@$(BASH) devpod-automation/provision.sh $(lang)

.PHONY: test
test:
	@echo "Running tests for $(lang)..."
	@$(NU) -c "use nushell-env/scripts/test.nu; test-lang $(lang)"

.PHONY: sync-configs
sync-configs:
	@echo "Syncing configs..."
	@$(NU) scripts/sync-configs.nu

.PHONY: clean
clean:
	@echo "Cleaning up generated files..."
	@rm -f *-env/.devcontainer.json