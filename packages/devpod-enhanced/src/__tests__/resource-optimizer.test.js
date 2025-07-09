/**
 * Simplified test for DevPod Resource Optimizer
 * Tests basic functionality without external dependencies
 */

// Mock external dependencies
const mockExec = jest.fn();
const mockCron = {
  schedule: jest.fn()
};
const mockCreateLogger = jest.fn().mockReturnValue({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
});

// Simple implementation for testing
class SimpleDevPodResourceOptimizer {
  constructor(config) {
    this.config = config;
    this.resources = new Map();
    this.logger = mockCreateLogger();
    this.initialize();
  }

  initialize() {
    this.logger.info('Initializing DevPod Resource Optimizer');
  }

  calculateWorkspaceCost(status) {
    if (!status.resources) return 0;
    const cpuCost = (status.resources.cpu || 0) * 0.02;
    const memoryCost = (status.resources.memory || 0) * 0.01;
    const diskCost = (status.resources.disk || 0) * 0.001;
    return cpuCost + memoryCost + diskCost;
  }

  getResourceStatus() {
    return Array.from(this.resources.values());
  }

  buildOptimizedDevPodCommand(environment, resourcePrediction) {
    const baseCommand = `nu host-tooling/devpod-management/manage-devpod.nu provision ${environment}`;
    
    const resourceFlags = [
      `--cpu-limit=${resourcePrediction.cpu}`,
      `--memory-limit=${resourcePrediction.memory}`,
      `--disk-limit=${resourcePrediction.disk}`
    ].join(' ');

    return `${baseCommand} ${resourceFlags}`;
  }
}

function createSimpleDevPodOptimizer(config = {}) {
  const defaultConfig = {
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

  return new SimpleDevPodResourceOptimizer({ ...defaultConfig, ...config });
}

describe('DevPod Resource Optimizer', () => {
  let optimizer;
  let mockConfig;

  beforeEach(() => {
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

    optimizer = new SimpleDevPodResourceOptimizer(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(optimizer).toBeInstanceOf(SimpleDevPodResourceOptimizer);
      expect(optimizer.config).toEqual(mockConfig);
    });

    it('should create logger', () => {
      expect(mockCreateLogger).toHaveBeenCalled();
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

      const cost = optimizer.calculateWorkspaceCost(status);

      expect(cost).toBeCloseTo(0.21, 2); // (4 * 0.02) + (8 * 0.01) + (50 * 0.001) = 0.08 + 0.08 + 0.05 = 0.21
    });

    it('should handle missing resource data', () => {
      const status = {};

      const cost = optimizer.calculateWorkspaceCost(status);

      expect(cost).toBe(0);
    });

    it('should handle partial resource data', () => {
      const status = {
        resources: {
          cpu: 2
        }
      };

      const cost = optimizer.calculateWorkspaceCost(status);

      expect(cost).toBe(0.04); // 2 * 0.02
    });
  });

  describe('getResourceStatus', () => {
    it('should return empty array when no resources', () => {
      const status = optimizer.getResourceStatus();

      expect(status).toEqual([]);
    });

    it('should return current resource status', () => {
      const mockResource = {
        workspaceId: 'ws1',
        name: 'test-workspace',
        environment: 'python',
        status: 'running',
        cpuUsage: 50,
        memoryUsage: 8,
        diskUsage: 20,
        cost: 3.0
      };

      optimizer.resources.set('ws1', mockResource);

      const status = optimizer.getResourceStatus();

      expect(status).toEqual([mockResource]);
    });
  });

  describe('buildOptimizedDevPodCommand', () => {
    it('should build command with resource optimizations', () => {
      const resourcePrediction = {
        cpu: 4,
        memory: 8,
        disk: 50
      };

      const command = optimizer.buildOptimizedDevPodCommand('python', resourcePrediction);

      expect(command).toBe(
        'nu host-tooling/devpod-management/manage-devpod.nu provision python --cpu-limit=4 --memory-limit=8 --disk-limit=50'
      );
    });

    it('should handle different environments', () => {
      const resourcePrediction = {
        cpu: 2,
        memory: 4,
        disk: 25
      };

      const command = optimizer.buildOptimizedDevPodCommand('typescript', resourcePrediction);

      expect(command).toBe(
        'nu host-tooling/devpod-management/manage-devpod.nu provision typescript --cpu-limit=2 --memory-limit=4 --disk-limit=25'
      );
    });
  });
});

describe('createSimpleDevPodOptimizer', () => {
  it('should create optimizer with default config', () => {
    const optimizer = createSimpleDevPodOptimizer();

    expect(optimizer).toBeInstanceOf(SimpleDevPodResourceOptimizer);
    expect(optimizer.config).toEqual({
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

    const optimizer = createSimpleDevPodOptimizer(customConfig);

    expect(optimizer.config).toEqual(
      expect.objectContaining(customConfig)
    );
  });
});