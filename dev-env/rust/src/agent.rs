//! Agent management and lifecycle
//!
//! Defines agent types, capabilities, and state management for distributed
//! execution in the WebAssembly swarm coordinator.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AgentType {
    Coordinator,
    Researcher,
    Coder,
    Analyst,
    Tester,
    Reviewer,
    Architect,
    Optimizer,
    Specialist,
    Monitor,
    Documenter,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AgentStatus {
    Active,
    Busy,
    Idle,
    Offline,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: Uuid,
    pub agent_type: AgentType,
    pub name: String,
    pub capabilities: Vec<String>,
    pub status: AgentStatus,
    pub current_task: Option<Uuid>,
    pub completed_tasks: Vec<Uuid>,
    pub created_at: DateTime<Utc>,
    pub last_seen: DateTime<Utc>,
    pub metrics: AgentMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetrics {
    pub tasks_completed: usize,
    pub tasks_failed: usize,
    pub average_task_duration: f64,
    pub total_processing_time: f64,
    pub error_count: usize,
    pub last_error: Option<String>,
}

impl Default for AgentMetrics {
    fn default() -> Self {
        AgentMetrics {
            tasks_completed: 0,
            tasks_failed: 0,
            average_task_duration: 0.0,
            total_processing_time: 0.0,
            error_count: 0,
            last_error: None,
        }
    }
}

impl Agent {
    pub fn new(id: Uuid, agent_type: AgentType, name: String, capabilities: Vec<String>) -> Self {
        let now = Utc::now();

        Agent {
            id,
            agent_type,
            name,
            capabilities,
            status: AgentStatus::Active,
            current_task: None,
            completed_tasks: Vec::new(),
            created_at: now,
            last_seen: now,
            metrics: AgentMetrics::default(),
        }
    }

    pub fn assign_task(&mut self, task_id: Uuid) {
        self.current_task = Some(task_id);
        self.status = AgentStatus::Busy;
        self.update_last_seen();
    }

    pub fn complete_task(&mut self, task_id: Uuid) {
        if self.current_task == Some(task_id) {
            self.current_task = None;
            self.completed_tasks.push(task_id);
            self.status = AgentStatus::Active;
            self.metrics.tasks_completed += 1;
            self.update_last_seen();
        }
    }

    pub fn fail_task(&mut self, task_id: Uuid, error: String) {
        if self.current_task == Some(task_id) {
            self.current_task = None;
            self.status = AgentStatus::Error;
            self.metrics.tasks_failed += 1;
            self.metrics.error_count += 1;
            self.metrics.last_error = Some(error);
            self.update_last_seen();
        }
    }

    pub fn update_last_seen(&mut self) {
        self.last_seen = Utc::now();
    }

    pub fn is_available(&self) -> bool {
        matches!(self.status, AgentStatus::Active | AgentStatus::Idle)
            && self.current_task.is_none()
    }

    pub fn has_capability(&self, capability: &str) -> bool {
        self.capabilities.iter().any(|c| c == capability)
    }

    pub fn get_performance_score(&self) -> f64 {
        if self.metrics.tasks_completed + self.metrics.tasks_failed == 0 {
            return 0.0;
        }

        let completion_rate = self.metrics.tasks_completed as f64
            / (self.metrics.tasks_completed + self.metrics.tasks_failed) as f64;

        let error_penalty = if self.metrics.error_count > 0 {
            1.0 - (self.metrics.error_count as f64 * 0.1)
        } else {
            1.0
        };

        completion_rate * error_penalty.max(0.0)
    }

    pub fn update_metrics(&mut self, task_duration: f64) {
        self.metrics.total_processing_time += task_duration;

        if self.metrics.tasks_completed > 0 {
            self.metrics.average_task_duration =
                self.metrics.total_processing_time / self.metrics.tasks_completed as f64;
        }
    }

    pub fn get_specialization_match(&self, required_capabilities: &[String]) -> f64 {
        if required_capabilities.is_empty() {
            return 1.0;
        }

        let matches = required_capabilities
            .iter()
            .filter(|cap| self.has_capability(cap))
            .count();

        matches as f64 / required_capabilities.len() as f64
    }

    pub fn is_healthy(&self) -> bool {
        let now = Utc::now();
        let time_since_last_seen = (now - self.last_seen).num_seconds();

        // Agent is healthy if seen within last 5 minutes and not in error state
        time_since_last_seen < 300 && self.status != AgentStatus::Error
    }
}

// Agent registry for managing multiple agents
pub struct AgentRegistry {
    agents: HashMap<Uuid, Agent>,
    max_agents: usize,
}

impl AgentRegistry {
    pub fn new(max_agents: usize) -> Self {
        AgentRegistry {
            agents: HashMap::new(),
            max_agents,
        }
    }

    pub fn register_agent(&mut self, agent: Agent) -> Result<(), crate::CoordinatorError> {
        if self.agents.len() >= self.max_agents {
            return Err(crate::CoordinatorError::MaxAgentsReached);
        }

        self.agents.insert(agent.id, agent);
        Ok(())
    }

    pub fn get_agent(&self, id: &Uuid) -> Option<&Agent> {
        self.agents.get(id)
    }

    pub fn get_agent_mut(&mut self, id: &Uuid) -> Option<&mut Agent> {
        self.agents.get_mut(id)
    }

    pub fn get_available_agents(&self) -> Vec<&Agent> {
        self.agents
            .values()
            .filter(|agent| agent.is_available())
            .collect()
    }

    pub fn get_agents_by_type(&self, agent_type: AgentType) -> Vec<&Agent> {
        self.agents
            .values()
            .filter(|agent| agent.agent_type == agent_type)
            .collect()
    }

    pub fn find_best_agent_for_task(&self, required_capabilities: &[String]) -> Option<&Agent> {
        let mut best_agent = None;
        let mut best_score = 0.0;

        for agent in self.get_available_agents() {
            let capability_match = agent.get_specialization_match(required_capabilities);
            let performance_score = agent.get_performance_score();

            // Combined score: 70% capability match + 30% performance
            let total_score = (capability_match * 0.7) + (performance_score * 0.3);

            if total_score > best_score {
                best_score = total_score;
                best_agent = Some(agent);
            }
        }

        best_agent
    }

    pub fn get_registry_stats(&self) -> HashMap<String, usize> {
        let mut stats = HashMap::new();

        stats.insert("total_agents".to_string(), self.agents.len());
        stats.insert(
            "active_agents".to_string(),
            self.agents
                .values()
                .filter(|a| a.status == AgentStatus::Active)
                .count(),
        );
        stats.insert(
            "busy_agents".to_string(),
            self.agents
                .values()
                .filter(|a| a.status == AgentStatus::Busy)
                .count(),
        );
        stats.insert(
            "idle_agents".to_string(),
            self.agents
                .values()
                .filter(|a| a.status == AgentStatus::Idle)
                .count(),
        );
        stats.insert(
            "error_agents".to_string(),
            self.agents
                .values()
                .filter(|a| a.status == AgentStatus::Error)
                .count(),
        );

        stats
    }

    pub fn cleanup_unhealthy_agents(&mut self) -> Vec<Uuid> {
        let unhealthy_agents: Vec<Uuid> = self
            .agents
            .iter()
            .filter(|(_, agent)| !agent.is_healthy())
            .map(|(id, _)| *id)
            .collect();

        for agent_id in &unhealthy_agents {
            self.agents.remove(agent_id);
        }

        unhealthy_agents
    }

    pub fn get_performance_summary(&self) -> HashMap<String, f64> {
        let mut summary = HashMap::new();

        if self.agents.is_empty() {
            return summary;
        }

        let total_completed: usize = self
            .agents
            .values()
            .map(|a| a.metrics.tasks_completed)
            .sum();

        let total_failed: usize = self.agents.values().map(|a| a.metrics.tasks_failed).sum();

        let avg_performance: f64 = self
            .agents
            .values()
            .map(|a| a.get_performance_score())
            .sum::<f64>()
            / self.agents.len() as f64;

        summary.insert("total_tasks_completed".to_string(), total_completed as f64);
        summary.insert("total_tasks_failed".to_string(), total_failed as f64);
        summary.insert("average_performance_score".to_string(), avg_performance);

        if total_completed + total_failed > 0 {
            summary.insert(
                "success_rate".to_string(),
                total_completed as f64 / (total_completed + total_failed) as f64,
            );
        }

        summary
    }
}
