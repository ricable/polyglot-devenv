//! Task queue management and orchestration
//!
//! Handles task creation, assignment, dependency resolution, and execution
//! tracking for the WebAssembly swarm coordinator.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum TaskStatus {
    Pending,
    Ready,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum TaskPriority {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

impl From<u8> for TaskPriority {
    fn from(value: u8) -> Self {
        match value {
            1 => TaskPriority::Low,
            2 => TaskPriority::Medium,
            3 => TaskPriority::High,
            4 => TaskPriority::Critical,
            _ => TaskPriority::Medium,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub priority: TaskPriority,
    pub status: TaskStatus,
    pub dependencies: Vec<Uuid>,
    pub assigned_agent: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub estimated_duration: Option<f64>,
    pub actual_duration: Option<f64>,
    pub required_capabilities: Vec<String>,
    pub metadata: HashMap<String, String>,
    pub progress: f64,
    pub error_message: Option<String>,
}

impl Task {
    pub fn new(
        name: String,
        priority: u8,
        dependencies: Vec<Uuid>,
        required_capabilities: Vec<String>,
    ) -> Self {
        Task {
            id: Uuid::new_v4(),
            name,
            description: None,
            priority: TaskPriority::from(priority),
            status: TaskStatus::Pending,
            dependencies,
            assigned_agent: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            estimated_duration: None,
            actual_duration: None,
            required_capabilities,
            metadata: HashMap::new(),
            progress: 0.0,
            error_message: None,
        }
    }

    pub fn assign_to_agent(&mut self, agent_id: Uuid) {
        self.assigned_agent = Some(agent_id);
        self.status = TaskStatus::InProgress;
        self.started_at = Some(Utc::now());
    }

    pub fn complete(&mut self) {
        self.status = TaskStatus::Completed;
        self.completed_at = Some(Utc::now());
        self.progress = 100.0;

        if let Some(started_at) = self.started_at {
            self.actual_duration =
                Some((Utc::now() - started_at).num_milliseconds() as f64 / 1000.0);
        }
    }

    pub fn fail(&mut self, error: String) {
        self.status = TaskStatus::Failed;
        self.error_message = Some(error);
        self.completed_at = Some(Utc::now());

        if let Some(started_at) = self.started_at {
            self.actual_duration =
                Some((Utc::now() - started_at).num_milliseconds() as f64 / 1000.0);
        }
    }

    pub fn update_progress(&mut self, progress: f64) {
        self.progress = progress.max(0.0).min(100.0);
    }

    pub fn can_start(&self, completed_tasks: &HashSet<Uuid>) -> bool {
        self.status == TaskStatus::Pending
            && self
                .dependencies
                .iter()
                .all(|dep| completed_tasks.contains(dep))
    }

    pub fn get_priority_value(&self) -> u8 {
        self.priority.clone() as u8
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStats {
    pub total: usize,
    pub pending: usize,
    pub ready: usize,
    pub in_progress: usize,
    pub completed: usize,
    pub failed: usize,
    pub cancelled: usize,
}

pub struct TaskQueue {
    tasks: HashMap<Uuid, Task>,
    ready_queue: VecDeque<Uuid>,
    completed_tasks: HashSet<Uuid>,
    failed_tasks: HashSet<Uuid>,
}

impl TaskQueue {
    pub fn new() -> Self {
        TaskQueue {
            tasks: HashMap::new(),
            ready_queue: VecDeque::new(),
            completed_tasks: HashSet::new(),
            failed_tasks: HashSet::new(),
        }
    }

    pub fn create_task(&mut self, name: String, priority: u8, dependencies: Vec<Uuid>) -> Uuid {
        let task = Task::new(name, priority, dependencies, vec![]);
        let task_id = task.id;

        self.tasks.insert(task_id, task);
        self.check_task_ready(task_id);

        task_id
    }

    pub fn create_task_with_capabilities(
        &mut self,
        name: String,
        priority: u8,
        dependencies: Vec<Uuid>,
        required_capabilities: Vec<String>,
    ) -> Uuid {
        let task = Task::new(name, priority, dependencies, required_capabilities);
        let task_id = task.id;

        self.tasks.insert(task_id, task);
        self.check_task_ready(task_id);

        task_id
    }

    pub fn assign_task(
        &mut self,
        task_id: Uuid,
        agent_id: Uuid,
    ) -> Result<(), crate::CoordinatorError> {
        let task = self
            .tasks
            .get_mut(&task_id)
            .ok_or(crate::CoordinatorError::TaskNotFound)?;

        if task.status != TaskStatus::Pending && task.status != TaskStatus::Ready {
            return Err(crate::CoordinatorError::InvalidOperation);
        }

        task.assign_to_agent(agent_id);

        // Remove from ready queue if it was there
        if let Some(pos) = self.ready_queue.iter().position(|&id| id == task_id) {
            self.ready_queue.remove(pos);
        }

        Ok(())
    }

    pub fn update_task_status(&mut self, task_id: Uuid, status: TaskStatus) {
        if let Some(task) = self.tasks.get_mut(&task_id) {
            let old_status = task.status.clone();
            task.status = status.clone();

            match status {
                TaskStatus::Completed => {
                    task.complete();
                    self.completed_tasks.insert(task_id);
                    self.check_dependent_tasks(task_id);
                }
                TaskStatus::Failed => {
                    self.failed_tasks.insert(task_id);
                    // TODO: Handle task failure cascading
                }
                TaskStatus::Ready => {
                    if old_status == TaskStatus::Pending {
                        self.add_to_ready_queue(task_id);
                    }
                }
                _ => {}
            }
        }
    }

    pub fn complete_task(&mut self, task_id: Uuid) {
        if let Some(task) = self.tasks.get_mut(&task_id) {
            task.complete();
            self.completed_tasks.insert(task_id);
            self.check_dependent_tasks(task_id);
        }
    }

    pub fn fail_task(&mut self, task_id: Uuid, error: String) {
        if let Some(task) = self.tasks.get_mut(&task_id) {
            task.fail(error);
            self.failed_tasks.insert(task_id);
        }
    }

    pub fn update_task_progress(&mut self, task_id: Uuid, progress: f64) {
        if let Some(task) = self.tasks.get_mut(&task_id) {
            task.update_progress(progress);
        }
    }

    pub fn get_next_ready_task(&mut self) -> Option<Uuid> {
        self.ready_queue.pop_front()
    }

    pub fn get_next_priority_task(&mut self) -> Option<Uuid> {
        let mut ready_tasks: Vec<_> = self
            .ready_queue
            .iter()
            .filter_map(|&id| self.tasks.get(&id).map(|task| (id, task)))
            .collect();

        ready_tasks.sort_by(|a, b| {
            b.1.get_priority_value()
                .cmp(&a.1.get_priority_value())
                .then_with(|| a.1.created_at.cmp(&b.1.created_at))
        });

        if let Some((task_id, _)) = ready_tasks.first() {
            let task_id = *task_id;
            if let Some(pos) = self.ready_queue.iter().position(|&id| id == task_id) {
                self.ready_queue.remove(pos);
            }
            Some(task_id)
        } else {
            None
        }
    }

    pub fn get_task(&self, task_id: &Uuid) -> Option<&Task> {
        self.tasks.get(task_id)
    }

    pub fn get_task_mut(&mut self, task_id: &Uuid) -> Option<&mut Task> {
        self.tasks.get_mut(task_id)
    }

    pub fn get_pending_tasks(&self) -> HashMap<Uuid, &Task> {
        self.tasks
            .iter()
            .filter(|(_, task)| task.status == TaskStatus::Pending)
            .map(|(id, task)| (*id, task))
            .collect()
    }

    pub fn get_ready_tasks(&self) -> Vec<&Task> {
        self.ready_queue
            .iter()
            .filter_map(|id| self.tasks.get(id))
            .collect()
    }

    pub fn get_completed_tasks(&self) -> HashMap<Uuid, &Task> {
        self.tasks
            .iter()
            .filter(|(_, task)| task.status == TaskStatus::Completed)
            .map(|(id, task)| (*id, task))
            .collect()
    }

    pub fn get_stats(&self) -> TaskStats {
        let mut stats = TaskStats {
            total: self.tasks.len(),
            pending: 0,
            ready: 0,
            in_progress: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
        };

        for task in self.tasks.values() {
            match task.status {
                TaskStatus::Pending => stats.pending += 1,
                TaskStatus::Ready => stats.ready += 1,
                TaskStatus::InProgress => stats.in_progress += 1,
                TaskStatus::Completed => stats.completed += 1,
                TaskStatus::Failed => stats.failed += 1,
                TaskStatus::Cancelled => stats.cancelled += 1,
            }
        }

        stats
    }

    pub fn mark_task_ready(&mut self, task_id: Uuid) {
        if let Some(task) = self.tasks.get_mut(&task_id) {
            if task.status == TaskStatus::Pending {
                task.status = TaskStatus::Ready;
                self.add_to_ready_queue(task_id);
            }
        }
    }

    pub fn get_tasks_by_agent(&self, agent_id: Uuid) -> Vec<&Task> {
        self.tasks
            .values()
            .filter(|task| task.assigned_agent == Some(agent_id))
            .collect()
    }

    pub fn get_overdue_tasks(&self, timeout_seconds: i64) -> Vec<&Task> {
        let now = Utc::now();
        self.tasks
            .values()
            .filter(|task| {
                task.status == TaskStatus::InProgress
                    && task.started_at.map_or(false, |started| {
                        (now - started).num_seconds() > timeout_seconds
                    })
            })
            .collect()
    }

    pub fn health_check(&self) -> bool {
        // Basic health check - ensure no corrupted state
        let ready_count = self.ready_queue.len();
        let actual_ready = self
            .tasks
            .values()
            .filter(|task| task.status == TaskStatus::Ready)
            .count();

        ready_count == actual_ready
    }

    // Private helper methods
    fn check_task_ready(&mut self, task_id: Uuid) {
        if let Some(task) = self.tasks.get(&task_id) {
            if task.can_start(&self.completed_tasks) {
                self.add_to_ready_queue(task_id);
            }
        }
    }

    fn add_to_ready_queue(&mut self, task_id: Uuid) {
        if let Some(task) = self.tasks.get_mut(&task_id) {
            task.status = TaskStatus::Ready;
        }

        if !self.ready_queue.contains(&task_id) {
            self.ready_queue.push_back(task_id);
        }
    }

    fn check_dependent_tasks(&mut self, completed_task_id: Uuid) {
        let dependent_tasks: Vec<Uuid> = self
            .tasks
            .iter()
            .filter(|(_, task)| {
                task.status == TaskStatus::Pending && task.dependencies.contains(&completed_task_id)
            })
            .map(|(id, _)| *id)
            .collect();

        for task_id in dependent_tasks {
            self.check_task_ready(task_id);
        }
    }
}
