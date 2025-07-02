# CLAUDE.md - Polyglot Development Environment

## Project Overview
Polyglot development environment for Python, TypeScript, Rust, Go, and Nushell with AI-optimized practices using Devbox for isolated, reproducible environments. Nushell serves as the default scripting shell for automation, DevOps workflows, and cross-language orchestration.

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
└── CLAUDE.md           # This file
```

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

### Sample Python Devbox Configuration
```json
{
  "packages": ["python@3.12", "uv", "ruff", "mypy"],
  "shell": {
    "init_hook": [
      "echo 'Python Development Environment'",
      "uv --version",
      "python --version"
    ],
    "scripts": {
      "setup": "uv sync --dev",
      "install": "uv sync --dev",
      "add": "uv add",
      "remove": "uv remove", 
      "format": "uv run ruff format .",
      "lint": "uv run ruff check . --fix",
      "type-check": "uv run mypy .",
      "test": "uv run pytest --cov=src",
      "test-watch": "uv run pytest --cov=src -f",
      "clean": "find . -type d -name '__pycache__' -exec rm -rf {} + && find . -name '*.pyc' -delete",
      "build": "uv build",
      "deps": "uv tree",
      "lock": "uv lock",
      "sync": "uv sync --dev",
      "run": "uv run"
    }
  },
  "env": {
    "PYTHONPATH": "$PWD/src",
    "UV_CACHE_DIR": "$PWD/.uv-cache",
    "UV_PYTHON_PREFERENCE": "only-managed"
  },
  "services": {
    "postgres": {
      "packages": ["postgresql"],
      "process_configs": [
        {
          "command": "postgres -D $PWD/.devbox/postgresql/data",
          "log_location": "$PWD/.devbox/postgresql/postgresql.log"
        }
      ]
    }
  }
}
```

### Sample Nushell Devbox Configuration
```json
{
  "packages": ["nushell@0.103.0", "teller@2.0.7", "git@2.49.0"],
  "shell": {
    "init_hook": [
      "echo 'Nushell Automation Environment'",
      "nu --version",
      "echo 'Available scripts: nu scripts/list.nu'"
    ],
    "scripts": {
      "setup": "mkdir -p scripts config && nu scripts/setup.nu",
      "format": "nu scripts/format.nu",
      "check": "nu scripts/check.nu",
      "test": "nu scripts/test.nu",
      "clean": "rm -rf .env *.log tmp/ || true",
      "watch": "nu scripts/watch.nu",
      "list": "nu scripts/list.nu",
      "validate": "nu scripts/validate.nu",
      "deploy": "nu scripts/deploy.nu",
      "secrets": "teller scan",
      "env-sync": "nu scripts/env-sync.nu"
    }
  },
  "env": {
    "NU_LIB_DIRS": "$PWD/scripts",
    "NU_PLUGIN_DIRS": "$PWD/.nu-plugins",
    "NUSHELL_CONFIG_DIR": "$PWD/config",
    "TELLER_CONFIG": "$PWD/.teller.yml"
  }
}
```

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