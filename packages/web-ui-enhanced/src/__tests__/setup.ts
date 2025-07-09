// Jest setup file for web-ui-enhanced tests

import '@testing-library/jest-dom';

// Mock WebGL context for Three.js
const mockWebGLContext = {
  canvas: {},
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
  getExtension: jest.fn(),
  getParameter: jest.fn(),
  createProgram: jest.fn(),
  createShader: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn(),
  getShaderParameter: jest.fn(),
  deleteShader: jest.fn(),
  deleteProgram: jest.fn(),
  createBuffer: jest.fn(),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  createTexture: jest.fn(),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  generateMipmap: jest.fn(),
  activeTexture: jest.fn(),
  useProgram: jest.fn(),
  getAttribLocation: jest.fn(),
  getUniformLocation: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  uniform1i: jest.fn(),
  uniform1f: jest.fn(),
  uniform2f: jest.fn(),
  uniform3f: jest.fn(),
  uniform4f: jest.fn(),
  uniformMatrix4fv: jest.fn(),
  drawArrays: jest.fn(),
  drawElements: jest.fn(),
  clear: jest.fn(),
  clearColor: jest.fn(),
  clearDepth: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  depthFunc: jest.fn(),
  blendFunc: jest.fn(),
  viewport: jest.fn()
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext;
  }
  if (contextType === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      drawImage: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn()
    };
  }
  return null;
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16); // ~60fps
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock performance.now
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Global test utilities
(global as any).createMockSwarmStatus = () => ({
  activeAgents: 5,
  totalTasks: 20,
  completedTasks: 15,
  failedTasks: 1,
  averageResponseTime: 250,
  resourceUtilization: 65,
  uptime: 3600000,
  coordinatorId: 'coord-123'
});

(global as any).createMockAgent = (overrides = {}) => ({
  agentId: 'agent-1',
  name: 'Test Agent',
  type: 'specialist',
  status: 'active',
  capabilities: ['python'],
  currentLoad: 30,
  ...overrides
});

(global as any).createMockTask = (overrides = {}) => ({
  taskId: 'task-1',
  name: 'Test Task',
  type: 'test',
  status: 'pending',
  priority: 3,
  assignedAgent: null,
  progress: 0,
  estimatedDuration: 300,
  actualDuration: null,
  ...overrides
});

(global as any).createMockEvent = (overrides = {}) => ({
  eventId: 'event-1',
  type: 'task_created',
  timestamp: Date.now(),
  data: {
    taskId: 'task-1',
    name: 'Test Task'
  },
  ...overrides
});

// Suppress Three.js warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    args[0].includes('THREE')
  ) {
    return;
  }
  originalWarn(...args);
};

// Set up environment variables for tests
process.env.NODE_ENV = 'test';

// Set test timeout
jest.setTimeout(30000);