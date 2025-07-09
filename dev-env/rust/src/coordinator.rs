//! Core SwarmCoordinator implementation
//!
//! The central hub for managing distributed agents, orchestrating tasks,
//! and coordinating real-time communication in a WebAssembly environment.

use crate::*;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct SwarmStatus {
    pub active_agents: usize,
    pub pending_tasks: usize,
    pub completed_tasks: usize,
    pub total_messages: usize,
    pub uptime: DateTime<Utc>,
    pub memory_usage: usize,
}

pub struct SwarmCoordinator {
    max_agents: usize,
    agents: HashMap<Uuid, Agent>,
    task_queue: TaskQueue,
    message_bus: MessageBus,
    memory_store: MemoryStore,
    start_time: DateTime<Utc>,
    message_counter: usize,
}

impl SwarmCoordinator {
    pub fn new(max_agents: usize) -> Self {
        console_log!(
            "Initializing SwarmCoordinator with max_agents: {}",
            max_agents
        );

        SwarmCoordinator {
            max_agents,
            agents: HashMap::new(),
            task_queue: TaskQueue::new(),
            message_bus: MessageBus::new(),
            memory_store: MemoryStore::new(),
            start_time: Utc::now(),
            message_counter: 0,
        }
    }

    pub fn spawn_agent(
        &mut self,
        agent_type: AgentType,
        name: String,
        capabilities: Vec<String>,
    ) -> Result<Uuid, CoordinatorError> {
        if self.agents.len() >= self.max_agents {
            return Err(CoordinatorError::MaxAgentsReached);
        }

        let agent_id = Uuid::new_v4();
        let agent = Agent::new(agent_id, agent_type, name.clone(), capabilities);

        self.agents.insert(agent_id, agent);

        // Notify other agents about new agent
        let message = Message::new(
            MessageType::AgentJoined,
            format!("Agent {} ({}) joined the swarm", name, agent_id),
            None,
            Some(agent_id),
        );
        self.message_bus.broadcast(message);

        console_log!("Agent spawned: {} ({})", name, agent_id);
        Ok(agent_id)
    }

    pub fn create_task(&mut self, name: String, priority: u8, dependencies: Vec<Uuid>) -> Uuid {
        let task_id = self
            .task_queue
            .create_task(name.clone(), priority, dependencies);

        // Notify agents about new task
        let message = Message::new(
            MessageType::TaskCreated,
            format!("Task created: {} ({})", name, task_id),
            None,
            None,
        );
        self.message_bus.broadcast(message);

        console_log!("Task created: {} ({})", name, task_id);
        task_id
    }

    pub fn assign_task(&mut self, task_id: Uuid, agent_id: Uuid) -> Result<(), CoordinatorError> {
        if !self.agents.contains_key(&agent_id) {
            return Err(CoordinatorError::AgentNotFound);
        }

        self.task_queue.assign_task(task_id, agent_id)?;

        // Update agent status
        if let Some(agent) = self.agents.get_mut(&agent_id) {
            agent.assign_task(task_id);
        }

        // Notify about task assignment
        let message = Message::new(
            MessageType::TaskAssigned,
            format!("Task {} assigned to agent {}", task_id, agent_id),
            Some(agent_id),
            None,
        );
        self.message_bus.send(message);

        console_log!("Task {} assigned to agent {}", task_id, agent_id);
        Ok(())
    }

    pub fn update_task_status(&mut self, task_id: Uuid, status: TaskStatus) {
        let status_clone = status.clone();
        self.task_queue.update_task_status(task_id, status);

        // Update agent status if task is completed
        if matches!(status_clone, TaskStatus::Completed | TaskStatus::Failed) {
            for agent in self.agents.values_mut() {
                agent.complete_task(task_id);
            }
        }

        // Notify about status update
        let message = Message::new(
            MessageType::TaskStatusUpdate,
            format!("Task {} status updated to {:?}", task_id, status_clone),
            None,
            None,
        );
        self.message_bus.broadcast(message);

        console_log!("Task {} status updated to {:?}", task_id, status_clone);
    }

    pub fn process_messages(&mut self) -> Vec<Message> {
        let messages = self.message_bus.get_messages();
        self.message_counter += messages.len();

        // Process coordination logic based on messages
        for message in &messages {
            match message.message_type {
                MessageType::AgentJoined => {
                    // Assign pending tasks to new agents
                    self.auto_assign_tasks();
                }
                MessageType::TaskCompleted => {
                    // Check for dependent tasks that can now be started
                    self.process_task_dependencies();
                }
                MessageType::AgentHeartbeat => {
                    // Update agent last seen time
                    if let Some(agent_id) = message.target_agent {
                        if let Some(agent) = self.agents.get_mut(&agent_id) {
                            agent.update_last_seen();
                        }
                    }
                }
                _ => {}
            }
        }

        messages
    }

    pub fn get_swarm_status(&self) -> SwarmStatus {
        let active_agents = self
            .agents
            .values()
            .filter(|agent| agent.status == AgentStatus::Active)
            .count();

        let task_stats = self.task_queue.get_stats();

        SwarmStatus {
            active_agents,
            pending_tasks: task_stats.pending,
            completed_tasks: task_stats.completed,
            total_messages: self.message_counter,
            uptime: self.start_time,
            memory_usage: self.memory_store.get_memory_usage(),
        }
    }

    pub fn store_memory(&mut self, key: String, value: String) {
        self.memory_store.store(key, value);
    }

    pub fn retrieve_memory(&self, key: &str) -> Option<String> {
        self.memory_store.retrieve(key)
    }

    pub fn get_agent_by_id(&self, agent_id: &Uuid) -> Option<&Agent> {
        self.agents.get(agent_id)
    }

    pub fn get_available_agents(&self) -> Vec<&Agent> {
        self.agents
            .values()
            .filter(|agent| agent.status == AgentStatus::Active && agent.current_task.is_none())
            .collect()
    }

    // Private helper methods
    fn auto_assign_tasks(&mut self) {
        let available_agents: Vec<Uuid> = self
            .agents
            .iter()
            .filter(|(_, agent)| {
                agent.status == AgentStatus::Active && agent.current_task.is_none()
            })
            .map(|(id, _)| *id)
            .collect();

        let pending_task_ids: Vec<Uuid> = self
            .task_queue
            .get_pending_tasks()
            .into_iter()
            .map(|(id, _)| id)
            .collect();

        for (i, task_id) in pending_task_ids.iter().enumerate() {
            if let Some(agent_id) = available_agents.get(i) {
                let _ = self.assign_task(*task_id, *agent_id);
            }
        }
    }

    fn process_task_dependencies(&mut self) {
        let completed_task_ids: std::collections::HashSet<Uuid> = self
            .task_queue
            .get_completed_tasks()
            .into_iter()
            .map(|(id, _)| id)
            .collect();

        let pending_task_data: Vec<(Uuid, Vec<Uuid>)> = self
            .task_queue
            .get_pending_tasks()
            .into_iter()
            .map(|(id, task)| (id, task.dependencies.clone()))
            .collect();

        for (task_id, dependencies) in pending_task_data {
            let dependencies_met = dependencies
                .iter()
                .all(|dep_id| completed_task_ids.contains(dep_id));

            if dependencies_met {
                // Mark task as ready for assignment
                self.task_queue.mark_task_ready(task_id);

                // Try to auto-assign if agents are available
                if let Some(agent_id) = self.get_available_agents().first().map(|a| a.id) {
                    let _ = self.assign_task(task_id, agent_id);
                }
            }
        }
    }
}

// Performance monitoring and health checks
impl SwarmCoordinator {
    pub fn get_performance_metrics(&self) -> HashMap<String, f64> {
        let mut metrics = HashMap::new();

        // Agent utilization
        let active_agents = self
            .agents
            .values()
            .filter(|agent| agent.status == AgentStatus::Active)
            .count() as f64;
        let busy_agents = self
            .agents
            .values()
            .filter(|agent| agent.current_task.is_some())
            .count() as f64;

        metrics.insert(
            "agent_utilization".to_string(),
            if active_agents > 0.0 {
                busy_agents / active_agents
            } else {
                0.0
            },
        );

        // Task completion rate
        let task_stats = self.task_queue.get_stats();
        let total_tasks = task_stats.pending + task_stats.completed + task_stats.failed;
        metrics.insert(
            "task_completion_rate".to_string(),
            if total_tasks > 0 {
                task_stats.completed as f64 / total_tasks as f64
            } else {
                0.0
            },
        );

        // Message throughput
        let uptime_seconds = (Utc::now() - self.start_time).num_seconds() as f64;
        metrics.insert(
            "message_throughput".to_string(),
            if uptime_seconds > 0.0 {
                self.message_counter as f64 / uptime_seconds
            } else {
                0.0
            },
        );

        metrics
    }

    pub fn health_check(&self) -> bool {
        // Check if coordinator is healthy
        let has_active_agents = self
            .agents
            .values()
            .any(|agent| agent.status == AgentStatus::Active);

        let task_queue_healthy = self.task_queue.health_check();
        let message_bus_healthy = self.message_bus.health_check();
        let memory_store_healthy = self.memory_store.health_check();

        has_active_agents && task_queue_healthy && message_bus_healthy && memory_store_healthy
    }
}
