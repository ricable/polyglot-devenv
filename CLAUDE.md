# CLAUDE.md - Polyglot Development Environment

> **Personal Customization**: For individual development preferences and local configurations, 
> copy `CLAUDE.local.md.template` to `CLAUDE.local.md` and customize as needed.

## Project Overview

Polyglot development environment for Python, TypeScript, Rust, Go, and Nushell with AI-optimized practices using Devbox for isolated, reproducible environments. Nushell serves as the default scripting shell for automation, DevOps workflows, and cross-language orchestration.

### Architecture Principles
1. **Isolated Environments** - Each language has its own Devbox environment
2. **Reproducible Builds** - devbox.json and devbox.lock ensure consistency
3. **Type Safety First** - Strict typing across all languages
4. **Error-First Design** - Explicit error handling with context
5. **Test-Driven Development** - Comprehensive coverage requirements
6. **Intelligence-Driven Development** - Automated quality gates and learning systems

## Repository & Collaboration

### Getting Started
```bash
# Clone and setup
git clone https://github.com/ricable/polyglot-devenv.git
cd polyglot-devenv

# Install prerequisites
curl -fsSL https://get.jetify.com/devbox | bash
brew install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc

# Set up any environment
cd python-env && devbox shell
devbox run install
```

### Collaboration Workflow
```bash
# Standard Git workflow
git checkout -b feature/your-feature-name
# Make changes, test, and commit
devbox run test  # In any environment
git add .
git commit -m "Add your feature"
git push origin feature/your-feature-name
# Create PR on GitHub
```

### Repository Structure
- **Public Repository**: https://github.com/ricable/polyglot-devenv
- **Issues & Discussions**: Use GitHub Issues for bug reports and feature requests
- **Contributing**: See individual environment READMEs for language-specific guidelines

## Environment Structure

```
polyglot-project/
├── python-env/          # Python Devbox environment
│   ├── devbox.json     # Python packages (python, uv)
│   ├── src/            # Python source (src layout)
│   └── pyproject.toml  # Dependencies
├── typescript-env/     # TypeScript Devbox environment
│   ├── devbox.json     # Node.js packages
│   ├── src/            # TypeScript source
│   └── package.json    # Dependencies
├── rust-env/           # Rust Devbox environment
│   ├── devbox.json     # Rust toolchain
│   ├── src/            # Rust source
│   └── Cargo.toml      # Dependencies
├── go-env/             # Go Devbox environment
│   ├── devbox.json     # Go toolchain
│   ├── cmd/            # Application entry points
│   └── go.mod          # Module definition
├── nushell-env/        # Nushell scripting environment
│   ├── devbox.json     # Nushell and automation tools
│   ├── scripts/        # Nushell automation scripts
│   ├── config/         # Configuration files (.env, secrets)
│   └── common.nu       # Shared utilities and functions
├── .claude/            # Claude Code configuration
│   ├── commands/       # Custom slash commands
│   ├── install-hooks.sh           # Hooks installation script
│   └── settings.json              # Project-specific settings
├── CLAUDE.md           # This file (project standards)
└── CLAUDE.local.md     # Personal configurations (gitignored)
```

## Quick Setup & Core Commands

### Essential Commands by Environment
| Environment | Enter | Install | Format | Lint | Test |
|-------------|-------|---------|--------|------|------|
| Python | `cd python-env && devbox shell` | `devbox run install` | `devbox run format` | `devbox run lint` | `devbox run test` |
| TypeScript | `cd typescript-env && devbox shell` | `devbox run install` | `devbox run format` | `devbox run lint` | `devbox run test` |
| Rust | `cd rust-env && devbox shell` | `devbox run build` | `devbox run format` | `devbox run lint` | `devbox run test` |
| Go | `cd go-env && devbox shell` | `devbox run build` | `devbox run format` | `devbox run lint` | `devbox run test` |
| Nushell | `cd nushell-env && devbox shell` | `devbox run setup` | `devbox run format` | `devbox run check` | `devbox run test` |

### Core Devbox Commands
```bash
# Environment management
devbox init                          # Initialize new environment
devbox shell                         # Enter environment shell
devbox run <script>                  # Run defined script
devbox add <package>                 # Add package to environment
devbox rm <package>                  # Remove package from environment
devbox update                        # Update all packages

# Project management
devbox install                       # Install all packages from devbox.json
devbox generate direnv               # Generate .envrc for auto-activation
devbox clean                         # Clean package cache
```

> **Personal Aliases**: Add your custom shortcuts and productivity commands to `CLAUDE.local.md`

## Claude Code Hooks Automation

This environment includes intelligent automation through Claude Code hooks that provide real-time quality assurance, formatting, and validation across all programming languages.

### Quick Setup
```bash
# Install project-specific hooks (recommended for teams)
./.claude/install-hooks.sh

# Test environment setup
./.claude/install-hooks.sh --test
```

### Automated Quality Gates

| Trigger | Action | Intelligence Features |
|---------|--------|----------------------|
| **Edit files** | Auto-format + performance tracking | Measures format time, detects slow operations |
| **Edit test files** | Run tests + performance analysis | Tracks test execution time, detects flaky tests |
| **Edit config files** | Dependency scan + drift detection | Monitors dependency changes, environment consistency |
| **Git commit** | Pre-commit validation + analytics | Performance-tracked linting, resource monitoring |
| **Command failures** | Failure pattern learning | Analyzes error patterns, suggests solutions |
| **Task completion** | Intelligence report + GitHub integration | Performance, security, dependencies analysis |

### Intelligence Systems
- 🔍 **Performance Analytics** - Real-time tracking with optimization recommendations
- 💾 **Resource Monitoring** - Memory/CPU/disk usage analysis with proactive alerts
- 📦 **Dependency Health** - Cross-language vulnerability scanning and update management
- 🛡️ **Security Analysis** - Advanced pattern detection for security anti-patterns
- ⚙️ **Environment Drift** - Configuration consistency and synchronization
- 🧠 **Failure Learning** - AI-powered failure analysis with solution suggestions
- 🧪 **Test Intelligence** - Flaky test detection and performance regression analysis
- 🔗 **GitHub Integration** - Automated issue creation and development workflow enhancement

> **Custom Automation**: Add personal hooks and automation scripts to `CLAUDE.local.md`

## Style Guidelines

### Python
- Use uv exclusively for package management (no pip/poetry/pipenv)
- Type hints mandatory, 88 char line length, snake_case naming
- Google docstrings, specific exceptions, structured logging
- Prefer `uv run` over venv activation for commands

### TypeScript
- Strict mode enabled, never use `any`, prefer `unknown`
- camelCase naming, interfaces over types
- Result pattern for error handling

### Rust
- Embrace ownership system, avoid unnecessary clones
- Use `Result<T, E>` + `?` operator for error handling
- Document with examples, async with tokio

### Go
- Simple explicit code, always check errors with context
- Small focused interfaces, table-driven tests

### Nushell
- Function naming: `def "namespace command"` pattern for CLI-style commands
- Parameter defaults and type hints mandatory: `[--param = "default": string]`
- Environment variables: prefer `$env.VAR` over environment mutations
- Error handling: use `do --ignore-errors` for graceful degradation
- Data pipelines: leverage structured data and pipeline operators

## Essential Configuration Templates

### Python (pyproject.toml)
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

### TypeScript (tsconfig.json)
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

> **Personal Configurations**: Customize these templates in your local environment. 
> See `CLAUDE.local.md` for personal configuration examples.

## Testing Standards

- **Coverage Requirement**: Minimum 80% code coverage
- **Test Structure**: Arrange-Act-Assert pattern
- **Dependencies**: Mock external dependencies in tests
- **Frameworks**: pytest (Python), Jest (TypeScript), cargo test (Rust), go test (Go)

### Quality Gates
```bash
# Cross-language validation
nu nushell-env/scripts/validate-all.nu parallel

# Environment-specific validation
devbox run lint && devbox run test  # In any environment
```

## Security & Performance Standards

### Security Requirements
- Input validation at all boundaries
- Environment variables for secrets (never hardcode)
- Regular dependency scanning and updates
- Security linting in pre-commit hooks

### Performance Standards
- Connection pooling for database connections
- Structured logging with correlation IDs
- Health checks and monitoring endpoints
- Performance regression detection via hooks

## Language Environment Setup

### Python Environment
```bash
mkdir python-env && cd python-env
devbox init && devbox add python@3.12 uv ruff mypy pytest
devbox generate direnv && direnv allow
```

### TypeScript Environment
```bash
mkdir typescript-env && cd typescript-env
devbox init && devbox add nodejs@20 typescript eslint prettier jest
devbox generate direnv && direnv allow
```

### Rust Environment
```bash
mkdir rust-env && cd rust-env
devbox init && devbox add rustc cargo rust-analyzer clippy rustfmt
devbox generate direnv && direnv allow
```

### Go Environment
```bash
mkdir go-env && cd go-env
devbox init && devbox add go@1.22 golangci-lint goimports
devbox generate direnv && direnv allow
```

### Nushell Environment
```bash
mkdir nushell-env && cd nushell-env
devbox init && devbox add nushell@0.103.0 teller git
mkdir -p scripts config
devbox generate direnv && direnv allow
```

## Cross-Language Integration

### Validation Script (Nushell)
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

## AI-Assisted Development Best Practices

- Use descriptive names and clear context for better code generation
- Include concrete examples and anti-patterns in documentation
- Explicit types and interfaces help AI understand intent
- Structure code in logical, predictable patterns

---

## Personal Development Environment

This project uses a two-file system for documentation and configuration:

### File Structure
- **CLAUDE.md** (this file): Project-wide standards, team processes, and shared setup
- **CLAUDE.local.md**: Personal configurations, individual workflows, and local customizations

### Setup Instructions
```bash
# 1. Copy the template to create your personal configuration
cp CLAUDE.local.md.template CLAUDE.local.md

# 2. Customize sections relevant to your workflow
# 3. Keep it updated as your preferences evolve
```

### Integration Model
| Aspect | CLAUDE.md (Project) | CLAUDE.local.md (Personal) |
|--------|--------------------|-----------------------------|
| **Purpose** | Team standards and shared processes | Individual productivity and preferences |
| **Content** | Essential setup, style guidelines, core commands | Personal aliases, custom tools, learning notes |
| **Precedence** | Team standards take priority | Extends and personalizes project standards |
| **Version Control** | Committed to repository | Gitignored (personal only) |

### What Goes Where?

**CLAUDE.md Contains**:
- Project architecture and environment structure
- Team coding standards and style guidelines
- Essential commands and setup procedures
- Core hooks automation and quality gates
- Testing standards and security requirements

**CLAUDE.local.md Contains**:
- Personal aliases and productivity shortcuts
- Individual development workflows and preferences  
- Local environment customizations and packages
- Personal learning resources and project notes
- Custom automation and debugging tools

### Example Usage Patterns
```bash
# Team standard (from CLAUDE.md)
cd python-env && devbox shell
devbox run test

# Personal enhancement (from CLAUDE.local.md)
alias pydev="cd python-env && devbox shell"
alias quick-test="pydev && devbox run test --verbose"
```

**Benefits of This Approach**:
- **Consistent Onboarding**: New team members get standardized setup
- **Individual Flexibility**: Personal productivity without affecting team standards
- **Reduced Conflicts**: Personal configs don't create merge conflicts
- **Maintainable Standards**: Core project documentation stays focused and clean