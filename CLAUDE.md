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
├── devpod-automation/  # DevPod containerized development
│   ├── scripts/        # Provisioning and management scripts
│   ├── templates/      # Language-specific devcontainer templates
│   ├── config/         # Docker provider configuration
│   └── README.md       # DevPod automation documentation
├── context-engineering/  # Context Engineering framework
│   ├── templates/      # PRP templates for all environments
│   ├── PRPs/           # Generated Product Requirements Prompts
│   ├── examples/       # Example PRPs and implementations
│   └── docs/           # Integration and usage documentation
├── .claude/            # Claude Code configuration
│   ├── commands/       # Custom slash commands (including /generate-prp, /execute-prp)
│   ├── install-hooks.sh           # Hooks installation script
│   └── settings.json              # Project-specific settings
├── CLAUDE.md           # This file (project standards)
└── CLAUDE.local.md     # Personal configurations (gitignored)
```

## Quick Setup & Core Commands

### Essential Commands by Environment
| Environment | Enter | Install | Format | Lint | Test | DevPod (Single) | DevPod (Multi) | Context Engineering |
|-------------|-------|---------|--------|------|------|-----------------|----------------|---------------------|
| Python | `cd python-env && devbox shell` | `devbox run install` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-python` | `/devpod-python 3` | `/generate-prp feature.md --env python-env` |
| TypeScript | `cd typescript-env && devbox shell` | `devbox run install` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-typescript` | `/devpod-typescript 2` | `/generate-prp feature.md --env typescript-env` |
| Rust | `cd rust-env && devbox shell` | `devbox run build` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-rust` | `/devpod-rust 4` | `/generate-prp feature.md --env rust-env` |
| Go | `cd go-env && devbox shell` | `devbox run build` | `devbox run format` | `devbox run lint` | `devbox run test` | `/devpod-go` | `/devpod-go 5` | `/generate-prp feature.md --env go-env` |
| Nushell | `cd nushell-env && devbox shell` | `devbox run setup` | `devbox run format` | `devbox run check` | `devbox run test` | `devbox run devpod:provision` | *N/A* | `/generate-prp feature.md --env nushell-env` |

> **DevPod Enhancement**: New parameterized Claude Code commands allow provisioning multiple isolated workspaces: `/devpod-python 3` creates 3 unique Python environments with automatic VS Code integration.

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

## DevPod Containerized Development

This environment includes comprehensive DevPod automation for containerized development workflows, providing isolated, reproducible development environments using Docker containers.

### Quick DevPod Setup
```bash
# Complete DevPod setup (install + configure + optimize) - first time only
nu devpod-automation/scripts/docker-setup.nu --install --configure --optimize

# Check DevPod status
nu devpod-automation/scripts/docker-setup.nu --status
```

### 🚀 **NEW: Parameterized DevPod Commands**

```bash
# Single workspace per language (default behavior)
/devpod-python           # 1 Python workspace
/devpod-typescript       # 1 TypeScript workspace  
/devpod-rust             # 1 Rust workspace
/devpod-go               # 1 Go workspace

# Multiple workspaces for parallel development
/devpod-python 3         # 3 Python workspaces
/devpod-typescript 2     # 2 TypeScript workspaces
/devpod-rust 4           # 4 Rust workspaces
/devpod-go 5             # 5 Go workspaces

# Alternative: Traditional devbox commands (creates 1 workspace)
cd python-env && devbox run devpod:provision    # Creates polyglot-python-devpod-YYYYMMDD-HHMMSS
cd typescript-env && devbox run devpod:provision
cd rust-env && devbox run devpod:provision
cd go-env && devbox run devpod:provision
cd nushell-env && devbox run devpod:provision

# Manage workspaces
devpod list                                     # See all workspaces across languages
devpod stop <workspace-name>                   # Stop specific workspace
bash devpod-automation/scripts/provision-all.sh clean-all  # Clean up old workspaces
devbox run devpod:sync       # Sync environment changes
```

### DevPod Automation Features

| Feature | Description | Usage | Enhancement |
|---------|-------------|-------|-------------|
| **Parameterized Provisioning** | Create multiple workspaces with count parameter | `/devpod-python 3` | **🆕 NEW** |
| **Automated Provisioning** | One-command workspace creation | `devbox run devpod:provision` | ✅ Enhanced |
| **Language-Specific Templates** | Optimized devcontainer configs per language | Automatic template selection | ✅ Enhanced |
| **Workspace Lifecycle** | Complete container management | `devbox run devpod:start/stop/delete` | ✅ Enhanced |
| **Environment Sync** | Bidirectional Devbox ↔ DevPod sync | `devbox run devpod:sync` | ✅ Enhanced |
| **Performance Optimization** | Docker caching and resource tuning | Automatic via `docker-setup.nu` | ✅ Enhanced |
| **IDE Integration** | VS Code with extensions and settings | Automatic per workspace | ✅ Enhanced |

### 🎯 **NEW: Claude Code DevPod Commands**

| Command | Parameters | Description | Workspace Naming |
|---------|------------|-------------|------------------|
| **`/devpod-python [count]`** | count: 1-10 (default: 1) | Provision Python environments | `polyglot-python-devpod-YYYYMMDD-HHMMSS-N` |
| **`/devpod-typescript [count]`** | count: 1-10 (default: 1) | Provision TypeScript environments | `polyglot-typescript-devpod-YYYYMMDD-HHMMSS-N` |
| **`/devpod-rust [count]`** | count: 1-10 (default: 1) | Provision Rust environments | `polyglot-rust-devpod-YYYYMMDD-HHMMSS-N` |
| **`/devpod-go [count]`** | count: 1-10 (default: 1) | Provision Go environments | `polyglot-go-devpod-YYYYMMDD-HHMMSS-N` |

**Key Features:**
- 🔢 **Parameterized Count**: Provision 1-10 workspaces per command
- 🏷️ **Unique Naming**: Timestamp + sequence number for complete isolation
- ⚡ **Parallel Support**: Multiple environments for testing, experimentation, collaboration
- 🛡️ **Safety Limits**: Maximum 10 workspaces to prevent resource exhaustion
- 📊 **Progress Tracking**: Real-time feedback during provisioning
- 🔧 **Auto VS Code**: Each workspace automatically opens VS Code

### 🎯 **Use Cases & Examples**

**Single Development Environment:**
```bash
/devpod-python          # Quick single Python workspace
/devpod-rust            # Quick single Rust workspace
```

**Parallel Development:**
```bash
/devpod-python 3        # 3 Python workspaces for:
                        # - Feature development
                        # - Bug fixes  
                        # - Experimentation
```

**Team Collaboration:**
```bash
/devpod-typescript 2    # 2 TypeScript workspaces for:
                        # - Frontend components
                        # - Backend API development
```

**Testing & Validation:**
```bash
/devpod-rust 4          # 4 Rust workspaces for:
                        # - Different dependency versions
                        # - Performance comparisons
                        # - Feature branches
                        # - Integration testing
```

### 🚀 DevPod Unique Workspace Creation

**Every workspace gets a unique identifier:**
- **Format**: `polyglot-{language}-devpod-{YYYYMMDD-HHMMSS}-{N}`
- **Examples**:
  - `polyglot-python-devpod-20250706-225233-1`
  - `polyglot-python-devpod-20250706-225239-2`
  - `polyglot-python-devpod-20250706-225245-3`

**Workspace Features:**
- 🔧 **Auto VS Code**: Each workspace automatically opens VS Code
- 🔌 **SSH Access**: Direct container access via `ssh workspace-name.devpod`
- 🏷️ **Language-Specific Extensions**: Pre-configured for optimal development
- 📦 **Complete Isolation**: Independent containers with no conflicts
- 🚀 **Fast Provisioning**: Optimized Docker caching for speed  
- `devbox run devpod:delete` - Lists available workspaces to delete
- `devbox run devpod:connect` - Guidance to use provision for new workspaces

### 🎯 Three Ways to Use DevPod

```bash
# Method 1: Direct script execution
bash devpod-automation/scripts/provision-python.sh
bash devpod-automation/scripts/provision-typescript.sh
bash devpod-automation/scripts/provision-rust.sh
bash devpod-automation/scripts/provision-go.sh
bash devpod-automation/scripts/provision-nushell.sh

# Method 2: From within environments (most convenient)
cd python-env && devbox run devpod:provision
cd typescript-env && devbox run devpod:provision
cd rust-env && devbox run devpod:provision
cd go-env && devbox run devpod:provision
cd nushell-env && devbox run devpod:provision

# Method 3: Using the management script
bash devpod-automation/scripts/provision-all.sh status     # Check all
bash devpod-automation/scripts/provision-all.sh provision  # Interactive setup
bash devpod-automation/scripts/provision-all.sh list       # Show all scripts
```

### 🧹 Workspace Management

```bash
# Check all your workspaces
devpod list

# Check language-specific workspaces
cd python-env && devbox run devpod:status
cd typescript-env && devbox run devpod:status
cd rust-env && devbox run devpod:status
cd go-env && devbox run devpod:status
cd nushell-env && devbox run devpod:status

# Clean up old workspaces when needed
bash devpod-automation/scripts/provision-all.sh clean-all

# Stop specific workspaces
devpod stop polyglot-python-devpod-20250706-223016
devpod list  # Find workspace names first

# Delete specific workspaces  
devpod delete polyglot-python-devpod-20250706-223016
```

### 🎯 Workflow Benefits

- **🔄 Fresh Environment** - Each provision gives you a completely clean container
- **🧪 Experimentation** - Test different configurations without affecting other workspaces  
- **🛡️ Isolation** - Complete isolation between different development sessions
- **🚀 Fast Setup** - Same fast provisioning, but with unique containers each time
- **📊 Tracking** - Easy to track which workspace is which via timestamps
- **🧹 Easy Cleanup** - Clean up old workspaces when no longer needed

## Context Engineering Framework

This environment includes a comprehensive context engineering framework that provides structured, template-based feature development with AI-optimized practices.

### Quick Context Engineering Setup
```bash
# PHASE 1: PRP Generation (Native Environment)
/generate-prp features/user-api.md --env python-env        # Generate comprehensive PRP
/generate-prp features/monitoring.md --env multi           # Cross-environment feature

# PHASE 2: DevPod Provisioning (Prepare Execution Environment)
cd python-env && devbox run devpod:provision               # Create isolated workspace
devbox run devpod:connect                                  # Connect VS Code to container

# PHASE 3: PRP Execution (Inside DevPod Container)
/execute-prp context-engineering/PRPs/user-api-python.md --validate

# Environment-specific examples
/generate-prp features/api-endpoint.md --env python-env     # FastAPI patterns
/generate-prp features/web-component.md --env typescript-env # React/Vue patterns  
/generate-prp features/cli-tool.md --env rust-env          # Clap + async patterns
/generate-prp features/microservice.md --env go-env        # Context + interfaces
/generate-prp features/automation.md --env nushell-env     # Pipeline automation
```

### Context Engineering Features

| Feature | Description | Usage |
|---------|-------------|-------|
| **PRP Generation** | Create comprehensive implementation prompts | `/generate-prp <feature-file> --env <environment>` |
| **PRP Execution** | Implement features with validation loops | `/execute-prp <prp-file> --validate --monitor` |
| **Multi-Language Templates** | Environment-specific PRP templates | Automatic template selection based on target |
| **Cross-Environment Support** | Handle features spanning multiple environments | `--env multi` for polyglot features |
| **Validation Integration** | Leverage existing hooks and quality gates | Automatic integration with devbox tooling |
| **Performance Tracking** | Monitor implementation performance | Built-in analytics and optimization |

### Context Engineering Commands

| Command | Purpose | Example |
|---------|---------|---------|
| **`/generate-prp`** | Generate comprehensive PRPs | `/generate-prp features/api.md --env python-env` |
| **`/execute-prp`** | Execute PRPs with validation | `/execute-prp context-engineering/PRPs/api-python.md` |

### Template Structure

```
context-engineering/
├── templates/
│   ├── prp_base.md           # Polyglot base template
│   ├── python_prp.md         # FastAPI, uv, async patterns
│   ├── typescript_prp.md     # Node.js, strict mode, Jest
│   ├── rust_prp.md           # Tokio, serde, ownership patterns
│   ├── go_prp.md             # Context, interfaces, simplicity
│   └── nushell_prp.md        # Structured data, automation
├── PRPs/                     # Generated implementation prompts
├── examples/                 # Reference implementations
│   └── python-api-example.md # Complete FastAPI example
└── docs/                     # Integration and usage guides
```

### Environment-Specific Context Engineering

**Python Environment**:
- FastAPI patterns with async/await
- SQLAlchemy async ORM integration
- uv package management exclusively
- Pydantic v2 for data validation
- pytest-asyncio for testing

**TypeScript Environment**:
- Strict TypeScript with no `any` types
- Modern Node.js patterns with ES modules
- Jest testing with comprehensive coverage
- ESLint and Prettier integration
- Result patterns for error handling

**Rust Environment**:
- Async-first with Tokio runtime
- Memory safety and ownership patterns
- serde for serialization
- Custom error types with thiserror
- Comprehensive testing with cargo

**Go Environment**:
- Context for cancellation and timeouts
- Small, focused interfaces
- Explicit error handling
- Table-driven tests
- Simple, readable code patterns

**Nushell Environment**:
- Structured data processing
- Type safety with parameter hints
- Cross-environment orchestration
- Pipeline-oriented function design
- Automation and DevOps workflows

### PRP Generation vs Execution Workflow

**PRP Generation** (Native Environment):
- 🧠 **Research & Planning** - Generate comprehensive PRPs with full context
- 📊 **Codebase Analysis** - Deep analysis of existing patterns and dependencies
- 🔍 **External Research** - WebSearch for documentation and best practices
- 📝 **Template Application** - Environment-specific PRP generation

**PRP Execution** (DevPod Remote Environment):
- 🐳 **Isolated Implementation** - Clean containerized development environment
- ⚡ **Focused Development** - Distraction-free coding with all context provided
- 🛡️ **Environment Safety** - No host system pollution during implementation
- 📦 **Reproducible Results** - Consistent execution across different machines

### Integration Benefits

**Development Workflow**:
- 🚀 **Structured Development** - Comprehensive PRPs with all necessary context
- 🔄 **Dual-Environment Approach** - Generation in native, execution in containers
- 📦 **Complete Implementation** - One-pass feature implementation with validation
- ⚡ **Integrated Tooling** - Seamless integration with existing hooks and automation

**Quality Assurance**:
- ✅ **Validation Gates** - Automatic quality checks per environment
- 🧪 **Comprehensive Testing** - Testing patterns included in all templates
- 📊 **Performance Tracking** - Built-in performance monitoring and optimization
- 🔍 **Security Integration** - Security scanning and validation included

**Cross-Environment Support**:
- 🌐 **Polyglot Features** - Support for features spanning multiple languages
- 🔗 **Integration Points** - Clear patterns for cross-environment communication
- 📈 **Monitoring** - Unified monitoring across all environments
- 🛡️ **Security** - Consistent security patterns across languages

### 🔗 Seamless Environment Integration

The framework seamlessly integrates with your existing polyglot environment, leveraging all the automation scripts, hooks, and intelligence systems you've already built. It provides a structured approach to feature development that ensures consistency, quality, and comprehensive context for AI-assisted implementation.

**Integrated Systems**:
- ✅ **DevPod Automation** - PRPs can target containerized environments  
- ✅ **Claude Code Hooks** - Automatic validation and quality gates
- ✅ **Performance Analytics** - Built-in monitoring and optimization
- ✅ **Security Scanning** - Integrated security analysis and patterns
- ✅ **Cross-Language Support** - Unified patterns across all environments
- ✅ **Intelligence Systems** - Leverages existing resource monitoring and analytics

> **Getting Started**: See `context-engineering/docs/integration-guide.md` for comprehensive usage instructions and examples.

### DevPod Commands by Environment

| Action | Python | TypeScript | Rust | Go | Nushell |
|--------|--------|------------|------|----|---------| 
| **Provision** | `devbox run devpod:provision` | `devbox run devpod:provision` | `devbox run devpod:provision` | `devbox run devpod:provision` | `devbox run devpod:provision` |
| **Connect** | `devbox run devpod:connect` | `devbox run devpod:connect` | `devbox run devpod:connect` | `devbox run devpod:connect` | `devbox run devpod:connect` |
| **Start** | `devbox run devpod:start` | `devbox run devpod:start` | `devbox run devpod:start` | `devbox run devpod:start` | `devbox run devpod:start` |
| **Stop** | `devbox run devpod:stop` | `devbox run devpod:stop` | `devbox run devpod:stop` | `devbox run devpod:stop` | `devbox run devpod:stop` |
| **Status** | `devbox run devpod:status` | `devbox run devpod:status` | `devbox run devpod:status` | `devbox run devpod:status` | `devbox run devpod:status` |
| **Sync** | `devbox run devpod:sync` | `devbox run devpod:sync` | `devbox run devpod:sync` | `devbox run devpod:sync` | `devbox run devpod:sync` |

### DevPod Workspace Management
```bash
# Management script operations (recommended)
bash devpod-automation/scripts/provision-all.sh status     # Check all workspace status
bash devpod-automation/scripts/provision-all.sh provision  # Interactive provisioning
bash devpod-automation/scripts/provision-all.sh list       # Show all available scripts
bash devpod-automation/scripts/provision-all.sh stop-all   # Stop all running workspaces
bash devpod-automation/scripts/provision-all.sh clean-all  # Delete all workspaces

# Advanced Nushell operations (optional)
nu devpod-automation/scripts/devpod-manage.nu list                    # List all workspaces
nu devpod-automation/scripts/devpod-manage.nu status --all            # Check all workspace status
nu devpod-automation/scripts/devpod-manage.nu cleanup --all           # Clean up unused workspaces

# Environment synchronization
nu devpod-automation/scripts/devpod-sync.nu --auto                    # Auto-sync mode (watch for changes)
nu devpod-automation/scripts/devpod-sync.nu --recreate               # Force recreate workspaces after sync
```

### Docker Provider Optimization
```bash
# Complete Docker setup and optimization
nu devpod-automation/scripts/docker-setup.nu --install --configure --optimize

# Performance monitoring and tuning
nu devpod-automation/scripts/docker-setup.nu --status               # Check Docker provider status
docker system df                                                    # Check Docker resource usage
docker system prune -af                                            # Clean up unused resources

# Cache volume management
docker volume ls | grep devpod                                     # List DevPod cache volumes
docker volume create devpod-npm-cache                              # Create additional cache volumes
```

### DevContainer Templates

The automation system includes optimized devcontainer templates for each language:

- **Base Template**: Common VS Code extensions and settings
- **Python**: Python 3.12, uv package manager, debugging support
- **TypeScript**: Node.js 20, TypeScript strict mode, hot reload
- **Rust**: Latest Rust toolchain, rust-analyzer, debugging with CodeLLDB
- **Go**: Go 1.22, delve debugger, air for live reload
- **Nushell**: Nushell environment with automation tools
- **Full-Stack**: Multi-language template for complex projects

### Integration Benefits

**Development Workflow**:
- 🚀 **Instant Setup** - Zero-configuration development environments
- 🔄 **Environment Consistency** - Identical development experience across machines
- 📦 **Dependency Isolation** - Containers prevent host system pollution
- ⚡ **Performance** - Optimized Docker caching and resource allocation

**CI/CD Integration**:
- ✅ **Reproducible Builds** - Same container environment for dev and CI
- 🧪 **Test Isolation** - Clean test environments for each run
- 📊 **Resource Control** - Predictable resource usage and limits
- 🔍 **Debugging** - Full debugging capabilities in containerized environment

> **Performance Note**: DevPod workspaces use optimized Docker configurations with build caching, volume mounts for package caches, and resource limits tuned for development workflows.

## 🎯 Complete Development Workflow Summary

This polyglot environment now provides three integrated development approaches:

### 🏠 **Native Development** (Devbox)
```bash
cd python-env && devbox shell
devbox run test && devbox run lint
```

### 🐳 **Containerized Development** (DevPod)  
```bash
cd python-env && devbox run devpod:provision  # Creates unique workspace + opens VS Code
devbox run devpod:status                      # Check your workspaces
devpod list                                   # See all workspaces
```

### 🧠 **AI-Assisted Development** (Context Engineering)
```bash
# Phase 1: Generate PRP (Native Environment)
/generate-prp features/api.md --env python-env

# Phase 2: Provision DevPod (Execution Environment) 
cd python-env && devbox run devpod:provision

# Phase 3: Execute PRP (Inside Container)
/execute-prp context-engineering/PRPs/api-python.md --validate
```

### 🔗 **Unified Commands by Environment**

| Environment | Native | DevPod (Single) | DevPod (Multi) | Context Engineering |
|-------------|--------|-----------------|----------------|---------------------|
| **Python** | `devbox run test` | `/devpod-python` | `/devpod-python 3` | `/generate-prp` → `/execute-prp` |
| **TypeScript** | `devbox run test` | `/devpod-typescript` | `/devpod-typescript 2` | `/generate-prp` → `/execute-prp` |
| **Rust** | `devbox run test` | `/devpod-rust` | `/devpod-rust 4` | `/generate-prp` → `/execute-prp` |
| **Go** | `devbox run test` | `/devpod-go` | `/devpod-go 5` | `/generate-prp` → `/execute-prp` |
| **Nushell** | `devbox run test` | `devbox run devpod:provision` | *N/A* | `/generate-prp` → `/execute-prp` |

### 🚀 **Key Benefits**

- **🔄 Flexibility** - Choose your development style: native, containerized (single/multi), or AI-assisted
- **🔢 Parameterized DevPod** - Create 1-10 workspaces per command for parallel development
- **🛡️ Complete Isolation** - Each workspace runs in its own container with unique naming
- **🧠 Comprehensive Context** - Rich planning in native environment with focused execution in containers
- **⚡ Optimized Performance** - Docker caching and intelligent resource management
- **🔗 Seamless Integration** - PRPs work across native and containerized environments
- **📊 Real-time Feedback** - Progress tracking and automatic VS Code integration
- **📊 Unified Monitoring** - Performance analytics track both generation and execution phases
- **🧹 Clean Workflows** - Native planning without host pollution during implementation

> **Getting Started**: Use any approach independently or combine them. The environment is designed for maximum flexibility while maintaining consistency and quality across all development workflows.

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