#!/bin/bash

# WebAssembly Build Script for Swarm Coordinator
# Compiles Rust code to optimized WebAssembly with JavaScript bindings

set -e

echo "🚀 Building WebAssembly Swarm Coordinator..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "📦 Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf pkg/
rm -rf target/

# Build for different targets
echo "🔧 Building for web..."
wasm-pack build --target web --out-dir pkg/web --release

echo "🔧 Building for bundler..."
wasm-pack build --target bundler --out-dir pkg/bundler --release

echo "🔧 Building for nodejs..."
wasm-pack build --target nodejs --out-dir pkg/nodejs --release

# Optimize WebAssembly files
echo "⚡ Optimizing WebAssembly files..."
if command -v wasm-opt &> /dev/null; then
    for pkg_dir in pkg/*/; do
        if [ -f "$pkg_dir"*.wasm ]; then
            echo "Optimizing $pkg_dir"
            wasm-opt -Os "$pkg_dir"*.wasm -o "$pkg_dir"*.wasm
        fi
    done
else
    echo "⚠️  wasm-opt not found. Install binaryen for better optimization."
fi

# Generate usage examples
echo "📖 Generating usage examples..."
mkdir -p examples/

# Web example
cat > examples/web-example.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>WASM Swarm Coordinator - Web Example</title>
    <script type="module">
        import init, { WasmSwarmCoordinator } from '../pkg/web/wasm_swarm_coordinator.js';

        async function run() {
            await init();
            
            console.log('🎯 Initializing WebAssembly Swarm Coordinator...');
            const coordinator = new WasmSwarmCoordinator(5);
            
            console.log('🤖 Spawning agents...');
            const leadId = coordinator.spawn_agent('coordinator', 'SwarmLead', '["coordination", "management"]');
            const devId = coordinator.spawn_agent('coder', 'RustDev', '["rust", "wasm"]');
            const testId = coordinator.spawn_agent('tester', 'QATester', '["testing", "validation"]');
            
            console.log('📋 Creating tasks...');
            const taskId1 = coordinator.create_task('Implement core logic', 3, '[]');
            const taskId2 = coordinator.create_task('Write tests', 2, `["${taskId1}"]`);
            
            console.log('🔗 Assigning tasks...');
            coordinator.assign_task(taskId1, devId);
            coordinator.assign_task(taskId2, testId);
            
            console.log('📊 Swarm status:', coordinator.get_swarm_status());
            
            console.log('💾 Storing memory...');
            coordinator.store_memory('project_status', 'initialization_complete');
            
            console.log('🔍 Retrieving memory:', coordinator.retrieve_memory('project_status'));
            
            console.log('✅ WebAssembly Swarm Coordinator demo complete!');
        }
        
        run().catch(console.error);
    </script>
</head>
<body>
    <h1>WASM Swarm Coordinator - Web Example</h1>
    <p>Check the browser console for output.</p>
</body>
</html>
EOF

# Node.js example
cat > examples/nodejs-example.js << 'EOF'
const { WasmSwarmCoordinator } = require('../pkg/nodejs/wasm_swarm_coordinator.js');

async function main() {
    console.log('🎯 Initializing WebAssembly Swarm Coordinator...');
    const coordinator = new WasmSwarmCoordinator(5);
    
    console.log('🤖 Spawning agents...');
    const leadId = coordinator.spawn_agent('coordinator', 'SwarmLead', '["coordination", "management"]');
    const devId = coordinator.spawn_agent('coder', 'RustDev', '["rust", "wasm"]');
    const testId = coordinator.spawn_agent('tester', 'QATester', '["testing", "validation"]');
    
    console.log('📋 Creating tasks...');
    const taskId1 = coordinator.create_task('Implement core logic', 3, '[]');
    const taskId2 = coordinator.create_task('Write tests', 2, `["${taskId1}"]`);
    
    console.log('🔗 Assigning tasks...');
    coordinator.assign_task(taskId1, devId);
    coordinator.assign_task(taskId2, testId);
    
    console.log('📊 Swarm status:', coordinator.get_swarm_status());
    
    console.log('💾 Storing memory...');
    coordinator.store_memory('project_status', 'initialization_complete');
    
    console.log('🔍 Retrieving memory:', coordinator.retrieve_memory('project_status'));
    
    console.log('✅ WebAssembly Swarm Coordinator demo complete!');
}

main().catch(console.error);
EOF

# Package.json for examples
cat > examples/package.json << 'EOF'
{
  "name": "wasm-swarm-coordinator-examples",
  "version": "1.0.0",
  "description": "Examples for WebAssembly Swarm Coordinator",
  "main": "nodejs-example.js",
  "scripts": {
    "start": "node nodejs-example.js",
    "serve": "python3 -m http.server 8080"
  },
  "dependencies": {
    "../pkg/nodejs/wasm_swarm_coordinator.js": "file:../pkg/nodejs"
  }
}
EOF

# TypeScript definitions
echo "📝 Generating TypeScript definitions..."
cat > pkg/wasm-swarm-coordinator.d.ts << 'EOF'
/* tslint:disable */
/* eslint-disable */
/**
 * WebAssembly-compiled Swarm Coordinator
 * 
 * A high-performance distributed agent management system compiled to WebAssembly
 * for browser-based swarm coordination and real-time task orchestration.
 */

export class WasmSwarmCoordinator {
  constructor(max_agents: number);
  spawn_agent(agent_type: string, name: string, capabilities: string): string;
  create_task(name: string, priority: number, dependencies: string): string;
  assign_task(task_id: string, agent_id: string): boolean;
  get_swarm_status(): string;
  process_messages(): string;
  update_task_status(task_id: string, status: string): boolean;
  store_memory(key: string, value: string): boolean;
  retrieve_memory(key: string): string;
}

export interface SwarmStatus {
  active_agents: number;
  pending_tasks: number;
  completed_tasks: number;
  total_messages: number;
  uptime: string;
  memory_usage: number;
}

export interface Message {
  id: string;
  message_type: string;
  priority: number;
  content: string;
  sender_agent?: string;
  target_agent?: string;
  timestamp: string;
}

export type AgentType = 'coordinator' | 'researcher' | 'coder' | 'analyst' | 'tester';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
EOF

# Create README
cat > README.md << 'EOF'
# WebAssembly Swarm Coordinator

A high-performance distributed agent management system compiled to WebAssembly for browser-based swarm coordination and real-time task orchestration.

## Features

- **Distributed Agent Management**: Spawn and coordinate multiple AI agents
- **Real-time Task Orchestration**: Create, assign, and track tasks across agents
- **Inter-agent Communication**: Message bus for agent coordination
- **Shared Memory Store**: Persistent storage for swarm knowledge
- **WebAssembly Optimized**: Compiled for maximum performance in browsers
- **Multiple Target Support**: Web, Node.js, and bundler targets

## Quick Start

### Web Usage

```javascript
import init, { WasmSwarmCoordinator } from './pkg/web/wasm_swarm_coordinator.js';

async function run() {
    await init();
    
    const coordinator = new WasmSwarmCoordinator(5);
    
    // Spawn agents
    const leadId = coordinator.spawn_agent('coordinator', 'SwarmLead', '["coordination"]');
    const devId = coordinator.spawn_agent('coder', 'Developer', '["rust", "wasm"]');
    
    // Create and assign tasks
    const taskId = coordinator.create_task('Implement feature', 3, '[]');
    coordinator.assign_task(taskId, devId);
    
    // Monitor swarm
    console.log(coordinator.get_swarm_status());
}
```

### Node.js Usage

```javascript
const { WasmSwarmCoordinator } = require('./pkg/nodejs/wasm_swarm_coordinator.js');

const coordinator = new WasmSwarmCoordinator(5);
// ... same API as web version
```

## Building

```bash
# Build WebAssembly packages
chmod +x build-wasm.sh
./build-wasm.sh

# Run examples
cd examples
npm install
npm start  # Node.js example
npm run serve  # Web example (visit http://localhost:8080)
```

## API Reference

### WasmSwarmCoordinator

- `new WasmSwarmCoordinator(max_agents)`: Create coordinator instance
- `spawn_agent(type, name, capabilities)`: Spawn a new agent
- `create_task(name, priority, dependencies)`: Create a new task
- `assign_task(task_id, agent_id)`: Assign task to agent
- `get_swarm_status()`: Get current swarm status
- `process_messages()`: Process inter-agent messages
- `update_task_status(task_id, status)`: Update task status
- `store_memory(key, value)`: Store data in shared memory
- `retrieve_memory(key)`: Retrieve data from shared memory

### Agent Types

- `coordinator`: Manages other agents and overall coordination
- `researcher`: Performs research and information gathering
- `coder`: Implements code and technical solutions
- `analyst`: Analyzes data and provides insights
- `tester`: Validates and tests implementations

### Task Statuses

- `pending`: Task created but not started
- `in_progress`: Task is being worked on
- `completed`: Task finished successfully
- `failed`: Task failed to complete

## Performance

- **Optimized for WebAssembly**: Size-optimized builds with LTO
- **Memory Efficient**: Shared memory store with automatic cleanup
- **Real-time Communication**: Low-latency message passing
- **Scalable**: Supports up to configurable max agents

## Architecture

```
┌─────────────────────┐
│   WASM Interface    │
├─────────────────────┤
│  Swarm Coordinator  │
├─────────────────────┤
│ Agent │ Task │ Msg  │
│ Mgmt  │Queue │ Bus  │
├─────────────────────┤
│   Memory Store      │
└─────────────────────┘
```

## License

MIT License - see LICENSE file for details.
EOF

echo "✅ WebAssembly build complete!"
echo ""
echo "📦 Generated packages:"
echo "  - pkg/web/           (Web target)"
echo "  - pkg/bundler/       (Bundler target)"
echo "  - pkg/nodejs/        (Node.js target)"
echo ""
echo "🚀 Run examples:"
echo "  cd examples && npm install && npm start"
echo "  cd examples && npm run serve"
echo ""
echo "📊 Package sizes:"
find pkg -name "*.wasm" -exec ls -lh {} \; | awk '{print $5 " " $9}'