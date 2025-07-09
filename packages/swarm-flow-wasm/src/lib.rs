use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use js_sys::Promise;
use web_sys::console;

// External JavaScript interface declarations
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    
    #[wasm_bindgen(catch)]
    async fn devpod_provision(environment: &str, count: u32) -> Result<JsValue, JsValue>;
    
    #[wasm_bindgen(catch)]
    async fn execute_nushell_script(script: &str, args: &[JsValue]) -> Result<JsValue, JsValue>;
}

// Macro for logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// Core Types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct Agent {
    id: String,
    agent_type: String,
    capabilities: Vec<String>,
    environment: String,
    status: String,
    current_task: Option<String>,
    memory_namespace: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct SwarmConfig {
    strategy: String,
    max_agents: u32,
    environments: Vec<String>,
    resource_limits: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct SwarmResult {
    success: bool,
    message: String,
    data: Option<String>,
    agents_deployed: u32,
    execution_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct Task {
    id: String,
    objective: String,
    environment: String,
    priority: u32,
    dependencies: Vec<String>,
    estimated_duration: u32,
}

// Main SwarmCoordinator implementation
#[wasm_bindgen]
pub struct SwarmCoordinator {
    agents: HashMap<String, Agent>,
    config: SwarmConfig,
    active_tasks: HashMap<String, Task>,
    memory_store: HashMap<String, String>,
    coordination_strategy: String,
}

#[wasm_bindgen]
impl SwarmCoordinator {
    /// Create a new SwarmCoordinator with configuration
    #[wasm_bindgen(constructor)]
    pub fn new(config_js: &JsValue) -> Result<SwarmCoordinator, JsValue> {
        let config: SwarmConfig = serde_wasm_bindgen::from_value(config_js.clone())?;
        
        console_log!("🚀 Initializing SwarmCoordinator with strategy: {}", config.strategy);
        
        Ok(SwarmCoordinator {
            agents: HashMap::new(),
            config,
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "intelligent".to_string(),
        })
    }

    /// Spawn a new agent with specific capabilities
    #[wasm_bindgen]
    pub async fn spawn_agent(&mut self, task_js: &JsValue, environment: &str) -> Result<String, JsValue> {
        let task: Task = serde_wasm_bindgen::from_value(task_js.clone())?;
        let agent_id = Uuid::new_v4().to_string();
        
        console_log!("🤖 Spawning agent {} for task: {}", agent_id, task.objective);
        
        // Determine agent capabilities based on task and environment
        let capabilities = self.determine_agent_capabilities(&task, environment);
        
        let agent = Agent {
            id: agent_id.clone(),
            agent_type: self.classify_agent_type(&task),
            capabilities,
            environment: environment.to_string(),
            status: "initializing".to_string(),
            current_task: Some(task.id.clone()),
            memory_namespace: format!("agent_{}", agent_id),
        };
        
        // Store agent and task
        self.agents.insert(agent_id.clone(), agent);
        self.active_tasks.insert(task.id.clone(), task);
        
        // Provision DevPod workspace if needed
        if environment != "local" {
            self.provision_workspace(environment, &agent_id).await?;
        }
        
        Ok(agent_id)
    }

    /// Coordinate multiple agents in a swarm formation
    #[wasm_bindgen]
    pub async fn coordinate_swarm(&mut self, objective: &str, environments: &[JsValue]) -> Result<JsValue, JsValue> {
        let start_time = js_sys::Date::now() as u64;
        console_log!("🎯 Coordinating swarm for objective: {}", objective);
        
        let env_strings: Vec<String> = environments.iter()
            .map(|env| env.as_string().unwrap_or_default())
            .collect();
        
        let mut deployed_agents = 0;
        let mut deployment_results = Vec::new();
        
        // Deploy agents across multiple environments
        for environment in &env_strings {
            let agents_per_env = self.calculate_agents_per_environment(environment);
            
            for i in 0..agents_per_env {
                let task = Task {
                    id: Uuid::new_v4().to_string(),
                    objective: format!("{} (part {}/{})", objective, i + 1, agents_per_env),
                    environment: environment.clone(),
                    priority: 1,
                    dependencies: Vec::new(),
                    estimated_duration: 300, // 5 minutes
                };
                
                match self.spawn_agent(&serde_wasm_bindgen::to_value(&task)?, environment).await {
                    Ok(agent_id) => {
                        deployed_agents += 1;
                        deployment_results.push(format!("Agent {} deployed to {}", agent_id, environment));
                    }
                    Err(e) => {
                        console_log!("❌ Failed to deploy agent to {}: {:?}", environment, e);
                    }
                }
            }
        }
        
        let execution_time = js_sys::Date::now() as u64 - start_time;
        let result = SwarmResult {
            success: deployed_agents > 0,
            message: format!("Deployed {} agents across {} environments", deployed_agents, env_strings.len()),
            data: Some(deployment_results.join(", ")),
            agents_deployed: deployed_agents,
            execution_time_ms: execution_time,
        };
        
        console_log!("✅ Swarm coordination completed in {}ms", execution_time);
        serde_wasm_bindgen::to_value(&result)
    }

    /// Get current swarm status
    #[wasm_bindgen]
    pub fn get_swarm_status(&self) -> Result<JsValue, JsValue> {
        let mut status = HashMap::new();
        status.insert("total_agents", self.agents.len());
        status.insert("active_tasks", self.active_tasks.len());
        status.insert("strategy", self.coordination_strategy.len());
        
        let mut agents_by_env = HashMap::new();
        for agent in self.agents.values() {
            *agents_by_env.entry(&agent.environment).or_insert(0) += 1;
        }
        
        let status_info = serde_json::json!({
            "total_agents": self.agents.len(),
            "active_tasks": self.active_tasks.len(),
            "coordination_strategy": self.coordination_strategy,
            "agents_by_environment": agents_by_env,
            "memory_entries": self.memory_store.len()
        });
        
        serde_wasm_bindgen::to_value(&status_info)
    }

    /// Store data in swarm memory
    #[wasm_bindgen]
    pub fn store_memory(&mut self, key: &str, value: &str) -> bool {
        console_log!("💾 Storing memory: {} = {}", key, value);
        self.memory_store.insert(key.to_string(), value.to_string());
        true
    }

    /// Retrieve data from swarm memory
    #[wasm_bindgen]
    pub fn get_memory(&self, key: &str) -> Option<String> {
        self.memory_store.get(key).cloned()
    }

    /// Scale swarm up or down
    #[wasm_bindgen]
    pub async fn scale_swarm(&mut self, target_size: u32) -> Result<JsValue, JsValue> {
        let current_size = self.agents.len() as u32;
        console_log!("⚖️ Scaling swarm from {} to {} agents", current_size, target_size);
        
        if target_size > current_size {
            // Scale up: spawn additional agents
            let additional_agents = target_size - current_size;
            let mut spawned = 0;
            
            for _ in 0..additional_agents {
                if let Some(environment) = self.config.environments.first() {
                    let task = Task {
                        id: Uuid::new_v4().to_string(),
                        objective: "Scale-up agent".to_string(),
                        environment: environment.clone(),
                        priority: 2,
                        dependencies: Vec::new(),
                        estimated_duration: 120,
                    };
                    
                    if let Ok(_) = self.spawn_agent(&serde_wasm_bindgen::to_value(&task)?, environment).await {
                        spawned += 1;
                    }
                }
            }
            
            let result = serde_json::json!({
                "success": true,
                "message": format!("Scaled up by {} agents", spawned),
                "current_size": self.agents.len()
            });
            
            serde_wasm_bindgen::to_value(&result)
        } else if target_size < current_size {
            // Scale down: remove agents
            let to_remove = current_size - target_size;
            let mut removed = 0;
            
            let agent_ids: Vec<String> = self.agents.keys().take(to_remove as usize).cloned().collect();
            
            for agent_id in agent_ids {
                if let Some(agent) = self.agents.remove(&agent_id) {
                    if let Some(task_id) = &agent.current_task {
                        self.active_tasks.remove(task_id);
                    }
                    removed += 1;
                }
            }
            
            let result = serde_json::json!({
                "success": true,
                "message": format!("Scaled down by {} agents", removed),
                "current_size": self.agents.len()
            });
            
            serde_wasm_bindgen::to_value(&result)
        } else {
            let result = serde_json::json!({
                "success": true,
                "message": "No scaling needed",
                "current_size": self.agents.len()
            });
            
            serde_wasm_bindgen::to_value(&result)
        }
    }
}

// Private implementation methods
impl SwarmCoordinator {
    fn determine_agent_capabilities(&self, task: &Task, environment: &str) -> Vec<String> {
        let mut capabilities = Vec::new();
        
        // Base capabilities based on environment
        match environment {
            "python" => {
                capabilities.extend_from_slice(&["python_development", "data_analysis", "web_development"]);
            }
            "typescript" => {
                capabilities.extend_from_slice(&["typescript_development", "web_development", "api_development"]);
            }
            "rust" => {
                capabilities.extend_from_slice(&["rust_development", "system_programming", "performance_optimization"]);
            }
            "go" => {
                capabilities.extend_from_slice(&["go_development", "microservices", "concurrent_programming"]);
            }
            "nushell" => {
                capabilities.extend_from_slice(&["shell_scripting", "data_processing", "automation"]);
            }
            _ => {
                capabilities.push("general_development".to_string());
            }
        }
        
        // Add task-specific capabilities
        if task.objective.contains("test") {
            capabilities.push("testing".to_string());
        }
        if task.objective.contains("deploy") {
            capabilities.push("deployment".to_string());
        }
        if task.objective.contains("debug") {
            capabilities.push("debugging".to_string());
        }
        
        capabilities.into_iter().map(|s| s.to_string()).collect()
    }
    
    fn classify_agent_type(&self, task: &Task) -> String {
        if task.objective.contains("coordinate") {
            "coordinator".to_string()
        } else if task.objective.contains("test") {
            "tester".to_string()
        } else if task.objective.contains("review") {
            "reviewer".to_string()
        } else if task.objective.contains("research") {
            "researcher".to_string()
        } else {
            "coder".to_string()
        }
    }
    
    fn calculate_agents_per_environment(&self, environment: &str) -> u32 {
        // Simple load balancing based on environment complexity
        match environment {
            "python" | "typescript" => 2,
            "rust" | "go" => 1,
            "nushell" => 1,
            _ => 1,
        }
    }
    
    async fn provision_workspace(&self, environment: &str, agent_id: &str) -> Result<(), JsValue> {
        console_log!("🏗️ Provisioning workspace for agent {} in {}", agent_id, environment);
        
        // Call DevPod provisioning through JavaScript bridge
        match devpod_provision(environment, 1).await {
            Ok(_) => {
                console_log!("✅ Workspace provisioned successfully");
                Ok(())
            }
            Err(e) => {
                console_log!("❌ Failed to provision workspace: {:?}", e);
                Err(e)
            }
        }
    }
}

// WASM module initialization
#[wasm_bindgen(start)]
pub fn init() {
    console_log!("🌐 SwarmFlow WASM module initialized");
}

// Export functions for JavaScript integration
#[wasm_bindgen]
pub fn create_swarm_coordinator(config: &JsValue) -> Result<SwarmCoordinator, JsValue> {
    SwarmCoordinator::new(config)
}

#[wasm_bindgen]
pub fn get_version() -> String {
    "0.1.0".to_string()
}

#[wasm_bindgen]
pub fn get_capabilities() -> Vec<String> {
    vec![
        "multi_language_coordination".to_string(),
        "devpod_integration".to_string(),
        "intelligent_scaling".to_string(),
        "memory_management".to_string(),
        "performance_optimization".to_string(),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;
    use serde_json::json;

    wasm_bindgen_test_configure!(run_in_browser);

    fn create_test_config() -> SwarmConfig {
        SwarmConfig {
            strategy: "test".to_string(),
            max_agents: 10,
            environments: vec!["python".to_string(), "typescript".to_string()],
            resource_limits: None,
        }
    }

    fn create_test_task() -> Task {
        Task {
            id: "test-task-1".to_string(),
            objective: "test objective".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec![],
            estimated_duration: 300,
        }
    }

    #[test]
    fn test_swarm_config_creation() {
        let config = create_test_config();
        assert_eq!(config.strategy, "test");
        assert_eq!(config.max_agents, 10);
        assert_eq!(config.environments.len(), 2);
        assert!(config.environments.contains(&"python".to_string()));
        assert!(config.environments.contains(&"typescript".to_string()));
    }

    #[test]
    fn test_task_creation() {
        let task = create_test_task();
        assert_eq!(task.id, "test-task-1");
        assert_eq!(task.objective, "test objective");
        assert_eq!(task.environment, "python");
        assert_eq!(task.priority, 1);
        assert_eq!(task.estimated_duration, 300);
        assert!(task.dependencies.is_empty());
    }

    #[test]
    fn test_agent_capabilities_python() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        let task = create_test_task();
        let capabilities = coordinator.determine_agent_capabilities(&task, "python");
        
        assert!(capabilities.contains(&"python_development".to_string()));
        assert!(capabilities.contains(&"data_analysis".to_string()));
        assert!(capabilities.contains(&"web_development".to_string()));
    }

    #[test]
    fn test_agent_capabilities_typescript() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        let task = create_test_task();
        let capabilities = coordinator.determine_agent_capabilities(&task, "typescript");
        
        assert!(capabilities.contains(&"typescript_development".to_string()));
        assert!(capabilities.contains(&"web_development".to_string()));
        assert!(capabilities.contains(&"api_development".to_string()));
    }

    #[test]
    fn test_agent_capabilities_rust() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        let task = create_test_task();
        let capabilities = coordinator.determine_agent_capabilities(&task, "rust");
        
        assert!(capabilities.contains(&"rust_development".to_string()));
        assert!(capabilities.contains(&"system_programming".to_string()));
        assert!(capabilities.contains(&"performance_optimization".to_string()));
    }

    #[test]
    fn test_agent_capabilities_go() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        let task = create_test_task();
        let capabilities = coordinator.determine_agent_capabilities(&task, "go");
        
        assert!(capabilities.contains(&"go_development".to_string()));
        assert!(capabilities.contains(&"microservices".to_string()));
        assert!(capabilities.contains(&"concurrent_programming".to_string()));
    }

    #[test]
    fn test_agent_capabilities_nushell() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        let task = create_test_task();
        let capabilities = coordinator.determine_agent_capabilities(&task, "nushell");
        
        assert!(capabilities.contains(&"shell_scripting".to_string()));
        assert!(capabilities.contains(&"data_processing".to_string()));
        assert!(capabilities.contains(&"automation".to_string()));
    }

    #[test]
    fn test_agent_capabilities_unknown_environment() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        let task = create_test_task();
        let capabilities = coordinator.determine_agent_capabilities(&task, "unknown");
        
        assert!(capabilities.contains(&"general_development".to_string()));
    }

    #[test]
    fn test_task_specific_capabilities() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        // Test task capabilities
        let test_task = Task {
            id: "task-1".to_string(),
            objective: "run test suite".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec![],
            estimated_duration: 300,
        };
        let capabilities = coordinator.determine_agent_capabilities(&test_task, "python");
        assert!(capabilities.contains(&"testing".to_string()));

        // Deploy task capabilities
        let deploy_task = Task {
            id: "task-2".to_string(),
            objective: "deploy application".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec![],
            estimated_duration: 300,
        };
        let capabilities = coordinator.determine_agent_capabilities(&deploy_task, "python");
        assert!(capabilities.contains(&"deployment".to_string()));

        // Debug task capabilities
        let debug_task = Task {
            id: "task-3".to_string(),
            objective: "debug memory issue".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec![],
            estimated_duration: 300,
        };
        let capabilities = coordinator.determine_agent_capabilities(&debug_task, "python");
        assert!(capabilities.contains(&"debugging".to_string()));
    }

    #[test]
    fn test_classify_agent_type() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        // Test coordinator type
        let coord_task = Task {
            id: "task-1".to_string(),
            objective: "coordinate team efforts".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec![],
            estimated_duration: 300,
        };
        assert_eq!(coordinator.classify_agent_type(&coord_task), "coordinator");

        // Test tester type
        let test_task = Task {
            id: "task-2".to_string(),
            objective: "test the application".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec![],
            estimated_duration: 300,
        };
        assert_eq!(coordinator.classify_agent_type(&test_task), "tester");

        // Test reviewer type
        let review_task = Task {
            id: "task-3".to_string(),
            objective: "review code changes".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec![],
            estimated_duration: 300,
        };
        assert_eq!(coordinator.classify_agent_type(&review_task), "reviewer");

        // Test researcher type
        let research_task = Task {
            id: "task-4".to_string(),
            objective: "research new technologies".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec![],
            estimated_duration: 300,
        };
        assert_eq!(coordinator.classify_agent_type(&research_task), "researcher");

        // Test default coder type
        let code_task = Task {
            id: "task-5".to_string(),
            objective: "implement new feature".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec![],
            estimated_duration: 300,
        };
        assert_eq!(coordinator.classify_agent_type(&code_task), "coder");
    }

    #[test]
    fn test_calculate_agents_per_environment() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        assert_eq!(coordinator.calculate_agents_per_environment("python"), 2);
        assert_eq!(coordinator.calculate_agents_per_environment("typescript"), 2);
        assert_eq!(coordinator.calculate_agents_per_environment("rust"), 1);
        assert_eq!(coordinator.calculate_agents_per_environment("go"), 1);
        assert_eq!(coordinator.calculate_agents_per_environment("nushell"), 1);
        assert_eq!(coordinator.calculate_agents_per_environment("unknown"), 1);
    }

    #[test]
    fn test_memory_operations() {
        let mut coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        // Test store memory
        assert!(coordinator.store_memory("test_key", "test_value"));
        
        // Test get memory
        assert_eq!(coordinator.get_memory("test_key"), Some("test_value".to_string()));
        
        // Test get non-existent memory
        assert_eq!(coordinator.get_memory("non_existent"), None);
        
        // Test overwrite memory
        assert!(coordinator.store_memory("test_key", "new_value"));
        assert_eq!(coordinator.get_memory("test_key"), Some("new_value".to_string()));
    }

    #[test]
    fn test_memory_storage_persistence() {
        let mut coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        // Store multiple values
        coordinator.store_memory("key1", "value1");
        coordinator.store_memory("key2", "value2");
        coordinator.store_memory("key3", "value3");

        // Verify all values are stored
        assert_eq!(coordinator.get_memory("key1"), Some("value1".to_string()));
        assert_eq!(coordinator.get_memory("key2"), Some("value2".to_string()));
        assert_eq!(coordinator.get_memory("key3"), Some("value3".to_string()));
        
        // Verify memory store size
        assert_eq!(coordinator.memory_store.len(), 3);
    }

    #[test]
    fn test_empty_coordinator_state() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        assert_eq!(coordinator.agents.len(), 0);
        assert_eq!(coordinator.active_tasks.len(), 0);
        assert_eq!(coordinator.memory_store.len(), 0);
        assert_eq!(coordinator.coordination_strategy, "test");
    }

    #[test]
    fn test_get_version() {
        assert_eq!(get_version(), "0.1.0");
    }

    #[test]
    fn test_get_capabilities() {
        let capabilities = get_capabilities();
        assert_eq!(capabilities.len(), 5);
        assert!(capabilities.contains(&"multi_language_coordination".to_string()));
        assert!(capabilities.contains(&"devpod_integration".to_string()));
        assert!(capabilities.contains(&"intelligent_scaling".to_string()));
        assert!(capabilities.contains(&"memory_management".to_string()));
        assert!(capabilities.contains(&"performance_optimization".to_string()));
    }

    #[test]
    fn test_agent_creation() {
        let agent = Agent {
            id: "test-agent-1".to_string(),
            agent_type: "tester".to_string(),
            capabilities: vec!["testing".to_string(), "debugging".to_string()],
            environment: "python".to_string(),
            status: "active".to_string(),
            current_task: Some("task-1".to_string()),
            memory_namespace: "agent_test".to_string(),
        };

        assert_eq!(agent.id, "test-agent-1");
        assert_eq!(agent.agent_type, "tester");
        assert_eq!(agent.capabilities.len(), 2);
        assert_eq!(agent.environment, "python");
        assert_eq!(agent.status, "active");
        assert_eq!(agent.current_task, Some("task-1".to_string()));
        assert_eq!(agent.memory_namespace, "agent_test");
    }

    #[test]
    fn test_swarm_result_creation() {
        let result = SwarmResult {
            success: true,
            message: "Test successful".to_string(),
            data: Some("test data".to_string()),
            agents_deployed: 3,
            execution_time_ms: 150,
        };

        assert!(result.success);
        assert_eq!(result.message, "Test successful");
        assert_eq!(result.data, Some("test data".to_string()));
        assert_eq!(result.agents_deployed, 3);
        assert_eq!(result.execution_time_ms, 150);
    }

    #[test]
    fn test_task_dependencies() {
        let task_with_deps = Task {
            id: "task-1".to_string(),
            objective: "task with dependencies".to_string(),
            environment: "python".to_string(),
            priority: 1,
            dependencies: vec!["dep-1".to_string(), "dep-2".to_string()],
            estimated_duration: 300,
        };

        assert_eq!(task_with_deps.dependencies.len(), 2);
        assert!(task_with_deps.dependencies.contains(&"dep-1".to_string()));
        assert!(task_with_deps.dependencies.contains(&"dep-2".to_string()));
    }

    #[test]
    fn test_config_environment_handling() {
        let config = SwarmConfig {
            strategy: "test".to_string(),
            max_agents: 5,
            environments: vec![
                "python".to_string(),
                "typescript".to_string(),
                "rust".to_string(),
                "go".to_string(),
                "nushell".to_string(),
            ],
            resource_limits: Some("memory: 4GB, cpu: 2 cores".to_string()),
        };

        assert_eq!(config.environments.len(), 5);
        assert!(config.environments.contains(&"python".to_string()));
        assert!(config.environments.contains(&"typescript".to_string()));
        assert!(config.environments.contains(&"rust".to_string()));
        assert!(config.environments.contains(&"go".to_string()));
        assert!(config.environments.contains(&"nushell".to_string()));
        assert!(config.resource_limits.is_some());
    }

    #[test]
    fn test_agent_status_values() {
        let statuses = vec!["initializing", "active", "busy", "idle", "error", "terminated"];
        
        for status in statuses {
            let agent = Agent {
                id: "test-agent".to_string(),
                agent_type: "coder".to_string(),
                capabilities: vec!["python_development".to_string()],
                environment: "python".to_string(),
                status: status.to_string(),
                current_task: None,
                memory_namespace: "test_namespace".to_string(),
            };
            
            assert_eq!(agent.status, status);
        }
    }

    #[test]
    fn test_task_priority_levels() {
        let priorities = vec![1, 2, 3, 4, 5];
        
        for priority in priorities {
            let task = Task {
                id: format!("task-{}", priority),
                objective: "test task".to_string(),
                environment: "python".to_string(),
                priority,
                dependencies: vec![],
                estimated_duration: 300,
            };
            
            assert_eq!(task.priority, priority);
        }
    }

    #[test]
    fn test_memory_namespace_format() {
        let agent_id = "test-agent-123";
        let expected_namespace = format!("agent_{}", agent_id);
        
        let agent = Agent {
            id: agent_id.to_string(),
            agent_type: "coder".to_string(),
            capabilities: vec!["python_development".to_string()],
            environment: "python".to_string(),
            status: "active".to_string(),
            current_task: None,
            memory_namespace: expected_namespace.clone(),
        };
        
        assert_eq!(agent.memory_namespace, expected_namespace);
    }

    #[test]
    fn test_environment_scaling_logic() {
        let coordinator = SwarmCoordinator {
            agents: HashMap::new(),
            config: create_test_config(),
            active_tasks: HashMap::new(),
            memory_store: HashMap::new(),
            coordination_strategy: "test".to_string(),
        };

        // High-complexity environments should get more agents
        assert!(coordinator.calculate_agents_per_environment("python") >= 
                coordinator.calculate_agents_per_environment("nushell"));
        assert!(coordinator.calculate_agents_per_environment("typescript") >= 
                coordinator.calculate_agents_per_environment("rust"));
    }
}