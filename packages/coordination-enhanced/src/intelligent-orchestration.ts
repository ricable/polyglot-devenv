/**
 * Enhanced Intelligent Orchestration System
 * Building on existing claude-flow coordination system with AI-powered optimization
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { WasmSwarmCoordinator } from '@swarm-flow/wasm-integration';
import { AIOptimizer, PredictiveScaler, ResourcePredictor } from '@swarm-flow/ai-enhanced';

export interface SwarmMetrics {
  activeAgents: number;
  completedTasks: number;
  averageResponseTime: number;
  resourceUtilization: number;
  errorRate: number;
}

export interface OptimizationResult {
  optimizationId: string;
  improvements: string[];
  performanceGain: number;
  resourceSavings: number;
  implementationPlan: string[];
}

export interface ResourcePrediction {
  predictedLoad: number;
  recommendedAgents: number;
  estimatedCost: number;
  confidenceScore: number;
  timeHorizon: number;
}

export interface CoordinationConfig {
  maxAgents: number;
  enableWasmOptimization: boolean;
  enableAIOptimization: boolean;
  enablePredictiveScaling: boolean;
  metricsInterval: number;
  optimizationThreshold: number;
}

export class IntelligentOrchestrator extends EventEmitter {
  private swarmId: string;
  private config: CoordinationConfig;
  private wasmCoordinator: WasmSwarmCoordinator;
  private aiOptimizer: AIOptimizer;
  private predictiveScaler: PredictiveScaler;
  private resourcePredictor: ResourcePredictor;
  private metrics: SwarmMetrics;
  private metricsInterval: NodeJS.Timeout | null = null;
  private isOptimizing: boolean = false;
  private agents: Map<string, any> = new Map();
  private tasks: Map<string, any> = new Map();

  constructor(config?: CoordinationConfig) {
    const defaultConfig: CoordinationConfig = {
      maxAgents: 25,
      enableWasmOptimization: false,
      enableAIOptimization: false,
      enablePredictiveScaling: false,
      metricsInterval: 10000,
      optimizationThreshold: 0.7
    };
    
    config = config || defaultConfig;
    super();
    this.swarmId = uuidv4();
    this.config = config;
    this.wasmCoordinator = new WasmSwarmCoordinator(config.maxAgents);
    this.aiOptimizer = new AIOptimizer();
    this.predictiveScaler = new PredictiveScaler();
    this.resourcePredictor = new ResourcePredictor();
    this.metrics = {
      activeAgents: 0,
      completedTasks: 0,
      averageResponseTime: 0,
      resourceUtilization: 0,
      errorRate: 0
    };
    
    this.initialize();
  }

  private initialize(): void {
    this.emit('orchestrator:initialized', {
      swarmId: this.swarmId,
      config: this.config,
      timestamp: new Date().toISOString()
    });

    // Start metrics collection
    this.startMetricsCollection();
  }

  public startMetricsCollection(): void {
    if (this.metricsInterval) {
      return; // Already running
    }
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsInterval);
  }

  public stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  private collectMetrics(): void {
    const swarmStatus = JSON.parse(this.wasmCoordinator.get_swarm_status());
    
    this.metrics = {
      activeAgents: swarmStatus.active_agents || 0,
      completedTasks: swarmStatus.completed_tasks || 0,
      averageResponseTime: swarmStatus.average_response_time || 0,
      resourceUtilization: swarmStatus.resource_utilization || 0,
      errorRate: swarmStatus.error_rate || 0
    };

    this.emit('metrics:collected', this.metrics);

    // Trigger optimization if threshold exceeded
    if (this.shouldOptimize()) {
      this.optimizeSwarmPerformance();
    }
  }

  private shouldOptimize(): boolean {
    return !this.isOptimizing && 
           (this.metrics.resourceUtilization > this.config.optimizationThreshold ||
            this.metrics.errorRate > 0.1 ||
            this.metrics.averageResponseTime > 5000);
  }

  public async optimizeSwarmPerformance(): Promise<any> {
    if (!this.config.enableAIOptimization) {
      return {
        optimizationApplied: false,
        reason: 'AI optimization disabled',
        timestamp: new Date()
      };
    }

    if (this.isOptimizing) {
      throw new Error('Optimization already in progress');
    }

    this.isOptimizing = true;
    this.emit('optimization:started', { swarmId: this.swarmId });

    try {
      // AI-powered performance optimization
      const optimizations = await this.aiOptimizer.generateOptimizations(this.metrics);
      
      const result = {
        optimizationApplied: true,
        metrics: this.getCurrentMetrics(),
        recommendations: optimizations.improvements,
        timestamp: new Date()
      };

      // Apply optimizations to WASM coordinator
      if (this.config.enableWasmOptimization) {
        await this.applyOptimizations({
          optimizationId: uuidv4(),
          improvements: optimizations.improvements,
          performanceGain: optimizations.performanceGain,
          resourceSavings: optimizations.resourceSavings,
          implementationPlan: optimizations.implementationPlan
        });
      }

      this.emit('optimization:completed', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('optimization:failed', { error: errorMessage });
      throw error;
    } finally {
      this.isOptimizing = false;
    }
  }

  private async applyOptimizations(result: OptimizationResult): Promise<void> {
    // Apply WASM-level optimizations
    if (this.config.enableWasmOptimization) {
      // Implementation would integrate with WASM coordinator
    }

    // Apply AI-driven optimizations
    if (this.config.enableAIOptimization) {
      await this.aiOptimizer.applyOptimizations(result.optimizationId, result.improvements);
    }
  }

  public async predictResourceNeeds(timeHorizon: number): Promise<any> {
    if (!this.config.enablePredictiveScaling) {
      return {
        predictionApplied: false,
        reason: 'Predictive scaling disabled',
        timestamp: new Date()
      };
    }

    const historicalData = await this.getHistoricalResourceUsage();
    
    const prediction = await this.predictiveScaler.predictNeeds(historicalData, timeHorizon);
    
    const result = {
      timeHorizon,
      predictions: {
        predictedLoad: prediction.predictedLoad,
        recommendedAgents: prediction.recommendedAgents,
        estimatedCost: prediction.cost
      },
      confidence: prediction.confidenceInterval ? 0.85 : 0.5,
      recommendations: prediction.scalingTriggers || [],
      timestamp: new Date()
    };

    this.emit('prediction:generated', result);
    return result;
  }

  private async getHistoricalResourceUsage(): Promise<any[]> {
    // Implementation would fetch historical metrics
    return [];
  }

  public async spawnAgent(agentType: string, name: string, capabilities: string[]): Promise<string> {
    // Validate inputs
    if (!agentType || agentType.trim() === '') {
      throw new Error('Agent type cannot be empty');
    }
    if (!name || name.trim() === '') {
      throw new Error('Agent name cannot be empty');
    }
    if (!capabilities || capabilities.length === 0) {
      throw new Error('Agent capabilities cannot be empty');
    }
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error('Maximum number of agents reached');
    }

    const agentId = this.wasmCoordinator.spawn_agent(
      agentType,
      name,
      JSON.stringify(capabilities)
    );

    if (agentId) {
      const agent = {
        id: agentId,
        type: agentType,
        name,
        capabilities,
        status: 'idle',
        currentTask: null,
        tasksCompleted: 0,
        averageResponseTime: 0,
        lastActivity: new Date(),
        createdAt: new Date()
      };

      this.agents.set(agentId, agent);

      this.emit('agent:spawned', {
        agentId,
        type: agentType,
        name,
        capabilities,
        timestamp: new Date().toISOString()
      });
    }

    return agentId;
  }

  public async createTask(name: string, priority: number, dependencies: string[] = []): Promise<string> {
    // Validate inputs
    if (!name || name.trim() === '') {
      throw new Error('Task name cannot be empty');
    }
    if (priority <= 0) {
      throw new Error('Task priority must be positive');
    }

    const taskId = this.wasmCoordinator.create_task(
      name,
      priority,
      JSON.stringify(dependencies)
    );

    if (taskId) {
      const task = {
        id: taskId,
        name,
        priority,
        dependencies,
        status: 'pending',
        assignedAgent: null,
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        result: null
      };

      this.tasks.set(taskId, task);

      this.emit('task:created', {
        taskId,
        name,
        priority,
        dependencies,
        timestamp: new Date().toISOString()
      });
    }

    return taskId;
  }

  public async assignTask(taskId: string, agentId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);

    if (!task) {
      return false;
    }
    if (!agent) {
      return false;
    }
    if (agent.status === 'busy') {
      return false;
    }

    const success = this.wasmCoordinator.assign_task(taskId, agentId);
    
    if (success) {
      // Update task status
      task.status = 'in_progress';
      task.assignedAgent = agentId;
      task.startedAt = new Date();
      this.tasks.set(taskId, task);

      // Update agent status
      agent.status = 'busy';
      agent.currentTask = taskId;
      this.agents.set(agentId, agent);

      this.emit('task:assigned', {
        taskId,
        agentId,
        timestamp: new Date().toISOString()
      });
    }

    return success;
  }

  public getSwarmStatus(): any {
    return JSON.parse(this.wasmCoordinator.get_swarm_status());
  }

  public async completeTask(taskId: string, result: any): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'in_progress') {
      return false;
    }

    task.status = 'completed';
    task.result = result;
    task.completedAt = new Date();
    this.tasks.set(taskId, task);

    // Update agent status
    if (task.assignedAgent) {
      const agent = this.agents.get(task.assignedAgent);
      if (agent) {
        agent.status = 'idle';
        agent.currentTask = null;
        agent.tasksCompleted++;
        this.agents.set(task.assignedAgent, agent);
      }
    }

    this.emit('task:completed', { taskId, result });
    return true;
  }

  public getCurrentMetrics(): any {
    const totalAgents = this.agents.size;
    const activeAgents = totalAgents;
    const idleAgents = Array.from(this.agents.values()).filter(a => a.status === 'idle').length;
    const busyAgents = Array.from(this.agents.values()).filter(a => a.status === 'busy').length;
    
    const totalTasks = this.tasks.size;
    const pendingTasks = Array.from(this.tasks.values()).filter(t => t.status === 'pending').length;
    const inProgressTasks = Array.from(this.tasks.values()).filter(t => t.status === 'in_progress').length;
    const completedTasks = Array.from(this.tasks.values()).filter(t => t.status === 'completed').length;
    const failedTasks = Array.from(this.tasks.values()).filter(t => t.status === 'failed').length;

    // Calculate average response time
    const completedTasksWithDuration = Array.from(this.tasks.values())
      .filter(t => t.status === 'completed' && t.startedAt && t.completedAt);
    
    let averageResponseTime = 0;
    if (completedTasksWithDuration.length > 0) {
      const totalDuration = completedTasksWithDuration.reduce((sum, task) => {
        const duration = task.completedAt!.getTime() - task.startedAt!.getTime();
        return sum + duration;
      }, 0);
      averageResponseTime = totalDuration / completedTasksWithDuration.length;
    }

    const resourceUtilization = totalAgents > 0 ? busyAgents / totalAgents : 0;
    const throughput = completedTasks;

    return {
      totalAgents,
      activeAgents,
      idleAgents,
      busyAgents,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      failedTasks,
      averageResponseTime,
      resourceUtilization,
      throughput
    };
  }

  public async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this.emit('orchestrator:shutdown', {
      swarmId: this.swarmId,
      timestamp: new Date().toISOString()
    });
  }
}

// Export factory function for easy instantiation
export function createIntelligentOrchestrator(config: Partial<CoordinationConfig> = {}): IntelligentOrchestrator {
  const defaultConfig: CoordinationConfig = {
    maxAgents: 25,
    enableWasmOptimization: false,
    enableAIOptimization: false,
    enablePredictiveScaling: false,
    metricsInterval: 10000,
    optimizationThreshold: 0.7
  };

  return new IntelligentOrchestrator({ ...defaultConfig, ...config });
}