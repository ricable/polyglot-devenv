import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import cron from 'node-cron';
import { createLogger } from 'winston';
import {
  DevPodResourceOptimizer,
  createDevPodOptimizer,
  DevPodResource,
  ResourceOptimizationPlan,
  IntelligentProvisioningConfig
} from '../resource-optimizer';
import { IntelligentOrchestrator } from '@swarm-flow/coordination-enhanced';
import { ResourcePredictor, CostOptimizer } from '@swarm-flow/ai-enhanced';

// Mock dependencies
jest.mock('child_process');
jest.mock('util');
jest.mock('node-cron');
jest.mock('winston');
jest.mock('@swarm-flow/coordination-enhanced');
jest.mock('@swarm-flow/ai-enhanced');

const mockExec = exec as jest.MockedFunction<typeof exec>;
const mockPromisify = promisify as unknown as jest.Mock;
const mockCron = cron as jest.Mocked<typeof cron>;
const mockCreateLogger = createLogger as jest.Mock;

describe('DevPodResourceOptimizer', () => {
  let optimizer: DevPodResourceOptimizer;
  let mockConfig: IntelligentProvisioningConfig;
  let mockOrchestrator: jest.Mocked<IntelligentOrchestrator>;
  let mockResourcePredictor: jest.Mocked<ResourcePredictor>;
  let mockCostOptimizer: jest.Mocked<CostOptimizer>;
  let mockLogger: any;
  let mockExecAsync: jest.Mock;

  beforeEach(() => {
    // Setup mocks
    mockExecAsync = jest.fn();
    mockPromisify.mockReturnValue(mockExecAsync);

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    mockCreateLogger.mockReturnValue(mockLogger);

    mockOrchestrator = {
      shutdown: jest.fn().mockResolvedValue(undefined)
    } as any;
    (IntelligentOrchestrator as jest.Mock).mockImplementation(() => mockOrchestrator);

    mockResourcePredictor = {
      predictResourceNeeds: jest.fn().mockResolvedValue({
        cpu: 4,
        memory: 8,
        disk: 50
      }),
      predictScalingNeeds: jest.fn().mockResolvedValue({
        recommendations: [
          {
            action: 'scale_up',
            workspaceId: 'ws1',
            reason: 'High predicted load',
            expectedSavings: 0,
            riskLevel: 'low',
            implementationTime: 300
          }
        ]
      })
    } as any;
    (ResourcePredictor as jest.Mock).mockImplementation(() => mockResourcePredictor);

    mockCostOptimizer = {
      optimizeResources: jest.fn().mockResolvedValue({
        recommendations: [
          {
            workspaceId: 'ws2',
            action: 'shutdown',
            reason: 'Low CPU utilization',
            expectedSavings: 10,
            riskLevel: 'low',
            implementationTime: 60
          }
        ],
        totalSavings: 10,
        implementationOrder: ['ws2'],
        monitoringPlan: ['Monitor CPU usage']
      })
    } as any;
    (CostOptimizer as jest.Mock).mockImplementation(() => mockCostOptimizer);

    mockCron.schedule = jest.fn();

    mockConfig = {
      maxConcurrentWorkspaces: 15,
      maxWorkspacesPerEnvironment: 5,
      autoShutdownAfterMinutes: 60,
      enablePredictiveScaling: true,
      enableCostOptimization: true,
      enableUsageAnalytics: true,
      resourceLimits: {
        cpu: 16,
        memory: 32,
        disk: 100
      }
    };

    optimizer = new DevPodResourceOptimizer(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(optimizer).toBeInstanceOf(DevPodResourceOptimizer);
      expect(IntelligentOrchestrator).toHaveBeenCalledWith({
        maxAgents: 25,
        enableAIOptimization: true,
        enablePredictiveScaling: true,
        metricsInterval: 30000,
        optimizationThreshold: 0.8
      });
      expect(ResourcePredictor).toHaveBeenCalled();
      expect(CostOptimizer).toHaveBeenCalled();
    });

    it('should setup monitoring and optimization schedules', () => {
      expect(mockCron.schedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
      expect(mockCron.schedule).toHaveBeenCalledWith('*/15 * * * *', expect.any(Function));
    });
  });

  describe('collectResourceMetrics', () => {
    it('should collect and store resource metrics', async () => {
      const mockWorkspaces = [
        { id: 'ws1', name: 'test-workspace', environment: 'python' }
      ];
      
      const mockStatus = {
        status: 'running',
        resources: { cpu: 2, memory: 4, disk: 20, network: 1 },
        uptime: 3600,
        lastAccessed: '2024-01-01T10:00:00Z'
      };

      mockExecAsync
        .mockResolvedValueOnce({ stdout: JSON.stringify(mockWorkspaces) })
        .mockResolvedValueOnce({ stdout: JSON.stringify(mockStatus) });

      const metricsPromise = new Promise<DevPodResource[]>((resolve) => {
        optimizer.on('metrics:collected', (resources: DevPodResource[]) => {
          resolve(resources);
        });
      });

      await optimizer['collectResourceMetrics']();

      const resources = await metricsPromise;
      expect(resources).toHaveLength(1);
      expect(resources[0]).toEqual(
        expect.objectContaining({
          workspaceId: 'ws1',
          name: 'test-workspace',
          environment: 'python',
          status: 'running',
          cpuUsage: 2,
          memoryUsage: 4,
          diskUsage: 20,
          networkUsage: 1,
          uptime: 3600,
          lastAccessed: '2024-01-01T10:00:00Z',
          cost: expect.any(Number)
        })
      );
    });

    it('should handle errors during metrics collection', async () => {
      mockExecAsync.mockRejectedValue(new Error('DevPod command failed'));

      await optimizer['collectResourceMetrics']();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to collect resource metrics:',
        expect.any(Error)
      );
    });
  });

  describe('performOptimization', () => {
    beforeEach(() => {
      // Setup some mock resources
      const mockResource: DevPodResource = {
        workspaceId: 'ws1',
        name: 'test-workspace',
        environment: 'python',
        status: 'running',
        cpuUsage: 5,
        memoryUsage: 2,
        diskUsage: 10,
        networkUsage: 0,
        uptime: 7200,
        lastAccessed: '2024-01-01T08:00:00Z',
        cost: 2.5
      };
      
      optimizer['resources'].set('ws1', mockResource);
    });

    it('should perform optimization and return plan', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '' });

      const plan = await optimizer.performOptimization();

      expect(plan).toEqual({
        planId: expect.any(String),
        recommendations: [
          {
            workspaceId: 'ws2',
            action: 'shutdown',
            reason: 'Low CPU utilization',
            expectedSavings: 10,
            riskLevel: 'low',
            implementationTime: 60
          },
          {
            action: 'scale_up',
            workspaceId: 'ws1',
            reason: 'High predicted load',
            expectedSavings: 0,
            riskLevel: 'low',
            implementationTime: 300
          }
        ],
        totalSavings: 10,
        implementationOrder: ['ws2'],
        monitoringPlan: ['Monitor CPU usage']
      });

      expect(mockCostOptimizer.optimizeResources).toHaveBeenCalledWith({
        resources: expect.any(Array),
        constraints: expect.objectContaining({
          maxConcurrentWorkspaces: 15,
          maxWorkspacesPerEnvironment: 5,
          resourceLimits: mockConfig.resourceLimits
        })
      });

      expect(mockResourcePredictor.predictScalingNeeds).toHaveBeenCalledWith({
        currentResources: expect.any(Array),
        historicalData: [],
        timeHorizon: 24
      });
    });

    it('should auto-implement low-risk recommendations', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '' });

      const plan = await optimizer.performOptimization();

      // Should have called devpod stop for the shutdown recommendation
      expect(mockExecAsync).toHaveBeenCalledWith('devpod stop ws2');
      expect(mockLogger.info).toHaveBeenCalledWith('Shutdown workspace ws2: Low CPU utilization');
    });

    it('should handle optimization failures', async () => {
      mockCostOptimizer.optimizeResources.mockRejectedValue(new Error('Optimization failed'));

      await expect(optimizer.performOptimization()).rejects.toThrow('Optimization failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Optimization failed:', expect.any(Error));
    });
  });

  describe('checkIdleWorkspaces', () => {
    it('should shutdown idle workspaces', async () => {
      const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const idleResource: DevPodResource = {
        workspaceId: 'idle-ws',
        name: 'idle-workspace',
        environment: 'python',
        status: 'running',
        cpuUsage: 2, // Low CPU usage
        memoryUsage: 1,
        diskUsage: 5,
        networkUsage: 0,
        uptime: 7200,
        lastAccessed: oldTime.toISOString(),
        cost: 1.0
      };

      optimizer['resources'].set('idle-ws', idleResource);
      mockExecAsync.mockResolvedValue({ stdout: '' });

      await optimizer['checkIdleWorkspaces']();

      expect(mockExecAsync).toHaveBeenCalledWith('devpod stop idle-ws');
      expect(mockLogger.info).toHaveBeenCalledWith('Shutdown workspace idle-ws: auto-shutdown due to inactivity');
    });

    it('should not shutdown active workspaces', async () => {
      const activeResource: DevPodResource = {
        workspaceId: 'active-ws',
        name: 'active-workspace',
        environment: 'python',
        status: 'running',
        cpuUsage: 80, // High CPU usage
        memoryUsage: 16,
        diskUsage: 30,
        networkUsage: 5,
        uptime: 3600,
        lastAccessed: new Date().toISOString(),
        cost: 5.0
      };

      optimizer['resources'].set('active-ws', activeResource);

      await optimizer['checkIdleWorkspaces']();

      expect(mockExecAsync).not.toHaveBeenCalledWith('devpod stop active-ws');
    });
  });

  describe('provisionIntelligentWorkspace', () => {
    it('should provision workspace with intelligent resource allocation', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'Workspace created successfully' });

      const workspaceId = await optimizer.provisionIntelligentWorkspace('python', {
        predictiveScaling: true,
        costOptimization: true,
        autoShutdown: true
      });

      expect(workspaceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(mockResourcePredictor.predictResourceNeeds).toHaveBeenCalledWith({
        environment: 'python',
        workloadType: 'development',
        timeHorizon: 8
      });

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('nu host-tooling/devpod-management/manage-devpod.nu provision python')
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('--cpu-limit=4 --memory-limit=8 --disk-limit=50')
      );
    });

    it('should check resource limits before provisioning', async () => {
      // Fill up to max workspaces
      for (let i = 0; i < mockConfig.maxConcurrentWorkspaces; i++) {
        const resource: DevPodResource = {
          workspaceId: `ws-${i}`,
          name: `workspace-${i}`,
          environment: 'python',
          status: 'running',
          cpuUsage: 10,
          memoryUsage: 2,
          diskUsage: 5,
          networkUsage: 0,
          uptime: 3600,
          lastAccessed: new Date().toISOString(),
          cost: 1.0
        };
        optimizer['resources'].set(`ws-${i}`, resource);
      }

      await expect(
        optimizer.provisionIntelligentWorkspace('python')
      ).rejects.toThrow('Maximum concurrent workspaces (15) reached');
    });

    it('should check environment-specific limits', async () => {
      // Fill up to max workspaces per environment
      for (let i = 0; i < mockConfig.maxWorkspacesPerEnvironment; i++) {
        const resource: DevPodResource = {
          workspaceId: `python-ws-${i}`,
          name: `python-workspace-${i}`,
          environment: 'python',
          status: 'running',
          cpuUsage: 10,
          memoryUsage: 2,
          diskUsage: 5,
          networkUsage: 0,
          uptime: 3600,
          lastAccessed: new Date().toISOString(),
          cost: 1.0
        };
        optimizer['resources'].set(`python-ws-${i}`, resource);
      }

      await expect(
        optimizer.provisionIntelligentWorkspace('python')
      ).rejects.toThrow('Maximum workspaces for python (5) reached');
    });

    it('should handle provisioning failures', async () => {
      mockExecAsync.mockRejectedValue(new Error('DevPod provisioning failed'));

      await expect(
        optimizer.provisionIntelligentWorkspace('python')
      ).rejects.toThrow('DevPod provisioning failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to provision workspace for python:',
        expect.any(Error)
      );
    });
  });

  describe('resource management operations', () => {
    beforeEach(() => {
      mockExecAsync.mockResolvedValue({ stdout: '' });
    });

    it('should shutdown workspace', async () => {
      await optimizer['shutdownWorkspace']('ws1', 'test shutdown');

      expect(mockExecAsync).toHaveBeenCalledWith('devpod stop ws1');
      expect(mockLogger.info).toHaveBeenCalledWith('Shutdown workspace ws1: test shutdown');
    });

    it('should handle shutdown failures', async () => {
      mockExecAsync.mockRejectedValue(new Error('Shutdown failed'));

      await expect(
        optimizer['shutdownWorkspace']('ws1', 'test shutdown')
      ).rejects.toThrow('Shutdown failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to shutdown workspace ws1:',
        expect.any(Error)
      );
    });

    it('should scale workspace up', async () => {
      await optimizer['scaleWorkspace']('ws1', 'up');

      expect(mockLogger.info).toHaveBeenCalledWith('Scaling workspace ws1 up');
    });

    it('should scale workspace down', async () => {
      await optimizer['scaleWorkspace']('ws1', 'down');

      expect(mockLogger.info).toHaveBeenCalledWith('Scaling workspace ws1 down');
    });

    it('should migrate workspace', async () => {
      await optimizer['migrateWorkspace']('ws1', 'typescript');

      expect(mockLogger.info).toHaveBeenCalledWith('Migrating workspace ws1 to typescript');
    });

    it('should consolidate workspaces', async () => {
      await optimizer['consolidateWorkspaces'](['ws1', 'ws2']);

      expect(mockLogger.info).toHaveBeenCalledWith('Consolidating workspaces: ws1, ws2');
    });
  });

  describe('getResourceStatus', () => {
    it('should return current resource status', () => {
      const mockResource: DevPodResource = {
        workspaceId: 'ws1',
        name: 'test-workspace',
        environment: 'python',
        status: 'running',
        cpuUsage: 50,
        memoryUsage: 8,
        diskUsage: 20,
        networkUsage: 2,
        uptime: 3600,
        lastAccessed: '2024-01-01T10:00:00Z',
        cost: 3.0
      };

      optimizer['resources'].set('ws1', mockResource);

      const status = optimizer.getResourceStatus();

      expect(status).toEqual([mockResource]);
    });
  });

  describe('shutdown', () => {
    it('should shutdown optimizer and clear intervals', async () => {
      const shutdownSpy = jest.fn();
      optimizer.on('optimizer:shutdown', shutdownSpy);

      await optimizer.shutdown();

      expect(mockOrchestrator.shutdown).toHaveBeenCalled();
      expect(shutdownSpy).toHaveBeenCalled();
    });
  });

  describe('calculateWorkspaceCost', () => {
    it('should calculate cost based on resource usage', () => {
      const status = {
        resources: {
          cpu: 4,
          memory: 8,
          disk: 50
        }
      };

      const cost = optimizer['calculateWorkspaceCost'](status);

      expect(cost).toBe(0.139); // (4 * 0.02) + (8 * 0.01) + (50 * 0.001)
    });

    it('should handle missing resource data', () => {
      const status = {};

      const cost = optimizer['calculateWorkspaceCost'](status);

      expect(cost).toBe(0);
    });
  });

  describe('buildOptimizedDevPodCommand', () => {
    it('should build command with resource optimizations', () => {
      const resourcePrediction = {
        cpu: 4,
        memory: 8,
        disk: 50
      };

      const command = optimizer['buildOptimizedDevPodCommand']('python', resourcePrediction);

      expect(command).toBe(
        'nu host-tooling/devpod-management/manage-devpod.nu provision python --cpu-limit=4 --memory-limit=8 --disk-limit=50'
      );
    });
  });

  describe('event emission', () => {
    it('should emit optimizer:initialized event', () => {
      const initSpy = jest.fn();
      const newOptimizer = new DevPodResourceOptimizer(mockConfig);
      newOptimizer.on('optimizer:initialized', initSpy);

      expect(initSpy).toHaveBeenCalled();
    });

    it('should emit workspace:provisioned event', async () => {
      const provisionSpy = jest.fn();
      optimizer.on('workspace:provisioned', provisionSpy);

      mockExecAsync.mockResolvedValue({ stdout: 'Success' });

      await optimizer.provisionIntelligentWorkspace('python', {
        predictiveScaling: true
      });

      expect(provisionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: expect.any(String),
          environment: 'python',
          options: { predictiveScaling: true }
        })
      );
    });

    it('should emit workspace:shutdown event', async () => {
      const shutdownSpy = jest.fn();
      optimizer.on('workspace:shutdown', shutdownSpy);

      await optimizer['shutdownWorkspace']('ws1', 'test reason');

      expect(shutdownSpy).toHaveBeenCalledWith({
        workspaceId: 'ws1',
        reason: 'test reason'
      });
    });

    it('should emit optimization:completed event', async () => {
      const optimizationSpy = jest.fn();
      optimizer.on('optimization:completed', optimizationSpy);

      mockExecAsync.mockResolvedValue({ stdout: '' });

      await optimizer.performOptimization();

      expect(optimizationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: expect.any(String),
          recommendations: expect.any(Array),
          totalSavings: expect.any(Number)
        })
      );
    });
  });
});

describe('createDevPodOptimizer', () => {
  it('should create optimizer with default config', () => {
    const optimizer = createDevPodOptimizer();

    expect(optimizer).toBeInstanceOf(DevPodResourceOptimizer);
    expect(optimizer['config']).toEqual({
      maxConcurrentWorkspaces: 15,
      maxWorkspacesPerEnvironment: 5,
      autoShutdownAfterMinutes: 60,
      enablePredictiveScaling: true,
      enableCostOptimization: true,
      enableUsageAnalytics: true,
      resourceLimits: {
        cpu: 16,
        memory: 32,
        disk: 100
      }
    });
  });

  it('should create optimizer with custom config', () => {
    const customConfig = {
      maxConcurrentWorkspaces: 20,
      autoShutdownAfterMinutes: 90,
      enablePredictiveScaling: false
    };

    const optimizer = createDevPodOptimizer(customConfig);

    expect(optimizer['config']).toEqual(
      expect.objectContaining(customConfig)
    );
  });
});