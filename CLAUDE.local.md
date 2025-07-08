# CLAUDE.local.md - Personal Development Configuration

**Personal Setup**: Individual development preferences extending CLAUDE.md project standards with productivity enhancements.

## Configuration System Overview

**Three-file approach** for optimal organization:
- **[`CLAUDE.md`](CLAUDE.md)**: Project standards, architecture, core workflows (team-wide)
- **`CLAUDE.local.md`** (this file): Personal productivity, individual preferences, local tools
- **[`mcp/CLAUDE.md`](mcp/CLAUDE.md)**: MCP technical documentation, tool reference, development guidelines

**Setup**: `cp CLAUDE.local.md.template CLAUDE.local.md` → customize for individual productivity  
**Benefits**: Consistent onboarding, individual flexibility, reduced conflicts, maintainable standards

**Navigation**:
- 📋 **Project Essentials** → [`CLAUDE.md`](CLAUDE.md)
- 🔧 **MCP Tools & Development** → [`mcp/CLAUDE.md`](mcp/CLAUDE.md)  
- 👤 **Personal Workflows** → This file

## Quick Reference

### Language Standards
| Language | Style | Testing | Tools |
|----------|-------|---------|-------|
| **Python** | uv, type hints, 88 chars, snake_case, Google docs | pytest, 80% coverage | ruff, mypy |
| **TypeScript** | Strict mode, no `any`, camelCase, interfaces | Jest, AAA pattern | prettier, eslint |
| **Rust** | Ownership, `Result<T,E>` + `?`, async tokio | cargo test, examples | rustfmt, clippy |
| **Go** | Simple, explicit errors, small interfaces | table-driven tests | goimports, golangci-lint |
| **Nushell** | `def "ns cmd"`, type hints, `$env.VAR` | nu test, pipelines | nu format, nu check |

### Quality & Security
- **Testing**: 80% coverage • Hooks auto-test on file changes • `validate` or `nu scripts/validate-all.nu --parallel`
- **Security**: Input validation • Env vars for secrets • Pre-commit scanning • git-secrets for .env/.config/.json/.yaml
- **Performance**: Connection pooling • Structured logging • Health checks • DevPod resource management

## Personal Workflow

### Core Aliases
```bash
# Environment Navigation
alias pydev="cd dev-env/python && devbox shell"
alias tsdev="cd dev-env/typescript && devbox shell"
alias rustdev="cd dev-env/rust && devbox shell"
alias godev="cd dev-env/go && devbox shell"
alias nudev="cd dev-env/nushell && devbox shell"
alias root="cd /Users/cedric/dev/github.com/polyglot-devenv"
alias setup-all="root && pydev && devbox run setup && root && tsdev && devbox run install && root && nudev && devbox run setup"

# Claude-Flow SPARC Development
alias sparc-init="./claude-flow init --sparc && echo '🚀 SPARC environment initialized'"
alias sparc-modes="./claude-flow sparc modes"
alias sparc-tdd="./claude-flow sparc tdd"
alias sparc-arch="./claude-flow sparc run architect"
alias sparc-code="./claude-flow sparc run code"
alias sparc-debug="./claude-flow sparc run debug"
alias sparc-security="./claude-flow sparc run security-review"
alias sparc-docs="./claude-flow sparc run docs-writer"
alias sparc-status="./claude-flow status && ./claude-flow memory stats"

# Claude-Flow Agent Management
alias cf-wizard="./claude-flow start --ui && ./claude-flow hive-mind wizard"
alias cf-spawn="./claude-flow hive-mind spawn"
alias cf-monitor="./claude-flow monitor"
alias cf-logs="./claude-flow logs"
alias cf-memory="./claude-flow memory"

# Intelligence & Monitoring
alias intel="nu dev-env/nushell/scripts/performance-analytics.nu dashboard"
alias perf="nu dev-env/nushell/scripts/performance-analytics.nu report --days 7"
alias resources="nu dev-env/nushell/scripts/resource-monitor.nu optimize"
alias security="nu dev-env/nushell/scripts/security-scanner.nu scan-all"
alias deps="nu dev-env/nushell/scripts/dependency-monitor.nu report --format summary"

# Validation & Testing
alias validate="nu scripts/validate-all.nu --parallel"
alias quick-test="validate && echo '🎉 All environments validated successfully!'"
alias full-check="intel && validate && perf"
alias env-health="nu dev-env/nushell/scripts/validate-all.nu quick"
alias sparc-test="sparc-tdd && validate && echo '✅ SPARC TDD cycle completed'"
alias sparc-full="sparc-modes && sparc-status && validate"

# Session Management
alias morning-check="env-health && deps && security && sparc-status"
alias pre-commit="sparc-test && validate && echo '✅ Ready to commit'"
alias post-work="intel && resources && cf-memory export session-backup.json"
alias sparc-session="sparc-init && cf-wizard && echo '🎯 SPARC development session started'"
alias sparc-save="cf-memory export project-$(date +%Y%m%d).json && echo '💾 SPARC session saved'"

# IDE & Editor
alias code-py="code dev-env/python/src"
alias code-ts="code dev-env/typescript/src"
alias code-rust="code dev-env/rust/src"
alias code-go="code dev-env/go/cmd"
alias code-nu="code dev-env/nushell/scripts"
alias code-all="code ."
alias edit-claude="code CLAUDE.md"
alias edit-local="code CLAUDE.local.md"
alias edit-hooks="code .claude/settings.json"

# Logs & Git
alias logs-perf="tail -f dev-env/nushell/logs/performance.log"
alias logs-security="tail -f dev-env/nushell/logs/security.log"
alias logs-hooks="tail -f ~/.claude/notifications.log"
alias gst="git status"
alias glog="git log --oneline --graph --decorate -10"
alias gdiff="git diff --name-only"
alias gcommit="pre-commit && git commit"
```

## Environment Customizations

### Enhanced Devbox Packages
```toml
# Cross-language tools (add to any devbox.json)
packages = [
  "ripgrep", "fd", "bat", "delta", "exa", "zoxide", "fzf", 
  "jq", "yq", "hyperfine", "tokei", "procs"
]

# Language-specific extras
python_extras = ["ipython", "rich", "typer"]
rust_extras = ["cargo-watch", "cargo-edit"]
go_extras = ["delve", "air"]
node_extras = ["npm-check-updates"]
```

### Configuration Templates

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
    "target": "ES2022", "strict": true, "noImplicitAny": true, "noUncheckedIndexedAccess": true
  }
}
```

### Environment Variables
```bash
# Core settings
export EDITOR="code" BROWSER="firefox" TERM="xterm-256color"

# Language optimization
export RUST_BACKTRACE=1
export PYTHONPATH="/Users/cedric/dev/github.com/polyglot-devenv/dev-env/python/src"
export GOPATH="/Users/cedric/go"
export NODE_ENV="development"

# Claude Intelligence
export CLAUDE_PROJECT_ROOT="/Users/cedric/dev/github.com/polyglot-devenv"
export CLAUDE_PERFORMANCE_LOG="true"
export CLAUDE_RESOURCE_MONITOR="true"

# Tools
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export BAT_THEME="Sublime Snazzy"
export DELTA_FEATURES="+side-by-side"
export HISTSIZE=100000 HISTFILESIZE=100000 PROMPT_COMMAND="history -a"
```

### Shell Functions
```bash
# Claude project navigation
cdclaude() {
    cd /Users/cedric/dev/github.com/polyglot-devenv
    echo "📁 Claude Polyglot Environment"
    echo "🐍 Python: cd dev-env/python | 📘 TypeScript: cd dev-env/typescript"
    echo "🦀 Rust: cd dev-env/rust | 🐹 Go: cd dev-env/go | 🐚 Nushell: cd dev-env/nushell"
}

# Environment-aware prompt with SPARC status
claude_env_info() {
    local sparc_status=""
    if [[ -f ".roomodes" ]]; then
        sparc_status=" 🎯"
    fi
    case $PWD in
        *"dev-env/python"*) echo "🐍 PY$sparc_status" ;;
        *"dev-env/typescript"*) echo "📘 TS$sparc_status" ;;
        *"dev-env/rust"*) echo "🦀 RS$sparc_status" ;;
        *"dev-env/go"*) echo "🐹 GO$sparc_status" ;;
        *"dev-env/nushell"*) echo "🐚 NU$sparc_status" ;;
        *"polyglot-devenv"*) echo "🤖 CLAUDE$sparc_status" ;;
    esac
}

# SPARC Development Workflow
sparc_workflow() {
    local feature_name=$1
    local environment=${2:-python}
    
    echo "🎯 Starting SPARC workflow for $feature_name in $environment"
    
    # Phase 1: Specification
    ./claude-flow sparc run spec-pseudocode "Define $feature_name requirements"
    
    # Phase 2: Architecture  
    ./claude-flow sparc run architect "Design $feature_name architecture"
    
    # Phase 3: TDD Implementation
    ./claude-flow sparc tdd "implement $feature_name"
    
    # Phase 4: Security Review
    ./claude-flow sparc run security-review "$feature_name security analysis"
    
    # Phase 5: Integration
    ./claude-flow sparc run integration "integrate $feature_name with system"
    
    # Save progress
    ./claude-flow memory export "$feature_name-$(date +%Y%m%d).json"
    
    echo "✅ SPARC workflow completed for $feature_name"
}

# Quick SPARC mode shortcuts
sparc_quick() {
    local mode=$1
    local task=${2:-"development task"}
    ./claude-flow sparc run $mode "$task"
}

# SPARC session management
sparc_resume() {
    local project_name=${1:-"default"}
    echo "🔄 Resuming SPARC session for $project_name"
    
    if [[ -f "memory/$project_name.json" ]]; then
        ./claude-flow memory import "memory/$project_name.json"
        echo "✅ SPARC session restored from memory/$project_name.json"
    else
        echo "⚠️  No saved session found for $project_name"
        ./claude-flow init --sparc
    fi
    
    ./claude-flow status
}
```

**Nushell Config (dev-env/nushell/config/config.nu)**:
```nushell
$env.config.table.mode = "rounded"
$env.config.completions.quick = true
$env.config.history.max_size = 100_000
$env.config.show_banner = false

alias ll = ls -la
alias tree = ls | where type == dir | each { |it| ls $it.name }
alias performance = nu scripts/performance-analytics.nu dashboard
alias monitor = nu scripts/resource-monitor.nu watch --interval 30
```

## Learning Resources

### Essential Links
| Language | Official Docs | Learning | Community |
|----------|---------------|----------|----------|
| **Python** | [docs.python.org](https://docs.python.org/3/library/) | [Real Python](https://realpython.com/) | r/Python, Python Discord |
| **TypeScript** | [TypeScript Handbook](https://www.typescriptlang.org/docs/) | [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) | TypeScript Discord, r/typescript |
| **Rust** | [Rust Std Library](https://doc.rust-lang.org/std/) | [The Rust Book](https://doc.rust-lang.org/book/) | Rust Discord, r/rust |
| **Go** | [Go Std Library](https://pkg.go.dev/std) | [Effective Go](https://golang.org/doc/effective_go.html) | Gophers Slack, r/golang |
| **Nushell** | [Commands](https://www.nushell.sh/commands/) | [Nushell Book](https://www.nushell.sh/book/) | Nushell Discord |

### Tools & Polyglot
- **Tools**: [DevBox](https://www.jetify.com/devbox/docs/), [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Direnv](https://direnv.net/)
- **Polyglot**: [Language Comparisons](https://hyperpolyglot.org/), [Rosetta Code](http://rosettacode.org/), [Benchmarks](https://benchmarksgame-team.pages.debian.net/benchmarksgame/)
- **Web**: [MDN](https://developer.mozilla.org/), [Git Tips](https://github.com/git-tips/tips)

### Key Insights

#### Project-Specific
- **Intelligence Systems**: Sophisticated performance analytics - use for debugging
- **Validation**: `validate-all.nu --parallel` for fast feedback
- **Hooks**: Real-time quality assurance - customize in `.claude/settings.json`
- **Isolation**: Perfect devbox isolation - experiment with package versions safely
- **Nushell Scripts**: Production-ready automation in `dev-env/nushell/scripts/`

#### Language Tips
- **Python**: Use `uv run` exclusively (faster than venv activation)
- **TypeScript**: Strict mode catches runtime errors early
- **Rust**: Use `cargo check` frequently during development
- **Go**: Keep interfaces small and focused
- **Nushell**: Think structured data transformations, not text processing

#### Debugging
- **Performance**: `nu dev-env/nushell/scripts/performance-analytics.nu optimize`
- **Resources**: Monitor identifies memory leaks and CPU bottlenecks
- **Security**: Regular scans prevent vulnerabilities
- **Environment Drift**: Detection prevents configuration bugs
- **Tests**: Intelligence system identifies flaky tests and regressions

## Advanced Systems

### MCP Integration (Production Ready)
**Features**: JSON-RPC 2.0 • 40+ tools • 100+ resources • Auto environment detection • Progress tracking • Security validation

**Tool Categories**:
- **Environment**: `environment_detect`, `environment_info`, `environment_validate`
- **DevBox**: `devbox_shell`, `devbox_run`, `devbox_status`, `devbox_add_package`
- **DevPod**: `devpod_provision`, `devpod_list`, `devpod_status` (1-10 workspaces)
- **Cross-Language**: `polyglot_check`, `polyglot_validate`, `polyglot_clean`
- **Performance**: `performance_measure`, `performance_report`
- **Security**: `security_scan`, **Hooks**: `hook_status`, `hook_trigger`
- **PRP**: `prp_generate`, `prp_execute`

**Resources**: `polyglot://[documentation|config|examples|scripts]/*`

### DevPod System (Centralized Management ✅)
**Setup**: `nu devpod-automation/scripts/docker-setup.nu --install --configure --optimize`

**Centralized Management**: `host-tooling/devpod-management/manage-devpod.nu` • Single script for all environments • Zero duplication
**From Environment**: `devbox run devpod:provision|status|help` • Auto VS Code • SSH access • Language extensions • Complete isolation
**Direct Usage**: `nu host-tooling/devpod-management/manage-devpod.nu <command> <environment>`

**Management**:
```bash
# Environment-specific (from any dev-env/<lang>/ directory)
devbox run devpod:provision    # Create new workspace for current environment
devbox run devpod:status       # Show workspaces for current environment
devbox run devpod:help         # Environment-specific help

# Direct centralized management
nu host-tooling/devpod-management/manage-devpod.nu provision python
nu host-tooling/devpod-management/manage-devpod.nu status typescript
nu host-tooling/devpod-management/manage-devpod.nu help rust

# Standard devpod commands
devpod list|stop|delete <workspace>
bash devpod-automation/scripts/provision-all.sh [status|clean-all]
```

### Context Engineering Framework
**Architecture**: Workspace (local generation) • DevPod (containerized execution) • Shared (utilities) • Archive (history)

**Workflow**: Generate → Provision → Execute
1. `/generate-prp features/api.md --env dev-env/python`
2. `/devpod-python [count]`
3. `/execute-prp ...PRPs/api-python.md --validate`

**Enhanced** (275% faster): `/generate-prp --include-dojo --verbose` + `execute-prp-v2.py --validate --monitor`
**Features**: Version control • Auto-rollback • Performance monitoring • Intelligent recovery

**Templates**: FastAPI+async (Python) • Strict+ES modules (TypeScript) • Tokio+ownership (Rust) • Context+interfaces (Go) • Pipelines+types (Nushell)

### PRP Workflow Aliases (Updated for Centralized DevPod)
```bash
# Workspace (Local Generation)
alias prp-gen="cd context-engineering/workspace && /generate-prp"
alias prp-features="code context-engineering/workspace/features"
alias prp-templates="code context-engineering/workspace/templates"

# DevPod Execution (Centralized Management)
alias prp-exec-py="cd dev-env/python && devbox run devpod:provision && /execute-prp"
alias prp-exec-ts="cd dev-env/typescript && devbox run devpod:provision && /execute-prp"
alias prp-exec-rust="cd dev-env/rust && devbox run devpod:provision && /execute-prp"
alias prp-exec-go="cd dev-env/go && devbox run devpod:provision && /execute-prp"
alias prp-workflow="prp-gen && prp-exec-py"

# Direct centralized DevPod management
alias devpod-py="nu host-tooling/devpod-management/manage-devpod.nu"
alias devpod-provision="nu host-tooling/devpod-management/manage-devpod.nu provision"
alias devpod-status="nu host-tooling/devpod-management/manage-devpod.nu status"
```

### PRP Development Function
```bash
# Enhanced PRP workflow with Claude-Flow SPARC integration
personal-prp-workflow() {
    local feature=$1 env=${2:-python}
    echo "🚀 Starting Enhanced PRP + SPARC workflow for $feature in $env"
    
    # Phase 1: SPARC Specification + PRP Generation
    ./claude-flow sparc run spec-pseudocode "Define $feature requirements"
    ./claude-flow memory store "spec_$feature" "Requirements and constraints for $feature"
    
    cd context-engineering/workspace
    /generate-prp features/$feature.md --env dev-env/$env --include-dojo --verbose
    code context-engineering/workspace/PRPs/$feature-$env.md
    
    # Phase 2: SPARC Architecture + DevPod Provisioning
    ./claude-flow sparc run architect "Design $feature architecture"
    
    # Use centralized DevPod management with Claude-Flow
    case $env in
        python) cd dev-env/python && devbox run devpod:provision && devbox run claude-flow:init && /execute-prp context-engineering/devpod/environments/python/PRPs/$feature-python.md ;;
        typescript) cd dev-env/typescript && devbox run devpod:provision && devbox run claude-flow:init && /execute-prp context-engineering/devpod/environments/typescript/PRPs/$feature-typescript.md ;;
        rust) cd dev-env/rust && devbox run devpod:provision && devbox run claude-flow:init && /execute-prp context-engineering/devpod/environments/rust/PRPs/$feature-rust.md ;;
        go) cd dev-env/go && devbox run devpod:provision && devbox run claude-flow:init && /execute-prp context-engineering/devpod/environments/go/PRPs/$feature-go.md ;;
    esac
    
    # Phase 3: SPARC TDD + Validation
    ./claude-flow sparc tdd "implement $feature with TDD"
    ./claude-flow memory store "impl_$feature" "Implementation progress for $feature"
    
    echo "✅ Enhanced PRP + SPARC workflow completed for $feature"
    ./claude-flow memory export "$feature-complete-$(date +%Y%m%d).json"
}

# Quick aliases (Enhanced with SPARC)
alias quick-py-prp="personal-prp-workflow"
alias quick-ts-prp="personal-prp-workflow \$1 typescript"
alias quick-rust-prp="personal-prp-workflow \$1 rust"
alias quick-go-prp="personal-prp-workflow \$1 go"
alias quick-sparc-py="sparc_workflow \$1 python"
alias quick-sparc-ts="sparc_workflow \$1 typescript"
alias quick-sparc-rust="sparc_workflow \$1 rust"
alias quick-sparc-go="sparc_workflow \$1 go"
```

### PRP Performance Tracking
```bash
# Enhanced PRP + SPARC Performance Tracking
track-prp-sparc-performance() {
    local feature_name=$1 env=$2
    echo "📊 Tracking Enhanced PRP + SPARC performance for $feature_name in $env"
    
    # Track SPARC phases
    nu dev-env/nushell/scripts/performance-analytics.nu measure "sparc-specification" "$feature_name" "./claude-flow sparc run spec-pseudocode \"$feature_name requirements\""
    nu dev-env/nushell/scripts/performance-analytics.nu measure "sparc-architecture" "$feature_name" "./claude-flow sparc run architect \"$feature_name design\""
    nu dev-env/nushell/scripts/performance-analytics.nu measure "sparc-tdd" "$feature_name" "./claude-flow sparc tdd \"$feature_name implementation\""
    
    # Track PRP integration
    nu dev-env/nushell/scripts/performance-analytics.nu measure "prp-generation" "$feature_name" "/generate-prp features/$feature_name.md --env $env --include-dojo"
    nu dev-env/nushell/scripts/performance-analytics.nu measure "prp-execution" "$feature_name" "/execute-prp $feature_name-$env.md --validate"
    
    # Generate comprehensive report
    nu dev-env/nushell/scripts/performance-analytics.nu report --format table --filter "sparc-*|prp-*"
    echo "🎯 SPARC + PRP workflow performance analysis completed"
}

# Legacy PRP tracking (maintained for compatibility)
track-prp-performance() {
    local prp_file=$1 env=$2
    echo "📊 Tracking PRP performance for $prp_file in $env"
    nu dev-env/nushell/scripts/performance-analytics.nu measure "prp-generation" "$prp_file" "/generate-prp $prp_file --env $env"
    nu dev-env/nushell/scripts/performance-analytics.nu measure "prp-execution" "$prp_file" "/execute-prp $prp_file --validate"
    nu dev-env/nushell/scripts/performance-analytics.nu report --format table --filter "prp-*"
}

alias prp-perf="track-prp-performance"
alias prp-metrics="nu dev-env/nushell/scripts/performance-analytics.nu report --filter prp-*"
alias prp-optimize="nu dev-env/nushell/scripts/performance-analytics.nu optimize --filter prp-*"
alias sparc-perf="track-prp-sparc-performance"
alias sparc-metrics="nu dev-env/nushell/scripts/performance-analytics.nu report --filter sparc-*"
alias sparc-optimize="nu dev-env/nushell/scripts/performance-analytics.nu optimize --filter sparc-*"
```

## Local Tools & Scripts

### Development Scripts (~/scripts/claude-helpers/)
```bash
# quick-backup.sh
timestamp=$(date +%Y%m%d_%H%M%S)
tar -czf ~/backups/claude_backup_$timestamp.tar.gz \
    --exclude='*/target/*' --exclude='*/node_modules/*' --exclude='*/.uv-cache/*' --exclude='*/devbox.lock' \
    /Users/cedric/dev/github.com/polyglot-devenv

# env-health-check.nu
#!/usr/bin/env nu
use dev-env/nushell/common.nu *
def main [] {
    let start_time = (date now)
    nu scripts/validate-all.nu --parallel
    nu dev-env/nushell/scripts/dependency-monitor.nu scan-all --quiet
    nu dev-env/nushell/scripts/security-scanner.nu scan-all --quiet
    log success $"✅ Health check completed in ($((date now) - $start_time))"
}

# performance-summary.py
#!/usr/bin/env python3
import json, subprocess
from datetime import datetime

def get_performance_data():
    result = subprocess.run(["nu", "dev-env/nushell/scripts/performance-analytics.nu", 
                           "report", "--days", "1", "--format", "json"], capture_output=True, text=True)
    return json.loads(result.stdout) if result.returncode == 0 else {}

def main():
    data = get_performance_data()
    print(f"📊 Performance Summary - {datetime.now().strftime('%Y-%m-%d')}")
    if 'build_times' in data: print(f"   Build time: {data['build_times'].get('average', 0):.2f}s")
    if 'test_times' in data: print(f"   Test time: {data['test_times'].get('average', 0):.2f}s")
    if 'resource_usage' in data: print(f"   Peak memory: {data['resource_usage'].get('peak_memory_mb', 0)}MB")

if __name__ == "__main__": main()
```

### Custom Hooks (.claude/settings.json)
```json
{
  "PostToolUse": [{
    "matcher": "Edit|MultiEdit|Write", 
    "hooks": [{"type": "command", "command": "echo \"$(date): File edited\" >> ~/.claude/personal-activity.log"}]
  }],
  "Notification": [{
    "hooks": [{"type": "command", "command": "bash -c 'if [[ \"$(echo \"$0\" | jq -r \".severity // \\\"info\\\"\")\" == \"critical\" ]]; then osascript -e \"display notification \\\"Critical Alert\\\" with title \\\"Claude Code\\\"\"; fi'"}]
  }]
}
```

### Quality Scripts
```bash
# my-pre-commit - Enhanced checks
#!/bin/bash
echo "🔍 Enhanced pre-commit checks..."
validate
nu dev-env/nushell/scripts/performance-analytics.nu measure "pre-commit" "validation" "validate"
nu dev-env/nushell/scripts/security-scanner.nu scan-file "$(git diff --cached --name-only)" --quiet
echo "✅ Enhanced checks completed!"

# my-test-all - Comprehensive testing
#!/bin/bash
echo "🧪 Comprehensive testing..."
for env in dev-env/{python,typescript,rust,go,nushell}; do
    [ -d "$env" ] && { echo "Testing $env..."; cd "$env"; time devbox run test; cd ..; }
done
nu dev-env/nushell/scripts/test-intelligence.nu analyze-trends --days 7

# my-deploy-check - Deployment validation
#!/bin/bash
echo "🚀 Pre-deployment checks..."
validate && security && perf && deps
echo "✅ Deployment ready!"
```

## IDE & Tools

### VS Code Extensions
| Language | Extensions |
|----------|------------|
| **Python** | Python, Pylance, Python Debugger |
| **TypeScript** | TypeScript Importer, Auto Import - ES6/TS |
| **Rust** | rust-analyzer, CodeLLDB, crates |
| **Go** | Go, Go Outliner |
| **Nushell** | nushell-vscode-extension |
| **General** | GitLens, Thunder Client, REST Client, Bracket Pair Colorizer, indent-rainbow, Better Comments |

### VS Code Settings
```json
{
  "files.watcherExclude": {"**/target/**": true, "**/node_modules/**": true, "**/.uv-cache/**": true, "**/devbox.lock": true},
  "search.exclude": {"**/target": true, "**/node_modules": true, "**/.uv-cache": true},
  "python.defaultInterpreterPath": "./dev-env/python/.venv/bin/python",
  "rust-analyzer.linkedProjects": ["./dev-env/rust/Cargo.toml"],
  "go.gopath": "/Users/cedric/go",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.rulers": [88, 100, 120], "editor.formatOnSave": true, "files.trimTrailingWhitespace": true
}
```

### Development Tools
**Terminal**: iTerm2 + FiraCode Nerd Font + zsh + Oh My Zsh + powerlevel10k + tmux  
**Git**: delta diff, code merge, st=status, co=checkout, br=branch, ci=commit  
**Databases**: pgAdmin 4, RedisInsight, DB Browser (SQLite), MongoDB Compass

## Configuration & Secrets

### Environment Settings (.env files)
```bash
# Python (.env)
DEBUG=true LOG_LEVEL=debug PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_CACHE_DIR=/Users/cedric/.cache/uv

# TypeScript (.env.local)  
NODE_ENV=development DEBUG=true HOT_RELOAD=true TYPESCRIPT_STRICT=true

# Rust (.env)
RUST_BACKTRACE=full RUST_LOG=debug CARGO_TARGET_DIR=/Users/cedric/.cache/cargo-target

# Go (.env)
GO_ENV=development CGO_ENABLED=1 GOPROXY=https://proxy.golang.org,direct

# Nushell (.env)
NU_LOG_LEVEL=debug NU_PLUGIN_DIRS=/Users/cedric/.local/share/nushell/plugins NUSHELL_PERF_MODE=true
```

### Credentials (1Password CLI)
```bash
export GITHUB_TOKEN="$(op item get "GitHub Personal Token" --fields password)"
export CLAUDE_API_KEY="$(op item get "Claude API Key" --fields password)"
export DEV_DB_PASSWORD="$(op item get "Local PostgreSQL" --fields password)"
export REDIS_PASSWORD="$(op item get "Local Redis" --fields password)"
export TEST_API_KEY="$(op item get "Test API Key" --fields password)"
export DATADOG_API_KEY="$(op item get "Datadog API" --fields password)"
export BACKUP_ENCRYPTION_KEY="$(op item get "Backup Encryption" --fields password)"
```

### Local Services
**Databases**: PostgreSQL:5432, Redis:6379, MongoDB:27017, SQLite ~/databases/  
**Services**: nginx:8080, JSON Server:3001, ngrok, Docker registry:5000

### Performance Optimizations
```bash
# Language-specific
export PYTHONOPTIMIZE=1 PYTHONDONTWRITEBYTECODE=1 UV_CONCURRENT_DOWNLOADS=10 UV_CACHE_SIZE=10GB
export NODE_OPTIONS="--max-old-space-size=4096" npm_config_cache="/Users/cedric/.cache/npm" npm_config_progress=false
export CARGO_BUILD_JOBS=8 CARGO_TARGET_DIR="/Users/cedric/.cache/cargo-target" RUSTC_WRAPPER="sccache"
export GOCACHE="/Users/cedric/.cache/go-build" GOMODCACHE="/Users/cedric/.cache/go-mod" GOMAXPROCS=8
export NU_HISTORY_SIZE=100000 NU_COMPLETION_CACHE=true NU_PLUGIN_CACHE=true

# System
ulimit -n 65536
export MAKEFLAGS="-j8"
```

### Monitoring Functions
```bash
daily-metrics() {
    echo "📊 Daily Metrics - $(date)"
    nu dev-env/nushell/scripts/performance-analytics.nu report --days 1 --format table
    nu dev-env/nushell/scripts/resource-monitor.nu report --hours 24
    nu dev-env/nushell/scripts/test-intelligence.nu analyze-trends --days 1
    nu dev-env/nushell/scripts/security-scanner.nu report --days 1 --format summary
}

live-monitor() {
    echo "🔴 Starting live monitoring..."
    nu dev-env/nushell/scripts/resource-monitor.nu watch --interval 30 &
    nu dev-env/nushell/scripts/performance-analytics.nu monitor &
    top -u &
    echo "Press Ctrl+C to stop"; wait
}

weekly-review() {
    echo "📈 Weekly Review - $(date)"
    nu dev-env/nushell/scripts/performance-analytics.nu report --days 7 --format detailed
    nu dev-env/nushell/scripts/resource-monitor.nu optimize
    nu dev-env/nushell/scripts/dependency-monitor.nu report --days 7
    echo "💡 Optimization: Review build times, check memory leaks, update deps, clear caches"
}
```

## Troubleshooting

### Common Issues
| Issue | Solution |
|-------|----------|
| **Environment Not Loading** | `devbox shell --pure` |
| **Package Conflicts** | `devbox update && devbox clean` |
| **Performance Issues** | `nu dev-env/nushell/scripts/performance-analytics.nu optimize` |
| **Test Failures** | `nu dev-env/nushell/scripts/test-intelligence.nu detect-flaky --environment <env>` |
| **Memory Issues** | `nu dev-env/nushell/scripts/resource-monitor.nu watch` |
| **Build Slowness** | Check compiler caching, enable parallel builds |

### Debug Functions
```bash
debug-python() {
    cd dev-env/python
    echo "🐍 Python: PYTHONPATH=$PYTHONPATH, Env=$(which python)"
    python -c "import sys; print('Version:', sys.version[:5])"; uv pip list | head -5
}

debug-typescript() {
    cd dev-env/typescript
    echo "📘 TypeScript: Node=$(node --version), NPM=$(npm --version), TS=$(npx tsc --version)"
    npm list --depth=0 | head -5
}

debug-rust() {
    cd dev-env/rust
    echo "🦀 Rust: $(rustc --version), Cargo=$(cargo --version), Target=$CARGO_TARGET_DIR"
    cargo tree | head -5
}

debug-go() {
    cd dev-env/go
    echo "🐹 Go: $(go version), GOPATH=$GOPATH, GOPROXY=$GOPROXY"
    go list -m all | head -5
}

debug-nushell() {
    cd dev-env/nushell
    echo "🐚 Nushell: $(nu --version), Config=$NUSHELL_CONFIG_DIR, Plugins=$NU_PLUGIN_DIRS"
    ls scripts/ | where type == file | first 5
}

debug-system() {
    echo "💻 System: OS=$(uname -s), Shell=$SHELL, Devbox=$(devbox version)"
    echo "Memory: $(free -h 2>/dev/null | grep Mem || vm_stat | grep free)"
    echo "Disk: $(df -h . | tail -1 | awk '{print $4" free"}')"
}

debug-performance() {
    echo "⚡ Performance debugging"
    nu dev-env/nushell/scripts/performance-analytics.nu report --days 1
    nu dev-env/nushell/scripts/resource-monitor.nu report --hours 1
    echo "🔍 Top processes:"; ps aux | sort -k3 -nr | head -5
}
```

### Emergency Recovery
```bash
emergency-reset() {
    echo "🚨 Emergency reset - will clean ALL environments"
    read -p "Continue? (y/N): " confirm
    [[ $confirm == "y" ]] && {
        for env in dev-env/{python,typescript,rust,go,nushell}; do
            [ -d "$env" ] && { echo "Cleaning $env"; cd "$env"; devbox clean; cd ..; }
        done
        setup-all
        echo "✅ Reset completed"
    }
}

emergency-backup() {
    timestamp=$(date +%Y%m%d_%H%M%S)
    tar -czf ~/emergency_backup_$timestamp.tar.gz --exclude='*/target/*' --exclude='*/node_modules/*' --exclude='*/.uv-cache/*' .
    echo "✅ Backup: ~/emergency_backup_$timestamp.tar.gz"
}

emergency-restore() {
    ls -la ~/emergency_backup_*.tar.gz 2>/dev/null || echo "No backups found"
    read -p "Backup filename: " backup_file
    [ -f "$backup_file" ] && { emergency-backup; tar -xzf "$backup_file"; echo "✅ Restored"; } || echo "❌ Not found"
}

debug-network() {
    echo "🌐 Network Check"
    ping -c 1 8.8.8.8 > /dev/null && echo "✅ Internet" || echo "❌ Internet"
    curl -s https://pypi.org/simple/ > /dev/null && echo "✅ PyPI" || echo "❌ PyPI"
    curl -s https://registry.npmjs.org/ > /dev/null && echo "✅ NPM" || echo "❌ NPM"
    curl -s https://crates.io/ > /dev/null && echo "✅ Crates" || echo "❌ Crates"
    curl -s https://pkg.go.dev/ > /dev/null && echo "✅ Go modules" || echo "❌ Go modules"
}
```

### Support Resources
| Category | Resources |
|----------|----------|
| **Communities** | Python: r/Python, Discord • TypeScript: Discord, r/typescript • Rust: Forum, Discord • Go: Gophers Slack • Nushell: Discord |
| **Help** | Stack Overflow, GitHub Issues, Discord/Slack, Official docs, Built-in intelligence systems |
| **Learning Path** | Weekly: One language deep-dive • Monthly: Progress review • Quarterly: Tool updates • Continuous: Release notes |

## Cross-Reference Guide

### When to Use Each File

| Need | File | Section |
|------|------|----------|
| **Project setup & architecture** | [`CLAUDE.md`](CLAUDE.md) | Environment Structure, Core Systems |
| **MCP tool reference** | [`mcp/CLAUDE.md`](mcp/CLAUDE.md) | Complete MCP Tool Reference |
| **Docker MCP setup** | [`mcp/CLAUDE.md`](mcp/CLAUDE.md) | Docker MCP Integration |
| **AG-UI development** | [`mcp/CLAUDE.md`](mcp/CLAUDE.md) | AG-UI Protocol Integration |
| **Claude-Flow usage** | [`mcp/CLAUDE.md`](mcp/CLAUDE.md) | Claude-Flow Integration Tools |
| **Personal aliases** | This file | Personal Workflow |
| **IDE configuration** | This file | IDE & Tools |
| **Troubleshooting** | This file | Troubleshooting |
| **Local scripts** | This file | Local Tools & Scripts |

### Quick Navigation

**From Project to Personal**:
- Read [`CLAUDE.md`](CLAUDE.md) for project understanding
- Use this file for personal productivity setup
- Reference [`mcp/CLAUDE.md`](mcp/CLAUDE.md) for technical implementation

**From Personal to Project**:
- Contribute improvements back to [`CLAUDE.md`](CLAUDE.md)
- Report MCP issues in [`mcp/CLAUDE.md`](mcp/CLAUDE.md)
- Keep personal preferences in this file

## Testing Status ✅

### DevPod (Production Ready)
- **8 Workspaces Tested**: 2 per environment (Python, TypeScript, Go, Rust)
- **Performance**: ~2min provisioning, 100% success rate
- **Features**: Auto VS Code, SSH access, language extensions, unique naming
- **Limits**: Max 10/command, 15 total, validated working

### Hooks (Active & Tested)
- **Auto-Format**: All languages (ruff, prettier, rustfmt, goimports, nu format) ✅
- **Auto-Test**: All test patterns (pytest, jest, cargo test, go test, nu test) ✅
- **Detection**: File extensions + directory context + devbox integration ✅
- **6 Hook Types**: PostToolUse, PreToolUse, Stop, Notification, FailureHandling ✅
- **Security**: Pre-commit secret scanning for .env/.config/.json/.yaml ✅

### Environment Detection ✅
- **File-Based**: .py→Python, .ts/.js→TypeScript, .rs→Rust, .go→Go, .nu→Nushell
- **Path-Based**: dev-env/* directory context detection
- **Tool Selection**: Auto-selects correct format/lint/test tools per environment
- **Test Patterns**: Recognizes all language-specific test file patterns

### Cross-Environment Validation ✅
- **All Modes Working**: quick, dependencies, structure, parallel
- **Results**: Python (9 tests, 62% coverage), TypeScript (ESLint ready), Rust (2 tests), Go (compile OK), Nushell (syntax OK)
- **Tools**: devbox, git, nu, docker, kubectl, gh available

### Scripts & Nushell ✅
- **25 Scripts**: 100% syntax validation for Nushell 0.105.1 compatibility
- **Fixed**: --value flags, env conflicts, mkdir -p, --check→--ide-check, regex flags
- **Key Scripts**: setup.nu, check.nu, test.nu (11/12 passing), validate.nu, performance-analytics.nu, containers.nu, test-intelligence.nu

### MCP Server (Production Ready) ✅
- **22 Tools**: 95% success rate across 8 categories (Environment, DevBox, DevPod, Cross-Language, Performance, Security, Hook, PRP)
- **Performance**: Environment detection ~200ms, DevBox start ~4s, DevPod ~5s/workspace, Validation 18.9s, Tests 1.1s
- **Features**: TypeScript implementation, JSON-RPC 2.0, progress tracking, auto-completion

### Summary ✅
- **8 DevPod Workspaces**: 100% success rate, ~2min provisioning
- **All Systems**: Hooks, validation, MCP integration, environment detection fully tested
- **Performance**: Intelligent monitoring, analytics, automated quality gates active

---
*Personal configuration for sophisticated polyglot development environment with intelligent automation*