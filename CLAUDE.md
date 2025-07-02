# CLAUDE.md - Polyglot Development Environment

## Project Overview
Polyglot development environment for Python, TypeScript, Rust, Go, and Nushell with AI-optimized practices using Devbox for isolated, reproducible environments. Nushell serves as the default scripting shell for automation, DevOps workflows, and cross-language orchestration.

### 🪝 Claude Code Hooks Automation
This environment includes intelligent Claude Code hooks that automate quality gates, formatting, testing, and validation across all languages. The hooks system provides:

- **Auto-formatting**: Automatically formats code after editing (ruff, prettier, rustfmt, goimports)
- **Auto-testing**: Runs tests when test files are modified
- **Pre-commit validation**: Lints code and scans for secrets before commits
- **Cross-language validation**: Comprehensive quality checks across all environments
- **Task completion automation**: Shows status and runs validation when tasks finish

**Quick Setup**: Run `./.claude/install-hooks.sh` to enable automated workflows, or use `/project:polyglot-rule2hook` in Claude Code to convert natural language rules to hooks.

⚠️ **Note**: If you don't need hooks automation, simply ignore the `.claude/` directory. All devbox environments work independently without hooks.

## Repository & Collaboration

### Getting Started
```bash
# Clone to another machine
git clone https://github.com/ricable/polyglot-devenv.git
cd polyglot-devenv

# Install prerequisites (if needed)
curl -fsSL https://get.jetify.com/devbox | bash
brew install direnv

# Set up any environment
cd python-env && devbox shell
devbox run install
```

### Collaboration Workflow
```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/polyglot-devenv.git
cd polyglot-devenv

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, test, and commit
devbox run test  # In any environment
git add .
git commit -m "Add your feature"

# Push and create pull request
git push origin feature/your-feature-name
# Then create PR on GitHub
```

### CI/CD Setup
```bash
# Set up development environment
cd nushell-env && devbox shell
devbox run setup

# Available automation scripts
nu scripts/github.nu setup                    # Configure GitHub CLI
nu scripts/github.nu status                   # Check repo status
nu scripts/github.nu release --version v1.0.0 # Create releases
nu scripts/kubernetes.nu setup                # Set up K8s dev environment
nu scripts/containers.nu build --env all      # Build all container images
nu scripts/deploy.nu                          # Deployment automation
nu scripts/validate.nu                        # Cross-language validation
nu scripts/env-sync.nu                        # Environment synchronization
```

### Repository Structure
- **Public Repository**: https://github.com/ricable/polyglot-devenv
- **Issues & Discussions**: Use GitHub Issues for bug reports and feature requests
- **Contributing**: See individual environment READMEs for language-specific guidelines
- **Automation**: Comprehensive Nushell scripts for DevOps workflows

## Quick Reference

### Essential Commands by Language
| Task | Python | TypeScript | Rust | Go | Nushell |
|------|--------|------------|------|-----|---------|
| Enter env | `cd python-env && devbox shell` | `cd typescript-env && devbox shell` | `cd rust-env && devbox shell` | `cd go-env && devbox shell` | `cd nushell-env && devbox shell` |
| Install | `devbox run install` | `devbox run install` | `devbox run build` | `devbox run build` | `devbox run setup` |
| Format | `devbox run format` | `devbox run format` | `devbox run format` | `devbox run format` | `devbox run format` |
| Lint | `devbox run lint` | `devbox run lint` | `devbox run lint` | `devbox run lint` | `devbox run check` |
| Test | `devbox run test` | `devbox run test` | `devbox run test` | `devbox run test` | `devbox run test` |
| Clean | `devbox run clean` | `devbox run clean` | `devbox run clean` | `devbox run clean` | `devbox run clean` |
| Watch | `devbox run watch` | `devbox run dev` | `devbox run watch` | `devbox run watch` | `devbox run watch` |

### Devbox Package Management
| Task | Command | Description |
|------|---------|-------------|
| Add package | `devbox add <package>` | Add package to current environment |
| Remove package | `devbox rm <package>` | Remove package from environment |
| Update packages | `devbox update` | Update all packages to latest |
| List packages | `devbox info` | List installed packages |
| Search packages | `devbox search <term>` | Search available packages |
| Install all | `devbox install` | Install from devbox.json |
| Global install | `devbox global install <pkg>` | Install package globally |

### Python uv Commands
| Task | Command | Description |
|------|---------|-------------|
| Create venv | `uv venv --python 3.12` | Create virtual environment |
| Activate venv | `source .venv/bin/activate` | Activate virtual environment |
| Install project | `uv pip install -e ".[dev]"` | Install in editable mode |
| Add dependency | `uv pip install fastapi` | Add new package |
| Install from file | `uv pip install -r requirements.txt` | Install from requirements |
| Upgrade package | `uv pip install --upgrade ruff` | Upgrade specific package |
| Freeze deps | `uv pip freeze > requirements.txt` | Export requirements |
| Compile deps | `uv pip compile requirements.in` | Compile requirements |
| Show package | `uv pip show fastapi` | Show package information |
| List packages | `uv pip list` | List installed packages |
| Uninstall | `uv pip uninstall fastapi` | Remove package |
| Check deps | `uv pip check` | Verify package dependencies |
| Install extras | `uv pip install ".[dev,test]"` | Install with extras |
| Sync deps | `uv pip sync requirements.txt` | Sync exact dependencies |

### uv Project Management
| Task | Command | Description |
|------|---------|-------------|
| Init project | `uv init` | Initialize new Python project |
| Add dependency | `uv add fastapi` | Add package to pyproject.toml |
| Remove dependency | `uv remove fastapi` | Remove package from project |
| Install project | `uv sync` | Install project dependencies |
| Run command | `uv run pytest` | Run command in project env |
| Build project | `uv build` | Build wheel and sdist |
| Publish project | `uv publish` | Publish to PyPI |
| Lock dependencies | `uv lock` | Create lock file |
| Update deps | `uv update` | Update all dependencies |
| Tree view | `uv tree` | Show dependency tree |

### Nushell Scripting Commands
| Task | Command | Description |
|------|---------|-------------|
| Run Nu script | `nu script.nu` | Execute Nushell script |
| Interactive shell | `nu` | Start Nushell REPL |
| Run with args | `nu script.nu --param value` | Execute script with parameters |
| Module import | `use common.nu *` | Import module functions |
| Environment check | `$env \| get HOME` | Access environment variables |
| Data pipeline | `ls \| where size > 1MB` | Process structured data |
| JSON handling | `open data.json \| get field` | Parse and query JSON |
| HTTP requests | `http get "https://api.example.com"` | Make HTTP requests |
| Error handling | `do --ignore-errors { command }` | Handle command errors |
| Parallel execution | `[cmd1, cmd2] \| par-each { \|it\| $it }` | Run commands in parallel |
| Config management | `config get table.mode` | Access Nushell configuration |
| Plugin management | `plugin add nu_plugin_query` | Add Nushell plugins |

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
│   ├── common.nu       # Shared utilities and functions
│   └── .teller.yml     # Secret management configuration
├── .claude/            # Claude Code configuration
│   ├── commands/       # Custom slash commands
│   │   └── polyglot-rule2hook.md  # Enhanced rule2hook command
│   ├── polyglot-hooks-config.json # Predefined hook configuration
│   ├── install-hooks.sh           # Hooks installation script
│   ├── README-hooks.md            # Hooks documentation
│   └── settings.json              # Project-specific settings (created on install)
└── CLAUDE.md           # This file
```

## Claude Code Hooks Automation

This environment includes intelligent automation through Claude Code hooks that provide real-time quality assurance, formatting, and validation across all programming languages.

### Quick Setup

**Install Hooks (Recommended)**:
```bash
# Install project-specific hooks (recommended for teams)
./.claude/install-hooks.sh

# Or install globally for all your projects
./.claude/install-hooks.sh --user

# Test environment setup
./.claude/install-hooks.sh --test
```

**Using Natural Language Rules**:
```bash
# In Claude Code, convert rules to hooks automatically
/project:polyglot-rule2hook "Format code after editing files"
/project:polyglot-rule2hook "Run tests when test files are modified"
/project:polyglot-rule2hook "Validate all environments when finishing tasks"

# Convert existing CLAUDE.md automation rules
/project:polyglot-rule2hook
```

### Automated Workflows

| Trigger | Action | Intelligence Added |
|---------|--------|-------------------|
| **Edit files** | Auto-format + performance tracking | Measures format time, detects slow operations |
| **Edit test files** | Run tests + performance analysis | Tracks test execution time, detects flaky tests |
| **Edit config files** | Dependency scan + drift detection | Monitors dependency changes, environment consistency |
| **Edit code files** | Security scan | Detects security anti-patterns, secrets, vulnerabilities |
| **Git commit** | Pre-commit validation + analytics | Performance-tracked linting, resource monitoring |
| **Command failures** | Failure pattern learning | Analyzes error patterns, suggests solutions, learns fixes |
| **Task completion** | Intelligence report + GitHub integration | Performance, security, dependencies, automated issue creation |
| **Claude notifications** | Structured logging | Enhanced notification tracking and analysis |

### Intelligent Monitoring Features

**Real-time Intelligence**:
- 🔍 **Performance Analytics**: Track build times, test duration, and resource usage patterns
- 💾 **Resource Monitoring**: Monitor memory, CPU, and disk usage with intelligent alerts
- 📦 **Dependency Health**: Proactive scanning for outdated packages and security vulnerabilities
- 🛡️ **Security Analysis**: Advanced pattern detection for security anti-patterns and secrets
- ⚙️ **Environment Drift**: Automatic detection of configuration changes and inconsistencies
- 🧠 **Failure Pattern Learning**: AI-powered analysis of build/test failures with solution suggestions
- 🧪 **Test Intelligence**: Flaky test detection and performance regression analysis
- 🔗 **GitHub Integration**: Automated issue creation for critical failures and performance regressions

**Proactive Alerts**:
- Performance degradation warnings (>50% increase in build times)
- High resource usage alerts (>85% memory/CPU usage)  
- Critical security vulnerabilities (immediate notification)
- Outdated dependencies (>30% of packages outdated)
- Environment drift detection (configuration inconsistencies)
- Automated GitHub issues for critical failures and security alerts

### Hook Management Commands

```bash
# Install hooks for this project
./.claude/install-hooks.sh

# Generate hooks from natural language
/project:polyglot-rule2hook "Format code after editing files"

# Test environment setup
./.claude/install-hooks.sh --test

# Validate hook configuration
bash -c "cd python-env && devbox run format --quiet"      # Test Python hooks
bash -c "cd typescript-env && devbox run lint --quiet"    # Test TypeScript hooks
bash -c "cd rust-env && devbox run test --quiet"          # Test Rust hooks
bash -c "cd go-env && devbox run format --quiet"          # Test Go hooks
nu nushell-env/scripts/validate.nu --parallel             # Test cross-language validation
```

## Intelligent Development Analytics

The enhanced hooks system provides comprehensive analytics and monitoring capabilities:

### 📊 Performance Intelligence
```bash
# View performance analytics dashboard
nu nushell-env/scripts/performance-analytics.nu dashboard

# Generate performance reports
nu nushell-env/scripts/performance-analytics.nu report --days 7

# Get optimization suggestions
nu nushell-env/scripts/performance-analytics.nu optimize

# Track specific command performance
nu nushell-env/scripts/performance-analytics.nu measure "build" "python-env" "devbox run build"
```

### 💾 Resource Monitoring
```bash
# Monitor resource usage in real-time
nu nushell-env/scripts/resource-monitor.nu watch --interval 30

# Generate resource usage reports
nu nushell-env/scripts/resource-monitor.nu report --hours 24

# Get resource optimization recommendations
nu nushell-env/scripts/resource-monitor.nu optimize

# Monitor command resource usage
nu nushell-env/scripts/resource-monitor.nu monitor-command "devbox run test"
```

### 📦 Dependency Health
```bash
# Scan all environments for dependency issues
nu nushell-env/scripts/dependency-monitor.nu scan-all

# Generate dependency health reports
nu nushell-env/scripts/dependency-monitor.nu report --format summary

# Update dependencies with security fixes
nu nushell-env/scripts/dependency-monitor.nu update --security-only

# View dependency optimization suggestions
nu nushell-env/scripts/dependency-monitor.nu optimize
```

### 🛡️ Security Analysis
```bash
# Run comprehensive security scan
nu nushell-env/scripts/security-scanner.nu scan-all

# Generate security reports
nu nushell-env/scripts/security-scanner.nu report --format summary

# Auto-fix security issues where possible
nu nushell-env/scripts/security-scanner.nu fix --severity critical --dry-run

# Scan specific file for security issues
nu nushell-env/scripts/security-scanner.nu scan-file "src/app.py"
```

### ⚙️ Environment Consistency
```bash
# Create baseline snapshot of all environments
nu nushell-env/scripts/environment-drift.nu snapshot --save-as-baseline

# Detect configuration drift
nu nushell-env/scripts/environment-drift.nu detect

# Generate drift analysis report
nu nushell-env/scripts/environment-drift.nu report --format summary

# Synchronize environment from baseline
nu nushell-env/scripts/environment-drift.nu sync python-env --from-baseline
```

### 🧠 Failure Pattern Learning
```bash
# Learn patterns from recent failures
nu nushell-env/scripts/failure-pattern-learning.nu learn-patterns --days 7

# Generate failure analysis report
nu nushell-env/scripts/failure-pattern-learning.nu report --days 7

# Simulate failure scenarios for testing
nu nushell-env/scripts/failure-pattern-learning.nu simulate python --scenario dependency_missing
```

### 🧪 Test Intelligence
```bash
# Run intelligent test analysis
nu nushell-env/scripts/test-intelligence.nu run python-env

# Detect flaky tests
nu nushell-env/scripts/test-intelligence.nu detect-flaky --environment python-env

# Analyze test performance trends
nu nushell-env/scripts/test-intelligence.nu analyze-trends --days 7
```

### 🔗 GitHub Integration
```bash
# Initialize GitHub integration
nu nushell-env/scripts/github-integration.nu init

# Monitor hooks for automated issue creation
nu nushell-env/scripts/github-integration.nu monitor-hooks

# Generate GitHub integration report
nu nushell-env/scripts/github-integration.nu report --days 7

# Test integration (dry run)
nu nushell-env/scripts/github-integration.nu test --dry-run
```

### Intelligent Environment Detection

Hooks automatically detect the appropriate environment using:

1. **File extension analysis**: `.py` → Python, `.ts/.js` → TypeScript, `.rs` → Rust, `.go` → Go, `.nu` → Nushell
2. **Directory context**: Working in `python-env/` automatically uses Python tools
3. **Cross-language orchestration**: `Stop` hooks run comprehensive validation across all environments

### Benefits

- **Zero manual intervention**: Quality gates run automatically
- **Environment isolation**: Each language uses its own tools via devbox
- **Performance optimized**: Hooks use `--quiet` flags and error handling
- **Team consistency**: Project-specific hooks ensure same standards for all developers
- **Customizable**: Natural language rule conversion makes it easy to add new automations

## Devbox Setup

### Prerequisites
```bash
curl -fsSL https://get.jetify.com/devbox | bash
brew install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
```

### Core Devbox Commands
```bash
# Environment management
devbox init                          # Initialize new environment
devbox shell                         # Enter environment shell
devbox run <script>                  # Run defined script
devbox add <package>                 # Add package to environment
devbox rm <package>                  # Remove package from environment
devbox update                        # Update all packages
devbox info <package>                # Show package information
devbox search <term>                 # Search for packages

# Environment automation
devbox generate direnv               # Generate .envrc for auto-activation
devbox services start               # Start background services
devbox services stop                # Stop background services
devbox services restart <service>   # Restart specific service

# Project management
devbox install                       # Install all packages from devbox.json
devbox global install <package>     # Install package globally
devbox global list                  # List global packages
devbox clean                         # Clean package cache
```

### Language Environment Setup
```bash
# Python
mkdir python-env && cd python-env
devbox init && devbox add python@3.12 uv ruff mypy pytest
devbox generate direnv && direnv allow

# TypeScript  
mkdir typescript-env && cd typescript-env
devbox init && devbox add nodejs@20 typescript eslint prettier jest
devbox generate direnv && direnv allow

# Rust
mkdir rust-env && cd rust-env
devbox init && devbox add rustc cargo rust-analyzer clippy rustfmt
devbox generate direnv && direnv allow

# Go
mkdir go-env && cd go-env
devbox init && devbox add go@1.22 golangci-lint goimports
devbox generate direnv && direnv allow

# Nushell (Scripting & Automation)
mkdir nushell-env && cd nushell-env
devbox init && devbox add nushell@0.103.0 teller git
mkdir -p scripts config
devbox generate direnv && direnv allow
```

## Style Guidelines

### Python
- Use uv exclusively (no pip/poetry/pipenv)
- Type hints mandatory, 88 char line length, snake_case naming
- Google docstrings, specific exceptions, structured logging
- Prefer `uv run` over venv activation for commands
- Use `uv add/remove` for dependency management in projects

### TypeScript
- Strict mode, never `any`, prefer `unknown`
- camelCase naming, interfaces over types
- Result pattern for error handling

### Rust
- Embrace ownership, avoid clones
- `Result<T, E>` + `?` operator for errors
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
- Configuration: use JSON/YAML for complex configs, `.env` for environment vars
- Modules: organize related functions in `*.nu` files, use `use` for imports
- Security: always use `--suppress-output` for sensitive input prompts

## Essential Configs

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

### Nushell (config.nu)
```nushell
$env.config = {
  show_banner: false
  table: {
    mode: rounded
    index_mode: always
    show_empty: true
  }
  completions: {
    case_sensitive: false
    quick: true
    partial: true
  }
  history: {
    max_size: 100_000
    sync_on_enter: true
  }
  error_style: "fancy"
  use_ansi_coloring: true
  edit_mode: emacs
}

# Custom aliases for development
alias ll = ls -la
alias dev = cd ~/dev
alias projects = ls ~/dev | where type == dir

# Git aliases
alias gs = git status
alias gp = git pull
alias gc = git commit -m
```

### Advanced Devbox Commands
```bash
# Environment inspection
devbox list                          # List all environments
devbox version                       # Show devbox version
devbox config                        # Show current configuration
devbox env                           # Show environment variables

# Services management
devbox services ls                   # List available services
devbox services status               # Show service status
devbox services up                   # Start all services
devbox services down                 # Stop all services
devbox services logs <service>       # View service logs

# Development workflow
devbox run --verbose <script>        # Run with verbose output
devbox shell --config <path>         # Use specific config file
devbox generate shell-completion     # Generate shell completions
devbox lock                          # Lock current package versions
```

### Sample Devbox Configurations

**Python Environment**:
- Packages: `python@3.12`, `uv`, `ruff`, `mypy`
- Scripts: `setup`, `install`, `format`, `lint`, `type-check`, `test`, `build`, `clean`, `watch`
- Environment: `PYTHONPATH`, `UV_CACHE_DIR`, `UV_PYTHON_PREFERENCE`

**TypeScript Environment**:
- Packages: `nodejs@20`, `typescript@latest`
- Scripts: `install`, `build`, `dev`, `format`, `lint`, `test`, `test-watch`, `clean`, `type-check`
- Environment: `NODE_ENV`

**Rust Environment**:
- Packages: `rustc`, `cargo`, `rust-analyzer`, `clippy`, `rustfmt`
- Scripts: `build`, `build-release`, `run`, `test`, `test-watch`, `format`, `lint`, `clean`, `check`, `doc`, `watch`
- Environment: `RUST_BACKTRACE`

**Go Environment**:
- Packages: `go@1.22`, `golangci-lint@latest`
- Scripts: `build`, `run`, `test`, `test-watch`, `format`, `lint`, `clean`, `mod-tidy`, `mod-download`, `vet`, `watch`
- Environment: `CGO_ENABLED`

**Nushell Environment**:
- Packages: `nushell@0.103.0`, `teller@2.0.7`, `git@2.49.0`
- Scripts: `setup`, `format`, `check`, `test`, `clean`, `watch`, `list`, `validate`, `deploy`, `secrets`, `env-sync`
- Environment: `NU_LIB_DIRS`, `NU_PLUGIN_DIRS`, `NUSHELL_CONFIG_DIR`, `TELLER_CONFIG`

## Testing Standards
- 80% code coverage minimum
- Arrange-Act-Assert pattern
- Mock external dependencies
- Use pytest, Jest, cargo test, go test respectively

## AI-Assisted Development Best Practices
- Use descriptive names and clear context for better code generation
- Include concrete examples and anti-patterns in documentation
- Explicit types and interfaces help AI understand intent
- Structure code in logical, predictable patterns

## Core Principles
1. **Isolated Environments** - Each language has its own Devbox environment
2. **Reproducible Builds** - devbox.json and devbox.lock ensure consistency
3. **Type safety first** - strict typing all languages
4. **Error-first design** - explicit handling with context
5. **Test-driven development** - comprehensive coverage
6. **uv for Python** - Use uv exclusively for Python package management
7. **Nushell for Automation** - Use Nushell as the default scripting shell for DevOps workflows
8. **Auto-activation** - Use direnv for seamless environment switching
9. **Structured Data First** - Leverage Nushell's data-oriented approach for configuration and automation
10. **Intelligence-Driven Development** - Comprehensive analytics, learning, and automation via Claude Code hooks

## Intelligence-Driven Development Summary

This environment features **8 intelligent systems** that transform reactive development into proactive workflows:

**Core Intelligence Systems**:
- 🔍 **Performance Analytics** - Real-time tracking with optimization recommendations
- 💾 **Resource Monitoring** - Memory/CPU/disk usage analysis with proactive alerts
- 📦 **Dependency Health** - Cross-language vulnerability scanning and update management
- 🛡️ **Security Analysis** - Advanced pattern detection for security anti-patterns
- ⚙️ **Environment Drift** - Configuration consistency and synchronization
- 🧠 **Failure Learning** - AI-powered failure analysis with solution suggestions
- 🧪 **Test Intelligence** - Flaky test detection and performance regression analysis
- 🔗 **GitHub Integration** - Automated issue creation and development workflow enhancement

**Key Benefits**:
- **Zero Manual Intervention** - Quality gates run automatically via hooks
- **Proactive Issue Detection** - Critical failures create GitHub issues with solutions
- **Continuous Learning** - System learns from failures to prevent future issues
- **Cross-Language Support** - Python, TypeScript, Rust, Go, and Nushell environments
- **Performance Optimization** - Real-time analytics with actionable recommendations

## Security & Performance
- Input validation at boundaries
- Environment variables for secrets
- Connection pooling for databases
- Structured logging with correlation IDs
- Health checks and monitoring

## Cross-Language Quality Gates

### Bash Version (Traditional)
```bash
#!/bin/bash
# scripts/validate-all.sh
set -e

echo "🐍 Python..." && cd python-env && devbox run lint && devbox run test && cd ..
echo "📘 TypeScript..." && cd typescript-env && devbox run lint && devbox run test && cd ..
echo "🦀 Rust..." && cd rust-env && devbox run lint && devbox run test && cd ..
echo "🐹 Go..." && cd go-env && devbox run lint && devbox run test && cd ..
echo "🐚 Nushell..." && cd nushell-env && devbox run check && devbox run test && cd ..
echo "✅ All validations passed!"
```

### Nushell Version (Preferred)
```nushell
#!/usr/bin/env nu
# scripts/validate-all.nu

def "main validate all" [] {
    let environments = [
        {name: "🐍 Python", dir: "python-env", commands: ["lint", "test"]},
        {name: "📘 TypeScript", dir: "typescript-env", commands: ["lint", "test"]}, 
        {name: "🦀 Rust", dir: "rust-env", commands: ["lint", "test"]},
        {name: "🐹 Go", dir: "go-env", commands: ["lint", "test"]},
        {name: "🐚 Nushell", dir: "nushell-env", commands: ["check", "test"]}
    ]
    
    for env in $environments {
        print $"($env.name)..."
        cd $env.dir
        for cmd in $env.commands {
            devbox run $cmd
        }
        cd ..
    }
    
    print "✅ All validations passed!"
}

# Parallel validation (faster)
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