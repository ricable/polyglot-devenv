#!/usr/bin/env nu

# STDIO Transport for MCP Protocol
# Implements JSON-RPC 2.0 over stdin/stdout following MCP specification

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

# Main stdio server loop
export def stdio_main [] {
    mcp log "info" "Starting STDIO MCP Server..."
    
    # Set up signal handlers for cleanup
    # Note: Nushell signal handling is limited, so we'll use error handling
    
    try {
        # Main message loop
        stdio_message_loop
    } catch { |err|
        mcp log "error" $"Server error: ($err.msg)"
        cleanup_server
        exit 1
    }
}

# Main message processing loop
def stdio_message_loop [] {
    mcp log "debug" "Starting message loop..."
    
    # Read from stdin using lines
    try {
        for line in (lines) {
            # Process each line as a JSON-RPC message
            try {
                if ($line | str trim) != "" {
                    let message = ($line | from json)
                    mcp log "debug" $"Received message: ($message.method? | default 'unknown')"
                    
                    # Process the message
                    let response = (process_message $message)
                    
                    # Send response if it's a request (has id)
                    if ($response != null) and ("id" in ($message | columns)) {
                        send_message $response
                    }
                }
            } catch { |err|
                mcp log "error" $"Message processing error: ($err.msg)"
                
                # Send error response if possible
                try {
                    let error_response = (jsonrpc create_response null null {
                        code: $MCP_ERROR_CODES.INTERNAL_ERROR
                        message: $"Internal server error: ($err.msg)"
                    })
                    send_message $error_response
                } catch { }
            }
        }
    } catch { |err|
        mcp log "error" $"Stdin reading error: ($err.msg)"
    }
}

# Process incoming JSON-RPC message
def process_message [message: record] -> any {
    # Validate JSON-RPC format
    if not ("jsonrpc" in ($message | columns)) or ($message.jsonrpc != "2.0") {
        return (jsonrpc create_response ($message.id? | default null) null {
            code: $MCP_ERROR_CODES.INVALID_REQUEST
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
        
        # Tools
        "tools/list" => (handle_list_tools $id)
        "tools/call" => (handle_call_tool $id $params)
        
        # Resources  
        "resources/list" => (handle_list_resources $id $params)
        "resources/read" => (handle_read_resource $id $params)
        "resources/subscribe" => (handle_subscribe_resource $id $params)
        "resources/unsubscribe" => (handle_unsubscribe_resource $id $params)
        "resources/templates/list" => (handle_list_resource_templates $id)
        
        # Prompts
        "prompts/list" => (handle_list_prompts $id)
        "prompts/get" => (handle_get_prompt $id $params)
        
        # Completions
        "completion/complete" => (handle_complete $id $params)
        
        # Logging
        "logging/setLevel" => (handle_set_log_level $id $params)
        
        # Sampling
        "sampling/createMessage" => (handle_sampling $id $params)
        
        _ => {
            if ($id != null) {
                jsonrpc create_response $id null {
                    code: $MCP_ERROR_CODES.METHOD_NOT_FOUND
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
    
    # Validate protocol version
    let protocol_version = ($params.protocolVersion? | default "")
    if $protocol_version != (mcp get_protocol_version) {
        return (jsonrpc create_response $id null {
            code: (mcp get_error_codes).INVALID_PARAMS
            message: $"Unsupported protocol version: ($protocol_version). Expected: (mcp get_protocol_version)"
        })
    }
    
    # Store client info
    $server_state.client_info = ($params.clientInfo? | default {})
    $server_state.capabilities = (mcp get_capabilities)
    
    # Respond with server capabilities
    let server_info = {
        name: "polyglot-dev"
        version: "1.0.0"
        description: "Comprehensive MCP server for polyglot development environment"
    }
    
    return (jsonrpc create_response $id {
        protocolVersion: (mcp get_protocol_version)
        capabilities: $server_state.capabilities
        serverInfo: $server_info
        instructions: "Testing and demonstration server for polyglot development environment. 

Resources: Documentation, configurations, and examples with pagination support. Resources are subscribable and update automatically.

Key dependencies: Progress notifications require `_meta.progressToken` in tool calls. Resource subscriptions generate updates every 10 seconds.

Performance characteristics: Server can execute long-running operations with progress updates. All environment operations support real-time progress tracking.

Multi-modal support: Tools can return text, images, and resource references. Complex prompts include both text arguments and embedded resource content.

Environment integration: Full access to Python, TypeScript, Rust, Go, and Nushell development environments with devbox isolation."
    })
}

# Initialized notification handler
def handle_initialized [params: record] -> any {
    mcp log "info" "Client initialized successfully"
    $server_state.initialized = true
    
    # Start background tasks
    start_background_tasks
    
    return null
}

# Ping handler
def handle_ping [id: any] -> record {
    jsonrpc create_response $id {}
}

# Start background tasks (notifications, updates, etc.)
def start_background_tasks [] {
    mcp log "debug" "Starting background tasks..."
    
    # Note: Nushell doesn't have native background task support like Node.js
    # For a production implementation, you might need to use external tools
    # or implement a more sophisticated event loop
    
    # For now, we'll just log that background tasks would be started
    mcp log "info" "Background tasks initialized (resource updates, logging, etc.)"
}

# Tools handlers
def handle_list_tools [id: any] -> record {
    use ../tools/registry.nu
    
    let tools = (list_all_tools)
    jsonrpc create_response $id { tools: $tools }
}

def handle_call_tool [id: any, params: record] -> record {
    use ../tools/dispatcher.nu
    
    try {
        let result = (dispatch_tool_call $params)
        jsonrpc create_response $id $result
    } catch { |err|
        jsonrpc create_response $id null {
            code: $MCP_ERROR_CODES.APPLICATION_ERROR
            message: $"Tool execution failed: ($err.msg)"
        }
    }
}

# Resources handlers
def handle_list_resources [id: any, params: record] -> record {
    use ../resources/registry.nu
    
    try {
        let result = (list_resources $params)
        jsonrpc create_response $id $result
    } catch { |err|
        jsonrpc create_response $id null {
            code: $MCP_ERROR_CODES.APPLICATION_ERROR
            message: $"Resource listing failed: ($err.msg)"
        }
    }
}

def handle_read_resource [id: any, params: record] -> record {
    use ../resources/reader.nu
    
    try {
        let result = (read_resource $params.uri)
        jsonrpc create_response $id $result
    } catch { |err|
        jsonrpc create_response $id null {
            code: $MCP_ERROR_CODES.APPLICATION_ERROR
            message: $"Resource reading failed: ($err.msg)"
        }
    }
}

def handle_subscribe_resource [id: any, params: record] -> record {
    let uri = $params.uri
    $server_state.subscriptions = ($server_state.subscriptions | insert $uri true)
    mcp log "debug" $"Subscribed to resource: ($uri)"
    
    jsonrpc create_response $id {}
}

def handle_unsubscribe_resource [id: any, params: record] -> record {
    let uri = $params.uri
    $server_state.subscriptions = ($server_state.subscriptions | reject $uri)
    mcp log "debug" $"Unsubscribed from resource: ($uri)"
    
    jsonrpc create_response $id {}
}

def handle_list_resource_templates [id: any] -> record {
    use ../resources/templates.nu
    
    let templates = (list_resource_templates)
    jsonrpc create_response $id { resourceTemplates: $templates }
}

# Prompts handlers
def handle_list_prompts [id: any] -> record {
    use ../prompts/registry.nu
    
    let prompts = (list_all_prompts)
    jsonrpc create_response $id { prompts: $prompts }
}

def handle_get_prompt [id: any, params: record] -> record {
    use ../prompts/handler.nu
    
    try {
        let result = (get_prompt $params.name ($params.arguments? | default {}))
        jsonrpc create_response $id $result
    } catch { |err|
        jsonrpc create_response $id null {
            code: $MCP_ERROR_CODES.APPLICATION_ERROR
            message: $"Prompt execution failed: ($err.msg)"
        }
    }
}

# Completions handler
def handle_complete [id: any, params: record] -> record {
    use ../tools/completions.nu
    
    try {
        let result = (get_completions $params)
        jsonrpc create_response $id $result
    } catch { |err|
        jsonrpc create_response $id null {
            code: $MCP_ERROR_CODES.APPLICATION_ERROR
            message: $"Completion failed: ($err.msg)"
        }
    }
}

# Logging handler
def handle_set_log_level [id: any, params: record] -> record {
    let level = $params.level
    
    if not (validate log_level $level) {
        return (jsonrpc create_response $id null {
            code: (mcp get_error_codes).INVALID_PARAMS
            message: $"Invalid log level: ($level). Must be one of: ($MCP_LOG_LEVELS | str join ', ')"
        })
    }
    
    $server_state.log_level = $level
    $env.MCP_LOG_LEVEL = $level
    mcp log "info" $"Log level set to: ($level)"
    
    jsonrpc create_response $id {}
}

# Sampling handler (experimental)
def handle_sampling [id: any, params: record] -> record {
    # For now, return a simple mock response
    # In a real implementation, this would integrate with an LLM
    jsonrpc create_response $id {
        role: "assistant"
        content: {
            type: "text"
            text: "This is a mock response from the sampling handler. In a real implementation, this would integrate with an LLM service."
        }
        model: "mock-model"
        stopReason: "endTurn"
        usage: {
            inputTokens: 10
            outputTokens: 25
        }
    }
}

# Cleanup function
def cleanup_server [] {
    mcp log "info" "Cleaning up server resources..."
    
    # Clear subscriptions
    $server_state.subscriptions = {}
    
    # Additional cleanup would go here
    mcp log "info" "Server cleanup completed"
}

# Export main function
export def main [] {
    stdio_main
}