module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@swarm-flow/coordination-enhanced': '<rootDir>/src/__mocks__/@swarm-flow/coordination-enhanced.ts',
    '@swarm-flow/ai-enhanced': '<rootDir>/src/__mocks__/@swarm-flow/ai-enhanced.ts'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  verbose: true,
  testTimeout: 30000,
  globals: {
    'ts-jest': {
      useESM: false
    }
  }
};