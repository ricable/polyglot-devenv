#!/usr/bin/env nu

# Fixed STDIO Transport for MCP Protocol
# Uses a different approach to read from stdin that works with pipes

use ../common.nu *
use capabilities.nu *

# Global server state
mut $server_state = {
    initialized: false
    capabilities: {}
    subscriptions: {}
    log_level: "info"
    client_info: {}
}

# Main stdio server loop - simplified version
export def stdio_main [] {
    mcp log "info" "Starting STDIO MCP Server..."
    
    # Process stdin input
    stdio_process_stdin
}

# Process stdin input using a different approach
def stdio_process_stdin [] {
    mcp log "debug" "Reading from stdin..."
    
    # Read all input and process line by line
    let input_lines = (lines)
    
    for line in $input_lines {
        if ($line | str trim) != "" {
            mcp log "debug" $"Processing line: ($line)"
            try {
                let message = ($line | from json)
                mcp log "debug" $"Received message: ($message.method? | default 'unknown')"
                
                # Process the message
                let response = (process_message $message)
                
                # Send response if it's a request (has id)
                if ($response != null) and ("id" in ($message | columns)) {
                    send_message $response
                }
            } catch { |err|
                mcp log "error" $"Message processing error: ($err.msg)"
                
                # Send error response
                let error_response = (jsonrpc create_response null null {
                    code: -32700
                    message: $"Parse error: ($err.msg)"
                })
                send_message $error_response
            }
        }
    }
}

# Process incoming JSON-RPC message (simplified)
def process_message [message: record] -> any {
    # Validate JSON-RPC format
    if not ("jsonrpc" in ($message | columns)) or ($message.jsonrpc != "2.0") {
        return (jsonrpc create_response ($message.id? | default null) null {
            code: -32600
            message: "Invalid JSON-RPC 2.0 format"
        })
    }
    
    # Get method name
    let method = ($message.method? | default "")
    let params = ($message.params? | default {})
    let id = ($message.id? | default null)
    
    mcp log "debug" $"Processing method: ($method)"
    
    # Route to appropriate handler
    match $method {
        "initialize" => (handle_initialize $id $params)
        "initialized" => (handle_initialized $params)
        "ping" => (handle_ping $id)
        "tools/list" => (handle_list_tools $id)
        _ => {
            if ($id != null) {
                jsonrpc create_response $id null {
                    code: -32601
                    message: $"Method not found: ($method)"
                }
            } else {
                null
            }
        }
    }
}

# Send JSON-RPC message to stdout
def send_message [message: record] {
    let json_message = ($message | to json --raw)
    print $json_message
}

# Initialize handler
def handle_initialize [id: any, params: record] -> record {
    mcp log "info" "Handling initialize request"
    
    # Respond with server capabilities
    let server_info = {
        name: "polyglot-dev"
        version: "1.0.0"
        description: "Polyglot development environment MCP server"
    }
    
    return (jsonrpc create_response $id {
        protocolVersion: "2024-11-05"
        capabilities: {
            tools: {}
            resources: {}
            prompts: {}
            logging: {}
        }
        serverInfo: $server_info
    })
}

# Initialized notification handler
def handle_initialized [params: record] -> any {
    mcp log "info" "Client initialized successfully"
    $server_state.initialized = true
    return null
}

# Ping handler
def handle_ping [id: any] -> record {
    jsonrpc create_response $id {}
}

# Tools handlers
def handle_list_tools [id: any] -> record {
    let tools = [
        {
            name: "test-tool"
            description: "A test tool"
            inputSchema: {
                type: "object"
                properties: {}
            }
        }
    ]
    jsonrpc create_response $id { tools: $tools }
}

# Export main function
export def main [] {
    stdio_main
}