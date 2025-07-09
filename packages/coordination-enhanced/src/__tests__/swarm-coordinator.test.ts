import { EventEmitter } from 'eventemitter3';
import { SwarmCoordinator, SwarmStatus, AgentInfo, TaskInfo, CoordinationEvent } from '../swarm-coordinator';
import { IntelligentOrchestrator } from '../intelligent-orchestration';

// Mock IntelligentOrchestrator
jest.mock('../intelligent-orchestration');

describe('SwarmCoordinator', () => {
  let coordinator: SwarmCoordinator;
  let mockOrchestrator: jest.Mocked<IntelligentOrchestrator>;

  beforeEach(() => {
    mockOrchestrator = {
      on: jest.fn(),
      spawnAgent: jest.fn(),
      createTask: jest.fn(),
      assignTask: jest.fn(),
      getCurrentMetrics: jest.fn(),
      optimizeSwarmPerformance: jest.fn(),
      predictResourceNeeds: jest.fn(),
      shutdown: jest.fn()
    } as any;

    (IntelligentOrchestrator as unknown as jest.Mock).mockImplementation(() => mockOrchestrator);
    coordinator = new SwarmCoordinator(25);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(IntelligentOrchestrator).toHaveBeenCalledWith({
        maxAgents: 25,
        enableWasmOptimization: true,
        enableAIOptimization: true,
        enablePredictiveScaling: true,
        metricsInterval: 5000,
        optimizationThreshold: 0.8
      });
      expect(mockOrchestrator.on).toHaveBeenCalledWith('agent:spawned', expect.any(Function));
      expect(mockOrchestrator.on).toHaveBeenCalledWith('task:created', expect.any(Function));
      expect(mockOrchestrator.on).toHaveBeenCalledWith('task:assigned', expect.any(Function));
      expect(mockOrchestrator.on).toHaveBeenCalledWith('optimization:completed', expect.any(Function));
    });

    it('should initialize with custom max agents', () => {
      const customCoordinator = new SwarmCoordinator(50);
      expect(IntelligentOrchestrator).toHaveBeenCalledWith(
        expect.objectContaining({ maxAgents: 50 })
      );
    });
  });

  describe('event handlers', () => {
    it('should handle agent spawned event', () => {
      const eventSpy = jest.fn();
      coordinator.on('event:recorded', eventSpy);

      // Simulate agent spawned event
      const agentData = {
        agentId: 'agent-123',
        type: 'worker',
        name: 'Test Agent',
        capabilities: ['python', 'testing']
      };

      // Get the event handler and call it
      const agentSpawnedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'agent:spawned'
      )![1];
      agentSpawnedHandler(agentData);

      expect(coordinator.getAgentInfo('agent-123')).toEqual({
        agentId: 'agent-123',
        type: 'worker',
        name: 'Test Agent',
        status: 'active',
        capabilities: ['python', 'testing'],
        tasksCompleted: 0,
        averageTaskTime: 0,
        lastActivity: expect.any(String)
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'agent_spawned',
          data: agentData
        })
      );
    });

    it('should handle task created event', () => {
      const eventSpy = jest.fn();
      coordinator.on('event:recorded', eventSpy);

      const taskData = {
        taskId: 'task-456',
        name: 'Test Task',
        priority: 1,
        dependencies: ['task-123']
      };

      const taskCreatedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'task:created'
      )![1];
      taskCreatedHandler(taskData);

      expect(coordinator.getTaskInfo('task-456')).toEqual({
        taskId: 'task-456',
        name: 'Test Task',
        status: 'pending',
        priority: 1,
        dependencies: ['task-123'],
        createdAt: expect.any(String)
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_created',
          data: taskData
        })
      );
    });

    it('should handle task assigned event', () => {
      // First create agent and task
      const agentData = {
        agentId: 'agent-123',
        type: 'worker',
        name: 'Test Agent',
        capabilities: ['python']
      };
      
      const taskData = {
        taskId: 'task-456',
        name: 'Test Task',
        priority: 1,
        dependencies: []
      };

      const agentSpawnedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'agent:spawned'
      )![1];
      agentSpawnedHandler(agentData);

      const taskCreatedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'task:created'
      )![1];
      taskCreatedHandler(taskData);

      // Now assign task
      const assignmentData = {
        taskId: 'task-456',
        agentId: 'agent-123'
      };

      const taskAssignedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'task:assigned'
      )![1];
      taskAssignedHandler(assignmentData);

      const updatedTask = coordinator.getTaskInfo('task-456');
      const updatedAgent = coordinator.getAgentInfo('agent-123');

      expect(updatedTask).toEqual(
        expect.objectContaining({
          status: 'in_progress',
          assignedAgent: 'agent-123',
          startedAt: expect.any(String)
        })
      );

      expect(updatedAgent).toEqual(
        expect.objectContaining({
          status: 'busy',
          currentTask: 'task-456',
          lastActivity: expect.any(String)
        })
      );
    });
  });

  describe('spawnAgent', () => {
    it('should delegate to orchestrator', async () => {
      mockOrchestrator.spawnAgent.mockResolvedValue('agent-123');

      const result = await coordinator.spawnAgent('worker', 'Test Agent', ['python']);

      expect(mockOrchestrator.spawnAgent).toHaveBeenCalledWith('worker', 'Test Agent', ['python']);
      expect(result).toBe('agent-123');
    });
  });

  describe('createTask', () => {
    it('should delegate to orchestrator', async () => {
      mockOrchestrator.createTask.mockResolvedValue('task-123');

      const result = await coordinator.createTask('Test Task', 1, ['dep-1']);

      expect(mockOrchestrator.createTask).toHaveBeenCalledWith('Test Task', 1, ['dep-1']);
      expect(result).toBe('task-123');
    });

    it('should handle task creation with default dependencies', async () => {
      mockOrchestrator.createTask.mockResolvedValue('task-123');

      const result = await coordinator.createTask('Test Task', 1);

      expect(mockOrchestrator.createTask).toHaveBeenCalledWith('Test Task', 1, []);
      expect(result).toBe('task-123');
    });
  });

  describe('assignTask', () => {
    it('should delegate to orchestrator', async () => {
      mockOrchestrator.assignTask.mockResolvedValue(true);

      const result = await coordinator.assignTask('task-123', 'agent-456');

      expect(mockOrchestrator.assignTask).toHaveBeenCalledWith('task-123', 'agent-456');
      expect(result).toBe(true);
    });
  });

  describe('completeTask', () => {
    beforeEach(() => {
      // Create agent and task first
      const agentData = {
        agentId: 'agent-123',
        type: 'worker',
        name: 'Test Agent',
        capabilities: ['python']
      };
      
      const taskData = {
        taskId: 'task-456',
        name: 'Test Task',
        priority: 1,
        dependencies: []
      };

      const agentSpawnedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'agent:spawned'
      )![1];
      agentSpawnedHandler(agentData);

      const taskCreatedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'task:created'
      )![1];
      taskCreatedHandler(taskData);

      // Assign task
      const assignmentData = {
        taskId: 'task-456',
        agentId: 'agent-123'
      };

      const taskAssignedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'task:assigned'
      )![1];
      taskAssignedHandler(assignmentData);
    });

    it('should complete task successfully', async () => {
      const result = await coordinator.completeTask('task-456', { output: 'success' });

      expect(result).toBe(true);

      const task = coordinator.getTaskInfo('task-456');
      expect(task).toEqual(
        expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(String),
          duration: expect.any(Number)
        })
      );

      const agent = coordinator.getAgentInfo('agent-123');
      expect(agent).toEqual(
        expect.objectContaining({
          status: 'idle',
          currentTask: undefined,
          tasksCompleted: 1,
          averageTaskTime: expect.any(Number)
        })
      );
    });

    it('should return false for non-existent task', async () => {
      const result = await coordinator.completeTask('non-existent', { output: 'success' });
      expect(result).toBe(false);
    });
  });

  describe('getSwarmStatus', () => {
    it('should return current swarm status', () => {
      mockOrchestrator.getCurrentMetrics.mockReturnValue({
        activeAgents: 0,
        completedTasks: 0,
        averageResponseTime: 100,
        resourceUtilization: 0.75,
        errorRate: 0.01
      });

      const status = coordinator.getSwarmStatus();

      expect(status).toEqual({
        swarmId: expect.any(String),
        activeAgents: 0,
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageResponseTime: 100,
        resourceUtilization: 0.75,
        uptime: expect.any(Number),
        lastUpdated: expect.any(String)
      });
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      // Add some test data
      const agentData = {
        agentId: 'agent-123',
        type: 'worker',
        name: 'Test Agent',
        capabilities: ['python']
      };

      const agentSpawnedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'agent:spawned'
      )![1];
      agentSpawnedHandler(agentData);
    });

    it('should get agent info', () => {
      const agent = coordinator.getAgentInfo('agent-123');
      expect(agent).toEqual(
        expect.objectContaining({
          agentId: 'agent-123',
          type: 'worker',
          name: 'Test Agent'
        })
      );
    });

    it('should return undefined for non-existent agent', () => {
      const agent = coordinator.getAgentInfo('non-existent');
      expect(agent).toBeUndefined();
    });

    it('should get all agents', () => {
      const agents = coordinator.getAllAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0]).toEqual(
        expect.objectContaining({
          agentId: 'agent-123'
        })
      );
    });

    it('should get task info', () => {
      const taskData = {
        taskId: 'task-456',
        name: 'Test Task',
        priority: 1,
        dependencies: []
      };

      const taskCreatedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'task:created'
      )![1];
      taskCreatedHandler(taskData);

      const task = coordinator.getTaskInfo('task-456');
      expect(task).toEqual(
        expect.objectContaining({
          taskId: 'task-456',
          name: 'Test Task'
        })
      );
    });

    it('should get all tasks', () => {
      const taskData = {
        taskId: 'task-456',
        name: 'Test Task',
        priority: 1,
        dependencies: []
      };

      const taskCreatedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'task:created'
      )![1];
      taskCreatedHandler(taskData);

      const tasks = coordinator.getAllTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual(
        expect.objectContaining({
          taskId: 'task-456'
        })
      );
    });
  });

  describe('getRecentEvents', () => {
    it('should return recent events with default limit', () => {
      // Trigger some events
      const agentData = {
        agentId: 'agent-123',
        type: 'worker',
        name: 'Test Agent',
        capabilities: ['python']
      };

      const agentSpawnedHandler = mockOrchestrator.on.mock.calls.find(
        call => call[0] === 'agent:spawned'
      )![1];
      agentSpawnedHandler(agentData);

      const events = coordinator.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(
        expect.objectContaining({
          type: 'agent_spawned',
          eventId: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    it('should return recent events with custom limit', () => {
      // Trigger multiple events
      for (let i = 0; i < 5; i++) {
        const agentData = {
          agentId: `agent-${i}`,
          type: 'worker',
          name: `Test Agent ${i}`,
          capabilities: ['python']
        };

        const agentSpawnedHandler = mockOrchestrator.on.mock.calls.find(
          call => call[0] === 'agent:spawned'
        )![1];
        agentSpawnedHandler(agentData);
      }

      const events = coordinator.getRecentEvents(3);
      expect(events).toHaveLength(3);
    });
  });

  describe('optimization methods', () => {
    it('should optimize performance', async () => {
      mockOrchestrator.optimizeSwarmPerformance.mockResolvedValue({
        optimizationApplied: true,
        metrics: {},
        recommendations: [],
        timestamp: new Date()
      });

      const result = await coordinator.optimizePerformance();

      expect(mockOrchestrator.optimizeSwarmPerformance).toHaveBeenCalled();
      expect(result).toEqual({
        optimizationApplied: true,
        metrics: {},
        recommendations: [],
        timestamp: expect.any(Date)
      });
    });

    it('should predict resource needs', async () => {
      mockOrchestrator.predictResourceNeeds.mockResolvedValue({
        timeHorizon: 3600,
        predictions: {
          predictedLoad: 50,
          recommendedAgents: 5,
          estimatedCost: 25
        },
        confidence: 0.85,
        recommendations: [],
        timestamp: new Date()
      });

      const result = await coordinator.predictResourceNeeds(3600);

      expect(mockOrchestrator.predictResourceNeeds).toHaveBeenCalledWith(3600);
      expect(result).toEqual({
        timeHorizon: 3600,
        predictions: {
          predictedLoad: 50,
          recommendedAgents: 5,
          estimatedCost: 25
        },
        confidence: 0.85,
        recommendations: [],
        timestamp: expect.any(Date)
      });
    });
  });

  describe('shutdown', () => {
    it('should shutdown orchestrator and emit event', async () => {
      const shutdownSpy = jest.fn();
      coordinator.on('coordinator:shutdown', shutdownSpy);

      await coordinator.shutdown();

      expect(mockOrchestrator.shutdown).toHaveBeenCalled();
      expect(shutdownSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          swarmId: expect.any(String)
        })
      );
    });
  });

  describe('event recording', () => {
    it('should limit events to 1000', () => {
      // Trigger more than 1000 events
      for (let i = 0; i < 1100; i++) {
        const agentData = {
          agentId: `agent-${i}`,
          type: 'worker',
          name: `Test Agent ${i}`,
          capabilities: ['python']
        };

        const agentSpawnedHandler = mockOrchestrator.on.mock.calls.find(
          call => call[0] === 'agent:spawned'
        )![1];
        agentSpawnedHandler(agentData);
      }

      const events = coordinator.getRecentEvents(2000);
      expect(events).toHaveLength(1000);
    });
  });
});