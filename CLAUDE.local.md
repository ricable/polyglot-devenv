# CLAUDE.local.md - Cedric's Personal Development Configuration

> **Personal Setup**: This file contains my individual development preferences and workflows.
> It extends the project standards defined in CLAUDE.md with personal productivity enhancements.

## Personal Workflow & Productivity

### My Development Aliases
```bash
# Environment shortcuts - quick navigation between languages
alias pydev="cd dev-env/python && devbox shell"
alias tsdev="cd dev-env/typescript && devbox shell"
alias rustdev="cd dev-env/rust && devbox shell"
alias godev="cd dev-env/go && devbox shell"
alias nudev="cd dev-env/nushell && devbox shell"

# Quick environment switching with status
alias env-status="nu dev-env/nushell/scripts/list.nu"
alias env-health="nu dev-env/nushell/scripts/validate-all.nu quick"

# Return to project root from any environment
alias root="cd /Users/cedric/dev/github.com/polyglot-devenv"

# Fast environment setup
alias setup-all="root && pydev && devbox run setup && root && tsdev && devbox run install && root && nudev && devbox run setup"
```

### Custom Commands & Scripts
```bash
# Intelligence dashboard shortcuts
alias intel="nu dev-env/nushell/scripts/performance-analytics.nu dashboard"
alias perf="nu dev-env/nushell/scripts/performance-analytics.nu report --days 7"
alias resources="nu dev-env/nushell/scripts/resource-monitor.nu optimize"
alias security="nu dev-env/nushell/scripts/security-scanner.nu scan-all"
alias deps="nu dev-env/nushell/scripts/dependency-monitor.nu report --format summary"

# Quick validation and testing
alias validate="nu scripts/validate-all.nu --parallel"
alias quick-test="validate && echo '🎉 All environments validated successfully!'"
alias full-check="intel && validate && perf"

# Development session shortcuts
alias morning-check="env-health && deps && security"
alias pre-commit="validate && echo '✅ Ready to commit'"
alias post-work="intel && resources"
```

### Personal Productivity Shortcuts
```bash
# IDE shortcuts for each environment
alias code-py="code dev-env/python/src"
alias code-ts="code dev-env/typescript/src"
alias code-rust="code dev-env/rust/src"
alias code-go="code dev-env/go/cmd"
alias code-nu="code dev-env/nushell/scripts"
alias code-all="code ."

# Documentation and config editing
alias edit-claude="code CLAUDE.md"
alias edit-local="code CLAUDE.local.md"
alias edit-hooks="code .claude/settings.json"

# Log analysis shortcuts
alias logs-perf="tail -f dev-env/nushell/logs/performance.log"
alias logs-security="tail -f dev-env/nushell/logs/security.log"
alias logs-hooks="tail -f ~/.claude/notifications.log"

# Git workflow enhancements
alias gst="git status"
alias glog="git log --oneline --graph --decorate -10"
alias gdiff="git diff --name-only"
alias gcommit="pre-commit && git commit"
```

## Environment Customizations

### Personal Devbox Packages
```toml
# Additional packages for enhanced polyglot development
# Add these to environment devbox.json files as needed:

# Cross-language development tools
packages = [
  "ripgrep",        # Fast searching across all codebases
  "fd",             # Fast file finding
  "bat",            # Syntax-highlighted cat
  "delta",          # Better git diffs
  "exa",            # Modern ls replacement
  "zoxide",         # Smart cd replacement
  "fzf",            # Fuzzy finder
  "jq",             # JSON processing
  "yq",             # YAML processing
  "hyperfine",      # Command benchmarking
  "tokei",          # Code statistics
  "procs",          # Modern ps replacement
]

# Language-specific enhancements
python_extras = ["ipython", "rich", "typer"]  # Better REPL and CLI tools
rust_extras = ["cargo-watch", "cargo-edit"]   # Development helpers
go_extras = ["delve", "air"]                  # Debugger and live reload
node_extras = ["npm-check-updates"]           # Dependency management
```

### Local Environment Variables
```bash
# Personal environment configuration for zsh
export EDITOR="code"
export BROWSER="firefox"
export TERM="xterm-256color"

# Polyglot development optimization
export RUST_BACKTRACE=1
export PYTHONPATH="/Users/cedric/dev/github.com/polyglot-devenv/dev-env/python/src"
export GOPATH="/Users/cedric/go"
export NODE_ENV="development"

# Claude Code and intelligence systems
export CLAUDE_PROJECT_ROOT="/Users/cedric/dev/github.com/polyglot-devenv"
export CLAUDE_PERFORMANCE_LOG="true"
export CLAUDE_RESOURCE_MONITOR="true"

# Development tools
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export BAT_THEME="Sublime Snazzy"
export DELTA_FEATURES="+side-by-side"

# Personal productivity
export HISTSIZE=100000
export HISTFILESIZE=100000
export PROMPT_COMMAND="history -a"
```

### Custom Shell Configuration
```bash
# Zsh customizations for polyglot development
# Add to ~/.zshrc

# Claude project navigation
cdclaude() {
    cd /Users/cedric/dev/github.com/polyglot-devenv
    echo "📁 Claude Polyglot Environment"
    echo "🐍 Python: cd dev-env/python"
    echo "📘 TypeScript: cd dev-env/typescript" 
    echo "🦀 Rust: cd dev-env/rust"
    echo "🐹 Go: cd dev-env/go"
    echo "🐚 Nushell: cd dev-env/nushell"
}

# Environment-aware prompt additions
claude_env_info() {
    if [[ $PWD == *"dev-env/python"* ]]; then echo "🐍 PY"
    elif [[ $PWD == *"dev-env/typescript"* ]]; then echo "📘 TS"
    elif [[ $PWD == *"dev-env/rust"* ]]; then echo "🦀 RS"
    elif [[ $PWD == *"dev-env/go"* ]]; then echo "🐹 GO"
    elif [[ $PWD == *"dev-env/nushell"* ]]; then echo "🐚 NU"
    elif [[ $PWD == *"polyglot-devenv"* ]]; then echo "🤖 CLAUDE"
    fi
}

# Nushell configuration enhancements
# Add to dev-env/nushell/config/config.nu
$env.config.table.mode = "rounded"
$env.config.completions.quick = true
$env.config.history.max_size = 100_000
$env.config.show_banner = false

# Custom Nushell aliases
alias ll = ls -la
alias tree = ls | where type == dir | each { |it| ls $it.name }
alias performance = nu scripts/performance-analytics.nu dashboard
alias monitor = nu scripts/resource-monitor.nu watch --interval 30
```

## Learning & Development Resources

### Personal Bookmarks

#### Programming Resources
- **Python Advanced**: [Real Python](https://realpython.com/), [Python Tricks](https://realpython.com/python-tricks/), [Effective Python](https://effectivepython.com/)
- **TypeScript/JavaScript**: [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/), [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS), [Awesome TypeScript](https://github.com/dzharii/awesome-typescript)
- **Rust Resources**: [The Rust Book](https://doc.rust-lang.org/book/), [Rust by Example](https://doc.rust-lang.org/rust-by-example/), [Awesome Rust](https://github.com/rust-unofficial/awesome-rust)
- **Go Programming**: [Effective Go](https://golang.org/doc/effective_go.html), [Go by Example](https://gobyexample.com/), [Awesome Go](https://github.com/avelino/awesome-go)
- **Nushell Resources**: [Nushell Book](https://www.nushell.sh/book/), [Nushell Cookbook](https://www.nushell.sh/cookbook/), [Think Nu](https://www.nushell.sh/book/thinking_in_nu.html)

#### Polyglot Development
- [Polyglot Programming](https://pragprog.com/book/vmpolyglot/seven-languages-in-seven-weeks)
- [Language Comparison Charts](https://hyperpolyglot.org/)
- [Rosetta Code](http://rosettacode.org/) - Same algorithm in different languages
- [Programming Language Benchmarks](https://benchmarksgame-team.pages.debian.net/benchmarksgame/)

#### Tools & Utilities
- [DevBox Documentation](https://www.jetify.com/devbox/docs/)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Direnv Documentation](https://direnv.net/)
- [Nushell Command Reference](https://www.nushell.sh/commands/)
- [Git Tips and Tricks](https://github.com/git-tips/tips)

#### Documentation & References
- [MDN Web Docs](https://developer.mozilla.org/) - Web standards and APIs
- [Rust Standard Library](https://doc.rust-lang.org/std/) - Comprehensive Rust docs
- [Python Standard Library](https://docs.python.org/3/library/) - Built-in modules
- [Go Standard Library](https://pkg.go.dev/std) - Go packages
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Official TS docs

### Personal Notes & Insights

#### Project-Specific Notes
- **Intelligence Systems**: This project's performance analytics and resource monitoring are incredibly sophisticated - leverage them for debugging performance issues
- **Cross-Language Validation**: The `validate-all.nu` script is comprehensive - use `--parallel` flag for faster feedback during development
- **Hooks Automation**: The Claude Code hooks provide real-time quality assurance - customize notification preferences in `.claude/settings.json`
- **Environment Isolation**: Each language environment is perfectly isolated with devbox - take advantage of this for experimenting with different package versions
- **Nushell Scripts**: The automation scripts in `dev-env/nushell/scripts/` are production-ready - study them for learning advanced Nushell patterns

#### Language-Specific Tips
- **Python**: Use `uv run` exclusively instead of activating virtual environments - it's faster and more reliable in this setup
- **TypeScript**: The strict mode configuration catches many runtime errors early - embrace the type safety
- **Rust**: The ownership system takes time to learn but prevents entire classes of bugs - use `cargo check` frequently during development
- **Go**: Keep interfaces small and focused - the project's style guidelines emphasize this for good reason
- **Nushell**: Data pipelines are the key strength - think in terms of structured data transformations rather than text processing

#### Debugging Insights
- **Performance Issues**: Use `nu dev-env/nushell/scripts/performance-analytics.nu optimize` to get specific recommendations
- **Resource Problems**: The resource monitor can identify memory leaks and CPU bottlenecks across all environments
- **Security Concerns**: Regular security scans help catch issues before they become vulnerabilities
- **Environment Drift**: The drift detection system prevents configuration inconsistencies that cause mysterious bugs
- **Test Failures**: The test intelligence system can identify flaky tests and performance regressions automatically

## Context Engineering Integration

### Workspace vs DevPod Workflows

**Context Engineering** now supports clear separation between development and deployment:

```bash
# Workspace Development (Local PRP Generation)
alias prp-gen="cd context-engineering/workspace && /generate-prp"
alias prp-features="code context-engineering/workspace/features"
alias prp-templates="code context-engineering/workspace/templates"

# DevPod Execution (Containerized PRP Execution)
alias prp-exec-py="/devpod-python && /execute-prp"
alias prp-exec-ts="/devpod-typescript && /execute-prp"
alias prp-exec-rust="/devpod-rust && /execute-prp"
alias prp-exec-go="/devpod-go && /execute-prp"

# Combined Workflows
alias prp-workflow="prp-gen && prp-exec-py"  # Generate then execute in Python DevPod
```

### Personal PRP Development Patterns

```bash
# My typical PRP development flow
personal-prp-workflow() {
    local feature_name=$1
    local environment=${2:-python}
    
    echo "🚀 Starting PRP workflow for $feature_name in $environment environment"
    
    # Step 1: Generate PRP in workspace
    cd context-engineering/workspace
    /generate-prp features/$feature_name.md --env dev-env/$environment
    
    # Step 2: Review generated PRP
    code context-engineering/workspace/PRPs/$feature_name-$environment.md
    
    # Step 3: Execute in appropriate DevPod environment
    case $environment in
        python) /devpod-python && /execute-prp context-engineering/devpod/environments/python/PRPs/$feature_name-python.md ;;
        typescript) /devpod-typescript && /execute-prp context-engineering/devpod/environments/typescript/PRPs/$feature_name-typescript.md ;;
        rust) /devpod-rust && /execute-prp context-engineering/devpod/environments/rust/PRPs/$feature_name-rust.md ;;
        go) /devpod-go && /execute-prp context-engineering/devpod/environments/go/PRPs/$feature_name-go.md ;;
    esac
    
    echo "✅ PRP workflow completed for $feature_name"
}

# Quick PRP commands for daily use
alias quick-py-prp="personal-prp-workflow"  # Default to Python
alias quick-ts-prp="personal-prp-workflow \$1 typescript"
alias quick-rust-prp="personal-prp-workflow \$1 rust"
alias quick-go-prp="personal-prp-workflow \$1 go"
```

### Context Engineering Performance Tracking

```bash
# Personal performance tracking for PRP workflows
track-prp-performance() {
    local prp_file=$1
    local environment=$2
    
    echo "📊 Tracking PRP performance for $prp_file in $environment"
    
    # Measure generation time
    nu dev-env/nushell/scripts/performance-analytics.nu measure "prp-generation" "$prp_file" "/generate-prp $prp_file --env $environment"
    
    # Measure execution time  
    nu dev-env/nushell/scripts/performance-analytics.nu measure "prp-execution" "$prp_file" "/execute-prp $prp_file --validate"
    
    # Generate performance report
    nu dev-env/nushell/scripts/performance-analytics.nu report --format table --filter "prp-*"
}

# PRP-specific monitoring aliases
alias prp-perf="track-prp-performance"
alias prp-metrics="nu dev-env/nushell/scripts/performance-analytics.nu report --filter prp-*"
alias prp-optimize="nu dev-env/nushell/scripts/performance-analytics.nu optimize --filter prp-*"
```

## Local Tools & Automation

### Personal Development Scripts
```bash
# Location: ~/scripts/claude-helpers/

# quick-backup.sh - Backup current work
#!/bin/bash
timestamp=$(date +%Y%m%d_%H%M%S)
tar -czf ~/backups/claude_backup_$timestamp.tar.gz \
    --exclude='*/target/*' \
    --exclude='*/node_modules/*' \
    --exclude='*/.uv-cache/*' \
    --exclude='*/devbox.lock' \
    /Users/cedric/dev/github.com/polyglot-devenv

# env-health-check.nu - Validate all environments with performance tracking
#!/usr/bin/env nu
use dev-env/nushell/common.nu *

def main [] {
    log info "🏥 Running comprehensive environment health check..."
    
    # Performance baseline
    let start_time = (date now)
    
    # Run validations
    nu scripts/validate-all.nu --parallel
    
    # Check intelligence systems
    nu dev-env/nushell/scripts/dependency-monitor.nu scan-all --quiet
    nu dev-env/nushell/scripts/security-scanner.nu scan-all --quiet
    
    # Performance summary
    let duration = ((date now) - $start_time)
    log success $"✅ Health check completed in ($duration)"
}

# performance-summary.py - Daily performance tracking
#!/usr/bin/env python3
import json
import subprocess
from datetime import datetime, timedelta

def get_performance_data():
    """Get last 24 hours of performance data"""
    result = subprocess.run([
        "nu", "dev-env/nushell/scripts/performance-analytics.nu", 
        "report", "--days", "1", "--format", "json"
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        return json.loads(result.stdout)
    return {}

def main():
    data = get_performance_data()
    print(f"📊 Performance Summary - {datetime.now().strftime('%Y-%m-%d')}")
    
    if 'build_times' in data:
        avg_build = data['build_times'].get('average', 0)
        print(f"   Average build time: {avg_build:.2f}s")
    
    if 'test_times' in data:
        avg_test = data['test_times'].get('average', 0)
        print(f"   Average test time: {avg_test:.2f}s")
        
    if 'resource_usage' in data:
        max_memory = data['resource_usage'].get('peak_memory_mb', 0)
        print(f"   Peak memory usage: {max_memory}MB")

if __name__ == "__main__":
    main()
```

### Custom Hooks & Automation
```json
// Additional personal hooks for .claude/settings.json
// These enhance the existing intelligent automation

{
  "PostToolUse": [
    {
      "// Personal Performance Tracking": "Track my individual development patterns",
      "matcher": "Edit|MultiEdit|Write", 
      "hooks": [
        {
          "type": "command",
          "command": "echo \"$(date): File edited by Cedric\" >> ~/.claude/personal-activity.log"
        }
      ]
    }
  ],
  "Notification": [
    {
      "// Personal Notification Preferences": "Custom notification handling for my workflow",
      "hooks": [
        {
          "type": "command", 
          "command": "bash -c 'if [[ \"$(echo \"$0\" | jq -r \".severity // \\\"info\\\"\")\" == \"critical\" ]]; then osascript -e \"display notification \\\"Critical Claude Code Alert\\\" with title \\\"Development Environment\\\"\"; fi'"
        }
      ]
    }
  ]
}
```

### Local Testing & Quality Scripts
```bash
# Personal quality assurance automation that builds on project standards

# my-pre-commit - Enhanced pre-commit checks
#!/bin/bash
echo "🔍 Running Cedric's enhanced pre-commit checks..."

# Standard project validation
validate

# Personal additional checks
echo "📊 Checking performance impact..."
nu dev-env/nushell/scripts/performance-analytics.nu measure "pre-commit" "validation" "validate"

echo "🔐 Running personal security checks..."
nu dev-env/nushell/scripts/security-scanner.nu scan-file "$(git diff --cached --name-only)" --quiet

echo "✅ Enhanced pre-commit checks completed!"

# my-test-all - Comprehensive testing with personal metrics
#!/bin/bash
echo "🧪 Running comprehensive test suite with personal tracking..."

# Test each environment with timing
for env in dev-env/python dev-env/typescript dev-env/rust dev-env/go dev-env/nushell; do
    if [ -d "$env" ]; then
        echo "Testing $env..."
        cd "$env"
        time devbox run test
        cd ..
    fi
done

# Generate personal test report
nu dev-env/nushell/scripts/test-intelligence.nu analyze-trends --days 7

# my-deploy-check - Pre-deployment validation
#!/bin/bash
echo "🚀 Running pre-deployment checks..."

# Full validation
validate

# Security scan
security

# Performance baseline
perf

# Dependency check
deps

echo "✅ Deployment readiness verified!"
```

## IDE & Editor Configuration

### Editor Preferences

#### VS Code Extensions for Polyglot Development
- **Language Support**:
  - Python: Python, Pylance, Python Debugger
  - TypeScript: TypeScript Importer, Auto Import - ES6/TS
  - Rust: rust-analyzer, CodeLLDB, crates
  - Go: Go, Go Outliner
  - Nushell: nushell-vscode-extension
  
- **Polyglot Tools**:
  - GitLens - Git history and blame
  - Thunder Client - API testing
  - REST Client - HTTP requests
  - Bracket Pair Colorizer - Code navigation
  - indent-rainbow - Visual indentation
  - Better Comments - Enhanced comments
  
- **Intelligence Integration**:
  - Claude Code (if available as extension)
  - Performance monitoring integration
  - Error lens for inline diagnostics

#### VS Code Workspace Settings
```json
{
  "files.watcherExclude": {
    "**/target/**": true,
    "**/node_modules/**": true,
    "**/.uv-cache/**": true,
    "**/devbox.lock": true
  },
  "search.exclude": {
    "**/target": true,
    "**/node_modules": true,
    "**/.uv-cache": true
  },
  "python.defaultInterpreterPath": "./dev-env/python/.venv/bin/python",
  "rust-analyzer.linkedProjects": ["./dev-env/rust/Cargo.toml"],
  "go.gopath": "/Users/cedric/go",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.rulers": [88, 100, 120],
  "editor.formatOnSave": true,
  "files.trimTrailingWhitespace": true
}
```

### Local Development Tools

#### Terminal Configuration
- **Terminal**: iTerm2 with Nerd Fonts for icon support
- **Shell**: zsh with Oh My Zsh and powerlevel10k theme
- **Font**: FiraCode Nerd Font for programming ligatures
- **Color Scheme**: Snazzy or Dracula for syntax highlighting
- **Multiplexer**: tmux for session management across environments

#### Git Configuration
```bash
# Personal git aliases for polyglot development
git config --global alias.st 'status'
git config --global alias.co 'checkout'
git config --global alias.br 'branch'
git config --global alias.ci 'commit'
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'

# Enhanced diff and merge tools
git config --global diff.tool 'delta'
git config --global merge.tool 'code'
git config --global core.editor 'code --wait'

# Personal commit message template
git config --global commit.template ~/.gitmessage.txt

# Auto-track performance of git operations
git config --global alias.timed '!f() { time git "$@"; }; f'
```

#### Database Tools
- **PostgreSQL**: Use pgAdmin 4 for GUI management
- **Redis**: Use RedisInsight for visualization
- **SQLite**: Use DB Browser for SQLite
- **MongoDB**: Use MongoDB Compass
- **Local Testing**: Use Docker containers for isolated database testing

## Secrets & Local Configuration

### Environment-Specific Settings
```bash
# Local development configuration patterns
# Store in environment-specific .env files, never commit secrets

# Python environment (.env)
DEBUG=true
LOG_LEVEL=debug
PYTHONDONTWRITEBYTECODE=1
PYTHONUNBUFFERED=1
UV_CACHE_DIR=/Users/cedric/.cache/uv

# TypeScript environment (.env.local)
NODE_ENV=development
DEBUG=true
HOT_RELOAD=true
TYPESCRIPT_STRICT=true

# Rust environment (.env)
RUST_BACKTRACE=full
RUST_LOG=debug
CARGO_TARGET_DIR=/Users/cedric/.cache/cargo-target

# Go environment (.env)
GO_ENV=development
CGO_ENABLED=1
GOPROXY=https://proxy.golang.org,direct

# Nushell environment (.env)
NU_LOG_LEVEL=debug
NU_PLUGIN_DIRS=/Users/cedric/.local/share/nushell/plugins
NUSHELL_PERF_MODE=true
```

### Personal API Keys & Credentials
```bash
# Secret management using environment variables and 1Password CLI

# GitHub integration
export GITHUB_TOKEN="$(op item get "GitHub Personal Token" --fields password)"
export GH_TOKEN="$GITHUB_TOKEN"

# Claude Code API (if applicable)
export CLAUDE_API_KEY="$(op item get "Claude API Key" --fields password)"

# Development databases
export DEV_DB_PASSWORD="$(op item get "Local PostgreSQL" --fields password)"
export REDIS_PASSWORD="$(op item get "Local Redis" --fields password)"

# External APIs for testing
export TEST_API_KEY="$(op item get "Test API Key" --fields password)"

# Performance monitoring keys
export DATADOG_API_KEY="$(op item get "Datadog API" --fields password)"
export NEW_RELIC_LICENSE_KEY="$(op item get "New Relic" --fields password)"

# Backup and sync
export BACKUP_ENCRYPTION_KEY="$(op item get "Backup Encryption" --fields password)"
```

### Local Service Configuration

#### Local Databases
- **PostgreSQL**: Running on port 5432, database `claude_dev`
- **Redis**: Running on port 6379, used for caching and session storage
- **MongoDB**: Running on port 27017, used for document storage testing
- **SQLite**: Local files in `~/databases/` for lightweight testing

#### External Services
- **Local API Gateway**: nginx proxy on port 8080 for API testing
- **Mock Services**: JSON Server on port 3001 for API mocking
- **Webhook Testing**: ngrok tunnels for webhook development
- **Container Registry**: Local Docker registry on port 5000

## Performance & Optimization

### Personal Performance Tuning
```bash
# Individual performance optimizations for each environment

# Python optimizations
export PYTHONOPTIMIZE=1
export PYTHONDONTWRITEBYTECODE=1
export UV_CONCURRENT_DOWNLOADS=10
export UV_CACHE_SIZE=10GB

# Node.js/TypeScript optimizations  
export NODE_OPTIONS="--max-old-space-size=4096"
export npm_config_cache="/Users/cedric/.cache/npm"
export npm_config_progress=false

# Rust optimizations
export CARGO_BUILD_JOBS=8
export CARGO_TARGET_DIR="/Users/cedric/.cache/cargo-target"
export RUSTC_WRAPPER="sccache"  # Compilation caching

# Go optimizations
export GOCACHE="/Users/cedric/.cache/go-build"
export GOMODCACHE="/Users/cedric/.cache/go-mod"
export GOMAXPROCS=8

# Nushell optimizations
export NU_HISTORY_SIZE=100000
export NU_COMPLETION_CACHE=true
export NU_PLUGIN_CACHE=true

# System optimizations
ulimit -n 65536  # Increase file descriptor limit
export MAKEFLAGS="-j8"  # Parallel make builds
```

### Local Monitoring & Metrics
```bash
# Personal development metrics using existing infrastructure

# Daily performance tracking
daily-metrics() {
    echo "📊 Daily Development Metrics - $(date)"
    echo "=================================="
    
    # Build performance
    nu dev-env/nushell/scripts/performance-analytics.nu report --days 1 --format table
    
    # Resource usage
    nu dev-env/nushell/scripts/resource-monitor.nu report --hours 24
    
    # Test intelligence
    nu dev-env/nushell/scripts/test-intelligence.nu analyze-trends --days 1
    
    # Security summary
    nu dev-env/nushell/scripts/security-scanner.nu report --days 1 --format summary
}

# Real-time monitoring dashboard
live-monitor() {
    echo "🔴 Starting live development monitoring..."
    
    # Start resource monitoring
    nu dev-env/nushell/scripts/resource-monitor.nu watch --interval 30 &
    
    # Start performance tracking
    nu dev-env/nushell/scripts/performance-analytics.nu monitor &
    
    # Monitor system resources
    top -u &
    
    echo "Press Ctrl+C to stop monitoring"
    wait
}

# Weekly performance review
weekly-review() {
    echo "📈 Weekly Performance Review - $(date)"
    echo "======================================"
    
    # Performance trends
    nu dev-env/nushell/scripts/performance-analytics.nu report --days 7 --format detailed
    
    # Resource optimization recommendations
    nu dev-env/nushell/scripts/resource-monitor.nu optimize
    
    # Dependency health check
    nu dev-env/nushell/scripts/dependency-monitor.nu report --days 7
    
    # Generate improvement suggestions
    echo "💡 Personal Optimization Recommendations:"
    echo "   - Review slowest build times and optimize"
    echo "   - Check for memory leaks in long-running processes"
    echo "   - Update dependencies with security fixes"
    echo "   - Archive old logs and clear caches"
}
```

## Troubleshooting & Debugging

### Personal Debugging Techniques

#### Common Issues & Solutions
- **Environment Not Loading**: Run `devbox shell --pure` to reset environment state
- **Package Conflicts**: Use `devbox update` followed by `devbox clean` to refresh packages  
- **Performance Degradation**: Check `nu dev-env/nushell/scripts/performance-analytics.nu optimize` for specific recommendations
- **Test Failures**: Use `nu dev-env/nushell/scripts/test-intelligence.nu detect-flaky --environment <env>` to identify flaky tests
- **Memory Issues**: Monitor with `nu dev-env/nushell/scripts/resource-monitor.nu watch` to identify memory leaks
- **Build Slowness**: Check compiler/build caching and consider parallel builds

#### Debugging Tools & Commands
```bash
# Language-specific debugging
debug-python() {
    cd dev-env/python
    echo "🐍 Python debugging session"
    echo "PYTHONPATH: $PYTHONPATH"
    echo "Virtual env: $(which python)"
    python -c "import sys; print('Python version:', sys.version)"
    uv pip list | head -10
}

debug-typescript() {
    cd dev-env/typescript  
    echo "📘 TypeScript debugging session"
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "TypeScript version: $(npx tsc --version)"
    npm list --depth=0 | head -10
}

debug-rust() {
    cd dev-env/rust
    echo "🦀 Rust debugging session"
    echo "Rust version: $(rustc --version)"
    echo "Cargo version: $(cargo --version)"
    echo "Target dir: $CARGO_TARGET_DIR"
    cargo tree | head -10
}

debug-go() {
    cd dev-env/go
    echo "🐹 Go debugging session"
    echo "Go version: $(go version)"
    echo "GOPATH: $GOPATH"
    echo "GOPROXY: $GOPROXY"
    go list -m all | head -10
}

debug-nushell() {
    cd dev-env/nushell
    echo "🐚 Nushell debugging session"
    echo "Nu version: $(nu --version)"
    echo "Config dir: $NUSHELL_CONFIG_DIR"
    echo "Plugin dirs: $NU_PLUGIN_DIRS"
    ls scripts/ | where type == file
}

# System-level debugging
debug-system() {
    echo "💻 System debugging information"
    echo "================================"
    echo "OS: $(uname -a)"
    echo "Shell: $SHELL"
    echo "Memory: $(free -h 2>/dev/null || vm_stat)"
    echo "Disk space: $(df -h . | tail -1)"
    echo "Load average: $(uptime)"
    echo "Devbox version: $(devbox version)"
}

# Performance debugging
debug-performance() {
    echo "⚡ Performance debugging"
    echo "======================="
    
    # Check recent performance data
    nu dev-env/nushell/scripts/performance-analytics.nu report --days 1
    
    # Resource usage
    nu dev-env/nushell/scripts/resource-monitor.nu report --hours 1
    
    # Identify bottlenecks
    echo "🔍 Checking for performance bottlenecks..."
    ps aux | sort -k3 -nr | head -10
}
```

#### Emergency Recovery
```bash
# Emergency recovery procedures

# Complete environment reset
emergency-reset() {
    echo "🚨 Emergency environment reset"
    echo "This will reset ALL environments to clean state"
    read -p "Are you sure? (y/N): " confirm
    
    if [[ $confirm == "y" ]]; then
        echo "Cleaning all environments..."
        
        # Clean each environment
        for env in dev-env/python dev-env/typescript dev-env/rust dev-env/go dev-env/nushell; do
            if [ -d "$env" ]; then
                echo "Cleaning $env..."
                cd "$env"
                devbox clean
                cd ..
            fi
        done
        
        # Reinstall everything
        setup-all
        
        echo "✅ Emergency reset completed"
    fi
}

# Quick backup before risky operations
emergency-backup() {
    echo "💾 Creating emergency backup..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Backup current work
    tar -czf ~/emergency_backup_$timestamp.tar.gz \
        --exclude='*/target/*' \
        --exclude='*/node_modules/*' \
        --exclude='*/.uv-cache/*' \
        .
    
    echo "✅ Backup created: ~/emergency_backup_$timestamp.tar.gz"
}

# Restore from backup
emergency-restore() {
    echo "🔄 Available emergency backups:"
    ls -la ~/emergency_backup_*.tar.gz 2>/dev/null || echo "No backups found"
    
    read -p "Enter backup filename to restore: " backup_file
    
    if [ -f "$backup_file" ]; then
        emergency-backup  # Backup current state first
        tar -xzf "$backup_file"
        echo "✅ Restored from backup"
    else
        echo "❌ Backup file not found"
    fi
}

# Network connectivity check
debug-network() {
    echo "🌐 Network connectivity check"
    echo "============================="
    
    # Check internet connectivity
    ping -c 3 8.8.8.8 && echo "✅ Internet: OK" || echo "❌ Internet: FAILED"
    
    # Check package repositories
    curl -s https://pypi.org/simple/ > /dev/null && echo "✅ PyPI: OK" || echo "❌ PyPI: FAILED"
    curl -s https://registry.npmjs.org/ > /dev/null && echo "✅ NPM: OK" || echo "❌ NPM: FAILED"
    curl -s https://crates.io/ > /dev/null && echo "✅ Crates.io: OK" || echo "❌ Crates.io: FAILED"
    curl -s https://pkg.go.dev/ > /dev/null && echo "✅ Go modules: OK" || echo "❌ Go modules: FAILED"
}
```

### Personal Support Resources

#### Development Community
- **Python**: r/Python, Python Discord, Real Python Community
- **TypeScript**: TypeScript Community Discord, r/typescript
- **Rust**: Rust Users Forum, Rust Discord, r/rust
- **Go**: Go Community, Gophers Slack, r/golang  
- **Nushell**: Nushell Discord, GitHub Discussions
- **Polyglot**: Programming Language Theory discussions, Software Engineering communities

#### Emergency Contacts & Resources
- **Stack Overflow**: Detailed questions with polyglot tag combinations
- **GitHub Issues**: Direct issues on relevant project repositories
- **Discord/Slack**: Real-time help from language communities
- **Documentation**: Always start with official language documentation
- **Performance Issues**: Use built-in intelligence systems first, then community resources

#### Personal Learning Path
- **Weekly Goals**: Focus on one language deep-dive per week while maintaining others
- **Monthly Reviews**: Assess progress using performance analytics and resource monitoring
- **Quarterly Planning**: Evaluate and update personal tools and workflows
- **Continuous Learning**: Follow language release notes and ecosystem updates

---

*Last updated: $(date)*
*Personal configuration for sophisticated polyglot development environment*
*Leverages intelligent monitoring, performance analytics, and automated quality gates*