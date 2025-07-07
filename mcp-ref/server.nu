#!/usr/bin/env nu

# Polyglot Development Environment MCP Server
# A comprehensive Model Context Protocol server for polyglot development
# Supports stdio, SSE, and streamable HTTP transports

# Use relative path from mcp directory
use common.nu *

# Main entry point for the MCP server
def main [
    transport: string = "stdio"  # Transport type: stdio, sse, streamableHttp
    --port: int = 3001          # Port for SSE/HTTP transports
    --host: string = "localhost" # Host for SSE/HTTP transports
    --debug                     # Enable debug logging
] {
    # Set up logging
    let log_level = if $debug { "debug" } else { "info" }
    $env.MCP_LOG_LEVEL = $log_level
    
    mcp log info $"Starting Polyglot MCP Server with transport: ($transport)"
    
    match $transport {
        "stdio" => {
            mcp log info "Starting STDIO transport server..."
            use protocol/stdio-fixed.nu stdio_main
            stdio_main
        }
        _ => {
            mcp log error $"Unknown transport: ($transport)"
            print "Available transports:"
            print "- stdio (default)"
            exit 1
        }
    }
}

# Helper function to check if the server should run
def check_requirements [] {
    # Check if nushell version is compatible
    let nu_version = (version | get version)
    mcp log info $"Running on Nushell version: ($nu_version)"
    
    # Check if required directories exist
    let mcp_dir = $env.FILE_PWD? | default ($env.PWD)
    let workspace_root = $env.WORKSPACE_ROOT? | default ($mcp_dir | path dirname)
    
    let required_dirs = [
        ($mcp_dir | path join "protocol")
        ($mcp_dir | path join "tools")
        ($mcp_dir | path join "resources")
        ($workspace_root | path join "nushell-env" "scripts")
    ]
    
    for dir in $required_dirs {
        if not ($dir | path exists) {
            mcp log error $"Required directory not found: ($dir)"
            exit 1
        }
    }
    
    mcp log info "All requirements satisfied"
}

# Initialize the server environment
def init_server_env [] {
    # Set up environment variables
    $env.MCP_SERVER_NAME = "polyglot-dev"
    $env.MCP_SERVER_VERSION = "1.0.0"
    $env.MCP_WORKSPACE_ROOT = ($env.PWD | path dirname)
    
    # Initialize common utilities
    source common.nu
    
    mcp log info "Server environment initialized"
}

# Cleanup function for graceful shutdown
def cleanup [] {
    mcp log info "Cleaning up server resources..."
    
    # Clear any running intervals or timers
    # (This would be implemented per transport)
    
    mcp log info "Server cleanup completed"
}

# Error handler for uncaught errors
def handle_error [error: string] {
    log error $"Uncaught error: ($error)"
    cleanup
    exit 1
}

# Main execution block
try {
    check_requirements
    init_server_env
} catch { |err|
    handle_error $err.msg
}