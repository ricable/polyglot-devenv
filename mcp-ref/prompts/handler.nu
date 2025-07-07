#!/usr/bin/env nu

# Prompts Handler for Polyglot Development MCP Server
# Processes prompt requests and generates contextual responses

use ../common.nu *

# Get prompt content based on name and arguments
export def get_prompt [name: string, args: record]: record {
    match $name {
        "polyglot-setup" => (generate_polyglot_setup_prompt $args)
        "devbox-tutorial" => (generate_devbox_tutorial_prompt $args)
        "environment-debug" => (generate_environment_debug_prompt $args)
        "cross-language-patterns" => (generate_cross_language_patterns_prompt $args)
        _ => {
            error make { msg: $"Unknown prompt: ($name)" }
        }
    }
}

# Generate polyglot setup prompt
def generate_polyglot_setup_prompt [args: record]: record {
    let environment = ($args.environment? | default "")
    let packages = ($args.packages? | default "")
    
    if ($environment == "") {
        error make { msg: "Environment argument is required" }
    }
    
    let workspace = (get workspace_root)
    let env_path = ($workspace | path join $environment)
    
    mut setup_content = [
        (create text_content $"# Polyglot Development Environment Setup: ($environment)")
        (create text_content "")
        (create text_content $"Welcome to the polyglot development environment setup guide for **($environment)**.")
        (create text_content "")
        (create text_content "## Quick Start")
        (create text_content $"1. Navigate to the environment: `cd ($environment)`")
        (create text_content "2. Enter the devbox shell: `devbox shell`")
        (create text_content "3. Install dependencies: `devbox run install` or `devbox run setup`")
        (create text_content "")
    ]
    
    # Add environment-specific instructions
    match $environment {
        "python-env" => {
            $setup_content = ($setup_content | append [
                (create text_content "## Python Environment")
                (create text_content "- **Package manager**: uv (ultra-fast Python package installer)")
                (create text_content "- **Key files**: pyproject.toml, src/ directory")
                (create text_content "- **Common commands**:")
                (create text_content "  - `devbox run format`: Format code with ruff")
                (create text_content "  - `devbox run lint`: Lint code with ruff and mypy")
                (create text_content "  - `devbox run test`: Run tests with pytest")
                (create text_content "")
            ])
        }
        "typescript-env" => {
            $setup_content = ($setup_content | append [
                (create text_content "## TypeScript Environment")
                (create text_content "- **Runtime**: Node.js with TypeScript")
                (create text_content "- **Key files**: package.json, tsconfig.json, src/ directory")
                (create text_content "- **Common commands**:")
                (create text_content "  - `devbox run format`: Format code with prettier")
                (create text_content "  - `devbox run lint`: Lint code with ESLint")
                (create text_content "  - `devbox run test`: Run tests with Jest")
                (create text_content "")
            ])
        }
        "rust-env" => {
            $setup_content = ($setup_content | append [
                (create text_content "## Rust Environment")
                (create text_content "- **Package manager**: Cargo")
                (create text_content "- **Key files**: Cargo.toml, src/ directory")
                (create text_content "- **Common commands**:")
                (create text_content "  - `devbox run format`: Format code with rustfmt")
                (create text_content "  - `devbox run lint`: Lint code with clippy")
                (create text_content "  - `devbox run test`: Run tests with cargo test")
                (create text_content "")
            ])
        }
        "go-env" => {
            $setup_content = ($setup_content | append [
                (create text_content "## Go Environment")
                (create text_content "- **Package manager**: Go modules")
                (create text_content "- **Key files**: go.mod, cmd/ directory")
                (create text_content "- **Common commands**:")
                (create text_content "  - `devbox run format`: Format code with goimports")
                (create text_content "  - `devbox run lint`: Lint code with golangci-lint")
                (create text_content "  - `devbox run test`: Run tests with go test")
                (create text_content "")
            ])
        }
        "nushell-env" => {
            $setup_content = ($setup_content | append [
                (create text_content "## Nushell Environment")
                (create text_content "- **Shell**: Nushell scripting environment")
                (create text_content "- **Key directories**: scripts/, config/")
                (create text_content "- **Common commands**:")
                (create text_content "  - `devbox run format`: Format scripts with nu format")
                (create text_content "  - `devbox run check`: Validate syntax with nu check")
                (create text_content "  - `devbox run test`: Run tests with nu test")
                (create text_content "")
            ])
        }
    }
    
    # Add additional packages if specified
    if ($packages != "") {
        $setup_content = ($setup_content | append [
            (create text_content "## Additional Packages")
            (create text_content $"To install additional packages: `devbox add ($packages)`")
            (create text_content "")
        ])
    }
    
    # Add troubleshooting section
    $setup_content = ($setup_content | append [
        (create text_content "## Troubleshooting")
        (create text_content "- **Environment not loading**: Try `devbox shell --pure`")
        (create text_content "- **Package conflicts**: Run `devbox update && devbox clean`")
        (create text_content "- **Performance issues**: Use the environment analysis tools")
        (create text_content "")
        (create text_content "For more help, use the environment-debug prompt with specific error messages.")
    ])
    
    {
        description: $"Setup guide for ($environment) in the polyglot development environment"
        messages: [
            {
                role: "user"
                content: {
                    type: "text"
                    text: $"Help me set up ($environment) in my polyglot development environment"
                }
            }
            {
                role: "assistant"
                content: $setup_content
            }
        ]
    }
}

# Generate devbox tutorial prompt
def generate_devbox_tutorial_prompt [args: record]: record {
    let level = ($args.level? | default "beginner")
    
    mut tutorial_content = [
        (create text_content "# DevBox Tutorial")
        (create text_content "")
        (create text_content "DevBox provides isolated, reproducible development environments using Nix packages.")
        (create text_content "")
    ]
    
    match $level {
        "beginner" => {
            $tutorial_content = ($tutorial_content | append [
                (create text_content "## Basic Commands")
                (create text_content "- `devbox init`: Initialize a new devbox project")
                (create text_content "- `devbox add <package>`: Add a package to the environment")
                (create text_content "- `devbox shell`: Enter the isolated environment")
                (create text_content "- `devbox run <script>`: Run a script defined in devbox.json")
                (create text_content "")
                (create text_content "## Getting Started")
                (create text_content "1. Navigate to any environment directory (e.g., python-env)")
                (create text_content "2. Run `devbox shell` to enter the environment")
                (create text_content "3. All packages and tools are now available in isolation")
                (create text_content "4. Use `exit` to leave the environment")
            ])
        }
        "intermediate" => {
            $tutorial_content = ($tutorial_content | append [
                (create text_content "## Advanced Features")
                (create text_content "- **Scripts**: Define common tasks in devbox.json")
                (create text_content "- **Environment Variables**: Set custom env vars per environment")
                (create text_content "- **Init Hooks**: Run setup commands when entering the shell")
                (create text_content "- **Plugins**: Extend functionality with devbox plugins")
                (create text_content "")
                (create text_content "## Configuration Management")
                (create text_content "- Edit devbox.json to customize your environment")
                (create text_content "- Use `devbox generate direnv` for automatic activation")
                (create text_content "- Pin package versions for reproducibility")
            ])
        }
        "advanced" => {
            $tutorial_content = ($tutorial_content | append [
                (create text_content "## Advanced Techniques")
                (create text_content "- **Multi-environment workflows**: Switching between language environments")
                (create text_content "- **Custom derivations**: Creating specialized packages")
                (create text_content "- **CI/CD integration**: Using devbox in automated pipelines")
                (create text_content "- **Performance optimization**: Caching and build acceleration")
                (create text_content "")
                (create text_content "## Polyglot Environment Patterns")
                (create text_content "- Cross-language dependency management")
                (create text_content "- Shared tooling across environments")
                (create text_content "- Environment composition and inheritance")
            ])
        }
    }
    
    {
        description: $"DevBox tutorial for ($level) level"
        messages: [
            {
                role: "user"
                content: {
                    type: "text"
                    text: $"Teach me about DevBox at the ($level) level"
                }
            }
            {
                role: "assistant"
                content: $tutorial_content
            }
        ]
    }
}

# Generate environment debug prompt
def generate_environment_debug_prompt [args: record]: record {
    let environment = ($args.environment? | default "")
    let error_message = ($args.error_message? | default "")
    
    if ($environment == "") {
        error make { msg: "Environment argument is required" }
    }
    
    mut debug_content = [
        (create text_content $"# Environment Debug Guide: ($environment)")
        (create text_content "")
    ]
    
    if ($error_message != "") {
        $debug_content = ($debug_content | append [
            (create text_content $"## Error Analysis: ($error_message)")
            (create text_content "")
        ])
    }
    
    $debug_content = ($debug_content | append [
        (create text_content "## Common Issues and Solutions")
        (create text_content "")
        (create text_content "### Environment Not Loading")
        (create text_content "- **Solution**: Try `devbox shell --pure` to reset environment state")
        (create text_content "- **Check**: Verify devbox.json exists and is valid JSON")
        (create text_content "")
        (create text_content "### Package Conflicts")
        (create text_content "- **Solution**: Run `devbox update` followed by `devbox clean`")
        (create text_content "- **Alternative**: Remove conflicting packages and re-add them")
        (create text_content "")
        (create text_content "### Performance Issues")
        (create text_content "- **Check**: Run environment analysis to identify bottlenecks")
        (create text_content "- **Monitor**: Use performance analytics tools")
        (create text_content "")
        (create text_content "### Build Failures")
        (create text_content "- **Check**: Verify all dependencies are installed")
        (create text_content "- **Clean**: Clear build caches and temporary files")
        (create text_content "")
        (create text_content "## Diagnostic Commands")
        (create text_content $"- `cd ($environment) && devbox shell`")
        (create text_content "- `devbox info` - Show environment information")
        (create text_content "- `devbox version` - Check devbox version")
        (create text_content "- Environment health check tools available via MCP")
    ])
    
    {
        description: $"Debug guide for ($environment) environment issues"
        messages: [
            {
                role: "user"
                content: {
                    type: "text"
                    text: $"Help me debug issues in ($environment)" + (if ($error_message != "") { $" - Error: ($error_message)" } else { "" })
                }
            }
            {
                role: "assistant" 
                content: $debug_content
            }
        ]
    }
}

# Generate cross-language patterns prompt
def generate_cross_language_patterns_prompt [args: record]: record {
    let pattern = ($args.pattern? | default "")
    let languages = ($args.languages? | default "python,typescript,rust,go,nushell")
    
    if ($pattern == "") {
        error make { msg: "Pattern argument is required" }
    }
    
    let lang_list = ($languages | split row "," | each { |l| $l | str trim })
    
    mut pattern_content = [
        (create text_content $"# Cross-Language Patterns: ($pattern)")
        (create text_content "")
        (create text_content $"Comparing **($pattern)** patterns across languages: ($lang_list | str join ', ')")
        (create text_content "")
    ]
    
    match $pattern {
        "error-handling" => {
            $pattern_content = ($pattern_content | append [
                (create text_content "## Error Handling Patterns")
                (create text_content "")
                (create text_content "### Python")
                (create text_content "```python")
                (create text_content "try:")
                (create text_content "    result = risky_operation()")
                (create text_content "except SpecificError as e:")
                (create text_content "    handle_error(e)")
                (create text_content "finally:")
                (create text_content "    cleanup()")
                (create text_content "```")
                (create text_content "")
                (create text_content "### TypeScript")
                (create text_content "```typescript")
                (create text_content "type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };")
                (create text_content "")
                (create text_content "function riskyOperation(): Result<string, Error> {")
                (create text_content "  try {")
                (create text_content "    return { ok: true, value: doSomething() };")
                (create text_content "  } catch (error) {")
                (create text_content "    return { ok: false, error: error as Error };")
                (create text_content "  }")
                (create text_content "}")
                (create text_content "```")
                (create text_content "")
                (create text_content "### Rust")
                (create text_content "```rust")
                (create text_content "fn risky_operation() -> Result<String, MyError> {")
                (create text_content "    let result = might_fail()?;")
                (create text_content "    Ok(result)")
                (create text_content "}")
                (create text_content "```")
                (create text_content "")
                (create text_content "### Go")
                (create text_content "```go")
                (create text_content "func riskyOperation() (string, error) {")
                (create text_content "    result, err := mightFail()")
                (create text_content "    if err != nil {")
                (create text_content "        return \"\", fmt.Errorf(\"operation failed: %w\", err)")
                (create text_content "    }")
                (create text_content "    return result, nil")
                (create text_content "}")
                (create text_content "```")
            ])
        }
        "testing" => {
            $pattern_content = ($pattern_content | append [
                (create text_content "## Testing Patterns")
                (create text_content "")
                (create text_content "### Python (pytest)")
                (create text_content "```python")
                (create text_content "def test_feature():")
                (create text_content "    # Arrange")
                (create text_content "    input_data = create_test_data()")
                (create text_content "    ")
                (create text_content "    # Act")
                (create text_content "    result = feature_under_test(input_data)")
                (create text_content "    ")
                (create text_content "    # Assert")
                (create text_content "    assert result.success")
                (create text_content "    assert result.value == expected_value")
                (create text_content "```")
                (create text_content "")
                (create text_content "### TypeScript (Jest)")
                (create text_content "```typescript")
                (create text_content "describe('Feature', () => {")
                (create text_content "  test('should work correctly', () => {")
                (create text_content "    // Arrange")
                (create text_content "    const input = createTestData();")
                (create text_content "    ")
                (create text_content "    // Act")
                (create text_content "    const result = featureUnderTest(input);")
                (create text_content "    ")
                (create text_content "    // Assert")
                (create text_content "    expect(result.success).toBe(true);")
                (create text_content "    expect(result.value).toEqual(expectedValue);")
                (create text_content "  });")
                (create text_content "});")
                (create text_content "```")
                (create text_content "")
                (create text_content "### Rust")
                (create text_content "```rust")
                (create text_content "#[cfg(test)]")
                (create text_content "mod tests {")
                (create text_content "    use super::*;")
                (create text_content "    ")
                (create text_content "    #[test]")
                (create text_content "    fn test_feature() {")
                (create text_content "        // Arrange")
                (create text_content "        let input = create_test_data();")
                (create text_content "        ")
                (create text_content "        // Act")
                (create text_content "        let result = feature_under_test(input);")
                (create text_content "        ")
                (create text_content "        // Assert")
                (create text_content "        assert!(result.is_ok());")
                (create text_content "        assert_eq!(result.unwrap(), expected_value);")
                (create text_content "    }")
                (create text_content "}")
                (create text_content "```")
                (create text_content "")
                (create text_content "### Go")
                (create text_content "```go")
                (create text_content "func TestFeature(t *testing.T) {")
                (create text_content "    // Arrange")
                (create text_content "    input := createTestData()")
                (create text_content "    ")
                (create text_content "    // Act")
                (create text_content "    result, err := featureUnderTest(input)")
                (create text_content "    ")
                (create text_content "    // Assert")
                (create text_content "    require.NoError(t, err)")
                (create text_content "    assert.Equal(t, expectedValue, result)")
                (create text_content "}")
                (create text_content "```")
            ])
        }
        "dependency-management" => {
            $pattern_content = ($pattern_content | append [
                (create text_content "## Dependency Management")
                (create text_content "")
                (create text_content "### Python (uv + pyproject.toml)")
                (create text_content "```toml")
                (create text_content "[project]")
                (create text_content "dependencies = [\"fastapi\", \"pydantic\"]")
                (create text_content "[project.optional-dependencies]")
                (create text_content "dev = [\"pytest\", \"ruff\", \"mypy\"]")
                (create text_content "```")
                (create text_content "Commands: `uv add package`, `uv remove package`")
                (create text_content "")
                (create text_content "### TypeScript (npm + package.json)")
                (create text_content "```json")
                (create text_content "{")
                (create text_content "  \"dependencies\": { \"express\": \"^4.18.0\" },")
                (create text_content "  \"devDependencies\": { \"jest\": \"^29.0.0\" }")
                (create text_content "}")
                (create text_content "```")
                (create text_content "Commands: `npm install package`, `npm uninstall package`")
                (create text_content "")
                (create text_content "### Rust (cargo + Cargo.toml)")
                (create text_content "```toml")
                (create text_content "[dependencies]")
                (create text_content "serde = \"1.0\"")
                (create text_content "tokio = { version = \"1.0\", features = [\"full\"] }")
                (create text_content "")
                (create text_content "[dev-dependencies]")
                (create text_content "criterion = \"0.5\"")
                (create text_content "```")
                (create text_content "Commands: `cargo add package`, `cargo remove package`")
                (create text_content "")
                (create text_content "### Go (go mod + go.mod)")
                (create text_content "```go")
                (create text_content "module myproject")
                (create text_content "")
                (create text_content "go 1.21")
                (create text_content "")
                (create text_content "require (")
                (create text_content "    github.com/gin-gonic/gin v1.9.1")
                (create text_content "    github.com/stretchr/testify v1.8.4")
                (create text_content ")")
                (create text_content "```")
                (create text_content "Commands: `go get package`, `go mod tidy`")
            ])
        }
        _ => {
            $pattern_content = ($pattern_content | append [
                (create text_content $"Pattern ($pattern) not yet implemented.")
                (create text_content "Available patterns: error-handling, testing, dependency-management")
            ])
        }
    }
    
    {
        description: $"Cross-language comparison of ($pattern) patterns"
        messages: [
            {
                role: "user"
                content: {
                    type: "text"
                    text: $"Show me ($pattern) patterns across ($languages)"
                }
            }
            {
                role: "assistant"
                content: $pattern_content
            }
        ]
    }
}

export def main [] {
    print "Prompts Handler Module"
    print "Processes prompt requests for the polyglot development environment"
}