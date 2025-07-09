//! Shared memory store for swarm coordination
//!
//! Provides persistent storage and retrieval of shared state, knowledge,
//! and coordination data for the WebAssembly swarm coordinator.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: Uuid,
    pub key: String,
    pub value: String,
    pub entry_type: MemoryEntryType,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub tags: Vec<String>,
    pub metadata: HashMap<String, String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub access_count: usize,
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum MemoryEntryType {
    Configuration,
    State,
    Knowledge,
    Cache,
    Metrics,
    Log,
    Coordination,
    TaskData,
    AgentData,
}

impl MemoryEntry {
    pub fn new(
        key: String,
        value: String,
        entry_type: MemoryEntryType,
        created_by: Option<Uuid>,
    ) -> Self {
        let now = Utc::now();

        MemoryEntry {
            id: Uuid::new_v4(),
            key,
            value,
            entry_type,
            created_at: now,
            updated_at: now,
            created_by,
            tags: Vec::new(),
            metadata: HashMap::new(),
            expires_at: None,
            access_count: 0,
            last_accessed: now,
        }
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = tags;
        self
    }

    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }

    pub fn with_ttl(mut self, ttl_seconds: i64) -> Self {
        self.expires_at = Some(Utc::now() + chrono::Duration::seconds(ttl_seconds));
        self
    }

    pub fn is_expired(&self) -> bool {
        self.expires_at
            .map_or(false, |expires| Utc::now() > expires)
    }

    pub fn access(&mut self) {
        self.access_count += 1;
        self.last_accessed = Utc::now();
    }

    pub fn update_value(&mut self, new_value: String) {
        self.value = new_value;
        self.updated_at = Utc::now();
    }

    pub fn add_tag(&mut self, tag: String) {
        if !self.tags.contains(&tag) {
            self.tags.push(tag);
        }
    }

    pub fn has_tag(&self, tag: &str) -> bool {
        self.tags.contains(&tag.to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    pub total_entries: usize,
    pub entries_by_type: HashMap<String, usize>,
    pub total_size_bytes: usize,
    pub expired_entries: usize,
    pub most_accessed_keys: Vec<(String, usize)>,
    pub memory_usage_mb: f64,
}

pub struct MemoryStore {
    entries: HashMap<String, MemoryEntry>,
    indexes: HashMap<String, Vec<String>>, // tag -> keys
    type_indexes: HashMap<MemoryEntryType, Vec<String>>, // type -> keys
    max_entries: usize,
    max_size_bytes: usize,
    current_size_bytes: usize,
}

impl MemoryStore {
    pub fn new() -> Self {
        MemoryStore {
            entries: HashMap::new(),
            indexes: HashMap::new(),
            type_indexes: HashMap::new(),
            max_entries: 10000,
            max_size_bytes: 100 * 1024 * 1024, // 100MB
            current_size_bytes: 0,
        }
    }

    pub fn with_limits(max_entries: usize, max_size_bytes: usize) -> Self {
        MemoryStore {
            entries: HashMap::new(),
            indexes: HashMap::new(),
            type_indexes: HashMap::new(),
            max_entries,
            max_size_bytes,
            current_size_bytes: 0,
        }
    }

    pub fn store(&mut self, key: String, value: String) {
        let entry = MemoryEntry::new(key.clone(), value.clone(), MemoryEntryType::State, None);
        self.store_entry(entry);
    }

    pub fn store_with_type(
        &mut self,
        key: String,
        value: String,
        entry_type: MemoryEntryType,
        created_by: Option<Uuid>,
    ) {
        let entry = MemoryEntry::new(key, value, entry_type, created_by);
        self.store_entry(entry);
    }

    pub fn store_entry(&mut self, entry: MemoryEntry) {
        let key = entry.key.clone();
        let value_size = entry.value.len();

        // Check if we need to make space
        if self.entries.len() >= self.max_entries
            || self.current_size_bytes + value_size > self.max_size_bytes
        {
            self.evict_entries();
        }

        // Remove old entry if it exists
        if let Some(old_entry) = self.entries.remove(&key) {
            self.current_size_bytes -= old_entry.value.len();
            self.remove_from_indexes(&old_entry);
        }

        // Add new entry
        self.current_size_bytes += value_size;
        self.add_to_indexes(&entry);
        self.entries.insert(key, entry);
    }

    pub fn retrieve(&self, key: &str) -> Option<String> {
        self.entries.get(key).and_then(|entry| {
            if entry.is_expired() {
                None
            } else {
                Some(entry.value.clone())
            }
        })
    }

    pub fn retrieve_entry(&mut self, key: &str) -> Option<&mut MemoryEntry> {
        if let Some(entry) = self.entries.get_mut(key) {
            if entry.is_expired() {
                None
            } else {
                entry.access();
                Some(entry)
            }
        } else {
            None
        }
    }

    pub fn exists(&self, key: &str) -> bool {
        self.entries
            .get(key)
            .map_or(false, |entry| !entry.is_expired())
    }

    pub fn delete(&mut self, key: &str) -> bool {
        if let Some(entry) = self.entries.remove(key) {
            self.current_size_bytes -= entry.value.len();
            self.remove_from_indexes(&entry);
            true
        } else {
            false
        }
    }

    pub fn update(&mut self, key: &str, new_value: String) -> bool {
        if let Some(entry) = self.entries.get_mut(key) {
            if !entry.is_expired() {
                let old_size = entry.value.len();
                entry.update_value(new_value);
                let new_size = entry.value.len();
                self.current_size_bytes = self.current_size_bytes - old_size + new_size;
                return true;
            }
        }
        false
    }

    pub fn search_by_tag(&self, tag: &str) -> Vec<&MemoryEntry> {
        self.indexes
            .get(tag)
            .map(|keys| {
                keys.iter()
                    .filter_map(|key| self.entries.get(key))
                    .filter(|entry| !entry.is_expired())
                    .collect()
            })
            .unwrap_or_else(Vec::new)
    }

    pub fn search_by_type(&self, entry_type: MemoryEntryType) -> Vec<&MemoryEntry> {
        self.type_indexes
            .get(&entry_type)
            .map(|keys| {
                keys.iter()
                    .filter_map(|key| self.entries.get(key))
                    .filter(|entry| !entry.is_expired())
                    .collect()
            })
            .unwrap_or_else(Vec::new)
    }

    pub fn search_by_pattern(&self, pattern: &str) -> Vec<&MemoryEntry> {
        self.entries
            .values()
            .filter(|entry| {
                !entry.is_expired()
                    && (entry.key.contains(pattern) || entry.value.contains(pattern))
            })
            .collect()
    }

    pub fn get_keys_by_prefix(&self, prefix: &str) -> Vec<String> {
        self.entries
            .keys()
            .filter(|key| key.starts_with(prefix))
            .filter(|key| !self.entries.get(*key).unwrap().is_expired())
            .cloned()
            .collect()
    }

    pub fn get_all_keys(&self) -> Vec<String> {
        self.entries
            .keys()
            .filter(|key| !self.entries.get(*key).unwrap().is_expired())
            .cloned()
            .collect()
    }

    pub fn get_stats(&self) -> MemoryStats {
        let mut entries_by_type = HashMap::new();
        let mut most_accessed = HashMap::new();
        let mut expired_count = 0;

        for entry in self.entries.values() {
            if entry.is_expired() {
                expired_count += 1;
            } else {
                let type_key = format!("{:?}", entry.entry_type);
                *entries_by_type.entry(type_key).or_insert(0) += 1;
                most_accessed.insert(entry.key.clone(), entry.access_count);
            }
        }

        let mut most_accessed_keys: Vec<_> = most_accessed.into_iter().collect();
        most_accessed_keys.sort_by(|a, b| b.1.cmp(&a.1));
        most_accessed_keys.truncate(10);

        MemoryStats {
            total_entries: self.entries.len(),
            entries_by_type,
            total_size_bytes: self.current_size_bytes,
            expired_entries: expired_count,
            most_accessed_keys,
            memory_usage_mb: self.current_size_bytes as f64 / (1024.0 * 1024.0),
        }
    }

    pub fn cleanup_expired(&mut self) {
        let expired_keys: Vec<_> = self
            .entries
            .iter()
            .filter(|(_, entry)| entry.is_expired())
            .map(|(key, _)| key.clone())
            .collect();

        for key in expired_keys {
            self.delete(&key);
        }
    }

    pub fn get_memory_usage(&self) -> usize {
        self.current_size_bytes
    }

    pub fn get_entry_count(&self) -> usize {
        self.entries.len()
    }

    pub fn health_check(&self) -> bool {
        self.entries.len() <= self.max_entries && self.current_size_bytes <= self.max_size_bytes
    }

    pub fn backup(&self) -> HashMap<String, MemoryEntry> {
        self.entries.clone()
    }

    pub fn restore(&mut self, backup: HashMap<String, MemoryEntry>) {
        self.entries = backup;
        self.rebuild_indexes();
        self.recalculate_size();
    }

    pub fn clear(&mut self) {
        self.entries.clear();
        self.indexes.clear();
        self.type_indexes.clear();
        self.current_size_bytes = 0;
    }

    // Private helper methods
    fn add_to_indexes(&mut self, entry: &MemoryEntry) {
        // Add to tag indexes
        for tag in &entry.tags {
            self.indexes
                .entry(tag.clone())
                .or_insert_with(Vec::new)
                .push(entry.key.clone());
        }

        // Add to type index
        self.type_indexes
            .entry(entry.entry_type.clone())
            .or_insert_with(Vec::new)
            .push(entry.key.clone());
    }

    fn remove_from_indexes(&mut self, entry: &MemoryEntry) {
        // Remove from tag indexes
        for tag in &entry.tags {
            if let Some(keys) = self.indexes.get_mut(tag) {
                keys.retain(|k| k != &entry.key);
                if keys.is_empty() {
                    self.indexes.remove(tag);
                }
            }
        }

        // Remove from type index
        if let Some(keys) = self.type_indexes.get_mut(&entry.entry_type) {
            keys.retain(|k| k != &entry.key);
            if keys.is_empty() {
                self.type_indexes.remove(&entry.entry_type);
            }
        }
    }

    fn evict_entries(&mut self) {
        // Simple LRU eviction strategy
        let mut entries_with_access: Vec<_> = self
            .entries
            .iter()
            .map(|(key, entry)| (key.clone(), entry.last_accessed, entry.value.len()))
            .collect();

        entries_with_access.sort_by(|a, b| a.1.cmp(&b.1));

        // Remove oldest entries until we have space
        let target_entries = self.max_entries * 3 / 4; // Remove 25% of entries
        let target_size = self.max_size_bytes * 3 / 4; // Remove 25% of size

        for (key, _, _) in entries_with_access
            .iter()
            .take((self.entries.len() - target_entries).max(0))
        {
            if self.current_size_bytes <= target_size {
                break;
            }
            self.delete(key);
        }
    }

    fn rebuild_indexes(&mut self) {
        self.indexes.clear();
        self.type_indexes.clear();

        let entries_clone: Vec<_> = self.entries.values().cloned().collect();
        for entry in entries_clone {
            self.add_to_indexes(&entry);
        }
    }

    fn recalculate_size(&mut self) {
        self.current_size_bytes = self.entries.values().map(|entry| entry.value.len()).sum();
    }
}
