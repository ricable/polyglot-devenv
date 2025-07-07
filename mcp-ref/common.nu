#!/usr/bin/env nu

# Common utilities for the Polyglot MCP Server
# Provides shared functionality across all MCP server components

# Import the main common utilities from nushell-env
use ../nushell-env/common.nu *

# MCP-specific logging functions with JSON-RPC awareness
export def "mcp log" [
    level: string     # Log level: debug, info, notice, warning, error, critical, alert, emergency
    message: string   # Log message
] {
    let timestamp = (date now | format date '%Y-%m-%d %H:%M:%S')
    let colored_message = match $level {
        "debug" => $"(ansi grey)($message)(ansi reset)"
        "info" => $"(ansi blue)($message)(ansi reset)"
        "notice" => $"(ansi cyan)($message)(ansi reset)"
        "warning" => $"(ansi yellow)($message)(ansi reset)"
        "error" => $"(ansi red)($message)(ansi reset)"
        "critical" => $"(ansi red_bold)($message)(ansi reset)"
        "alert" => $"(ansi magenta_bold)($message)(ansi reset)"
        "emergency" => $"(ansi red_reverse)($message)(ansi reset)"
        _ => $message
    }
    
    # Log to stderr for MCP compatibility
    print -e $"[$timestamp] [($level | str upcase)] ($colored_message)"
}

# JSON-RPC 2.0 message utilities
export def "jsonrpc create_request" [
    id: any           # Request ID (string or number)
    method: string    # Method name
    params?: record   # Parameters (optional)
] {
    mut request = {
        jsonrpc: "2.0"
        id: $id
        method: $method
    }
    
    if ($params != null) {
        $request = ($request | insert params $params)
    }
    
    return $request
}

export def "jsonrpc create_response" [
    id: any           # Request ID
    result?: any      # Result (optional)
    error?: record    # Error (optional)
] {
    mut response = {
        jsonrpc: "2.0"
        id: $id
    }
    
    if ($result != null) {
        $response = ($response | insert result $result)
    } else if ($error != null) {
        $response = ($response | insert error $error)
    }
    
    return $response
}

export def "jsonrpc create_notification" [
    method: string    # Method name
    params?: record   # Parameters (optional)
] {
    mut notification = {
        jsonrpc: "2.0"
        method: $method
    }
    
    if ($params != null) {
        $notification = ($notification | insert params $params)
    }
    
    return $notification
}

export def "jsonrpc create_error" [
    code: int         # Error code
    message: string   # Error message
    data?: any        # Additional error data (optional)
] {
    mut error = {
        code: $code
        message: $message
    }
    
    if ($data != null) {
        $error = ($error | insert data $data)
    }
    
    return $error
}

# MCP protocol constants
export def "mcp get_protocol_version" [] { "2024-11-05" }

export def "mcp get_error_codes" [] {
    {
        PARSE_ERROR: -32700
        INVALID_REQUEST: -32600
        METHOD_NOT_FOUND: -32601
        INVALID_PARAMS: -32602
        INTERNAL_ERROR: -32603
        SERVER_ERROR_START: -32099
        SERVER_ERROR_END: -32000
        APPLICATION_ERROR: -32500
    }
}

export def "mcp get_log_levels" [] {
    ["debug" "info" "notice" "warning" "error" "critical" "alert" "emergency"]
}

# Server capabilities definition
export def "mcp get_capabilities" [] {
    return {
        prompts: {}
        resources: { 
            subscribe: true
            listChanged: true
        }
        tools: {}
        logging: {}
        completions: {}
        experimental: {
            sampling: {}
        }
    }
}

# Validation utilities
export def "validate environment" [env_name: string] {
    $env_name in ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"]
}

export def "validate log_level" [level: string] {
    $level in (mcp get_log_levels)
}

export def "validate resource_id" [id: any] {
    try {
        let num_id = ($id | into int)
        ($num_id >= 1) and ($num_id <= 1000)  # Support up to 1000 resources
    } catch {
        false
    }
}

# Progress notification utilities
export def "send progress_notification" [
    token: string     # Progress token
    progress: int     # Current progress
    total: int        # Total steps
] {
    jsonrpc create_notification "notifications/progress" {
        progressToken: $token
        progress: $progress
        total: $total
    }
}

# Resource update notification
export def "send resource_update" [uri: string] {
    jsonrpc create_notification "notifications/resources/updated" {
        uri: $uri
    }
}

# Logging notification
export def "send log_notification" [
    level: string     # Log level
    data: string      # Log data
] {
    jsonrpc create_notification "notifications/message" {
        level: $level
        data: $data
    }
}

# Stderr notification
export def "send stderr_notification" [content: string] {
    jsonrpc create_notification "notifications/stderr" {
        content: $content
    }
}

# Content utilities for tool responses
export def "create text_content" [text: string] {
    {
        type: "text"
        text: $text
    }
}

export def "create image_content" [
    data: string      # Base64 encoded image data
    mime_type: string # MIME type (e.g., "image/png")
] {
    {
        type: "image"
        data: $data
        mimeType: $mime_type
    }
}

export def "create resource_content" [
    uri: string       # Resource URI
    text?: string     # Optional text description
] {
    mut content = {
        type: "resource"
        resource: {
            uri: $uri
        }
    }
    
    if ($text != null) {
        $content = ($content | insert text $text)
    }
    
    return $content
}

# Annotation utilities
export def "create annotation" [
    priority: float   # Priority (0.0 to 1.0)
    audience: list    # Audience list ["user", "assistant"]
] {
    {
        priority: $priority
        audience: $audience
    }
}

# Workspace utilities
export def "get workspace_root" [] {
    # Try environment variable first
    if ($env.MCP_WORKSPACE_ROOT? | is-not-empty) {
        return $env.MCP_WORKSPACE_ROOT
    }
    
    # Look for polyglot environment indicators
    let current_dir = $env.PWD
    
    # Check if we're already in the project root
    if ($current_dir | path join "python-env" | path exists) {
        return $current_dir
    }
    
    # Check if we're in a subdirectory of the project
    let parent_dir = ($current_dir | path dirname)
    if ($parent_dir | path join "python-env" | path exists) {
        return $parent_dir
    }
    
    # Check if we're in polyglot-devenv directory
    if ($current_dir | path basename) == "polyglot-devenv" {
        return $current_dir
    }
    
    # Default to current directory
    return $current_dir
}

export def "get environment_path" [env_name: string] {
    let workspace = (get workspace_root)
    $workspace | path join $env_name
}

# File system utilities for MCP
export def "safe_read_file" [file_path: string] {
    try {
        open $file_path
    } catch {
        ""
    }
}

export def "file_exists_safe" [file_path: string] {
    try {
        $file_path | path exists
    } catch {
        false
    }
}

# Schema validation utilities (simplified Zod-like validation)
export def "validate schema" [
    data: record      # Data to validate
    schema: record    # Schema definition
] {
    mut result = {
        valid: true
        errors: []
    }
    
    # Check required fields
    if "required" in ($schema | columns) {
        for field in $schema.required {
            if not ($field in ($data | columns)) {
                $result.valid = false
                $result.errors = ($result.errors | append $"Missing required field: ($field)")
            }
        }
    }
    
    # Check field types
    if "properties" in ($schema | columns) {
        for prop in ($schema.properties | columns) {
            if $prop in ($data | columns) {
                let value = ($data | get $prop)
                let prop_schema = ($schema.properties | get $prop)
                
                if "type" in ($prop_schema | columns) {
                    let expected_type = ($prop_schema.type)
                    let actual_type = ($value | describe)
                    
                    # Simple type checking
                    let type_valid = match $expected_type {
                        "string" => ($actual_type | str starts-with "string")
                        "number" => ($actual_type in ["int", "float"])
                        "boolean" => ($actual_type == "bool")
                        "array" => ($actual_type | str starts-with "list")
                        "object" => ($actual_type == "record")
                        _ => true
                    }
                    
                    if not $type_valid {
                        $result.valid = false
                        $result.errors = ($result.errors | append $"Field ($prop) expected ($expected_type), got ($actual_type)")
                    }
                }
                
                # Check enum values
                if "enum" in ($prop_schema | columns) {
                    if not ($value in $prop_schema.enum) {
                        $result.valid = false
                        $result.errors = ($result.errors | append $"Field ($prop) must be one of: ($prop_schema.enum | str join ', ')")
                    }
                }
            }
        }
    }
    
    return $result
}

# Base64 utilities
export def "encode_base64" [data: string] {
    $data | encode base64
}

export def "decode_base64" [data: string] {
    $data | decode base64
}

# Time utilities for MCP
export def "get_timestamp" [] {
    date now | format date '%Y-%m-%d %H:%M:%S'
}

export def "get_iso_timestamp" [] {
    date now | format date '%Y-%m-%dT%H:%M:%S.%fZ'
}

# Simple test image (1x1 pixel PNG)
export def "mcp get_tiny_image" [] {
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
}

# Export all functions for use in other modules
export def main [] {
    print "MCP Common Utilities Module"
    print "Provides shared functionality for the Polyglot MCP Server"
}