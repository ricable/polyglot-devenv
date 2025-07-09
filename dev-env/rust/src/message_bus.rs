//! Message bus for inter-agent communication
//!
//! Handles real-time messaging, broadcasting, and event coordination
//! between agents in the WebAssembly swarm coordinator.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum MessageType {
    AgentJoined,
    AgentLeft,
    TaskCreated,
    TaskAssigned,
    TaskCompleted,
    TaskFailed,
    TaskStatusUpdate,
    AgentHeartbeat,
    SystemUpdate,
    CoordinationRequest,
    CoordinationResponse,
    Broadcast,
    DirectMessage,
    ErrorAlert,
    PerformanceMetric,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum MessagePriority {
    Low = 1,
    Normal = 2,
    High = 3,
    Critical = 4,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: Uuid,
    pub message_type: MessageType,
    pub priority: MessagePriority,
    pub content: String,
    pub sender_agent: Option<Uuid>,
    pub target_agent: Option<Uuid>,
    pub timestamp: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
    pub requires_response: bool,
    pub response_to: Option<Uuid>,
    pub ttl: Option<DateTime<Utc>>,
}

impl Message {
    pub fn new(
        message_type: MessageType,
        content: String,
        sender_agent: Option<Uuid>,
        target_agent: Option<Uuid>,
    ) -> Self {
        Message {
            id: Uuid::new_v4(),
            message_type,
            priority: MessagePriority::Normal,
            content,
            sender_agent,
            target_agent,
            timestamp: Utc::now(),
            metadata: HashMap::new(),
            requires_response: false,
            response_to: None,
            ttl: None,
        }
    }

    pub fn with_priority(mut self, priority: MessagePriority) -> Self {
        self.priority = priority;
        self
    }

    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }

    pub fn requires_response(mut self) -> Self {
        self.requires_response = true;
        self
    }

    pub fn as_response_to(mut self, message_id: Uuid) -> Self {
        self.response_to = Some(message_id);
        self
    }

    pub fn with_ttl(mut self, ttl_seconds: i64) -> Self {
        self.ttl = Some(Utc::now() + chrono::Duration::seconds(ttl_seconds));
        self
    }

    pub fn is_expired(&self) -> bool {
        self.ttl.map_or(false, |ttl| Utc::now() > ttl)
    }

    pub fn is_broadcast(&self) -> bool {
        self.target_agent.is_none()
    }

    pub fn get_priority_value(&self) -> u8 {
        self.priority.clone() as u8
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageStats {
    pub total_sent: usize,
    pub total_received: usize,
    pub total_broadcast: usize,
    pub total_expired: usize,
    pub messages_by_type: HashMap<String, usize>,
    pub messages_by_priority: HashMap<u8, usize>,
}

pub struct MessageBus {
    inbox: VecDeque<Message>,
    outbox: VecDeque<Message>,
    processed_messages: HashMap<Uuid, Message>,
    agent_queues: HashMap<Uuid, VecDeque<Message>>,
    subscribers: HashMap<MessageType, Vec<Uuid>>,
    stats: MessageStats,
    max_queue_size: usize,
    max_history_size: usize,
}

impl MessageBus {
    pub fn new() -> Self {
        MessageBus {
            inbox: VecDeque::new(),
            outbox: VecDeque::new(),
            processed_messages: HashMap::new(),
            agent_queues: HashMap::new(),
            subscribers: HashMap::new(),
            stats: MessageStats {
                total_sent: 0,
                total_received: 0,
                total_broadcast: 0,
                total_expired: 0,
                messages_by_type: HashMap::new(),
                messages_by_priority: HashMap::new(),
            },
            max_queue_size: 1000,
            max_history_size: 5000,
        }
    }

    pub fn send(&mut self, message: Message) {
        if message.is_expired() {
            self.stats.total_expired += 1;
            return;
        }

        // Update statistics
        self.stats.total_sent += 1;
        let type_key = format!("{:?}", message.message_type);
        *self.stats.messages_by_type.entry(type_key).or_insert(0) += 1;
        *self
            .stats
            .messages_by_priority
            .entry(message.get_priority_value())
            .or_insert(0) += 1;

        if message.is_broadcast() {
            self.stats.total_broadcast += 1;
            self.broadcast_message(message);
        } else {
            self.send_direct_message(message);
        }
    }

    pub fn broadcast(&mut self, message: Message) {
        let broadcast_message = Message {
            target_agent: None,
            ..message
        };
        self.send(broadcast_message);
    }

    pub fn send_to_agent(&mut self, agent_id: Uuid, message: Message) {
        let direct_message = Message {
            target_agent: Some(agent_id),
            ..message
        };
        self.send(direct_message);
    }

    pub fn get_messages(&mut self) -> Vec<Message> {
        let mut messages = Vec::new();

        // Process high priority messages first
        let mut priority_messages: Vec<_> = self.inbox.drain(..).collect();
        priority_messages.sort_by(|a, b| {
            b.get_priority_value()
                .cmp(&a.get_priority_value())
                .then_with(|| a.timestamp.cmp(&b.timestamp))
        });

        // Remove expired messages
        priority_messages.retain(|msg| !msg.is_expired());

        for message in priority_messages {
            self.stats.total_received += 1;
            messages.push(message.clone());

            // Store in processed messages history
            self.processed_messages.insert(message.id, message);

            // Limit history size
            if self.processed_messages.len() > self.max_history_size {
                let oldest_keys: Vec<_> = self
                    .processed_messages
                    .keys()
                    .take(self.processed_messages.len() - self.max_history_size)
                    .cloned()
                    .collect();
                for key in oldest_keys {
                    self.processed_messages.remove(&key);
                }
            }
        }

        messages
    }

    pub fn get_messages_for_agent(&mut self, agent_id: Uuid) -> Vec<Message> {
        let agent_queue = self
            .agent_queues
            .entry(agent_id)
            .or_insert_with(VecDeque::new);

        let mut messages = Vec::new();
        while let Some(message) = agent_queue.pop_front() {
            if !message.is_expired() {
                messages.push(message);
            } else {
                self.stats.total_expired += 1;
            }
        }

        messages
    }

    pub fn subscribe(&mut self, agent_id: Uuid, message_type: MessageType) {
        self.subscribers
            .entry(message_type)
            .or_insert_with(Vec::new)
            .push(agent_id);
    }

    pub fn unsubscribe(&mut self, agent_id: Uuid, message_type: MessageType) {
        if let Some(subscribers) = self.subscribers.get_mut(&message_type) {
            subscribers.retain(|&id| id != agent_id);
        }
    }

    pub fn create_response(
        &self,
        original_message_id: Uuid,
        content: String,
        sender: Uuid,
    ) -> Message {
        Message::new(
            MessageType::CoordinationResponse,
            content,
            Some(sender),
            None,
        )
        .as_response_to(original_message_id)
    }

    pub fn get_pending_responses(&self) -> Vec<&Message> {
        self.processed_messages
            .values()
            .filter(|msg| msg.requires_response && msg.response_to.is_none())
            .collect()
    }

    pub fn get_conversation_history(&self, agent_id: Uuid) -> Vec<&Message> {
        self.processed_messages
            .values()
            .filter(|msg| msg.sender_agent == Some(agent_id) || msg.target_agent == Some(agent_id))
            .collect()
    }

    pub fn get_stats(&self) -> &MessageStats {
        &self.stats
    }

    pub fn cleanup_expired_messages(&mut self) {
        // Clean up expired messages from all queues
        for queue in self.agent_queues.values_mut() {
            let original_len = queue.len();
            queue.retain(|msg| !msg.is_expired());
            self.stats.total_expired += original_len - queue.len();
        }

        // Clean up expired messages from inbox
        let original_len = self.inbox.len();
        self.inbox.retain(|msg| !msg.is_expired());
        self.stats.total_expired += original_len - self.inbox.len();
    }

    pub fn get_queue_status(&self) -> HashMap<String, usize> {
        let mut status = HashMap::new();

        status.insert("inbox_size".to_string(), self.inbox.len());
        status.insert("outbox_size".to_string(), self.outbox.len());
        status.insert(
            "processed_messages".to_string(),
            self.processed_messages.len(),
        );
        status.insert("agent_queues".to_string(), self.agent_queues.len());

        let total_agent_messages: usize = self.agent_queues.values().map(|queue| queue.len()).sum();
        status.insert("total_agent_messages".to_string(), total_agent_messages);

        status
    }

    pub fn health_check(&self) -> bool {
        // Check if message bus is healthy
        self.inbox.len() < self.max_queue_size
            && self.outbox.len() < self.max_queue_size
            && self.processed_messages.len() < self.max_history_size
    }

    pub fn get_message_by_id(&self, message_id: Uuid) -> Option<&Message> {
        self.processed_messages.get(&message_id)
    }

    pub fn get_recent_messages(&self, limit: usize) -> Vec<&Message> {
        let mut messages: Vec<_> = self.processed_messages.values().collect();
        messages.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        messages.into_iter().take(limit).collect()
    }

    // Private helper methods
    fn broadcast_message(&mut self, message: Message) {
        // Send to all subscribed agents
        let subscribers: Vec<Uuid> = self
            .subscribers
            .get(&message.message_type)
            .map(|s| s.clone())
            .unwrap_or_else(Vec::new);

        for agent_id in subscribers {
            self.add_message_to_agent_queue(agent_id, message.clone());
        }

        // Add to general inbox for processing
        self.inbox.push_back(message);
    }

    fn send_direct_message(&mut self, message: Message) {
        if let Some(target_agent) = message.target_agent {
            self.add_message_to_agent_queue(target_agent, message.clone());
        }

        // Add to outbox for processing
        self.outbox.push_back(message);
    }

    fn add_message_to_agent_queue(&mut self, agent_id: Uuid, message: Message) {
        let agent_queue = self
            .agent_queues
            .entry(agent_id)
            .or_insert_with(VecDeque::new);

        // Prevent queue overflow
        if agent_queue.len() >= self.max_queue_size {
            agent_queue.pop_front(); // Remove oldest message
        }

        agent_queue.push_back(message);
    }
}

// Message filtering and routing utilities
impl MessageBus {
    pub fn filter_messages_by_type(&self, message_type: MessageType) -> Vec<&Message> {
        self.processed_messages
            .values()
            .filter(|msg| msg.message_type == message_type)
            .collect()
    }

    pub fn filter_messages_by_priority(&self, min_priority: MessagePriority) -> Vec<&Message> {
        let min_priority_value = min_priority as u8;
        self.processed_messages
            .values()
            .filter(|msg| msg.get_priority_value() >= min_priority_value)
            .collect()
    }

    pub fn get_error_messages(&self) -> Vec<&Message> {
        self.filter_messages_by_type(MessageType::ErrorAlert)
    }

    pub fn get_performance_messages(&self) -> Vec<&Message> {
        self.filter_messages_by_type(MessageType::PerformanceMetric)
    }
}
