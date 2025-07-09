// Jest setup for coordination-enhanced package

// Global test timeout
jest.setTimeout(30000);

// Mock Node.js timer functions
global.setInterval = jest.fn((callback, delay) => {
  const id = Math.random();
  // Don't actually set interval in tests
  return id;
});

global.clearInterval = jest.fn();

// Mock UUID generation for predictable test results
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))
}));

// Module mocks are handled by moduleNameMapper in jest.config.js