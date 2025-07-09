import { AIEnhancedMCPServer } from '../ai-tools';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}));

describe('AIEnhancedMCPServer', () => {
  let server: AIEnhancedMCPServer;

  beforeEach(() => {
    server = new AIEnhancedMCPServer();
  });

  describe('constructor', () => {
    it('should initialize AI components', () => {
      expect(server).toBeInstanceOf(AIEnhancedMCPServer);
    });
  });

  describe('getAITools', () => {
    it('should return all AI tools', () => {
      const tools = server.getAITools();
      
      expect(tools).toHaveLength(6);
      expect(tools[0].name).toBe('ai_task_analyze');
      expect(tools[1].name).toBe('ai_agent_select');
      expect(tools[2].name).toBe('ai_resource_predict');
      expect(tools[3].name).toBe('ai_optimize_recommend');
      expect(tools[4].name).toBe('ai_context_enhance');
      expect(tools[5].name).toBe('ai_code_analyze');
    });

    it('should have proper tool descriptions', () => {
      const tools = server.getAITools();
      
      tools.forEach(tool => {
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(0);
        expect(tool.inputSchema).toBeDefined();
      });
    });
  });

  describe('analyzeTaskWithAI', () => {
    const validTaskParams = {
      taskDescription: 'Analyze user data patterns and create visualization',
      context: 'E-commerce platform with 1M+ users',
      constraints: ['privacy_compliant', 'real_time'],
      environment: 'python'
    };

    it('should analyze task complexity successfully', async () => {
      const result = await server.analyzeTaskWithAI(validTaskParams);

      expect(result).toHaveProperty('analysisId');
      expect(result).toHaveProperty('taskComplexity');
      expect(result).toHaveProperty('estimatedDuration');
      expect(result).toHaveProperty('requiredCapabilities');
      expect(result).toHaveProperty('recommendedAgentType');
      expect(result).toHaveProperty('recommendedAgentCount');
      expect(result).toHaveProperty('resourceRequirements');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('successProbability');
    });

    it('should handle task analysis with minimal parameters', async () => {
      const minimalParams = {
        taskDescription: 'Simple data processing task'
      };

      const result = await server.analyzeTaskWithAI(minimalParams);

      expect(result.analysisId).toBe('test-uuid-1234');
      expect(result.taskComplexity).toBe('medium');
      expect(result.recommendedAgentType).toBe('specialist');
      expect(result.successProbability).toBe(0.8);
    });

    it('should provide comprehensive resource requirements', async () => {
      const result = await server.analyzeTaskWithAI(validTaskParams);

      expect(result.resourceRequirements).toHaveProperty('cpu');
      expect(result.resourceRequirements).toHaveProperty('memory');
      expect(result.resourceRequirements).toHaveProperty('storage');
      expect(result.resourceRequirements).toHaveProperty('network');
    });

    it('should include risk assessment', async () => {
      const result = await server.analyzeTaskWithAI(validTaskParams);

      expect(result.risks).toBeDefined();
      expect(Array.isArray(result.risks)).toBe(true);
      expect(result.mitigationStrategies).toBeDefined();
      expect(Array.isArray(result.mitigationStrategies)).toBe(true);
    });
  });

  describe('selectOptimalAgent', () => {
    const validAgentSelectionParams = {
      taskRequirements: ['python', 'data_analysis', 'visualization'],
      taskComplexity: 'medium' as const,
      availableAgents: [
        {
          id: 'agent-1',
          type: 'specialist',
          capabilities: ['python', 'data_analysis', 'visualization'],
          currentLoad: 30,
          performance: 0.9
        },
        {
          id: 'agent-2',
          type: 'generalist',
          capabilities: ['python', 'general'],
          currentLoad: 60,
          performance: 0.7
        }
      ]
    };

    it('should select optimal agent successfully', async () => {
      const result = await server.selectOptimalAgent(validAgentSelectionParams);

      expect(result).toHaveProperty('selectedAgent');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('selectionReason');
      expect(result.selectedAgent.id).toBe('agent-1');
      expect(result.confidenceScore).toBe(0.9);
    });

    it('should handle empty agent list', async () => {
      const emptyAgentParams = {
        ...validAgentSelectionParams,
        availableAgents: []
      };

      await expect(server.selectOptimalAgent(emptyAgentParams))
        .rejects.toThrow('No agents available for selection');
    });
  });

  describe('generateOptimizations', () => {
    const validOptimizationParams = {
      currentMetrics: {
        activeAgents: 5,
        completedTasks: 100,
        averageResponseTime: 300,
        resourceUtilization: 75,
        errorRate: 0.02
      },
      optimizationGoals: ['performance', 'cost'] as ('performance' | 'cost' | 'reliability' | 'scalability')[]
    };

    it('should generate optimization recommendations successfully', async () => {
      const result = await server.generateOptimizations(validOptimizationParams);

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('currentScore');
      expect(result).toHaveProperty('potentialImprovement');
      expect(result).toHaveProperty('implementationPlan');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle different optimization goals', async () => {
      const performanceOnlyParams = {
        currentMetrics: validOptimizationParams.currentMetrics,
        optimizationGoals: ['performance'] as ('performance' | 'cost' | 'reliability' | 'scalability')[]
      };

      const result = await server.generateOptimizations(performanceOnlyParams);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});