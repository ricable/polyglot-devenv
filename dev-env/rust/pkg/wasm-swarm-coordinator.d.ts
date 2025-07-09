/* tslint:disable */
/* eslint-disable */
/**
 * WebAssembly-compiled Swarm Coordinator
 * 
 * A high-performance distributed agent management system compiled to WebAssembly
 * for browser-based swarm coordination and real-time task orchestration.
 */

export class WasmSwarmCoordinator {
  constructor(max_agents: number);
  spawn_agent(agent_type: string, name: string, capabilities: string): string;
  create_task(name: string, priority: number, dependencies: string): string;
  assign_task(task_id: string, agent_id: string): boolean;
  get_swarm_status(): string;
  process_messages(): string;
  update_task_status(task_id: string, status: string): boolean;
  store_memory(key: string, value: string): boolean;
  retrieve_memory(key: string): string;
}

export interface SwarmStatus {
  active_agents: number;
  pending_tasks: number;
  completed_tasks: number;
  total_messages: number;
  uptime: string;
  memory_usage: number;
}

export interface Message {
  id: string;
  message_type: string;
  priority: number;
  content: string;
  sender_agent?: string;
  target_agent?: string;
  timestamp: string;
}

export type AgentType = 'coordinator' | 'researcher' | 'coder' | 'analyst' | 'tester';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
