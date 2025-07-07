#!/usr/bin/env nu

# Test MCP tools integration

use common.nu *

# Test initialize and tools/list
def test_tools_list [] {
    print "🧪 Testing tools/list..."
    
    let init_request = {
        jsonrpc: "2.0"
        id: 1
        method: "initialize"
        params: {
            protocolVersion: "2024-11-05"
            capabilities: {}
            clientInfo: {name: "test-client", version: "1.0.0"}
        }
    }
    
    let tools_request = {
        jsonrpc: "2.0"
        id: 2
        method: "tools/list"
        params: {}
    }
    
    # Create test input with both requests
    let test_input = [
        ($init_request | to json)
        ($tools_request | to json)
    ] | str join "\n"
    
    print $"📤 Sending: ($init_request.method) and ($tools_request.method)"
    
    # Run server with test input
    let result = ($test_input | nu server.nu stdio)
    
    if ($result | str contains "devbox/shell") {
        print "✅ tools/list working - devbox tools found"
        return true
    } else {
        print "❌ tools/list failed"
        print $"Response: ($result)"
        return false
    }
}

# Test echo tool
def test_echo_tool [] {
    print "🧪 Testing echo tool..."
    
    let init_request = {
        jsonrpc: "2.0"
        id: 1
        method: "initialize"
        params: {
            protocolVersion: "2024-11-05"
            capabilities: {}
            clientInfo: {name: "test-client", version: "1.0.0"}
        }
    }
    
    let echo_request = {
        jsonrpc: "2.0"
        id: 2
        method: "tools/call"
        params: {
            name: "echo"
            arguments: {message: "Hello MCP!"}
        }
    }
    
    let test_input = [
        ($init_request | to json)
        ($echo_request | to json)
    ] | str join "\n"
    
    print $"📤 Testing echo tool with message: 'Hello MCP!'"
    
    let result = ($test_input | nu server.nu stdio)
    
    if ($result | str contains "Hello MCP!") {
        print "✅ echo tool working"
        return true
    } else {
        print "❌ echo tool failed"
        print $"Response: ($result)"
        return false
    }
}

# Test environment/info tool
def test_environment_tool [] {
    print "🧪 Testing environment/info tool..."
    
    let init_request = {
        jsonrpc: "2.0"
        id: 1
        method: "initialize"
        params: {
            protocolVersion: "2024-11-05"
            capabilities: {}
            clientInfo: {name: "test-client", version: "1.0.0"}
        }
    }
    
    let env_request = {
        jsonrpc: "2.0"
        id: 2
        method: "tools/call"
        params: {
            name: "environment/info"
            arguments: {environment: "python-env"}
        }
    }
    
    let test_input = [
        ($init_request | to json)
        ($env_request | to json)
    ] | str join "\n"
    
    print $"📤 Testing environment/info for python-env"
    
    let result = ($test_input | nu server.nu stdio)
    
    if ($result | str contains "python-env") {
        print "✅ environment/info tool working"
        return true
    } else {
        print "❌ environment/info tool failed" 
        print $"Response: ($result)"
        return false
    }
}

def main [] {
    print "🔧 Testing MCP Tools in mcp-ref/"
    print "================================\n"
    
    let tests = [
        (test_tools_list)
        (test_echo_tool)
        (test_environment_tool)
    ]
    
    let passed = ($tests | where $it == true | length)
    let total = ($tests | length)
    
    print $"\n📊 Test Results: ($passed)/($total) passed"
    
    if $passed == $total {
        print "🎉 All MCP tools working correctly in mcp-ref!"
        exit 0
    } else {
        print "❌ Some MCP tools failed"
        exit 1
    }
}