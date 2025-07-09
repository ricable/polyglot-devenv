/**
 * Enhanced Swarm Coordinator
 * Extends existing claude-flow coordination with advanced features
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { IntelligentOrchestrator } from './intelligent-orchestration.js';

export interface SwarmStatus {
  swarmId: string;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  resourceUtilization: number;
  uptime: number;
  lastUpdated: string;
}

export interface AgentInfo {
  agentId: string;
  type: string;
  name: string;
  status: 'active' | 'idle' | 'busy' | 'error';
  capabilities: string[];
  currentTask?: string;
  tasksCompleted: number;
  averageTaskTime: number;
  lastActivity: string;
}

export interface TaskInfo {
  taskId: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  assignedAgent?: string;
  dependencies: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

export interface CoordinationEvent {
  eventId: string;
  type: 'agent_spawned' | 'task_created' | 'task_assigned' | 'task_completed' | 'optimization_triggered';
  swarmId: string;
  data: any;
  timestamp: string;
}

export class SwarmCoordinator extends EventEmitter {
  private swarmId: string;
  private orchestrator: IntelligentOrchestrator;
  private agents: Map<string, AgentInfo>;
  private tasks: Map<string, TaskInfo>;
  private events: CoordinationEvent[];
  private startTime: Date;

  constructor(maxAgents: number = 25) {
    super();
    this.swarmId = uuidv4();
    this.orchestrator = new IntelligentOrchestrator({
      maxAgents,
      enableWasmOptimization: true,
      enableAIOptimization: true,
      enablePredictiveScaling: true,
      metricsInterval: 5000,
      optimizationThreshold: 0.8
    });
    this.agents = new Map();
    this.tasks = new Map();
    this.events = [];
    this.startTime = new Date();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.orchestrator.on('agent:spawned', (data) => {
      const agentInfo: AgentInfo = {
        agentId: data.agentId,
        type: data.type,
        name: data.name,
        status: 'active',
        capabilities: data.capabilities,
        tasksCompleted: 0,
        averageTaskTime: 0,
        lastActivity: new Date().toISOString()
      };
      
      this.agents.set(data.agentId, agentInfo);
      this.recordEvent('agent_spawned', data);
    });

    this.orchestrator.on('task:created', (data) => {
      const taskInfo: TaskInfo = {
        taskId: data.taskId,
        name: data.name,
        status: 'pending',
        priority: data.priority,
        dependencies: data.dependencies,
        createdAt: new Date().toISOString()
      };
      
      this.tasks.set(data.taskId, taskInfo);
      this.recordEvent('task_created', data);
    });

    this.orchestrator.on('task:assigned', (data) => {
      const task = this.tasks.get(data.taskId);
      if (task) {
        task.status = 'in_progress';
        task.assignedAgent = data.agentId;
        task.startedAt = new Date().toISOString();
        this.tasks.set(data.taskId, task);
      }

      const agent = this.agents.get(data.agentId);
      if (agent) {
        agent.status = 'busy';
        agent.currentTask = data.taskId;
        agent.lastActivity = new Date().toISOString();
        this.agents.set(data.agentId, agent);
      }

      this.recordEvent('task_assigned', data);
    });

    this.orchestrator.on('optimization:completed', (data) => {
      this.recordEvent('optimization_triggered', data);
    });
  }

  private recordEvent(type: CoordinationEvent['type'], data: any): void {
    const event: CoordinationEvent = {
      eventId: uuidv4(),
      type,
      swarmId: this.swarmId,
      data,
      timestamp: new Date().toISOString()
    };

    this.events.push(event);
    this.emit('event:recorded', event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  public async spawnAgent(type: string, name: string, capabilities: string[]): Promise<string> {
    return this.orchestrator.spawnAgent(type, name, capabilities);
  }

  public async createTask(name: string, priority: number, dependencies: string[] = []): Promise<string> {
    return this.orchestrator.createTask(name, priority, dependencies);
  }

  public async assignTask(taskId: string, agentId: string): Promise<boolean> {
    return this.orchestrator.assignTask(taskId, agentId);
  }

  public async completeTask(taskId: string, result: any): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    if (task.startedAt) {
      task.duration = new Date().getTime() - new Date(task.startedAt).getTime();
    }

    this.tasks.set(taskId, task);

    // Update agent status
    if (task.assignedAgent) {
      const agent = this.agents.get(task.assignedAgent);
      if (agent) {
        agent.status = 'idle';
        agent.currentTask = undefined;
        agent.tasksCompleted++;
        agent.lastActivity = new Date().toISOString();
        
        // Update average task time
        if (task.duration) {
          agent.averageTaskTime = (agent.averageTaskTime * (agent.tasksCompleted - 1) + task.duration) / agent.tasksCompleted;
        }
        
        this.agents.set(task.assignedAgent, agent);
      }
    }

    this.recordEvent('task_completed', { taskId, result });
    return true;
  }

  public getSwarmStatus(): SwarmStatus {
    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();
    const orchestratorMetrics = this.orchestrator.getCurrentMetrics();

    return {
      swarmId: this.swarmId,
      activeAgents: this.agents.size,
      totalTasks: this.tasks.size,
      completedTasks: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length,
      failedTasks: Array.from(this.tasks.values()).filter(t => t.status === 'failed').length,
      averageResponseTime: orchestratorMetrics.averageResponseTime,
      resourceUtilization: orchestratorMetrics.resourceUtilization,
      uptime,
      lastUpdated: now.toISOString()
    };
  }

  public getAgentInfo(agentId: string): AgentInfo | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  public getTaskInfo(taskId: string): TaskInfo | undefined {
    return this.tasks.get(taskId);
  }

  public getAllTasks(): TaskInfo[] {
    return Array.from(this.tasks.values());
  }

  public getRecentEvents(limit: number = 100): CoordinationEvent[] {
    return this.events.slice(-limit);
  }

  public async optimizePerformance(): Promise<any> {
    return this.orchestrator.optimizeSwarmPerformance();
  }

  public async predictResourceNeeds(timeHorizon: number): Promise<any> {
    return this.orchestrator.predictResourceNeeds(timeHorizon);
  }

  public async shutdown(): Promise<void> {
    await this.orchestrator.shutdown();
    this.emit('coordinator:shutdown', { swarmId: this.swarmId });
  }
}