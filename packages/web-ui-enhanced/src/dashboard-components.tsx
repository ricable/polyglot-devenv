/**
 * Enhanced Dashboard Components
 * Building on existing claude-flow web UI backend with advanced visualization
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Statistic, Progress, Timeline, Alert } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import io from 'socket.io-client';

// Import types from coordination-enhanced
import type { SwarmStatus, AgentInfo, TaskInfo, CoordinationEvent } from '@swarm-flow/coordination-enhanced';

interface DashboardProps {
  websocketUrl: string;
  refreshInterval?: number;
}

interface RealTimeMetrics {
  timestamp: string;
  activeAgents: number;
  completedTasks: number;
  averageResponseTime: number;
  resourceUtilization: number;
  errorRate: number;
  throughput: number;
}

interface AgentVisualizationProps {
  agents: AgentInfo[];
  tasks: TaskInfo[];
}

const AgentNetworkVisualization: React.FC<AgentVisualizationProps> = ({ agents, tasks }) => {
  const getAgentColor = (status: string) => {
    switch (status) {
      case 'active': return '#52c41a';
      case 'busy': return '#faad14';
      case 'idle': return '#1890ff';
      case 'error': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableZoom enablePan enableRotate />
      
      {agents.map((agent, index) => {
        const angle = (index / agents.length) * Math.PI * 2;
        const radius = 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <group key={agent.agentId} position={[x, y, 0]}>
            <mesh>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color={getAgentColor(agent.status)} />
            </mesh>
            <Text
              position={[0, -1, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {agent.name}
            </Text>
          </group>
        );
      })}
      
      {/* Task connections */}
      {tasks.filter(t => t.assignedAgent).map((task) => {
        const agentIndex = agents.findIndex(a => a.agentId === task.assignedAgent);
        if (agentIndex === -1) return null;
        
        const angle = (agentIndex / agents.length) * Math.PI * 2;
        const radius = 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <line key={task.taskId}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array([0, 0, 0, x, y, 0])}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={task.status === 'completed' ? '#52c41a' : '#faad14'} />
          </line>
        );
      })}
    </Canvas>
  );
};

const PerformanceMetricsChart: React.FC<{ data: RealTimeMetrics[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="activeAgents" 
          stroke="#8884d8" 
          name="Active Agents"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="completedTasks" 
          stroke="#82ca9d" 
          name="Completed Tasks"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="averageResponseTime" 
          stroke="#ffc658" 
          name="Response Time (ms)"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="resourceUtilization" 
          stroke="#ff7300" 
          name="Resource Utilization (%)"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const ResourceUtilizationChart: React.FC<{ data: RealTimeMetrics[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data.slice(-20)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="resourceUtilization" fill="#1890ff" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const TaskTimeline: React.FC<{ events: CoordinationEvent[] }> = ({ events }) => {
  const timelineItems = events.slice(-10).map((event, index) => ({
    children: (
      <div>
        <strong>{event.type.replace('_', ' ').toUpperCase()}</strong>
        <br />
        <small>{new Date(event.timestamp).toLocaleTimeString()}</small>
        {event.data.name && <div>Task: {event.data.name}</div>}
        {event.data.agentId && <div>Agent: {event.data.agentId}</div>}
      </div>
    ),
    color: index === 0 ? 'green' : 'blue'
  }));

  return <Timeline items={timelineItems} />;
};

const PredictiveAlerts: React.FC<{ swarmStatus: SwarmStatus }> = ({ swarmStatus }) => {
  const [alerts, setAlerts] = useState<Array<{ type: 'warning' | 'error' | 'info', message: string }>>([]);

  useEffect(() => {
    const newAlerts = [];
    
    if (swarmStatus.resourceUtilization > 80) {
      newAlerts.push({
        type: 'warning' as const,
        message: `High resource utilization: ${swarmStatus.resourceUtilization.toFixed(1)}%`
      });
    }
    
    if (swarmStatus.averageResponseTime > 5000) {
      newAlerts.push({
        type: 'error' as const,
        message: `High response time: ${swarmStatus.averageResponseTime.toFixed(0)}ms`
      });
    }
    
    if (swarmStatus.failedTasks > 0) {
      newAlerts.push({
        type: 'error' as const,
        message: `${swarmStatus.failedTasks} failed tasks detected`
      });
    }
    
    setAlerts(newAlerts);
  }, [swarmStatus]);

  return (
    <AnimatePresence>
      {alerts.map((alert, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Alert
            type={alert.type}
            message={alert.message}
            showIcon
            style={{ marginBottom: 8 }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export const EnhancedDashboard: React.FC<DashboardProps> = ({ 
  websocketUrl, 
  refreshInterval = 5000 
}) => {
  const [swarmStatus, setSwarmStatus] = useState<SwarmStatus | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [events, setEvents] = useState<CoordinationEvent[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<RealTimeMetrics[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(websocketUrl);
    setSocket(newSocket);

    newSocket.on('swarm:status', (status: SwarmStatus) => {
      setSwarmStatus(status);
      
      // Add to metrics history
      const metrics: RealTimeMetrics = {
        timestamp: new Date().toLocaleTimeString(),
        activeAgents: status.activeAgents,
        completedTasks: status.completedTasks,
        averageResponseTime: status.averageResponseTime,
        resourceUtilization: status.resourceUtilization,
        errorRate: status.failedTasks / (status.totalTasks || 1),
        throughput: status.completedTasks / (status.uptime / 1000 / 60) // tasks per minute
      };
      
      setMetricsHistory(prev => [...prev.slice(-50), metrics]);
    });

    newSocket.on('agents:updated', (agentList: AgentInfo[]) => {
      setAgents(agentList);
    });

    newSocket.on('tasks:updated', (taskList: TaskInfo[]) => {
      setTasks(taskList);
    });

    newSocket.on('events:new', (newEvents: CoordinationEvent[]) => {
      setEvents(prev => [...prev, ...newEvents].slice(-100));
    });

    return () => {
      newSocket.close();
    };
  }, [websocketUrl]);

  const setupAgentVisualization = useCallback(() => {
    return (
      <Card title="Agent Network Visualization" style={{ height: 400 }}>
        <AgentNetworkVisualization agents={agents} tasks={tasks} />
      </Card>
    );
  }, [agents, tasks]);

  const setupPerformanceAnalytics = useCallback(() => {
    return (
      <Card title="Performance Analytics">
        <PerformanceMetricsChart data={metricsHistory} />
      </Card>
    );
  }, [metricsHistory]);

  const setupResourceMonitoring = useCallback(() => {
    return (
      <Card title="Resource Utilization">
        <ResourceUtilizationChart data={metricsHistory} />
      </Card>
    );
  }, [metricsHistory]);

  const setupPredictiveAlerts = useCallback(() => {
    return swarmStatus ? <PredictiveAlerts swarmStatus={swarmStatus} /> : null;
  }, [swarmStatus]);

  if (!swarmStatus) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>Loading Swarm Dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {setupPredictiveAlerts()}
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Agents"
              value={swarmStatus.activeAgents}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed Tasks"
              value={swarmStatus.completedTasks}
              suffix={`/ ${swarmStatus.totalTasks}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Response Time"
              value={swarmStatus.averageResponseTime}
              suffix="ms"
              valueStyle={{ color: swarmStatus.averageResponseTime > 5000 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Resource Usage"
              value={swarmStatus.resourceUtilization}
              suffix="%"
              valueStyle={{ color: swarmStatus.resourceUtilization > 80 ? '#cf1322' : '#3f8600' }}
            />
            <Progress 
              percent={swarmStatus.resourceUtilization} 
              showInfo={false}
              status={swarmStatus.resourceUtilization > 80 ? 'exception' : 'normal'}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          {setupAgentVisualization()}
        </Col>
        <Col span={12}>
          <Card title="Recent Events">
            <TaskTimeline events={events} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={16}>
          {setupPerformanceAnalytics()}
        </Col>
        <Col span={8}>
          {setupResourceMonitoring()}
        </Col>
      </Row>
    </div>
  );
};

export default EnhancedDashboard;