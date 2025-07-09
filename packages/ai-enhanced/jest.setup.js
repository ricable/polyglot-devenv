// Jest setup file
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock TensorFlow.js to prevent actual model loading during tests
jest.mock('@tensorflow/tfjs-node', () => ({
  sequential: jest.fn(() => ({
    add: jest.fn(),
    compile: jest.fn(),
    fit: jest.fn(),
    predict: jest.fn(),
    save: jest.fn()
  })),
  layers: {
    dense: jest.fn(),
    dropout: jest.fn()
  },
  train: {
    adam: jest.fn()
  },
  tensor2d: jest.fn(() => ({
    data: jest.fn(),
    dispose: jest.fn()
  })),
  loadLayersModel: jest.fn()
}));

// Mock natural language processing library
jest.mock('natural', () => ({
  WordTokenizer: jest.fn(() => ({
    tokenize: jest.fn((text) => text.split(' '))
  })),
  SentimentAnalyzer: {
    getSentiment: jest.fn(() => 0.5)
  }
}));

// Mock moment.js
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return {
    __esModule: true,
    default: jest.fn(() => ({
      hour: jest.fn(() => 12),
      day: jest.fn(() => 3),
      format: jest.fn(() => '2024-01-01T12:00:00Z')
    })),
    ...actualMoment
  };
});

// Global test utilities
global.createMockAgent = (overrides = {}) => ({
  id: 'test-agent',
  capabilities: ['python', 'testing'],
  currentLoad: 50,
  performance: 85,
  type: 'specialist',
  ...overrides
});

global.createMockTask = (overrides = {}) => ({
  description: 'test task',
  context: 'test context',
  constraints: [],
  ...overrides
});

// Test timeout
jest.setTimeout(30000);