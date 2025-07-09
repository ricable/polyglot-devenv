// Mock WASM module for testing

const mockWasmCoordinator = {
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

const wasmModule = {
  default: jest.fn().mockResolvedValue(undefined),
  WasmSwarmCoordinator: jest.fn().mockImplementation(() => mockWasmCoordinator)
};

module.exports = wasmModule;