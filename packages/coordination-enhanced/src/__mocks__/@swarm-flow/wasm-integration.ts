// Mock WASM integration for testing
export class WasmSwarmCoordinator {
  private maxAgents: number;
  private agents: Map<string, any> = new Map();
  private tasks: Map<string, any> = new Map();

  constructor(maxAgents: number) {
    this.maxAgents = maxAgents;
  }

  spawn_agent(type: string, name: string, capabilities: string): string {
    // Generate proper UUID format with hex digits for tests
    const generateHex = (length: number) => {
      return Array.from({length}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    };
    const agentId = `${generateHex(8)}-${generateHex(4)}-${generateHex(4)}-${generateHex(4)}-${generateHex(12)}`;
    this.agents.set(agentId, {
      id: agentId,
      type,
      name,
      capabilities: JSON.parse(capabilities),
      status: 'idle'
    });
    return agentId;
  }

  create_task(name: string, priority: number, dependencies: string): string {
    // Generate proper UUID format with hex digits for tests
    const generateHex = (length: number) => {
      return Array.from({length}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    };
    const taskId = `${generateHex(8)}-${generateHex(4)}-${generateHex(4)}-${generateHex(4)}-${generateHex(12)}`;
    this.tasks.set(taskId, {
      id: taskId,
      name,
      priority,
      dependencies: JSON.parse(dependencies),
      status: 'pending'
    });
    return taskId;
  }

  assign_task(taskId: string, agentId: string): boolean {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);
    
    if (task && agent) {
      task.assignedAgent = agentId;
      task.status = 'in_progress';
      agent.status = 'busy';
      agent.currentTask = taskId;
      return true;
    }
    return false;
  }

  get_swarm_status(): string {
    return JSON.stringify({
      active_agents: this.agents.size,
      completed_tasks: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length,
      average_response_time: 100,
      resource_utilization: 0.5,
      error_rate: 0.01
    });
  }
}