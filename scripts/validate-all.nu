#!/usr/bin/env nu

# Cross-Language Quality Gates for Polyglot Development Environment
# This is the implementation of the validation script described in CLAUDE.md
# Usage: nu scripts/validate-all.nu [--parallel] [--env environment]

use nushell-env/common.nu *

def main [
    --parallel = false
    --env: string = "all"
    --skip: list<string> = []
    --verbose = false
] {
    log info "🚀 Starting cross-language quality gates validation..."
    log info $"Target environments: ($env)"
    
    if $parallel {
        validate-parallel $env $skip $verbose
    } else {
        validate-sequential $env $skip $verbose
    }
}

def validate-sequential [target_env: string, skip: list<string>, verbose: bool] {
    let environments = get-validation-environments $target_env $skip
    mut success_count = 0
    mut total_count = ($environments | length)
    
    for env in $environments {
        print ""
        log info $"($env.name)..."
        
        if ($env.dir | path exists) {
            cd $env.dir
            
            let result = validate-environment $env $verbose
            
            if $result {
                log success $"✅ ($env.name) validation passed"
                $success_count = $success_count + 1
            } else {
                log error $"❌ ($env.name) validation failed"
            }
            
            cd ..
        } else {
            log warn $"⚠️  ($env.name) directory not found: ($env.dir)"
            $total_count = $total_count - 1
        }
    }
    
    print ""
    print "=" * 60
    log info $"Validation Results: ($success_count)/($total_count) environments passed"
    
    if $success_count == $total_count {
        log success "🎉 All validations passed!"
        exit 0
    } else {
        log error "💥 Some validations failed!"
        exit 1
    }
}

def validate-parallel [target_env: string, skip: list<string>, verbose: bool] {
    log info "🏃‍♂️ Running validations in parallel..."
    
    let environments = get-validation-environments $target_env $skip
    
    let results = $environments | par-each { |env|
        if ($env.dir | path exists) {
            let original_dir = pwd
            
            let result = try {
                cd $env.dir
                validate-environment $env $verbose
                cd $original_dir
                {name: $env.name, status: "passed", error: null, emoji: $env.emoji}
            } catch { |e|
                cd $original_dir
                {name: $env.name, status: "failed", error: $e.msg, emoji: $env.emoji}
            }
            
            $result
        } else {
            {name: $env.name, status: "skipped", error: "Directory not found", emoji: $env.emoji}
        }
    }
    
    # Report results
    print ""
    for result in $results {
        match $result.status {
            "passed" => { log success $"✅ ($result.emoji) ($result.name)" }
            "failed" => { 
                log error $"❌ ($result.emoji) ($result.name)"
                if $verbose and $result.error != null {
                    log error $"    Error: ($result.error)"
                }
            }
            "skipped" => { log warn $"⚠️  ($result.emoji) ($result.name) - ($result.error)" }
        }
    }
    
    let passed = $results | where status == "passed" | length
    let failed = $results | where status == "failed" | length
    let skipped = $results | where status == "skipped" | length
    
    print ""
    print "=" * 60
    log info $"Parallel Validation Results: ($passed) passed, ($failed) failed, ($skipped) skipped"
    
    if $failed == 0 {
        log success "🎉 All parallel validations completed successfully!"
        exit 0
    } else {
        log error "💥 Some parallel validations failed!"
        exit 1
    }
}

def get-validation-environments [target_env: string, skip: list<string>] {
    let all_environments = [
        {name: "Python", emoji: "🐍", dir: "python-env", commands: ["lint", "test"]},
        {name: "TypeScript", emoji: "📘", dir: "typescript-env", commands: ["lint", "test"]}, 
        {name: "Rust", emoji: "🦀", dir: "rust-env", commands: ["lint", "test"]},
        {name: "Go", emoji: "🐹", dir: "go-env", commands: ["lint", "test"]},
        {name: "Nushell", emoji: "🐚", dir: "nushell-env", commands: ["check", "test"]}
    ]
    
    let filtered = if $target_env == "all" {
        $all_environments
    } else {
        $all_environments | where name =~ $target_env
    }
    
    $filtered | where not ($it.dir in $skip)
}

def validate-environment [env: record, verbose: bool] {
    if $verbose {
        log info $"  📁 Working directory: (pwd)"
    }
    
    # Check if devbox.json exists
    if not ("devbox.json" | path exists) {
        if $verbose {
            log warn $"    No devbox.json found in ($env.dir)"
        }
        return false
    }
    
    # Check if devbox is available
    if not (cmd exists "devbox") {
        log error $"    devbox command not found"
        return false
    }
    
    # Run each command for the environment
    for cmd in $env.commands {
        if $verbose {
            log info $"    🔧 Running: devbox run ($cmd)"
        } else {
            log info $"    Running ($cmd)..."
        }
        
        let result = try {
            # Use run safe from common.nu for better error handling
            run safe $"devbox run ($cmd)"
            true
        } catch { |e|
            if $verbose {
                log error $"    ❌ Command failed: ($e.msg)"
            } else {
                log error $"    ❌ ($cmd) failed"
            }
            false
        }
        
        if not $result {
            return false
        } else if $verbose {
            log success $"    ✅ ($cmd) passed"
        }
    }
    
    true
}

# Specific validation modes
def "main quick" [] {
    log info "🏃‍♂️ Running quick validation (syntax checks only)..."
    
    let environments = get-validation-environments "all" []
    
    for env in $environments {
        if ($env.dir | path exists) {
            log info $"($env.emoji) ($env.name)..."
            cd $env.dir
            
            # Quick syntax/format checks only
            if ("devbox.json" | path exists) {
                try {
                    open devbox.json | from json | ignore
                    log success $"  ✅ devbox.json syntax OK"
                } catch {
                    log error $"  ❌ devbox.json syntax error"
                }
            }
            
            cd ..
        }
    }
    
    log success "🎉 Quick validation completed!"
}

def "main dependencies" [] {
    log info "🔍 Checking external dependencies..."
    
    let required_tools = [
        {name: "devbox", description: "Package manager", required: true},
        {name: "git", description: "Version control", required: true},
        {name: "nu", description: "Nushell", required: true}
    ]
    
    let optional_tools = [
        {name: "docker", description: "Containerization", required: false},
        {name: "kubectl", description: "Kubernetes CLI", required: false},
        {name: "gh", description: "GitHub CLI", required: false},
        {name: "teller", description: "Secret management", required: false},
        {name: "direnv", description: "Environment management", required: false}
    ]
    
    mut all_required_ok = true
    
    log info "Required tools:"
    for tool in $required_tools {
        if (cmd exists $tool.name) {
            log success $"  ✅ ($tool.name) - ($tool.description)"
        } else {
            log error $"  ❌ ($tool.name) - ($tool.description) - MISSING"
            $all_required_ok = false
        }
    }
    
    log info "Optional tools:"
    for tool in $optional_tools {
        if (cmd exists $tool.name) {
            log success $"  ✅ ($tool.name) - ($tool.description)"
        } else {
            log warn $"  ⚠️  ($tool.name) - ($tool.description) - not installed"
        }
    }
    
    if $all_required_ok {
        log success "🎉 All required dependencies are available!"
    } else {
        log error "💥 Some required dependencies are missing!"
        exit 1
    }
}

def "main structure" [] {
    log info "🏗️  Validating project structure..."
    
    let expected_structure = [
        {path: "CLAUDE.md", type: "file", required: true, description: "Project documentation"},
        {path: "scripts/validate-all.nu", type: "file", required: true, description: "This validation script"},
        {path: "nushell-env", type: "dir", required: true, description: "Nushell environment"},
        {path: "nushell-env/devbox.json", type: "file", required: true, description: "Nushell devbox config"},
        {path: "nushell-env/common.nu", type: "file", required: true, description: "Common utilities"},
        {path: "nushell-env/scripts", type: "dir", required: true, description: "Nushell scripts"},
        {path: "python-env", type: "dir", required: false, description: "Python environment"},
        {path: "typescript-env", type: "dir", required: false, description: "TypeScript environment"},
        {path: "rust-env", type: "dir", required: false, description: "Rust environment"},
        {path: "go-env", type: "dir", required: false, description: "Go environment"}
    ]
    
    mut structure_ok = true
    
    for item in $expected_structure {
        let exists = $item.path | path exists
        
        if $exists {
            log success $"  ✅ ($item.path) - ($item.description)"
        } else if $item.required {
            log error $"  ❌ ($item.path) - ($item.description) - REQUIRED"
            $structure_ok = false
        } else {
            log warn $"  ⚠️  ($item.path) - ($item.description) - optional"
        }
    }
    
    if $structure_ok {
        log success "🎉 Project structure validation passed!"
    } else {
        log error "💥 Project structure validation failed!"
        exit 1
    }
}

def "main help" [] {
    print $"Cross-Language Quality Gates for Polyglot Development Environment

Usage: nu scripts/validate-all.nu [OPTIONS] [COMMAND]

Commands:
  <default>      Run full validation
  quick          Run quick validation (syntax checks only)
  dependencies   Check external tool dependencies
  structure      Validate project structure
  help           Show this help message

Options:
  --parallel     Run validations in parallel (faster)
  --env <name>   Target specific environment (default: all)
  --skip <list>  Skip specific environments
  --verbose      Show detailed output

Examples:
  nu scripts/validate-all.nu                    # Full validation
  nu scripts/validate-all.nu --parallel         # Parallel validation
  nu scripts/validate-all.nu --env python       # Python only
  nu scripts/validate-all.nu quick              # Quick checks
  nu scripts/validate-all.nu dependencies       # Check tools
  nu scripts/validate-all.nu structure          # Check structure

Available environments: python, typescript, rust, go, nushell
"
}