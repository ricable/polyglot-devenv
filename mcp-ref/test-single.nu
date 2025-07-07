#!/usr/bin/env nu

# Test a single MCP request/response
use common.nu *

def main [method: string = "initialize"] {
    print $"🧪 Testing MCP method: ($method)"
    
    match $method {
        "initialize" => {
            let request = {
                jsonrpc: "2.0"
                id: 1
                method: "initialize"
                params: {
                    protocolVersion: "2024-11-05"
                    capabilities: {}
                    clientInfo: {
                        name: "test-client"
                        version: "1.0.0"
                    }
                }
            }
            
            print "📤 Request:"
            print ($request | to json --raw)
            
            let response = (jsonrpc create_response 1 {
                protocolVersion: (mcp get_protocol_version)
                capabilities: (mcp get_capabilities)
                serverInfo: {
                    name: "polyglot-dev"
                    version: "1.0.0"
                    description: "Polyglot development MCP server"
                }
                instructions: "Testing MCP server for polyglot development environment"
            })
            
            print "📥 Response:"
            print ($response | to json --raw)
        }
        
        "tools" => {
            let request = {
                jsonrpc: "2.0"
                id: 2
                method: "tools/list"
                params: {}
            }
            
            print "📤 Request:"
            print ($request | to json --raw)
            
            let tools = [
                {
                    name: "echo"
                    description: "Echo back text"
                    inputSchema: {
                        type: "object"
                        properties: {
                            text: { type: "string", description: "Text to echo" }
                        }
                        required: ["text"]
                    }
                }
            ]
            
            let response = (jsonrpc create_response 2 { tools: $tools })
            
            print "📥 Response:"
            print ($response | to json --raw)
        }
        
        "call" => {
            let request = {
                jsonrpc: "2.0"
                id: 3
                method: "tools/call"
                params: {
                    name: "echo"
                    arguments: {
                        text: "Hello from MCP!"
                    }
                }
            }
            
            print "📤 Request:"
            print ($request | to json --raw)
            
            let response = (jsonrpc create_response 3 {
                content: [
                    (create text_content "Echo: Hello from MCP!")
                ]
            })
            
            print "📥 Response:"
            print ($response | to json --raw)
        }
        
        _ => {
            print $"❌ Unknown test method: ($method)"
            print "Available methods: initialize, tools, call"
        }
    }
    
    print "✅ Test completed successfully!"
}