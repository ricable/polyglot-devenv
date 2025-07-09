/**
 * Enhanced Coordination System
 * Building on existing production-ready claude-flow coordination with WASM and AI enhancements
 */

export { IntelligentOrchestrator, createIntelligentOrchestrator } from './intelligent-orchestration.js';
export { SwarmCoordinator } from './swarm-coordinator.js';
export { ResourceManager } from './resource-manager.js';
export { ConflictResolver } from './conflict-resolution.js';

export type {
  SwarmMetrics,
  OptimizationResult,
  ResourcePrediction,
  CoordinationConfig
} from './intelligent-orchestration.js';

export type {
  SwarmStatus,
  AgentInfo,
  TaskInfo,
  CoordinationEvent
} from './swarm-coordinator.js';

export type {
  ResourceAllocation,
  ResourceConstraints,
  ResourceUsage
} from './resource-manager.js';

export type {
  ConflictType,
  ConflictResolution,
  ConflictStrategy
} from './conflict-resolution.js';

// Re-export legacy claude-flow types for backward compatibility
export type { Agent, Task, SwarmConfig } from '../../../claude-flow/src/coordination/types.js';