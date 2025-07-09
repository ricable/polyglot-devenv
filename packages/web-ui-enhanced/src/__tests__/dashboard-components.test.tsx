import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import io from 'socket.io-client';

import { 
  EnhancedDashboard 
} from '../dashboard-components';

// Mock dependencies
jest.mock('socket.io-client');
jest.mock('antd', () => ({
  Card: ({ children, title }: any) => (
    <div data-testid="card" aria-label={title}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  ),
  Row: ({ children }: any) => <div data-testid="row">{children}</div>,
  Col: ({ children }: any) => <div data-testid="col">{children}</div>,
  Statistic: ({ title, value, suffix, valueStyle }: any) => (
    <div data-testid="statistic">
      <div data-testid="statistic-title">{title}</div>
      <div data-testid="statistic-value" style={valueStyle}>
        {value}{suffix}
      </div>
    </div>
  ),
  Progress: ({ percent, status }: any) => (
    <div data-testid="progress" data-percent={percent} data-status={status}>
      Progress: {percent}%
    </div>
  ),
  Timeline: ({ items }: any) => (
    <div data-testid="timeline">
      {items.map((item: any, index: number) => (
        <div key={index} data-testid="timeline-item">
          {item.children}
        </div>
      ))}
    </div>
  ),
  Alert: ({ type, message, showIcon }: any) => (
    <div data-testid="alert" data-type={type} data-show-icon={showIcon}>
      {message}
    </div>
  )
}));

jest.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-entries={data?.length || 0}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, name }: any) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} data-name={name} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-entries={data?.length || 0}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, fill }: any) => (
    <div data-testid="bar" data-key={dataKey} data-fill={fill} />
  )
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, ...props }: any) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => (
    <div data-testid="animate-presence">{children}</div>
  )
}));

jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => (
    <div data-testid="three-canvas">{children}</div>
  )
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Text: ({ children, ...props }: any) => (
    <div data-testid="three-text" {...props}>
      {children}
    </div>
  )
}));

// Mock coordination-enhanced types
const mockSwarmStatus = {
  activeAgents: 5,
  totalTasks: 20,
  completedTasks: 15,
  failedTasks: 1,
  averageResponseTime: 250,
  resourceUtilization: 65,
  uptime: 3600000, // 1 hour
  coordinatorId: 'coord-123'
};

const mockAgents = [
  {
    agentId: 'agent-1',
    name: 'Python Specialist',
    type: 'specialist',
    status: 'active',
    capabilities: ['python', 'data-processing'],
    currentLoad: 30
  },
  {
    agentId: 'agent-2',
    name: 'TypeScript Developer',
    type: 'specialist',
    status: 'busy',
    capabilities: ['typescript', 'web-development'],
    currentLoad: 80
  },
  {
    agentId: 'agent-3',
    name: 'General Assistant',
    type: 'generalist',
    status: 'idle',
    capabilities: ['general', 'documentation'],
    currentLoad: 10
  }
];

const mockTasks = [
  {
    taskId: 'task-1',
    name: 'Data Processing Task',
    type: 'data-processing',
    status: 'completed',
    priority: 5,
    assignedAgent: 'agent-1',
    progress: 100,
    estimatedDuration: 300,
    actualDuration: 280
  },
  {
    taskId: 'task-2',
    name: 'Web Development Task',
    type: 'web-development',
    status: 'in_progress',
    priority: 3,
    assignedAgent: 'agent-2',
    progress: 60,
    estimatedDuration: 600,
    actualDuration: null
  },
  {
    taskId: 'task-3',
    name: 'Documentation Task',
    type: 'documentation',
    status: 'pending',
    priority: 1,
    assignedAgent: null,
    progress: 0,
    estimatedDuration: 120,
    actualDuration: null
  }
];

const mockEvents = [
  {
    eventId: 'event-1',
    type: 'task_completed',
    timestamp: Date.now() - 60000,
    data: {
      taskId: 'task-1',
      name: 'Data Processing Task',
      agentId: 'agent-1'
    }
  },
  {
    eventId: 'event-2',
    type: 'agent_spawned',
    timestamp: Date.now() - 30000,
    data: {
      agentId: 'agent-3',
      name: 'General Assistant'
    }
  },
  {
    eventId: 'event-3',
    type: 'task_assigned',
    timestamp: Date.now() - 10000,
    data: {
      taskId: 'task-2',
      name: 'Web Development Task',
      agentId: 'agent-2'
    }
  }
];

describe('EnhancedDashboard', () => {
  let mockSocket: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock socket
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      close: jest.fn(),
      disconnect: jest.fn()
    };

    (io as jest.MockedFunction<typeof io>).mockReturnValue(mockSocket);
    
    // Setup default socket event handlers
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      if (event === 'swarm:status') {
        setTimeout(() => handler(mockSwarmStatus), 100);
      } else if (event === 'agents:updated') {
        setTimeout(() => handler(mockAgents), 100);
      } else if (event === 'tasks:updated') {
        setTimeout(() => handler(mockTasks), 100);
      } else if (event === 'events:new') {
        setTimeout(() => handler(mockEvents), 100);
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization and connection', () => {
    it('should render loading state initially', () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);
      
      expect(screen.getByText('Loading Swarm Dashboard...')).toBeInTheDocument();
    });

    it('should establish socket connection with correct URL', () => {
      const websocketUrl = 'ws://localhost:3001';
      render(<EnhancedDashboard websocketUrl={websocketUrl} />);

      expect(io).toHaveBeenCalledWith(websocketUrl);
    });

    it('should set up event listeners on socket', () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      expect(mockSocket.on).toHaveBeenCalledWith('swarm:status', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('agents:updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('tasks:updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('events:new', expect.any(Function));
    });

    it('should close socket connection on unmount', () => {
      const { unmount } = render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      unmount();

      expect(mockSocket.close).toHaveBeenCalled();
    });
  });

  describe('dashboard rendering', () => {
    beforeEach(async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);
      
      // Wait for socket events to trigger
      await waitFor(() => {
        expect(screen.queryByText('Loading Swarm Dashboard...')).not.toBeInTheDocument();
      });
    });

    it('should render main statistics cards', async () => {
      await waitFor(() => {
        expect(screen.getByText('Active Agents')).toBeInTheDocument();
        expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
        expect(screen.getByText('Response Time')).toBeInTheDocument();
        expect(screen.getByText('Resource Usage')).toBeInTheDocument();
      });
    });

    it('should display correct statistic values', async () => {
      await waitFor(() => {
        const statistics = screen.getAllByTestId('statistic-value');
        expect(statistics).toHaveLength(4);
        
        // Check that values are rendered
        expect(screen.getByText('5')).toBeInTheDocument(); // Active agents
        expect(screen.getByText('15/ 20')).toBeInTheDocument(); // Completed/total tasks
        expect(screen.getByText('250ms')).toBeInTheDocument(); // Response time
        expect(screen.getByText('65%')).toBeInTheDocument(); // Resource usage
      });
    });

    it('should render agent network visualization', async () => {
      await waitFor(() => {
        expect(screen.getByText('Agent Network Visualization')).toBeInTheDocument();
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });
    });

    it('should render recent events timeline', async () => {
      await waitFor(() => {
        expect(screen.getByText('Recent Events')).toBeInTheDocument();
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });
    });

    it('should render performance analytics chart', async () => {
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should render resource utilization chart', async () => {
      await waitFor(() => {
        expect(screen.getByText('Resource Utilization')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('real-time data updates', () => {
    it('should update metrics history when receiving swarm status', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Trigger another status update
      act(() => {
        const statusHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'swarm:status'
        )?.[1];
        
        if (statusHandler) {
          statusHandler({
            ...mockSwarmStatus,
            activeAgents: 6,
            completedTasks: 16
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('16/ 20')).toBeInTheDocument();
      });
    });

    it('should update agent visualization when agents change', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });

      // Trigger agent update
      act(() => {
        const agentsHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'agents:updated'
        )?.[1];
        
        if (agentsHandler) {
          agentsHandler([
            ...mockAgents,
            {
              agentId: 'agent-4',
              name: 'New Specialist',
              type: 'specialist',
              status: 'active',
              capabilities: ['rust', 'systems'],
              currentLoad: 20
            }
          ]);
        }
      });

      // Should re-render the visualization
      await waitFor(() => {
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
      });
    });

    it('should update timeline when new events arrive', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      // Trigger new events
      act(() => {
        const eventsHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'events:new'
        )?.[1];
        
        if (eventsHandler) {
          eventsHandler([
            {
              eventId: 'event-4',
              type: 'task_failed',
              timestamp: Date.now(),
              data: {
                taskId: 'task-4',
                name: 'Failed Task',
                error: 'Timeout'
              }
            }
          ]);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('TASK FAILED')).toBeInTheDocument();
      });
    });
  });

  describe('predictive alerts', () => {
    it('should show warning alert for high resource utilization', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      // Update with high resource utilization
      act(() => {
        const statusHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'swarm:status'
        )?.[1];
        
        if (statusHandler) {
          statusHandler({
            ...mockSwarmStatus,
            resourceUtilization: 85
          });
        }
      });

      await waitFor(() => {
        const alert = screen.getByTestId('alert');
        expect(alert).toHaveAttribute('data-type', 'warning');
        expect(alert).toHaveTextContent('High resource utilization: 85.0%');
      });
    });

    it('should show error alert for high response time', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      act(() => {
        const statusHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'swarm:status'
        )?.[1];
        
        if (statusHandler) {
          statusHandler({
            ...mockSwarmStatus,
            averageResponseTime: 6000
          });
        }
      });

      await waitFor(() => {
        const alert = screen.getByTestId('alert');
        expect(alert).toHaveAttribute('data-type', 'error');
        expect(alert).toHaveTextContent('High response time: 6000ms');
      });
    });

    it('should show error alert for failed tasks', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      act(() => {
        const statusHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'swarm:status'
        )?.[1];
        
        if (statusHandler) {
          statusHandler({
            ...mockSwarmStatus,
            failedTasks: 3
          });
        }
      });

      await waitFor(() => {
        const alert = screen.getByTestId('alert');
        expect(alert).toHaveAttribute('data-type', 'error');
        expect(alert).toHaveTextContent('3 failed tasks detected');
      });
    });

    it('should not show alerts when metrics are normal', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      await waitFor(() => {
        expect(screen.getByTestId('statistic-value')).toBeInTheDocument();
      });

      // Should not have any alerts for normal metrics
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    });
  });

  describe('visual styling and responsive behavior', () => {
    it('should apply correct color styling for good metrics', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      await waitFor(() => {
        const responseTimeValue = screen.getByText('250ms');
        expect(responseTimeValue.closest('[data-testid="statistic-value"]'))
          .toHaveStyle('color: #3f8600');
        
        const resourceUsageValue = screen.getByText('65%');
        expect(resourceUsageValue.closest('[data-testid="statistic-value"]'))
          .toHaveStyle('color: #3f8600');
      });
    });

    it('should apply warning color styling for poor metrics', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      act(() => {
        const statusHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'swarm:status'
        )?.[1];
        
        if (statusHandler) {
          statusHandler({
            ...mockSwarmStatus,
            averageResponseTime: 6000,
            resourceUtilization: 85
          });
        }
      });

      await waitFor(() => {
        const responseTimeValue = screen.getByText('6000ms');
        expect(responseTimeValue.closest('[data-testid="statistic-value"]'))
          .toHaveStyle('color: #cf1322');
        
        const resourceUsageValue = screen.getByText('85%');
        expect(resourceUsageValue.closest('[data-testid="statistic-value"]'))
          .toHaveStyle('color: #cf1322');
      });
    });

    it('should set progress bar status based on resource utilization', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      await waitFor(() => {
        const progress = screen.getByTestId('progress');
        expect(progress).toHaveAttribute('data-percent', '65');
        expect(progress).toHaveAttribute('data-status', 'normal');
      });

      // Update with high utilization
      act(() => {
        const statusHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'swarm:status'
        )?.[1];
        
        if (statusHandler) {
          statusHandler({
            ...mockSwarmStatus,
            resourceUtilization: 85
          });
        }
      });

      await waitFor(() => {
        const progress = screen.getByTestId('progress');
        expect(progress).toHaveAttribute('data-percent', '85');
        expect(progress).toHaveAttribute('data-status', 'exception');
      });
    });
  });

  describe('configuration and props', () => {
    it('should use custom refresh interval when provided', () => {
      const customInterval = 10000;
      render(
        <EnhancedDashboard 
          websocketUrl="ws://localhost:3000" 
          refreshInterval={customInterval}
        />
      );

      // Verify component renders (refresh interval is used internally)
      expect(screen.getByText('Loading Swarm Dashboard...')).toBeInTheDocument();
    });

    it('should handle different websocket URLs', () => {
      const customUrl = 'ws://custom-host:4000';
      render(<EnhancedDashboard websocketUrl={customUrl} />);

      expect(io).toHaveBeenCalledWith(customUrl);
    });
  });

  describe('error handling', () => {
    it('should handle socket connection errors gracefully', () => {
      const mockErrorSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn()
      };

      // Mock connection error
      mockErrorSocket.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'connect_error') {
          setTimeout(() => handler(new Error('Connection failed')), 100);
        }
      });

      (io as jest.MockedFunction<typeof io>).mockReturnValue(mockErrorSocket);

      render(<EnhancedDashboard websocketUrl="ws://invalid:3000" />);

      // Should still render loading state without crashing
      expect(screen.getByText('Loading Swarm Dashboard...')).toBeInTheDocument();
    });

    it('should handle malformed data gracefully', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      // Send malformed status data
      act(() => {
        const statusHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'swarm:status'
        )?.[1];
        
        if (statusHandler) {
          statusHandler(null); // Invalid data
        }
      });

      // Should not crash and maintain loading state
      expect(screen.getByText('Loading Swarm Dashboard...')).toBeInTheDocument();
    });

    it('should limit metrics history to prevent memory leaks', async () => {
      render(<EnhancedDashboard websocketUrl="ws://localhost:3000" />);

      // Send multiple status updates to test history limiting
      for (let i = 0; i < 60; i++) {
        act(() => {
          const statusHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'swarm:status'
          )?.[1];
          
          if (statusHandler) {
            statusHandler({
              ...mockSwarmStatus,
              completedTasks: i
            });
          }
        });
      }

      await waitFor(() => {
        // Should limit to 50 entries (check via line chart data)
        const lineChart = screen.getByTestId('line-chart');
        expect(lineChart).toHaveAttribute('data-entries', '51'); // 50 + 1 initial
      });
    });
  });
});