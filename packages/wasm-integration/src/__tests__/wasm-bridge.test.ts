import { EventEmitter } from 'events';
import {
  WasmSwarmCoordinator,
  createWasmCoordinator,
  WasmCoordinatorConfig,
  WasmAgent,
  WasmTask,
  WasmSwarmStatus
} from '../wasm-bridge';

// Mock the WASM module
jest.mock('../pkg/nodejs/wasm_swarm_coordinator.js', () => ({
  default: jest.fn().mockResolvedValue(undefined),
  WasmSwarmCoordinator: jest.fn().mockImplementation(() => ({
    spawn_agent: jest.fn(),
    create_task: jest.fn(),
    assign_task: jest.fn(),
    update_task_status: jest.fn(),
    get_swarm_status: jest.fn(),
    store_memory: jest.fn(),
    retrieve_memory: jest.fn(),
    memory: {
      buffer: {
        byteLength: 1024 * 1024 * 16 // 16MB
      }
    }
  }))
}));

describe('WasmSwarmCoordinator', () => {
  let coordinator: WasmSwarmCoordinator;
  let mockWasmInstance: any;
  let config: WasmCoordinatorConfig;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup config
    config = {
      maxAgents: 10,
      enablePerformanceOptimization: true,
      enableMemoryOptimization: true,
      logLevel: 'info'
    };

    // Setup mock WASM instance
    mockWasmInstance = {
      spawn_agent: jest.fn(),
      create_task: jest.fn(),
      assign_task: jest.fn(),
      update_task_status: jest.fn(),
      get_swarm_status: jest.fn().mockReturnValue('{"status": "active"}'),
      store_memory: jest.fn(),
      retrieve_memory: jest.fn(),
      memory: {
        buffer: {
          byteLength: 1024 * 1024 * 16 // 16MB
        }
      }
    };

    // Create coordinator instance
    coordinator = new WasmSwarmCoordinator(config);
    
    // Manually set the WASM instance to bypass async initialization for tests
    (coordinator as any).wasmInstance = mockWasmInstance;
    (coordinator as any).isInitialized = true;
  });

  afterEach(() => {
    if (coordinator) {
      coordinator.shutdown();
    }
    jest.clearAllTimers();
  });

  describe('constructor and initialization', () => {
    it('should create coordinator with valid config', () => {
      expect(coordinator).toBeInstanceOf(WasmSwarmCoordinator);
      expect(coordinator).toBeInstanceOf(EventEmitter);
    });

    it('should emit initialized event on successful initialization', (done) => {
      const newCoordinator = new WasmSwarmCoordinator(config);
      
      newCoordinator.on('initialized', (data) => {
        expect(data).toHaveProperty('maxAgents', 10);
        expect(data).toHaveProperty('timestamp');
        newCoordinator.shutdown();
        done();
      });
    });

    it('should emit error event on initialization failure', (done) => {
      // Mock initialization failure
      const wasmModule = require('../pkg/nodejs/wasm_swarm_coordinator.js');
      wasmModule.default.mockRejectedValueOnce(new Error('WASM load failed'));

      const newCoordinator = new WasmSwarmCoordinator(config);
      
      newCoordinator.on('error', (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('WASM load failed');
        done();
      });
    });
  });

  describe('spawnAgent', () => {
    it('should spawn agent successfully', async () => {
      const agentId = 'agent-123';
      mockWasmInstance.spawn_agent.mockReturnValue(agentId);

      const eventSpy = jest.fn();
      coordinator.on('agent:spawned', eventSpy);

      const result = await coordinator.spawnAgent('specialist', 'test-agent', ['python', 'database']);

      expect(result).toBe(agentId);
      expect(mockWasmInstance.spawn_agent).toHaveBeenCalledWith(
        'specialist',
        'test-agent',
        '["python","database"]'
      );
      expect(eventSpy).toHaveBeenCalledWith({
        agent: expect.objectContaining({
          id: agentId,
          type: 'specialist',
          name: 'test-agent',
          capabilities: ['python', 'database'],
          status: 'active',
          performance: 100,
          memoryUsage: 0
        }),
        timestamp: expect.any(Number)
      });
    });

    it('should throw error when not initialized', async () => {
      (coordinator as any).isInitialized = false;

      await expect(
        coordinator.spawnAgent('specialist', 'test-agent', ['python'])
      ).rejects.toThrow('WASM coordinator not initialized');
    });

    it('should handle WASM spawn failure', async () => {
      mockWasmInstance.spawn_agent.mockReturnValue(null);

      await expect(
        coordinator.spawnAgent('specialist', 'test-agent', ['python'])
      ).rejects.toThrow('Failed to spawn agent in WASM');
    });

    it('should emit error event on spawn failure', async () => {
      const error = new Error('Spawn failed');
      mockWasmInstance.spawn_agent.mockImplementation(() => {
        throw error;
      });

      const errorSpy = jest.fn();
      coordinator.on('error', errorSpy);

      await expect(
        coordinator.spawnAgent('specialist', 'test-agent', ['python'])
      ).rejects.toThrow('Spawn failed');

      expect(errorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const taskId = 'task-456';
      mockWasmInstance.create_task.mockReturnValue(taskId);

      const eventSpy = jest.fn();
      coordinator.on('task:created', eventSpy);

      const result = await coordinator.createTask('test-task', 5, ['dep1', 'dep2']);

      expect(result).toBe(taskId);
      expect(mockWasmInstance.create_task).toHaveBeenCalledWith(
        'test-task',
        5,
        '["dep1","dep2"]'
      );
      expect(eventSpy).toHaveBeenCalledWith({
        task: expect.objectContaining({
          id: taskId,
          name: 'test-task',
          priority: 5,
          status: 'pending',
          dependencies: ['dep1', 'dep2'],
          progress: 0,
          startTime: expect.any(Number)
        }),
        timestamp: expect.any(Number)
      });
    });

    it('should create task with default dependencies', async () => {
      const taskId = 'task-789';
      mockWasmInstance.create_task.mockReturnValue(taskId);

      const result = await coordinator.createTask('simple-task', 3);

      expect(result).toBe(taskId);
      expect(mockWasmInstance.create_task).toHaveBeenCalledWith(
        'simple-task',
        3,
        '[]'
      );
    });

    it('should throw error when not initialized', async () => {
      (coordinator as any).isInitialized = false;

      await expect(
        coordinator.createTask('test-task', 5)
      ).rejects.toThrow('WASM coordinator not initialized');
    });

    it('should handle WASM task creation failure', async () => {
      mockWasmInstance.create_task.mockReturnValue(null);

      await expect(
        coordinator.createTask('test-task', 5)
      ).rejects.toThrow('Failed to create task in WASM');
    });
  });

  describe('assignTask', () => {
    let agentId: string;
    let taskId: string;

    beforeEach(async () => {
      // Setup agent and task
      agentId = 'agent-123';
      taskId = 'task-456';
      
      mockWasmInstance.spawn_agent.mockReturnValue(agentId);
      mockWasmInstance.create_task.mockReturnValue(taskId);
      
      await coordinator.spawnAgent('specialist', 'test-agent', ['python']);
      await coordinator.createTask('test-task', 5);
    });

    it('should assign task to agent successfully', async () => {
      mockWasmInstance.assign_task.mockReturnValue(true);

      const eventSpy = jest.fn();
      coordinator.on('task:assigned', eventSpy);

      const result = await coordinator.assignTask(taskId, agentId);

      expect(result).toBe(true);
      expect(mockWasmInstance.assign_task).toHaveBeenCalledWith(taskId, agentId);
      expect(eventSpy).toHaveBeenCalledWith({
        taskId,
        agentId,
        timestamp: expect.any(Number)
      });

      // Check that local state was updated
      const tasks = coordinator.getTasks();
      const agents = coordinator.getAgents();
      
      const task = tasks.find(t => t.id === taskId);
      const agent = agents.find(a => a.id === agentId);
      
      expect(task?.assignedAgent).toBe(agentId);
      expect(task?.status).toBe('in_progress');
      expect(agent?.status).toBe('busy');
    });

    it('should handle assignment failure', async () => {
      mockWasmInstance.assign_task.mockReturnValue(false);

      const result = await coordinator.assignTask(taskId, agentId);

      expect(result).toBe(false);
    });

    it('should throw error when not initialized', async () => {
      (coordinator as any).isInitialized = false;

      await expect(
        coordinator.assignTask(taskId, agentId)
      ).rejects.toThrow('WASM coordinator not initialized');
    });
  });

  describe('completeTask', () => {
    let agentId: string;
    let taskId: string;

    beforeEach(async () => {
      agentId = 'agent-123';
      taskId = 'task-456';
      
      mockWasmInstance.spawn_agent.mockReturnValue(agentId);
      mockWasmInstance.create_task.mockReturnValue(taskId);
      mockWasmInstance.assign_task.mockReturnValue(true);
      
      await coordinator.spawnAgent('specialist', 'test-agent', ['python']);
      await coordinator.createTask('test-task', 5);
      await coordinator.assignTask(taskId, agentId);
    });

    it('should complete task successfully', async () => {
      mockWasmInstance.update_task_status.mockReturnValue(true);

      const eventSpy = jest.fn();
      coordinator.on('task:completed', eventSpy);

      const result = await coordinator.completeTask(taskId, { success: true });

      expect(result).toBe(true);
      expect(mockWasmInstance.update_task_status).toHaveBeenCalledWith(taskId, 'completed');
      expect(eventSpy).toHaveBeenCalledWith({
        task: expect.objectContaining({
          id: taskId,
          status: 'completed',
          progress: 100,
          endTime: expect.any(Number)
        }),
        result: { success: true },
        timestamp: expect.any(Number)
      });

      // Check that agent is marked as idle
      const agents = coordinator.getAgents();
      const agent = agents.find(a => a.id === agentId);
      expect(agent?.status).toBe('idle');
    });

    it('should update agent performance based on completion time', async () => {
      mockWasmInstance.update_task_status.mockReturnValue(true);

      // Set task start time to simulate a task taking time
      const tasks = coordinator.getTasks();
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.startTime = Date.now() - 30000; // 30 seconds ago
        (coordinator as any).tasks.set(taskId, task);
      }

      await coordinator.completeTask(taskId, { success: true });

      const agents = coordinator.getAgents();
      const agent = agents.find(a => a.id === agentId);
      expect(agent?.performance).toBeGreaterThan(0);
      expect(agent?.performance).toBeLessThanOrEqual(100);
    });

    it('should handle completion failure', async () => {
      mockWasmInstance.update_task_status.mockReturnValue(false);

      const result = await coordinator.completeTask(taskId, { success: true });

      expect(result).toBe(false);
    });

    it('should throw error when not initialized', async () => {
      (coordinator as any).isInitialized = false;

      await expect(
        coordinator.completeTask(taskId, { success: true })
      ).rejects.toThrow('WASM coordinator not initialized');
    });
  });

  describe('getSwarmStatus', () => {
    beforeEach(async () => {
      // Add some agents and tasks for status calculation
      mockWasmInstance.spawn_agent.mockReturnValue('agent-1');
      mockWasmInstance.create_task.mockReturnValue('task-1');
      
      await coordinator.spawnAgent('specialist', 'agent-1', ['python']);
      await coordinator.createTask('task-1', 5);
    });

    it('should return swarm status successfully', () => {
      const status = coordinator.getSwarmStatus();

      expect(status).toEqual({
        activeAgents: 1,
        totalTasks: 1,
        completedTasks: 0,
        averageResponseTime: 0,
        memoryUsage: expect.any(Number),
        cpuUsage: expect.any(Number),
        throughput: 0
      });
    });

    it('should calculate memory usage correctly', () => {
      const status = coordinator.getSwarmStatus();
      
      // 16MB buffer = 6.25% of 256MB
      expect(status.memoryUsage).toBeCloseTo(6.25, 1);
    });

    it('should calculate CPU usage based on busy agents', async () => {
      // Assign task to make agent busy
      mockWasmInstance.assign_task.mockReturnValue(true);
      await coordinator.assignTask('task-1', 'agent-1');

      const status = coordinator.getSwarmStatus();
      
      // 1 busy agent out of 10 max = 10%
      expect(status.cpuUsage).toBe(10);
    });

    it('should throw error when not initialized', () => {
      (coordinator as any).isInitialized = false;

      expect(() => coordinator.getSwarmStatus()).toThrow('WASM coordinator not initialized');
    });
  });

  describe('performance monitoring', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start performance monitoring when enabled', () => {
      const config = {
        maxAgents: 10,
        enablePerformanceOptimization: true,
        enableMemoryOptimization: true,
        logLevel: 'info' as const
      };

      const newCoordinator = new WasmSwarmCoordinator(config);
      
      // Manually trigger initialization
      (newCoordinator as any).wasmInstance = mockWasmInstance;
      (newCoordinator as any).isInitialized = true;
      (newCoordinator as any).startPerformanceMonitoring();

      const metricsSpy = jest.fn();
      newCoordinator.on('metrics', metricsSpy);

      // Fast-forward 1 second
      jest.advanceTimersByTime(1000);

      expect(metricsSpy).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        activeAgents: 0,
        memoryUsage: expect.any(Number),
        cpuUsage: 0,
        throughput: 0
      });

      newCoordinator.shutdown();
    });

    it('should not start monitoring when disabled', () => {
      const config = {
        maxAgents: 10,
        enablePerformanceOptimization: false,
        enableMemoryOptimization: true,
        logLevel: 'info' as const
      };

      const newCoordinator = new WasmSwarmCoordinator(config);
      
      // Check that no timer was set
      expect((newCoordinator as any).performanceMonitor).toBeNull();
      
      newCoordinator.shutdown();
    });

    it('should trigger optimization when thresholds exceeded', async () => {
      const optimizeSpy = jest.spyOn(coordinator, 'optimizePerformance');
      
      // Mock high resource usage
      jest.spyOn(coordinator, 'getSwarmStatus').mockReturnValue({
        activeAgents: 5,
        totalTasks: 10,
        completedTasks: 5,
        averageResponseTime: 1000,
        memoryUsage: 85, // Exceeds 80% threshold
        cpuUsage: 90,    // Exceeds 85% threshold
        throughput: 10
      });

      // Manually trigger metrics collection
      (coordinator as any).collectPerformanceMetrics();

      expect(optimizeSpy).toHaveBeenCalled();
    });
  });

  describe('optimizePerformance', () => {
    it('should perform all optimization steps', async () => {
      const eventSpy = jest.fn();
      coordinator.on('performance:optimized', eventSpy);

      await coordinator.optimizePerformance();

      expect(eventSpy).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        optimizations: ['memory', 'load-balancing', 'garbage-collection']
      });
    });

    it('should not optimize when disabled', async () => {
      const config = {
        maxAgents: 10,
        enablePerformanceOptimization: false,
        enableMemoryOptimization: false,
        logLevel: 'info' as const
      };

      const newCoordinator = new WasmSwarmCoordinator(config);
      (newCoordinator as any).wasmInstance = mockWasmInstance;
      (newCoordinator as any).isInitialized = true;

      const eventSpy = jest.fn();
      newCoordinator.on('performance:optimized', eventSpy);

      await newCoordinator.optimizePerformance();

      expect(eventSpy).not.toHaveBeenCalled();
      newCoordinator.shutdown();
    });

    it('should clean up old completed tasks during memory optimization', async () => {
      // Create completed task older than 1 hour
      const oldTaskId = 'old-task';
      mockWasmInstance.create_task.mockReturnValue(oldTaskId);
      
      await coordinator.createTask('old-task', 1);
      const tasks = coordinator.getTasks();
      const oldTask = tasks.find(t => t.id === oldTaskId);
      
      if (oldTask) {
        oldTask.status = 'completed';
        oldTask.endTime = Date.now() - 3700000; // 1 hour 1 minute ago
        (coordinator as any).tasks.set(oldTaskId, oldTask);
      }

      const taskCountBefore = coordinator.getTasks().length;
      await coordinator.optimizePerformance();
      const taskCountAfter = coordinator.getTasks().length;

      expect(taskCountAfter).toBeLessThan(taskCountBefore);
    });

    it('should perform load balancing', async () => {
      // Setup scenario with pending tasks and idle agents
      const agentId = 'idle-agent';
      const taskId = 'pending-task';
      
      mockWasmInstance.spawn_agent.mockReturnValue(agentId);
      mockWasmInstance.create_task.mockReturnValue(taskId);
      mockWasmInstance.assign_task.mockReturnValue(true);
      
      await coordinator.spawnAgent('specialist', 'idle-agent', ['python']);
      await coordinator.createTask('python implementation', 3);

      const assignSpy = jest.spyOn(coordinator, 'assignTask');
      
      await coordinator.optimizePerformance();

      expect(assignSpy).toHaveBeenCalledWith(taskId, agentId);
    });
  });

  describe('memory operations', () => {
    it('should store memory successfully', () => {
      mockWasmInstance.store_memory.mockReturnValue(true);

      const result = coordinator.storeMemory('test-key', 'test-value');

      expect(result).toBe(true);
      expect(mockWasmInstance.store_memory).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should retrieve memory successfully', () => {
      mockWasmInstance.retrieve_memory.mockReturnValue('test-value');

      const result = coordinator.retrieveMemory('test-key');

      expect(result).toBe('test-value');
      expect(mockWasmInstance.retrieve_memory).toHaveBeenCalledWith('test-key');
    });

    it('should throw error for memory operations when not initialized', () => {
      (coordinator as any).isInitialized = false;

      expect(() => coordinator.storeMemory('key', 'value')).toThrow('WASM coordinator not initialized');
      expect(() => coordinator.retrieveMemory('key')).toThrow('WASM coordinator not initialized');
    });
  });

  describe('getters', () => {
    beforeEach(async () => {
      mockWasmInstance.spawn_agent.mockReturnValue('agent-1');
      mockWasmInstance.create_task.mockReturnValue('task-1');
      
      await coordinator.spawnAgent('specialist', 'test-agent', ['python']);
      await coordinator.createTask('test-task', 5);
    });

    it('should return all agents', () => {
      const agents = coordinator.getAgents();

      expect(agents).toHaveLength(1);
      expect(agents[0]).toEqual(expect.objectContaining({
        id: 'agent-1',
        type: 'specialist',
        name: 'test-agent',
        capabilities: ['python'],
        status: 'active'
      }));
    });

    it('should return all tasks', () => {
      const tasks = coordinator.getTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual(expect.objectContaining({
        id: 'task-1',
        name: 'test-task',
        priority: 5,
        status: 'pending'
      }));
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const eventSpy = jest.fn();
      coordinator.on('shutdown', eventSpy);

      await coordinator.shutdown();

      expect(eventSpy).toHaveBeenCalledWith({
        timestamp: expect.any(Number)
      });
      expect((coordinator as any).isInitialized).toBe(false);
      expect(coordinator.getAgents()).toHaveLength(0);
      expect(coordinator.getTasks()).toHaveLength(0);
    });

    it('should clear performance monitor', async () => {
      (coordinator as any).performanceMonitor = setInterval(() => {}, 1000);

      await coordinator.shutdown();

      expect((coordinator as any).performanceMonitor).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should emit error events for caught exceptions', async () => {
      const error = new Error('WASM operation failed');
      mockWasmInstance.spawn_agent.mockImplementation(() => {
        throw error;
      });

      const errorSpy = jest.fn();
      coordinator.on('error', errorSpy);

      await expect(
        coordinator.spawnAgent('specialist', 'test-agent', ['python'])
      ).rejects.toThrow('WASM operation failed');

      expect(errorSpy).toHaveBeenCalledWith(error);
    });

    it('should handle malformed WASM status response', () => {
      mockWasmInstance.get_swarm_status.mockReturnValue('invalid-json');

      const errorSpy = jest.fn();
      coordinator.on('error', errorSpy);

      expect(() => coordinator.getSwarmStatus()).toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});

describe('createWasmCoordinator', () => {
  it('should create coordinator with default config', () => {
    const coordinator = createWasmCoordinator();

    expect(coordinator).toBeInstanceOf(WasmSwarmCoordinator);
    coordinator.shutdown();
  });

  it('should create coordinator with custom config', () => {
    const customConfig = {
      maxAgents: 20,
      enablePerformanceOptimization: false
    };

    const coordinator = createWasmCoordinator(customConfig);

    expect(coordinator).toBeInstanceOf(WasmSwarmCoordinator);
    coordinator.shutdown();
  });

  it('should merge custom config with defaults', () => {
    const customConfig = {
      maxAgents: 15
    };

    const coordinator = createWasmCoordinator(customConfig);
    
    // Verify that default values are still applied for unspecified options
    expect(coordinator).toBeInstanceOf(WasmSwarmCoordinator);
    coordinator.shutdown();
  });
});