#!/usr/bin/env nu

# Prompts Registry for Polyglot Development MCP Server
# Provides available prompts for the MCP server

use ../common.nu *

# List all available prompts
export def list_all_prompts []: list {
    [
        {
            name: "polyglot-setup"
            description: "Guide for setting up a polyglot development environment"
            arguments: [
                {
                    name: "environment"
                    description: "Target environment (python-env, typescript-env, rust-env, go-env, nushell-env)"
                    required: true
                }
                {
                    name: "packages"
                    description: "Additional packages to install"
                    required: false
                }
            ]
        }
        {
            name: "devbox-tutorial"
            description: "Tutorial for using devbox in the polyglot environment"
            arguments: [
                {
                    name: "level"
                    description: "Tutorial level (beginner, intermediate, advanced)"
                    required: false
                }
            ]
        }
        {
            name: "environment-debug"
            description: "Debug guide for environment issues"
            arguments: [
                {
                    name: "environment"
                    description: "Environment to debug"
                    required: true
                }
                {
                    name: "error_message"
                    description: "Error message encountered"
                    required: false
                }
            ]
        }
        {
            name: "cross-language-patterns"
            description: "Common patterns across different programming languages"
            arguments: [
                {
                    name: "pattern"
                    description: "Pattern type (error-handling, testing, dependency-management)"
                    required: true
                }
                {
                    name: "languages"
                    description: "Languages to compare (comma-separated)"
                    required: false
                }
            ]
        }
    ]
}

export def main [] {
    print "Prompts Registry Module"
    print "Available prompts:"
    
    let prompts = (list_all_prompts)
    for prompt in $prompts {
        print $"  - ($prompt.name): ($prompt.description)"
    }
}