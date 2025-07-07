#!/usr/bin/env nu

# Simplified STDIO MCP Server that works with pipes
export def stdio_main [] {
    # Write logs to stderr
    print -e "Starting simplified MCP server..."
    
    # Read input line by line using cat and process
    cat | lines | each { |line|
        if ($line | str trim) != "" {
            print -e $"Processing: ($line)"
            
            try {
                let message = ($line | from json)
                let method = ($message.method? | default "unknown")
                print -e $"Method: ($method)"
                
                if $method == "initialize" {
                    let response = {
                        jsonrpc: "2.0"
                        id: $message.id
                        result: {
                            protocolVersion: "2024-11-05"
                            capabilities: {
                                tools: {}
                                resources: {}
                                prompts: {}
                            }
                            serverInfo: {
                                name: "polyglot-dev"
                                version: "1.0.0"
                            }
                        }
                    }
                    print ($response | to json)
                } else if $method == "initialized" {
                    print -e "Client initialized"
                } else if $method == "tools/list" {
                    let response = {
                        jsonrpc: "2.0"
                        id: $message.id
                        result: {
                            tools: []
                        }
                    }
                    print ($response | to json)
                } else {
                    if "id" in ($message | columns) {
                        let error_response = {
                            jsonrpc: "2.0"
                            id: $message.id
                            error: {
                                code: -32601
                                message: $"Method not found: ($method)"
                            }
                        }
                        print ($error_response | to json)
                    }
                }
            } catch { |err|
                print -e $"JSON parse error: ($err.msg)"
                let error_response = {
                    jsonrpc: "2.0"
                    id: null
                    error: {
                        code: -32700
                        message: $"Parse error: ($err.msg)"
                    }
                }
                print ($error_response | to json)
            }
        }
    }
}