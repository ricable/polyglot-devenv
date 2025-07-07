# CLAUDE.md - Polyglot Development Environment

**AI-optimized polyglot environment** for Python, TypeScript, Rust, Go, and Nushell with Devbox isolation, DevPod containerization, and intelligent automation.

**Principles**: Isolated Environments • Type Safety First • Test-Driven Development • Intelligence-Driven Development  
**Repository**: https://github.com/ricable/polyglot-devenv | **Issues**: GitHub Issues  
**Personal Config**: Copy `CLAUDE.local.md.template` to `CLAUDE.local.md` for individual customizations

**Quick Setup**:
```bash
git clone https://github.com/ricable/polyglot-devenv.git && cd polyglot-devenv
curl -fsSL https://get.jetify.com/devbox | bash && brew install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc && cd dev-env/python && devbox shell && devbox run install
```

## Quick Reference Hub

### Essential Commands by Environment

| Environment | Enter | Install | Format | Lint | Test | DevPod (Single) | DevPod (Multi) | Context Engineering | Enterprise PRP |
|-------------|-------|---------|--------|------|------|-----------------|----------------|---------------------|----------------|
| **Python** | `cd dev-env/python && devbox shell` | `devbox run install` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-python` | `/devpod-python 3` | `/generate-prp features/api.md --env python-env` | `/generate-prp features/api.md --env python-env` |
| **TypeScript** | `cd dev-env/typescript && devbox shell` | `devbox run install` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-typescript` | `/devpod-typescript 2` | `/generate-prp features/ui.md --env typescript-env` | `/generate-prp features/ui.md --env typescript-env` |
| **Rust** | `cd dev-env/rust && devbox shell` | `devbox run build` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-rust` | `/devpod-rust 4` | `/generate-prp features/service.md --env rust-env` | `/generate-prp features/service.md --env rust-env` |
| **Go** | `cd dev-env/go && devbox shell` | `devbox run build` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-go` | `/devpod-go 5` | `/generate-prp features/cli.md --env go-env` | `/generate-prp features/cli.md --env go-env` |
| **Nushell** | `cd dev-env/nushell && devbox shell` | `devbox run setup` | `devbox run format` | `devbox run check` | `devbox run test` | `devbox run devpod:provision` | *N/A* | `/generate-prp features/script.md --env nushell-env` | `/generate-prp features/script.md --env nushell-env` |

### Core Commands

**Devbox**: `devbox init|shell|add|rm|run|install|clean|update` • `devbox generate direnv` (auto-activation)  
**DevPod**: `/devpod-python [1-10]` • `/devpod-typescript [1-10]` • `/devpod-rust [1-10]` • `/devpod-go [1-10]`  
**Validation**: `nu scripts/validate-all.nu [quick|dependencies|structure|--parallel]`  
**Automation**: `/polyglot-check|clean|commit|docs|tdd|todo` • `/analyze-performance`

### Advanced Features ✅

**Hook Setup**: `./.claude/install-hooks.sh [--test|--user]`  
**MCP Server**: `npm run build|start|watch` • `mcp tool environment_detect|devpod_provision|polyglot_validate`  
**Context Engineering**: `/generate-prp features/api.md --env dev-env/python` → `/execute-prp`  
**Enhanced**: `/generate-prp features/api.md --env python-env --include-dojo --verbose` (dynamic templates, dojo integration)

**Active Automation** (Production Ready):
- **Auto-Format**: File edits trigger environment-aware formatting (ruff, prettier, rustfmt, goimports, nu)
- **Auto-Test**: Test files trigger framework-specific testing (pytest, jest, cargo test, go test, nu test)  
- **Security**: Pre-commit secret scanning for .env/.config/.json/.yaml files
- **DevPod**: Smart container lifecycle (max 15 total, 5 per environment)
- **Validation**: Cross-environment health checks on task completion
- **Intelligence**: Performance analytics, resource monitoring, failure pattern learning

## Environment Structure

```
polyglot-project/
├── host-tooling/        # HOST MACHINE SCRIPTS (NEW ✅ - Clear Host/Container Separation)
│   ├── installation/    # Host dependency installation (Docker, DevPod, system tools)
│   ├── devpod-management/ # Container lifecycle management from host
│   ├── monitoring/      # Infrastructure access (K8s, GitHub, requires host credentials)
│   └── shell-integration/ # Host shell aliases and environment setup
├── dev-env/             # CONTAINER-ONLY development environments
│   ├── python/          # Python Devbox environment (python, uv, src/, pyproject.toml)
│   ├── typescript/      # TypeScript Devbox environment (nodejs, src/, package.json)
│   ├── rust/            # Rust Devbox environment (rustc, src/, Cargo.toml)
│   ├── go/              # Go Devbox environment (go, cmd/, go.mod)
│   └── nushell/         # Nushell container scripting (container automation, code processing)
├── scripts/             # Cross-language validation and automation scripts
│   ├── validate-all.nu  # Comprehensive validation script with parallel execution
│   └── sync-configs.nu  # Configuration synchronization across environments
├── devpod-automation/   # DevPod containerized development (templates/, config/)
├── context-engineering/ # Context Engineering framework (REORGANIZED ✅)
│   ├── workspace/        # Local development & PRP generation
│   │   ├── features/     # Feature definitions (input)
│   │   ├── templates/    # PRP templates by environment
│   │   ├── generators/   # PRP generation tools
│   │   └── docs/        # Workspace usage documentation
│   ├── devpod/          # Containerized execution environment
│   │   ├── environments/ # Environment-specific configs (python/, typescript/, rust/, go/, nushell/)
│   │   ├── execution/   # Execution engines & reports
│   │   ├── monitoring/  # Performance & security tracking
│   │   └── configs/     # DevPod-specific configurations
│   ├── shared/          # Resources used by both workspace & devpod
│   │   ├── examples/    # Reference examples (including dojo/)
│   │   ├── utils/      # Common utilities (Nushell tools)
│   │   ├── schemas/    # Validation schemas
│   │   └── docs/       # Shared documentation
│   └── archive/         # Historical PRPs and reports
├── mcp/                 # Model Context Protocol server (PRODUCTION ✅)
│   ├── polyglot-server.ts        # Dynamic polyglot MCP server with environment detection
│   ├── polyglot-utils.ts         # Shared utilities and DevPod integration
│   ├── polyglot-types.ts         # TypeScript types and Zod validation schemas
│   ├── index.ts                  # Main MCP server entry point with JSON-RPC 2.0
│   ├── README.md                 # Comprehensive MCP documentation
│   ├── polyglot-instructions.md  # Detailed tool and feature documentation
│   ├── package.json              # MCP server dependencies and scripts
│   └── dist/                     # Compiled TypeScript output
├── .claude/             # Claude Code configuration (commands/, install-hooks.sh, settings.json)
│   ├── commands/        # Slash commands and automation scripts
│   │   ├── devpod-python.md        # Multi-workspace Python provisioning
│   │   ├── devpod-typescript.md    # Multi-workspace TypeScript provisioning
│   │   ├── devpod-rust.md          # Multi-workspace Rust provisioning
│   │   ├── devpod-go.md            # Multi-workspace Go provisioning
│   │   ├── polyglot-check.md       # Cross-environment health validation
│   │   ├── polyglot-clean.md       # Environment cleanup automation
│   │   ├── polyglot-commit.md      # Intelligent commit workflow
│   │   ├── execute-prp-v2.py       # Enhanced PRP execution system
│   │   └── generate-prp.md          # Enhanced PRP generation with dynamic templates
│   ├── hooks/           # Intelligent hook implementations (ACTIVE ✅)
│   │   ├── prp-lifecycle-manager.py              # PRP status tracking & reports
│   │   ├── context-engineering-integration.py    # Auto-generate PRPs from features
│   │   ├── quality-gates-validator.py            # Cross-language quality enforcement
│   │   ├── devpod-resource-manager.py            # Smart container lifecycle
│   │   └── performance-analytics-integration.py  # Advanced performance tracking
│   └── settings.json    # Hook configuration with 6 hook types active
├── .mcp.json            # MCP server configuration for Claude Code integration
├── CLAUDE.md            # This file (project standards)
└── CLAUDE.local.md      # Personal configurations (gitignored)
```

## Host/Container Separation Architecture ✅

**SOLUTION**: Clear boundary between host machine responsibilities and containerized development work.

### Host Tooling (`host-tooling/`)
**Purpose**: Scripts and configurations that run on the developer's local machine (host), NOT inside DevPod containers.

**Host Responsibilities**:
- **Installation**: Docker, DevPod, system dependencies (`host-tooling/installation/`)
- **Container Management**: Creating, starting, stopping containers (`host-tooling/devpod-management/`)
- **Infrastructure Access**: Kubernetes, GitHub, external APIs (`host-tooling/monitoring/`)
- **Credential Management**: Host-stored secrets, SSH keys, API tokens
- **Shell Integration**: Host aliases, environment setup (`host-tooling/shell-integration/`)

**Security Benefits**:
- Credential isolation (host credentials never enter containers)
- Dependency isolation (container tools don't pollute host)
- Infrastructure access control (limited to host environment)
- Clean separation of concerns

### Container Environments (`dev-env/`)
**Purpose**: Isolated development environments that run INSIDE DevPod containers.

**Container Responsibilities**:
- **Language Runtimes**: Python, Node.js, Rust, Go, Nushell interpreters
- **Development Tools**: Linters, formatters, test runners, debuggers
- **Code Processing**: Source analysis, building, testing, formatting
- **Package Management**: pip/uv, npm, cargo, go mod
- **Application Logic**: Actual development work and code execution

**Isolation Benefits**:
- Version consistency (exact tool versions in devbox.json)
- Reproducible environments across developers
- Security (code processing isolated from host system)
- Complete cleanup (container removal cleans environment)

### Usage Patterns

**Host Commands** (run on local machine):
```bash
# Source host shell integration
source host-tooling/shell-integration/aliases.sh

# Install and configure Docker/DevPod
nu host-tooling/installation/docker-setup.nu --install --configure

# Provision development containers
devpod-provision-python    # Create Python container
devpod-provision-typescript # Create TypeScript container

# Access infrastructure (requires host credentials)
k8s-status                 # Check Kubernetes cluster
github-status              # Check GitHub integration
```

**Container Commands** (run inside containers):
```bash
# Enter container environments
enter-python               # SSH into Python container
enter-typescript           # SSH into TypeScript container

# Inside containers - development work
devbox run format          # Format code with container tools
devbox run test           # Run tests with container frameworks
devbox run lint           # Lint with container linters
```

## Single Source of Truth Configuration ✅

**SOLUTION**: Eliminated configuration duplication across dev-env/, devpod-automation/templates/, and context-engineering/.

### Problem Solved
- **Before**: Environment configurations duplicated in 3+ locations, causing drift risk
- **After**: Single canonical source generates all configuration files automatically
- **Benefit**: Zero configuration drift, reduced maintenance, guaranteed consistency

### Architecture
**Canonical Definitions**: `context-engineering/devpod/environments/`
- **Source**: Single authoritative environment definitions
- **Targets**: Generated `dev-env/*/devbox.json` and `devpod-automation/templates/*/devcontainer.json`
- **Principle**: Edit once, deploy everywhere

**Configuration Generator**:
```bash
# Generate all environment configurations from canonical source
nu context-engineering/devpod/environments/refactor-configs.nu

# Test generation without writing files  
nu context-engineering/devpod/environments/test-generation.nu
```

### Usage Guidelines
- ✅ **DO**: Edit canonical definitions in `context-engineering/devpod/environments/`
- ❌ **DON'T**: Edit generated files (`dev-env/*/devbox.json`, `devpod-automation/templates/*/devcontainer.json`)
- 🔄 **WORKFLOW**: Modify canonical → Generate configs → Use in development

### Benefits Achieved
- **Zero Drift**: Configuration inconsistencies impossible
- **DRY Principle**: No duplication of environment definitions  
- **Maintenance**: Single location for all environment changes
- **Consistency**: Identical environments across all developers
- **Scalability**: Easy addition of new output formats or environments

## Core Systems

### MCP Integration (Production ✅)
**JSON-RPC 2.0 server** with 40+ tools, 100+ resources, environment detection, progress tracking, auto-completion  
**Categories**: Environment, DevBox, DevPod (1-10 workspaces), Cross-Language, Performance, Security, Hooks, PRP  
**Resources**: `polyglot://[documentation|config|examples|scripts]/*`

### DevPod Containerized Development ✅  
**Setup**: `nu devpod-automation/scripts/docker-setup.nu --install`  
**Provision**: `/devpod-python [1-10]` (tested: 8 workspaces, ~2min, 100% success)  
**Features**: Auto VS Code, SSH access, language extensions, complete isolation  
**Management**: `devpod list|stop|delete` • `bash devpod-automation/scripts/provision-all.sh clean-all`

### Context Engineering Framework
**Architecture**: Workspace (local PRP generation) • DevPod (containerized execution) • Shared (utilities) • Archive (history)  
**Workflow**: Generate → Provision → Execute  
**Enhanced**: `/generate-prp features/api.md --env python-env --include-dojo` • Dynamic templates • Dojo integration  
**Templates**: Environment-specific patterns (FastAPI, strict TS, async Rust, Go interfaces, Nu pipelines)

## Workflows & Standards

### Development Approaches
**Native**: `devbox shell` (fast, direct)  
**Containerized**: `/devpod-python [1-10]` (isolation, VS Code, parallel workspaces)  
**AI-Assisted**: `/generate-prp` → `/execute-prp` (comprehensive context, validation)  
**Enhanced**: `/generate-prp` with dynamic templates, dojo integration, and smart analysis

### Style Standards
**Python**: uv, type hints, 88 chars, snake_case, Google docstrings  
**TypeScript**: Strict mode, no `any`, camelCase, interfaces > types  
**Rust**: Ownership patterns, `Result<T,E>` + `?`, async tokio  
**Go**: Simple code, explicit errors, small interfaces, table tests  
**Nushell**: `def "namespace command"`, type hints, `$env.VAR`, pipelines

### Quality Gates ✅
**Coverage**: 80% minimum • **Testing**: pytest, Jest, cargo test, go test • **Auto-Testing**: Hooks run tests on file changes  
**Security**: Input validation, env vars for secrets, pre-commit scanning • **Performance**: Structured logging, health checks

## Testing & Verification Summary ✅

### Production-Ready Features (Fully Tested)
**DevPod Multi-Environment**: 8 workspaces (2 per language) • ~2min provisioning • 100% success rate • VS Code integration  
**Hook Automation**: Auto-format (ruff, prettier, rustfmt, goimports, nu) • Auto-test (pytest, jest, cargo, go, nu) • Secret scanning  
**Environment Detection**: File-based (.py→Python, .ts→TypeScript, .rs→Rust, .go→Go, .nu→Nushell) • Path-based (dev-env/*/) • Tool selection  
**Cross-Language Validation**: All modes (quick, dependencies, structure, parallel) • All 5 environments validated • Performance optimized  
**Script Ecosystem**: 25 Nushell scripts fixed for v0.105.1 • Critical automation working • Cross-environment orchestration  
**MCP Server**: JSON-RPC 2.0 compliance • 22 tools across 8 categories • 100+ resources • Real-time progress tracking

### Performance Benchmarks
**Environment Detection**: ~200ms • **DevBox Start**: ~4s • **DevPod Provisioning**: ~5s/workspace  
**Cross-Language Validation**: 18.9s parallel • **Test Execution**: 1.1s (Python) • **Enterprise PRP**: 275% faster


## Setup & Configuration

### Environment Setup (One-line per language)
```bash
# Python: mkdir -p dev-env/python && cd dev-env/python && devbox init && devbox add python@3.12 uv ruff mypy pytest && devbox generate direnv && direnv allow
# TypeScript: mkdir -p dev-env/typescript && cd dev-env/typescript && devbox init && devbox add nodejs@20 typescript eslint prettier jest && devbox generate direnv && direnv allow  
# Rust: mkdir -p dev-env/rust && cd dev-env/rust && devbox init && devbox add rustc cargo rust-analyzer clippy rustfmt && devbox generate direnv && direnv allow
# Go: mkdir -p dev-env/go && cd dev-env/go && devbox init && devbox add go@1.22 golangci-lint goimports && devbox generate direnv && direnv allow
# Nushell: mkdir -p dev-env/nushell && cd dev-env/nushell && devbox init && devbox add nushell@0.105.1 teller git && mkdir -p scripts config && devbox generate direnv && direnv allow
```

### Key Configuration Files
**Python**: `pyproject.toml` (requires-python=">=3.12", ruff line-length=88, mypy strict=true)  
**TypeScript**: `tsconfig.json` (target="ES2022", strict=true, noImplicitAny=true)  
**Validation**: `scripts/validate-all.nu` (parallel execution across all environments)

## Personal Configuration System

**Two-file approach**: CLAUDE.md (project standards) + CLAUDE.local.md (personal customizations)  
**Setup**: `cp CLAUDE.local.md.template CLAUDE.local.md` → customize for individual productivity  
**Benefits**: Consistent onboarding, individual flexibility, reduced conflicts, maintainable standards

## AI Development Best Practices

Use descriptive names and clear context • Include concrete examples and anti-patterns • Explicit types and interfaces • Structure code in logical, predictable patterns

---

*Polyglot development environment with **fully tested** intelligent automation, containerized workflows, MCP integration, and AI-optimized practices*