# CLAUDE.md - Polyglot Development Environment

> **Personal Customization**: For individual development preferences and local configurations, 
> copy `CLAUDE.local.md.template` to `CLAUDE.local.md` and customize as needed.

## Project Overview

Polyglot development environment for Python, TypeScript, Rust, Go, and Nushell with AI-optimized practices using Devbox for isolated, reproducible environments. Nushell serves as the default scripting shell for automation, DevOps workflows, and cross-language orchestration.

**Architecture Principles**: Isolated Environments • Reproducible Builds • Type Safety First • Error-First Design • Test-Driven Development • Intelligence-Driven Development

**Repository**: https://github.com/ricable/polyglot-devenv | **Issues**: GitHub Issues for bug reports and feature requests

**Getting Started**:
```bash
git clone https://github.com/ricable/polyglot-devenv.git && cd polyglot-devenv
curl -fsSL https://get.jetify.com/devbox | bash && brew install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
cd python-env && devbox shell && devbox run install
```

## Quick Reference Hub

### Essential Commands by Environment

| Environment | Enter | Install | Format | Lint | Test | DevPod (Single) | DevPod (Multi) | Context Engineering | Enterprise PRP |
|-------------|-------|---------|--------|------|------|-----------------|----------------|---------------------|----------------|
| **Python** | `cd python-env && devbox shell` | `devbox run install` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-python` | `/devpod-python 3` | `/generate-prp feature.md --env python-env` | `python .claude/commands/generate-prp-v2.py` |
| **TypeScript** | `cd typescript-env && devbox shell` | `devbox run install` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-typescript` | `/devpod-typescript 2` | `/generate-prp feature.md --env typescript-env` | `python .claude/commands/generate-prp-v2.py` |
| **Rust** | `cd rust-env && devbox shell` | `devbox run build` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-rust` | `/devpod-rust 4` | `/generate-prp feature.md --env rust-env` | `python .claude/commands/generate-prp-v2.py` |
| **Go** | `cd go-env && devbox shell` | `devbox run build` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-go` | `/devpod-go 5` | `/generate-prp feature.md --env go-env` | `python .claude/commands/generate-prp-v2.py` |
| **Nushell** | `cd nushell-env && devbox shell` | `devbox run setup` | `devbox run format` | `devbox run check` | `devbox run test` | `devbox run devpod:provision` | *N/A* | `/generate-prp feature.md --env nushell-env` | `python .claude/commands/generate-prp-v2.py` |

### Development Workflow Commands

| Workflow | Native | Containerized | AI-Assisted | Enterprise |
|----------|--------|---------------|-------------|------------|
| **Setup** | `devbox shell` | `/devpod-python [count]` | `/generate-prp features/api.md --env python-env` | `python .claude/commands/generate-prp-v2.py` |
| **Develop** | `devbox run test` | `devbox run devpod:provision` | `cd python-env && devbox run devpod:provision` | `--workers 4 --debug` |
| **Execute** | `devbox run lint` | `devpod list` | `/execute-prp context-engineering/PRPs/api-python.md` | `python .claude/commands/execute-prp-v2.py` |
| **Monitor** | Built-in hooks | `devbox run devpod:status` | `--validate --monitor` | `--timeout 300 --monitor` |

### Core Devbox Commands

```bash
# Environment Management              # Project Management
devbox init                         devbox install              # Install packages from devbox.json
devbox shell                        devbox generate direnv      # Generate .envrc for auto-activation  
devbox add <package>                 devbox clean               # Clean package cache
devbox rm <package>                  devbox update              # Update all packages
devbox run <script>                  # Run defined script
```

### Claude Code Commands & Hooks

```bash
# Hooks Setup                        # DevPod Commands
./.claude/install-hooks.sh          /devpod-python [1-10]       # Provision Python workspaces
./.claude/install-hooks.sh --test   /devpod-typescript [1-10]   # Provision TypeScript workspaces
                                    /devpod-rust [1-10]         # Provision Rust workspaces
# Context Engineering                /devpod-go [1-10]           # Provision Go workspaces
/generate-prp <file> --env <env>    
/execute-prp <prp-file> --validate  # Workspace Management
                                    devpod list                 # List all workspaces
# Cross-Language Validation          devpod stop <name>         # Stop specific workspace
nu nushell-env/scripts/validate-all.nu parallel               devpod delete <name>       # Delete workspace

# Enhanced Hook System (NEW)
# Intelligent automation with 5 advanced hooks:
# ✅ PRP Lifecycle Management - Auto-update status, generate reports
# ✅ Context Engineering Integration - Auto-generate PRPs from features
# ✅ Cross-Language Quality Gates - Enforce standards, detect anti-patterns
# ✅ DevPod Resource Management - Smart container lifecycle (max 15 total)
# ✅ Performance Analytics Integration - Advanced tracking, regression detection
```

## Environment Structure

```
polyglot-project/
├── python-env/          # Python Devbox environment (python, uv, src/, pyproject.toml)
├── typescript-env/      # TypeScript Devbox environment (nodejs, src/, package.json)
├── rust-env/            # Rust Devbox environment (rustc, src/, Cargo.toml)
├── go-env/              # Go Devbox environment (go, cmd/, go.mod)
├── nushell-env/         # Nushell scripting environment (nushell, scripts/, config/, common.nu)
├── devpod-automation/   # DevPod containerized development (scripts/, templates/, config/)
├── context-engineering/ # Context Engineering framework (templates/, PRPs/, lib/, versions/, logs/)
├── .claude/             # Claude Code configuration (commands/, install-hooks.sh, settings.json)
│   ├── commands/        # Slash commands and automation scripts
│   ├── hooks/           # Intelligent hook implementations (NEW)
│   │   ├── prp-lifecycle-manager.py              # PRP status tracking & reports
│   │   ├── context-engineering-integration.py    # Auto-generate PRPs from features
│   │   ├── quality-gates-validator.py            # Cross-language quality enforcement
│   │   ├── devpod-resource-manager.py            # Smart container lifecycle
│   │   └── performance-analytics-integration.py  # Advanced performance tracking
│   └── settings.json    # Hook configuration with 5 advanced automation systems
├── CLAUDE.md            # This file (project standards)
└── CLAUDE.local.md      # Personal configurations (gitignored)
```

## Core Systems

### Intelligence & Automation

**Claude Code Hooks** provide real-time quality assurance with automated triggers:
- **File Edits**: Auto-format + performance tracking
- **Test Files**: Run tests + performance analysis  
- **Config Files**: Dependency scan + drift detection
- **Git Commits**: Pre-commit validation + analytics
- **Failures**: Pattern learning + solution suggestions
- **Completion**: Intelligence reports + GitHub integration

**Enhanced Hook System** (NEW):
- **PRP Lifecycle Management**: Auto-update PRP status, generate execution reports, integrate with context-engineering system
- **Context Engineering Integration**: Auto-generate PRPs from feature files, sync templates, validate consistency
- **Cross-Language Quality Gates**: Enforce polyglot standards, detect anti-patterns, provide optimization suggestions
- **DevPod Resource Management**: Smart container lifecycle, load balancing, automatic cleanup (max 15 total, 5 per env)
- **Performance Analytics Integration**: Advanced build time tracking, regression detection, resource optimization

**Intelligence Systems**: Performance Analytics • Resource Monitoring • Dependency Health • Security Analysis • Environment Drift • Failure Learning • Test Intelligence • GitHub Integration • PRP Automation • Quality Gates • DevPod Optimization

### DevPod Containerized Development

**Quick Setup**: `nu devpod-automation/scripts/docker-setup.nu --install --configure --optimize`

**Parameterized Provisioning** (NEW):
- Single: `/devpod-python` (1 workspace)  
- Multiple: `/devpod-python 3` (3 workspaces for parallel development)
- Naming: `polyglot-{language}-devpod-{YYYYMMDD-HHMMSS}-{N}`
- Features: Auto VS Code • SSH Access • Language Extensions • Complete Isolation • Fast Provisioning

**Management**:
```bash
# Status & Control                   # Advanced Operations
devpod list                         bash devpod-automation/scripts/provision-all.sh status
devpod stop <workspace>             nu devpod-automation/scripts/devpod-manage.nu cleanup --all
devpod delete <workspace>           nu devpod-automation/scripts/docker-setup.nu --status
bash devpod-automation/scripts/provision-all.sh clean-all
```

### Context Engineering Framework

**PRP Workflow**:
1. **Generation** (Native): `/generate-prp features/api.md --env python-env`
2. **Provisioning** (DevPod): `cd python-env && devbox run devpod:provision`  
3. **Execution** (Container): `/execute-prp context-engineering/PRPs/api-python.md --validate`

**Enterprise System** (NEW - 275% faster execution):
```bash
# Enhanced Generation with Version Control
python .claude/commands/generate-prp-v2.py features/user-api.md --env python-env --workers 4 --debug

# Enhanced Execution with Auto-Rollback  
python .claude/commands/execute-prp-v2.py context-engineering/PRPs/user-api-python.md --validate --monitor --timeout 300
```

**Enterprise Features**: Version Control (Memento/Observer patterns) • Scalable Processing (Mediator/Factory patterns) • Auto-Rollback • Performance Monitoring • Execution History • Intelligent Recovery

**Environment-Specific Templates**:
- **Python**: FastAPI + async/await + SQLAlchemy + uv + Pydantic v2 + pytest-asyncio
- **TypeScript**: Strict mode + ES modules + Jest + ESLint/Prettier + Result patterns  
- **Rust**: Async Tokio + ownership patterns + serde + thiserror + cargo testing
- **Go**: Context patterns + small interfaces + explicit errors + table-driven tests
- **Nushell**: Structured data + type hints + cross-environment orchestration + pipelines

## Development Workflows

| Aspect | Native (Devbox) | Containerized (DevPod) | AI-Assisted (Context Engineering) | Enterprise (Version Control) |
|--------|-----------------|------------------------|-----------------------------------|------------------------------|
| **Use Case** | Quick development | Isolated environments | Structured feature development | Production workflows |
| **Setup** | `devbox shell` | `/devpod-python [count]` | `/generate-prp` → `/execute-prp` | `generate-prp-v2.py` → `execute-prp-v2.py` |
| **Benefits** | Fast, direct | Clean isolation, VS Code | Comprehensive context, validation | Version control, auto-rollback |
| **Performance** | Native speed | Docker optimized | Native planning + container execution | 275% faster with concurrency |
| **Scalability** | Single environment | 1-10 parallel workspaces | Cross-environment features | Enterprise-grade reliability |

**Key Benefits**: 🔄 Flexibility • 🔢 Parameterized DevPod • 🛡️ Complete Isolation • 🧠 Comprehensive Context • ⚡ Optimized Performance • 🔗 Seamless Integration • 📊 Real-time Feedback • 🔄 Enterprise Reliability

## Standards & Guidelines

### Style Guidelines
- **Python**: uv exclusively, type hints mandatory, 88 char line length, snake_case, Google docstrings, structured logging
- **TypeScript**: Strict mode, never `any`, prefer `unknown`, camelCase, interfaces over types, Result patterns
- **Rust**: Embrace ownership, avoid clones, `Result<T, E>` + `?` operator, document with examples, async with tokio
- **Go**: Simple explicit code, always check errors with context, small focused interfaces, table-driven tests
- **Nushell**: `def "namespace command"` pattern, parameter defaults + type hints, `$env.VAR`, `do --ignore-errors`, pipeline operators

### Testing & Quality Standards
- **Coverage**: Minimum 80% code coverage
- **Structure**: Arrange-Act-Assert pattern  
- **Dependencies**: Mock external dependencies
- **Frameworks**: pytest (Python), Jest (TypeScript), cargo test (Rust), go test (Go)
- **Validation**: `nu nushell-env/scripts/validate-all.nu parallel` or `devbox run lint && devbox run test`

### Security & Performance
- **Security**: Input validation at boundaries • Environment variables for secrets • Regular dependency scanning • Security linting in pre-commit hooks
- **Performance**: Connection pooling • Structured logging with correlation IDs • Health checks • Performance regression detection via hooks

## Setup & Configuration

### Language Environment Setup
```bash
# Python Environment                 # TypeScript Environment
mkdir python-env && cd python-env   mkdir typescript-env && cd typescript-env
devbox init && devbox add python@3.12 uv ruff mypy pytest    devbox init && devbox add nodejs@20 typescript eslint prettier jest
devbox generate direnv && direnv allow                       devbox generate direnv && direnv allow

# Rust Environment                   # Go Environment  
mkdir rust-env && cd rust-env       mkdir go-env && cd go-env
devbox init && devbox add rustc cargo rust-analyzer clippy rustfmt    devbox init && devbox add go@1.22 golangci-lint goimports
devbox generate direnv && direnv allow                       devbox generate direnv && direnv allow

# Nushell Environment
mkdir nushell-env && cd nushell-env
devbox init && devbox add nushell@0.103.0 teller git && mkdir -p scripts config
devbox generate direnv && direnv allow
```

### Essential Configuration Templates

**Python (pyproject.toml)**:
```toml
[project]
requires-python = ">=3.12"
dependencies = ["fastapi", "pydantic", "httpx"]

[project.optional-dependencies]  
dev = ["ruff>=0.8.0", "mypy>=1.7.0", "pytest>=7.4.0", "pytest-cov"]

[tool.ruff]
line-length = 88
target-version = "py312"
select = ["E", "F", "I", "N", "UP", "B"]

[tool.mypy]
strict = true
```

**TypeScript (tsconfig.json)**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Cross-Language Integration

**Validation Script (Nushell)**:
```nushell
#!/usr/bin/env nu
# scripts/validate-all.nu

def "main validate parallel" [] {
    [
        {name: "python", cmd: "cd python-env && devbox run lint && devbox run test"},
        {name: "typescript", cmd: "cd typescript-env && devbox run lint && devbox run test"},
        {name: "rust", cmd: "cd rust-env && devbox run lint && devbox run test"},
        {name: "go", cmd: "cd go-env && devbox run lint && devbox run test"},
        {name: "nushell", cmd: "cd nushell-env && devbox run check && devbox run test"}
    ] | par-each { |env|
        print $"🚀 Starting ($env.name)..."
        bash -c $env.cmd
        print $"✅ ($env.name) completed"
    }
    
    print "🎉 All parallel validations completed!"
}
```

## Personal Development Environment

This project uses a two-file documentation system:

### File Structure
- **CLAUDE.md** (this file): Project-wide standards, team processes, and shared setup
- **CLAUDE.local.md**: Personal configurations, individual workflows, and local customizations

### Integration Model
| Aspect | CLAUDE.md (Project) | CLAUDE.local.md (Personal) |
|--------|--------------------|-----------------------------|
| **Purpose** | Team standards and shared processes | Individual productivity and preferences |
| **Content** | Essential setup, style guidelines, core commands | Personal aliases, custom tools, learning notes |
| **Precedence** | Team standards take priority | Extends and personalizes project standards |
| **Version Control** | Committed to repository | Gitignored (personal only) |

### Setup Instructions
```bash
# 1. Copy the template to create your personal configuration
cp CLAUDE.local.md.template CLAUDE.local.md

# 2. Customize sections relevant to your workflow
# 3. Keep it updated as your preferences evolve
```

**Benefits**: Consistent Onboarding • Individual Flexibility • Reduced Conflicts • Maintainable Standards

> **Personal Configurations**: Add custom shortcuts and productivity commands to `CLAUDE.local.md`
> **Getting Started**: See `context-engineering/docs/integration-guide.md` for comprehensive usage instructions

## AI-Assisted Development Best Practices

Use descriptive names and clear context for better code generation • Include concrete examples and anti-patterns in documentation • Explicit types and interfaces help AI understand intent • Structure code in logical, predictable patterns

---

*Polyglot development environment with intelligent automation, containerized workflows, and AI-optimized practices*