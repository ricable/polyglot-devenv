// Jest setup file for devpod-enhanced package
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn()
}));

// Mock util
jest.mock('util', () => ({
  promisify: jest.fn()
}));

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  }
}));

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn()
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn()
  }
}));

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

// Mock external packages
jest.mock('@swarm-flow/coordination-enhanced', () => ({
  IntelligentOrchestrator: jest.fn().mockImplementation(() => ({
    shutdown: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('@swarm-flow/ai-enhanced', () => ({
  ResourcePredictor: jest.fn().mockImplementation(() => ({
    predictResourceNeeds: jest.fn().mockResolvedValue({
      cpu: 4,
      memory: 8,
      disk: 50
    }),
    predictScalingNeeds: jest.fn().mockResolvedValue({
      recommendations: []
    })
  })),
  CostOptimizer: jest.fn().mockImplementation(() => ({
    optimizeResources: jest.fn().mockResolvedValue({
      recommendations: [],
      totalSavings: 0,
      implementationOrder: [],
      monitoringPlan: []
    })
  }))
}));

// Global test utilities
global.createMockDevPodResource = (overrides = {}) => ({
  workspaceId: 'test-workspace-123',
  name: 'Test Workspace',
  environment: 'python',
  status: 'running',
  cpuUsage: 50,
  memoryUsage: 8,
  diskUsage: 20,
  networkUsage: 2,
  uptime: 3600,
  lastAccessed: '2024-01-01T10:00:00Z',
  cost: 3.0,
  ...overrides
});

global.createMockOptimizationConfig = (overrides = {}) => ({
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
  },
  ...overrides
});

global.createMockWorkspaceStatus = (overrides = {}) => ({
  status: 'running',
  resources: {
    cpu: 4,
    memory: 8,
    disk: 50,
    network: 2
  },
  uptime: 3600,
  lastAccessed: '2024-01-01T10:00:00Z',
  ...overrides
});

global.createMockOptimizationPlan = (overrides = {}) => ({
  planId: 'test-plan-123',
  recommendations: [
    {
      workspaceId: 'ws1',
      action: 'shutdown',
      reason: 'Low utilization',
      expectedSavings: 10,
      riskLevel: 'low',
      implementationTime: 60
    }
  ],
  totalSavings: 10,
  implementationOrder: ['ws1'],
  monitoringPlan: ['Monitor CPU usage'],
  ...overrides
});

// Mock timers for testing
global.mockTimers = () => {
  jest.useFakeTimers();
};

global.restoreTimers = () => {
  jest.useRealTimers();
};

// Test timeout
jest.setTimeout(30000);