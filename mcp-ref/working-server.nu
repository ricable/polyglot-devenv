#!/usr/bin/env nu

# Minimal Working MCP Server for Polyglot Development
# This version properly handles stdio communication

use common.nu *

# Main entry point
def main [] {
    # Initialize server
    print -e "Starting minimal polyglot MCP server..."
    
    # Process stdin messages
    loop {
        try {
            # Read a line from stdin
            let line = (input)
            
            if ($line | is-empty) {
                continue
            }
            
            # Parse JSON message
            let message = ($line | from json)
            
            # Handle the message based on method
            let response = match ($message.method? | default "") {
                "initialize" => {
                    handle_initialize $message
                }
                "initialized" => {
                    null  # No response needed
                }
                "tools/list" => {
                    handle_tools_list $message
                }
                "tools/call" => {
                    handle_tool_call $message
                }
                _ => {
                    if "id" in $message {
                        create_error_response $message.id -32601 "Method not found"
                    } else {
                        null
                    }
                }
            }
            
            # Send response if needed
            if $response != null {
                print ($response | to json -r)
            }
            
        } catch { |err|
            print -e $"Error processing message: ($err.msg)"
        }
    }
}

# Handle initialize request
def handle_initialize [message: record] {
    {
        jsonrpc: "2.0"
        id: $message.id
        result: {
            protocolVersion: "2024-11-05"
            capabilities: {
                tools: {}
            }
            serverInfo: {
                name: "polyglot-dev"
                version: "1.0.0"
            }
        }
    }
}

# Handle tools/list request
def handle_tools_list [message: record] {
    {
        jsonrpc: "2.0"
        id: $message.id
        result: {
            tools: [
                {
                    name: "check_environment"
                    description: "Check the status of a polyglot development environment"
                    inputSchema: {
                        type: "object"
                        properties: {
                            env: {
                                type: "string"
                                description: "Environment to check (python, typescript, rust, go, nushell)"
                                enum: ["python", "typescript", "rust", "go", "nushell"]
                            }
                        }
                        required: ["env"]
                    }
                }
                {
                    name: "run_devbox_command"
                    description: "Run a devbox command in a specific environment"
                    inputSchema: {
                        type: "object"
                        properties: {
                            env: {
                                type: "string"
                                description: "Environment to run command in"
                                enum: ["python", "typescript", "rust", "go", "nushell"]
                            }
                            command: {
                                type: "string"
                                description: "Devbox command to run (e.g., 'test', 'lint', 'format')"
                            }
                        }
                        required: ["env", "command"]
                    }
                }
            ]
        }
    }
}

# Handle tool call
def handle_tool_call [message: record] {
    let tool_name = $message.params.name
    let args = $message.params.arguments? | default {}
    
    let result = match $tool_name {
        "check_environment" => {
            check_environment $args.env
        }
        "run_devbox_command" => {
            run_devbox_command $args.env $args.command
        }
        _ => {
            return (create_error_response $message.id -32602 "Unknown tool")
        }
    }
    
    {
        jsonrpc: "2.0"
        id: $message.id
        result: {
            content: [
                {
                    type: "text"
                    text: $result
                }
            ]
        }
    }
}

# Check environment status
def check_environment [env_name: string] {
    let env_path = $env.PWD | path dirname | path join $"($env_name)-env"
    
    if not ($env_path | path exists) {
        return $"Environment ($env_name) not found at ($env_path)"
    }
    
    # Check if devbox.json exists
    let devbox_path = $env_path | path join "devbox.json"
    if not ($devbox_path | path exists) {
        return $"Environment ($env_name) exists but devbox.json not found"
    }
    
    $"✅ Environment ($env_name) is properly configured at ($env_path)"
}

# Run devbox command
def run_devbox_command [env_name: string, command: string] {
    let env_path = $env.PWD | path dirname | path join $"($env_name)-env"
    
    if not ($env_path | path exists) {
        return $"Error: Environment ($env_name) not found"
    }
    
    # Run the devbox command
    try {
        let result = (cd $env_path; devbox run $command | complete)
        
        if $result.exit_code == 0 {
            $"✅ Successfully ran 'devbox run ($command)' in ($env) environment\n\nOutput:\n($result.stdout)"
        } else {
            $"❌ Failed to run 'devbox run ($command)' in ($env) environment\n\nError:\n($result.stderr)"
        }
    } catch { |err|
        $"Error running command: ($err.msg)"
    }
}

# Create error response
def create_error_response [id: any, code: int, message: string] {
    {
        jsonrpc: "2.0"
        id: $id
        error: {
            code: $code
            message: $message
        }
    }
}