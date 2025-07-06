# /generate-prp

Generates a comprehensive Product Requirements Prompt (PRP) for polyglot development environments. Adapted from context engineering principles to work seamlessly with the polyglot-devenv structure.

## Usage
```
/generate-prp <feature-file> [--env <environment>] [--template <template>]
```

## Arguments
- `<feature-file>`: Path to the feature requirements file (e.g., `INITIAL.md`, `features/new-api.md`)
- `--env <environment>`: Target environment (python-env, typescript-env, rust-env, go-env, nushell-env, or multi)
- `--template <template>`: Specific template to use (base, python, typescript, rust, go, nushell)

## Feature file: $ARGUMENTS

Generate a complete PRP for polyglot feature implementation with thorough research. Ensure context is passed to the AI agent to enable self-validation and iterative refinement across multiple development environments.

The AI agent gets the context you provide in the PRP plus training data. Include comprehensive research findings and reference patterns from the polyglot codebase. The Agent has WebSearch capabilities for external documentation.

## Research Process

1. **Environment Detection**
   - Analyze feature file to determine target environment(s)
   - Check for multi-environment requirements
   - Identify integration points between environments

2. **Polyglot Codebase Analysis**
   - Search for similar patterns in target environment(s)
   - Review devbox configurations and dependencies
   - Identify existing conventions and styles per language
   - Check test patterns and validation approaches
   - Review existing automation scripts and hooks

3. **Cross-Environment Research**
   - Analyze integration points between environments
   - Review shared automation scripts in nushell-env/
   - Check cross-language communication patterns
   - Identify common dependencies and conflicts

4. **External Research**
   - Search for similar implementations online
   - Gather library documentation (include specific URLs)
   - Find implementation examples and best practices
   - Identify common gotchas and pitfalls

## PRP Generation

Using context-engineering/templates/prp_base.md as template, adapt for polyglot environment:

### Critical Context to Include
- **Environment Configuration**: Devbox configs and dependencies
- **Documentation**: URLs with specific sections
- **Code Examples**: Real snippets from target environment(s)
- **Gotchas**: Library quirks, version issues, devbox limitations
- **Patterns**: Existing approaches from similar environments
- **Integration Points**: Cross-environment communication patterns

### Implementation Blueprint
- Start with environment setup commands
- Reference real files for patterns from target environment(s)
- Include error handling strategy per language
- List tasks to be completed in order
- Include devbox integration steps

### Polyglot-Specific Validation Gates
**Environment-Specific Validation:**
```bash
# Python Environment
cd python-env && devbox shell
devbox run format  # ruff format
devbox run lint    # ruff check && mypy
devbox run test    # pytest with coverage

# TypeScript Environment
cd typescript-env && devbox shell
devbox run format  # prettier
devbox run lint    # eslint
devbox run test    # jest

# Rust Environment
cd rust-env && devbox shell
devbox run format  # rustfmt
devbox run lint    # clippy
devbox run test    # cargo test

# Go Environment
cd go-env && devbox shell
devbox run format  # goimports
devbox run lint    # golangci-lint
devbox run test    # go test

# Nushell Environment
cd nushell-env && devbox shell
devbox run format  # nu fmt
devbox run check   # syntax validation
devbox run test    # nu test
```

**Cross-Environment Validation:**
```bash
# Run polyglot validation
nu nushell-env/scripts/validate-all.nu parallel

# Check environment consistency
nu nushell-env/scripts/environment-drift.nu check

# Security scan
nu nushell-env/scripts/security-scanner.nu scan-all
```

### Intelligence Integration
Include references to existing intelligence scripts:
- Performance monitoring: `nushell-env/scripts/performance-analytics.nu`
- Resource tracking: `nushell-env/scripts/resource-monitor.nu`
- Security scanning: `nushell-env/scripts/security-scanner.nu`
- Dependency management: `nushell-env/scripts/dependency-monitor.nu`

*** CRITICAL: RESEARCH POLYGLOT CODEBASE THOROUGHLY BEFORE WRITING PRP ***

*** ANALYZE ENVIRONMENT INTEGRATION POINTS AND PLAN COMPREHENSIVE APPROACH ***

## Output
Save as: `context-engineering/PRPs/{feature-name}-{environment}.md`

## Quality Checklist
- [ ] All necessary context included
- [ ] Environment-specific patterns referenced
- [ ] Validation gates are executable
- [ ] Integration points identified
- [ ] Performance implications considered
- [ ] Security requirements addressed
- [ ] Cross-environment compatibility ensured

## Success Metrics
Score the PRP on confidence level (1-10) for successful one-pass implementation:
- Completeness of context and documentation
- Accuracy of environment-specific patterns
- Executable validation gates
- Integration with existing polyglot workflows
- Performance and security considerations

**Target: 8+ confidence score for production-ready PRPs**

Remember: The goal is one-pass implementation success through comprehensive polyglot context.