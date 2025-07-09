import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
import {
  AIAnalyzer,
  PredictiveScaler,
  TaskComplexityAnalyzer,
  IntelligentRouter,
  ResourcePredictor,
  CostOptimizer,
  AIAnalysisResult,
  RiskAssessment,
  PredictiveScalingResult
} from '../intelligent-orchestration';

// Mock TensorFlow
jest.mock('@tensorflow/tfjs-node');
jest.mock('natural');

describe('AIAnalyzer', () => {
  let analyzer: AIAnalyzer;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      predict: jest.fn(),
      compile: jest.fn(),
      fit: jest.fn(),
      save: jest.fn()
    };

    (tf.sequential as jest.Mock).mockReturnValue(mockModel);
    (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);
    analyzer = new AIAnalyzer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeTaskComplexity', () => {
    it('should analyze task complexity successfully', async () => {
      const mockPrediction = {
        data: jest.fn().mockResolvedValue([0.1, 0.2, 0.7]) // high complexity
      };
      mockModel.predict.mockReturnValue(mockPrediction);

      const result = await analyzer.analyzeTaskComplexity(
        'implement complex authentication system',
        'production system with security requirements'
      );

      expect(result).toHaveProperty('analysisId');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('predictedOutcome');
      expect(result).toHaveProperty('riskAssessment');
      expect(result.confidence).toBe(0.7);
    });

    it('should throw error when model not loaded', async () => {
      const analyzerNotReady = new AIAnalyzer();
      // Force model to not be loaded
      (analyzerNotReady as any).isModelLoaded = false;

      await expect(
        analyzerNotReady.analyzeTaskComplexity('test task')
      ).rejects.toThrow('AI model not loaded');
    });

    it('should handle different complexity levels', async () => {
      const testCases = [
        { prediction: [0.8, 0.1, 0.1], expectedComplexity: 'low' },
        { prediction: [0.1, 0.8, 0.1], expectedComplexity: 'medium' },
        { prediction: [0.1, 0.1, 0.8], expectedComplexity: 'high' }
      ];

      for (const testCase of testCases) {
        const mockPrediction = {
          data: jest.fn().mockResolvedValue(testCase.prediction)
        };
        mockModel.predict.mockReturnValue(mockPrediction);

        const result = await analyzer.analyzeTaskComplexity('test task');
        expect(result.predictedOutcome.complexity).toBe(testCase.expectedComplexity);
      }
    });

    it('should assess risk correctly for high complexity tasks', async () => {
      const mockPrediction = {
        data: jest.fn().mockResolvedValue([0.1, 0.1, 0.8]) // high complexity
      };
      mockModel.predict.mockReturnValue(mockPrediction);

      const result = await analyzer.analyzeTaskComplexity(
        'critical production migrate refactor',
        'urgent production system'
      );

      expect(result.riskAssessment.riskLevel).toBe('high');
      expect(result.riskAssessment.riskFactors).toContain('High task complexity');
      expect(result.riskAssessment.riskFactors).toContain('Critical system changes');
    });

    it('should generate appropriate recommendations based on complexity', async () => {
      const mockPrediction = {
        data: jest.fn().mockResolvedValue([0.1, 0.8, 0.1]) // medium complexity
      };
      mockModel.predict.mockReturnValue(mockPrediction);

      const result = await analyzer.analyzeTaskComplexity('medium complexity task');

      expect(result.recommendations).toContain('Consider using 2-3 specialized agents');
      expect(result.recommendations).toContain('Break down into subtasks');
      expect(result.recommendations).toContain('Estimated completion time: 2-4 hours');
    });

    it('should handle various complexity levels', async () => {
      // Test low complexity
      const mockPredictionLow = {
        data: jest.fn().mockResolvedValue([0.8, 0.1, 0.1])
      };
      mockModel.predict.mockReturnValue(mockPredictionLow);
      
      const lowResult = await analyzer.analyzeTaskComplexity('simple task');
      expect(lowResult.riskAssessment.riskLevel).toBe('low');
      expect(lowResult.confidence).toBeGreaterThan(0);

      // Test medium complexity
      const mockPredictionMed = {
        data: jest.fn().mockResolvedValue([0.1, 0.8, 0.1])
      };
      mockModel.predict.mockReturnValue(mockPredictionMed);
      
      const medResult = await analyzer.analyzeTaskComplexity('medium task');
      expect(medResult.riskAssessment.riskLevel).toBe('medium');
      expect(medResult.confidence).toBeGreaterThan(0);
    });
  });

  describe('trainModel', () => {
    it('should train model with provided data', async () => {
      const trainingData = [
        { description: 'simple task', complexity: 'low' },
        { description: 'complex authentication system', complexity: 'high' }
      ];

      mockModel.fit.mockResolvedValue({ history: {} });

      await analyzer.trainModel(trainingData);

      expect(mockModel.fit).toHaveBeenCalledWith(
        expect.any(Object), // features tensor
        expect.any(Object), // labels tensor
        expect.objectContaining({
          epochs: 100,
          batchSize: 32,
          validationSplit: 0.2
        })
      );
    });

    it('should emit training progress events', async () => {
      const trainingData = [
        { description: 'test task', complexity: 'low' }
      ];

      const progressSpy = jest.fn();
      analyzer.on('training:progress', progressSpy);

      const mockCallbacks = {
        onEpochEnd: jest.fn()
      };

      mockModel.fit.mockImplementation(async (xs: any, ys: any, options: any) => {
        options.callbacks.onEpochEnd(1, { loss: 0.5, acc: 0.8 });
        return { history: {} };
      });

      await analyzer.trainModel(trainingData);

      expect(progressSpy).toHaveBeenCalledWith({
        epoch: 1,
        logs: { loss: 0.5, acc: 0.8 }
      });
    });
  });

  describe('saveModel and loadModel', () => {
    it('should save model to specified path', async () => {
      const testPath = '/test/path/model';
      mockModel.save.mockResolvedValue(undefined);

      await analyzer.saveModel(testPath);

      expect(mockModel.save).toHaveBeenCalledWith(`file://${testPath}`);
    });

    it('should load model from specified path', async () => {
      const testPath = '/test/path/model';
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      await analyzer.loadModel(testPath);

      expect(tf.loadLayersModel).toHaveBeenCalledWith(`file://${testPath}`);
    });
  });
});

describe('PredictiveScaler', () => {
  let scaler: PredictiveScaler;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      predict: jest.fn(),
      compile: jest.fn()
    };

    (tf.sequential as jest.Mock).mockReturnValue(mockModel);
    scaler = new PredictiveScaler();
  });

  describe('predictNeeds', () => {
    it('should predict scaling needs successfully', async () => {
      const mockPrediction = {
        data: jest.fn().mockResolvedValue([50.5]) // predicted load
      };
      mockModel.predict.mockReturnValue(mockPrediction);

      const historicalData = [
        { load: 30, timestamp: Date.now() - 3600000 },
        { load: 45, timestamp: Date.now() - 1800000 },
        { load: 60, timestamp: Date.now() }
      ];

      const result = await scaler.predictNeeds(historicalData, 60);

      expect(result).toHaveProperty('timeHorizon', 60);
      expect(result).toHaveProperty('predictedLoad');
      expect(result).toHaveProperty('recommendedAgents');
      expect(result).toHaveProperty('confidenceInterval');
      expect(result).toHaveProperty('scalingTriggers');
      expect(result).toHaveProperty('cost');
      expect(result.predictedLoad).toBe(50.5);
      expect(result.recommendedAgents).toBe(6); // Math.ceil(50.5 / 10)
    });

    it('should calculate confidence interval correctly', async () => {
      const mockPrediction = {
        data: jest.fn().mockResolvedValue([40])
      };
      mockModel.predict.mockReturnValue(mockPrediction);

      const historicalData = [
        { load: 35, actualLoad: 38, predictedLoad: 35 },
        { load: 45, actualLoad: 42, predictedLoad: 45 }
      ];

      const result = await scaler.predictNeeds(historicalData, 60);

      expect(result.confidenceInterval).toHaveProperty('min');
      expect(result.confidenceInterval).toHaveProperty('max');
      expect(result.confidenceInterval.min).toBeLessThan(result.predictedLoad);
      expect(result.confidenceInterval.max).toBeGreaterThan(result.predictedLoad);
    });

    it('should generate appropriate scaling triggers', async () => {
      const mockPrediction = {
        data: jest.fn().mockResolvedValue([80])
      };
      mockModel.predict.mockReturnValue(mockPrediction);

      const result = await scaler.predictNeeds([], 60);

      expect(result.scalingTriggers).toContain('Scale up when load exceeds 64.0');
      expect(result.scalingTriggers).toContain('Scale down when load drops below 24.0');
      expect(result.scalingTriggers).toContain('Maximum agents: 16');
      expect(result.scalingTriggers).toContain('Minimum agents: 4');
    });
  });
});

describe('TaskComplexityAnalyzer', () => {
  let analyzer: TaskComplexityAnalyzer;
  let mockAIAnalyzer: any;

  beforeEach(() => {
    analyzer = new TaskComplexityAnalyzer();
    mockAIAnalyzer = {
      analyzeTaskComplexity: jest.fn()
    };
    (analyzer as any).analyzer = mockAIAnalyzer;
  });

  describe('analyze', () => {
    it('should analyze task and return simplified result', async () => {
      const mockAnalysisResult = {
        confidence: 0.85,
        predictedOutcome: {
          complexity: 'medium',
          estimatedDuration: 240,
          requiredCapabilities: ['python', 'database']
        }
      };

      mockAIAnalyzer.analyzeTaskComplexity.mockResolvedValue(mockAnalysisResult);

      const task = {
        description: 'implement python database integration',
        context: 'web application',
        constraints: ['performance', 'security']
      };

      const result = await analyzer.analyze(task);

      expect(result).toEqual({
        complexity: 'medium',
        estimatedDuration: 240,
        requiredCapabilities: ['python', 'database'],
        taskType: 'implementation',
        confidence: 0.85
      });
    });

    it('should classify task types correctly', async () => {
      const mockAnalysisResult = {
        confidence: 0.8,
        predictedOutcome: {
          complexity: 'low',
          estimatedDuration: 60,
          requiredCapabilities: []
        }
      };

      mockAIAnalyzer.analyzeTaskComplexity.mockResolvedValue(mockAnalysisResult);

      const testCases = [
        { description: 'implement new feature', expectedType: 'implementation' },
        { description: 'test the application', expectedType: 'testing' },
        { description: 'optimize performance', expectedType: 'optimization' },
        { description: 'fix the bug', expectedType: 'maintenance' },
        { description: 'analyze the data', expectedType: 'analysis' },
        { description: 'random task', expectedType: 'general' }
      ];

      for (const testCase of testCases) {
        const result = await analyzer.analyze({
          description: testCase.description,
          context: 'test',
          constraints: []
        });

        expect(result.taskType).toBe(testCase.expectedType);
      }
    });
  });
});

describe('IntelligentRouter', () => {
  let router: IntelligentRouter;

  beforeEach(() => {
    router = new IntelligentRouter();
  });

  describe('selectOptimalAgent', () => {
    it('should select the best agent based on scoring', async () => {
      const params = {
        availableAgents: [
          {
            id: 'agent1',
            capabilities: ['python', 'database'],
            currentLoad: 30,
            performance: 85,
            type: 'specialist'
          },
          {
            id: 'agent2',
            capabilities: ['typescript', 'api'],
            currentLoad: 70,
            performance: 90,
            type: 'coordinator'
          },
          {
            id: 'agent3',
            capabilities: ['python', 'api', 'database'],
            currentLoad: 20,
            performance: 95,
            type: 'specialist'
          }
        ],
        requirements: ['python', 'database'],
        complexity: 'high'
      };

      const result = await router.selectOptimalAgent(params);

      expect(result).toHaveProperty('selectedAgent');
      expect(result).toHaveProperty('alternativeAgents');
      expect(result).toHaveProperty('selectionCriteria');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('loadBalancingRecommendation');
      expect(result).toHaveProperty('estimatedPerformance');
      expect(result).toHaveProperty('recommendations');

      // Agent3 should be selected (best capabilities, low load, high performance)
      expect(result.selectedAgent.id).toBe('agent3');
      expect(result.alternativeAgents).toHaveLength(2);
    });

    it('should generate load balancing recommendations', async () => {
      const params = {
        availableAgents: [
          { id: 'agent1', capabilities: ['python'], currentLoad: 90, performance: 80, type: 'specialist' },
          { id: 'agent2', capabilities: ['python'], currentLoad: 85, performance: 85, type: 'specialist' }
        ],
        requirements: ['python'],
        complexity: 'medium'
      };

      const result = await router.selectOptimalAgent(params);

      expect(result.loadBalancingRecommendation).toContain('Consider spawning additional agents');
    });

    it('should provide agent recommendations', async () => {
      const params = {
        availableAgents: [
          {
            id: 'agent1',
            capabilities: ['python'],
            currentLoad: 80,
            performance: 75,
            type: 'specialist'
          }
        ],
        requirements: ['python', 'database', 'api'],
        complexity: 'medium'
      };

      const result = await router.selectOptimalAgent(params);

      expect(result.recommendations).toContain('Consider training agent in: database, api');
      expect(result.recommendations).toContain('Monitor agent load closely during task execution');
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence correctly', async () => {
      const params = {
        selectedAgent: {
          capabilities: ['python', 'database'],
          currentLoad: 30
        },
        selectionCriteria: ['capability-match', 'load-balance']
      };

      const confidence = await router.calculateConfidence(params);

      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe('ResourcePredictor', () => {
  let predictor: ResourcePredictor;

  beforeEach(() => {
    predictor = new ResourcePredictor();
  });

  describe('predictResourceNeeds', () => {
    it('should predict resource needs for different environments', async () => {
      const params = {
        environment: 'python',
        workloadType: 'development',
        timeHorizon: 2
      };

      const result = await predictor.predictResourceNeeds(params);

      expect(result).toHaveProperty('resources');
      expect(result.resources).toHaveProperty('cpu');
      expect(result.resources).toHaveProperty('memory');
      expect(result.resources).toHaveProperty('disk');
      expect(result.resources).toHaveProperty('network');
      expect(result.resources.cpu).toBeGreaterThan(0);
      expect(result.resources.memory).toBeGreaterThan(0);
    });

    it('should scale resources based on time horizon', async () => {
      const baseParams = {
        environment: 'typescript',
        workloadType: 'development'
      };

      const shortTerm = await predictor.predictResourceNeeds({
        ...baseParams,
        timeHorizon: 1
      });

      const longTerm = await predictor.predictResourceNeeds({
        ...baseParams,
        timeHorizon: 10
      });

      expect(longTerm.resources.cpu).toBeGreaterThan(shortTerm.resources.cpu);
      expect(longTerm.resources.memory).toBeGreaterThan(shortTerm.resources.memory);
    });
  });

  describe('predictScalingNeeds', () => {
    it('should predict scaling needs based on historical data', async () => {
      const params = {
        currentResources: [
          { cpuUsage: 60, memoryUsage: 70, status: 'running' },
          { cpuUsage: 40, memoryUsage: 50, status: 'running' }
        ],
        historicalData: [
          { load: 65, actualLoad: 62, predictedLoad: 65 },
          { load: 70, actualLoad: 68, predictedLoad: 70 }
        ],
        timeHorizon: 4
      };

      const result = await predictor.predictScalingNeeds(params);

      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });
});

describe('CostOptimizer', () => {
  let optimizer: CostOptimizer;

  beforeEach(() => {
    optimizer = new CostOptimizer();
  });

  describe('optimizeResources', () => {
    it('should identify idle resources for shutdown', async () => {
      const params = {
        resources: [
          {
            workspaceId: 'ws1',
            cpuUsage: 5,
            memoryUsage: 20,
            status: 'running',
            cost: 10
          },
          {
            workspaceId: 'ws2',
            cpuUsage: 60,
            memoryUsage: 70,
            status: 'running',
            cost: 15
          }
        ]
      };

      const result = await optimizer.optimizeResources(params);

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('totalSavings');
      expect(result).toHaveProperty('implementationOrder');
      expect(result).toHaveProperty('monitoringPlan');

      const shutdownRecommendation = result.recommendations.find(
        (r: any) => r.action === 'shutdown'
      );
      expect(shutdownRecommendation).toBeDefined();
      expect(shutdownRecommendation.workspaceId).toBe('ws1');
    });

    it('should identify over-provisioned resources', async () => {
      const params = {
        resources: [
          {
            workspaceId: 'ws3',
            cpuUsage: 40,
            memoryUsage: 85,
            status: 'running',
            cost: 20
          }
        ]
      };

      const result = await optimizer.optimizeResources(params);

      const scaleDownRecommendation = result.recommendations.find(
        (r: any) => r.action === 'scale_down'
      );
      expect(scaleDownRecommendation).toBeDefined();
      expect(scaleDownRecommendation.reason).toBe('Over-provisioned memory');
    });

    it('should calculate total savings correctly', async () => {
      const params = {
        resources: [
          {
            workspaceId: 'ws1',
            cpuUsage: 5,
            memoryUsage: 20,
            status: 'running',
            cost: 10
          },
          {
            workspaceId: 'ws2',
            cpuUsage: 40,
            memoryUsage: 85,
            status: 'running',
            cost: 20
          }
        ]
      };

      const result = await optimizer.optimizeResources(params);

      // Should have shutdown savings (10 * 0.8 = 8) + scale down savings (20 * 0.3 = 6) = 14
      expect(result.totalSavings).toBe(14);
    });
  });

  // Additional tests for better branch coverage
  describe('Additional branch coverage tests', () => {
    let scaler: PredictiveScaler;

    beforeEach(() => {
      scaler = new PredictiveScaler();
    });

    it('should handle model loading errors in AIAnalyzer', async () => {
      const analyzer = new AIAnalyzer();
      
      // Simulate model loading error
      (tf.loadLayersModel as jest.Mock).mockRejectedValue(new Error('Load failed'));
      
      await expect(analyzer.loadModel('/invalid/path')).rejects.toThrow('Load failed');
    });

    it('should handle empty historical data in PredictiveScaler', async () => {
      const scaler = new PredictiveScaler();
      
      // Test with empty array
      const result = await scaler.predictNeeds([], 60);
      
      expect(result.timeHorizon).toBe(60);
      expect(result.predictedLoad).toBeDefined();
    });

    it('should handle edge cases in TaskComplexityAnalyzer', async () => {
      const analyzer = new TaskComplexityAnalyzer();
      
      // Test with very short task description
      const result = await analyzer.analyze({
        description: 'hi',
        context: 'test',
        constraints: []
      });
      
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.complexity).toBeDefined();
      expect(result.taskType).toBeDefined();
    });

    it('should handle empty agent list in IntelligentRouter', async () => {
      const router = new IntelligentRouter();
      
      const result = await router.selectOptimalAgent({ 
        availableAgents: [],
        requirements: [],
        complexity: 'medium'
      });
      
      expect(result.selectedAgent).toBeNull();
      expect(result.alternativeAgents).toHaveLength(0);
      expect(result.reason).toContain('No agents available');
    });

    it('should handle zero time horizon in ResourcePredictor', async () => {
      const predictor = new ResourcePredictor();
      
      const result = await predictor.predictResourceNeeds({ 
        environment: 'test-env',
        workloadType: 'development',
        timeHorizon: 0
      });
      
      expect(result).toHaveProperty('resources');
      expect(result.resources).toHaveProperty('cpu');
      expect(result.resources).toHaveProperty('memory');
    });

    it('should handle empty workspace list in CostOptimizer', async () => {
      const optimizer = new CostOptimizer();
      
      const params = {
        resources: [],
        workspaces: []
      };

      const result = await optimizer.optimizeResources(params);
      
      expect(result.totalSavings).toBe(0);
      expect(result.recommendations).toHaveLength(0);
    });


    it('should handle large historical dataset in PredictiveScaler', async () => {
      // Test with large dataset to cover different branches
      const largeHistoricalData = Array.from({ length: 30 }, (_, i) => ({
        load: 50,
        timestamp: Date.now() - (i * 1800000),
        actualLoad: 50,
        predictedLoad: 50
      }));
      
      const mockPrediction = {
        data: jest.fn().mockResolvedValue([80])
      };
      const mockScalerModel = {
        predict: jest.fn().mockReturnValue(mockPrediction)
      };
      (tf.sequential as jest.Mock).mockReturnValue(mockScalerModel);
      
      const result = await scaler.predictNeeds(largeHistoricalData, 120);
      
      expect(result.predictedLoad).toBe(80);
      expect(result.scalingTriggers.length).toBeGreaterThan(0);
      expect(result.confidenceInterval).toHaveProperty('min');
      expect(result.confidenceInterval).toHaveProperty('max');
    });
  });
});