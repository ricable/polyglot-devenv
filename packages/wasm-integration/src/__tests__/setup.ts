// Jest setup file for wasm-integration tests

// Mock global WASM environment
(global as any).WebAssembly = {
  instantiate: jest.fn(),
  compile: jest.fn(),
  Module: jest.fn()
};

// Mock performance.now for consistent timing in tests
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(Date.now())
  }
});

// Global test utilities
(global as any).createMockWasmInstance = () => ({
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
});

// Mock timer functions for consistent behavior
jest.setTimeout(30000);

// Set up environment variables for tests
process.env.NODE_ENV = 'test';