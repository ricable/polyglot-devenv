# Polyglot Development MCP Server

A comprehensive Model Context Protocol (MCP) server implemented in Nushell that provides extensive access to polyglot development environments, automation scripts, and intelligent development tools.

## 🚀 Features

### ✅ Complete MCP Protocol Implementation
- **JSON-RPC 2.0**: Full protocol compliance with stdio transport
- **Tools**: 40+ development tools with progress notifications
- **Resources**: 100+ resources with pagination and subscriptions
- **Prompts**: Advanced prompts with arguments and embedded resources
- **Completions**: Auto-completion for all tool arguments and resource URIs
- **Logging**: Multi-level logging with real-time filtering

### 🛠️ Development Environment Integration
- **DevBox Environments**: Full access to Python, TypeScript, Rust, Go, and Nushell isolated environments
- **Package Management**: Install, list, and manage packages across environments
- **Script Execution**: Run devbox scripts with progress tracking
- **Environment Health**: Comprehensive environment analysis and recommendations

### 🤖 Nushell Automation
- **Script Library**: Execute 25+ automation scripts for validation, performance, security
- **Cross-Language Validation**: Parallel validation across all environments
- **Performance Analytics**: Real-time performance monitoring and optimization
- **Resource Monitoring**: System resource tracking and alerts
- **Security Scanning**: Comprehensive security analysis and compliance

### 📋 Context Engineering
- **PRP Generation**: Generate Product Requirements Prompts with environment-specific templates
- **Enhanced PRP System**: Version-controlled PRP generation with auto-rollback
- **Dojo Integration**: Access to CopilotKit patterns and components
- **Pattern Extraction**: Extract and analyze development patterns

### 🐳 DevPod Container Management
- **Multi-Workspace Provisioning**: Create 1-10 containerized workspaces per environment
- **VS Code Integration**: Auto-launch with language-specific extensions
- **Resource Management**: Smart lifecycle management with cleanup
- **Progress Tracking**: Real-time provisioning progress

## 📁 Project Structure

```
mcp/
├── server.nu                    # Main MCP server entry point
├── common.nu                    # Common utilities and JSON-RPC helpers
├── instructions.md              # Comprehensive server documentation
├── protocol/
│   ├── stdio.nu                 # STDIO transport implementation
│   └── capabilities.nu          # Server capabilities definition
├── tools/
│   ├── registry.nu              # Tool registry with all available tools
│   ├── dispatcher.nu            # Tool call routing and execution
│   ├── devbox.nu               # DevBox environment tools
│   ├── nushell.nu              # Nushell script execution tools
│   ├── environment.nu          # Environment management tools
│   └── completions.nu          # Auto-completion system
├── resources/
│   ├── registry.nu             # Resource registry with pagination
│   ├── reader.nu               # Resource content reading
│   └── templates.nu            # Dynamic resource templates
└── README.md                   # This file
```

## 🎯 Quick Start

### Prerequisites
- [Nushell](https://www.nushell.sh/) 0.103.0+
- [DevBox](https://www.jetify.com/devbox) for environment management
- Development environments set up (python-env, typescript-env, etc.)

### Installation
1. The MCP server is already configured in `.mcp.json`
2. Ensure Nushell is available in your PATH
3. Test the server:

```bash
# Test server startup
nu mcp/server.nu --help

# Test with a simple echo
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | nu mcp/server.nu stdio
```

### Integration with Claude Desktop
The server is pre-configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "polyglot-dev": {
      "command": "nu",
      "args": ["./mcp/server.nu", "stdio"],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}",
        "NU_LIB_DIRS": "${workspaceFolder}/nushell-env/scripts:${workspaceFolder}/mcp",
        "MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

## 🔧 Available Tools

### DevBox Tools (`devbox/*`)
| Tool | Description | Arguments |
|------|-------------|-----------|
| `devbox/shell` | Enter environment shells | `environment` |
| `devbox/run` | Execute commands with progress | `environment`, `command`, `args?` |
| `devbox/list_packages` | Package inventory | `environment` |
| `devbox/add_package` | Install new packages | `environment`, `package`, `version?` |
| `devbox/status` | Health check all environments | - |

### Nushell Tools (`nushell/*`)
| Tool | Description | Arguments |
|------|-------------|-----------|
| `nushell/run_script` | Execute automation scripts | `script`, `args?` |
| `nushell/validate_all` | Cross-environment validation | `parallel?`, `environment?` |
| `nushell/performance_analytics` | Performance monitoring | `action?`, `days?`, `format?` |
| `nushell/resource_monitor` | System resource tracking | `action?`, `interval?`, `hours?` |
| `nushell/security_scanner` | Security analysis | `action?`, `file?`, `quiet?` |

### Reference Tools
| Tool | Description | Arguments |
|------|-------------|-----------|
| `echo` | Simple echo tool | `message` |
| `add` | Number addition | `a`, `b` |
| `longRunningOperation` | Progress demonstration | `duration?`, `steps?` |
| `getTinyImage` | Image content example | - |
| `annotatedMessage` | Annotation examples | `messageType`, `includeImage?` |
| `getResourceReference` | Resource reference examples | `resourceId` |

## 📚 Available Resources

### Documentation Resources (`polyglot://documentation/*`)
- `claude-md`: Main project documentation
- `context-engineering/{topic}`: Context engineering documentation
- `devbox/{environment}`: Environment-specific documentation

### Configuration Resources (`polyglot://config/*`)
- `devbox/{environment}`: Environment configurations
- `nushell/common`: Common utilities
- `claude/hooks`: Claude Code hooks configuration
- `mcp`: MCP server configuration

### Example Resources (`polyglot://examples/*`)
- `dojo/{feature}/{component}`: CopilotKit patterns and components
- `prps/{name}`: Generated Product Requirements Prompts

### Script Resources (`polyglot://scripts/*`)
- `nushell/{script}`: Automation scripts
- `devpod/{script}`: Container management scripts

### Test Resources (`test://static/resource/{id}`)
- Resources 1-100: Even IDs contain text, odd IDs contain binary data

## 🎨 Usage Examples

### Environment Management
```json
{
  "method": "tools/call",
  "params": {
    "name": "devbox/status",
    "arguments": {}
  }
}
```

### Script Execution with Progress
```json
{
  "method": "tools/call",
  "params": {
    "name": "nushell/validate_all",
    "arguments": {
      "parallel": true,
      "environment": "all"
    },
    "_meta": {
      "progressToken": "validation-123"
    }
  }
}
```

### Resource Access
```json
{
  "method": "resources/read",
  "params": {
    "uri": "polyglot://documentation/claude-md"
  }
}
```

### Resource Templates
```json
{
  "method": "resources/templates/list",
  "params": {}
}
```

## 🔍 Advanced Features

### Progress Notifications
Long-running operations support real-time progress updates:
- DevPod provisioning
- Environment validation
- Performance analysis
- Security scanning

### Resource Subscriptions
Subscribe to configuration changes and receive automatic updates:
- DevBox configuration changes
- Script modifications
- Performance metrics updates

### Auto-Completion
Smart completions for:
- Environment names
- Script names
- Tool arguments
- Resource URIs
- Log levels

### Annotations
Rich content with priority and audience metadata for better AI understanding.

## 🛡️ Security Features

- **Input Validation**: All tool arguments are validated against schemas
- **Path Security**: Protection against path traversal attacks
- **Environment Isolation**: DevBox provides secure environment isolation
- **Command Injection Protection**: Safe command execution
- **Secret Scanning Integration**: Built-in security scanning

## ⚡ Performance

- **Request Timeout**: 300 seconds for long operations
- **Concurrent Requests**: Up to 10 simultaneous operations
- **Resource Pagination**: Efficient handling of large resource collections
- **Progress Tracking**: Up to 100 progress steps for detailed feedback
- **Background Tasks**: Non-blocking resource updates and notifications

## 🐛 Troubleshooting

### Common Issues

1. **Server Not Starting**
   ```bash
   # Check Nushell version
   nu --version
   
   # Test basic server functionality
   nu mcp/server.nu --help
   ```

2. **Environment Not Found**
   ```bash
   # Check if DevBox environments exist
   ls python-env typescript-env rust-env go-env nushell-env
   
   # Test DevBox functionality
   cd python-env && devbox version
   ```

3. **Script Execution Failures**
   ```bash
   # Check Nushell script syntax
   nu --check nushell-env/scripts/validate.nu
   
   # Test script execution
   cd nushell-env && nu scripts/validate.nu quick
   ```

### Debug Mode
Enable debug logging:
```json
{
  "env": {
    "MCP_LOG_LEVEL": "debug"
  }
}
```

## 🤝 Contributing

This MCP server is part of the polyglot development environment. Contributions should focus on:
- Adding new development tools
- Improving environment integration
- Enhancing automation scripts
- Adding more resource types

## 📄 License

Part of the polyglot development environment project.

## 🎉 Success Criteria

✅ **All MCP Protocol Features**: Tools, resources, prompts, logging, completions, sampling  
✅ **Multi-Transport Support**: STDIO (implemented), SSE and HTTP ready  
✅ **DevBox Integration**: All 5 environments accessible  
✅ **Nushell Automation**: 25+ scripts executable  
✅ **Resource System**: 100+ resources with pagination  
✅ **Progress Notifications**: Real-time updates for long operations  
✅ **Auto-Completion**: Context-aware suggestions  
✅ **Security**: Input validation and safe execution  
✅ **Documentation**: Comprehensive instructions and examples  

This MCP server provides a sophisticated interface to your polyglot development environment, enabling AI assistants to interact with DevBox environments, execute Nushell automation, manage resources, and perform complex development workflows seamlessly.