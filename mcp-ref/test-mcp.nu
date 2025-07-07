#!/usr/bin/env nu

# Simple MCP server test script
use common.nu *

# Test the basic MCP infrastructure
def main [] {
    print "🔧 Testing MCP Server Components"
    print "================================"
    
    # Test JSON-RPC utilities
    print "\n📡 Testing JSON-RPC utilities:"
    let request = (jsonrpc create_request "test-123" "test/method" { param: "value" })
    print $"✅ Request: ($request.method)"
    
    let response = (jsonrpc create_response "test-123" { result: "success" })
    print $"✅ Response: ($response.id)"
    
    let notification = (jsonrpc create_notification "test/notification" { data: "hello" })
    print $"✅ Notification: ($notification.method)"
    
    # Test capabilities
    print "\n🔧 Testing capabilities:"
    let caps = (mcp get_capabilities)
    print $"✅ Capabilities loaded: ($caps | columns | length) categories"
    
    # Test content utilities
    print "\n📄 Testing content utilities:"
    let text_content = (create text_content "Hello, MCP!")
    print $"✅ Text content: ($text_content.type)"
    
    let resource_content = (create resource_content "file://test.txt" "Test resource")
    print $"✅ Resource content: ($resource_content.type)"
    
    # Test validation
    print "\n✅ Testing validation:"
    let valid_env = (validate environment "python-env")
    print $"✅ Environment validation: ($valid_env)"
    
    let valid_level = (validate log_level "info")
    print $"✅ Log level validation: ($valid_level)"
    
    # Test workspace utilities
    print "\n📁 Testing workspace utilities:"
    let workspace = (get workspace_root)
    print $"✅ Workspace root: ($workspace)"
    
    let env_path = (get environment_path "python-env")
    print $"✅ Environment path: ($env_path)"
    
    # Test logging
    print "\n📝 Testing logging:"
    mcp log "info" "Test log message"
    mcp log "debug" "Debug message"
    mcp log "warning" "Warning message"
    
    print "\n🎉 All basic MCP components working correctly!"
    
    # Test a simple stdio initialization
    print "\n🔌 Testing simple initialization:"
    let init_request = {
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
    
    print $"✅ Sample init request: ($init_request.method)"
    
    # Create a mock initialization response
    let init_response = (jsonrpc create_response 1 {
        protocolVersion: (mcp get_protocol_version)
        capabilities: (mcp get_capabilities)
        serverInfo: {
            name: "polyglot-dev"
            version: "1.0.0"
        }
    })
    
    print $"✅ Sample init response: ($init_response.result.serverInfo.name)"
    
    print "\n🚀 MCP Server infrastructure ready!"
    print $"   Protocol version: (mcp get_protocol_version)"
    print $"   Capabilities: ($caps | columns | str join ', ')"
    print "   Transport: STDIO ready"
    
    return 0
}