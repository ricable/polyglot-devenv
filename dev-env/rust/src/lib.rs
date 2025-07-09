//! WebAssembly-compiled Swarm Coordinator
//!
//! A high-performance distributed agent management system compiled to WebAssembly
//! for browser-based swarm coordination and real-time task orchestration.

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use wasm_bindgen::prelude::*;

mod agent;
mod coordinator;
mod memory_store;
mod message_bus;
mod task_queue;

pub use agent::{Agent, AgentStatus, AgentType};
pub use coordinator::SwarmCoordinator;
pub use memory_store::{MemoryEntry, MemoryStore};
pub use message_bus::{Message, MessageBus, MessageType};
pub use task_queue::{Task, TaskQueue, TaskStatus};

// WebAssembly bindings
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

// Console logging macros for WASM
#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => {
        #[cfg(target_arch = "wasm32")]
        log(&format_args!($($t)*).to_string());
        #[cfg(not(target_arch = "wasm32"))]
        println!("[LOG] {}", format_args!($($t)*));
    }
}

#[macro_export]
macro_rules! console_error {
    ($($t:tt)*) => {
        #[cfg(target_arch = "wasm32")]
        error(&format_args!($($t)*).to_string());
        #[cfg(not(target_arch = "wasm32"))]
        eprintln!("[ERROR] {}", format_args!($($t)*));
    }
}

// WebAssembly-exposed coordinator interface
#[wasm_bindgen]
pub struct WasmSwarmCoordinator {
    coordinator: SwarmCoordinator,
}

#[wasm_bindgen]
impl WasmSwarmCoordinator {
    #[wasm_bindgen(constructor)]
    pub fn new(max_agents: usize) -> WasmSwarmCoordinator {
        console_error_panic_hook::set_once();

        let coordinator = SwarmCoordinator::new(max_agents);
        console_log!(
            "WebAssembly Swarm Coordinator initialized with max_agents: {}",
            max_agents
        );

        WasmSwarmCoordinator { coordinator }
    }

    #[wasm_bindgen]
    pub fn spawn_agent(&mut self, agent_type: &str, name: &str, capabilities: &str) -> String {
        let agent_type = match agent_type {
            "coordinator" => AgentType::Coordinator,
            "researcher" => AgentType::Researcher,
            "coder" => AgentType::Coder,
            "analyst" => AgentType::Analyst,
            "tester" => AgentType::Tester,
            _ => AgentType::Coordinator,
        };

        let capabilities: Vec<String> =
            serde_json::from_str(capabilities).unwrap_or_else(|_| vec![]);

        match self
            .coordinator
            .spawn_agent(agent_type, name.to_string(), capabilities)
        {
            Ok(agent_id) => {
                console_log!("Agent spawned: {} ({})", name, agent_id);
                agent_id.to_string()
            }
            Err(e) => {
                console_error!("Failed to spawn agent: {}", e);
                "".to_string()
            }
        }
    }

    #[wasm_bindgen]
    pub fn create_task(&mut self, name: &str, priority: u8, dependencies: &str) -> String {
        let dependencies: Vec<Uuid> = serde_json::from_str(dependencies).unwrap_or_else(|_| vec![]);

        let task_id = self
            .coordinator
            .create_task(name.to_string(), priority, dependencies);
        console_log!("Task created: {} ({})", name, task_id);
        task_id.to_string()
    }

    #[wasm_bindgen]
    pub fn assign_task(&mut self, task_id: &str, agent_id: &str) -> bool {
        let task_id = match Uuid::parse_str(task_id) {
            Ok(id) => id,
            Err(_) => return false,
        };

        let agent_id = match Uuid::parse_str(agent_id) {
            Ok(id) => id,
            Err(_) => return false,
        };

        match self.coordinator.assign_task(task_id, agent_id) {
            Ok(_) => {
                console_log!("Task {} assigned to agent {}", task_id, agent_id);
                true
            }
            Err(e) => {
                console_error!("Failed to assign task: {}", e);
                false
            }
        }
    }

    #[wasm_bindgen]
    pub fn get_swarm_status(&self) -> String {
        let status = self.coordinator.get_swarm_status();
        serde_json::to_string(&status).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn process_messages(&mut self) -> String {
        let messages = self.coordinator.process_messages();
        serde_json::to_string(&messages).unwrap_or_else(|_| "[]".to_string())
    }

    #[wasm_bindgen]
    pub fn update_task_status(&mut self, task_id: &str, status: &str) -> bool {
        let task_id = match Uuid::parse_str(task_id) {
            Ok(id) => id,
            Err(_) => return false,
        };

        let status = match status {
            "pending" => TaskStatus::Pending,
            "in_progress" => TaskStatus::InProgress,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            _ => return false,
        };

        let status_str = format!("{:?}", status);
        self.coordinator.update_task_status(task_id, status);
        console_log!("Task {} status updated to {}", task_id, status_str);
        true
    }

    #[wasm_bindgen]
    pub fn store_memory(&mut self, key: &str, value: &str) -> bool {
        self.coordinator
            .store_memory(key.to_string(), value.to_string());
        console_log!("Memory stored: {}", key);
        true
    }

    #[wasm_bindgen]
    pub fn retrieve_memory(&self, key: &str) -> String {
        match self.coordinator.retrieve_memory(key) {
            Some(value) => value,
            None => "".to_string(),
        }
    }
}

// Error types for the coordinator
#[derive(Debug, Serialize, Deserialize)]
pub enum CoordinatorError {
    MaxAgentsReached,
    AgentNotFound,
    TaskNotFound,
    InvalidOperation,
}

impl std::fmt::Display for CoordinatorError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CoordinatorError::MaxAgentsReached => write!(f, "Maximum number of agents reached"),
            CoordinatorError::AgentNotFound => write!(f, "Agent not found"),
            CoordinatorError::TaskNotFound => write!(f, "Task not found"),
            CoordinatorError::InvalidOperation => write!(f, "Invalid operation"),
        }
    }
}

impl std::error::Error for CoordinatorError {}

// Initialize the WebAssembly module
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    console_log!("WebAssembly Swarm Coordinator module loaded");
}

// Legacy functions for backward compatibility
#[deprecated(since = "0.1.0", note = "Use WasmSwarmCoordinator instead")]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[deprecated(since = "0.1.0", note = "Use WasmSwarmCoordinator instead")]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg(target_arch = "wasm32")]
    fn test_wasm_coordinator_creation() {
        let coordinator = WasmSwarmCoordinator::new(5);
        let status = coordinator.get_swarm_status();
        assert!(!status.is_empty());
    }

    #[test]
    #[cfg(not(target_arch = "wasm32"))]
    fn test_coordinator_creation_mock() {
        // Mock test for non-WASM targets
        // Test the underlying coordinator functionality
        let coordinator = coordinator::SwarmCoordinator::new(5);
        let status = coordinator.get_swarm_status();
        assert!(status.active_agents == 0); // Should start with no agents
    }

    #[test]
    fn test_legacy_functions() {
        #[allow(deprecated)]
        {
            assert_eq!(greet("World"), "Hello, World!");
            assert_eq!(add(2, 3), 5);
        }
    }
}
