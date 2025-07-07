#!/usr/bin/env nu

# Resources Registry for Polyglot Development MCP Server
# Manages all available resources with pagination and subscription support

use ../common.nu *

# List all available resources with pagination support
export def list_resources [params: record] -> record {
    let cursor = ($params.cursor? | default "")
    let limit = ($params.limit? | default 10)
    
    mcp log "debug" $"Listing resources (cursor: ($cursor), limit: ($limit))"
    
    # Get all available resources
    let all_resources = (get_all_resources)
    let total_count = ($all_resources | length)
    
    # Handle pagination
    let start_index = if ($cursor | is-empty) { 0 } else {
        try {
            $cursor | into int
        } catch {
            0
        }
    }
    
    let end_index = ([$start_index + $limit, $total_count] | math min)
    let page_resources = ($all_resources | range $start_index..<$end_index)
    
    # Calculate next cursor
    let next_cursor = if $end_index < $total_count {
        $end_index | into string
    } else {
        null
    }
    
    # Format response
    mut result = {
        resources: $page_resources
    }
    
    if ($next_cursor != null) {
        $result = ($result | insert nextCursor $next_cursor)
    }
    
    return $result
}

# Get all available resources
def get_all_resources [] -> list {
    [
        # Documentation resources
        ...(get_documentation_resources)
        
        # Configuration resources
        ...(get_configuration_resources)
        
        # Example resources
        ...(get_example_resources)
        
        # Script resources
        ...(get_script_resources)
        
        # Performance resources
        ...(get_performance_resources)
        
        # Security resources
        ...(get_security_resources)
        
        # Reference implementation resources (like everything.ts)
        ...(get_reference_resources)
    ]
}

# Documentation resources
def get_documentation_resources [] -> list {
    let workspace_root = (get workspace_root)
    
    mut resources = []
    
    # Main project documentation
    let claude_md = ($workspace_root | path join "CLAUDE.md")
    if ($claude_md | path exists) {
        $resources = ($resources | append {
            uri: "polyglot://documentation/claude-md"
            name: "CLAUDE.md - Project Documentation"
            description: "Main project documentation with development guidelines and setup"
            mimeType: "text/markdown"
        })
    }
    
    let claude_local_template = ($workspace_root | path join "CLAUDE.local.md.template")
    if ($claude_local_template | path exists) {
        $resources = ($resources | append {
            uri: "polyglot://documentation/claude-local-template"
            name: "CLAUDE.local.md.template - Personal Configuration Template"
            description: "Template for personal development environment configuration"
            mimeType: "text/markdown"
        })
    }
    
    # Context engineering documentation
    let context_docs_dir = ($workspace_root | path join "context-engineering" "docs")
    if ($context_docs_dir | path exists) {
        let doc_files = (ls $context_docs_dir | where type == file | where name =~ "\.md$")
        for doc in $doc_files {
            let filename = ($doc.name | path basename | path parse | get stem)
            $resources = ($resources | append {
                uri: $"polyglot://documentation/context-engineering/($filename)"
                name: $"Context Engineering: ($filename | str title-case)"
                description: $"Context engineering documentation: ($filename)"
                mimeType: "text/markdown"
            })
        }
    }
    
    # DevBox documentation
    for env in ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"] {
        let env_path = ($workspace_root | path join $env)
        if ($env_path | path exists) {
            $resources = ($resources | append {
                uri: $"polyglot://documentation/devbox/($env)"
                name: $"DevBox Configuration: ($env)"
                description: $"DevBox environment configuration and setup for ($env)"
                mimeType: "application/json"
            })
        }
    }
    
    return $resources
}

# Configuration resources
def get_configuration_resources [] -> list {
    let workspace_root = (get workspace_root)
    
    mut resources = []
    
    # DevBox configurations
    for env in ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"] {
        let devbox_config = ($workspace_root | path join $env "devbox.json")
        if ($devbox_config | path exists) {
            $resources = ($resources | append {
                uri: $"polyglot://config/devbox/($env)"
                name: $"DevBox Config: ($env)"
                description: $"DevBox configuration file for ($env) environment"
                mimeType: "application/json"
            })
        }
    }
    
    # Nushell common utilities
    let nushell_common = ($workspace_root | path join "nushell-env" "common.nu")
    if ($nushell_common | path exists) {
        $resources = ($resources | append {
            uri: "polyglot://config/nushell/common"
            name: "Nushell Common Utilities"
            description: "Common nushell functions and utilities"
            mimeType: "text/plain"
        })
    }
    
    # MCP configuration
    let mcp_config = ($workspace_root | path join ".mcp.json")
    if ($mcp_config | path exists) {
        $resources = ($resources | append {
            uri: "polyglot://config/mcp"
            name: "MCP Server Configuration"
            description: "Model Context Protocol server configuration"
            mimeType: "application/json"
        })
    }
    
    # Claude Code hooks configuration
    let claude_dir = ($workspace_root | path join ".claude")
    if ($claude_dir | path exists) {
        let settings_file = ($claude_dir | path join "settings.json")
        if ($settings_file | path exists) {
            $resources = ($resources | append {
                uri: "polyglot://config/claude/hooks"
                name: "Claude Code Hooks Configuration"
                description: "Claude Code intelligent hooks configuration"
                mimeType: "application/json"
            })
        }
    }
    
    return $resources
}

# Example resources (including dojo patterns)
def get_example_resources [] -> list {
    let workspace_root = (get workspace_root)
    
    let base_resources = []
    
    # CopilotKit dojo examples
    let dojo_dir = ($workspace_root | path join "context-engineering" "examples" "dojo")
    let dojo_resources = if ($dojo_dir | path exists) {
        let components_dir = ($dojo_dir | path join "src" "app")
        if ($components_dir | path exists) {
            try {
                let feature_dirs = (ls $components_dir | where type == dir | where name =~ "feature$")
                $feature_dirs | each { |feature_dir|
                    let feature_name = ($feature_dir.name | path basename)
                    let subdirs = (ls $feature_dir.name | where type == dir)
                    
                    $subdirs | each { |subdir|
                        let component_name = ($subdir.name | path basename)
                        {
                            uri: $"polyglot://examples/dojo/($feature_name)/($component_name)"
                            name: $"CopilotKit: ($component_name | str replace '_' ' ' | str title-case)"
                            description: $"CopilotKit dojo example: ($component_name) component pattern"
                            mimeType: "text/plain"
                        }
                    }
                } | flatten
            } catch {
                # If we can't read the dojo structure, add a generic resource
                [{
                    uri: "polyglot://examples/dojo/overview"
                    name: "CopilotKit Dojo Examples"
                    description: "CopilotKit dojo patterns and components overview"
                    mimeType: "text/markdown"
                }]
            }
        } else {
            []
        }
    } else {
        []
    }
    
    # Generated PRPs
    let prps_dir = ($workspace_root | path join "context-engineering" "PRPs")
    let prp_resources = if ($prps_dir | path exists) {
        let prp_files = (ls $prps_dir | where type == file | where name =~ "\.md$")
        $prp_files | each { |prp|
            let prp_name = ($prp.name | path basename | path parse | get stem)
            {
                uri: $"polyglot://examples/prps/($prp_name)"
                name: $"PRP: ($prp_name)"
                description: $"Generated Product Requirements Prompt: ($prp_name)"
                mimeType: "text/markdown"
            }
        }
    } else {
        []
    }
    
    return ($base_resources | append $dojo_resources | append $prp_resources)
}

# Script resources
def get_script_resources [] -> list {
    let workspace_root = (get workspace_root)
    
    # Nushell automation scripts
    let scripts_dir = ($workspace_root | path join "nushell-env" "scripts")
    let nushell_resources = if ($scripts_dir | path exists) {
        let script_files = (ls $scripts_dir | where type == file | where name =~ "\.nu$")
        $script_files | each { |script|
            let script_name = ($script.name | path basename | path parse | get stem)
            {
                uri: $"polyglot://scripts/nushell/($script_name)"
                name: $"Nushell Script: ($script_name)"
                description: $"Nushell automation script: ($script_name)"
                mimeType: "text/plain"
            }
        }
    } else {
        []
    }
    
    # DevPod automation scripts
    let devpod_scripts_dir = ($workspace_root | path join "devpod-automation" "scripts")
    let devpod_resources = if ($devpod_scripts_dir | path exists) {
        let script_files = (ls $devpod_scripts_dir | where type == file)
        $script_files | each { |script|
            let script_name = ($script.name | path basename)
            {
                uri: $"polyglot://scripts/devpod/($script_name)"
                name: $"DevPod Script: ($script_name)"
                description: $"DevPod automation script: ($script_name)"
                mimeType: (if ($script_name | str ends-with ".nu") { "text/plain" } else { "text/x-shellscript" })
            }
        }
    } else {
        []
    }
    
    return ($nushell_resources | append $devpod_resources)
}

# Performance monitoring resources
def get_performance_resources [] -> list {
    let workspace_root = (get workspace_root)
    
    mut resources = []
    
    # Performance logs and data
    let nushell_logs_dir = ($workspace_root | path join "nushell-env" "logs")
    if ($nushell_logs_dir | path exists) {
        $resources = ($resources | append {
            uri: "polyglot://performance/logs"
            name: "Performance Logs"
            description: "System performance monitoring logs and metrics"
            mimeType: "text/plain"
        })
    }
    
    # Performance analytics data (simulated)
    $resources = ($resources | append {
        uri: "polyglot://performance/metrics"
        name: "Performance Metrics"
        description: "Real-time performance metrics and analytics data"
        mimeType: "application/json"
    })
    
    $resources = ($resources | append {
        uri: "polyglot://performance/trends"
        name: "Performance Trends"
        description: "Historical performance trends and analysis"
        mimeType: "application/json"
    })
    
    return $resources
}

# Security scanning resources
def get_security_resources [] -> list {
    mut resources = []
    
    # Security scan results (simulated)
    $resources = ($resources | append {
        uri: "polyglot://security/scan-results"
        name: "Security Scan Results"
        description: "Latest security scan results and vulnerability reports"
        mimeType: "application/json"
    })
    
    $resources = ($resources | append {
        uri: "polyglot://security/compliance"
        name: "Compliance Report"
        description: "Security compliance status and recommendations"
        mimeType: "application/json"
    })
    
    return $resources
}

# Reference implementation resources (like everything.ts)
def get_reference_resources [] -> list {
    mut resources = []
    
    # Create numbered test resources like the reference implementation
    for i in 1..100 {
        if ($i mod 2) == 0 {
            # Even resources are text
            $resources = ($resources | append {
                uri: $"test://static/resource/($i)"
                name: $"Test Resource ($i)"
                description: $"Test text resource number ($i) - even resources contain plaintext"
                mimeType: "text/plain"
            })
        } else {
            # Odd resources are binary
            $resources = ($resources | append {
                uri: $"test://static/resource/($i)"
                name: $"Test Resource ($i)"
                description: $"Test binary resource number ($i) - odd resources contain binary data"
                mimeType: "application/octet-stream"
            })
        }
    }
    
    return $resources
}

# Get resource by URI
export def get_resource_by_uri [uri: string] -> record {
    let all_resources = (get_all_resources)
    
    for resource in $all_resources {
        if ($resource.uri == $uri) {
            return $resource
        }
    }
    
    error make { msg: $"Resource not found: ($uri)" }
}

# Check if resource exists
export def resource_exists [uri: string] -> bool {
    let all_resources = (get_all_resources)
    ($all_resources | where uri == $uri | length) > 0
}

# Get resources by category
export def get_resources_by_category [category: string] -> list {
    let all_resources = (get_all_resources)
    $all_resources | where ($it.uri | str starts-with $"polyglot://($category)/")
}

# Get resource statistics
export def get_resource_stats [] -> record {
    let all_resources = (get_all_resources)
    let total_count = ($all_resources | length)
    
    # Count by category
    let categories = ($all_resources 
        | each { |resource| 
            let parts = ($resource.uri | str replace "polyglot://" "" | str replace "test://" "" | split row "/")
            $parts | first
        }
        | uniq
    )
    
    mut category_counts = {}
    for category in $categories {
        let count = ($all_resources | where ($it.uri | str contains $"($category)/") | length)
        $category_counts = ($category_counts | insert $category $count)
    }
    
    # Count by MIME type
    let mime_types = ($all_resources | get mimeType | uniq)
    mut mime_counts = {}
    for mime in $mime_types {
        let count = ($all_resources | where mimeType == $mime | length)
        $mime_counts = ($mime_counts | insert $mime $count)
    }
    
    {
        total_resources: $total_count
        categories: $category_counts
        mime_types: $mime_counts
        pagination_enabled: true
        subscription_enabled: true
    }
}

# Validate resource URI format
export def validate_resource_uri [uri: string] -> bool {
    # Check for valid URI schemes
    ($uri | str starts-with "polyglot://") or 
    ($uri | str starts-with "test://") or
    ($uri | str starts-with "file://")
}

# Get resource templates for dynamic URI construction
export def get_resource_templates [] -> list {
    [
        {
            uriTemplate: "polyglot://documentation/{section}"
            name: "Documentation Template"
            description: "Access project documentation by section"
        }
        {
            uriTemplate: "polyglot://config/devbox/{environment}"
            name: "DevBox Configuration Template"
            description: "Access devbox configuration by environment"
        }
        {
            uriTemplate: "polyglot://examples/dojo/{feature}/{component}"
            name: "Dojo Pattern Template"
            description: "Access CopilotKit dojo patterns by feature and component"
        }
        {
            uriTemplate: "polyglot://scripts/nushell/{script_name}"
            name: "Nushell Script Template"
            description: "Access nushell automation scripts by name"
        }
        {
            uriTemplate: "test://static/resource/{id}"
            name: "Test Resource Template"
            description: "Access test resources by ID (1-100)"
        }
    ]
}

export def main [] {
    print "MCP Resources Registry"
    
    let stats = (get_resource_stats)
    print $"Total resources: ($stats.total_resources)"
    
    print "\nResource categories:"
    for category in ($stats.categories | columns) {
        let count = ($stats.categories | get $category)
        print $"  ($category): ($count) resources"
    }
    
    print "\nMIME types:"
    for mime in ($stats.mime_types | columns) {
        let count = ($stats.mime_types | get $mime)
        print $"  ($mime): ($count) resources"
    }
    
    print $"\nFeatures:"
    print $"  Pagination: ($stats.pagination_enabled)"
    print $"  Subscriptions: ($stats.subscription_enabled)"
}