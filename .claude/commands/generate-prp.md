# /generate-prp

Generates a comprehensive Product Requirements Prompt (PRP) for polyglot development environments using the Template Method pattern for consistent, maintainable command processing.

## Usage
```
/generate-prp <feature-file> [--env <environment>] [--template <template>] [--debug]
```

## Arguments
- `<feature-file>`: Path to the feature requirements file (e.g., `INITIAL.md`, `features/new-api.md`)
- `--env <environment>`: Target environment (python-env, typescript-env, rust-env, go-env, nushell-env, or multi)
- `--template <template>`: Template type (full, minimal, validation_only)
- `--debug`: Enable debug output

## Feature file: $ARGUMENTS

Generate a complete PRP for polyglot feature implementation with thorough research. This command extends the base PRP command template to provide generation-specific functionality.

The AI agent gets the context you provide in the PRP plus training data. Include comprehensive research findings and reference patterns from the polyglot codebase. The Agent has WebSearch capabilities for external documentation.

## Command Implementation (Template Method Pattern)

```bash
# Source the base command template
source "$(dirname "$0")/_base_prp_command.md"

# Override: Command-specific processing for PRP generation
execute_command_logic() {
    debug_log "Starting PRP generation for $FEATURE_FILE"
    
    # Detect environment if not specified
    detect_environment
    
    # Research phase
    echo "🔍 Starting research phase..."
    perform_codebase_analysis
    perform_external_research
    
    # Analysis phase
    echo "📊 Analyzing findings..."
    analyze_patterns_and_requirements
    
    # Template composition phase
    echo "📝 Composing PRP template..."
    compose_prp_template
    
    debug_log "PRP generation logic completed"
}

# Override: Generate PRP output
generate_output() {
    local output_file="context-engineering/PRPs/${FEATURE_NAME}-${ENV_ARG}.md"
    
    echo "💾 Generating PRP: $output_file"
    
    # Use the new composite template builder to generate the PRP
    python3 context-engineering/lib/composite_template_builder.py \
        "$ENV_ARG" \
        "$FEATURE_NAME" \
        --description "$FEATURE_DESCRIPTION" \
        --template "${TEMPLATE_TYPE:-full}" \
        --type "${FEATURE_TYPE:-library}" \
        --complexity "${COMPLEXITY:-medium}" > "$output_file"
    
    if [[ $? -eq 0 ]]; then
        echo "✅ PRP generated successfully: $output_file"
        echo "📊 Quality score: $(calculate_quality_score "$output_file")/10"
    else
        handle_error "GENERATION_FAILED" "Failed to generate PRP"
    fi
}

# Research implementation
perform_codebase_analysis() {
    debug_log "Analyzing codebase for patterns in $ENV_ARG"
    
    # Search for similar patterns in target environment
    if [[ -d "$ENV_ARG" ]]; then
        echo "  - Analyzing existing code patterns in $ENV_ARG/"
        # Store findings for template composition
        EXISTING_PATTERNS=$(find "$ENV_ARG" -name "*.py" -o -name "*.ts" -o -name "*.rs" -o -name "*.go" -o -name "*.nu" | head -10)
    fi
    
    # Review devbox configurations
    if [[ -f "$ENV_ARG/devbox.json" ]]; then
        echo "  - Reviewing devbox configuration"
        DEVBOX_CONFIG=$(cat "$ENV_ARG/devbox.json")
    fi
    
    # Check test patterns
    if [[ -d "$ENV_ARG/tests" ]]; then
        echo "  - Analyzing test patterns"
        TEST_PATTERNS=$(find "$ENV_ARG/tests" -name "*.py" -o -name "*.test.ts" -o -name "*.rs" | head -5)
    fi
}

perform_external_research() {
    debug_log "Performing external research for similar implementations"
    
    # Extract key technologies from feature file
    TECHNOLOGIES=$(grep -i "fastapi\|react\|rust\|go\|nushell" "$FEATURE_FILE" | head -3)
    
    if [[ -n "$TECHNOLOGIES" ]]; then
        echo "  - Key technologies identified: $TECHNOLOGIES"
        echo "  - External research will focus on these technologies"
    fi
}

analyze_patterns_and_requirements() {
    debug_log "Analyzing patterns and extracting requirements"
    
    # Extract feature name from file
    FEATURE_NAME=$(basename "$FEATURE_FILE" .md)
    
    # Extract feature description
    FEATURE_DESCRIPTION=$(grep -A 5 "^## FEATURE:" "$FEATURE_FILE" | tail -n +2 | head -3 | tr '\n' ' ')
    
    if [[ -z "$FEATURE_DESCRIPTION" ]]; then
        FEATURE_DESCRIPTION="Feature implementation for $ENV_ARG environment"
    fi
    
    # Auto-detect feature type from content
    detect_feature_type
    
    # Auto-detect complexity from content
    detect_complexity
    
    debug_log "Feature: $FEATURE_NAME"
    debug_log "Description: $FEATURE_DESCRIPTION"
    debug_log "Type: $FEATURE_TYPE"
    debug_log "Complexity: $COMPLEXITY"
}

# Detect feature type from feature file content
detect_feature_type() {
    debug_log "Auto-detecting feature type from content"
    
    # Check for API-related keywords
    if grep -qi "api\|endpoint\|rest\|http\|fastapi\|express\|gin\|axum" "$FEATURE_FILE"; then
        FEATURE_TYPE="api"
    
    # Check for CLI-related keywords
    elif grep -qi "cli\|command\|terminal\|argparse\|clap\|cobra" "$FEATURE_FILE"; then
        FEATURE_TYPE="cli"
    
    # Check for service-related keywords
    elif grep -qi "service\|daemon\|background\|worker\|queue\|scheduler" "$FEATURE_FILE"; then
        FEATURE_TYPE="service"
    
    # Default to library for other cases
    else
        FEATURE_TYPE="library"
    fi
    
    debug_log "Detected feature type: $FEATURE_TYPE"
}

# Detect complexity from feature file content
detect_complexity() {
    debug_log "Auto-detecting complexity from content"
    
    local content_size=$(wc -l < "$FEATURE_FILE")
    local requirement_count=$(grep -c "^-\|^*\|^[0-9]" "$FEATURE_FILE")
    
    # Check for complexity indicators
    if grep -qi "simple\|basic\|minimal\|quick" "$FEATURE_FILE"; then
        COMPLEXITY="simple"
    elif grep -qi "complex\|advanced\|comprehensive\|enterprise\|scalable" "$FEATURE_FILE" || \
         [[ $content_size -gt 50 ]] || [[ $requirement_count -gt 20 ]]; then
        COMPLEXITY="complex"
    else
        COMPLEXITY="medium"
    fi
    
    debug_log "Detected complexity: $COMPLEXITY"
}

compose_prp_template() {
    debug_log "Composing PRP template using Template Composer"
    
    # Validate that template composer exists
    if [[ ! -f "context-engineering/lib/template_composer.py" ]]; then
        handle_error "TEMPLATE_COMPOSER_NOT_FOUND" "Template composer not found"
    fi
    
    # Set template type based on feature complexity
    if grep -qi "simple\|basic\|minimal" "$FEATURE_FILE"; then
        TEMPLATE_TYPE="minimal"
    else
        TEMPLATE_TYPE="full"
    fi
    
    debug_log "Using template type: $TEMPLATE_TYPE"
}

calculate_quality_score() {
    local prp_file="$1"
    local score=5
    
    # Check if file was created and has content
    if [[ -f "$prp_file" ]] && [[ -s "$prp_file" ]]; then
        score=$((score + 2))
    fi
    
    # Check for key sections
    if grep -q "## Goal" "$prp_file"; then score=$((score + 1)); fi
    if grep -q "## Environment Setup" "$prp_file"; then score=$((score + 1)); fi
    if grep -q "## Validation Gates" "$prp_file"; then score=$((score + 1)); fi
    
    echo $score
}

# Parse additional arguments specific to generate-prp
parse_generate_prp_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --template)
                TEMPLATE_TYPE="$2"
                shift 2
                ;;
            --debug)
                DEBUG="true"
                shift
                ;;
            *)
                break
                ;;
        esac
    done
}

# Main execution with argument parsing
main() {
    enable_debug "$@"
    parse_generate_prp_args "$@"
    parse_arguments "$@"
    validate_environment
    execute_command_logic
    generate_output
}

# Execute if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

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