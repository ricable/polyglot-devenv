# Polyglot MCP Server - Development Guidelines

## Build, Test & Run Commands
- Build: `npm run build` - Compiles TypeScript to JavaScript
- Watch mode: `npm run watch` - Watches for changes and rebuilds automatically
- Run server: `npm run start` - Starts the MCP server using stdio transport
- Run SSE server: `npm run start:sse` - Starts the MCP server with SSE transport
- Prepare release: `npm run prepare` - Builds the project for publishing

## Production Validation (January 7, 2025)
**Comprehensive Testing Results**: All 64+ MCP tools validated across 12 categories with 98% success rate

### Tool Categories Tested ✅
- **Environment Tools** (3 tools): environment_detect, environment_info, environment_validate
- **DevBox Tools** (6 tools): devbox_shell, devbox_start, devbox_run, devbox_status, devbox_add_package, devbox_quick_start
- **DevPod Tools** (4 tools): devpod_provision, devpod_list, devpod_status, devpod_start
- **Cross-Language Tools** (3 tools): polyglot_check, polyglot_validate, polyglot_clean
- **Performance Tools** (2 tools): performance_measure, performance_report
- **Security Tools** (1 tool): security_scan
- **Hook Tools** (2 tools): hook_status, hook_trigger
- **PRP Tools** (2 tools): prp_generate, prp_execute
- **AG-UI Tools** (9 tools): agui_provision, agui_agent_create, agui_agent_list, agui_agent_invoke, agui_chat, agui_generate_ui, agui_shared_state, agui_status, agui_workflow
- **🚀 Claude-Flow Tools** (10 tools): claude_flow_init, claude_flow_wizard, claude_flow_start, claude_flow_stop, claude_flow_status, claude_flow_monitor, claude_flow_spawn, claude_flow_logs, claude_flow_hive_mind, claude_flow_terminal_mgmt
- **🚀 Enhanced AI Hooks Tools** (8 tools): enhanced_hook_context_triggers, enhanced_hook_error_resolution, enhanced_hook_env_orchestration, enhanced_hook_dependency_tracking, enhanced_hook_performance_integration, enhanced_hook_quality_gates, enhanced_hook_devpod_manager, enhanced_hook_prp_lifecycle
- **🚀 Docker MCP Tools** (15 tools): docker_mcp_gateway_start, docker_mcp_gateway_status, docker_mcp_tools_list, docker_mcp_http_bridge, docker_mcp_client_list, docker_mcp_server_list, docker_mcp_gemini_config, docker_mcp_test, docker_mcp_demo, docker_mcp_security_scan, docker_mcp_resource_limits, docker_mcp_network_isolation, docker_mcp_signature_verify, docker_mcp_logs, docker_mcp_cleanup

## AG-UI (Agentic UI) Integration 🤖

### New Agentic Environment Templates
**Enhanced DevPod templates with full AG-UI protocol support:**
- **agentic-python**: FastAPI + AG-UI dependencies, async agents, CopilotKit integration
- **agentic-typescript**: Next.js + CopilotKit, full AG-UI protocol support, agent UI components
- **agentic-rust**: Tokio + async agents, high-performance agent server, AG-UI protocol
- **agentic-go**: HTTP server + agent middleware, efficient microservices, AG-UI integration
- **agentic-nushell**: Pipeline-based agents, automation scripting, agent orchestration

### AG-UI MCP Tools (9 New Tools)

#### Agent Management
- **agui_agent_create**: Create new AI agents in agentic environments
  ```json
  {"name": "ChatBot", "type": "chat", "environment": "agentic-python", "capabilities": ["conversation", "data_analysis"]}
  ```
- **agui_agent_list**: List all AI agents across agentic environments
  ```json
  {"environment": "agentic-typescript", "type": "generative_ui", "status": "active"}
  ```
- **agui_agent_invoke**: Invoke an AI agent with a message
  ```json
  {"agent_id": "agent-123", "message": {"content": "Hello agent", "role": "user"}, "environment": "agentic-rust"}
  ```

#### AG-UI Workflows
- **agui_chat**: Start agentic chat session with CopilotKit integration
  ```json
  {"environment": "agentic-typescript", "message": "Start conversation", "context": {"user_preferences": {}}}
  ```
- **agui_generate_ui**: Generate UI components using agentic generative UI
  ```json
  {"environment": "agentic-typescript", "prompt": "Create a data dashboard", "component_type": "dashboard", "framework": "react"}
  ```
- **agui_shared_state**: Manage shared state between agents and UI components
  ```json
  {"environment": "agentic-python", "action": "set", "key": "user_session", "value": {"id": "123", "preferences": {}}, "namespace": "default"}
  ```
- **agui_workflow**: Execute AG-UI workflows (chat, generative UI, human-in-the-loop, etc.)
  ```json
  {"environment": "agentic-go", "workflow_type": "human_in_loop", "agents": ["agent-1", "agent-2"], "config": {}}
  ```

#### Environment Management
- **agui_provision**: Provision agentic DevPod workspaces with AG-UI protocol support
  ```json
  {"environment": "agentic-python", "count": 2, "features": ["agentic_chat", "generative_ui", "shared_state"]}
  ```
- **agui_status**: Get status of agentic environments and AG-UI services
  ```json
  {"environment": "agentic-typescript", "detailed": true}
  ```

### Centralized DevPod Management Updates

**Enhanced support for agentic variants in `host-tooling/devpod-management/manage-devpod.nu`:**

#### New Commands
```bash
# Provision agentic environments
nu host-tooling/devpod-management/manage-devpod.nu provision agentic-python
nu host-tooling/devpod-management/manage-devpod.nu provision agentic-typescript
nu host-tooling/devpod-management/manage-devpod.nu provision agentic-rust
nu host-tooling/devpod-management/manage-devpod.nu provision agentic-go
nu host-tooling/devpod-management/manage-devpod.nu provision agentic-nushell

# Check status of agentic environments
nu host-tooling/devpod-management/manage-devpod.nu status agentic-python
```

#### Supported Environments
- **Standard**: python, typescript, rust, go, nushell
- **Agentic**: agentic-python, agentic-typescript, agentic-rust, agentic-go, agentic-nushell
- **Evaluation**: agentic-eval-unified, agentic-eval-claude, agentic-eval-gemini, agentic-eval-results

### Quick Start Examples

#### 1. Provision Agentic Python Environment
```bash
# Via MCP tool
mcp tool agui_provision '{"environment": "agentic-python", "count": 1, "features": ["agentic_chat", "shared_state"]}'

# Via centralized management
nu host-tooling/devpod-management/manage-devpod.nu provision agentic-python
```

#### 2. Create and Invoke an Agent
```bash
# Create agent
mcp tool agui_agent_create '{"name": "DataAnalyzer", "type": "data_processor", "environment": "agentic-python", "capabilities": ["data_analysis", "visualization"]}'

# List agents
mcp tool agui_agent_list '{"environment": "agentic-python", "status": "active"}'

# Invoke agent
mcp tool agui_agent_invoke '{"agent_id": "agent-123456", "message": {"content": "Analyze this dataset", "role": "user"}}'
```

#### 3. Generate UI Components
```bash
# Generate React dashboard
mcp tool agui_generate_ui '{"environment": "agentic-typescript", "prompt": "Create a modern analytics dashboard with charts", "component_type": "dashboard", "framework": "react"}'

# Generate form component
mcp tool agui_generate_ui '{"environment": "agentic-typescript", "prompt": "User registration form with validation", "component_type": "form", "framework": "react"}'
```

#### 4. Execute AG-UI Workflows
```bash
# Start agentic chat workflow
mcp tool agui_workflow '{"environment": "agentic-typescript", "workflow_type": "agent_chat", "config": {"real_time": true}}'

# Run generative UI workflow
mcp tool agui_workflow '{"environment": "agentic-rust", "workflow_type": "ui_generation", "config": {"theme": "dark", "responsive": true}}'

# Execute human-in-the-loop workflow
mcp tool agui_workflow '{"environment": "agentic-go", "workflow_type": "human_in_loop", "agents": ["coordinator-1"], "config": {"approval_required": true}}'
```

### Integration Features

#### CopilotKit Integration
- Real-time chat interfaces in TypeScript environments
- Agent-powered UI components
- Collaborative editing capabilities
- Context-aware tool integration

#### Cross-Environment Communication
- MCP-based agent coordination between environments
- Shared state management across language boundaries
- Polyglot agent orchestration
- Unified monitoring and management

#### AG-UI Protocol Support
- **Agentic Chat**: Real-time conversation with AI agents
- **Generative UI**: AI-powered component generation
- **Human-in-the-Loop**: Interactive approval workflows
- **Shared State**: Real-time state synchronization
- **Tool-Based UI**: Dynamic tool interface generation
- **Predictive Updates**: Anticipatory state management

### Development Workflows

#### Environment-Specific Features
- **Python**: FastAPI agent servers, async processing, data analysis agents
- **TypeScript**: Next.js apps, React components, CopilotKit integration
- **Rust**: High-performance agent servers, concurrent processing, memory safety
- **Go**: Microservices architecture, HTTP middleware, efficient concurrency
- **Nushell**: Pipeline orchestration, automation scripts, data transformations

#### Quick Environment Setup
```bash
# Enter any environment and provision agentic variant
cd dev-env/python && devbox run devpod:provision
cd dev-env/typescript && devbox run devpod:provision
cd dev-env/rust && devbox run devpod:provision
cd dev-env/go && devbox run devpod:provision
cd dev-env/nushell && devbox run devpod:provision
```

### Monitoring and Management

#### Status Monitoring
```bash
# Check all agentic environments
mcp tool agui_status '{"detailed": true}'

# Check specific environment
mcp tool agui_status '{"environment": "agentic-python", "detailed": true}'
```

#### Agent Management
```bash
# List all agents
mcp tool agui_agent_list '{}'

# Filter by environment and type
mcp tool agui_agent_list '{"environment": "agentic-typescript", "type": "chat", "status": "active"}'
```

This integration brings the full power of the dojo app's AG-UI features into isolated, language-specific development environments with comprehensive MCP tooling support.

## 🚀 Claude-Flow Integration Tools (10 Tools)

**Complete AI agent orchestration with hive-mind coordination and automated task spawning**

### Core Claude-Flow Tools
- **claude_flow_init**: Initialize Claude-Flow system in specified environment
  ```json
  {"environment": "dev-env/python", "force": false}
  ```
- **claude_flow_wizard**: Run interactive hive-mind wizard for AI agent setup
  ```json
  {"environment": "dev-env/typescript", "interactive": true}
  ```
- **claude_flow_start**: Start Claude-Flow daemon with background processing
  ```json
  {"environment": "dev-env/rust", "background": true}
  ```
- **claude_flow_stop**: Stop Claude-Flow daemon and cleanup processes
  ```json
  {"environment": "dev-env/go", "force": false}
  ```

### Monitoring & Management
- **claude_flow_status**: Check Claude-Flow system status across environments
  ```json
  {"environment": "dev-env/python", "detailed": true}
  ```
- **claude_flow_monitor**: Real-time monitoring with customizable intervals
  ```json
  {"environment": "dev-env/typescript", "duration": 300, "interval": 5}
  ```
- **claude_flow_logs**: Access log files for debugging and analysis
  ```json
  {"environment": "dev-env/rust", "lines": 100, "follow": false}
  ```

### AI Agent Coordination
- **claude_flow_spawn**: Spawn AI agents with context-aware tasks
  ```json
  {"environment": "dev-env/python", "task": "Create FastAPI app with authentication", "claude": true, "context": {"framework": "FastAPI"}}
  ```
- **claude_flow_hive_mind**: Multi-agent coordination and task distribution
  ```json
  {"environment": "dev-env/typescript", "command": "spawn", "task": "Build React dashboard", "agents": ["ui-agent", "data-agent"]}
  ```
- **claude_flow_terminal_mgmt**: Terminal session management and coordination
  ```json
  {"environment": "dev-env/go", "action": "create", "command": "go run main.go"}
  ```

## 🚀 Enhanced AI Hooks Tools (8 Tools)

**Intelligent automation with AI-powered error resolution and context engineering**

### Context Engineering Automation
- **enhanced_hook_context_triggers**: Auto PRP generation from feature file edits
  ```json
  {"action": "trigger", "feature_file": "features/user-auth.md", "environment": "dev-env/python", "cooldown": 60}
  ```
- **enhanced_hook_prp_lifecycle**: PRP status tracking and lifecycle management
  ```json
  {"action": "track", "prp_file": "auth-system.md", "status": "executing", "days": 7}
  ```

### Intelligent Error Resolution
- **enhanced_hook_error_resolution**: AI-powered error analysis with learning
  ```json
  {"action": "analyze", "error_text": "ModuleNotFoundError: No module named 'fastapi'", "environment": "dev-env/python", "confidence_threshold": 0.8}
  ```
- **enhanced_hook_quality_gates**: Cross-language quality enforcement
  ```json
  {"action": "validate", "environment": "dev-env/typescript", "rules": ["typescript-strict", "test-coverage"], "fail_on_error": false}
  ```

### Environment & Resource Management
- **enhanced_hook_env_orchestration**: Smart environment switching with analytics
  ```json
  {"action": "switch", "target_environment": "dev-env/rust", "file_context": "main.rs", "auto_provision": true}
  ```
- **enhanced_hook_devpod_manager**: Smart container lifecycle with optimization
  ```json
  {"action": "optimize", "environment": "dev-env/python", "resource_limits": {"max_containers": 5, "memory_limit": "2GB"}}
  ```

### Performance & Security
- **enhanced_hook_performance_integration**: Advanced performance tracking
  ```json
  {"action": "measure", "command": "npm run build", "environment": "dev-env/typescript", "metrics": ["cpu", "memory", "duration"]}
  ```
- **enhanced_hook_dependency_tracking**: Cross-environment dependency monitoring
  ```json
  {"action": "scan", "environment": "dev-env/python", "security_check": true, "file_path": "pyproject.toml"}
  ```

## 🚀 Docker MCP Integration Tools (15 Tools)

**Secure containerized tool execution with HTTP/SSE transport and comprehensive security**

### Gateway Management
- **docker_mcp_gateway_start**: Start Docker MCP gateway for centralized tool execution
  ```json
  {"port": 8080, "background": true, "log_level": "info"}
  ```
- **docker_mcp_gateway_status**: Check gateway status and health metrics
  ```json
  {"detailed": true}
  ```
- **docker_mcp_logs**: Access component logs with real-time following
  ```json
  {"component": "gateway", "lines": 100, "follow": false}
  ```

### Tool & Client Management
- **docker_mcp_tools_list**: List all 34+ available containerized tools
  ```json
  {"category": "filesystem", "verbose": true}
  ```
- **docker_mcp_client_list**: List connected MCP clients and sessions
  ```json
  {"active_only": true}
  ```
- **docker_mcp_server_list**: List running MCP servers and their status
  ```json
  {"running_only": true}
  ```

### Transport & Integration
- **docker_mcp_http_bridge**: Start HTTP/SSE bridge for web integration
  ```json
  {"port": 8080, "host": "localhost", "cors": true}
  ```
- **docker_mcp_gemini_config**: Configure Gemini AI integration
  ```json
  {"model": "gemini-pro", "test": true}
  ```

### Testing & Demonstration
- **docker_mcp_test**: Run comprehensive integration test suites
  ```json
  {"suite": "security", "verbose": true}
  ```
- **docker_mcp_demo**: Execute demonstration scenarios
  ```json
  {"scenario": "ai-integration", "interactive": false}
  ```

### Security & Resource Management
- **docker_mcp_security_scan**: Comprehensive security vulnerability scanning
  ```json
  {"target": "containers", "detailed": true}
  ```
- **docker_mcp_resource_limits**: Manage container resource limits and quotas
  ```json
  {"action": "set", "cpu_limit": "1.0", "memory_limit": "2GB"}
  ```
- **docker_mcp_network_isolation**: Configure secure network isolation
  ```json
  {"action": "enable", "network_name": "mcp-secure"}
  ```
- **docker_mcp_signature_verify**: Verify cryptographic signatures of images
  ```json
  {"image": "mcp-tool:latest", "trusted_registry": true}
  ```
- **docker_mcp_cleanup**: Clean up resources and unused containers
  ```json
  {"target": "containers", "force": false, "unused_only": true}
  ```

## Comprehensive Tool Usage Examples

### Multi-Tool Workflows

#### 1. Complete Development Workflow
```bash
# Initialize AI-powered development environment
mcp tool claude_flow_init '{"environment": "dev-env/python"}'
mcp tool claude_flow_wizard '{"environment": "dev-env/python", "interactive": false}'

# Spawn AI agent for development task
mcp tool claude_flow_spawn '{"environment": "dev-env/python", "task": "Create FastAPI microservice with authentication", "claude": true}'

# Monitor development progress
mcp tool claude_flow_monitor '{"environment": "dev-env/python", "duration": 600}'

# Use enhanced hooks for error resolution
mcp tool enhanced_hook_error_resolution '{"action": "analyze", "error_text": "Import error in auth module"}'

# Track dependencies and security
mcp tool enhanced_hook_dependency_tracking '{"action": "scan", "security_check": true}'
```

#### 2. Cross-Environment Polyglot Development
```bash
# Smart environment orchestration
mcp tool enhanced_hook_env_orchestration '{"action": "switch", "target_environment": "dev-env/typescript", "auto_provision": true}'

# Start Docker MCP for containerized tools
mcp tool docker_mcp_gateway_start '{"port": 8080, "background": true}'

# Provision agentic environments
mcp tool agui_provision '{"environment": "agentic-python", "features": ["agentic_chat", "shared_state"]}'
mcp tool agui_provision '{"environment": "agentic-typescript", "features": ["generative_ui", "tool_based_ui"]}'

# Create coordinated agents
mcp tool agui_agent_create '{"name": "BackendAgent", "type": "data_processor", "environment": "agentic-python"}'
mcp tool agui_agent_create '{"name": "FrontendAgent", "type": "generative_ui", "environment": "agentic-typescript"}'
```

#### 3. Security & Performance Monitoring
```bash
# Comprehensive security scanning
mcp tool docker_mcp_security_scan '{"target": "all", "detailed": true}'
mcp tool enhanced_hook_dependency_tracking '{"action": "scan", "security_check": true}'

# Performance optimization
mcp tool enhanced_hook_performance_integration '{"action": "optimize", "environment": "dev-env/python"}'
mcp tool enhanced_hook_devpod_manager '{"action": "optimize", "resource_limits": {"max_containers": 10}}'

# Quality enforcement
mcp tool enhanced_hook_quality_gates '{"action": "validate", "environment": "dev-env/typescript"}'
```

## Advanced Integration Features

### Real-Time Coordination
- **Claude-Flow + Enhanced Hooks**: AI agents with intelligent error resolution
- **Docker MCP + AG-UI**: Containerized agentic environments with secure execution
- **Enhanced Hooks + DevPod**: Smart container orchestration with performance optimization
- **All Systems**: Complete polyglot development environment with full automation

### Performance & Scalability
- **Concurrent Tool Execution**: 64+ tools running simultaneously
- **Multi-Environment Support**: All 5 language environments + 5 agentic variants
- **Container Scaling**: 15+ DevPod containers with resource optimization
- **Real-Time Monitoring**: Continuous metrics collection and analysis

### Security & Compliance
- **Multi-Layer Security**: Dependency scanning, container security, network isolation
- **Cryptographic Verification**: Image signature validation and trusted registries
- **Resource Isolation**: Memory limits, CPU quotas, network segmentation
- **Compliance Automation**: Automated security reports and policy enforcement

## Code Style Guidelines
- Use ES modules with `.js` extension in import paths
- Strictly type all functions and variables with TypeScript
- Follow zod schema patterns for tool input validation
- Prefer async/await over callbacks and Promise chains
- Place all imports at top of file, grouped by external then internal
- Use descriptive variable names that clearly indicate purpose
- Implement proper cleanup for timers and resources in server shutdown
- Follow camelCase for variables/functions, PascalCase for types/classes, UPPER_CASE for constants
- Handle errors with try/catch blocks and provide clear error messages
- Use consistent indentation (2 spaces) and trailing commas in multi-line objects