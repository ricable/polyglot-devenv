#!/usr/bin/env nu

# Simple MCP Server for testing
use common.nu *

# Simple tool registry for testing
def get_test_tools [] {
    [
        {
            name: "echo"
            description: "Echo back the provided text"
            inputSchema: {
                type: "object"
                properties: {
                    text: {
                        type: "string"
                        description: "Text to echo back"
                    }
                }
                required: ["text"]
            }
        }
        {
            name: "hello"
            description: "Say hello with optional name"
            inputSchema: {
                type: "object"
                properties: {
                    name: {
                        type: "string"
                        description: "Name to greet"
                    }
                }
            }
        }
    ]
}

# Simple tool execution
def execute_test_tool [name: string, args: record] {
    match $name {
        "echo" => {
            content: [
                (create text_content $"Echo: ($args.text)")
            ]
        }
        "hello" => {
            let greeting = if "name" in ($args | columns) {
                $"Hello, ($args.name)!"
            } else {
                "Hello, World!"
            }
            {
                content: [
                    (create text_content $greeting)
                ]
            }
        }
        _ => {
            error make { msg: $"Unknown tool: ($name)" }
        }
    }
}

# Process JSON-RPC message
def process_message [message: record] {
    # Validate JSON-RPC format
    if not ("jsonrpc" in ($message | columns)) or ($message.jsonrpc != "2.0") {
        return (jsonrpc create_response ($message.id? | default null) null {
            code: $MCP_ERROR_CODES.INVALID_REQUEST
            message: "Invalid JSON-RPC 2.0 format"
        })
    }
    
    let method = ($message.method? | default "")
    let params = ($message.params? | default {})
    let id = ($message.id? | default null)
    
    mcp log "debug" $"Processing method: ($method)"
    
    match $method {
        "initialize" => {
            mcp log "info" "Handling initialize request"
            
            let protocol_version = ($params.protocolVersion? | default "")
            if $protocol_version != $MCP_PROTOCOL_VERSION {
                return (jsonrpc create_response $id null {
                    code: $MCP_ERROR_CODES.INVALID_PARAMS
                    message: $"Unsupported protocol version: ($protocol_version). Expected: ($MCP_PROTOCOL_VERSION)"
                })
            }
            
            let server_info = {
                name: "simple-polyglot-mcp"
                version: "1.0.0"
                description: "Simple MCP server for polyglot development testing"
            }
            
            jsonrpc create_response $id {
                protocolVersion: $MCP_PROTOCOL_VERSION
                capabilities: (mcp get_capabilities)
                serverInfo: $server_info
                instructions: "Simple testing server with echo and hello tools"
            }
        }
        "initialized" => {
            mcp log "info" "Client initialized successfully"
            null
        }
        "ping" => {
            jsonrpc create_response $id {}
        }
        "tools/list" => {
            let tools = (get_test_tools)
            jsonrpc create_response $id { tools: $tools }
        }
        "tools/call" => {
            try {
                let result = (execute_test_tool $params.name $params.arguments)
                jsonrpc create_response $id $result
            } catch { |err|
                jsonrpc create_response $id null {
                    code: $MCP_ERROR_CODES.APPLICATION_ERROR
                    message: $"Tool execution failed: ($err.msg)"
                }
            }
        }
        "resources/list" => {
            jsonrpc create_response $id { resources: [] }
        }
        "prompts/list" => {
            jsonrpc create_response $id { prompts: [] }
        }
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

# Main stdio loop
def main [] {
    mcp log "info" "Starting Simple STDIO MCP Server..."
    
    loop {
        try {
            let line = (input)
            
            if ($line | str trim) != "" {
                let message = ($line | from json)
                mcp log "debug" $"Received message: ($message.method? | default 'unknown')"
                
                let response = (process_message $message)
                
                if ($response != null) and ("id" in ($message | columns)) {
                    let json_response = ($response | to json --raw)
                    print $json_response
                }
            }
        } catch { |err|
            mcp log "error" $"Message processing error: ($err.msg)"
            
            try {
                let error_response = (jsonrpc create_response null null {
                    code: $MCP_ERROR_CODES.INTERNAL_ERROR
                    message: $"Internal server error: ($err.msg)"
                })
                let json_response = ($error_response | to json --raw)
                print $json_response
            } catch { }
        }
    }
}