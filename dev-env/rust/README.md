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
