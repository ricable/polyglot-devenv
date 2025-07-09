import { EventEmitter } from 'eventemitter3';
import { IntelligentOrchestrator, createIntelligentOrchestrator } from '../intelligent-orchestration';

// Mock external dependencies but preserve EventEmitter functionality
jest.mock('eventemitter3', () => {
  const actualEventEmitter = jest.requireActual('eventemitter3');
  return {
    EventEmitter: actualEventEmitter.EventEmitter
  };
});

describe('IntelligentOrchestrator', () => {
  let orchestrator: IntelligentOrchestrator;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      maxAgents: 10,
      enableWasmOptimization: true,
      enableAIOptimization: true,
      enablePredictiveScaling: true,
      metricsInterval: 5000,
      optimizationThreshold: 0.8
    };

    orchestrator = new IntelligentOrchestrator(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(orchestrator).toBeInstanceOf(IntelligentOrchestrator);
      expect(orchestrator['config']).toEqual(mockConfig);
    });

    it('should initialize with default config when none provided', () => {
      const defaultOrchestrator = new IntelligentOrchestrator();
      expect(defaultOrchestrator['config']).toEqual({
        maxAgents: 25,
        enableWasmOptimization: false,
        enableAIOptimization: false,
        enablePredictiveScaling: false,
        metricsInterval: 10000,
        optimizationThreshold: 0.7
      });
    });
  });

  describe('spawnAgent', () => {
    it('should spawn agent with valid parameters', async () => {
      const agentId = await orchestrator.spawnAgent('worker', 'Test Agent', ['python', 'testing']);
      
      expect(agentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(orchestrator['agents'].has(agentId)).toBe(true);
      
      const agent = orchestrator['agents'].get(agentId);
      expect(agent).toEqual({
        id: agentId,
        type: 'worker',
        name: 'Test Agent',
        capabilities: ['python', 'testing'],
        status: 'idle',
        currentTask: null,
        tasksCompleted: 0,
        averageResponseTime: 0,
        lastActivity: expect.any(Date),
        createdAt: expect.any(Date)
      });
    });

    it('should throw error when max agents reached', async () => {
      // Spawn max agents
      for (let i = 0; i < mockConfig.maxAgents; i++) {
        await orchestrator.spawnAgent('worker', `Agent ${i}`, ['python']);
      }

      await expect(
        orchestrator.spawnAgent('worker', 'Extra Agent', ['python'])
      ).rejects.toThrow('Maximum number of agents reached');
    });

    it('should validate agent parameters', async () => {
      await expect(
        orchestrator.spawnAgent('', 'Test Agent', ['python'])
      ).rejects.toThrow('Agent type cannot be empty');

      await expect(
        orchestrator.spawnAgent('worker', '', ['python'])
      ).rejects.toThrow('Agent name cannot be empty');

      await expect(
        orchestrator.spawnAgent('worker', 'Test Agent', [])
      ).rejects.toThrow('Agent capabilities cannot be empty');
    });
  });

  describe('createTask', () => {
    it('should create task with valid parameters', async () => {
      const taskId = await orchestrator.createTask('Test Task', 1, ['dep1']);
      
      expect(taskId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(orchestrator['tasks'].has(taskId)).toBe(true);
      
      const task = orchestrator['tasks'].get(taskId);
      expect(task).toEqual({
        id: taskId,
        name: 'Test Task',
        priority: 1,
        dependencies: ['dep1'],
        status: 'pending',
        assignedAgent: null,
        createdAt: expect.any(Date),
        startedAt: null,
        completedAt: null,
        result: null
      });
    });

    it('should validate task parameters', async () => {
      await expect(
        orchestrator.createTask('', 1, [])
      ).rejects.toThrow('Task name cannot be empty');

      await expect(
        orchestrator.createTask('Test Task', -1, [])
      ).rejects.toThrow('Task priority must be positive');

      await expect(
        orchestrator.createTask('Test Task', 0, [])
      ).rejects.toThrow('Task priority must be positive');
    });

    it('should handle tasks with no dependencies', async () => {
      const taskId = await orchestrator.createTask('Test Task', 1);
      
      const task = orchestrator['tasks'].get(taskId);
      expect(task.dependencies).toEqual([]);
    });
  });

  describe('assignTask', () => {
    let agentId: string;
    let taskId: string;

    beforeEach(async () => {
      agentId = await orchestrator.spawnAgent('worker', 'Test Agent', ['python']);
      taskId = await orchestrator.createTask('Test Task', 1);
    });

    it('should assign task to agent successfully', async () => {
      const result = await orchestrator.assignTask(taskId, agentId);
      
      expect(result).toBe(true);
      
      const task = orchestrator['tasks'].get(taskId);
      expect(task.status).toBe('in_progress');
      expect(task.assignedAgent).toBe(agentId);
      expect(task.startedAt).toBeInstanceOf(Date);
      
      const agent = orchestrator['agents'].get(agentId);
      expect(agent.status).toBe('busy');
      expect(agent.currentTask).toBe(taskId);
    });

    it('should return false for non-existent task', async () => {
      const result = await orchestrator.assignTask('non-existent', agentId);
      expect(result).toBe(false);
    });

    it('should return false for non-existent agent', async () => {
      const result = await orchestrator.assignTask(taskId, 'non-existent');
      expect(result).toBe(false);
    });

    it('should return false when agent is busy', async () => {
      // Assign first task
      await orchestrator.assignTask(taskId, agentId);
      
      // Try to assign another task
      const secondTaskId = await orchestrator.createTask('Second Task', 1);
      const result = await orchestrator.assignTask(secondTaskId, agentId);
      
      expect(result).toBe(false);
    });
  });

  describe('completeTask', () => {
    let agentId: string;
    let taskId: string;

    beforeEach(async () => {
      agentId = await orchestrator.spawnAgent('worker', 'Test Agent', ['python']);
      taskId = await orchestrator.createTask('Test Task', 1);
      await orchestrator.assignTask(taskId, agentId);
    });

    it('should complete task successfully', async () => {
      const result = { output: 'success' };
      const success = await orchestrator.completeTask(taskId, result);
      
      expect(success).toBe(true);
      
      const task = orchestrator['tasks'].get(taskId);
      expect(task.status).toBe('completed');
      expect(task.result).toEqual(result);
      expect(task.completedAt).toBeInstanceOf(Date);
      
      const agent = orchestrator['agents'].get(agentId);
      expect(agent.status).toBe('idle');
      expect(agent.currentTask).toBe(null);
      expect(agent.tasksCompleted).toBe(1);
    });

    it('should return false for non-existent task', async () => {
      const result = await orchestrator.completeTask('non-existent', { output: 'success' });
      expect(result).toBe(false);
    });

    it('should return false for task not in progress', async () => {
      const newTaskId = await orchestrator.createTask('New Task', 1);
      const result = await orchestrator.completeTask(newTaskId, { output: 'success' });
      expect(result).toBe(false);
    });
  });

  describe('getCurrentMetrics', () => {
    beforeEach(async () => {
      const agentId = await orchestrator.spawnAgent('worker', 'Test Agent', ['python']);
      const taskId = await orchestrator.createTask('Test Task', 1);
      await orchestrator.assignTask(taskId, agentId);
      await orchestrator.completeTask(taskId, { output: 'success' });
    });

    it('should return current metrics', () => {
      const metrics = orchestrator.getCurrentMetrics();
      
      expect(metrics).toEqual({
        totalAgents: 1,
        activeAgents: 1,
        idleAgents: 1,
        busyAgents: 0,
        totalTasks: 1,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 1,
        failedTasks: 0,
        averageResponseTime: expect.any(Number),
        resourceUtilization: expect.any(Number),
        throughput: expect.any(Number)
      });
    });
  });

  describe('optimizeSwarmPerformance', () => {
    it('should optimize performance when enabled', async () => {
      const result = await orchestrator.optimizeSwarmPerformance();
      
      expect(result).toEqual({
        optimizationApplied: true,
        metrics: expect.any(Object),
        recommendations: expect.any(Array),
        timestamp: expect.any(Date)
      });
    });

    it('should skip optimization when disabled', async () => {
      const disabledOrchestrator = new IntelligentOrchestrator({
        ...mockConfig,
        enableAIOptimization: false
      });

      const result = await disabledOrchestrator.optimizeSwarmPerformance();
      
      expect(result).toEqual({
        optimizationApplied: false,
        reason: 'AI optimization disabled',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('predictResourceNeeds', () => {
    it('should predict resource needs when enabled', async () => {
      const result = await orchestrator.predictResourceNeeds(3600);
      
      expect(result).toEqual({
        timeHorizon: 3600,
        predictions: expect.any(Object),
        confidence: expect.any(Number),
        recommendations: expect.any(Array),
        timestamp: expect.any(Date)
      });
    });

    it('should skip prediction when disabled', async () => {
      const disabledOrchestrator = new IntelligentOrchestrator({
        ...mockConfig,
        enablePredictiveScaling: false
      });

      const result = await disabledOrchestrator.predictResourceNeeds(3600);
      
      expect(result).toEqual({
        predictionApplied: false,
        reason: 'Predictive scaling disabled',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('shutdown', () => {
    it('should shutdown orchestrator gracefully', async () => {
      const shutdownSpy = jest.fn();
      orchestrator.on('orchestrator:shutdown', shutdownSpy);

      await orchestrator.shutdown();

      expect(shutdownSpy).toHaveBeenCalled();
    });
  });

  describe('startMetricsCollection', () => {
    it('should start metrics collection', () => {
      orchestrator.startMetricsCollection();
      
      expect(orchestrator['metricsInterval']).toBeDefined();
    });

    it('should not start if already running', () => {
      orchestrator.startMetricsCollection();
      const firstInterval = orchestrator['metricsInterval'];
      
      orchestrator.startMetricsCollection();
      const secondInterval = orchestrator['metricsInterval'];
      
      expect(firstInterval).toBe(secondInterval);
    });
  });

  describe('stopMetricsCollection', () => {
    it('should stop metrics collection', () => {
      orchestrator.startMetricsCollection();
      orchestrator.stopMetricsCollection();
      
      expect(orchestrator['metricsInterval']).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent agent spawning', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(orchestrator.spawnAgent('worker', `Agent ${i}`, ['python']));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      expect(new Set(results).size).toBe(5); // All IDs should be unique
    });

    it('should handle concurrent task creation', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(orchestrator.createTask(`Task ${i}`, i + 1));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      expect(new Set(results).size).toBe(5); // All IDs should be unique
    });
  });

  describe('collectMetrics and shouldOptimize', () => {
    it('should trigger optimization when thresholds exceeded', () => {
      // Mock high resource utilization
      const mockStatus = {
        active_agents: 1,
        completed_tasks: 5,
        average_response_time: 6000, // Above 5000 threshold
        resource_utilization: 0.9, // Above 0.8 threshold
        error_rate: 0.15 // Above 0.1 threshold
      };
      
      jest.spyOn(orchestrator['wasmCoordinator'], 'get_swarm_status').mockReturnValue(JSON.stringify(mockStatus));
      jest.spyOn(orchestrator, 'optimizeSwarmPerformance').mockResolvedValue({});
      
      // Manually call collectMetrics to test the shouldOptimize branch
      orchestrator['collectMetrics']();
      
      expect(orchestrator.optimizeSwarmPerformance).toHaveBeenCalled();
    });
    
    it('should not trigger optimization when thresholds not exceeded', () => {
      // Mock normal metrics
      const mockStatus = {
        active_agents: 1,
        completed_tasks: 5,
        average_response_time: 100, // Below 5000 threshold
        resource_utilization: 0.5, // Below 0.8 threshold
        error_rate: 0.01 // Below 0.1 threshold
      };
      
      jest.spyOn(orchestrator['wasmCoordinator'], 'get_swarm_status').mockReturnValue(JSON.stringify(mockStatus));
      jest.spyOn(orchestrator, 'optimizeSwarmPerformance').mockResolvedValue({});
      
      // Manually call collectMetrics to test the shouldOptimize branch
      orchestrator['collectMetrics']();
      
      expect(orchestrator.optimizeSwarmPerformance).not.toHaveBeenCalled();
    });

    it('should not trigger optimization when already optimizing', () => {
      // Set optimization in progress
      orchestrator['isOptimizing'] = true;
      
      const mockStatus = {
        active_agents: 1,
        completed_tasks: 5,
        average_response_time: 6000, // Above threshold
        resource_utilization: 0.9, // Above threshold
        error_rate: 0.15 // Above threshold
      };
      
      jest.spyOn(orchestrator['wasmCoordinator'], 'get_swarm_status').mockReturnValue(JSON.stringify(mockStatus));
      jest.spyOn(orchestrator, 'optimizeSwarmPerformance').mockResolvedValue({});
      
      // Manually call collectMetrics
      orchestrator['collectMetrics']();
      
      expect(orchestrator.optimizeSwarmPerformance).not.toHaveBeenCalled();
    });
  });

  describe('getSwarmStatus', () => {
    it('should return swarm status from WASM coordinator', () => {
      const mockStatus = { active_agents: 5, completed_tasks: 10 };
      jest.spyOn(orchestrator['wasmCoordinator'], 'get_swarm_status').mockReturnValue(JSON.stringify(mockStatus));
      
      const status = orchestrator.getSwarmStatus();
      
      expect(status).toEqual(mockStatus);
    });
  });

  describe('optimization error handling', () => {
    it('should handle optimization errors gracefully', async () => {
      // Enable optimization
      orchestrator['config'].enableAIOptimization = true;
      
      // Mock AI optimizer to throw error
      jest.spyOn(orchestrator['aiOptimizer'], 'generateOptimizations').mockRejectedValue(new Error('Optimization failed'));
      
      await expect(orchestrator.optimizeSwarmPerformance()).rejects.toThrow('Optimization failed');
      expect(orchestrator['isOptimizing']).toBe(false); // Should reset flag
    });
  });

  describe('performance metrics calculation', () => {
    it('should calculate response time correctly', async () => {
      const agentId = await orchestrator.spawnAgent('worker', 'Test Agent', ['python']);
      const taskId = await orchestrator.createTask('Test Task', 1);
      
      await orchestrator.assignTask(taskId, agentId);
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await orchestrator.completeTask(taskId, { output: 'success' });
      
      const metrics = orchestrator.getCurrentMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should calculate resource utilization', async () => {
      const agentId = await orchestrator.spawnAgent('worker', 'Test Agent', ['python']);
      const taskId = await orchestrator.createTask('Test Task', 1);
      
      await orchestrator.assignTask(taskId, agentId);
      
      const metrics = orchestrator.getCurrentMetrics();
      expect(metrics.resourceUtilization).toBe(1.0); // 1 busy agent out of 1 total
    });
  });
});

describe('createIntelligentOrchestrator', () => {
  it('should create orchestrator with provided config', () => {
    const config = {
      maxAgents: 15,
      enableWasmOptimization: true,
      enableAIOptimization: true,
      enablePredictiveScaling: false,
      metricsInterval: 8000,
      optimizationThreshold: 0.9
    };

    const orchestrator = createIntelligentOrchestrator(config);
    
    expect(orchestrator).toBeInstanceOf(IntelligentOrchestrator);
    expect(orchestrator['config']).toEqual(config);
  });

  it('should create orchestrator with default config', () => {
    const orchestrator = createIntelligentOrchestrator();
    
    expect(orchestrator).toBeInstanceOf(IntelligentOrchestrator);
    expect(orchestrator['config']).toEqual({
      maxAgents: 25,
      enableWasmOptimization: false,
      enableAIOptimization: false,
      enablePredictiveScaling: false,
      metricsInterval: 10000,
      optimizationThreshold: 0.7
    });
  });
});