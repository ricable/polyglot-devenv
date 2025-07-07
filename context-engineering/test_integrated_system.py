#!/usr/bin/env python3
"""
Comprehensive test suite for the integrated PRP system.
Tests both version control (Issue #6) and scalability (Issue #8) implementations.
"""

import unittest
import asyncio
import tempfile
import shutil
import json
from pathlib import Path
from unittest.mock import Mock, patch

# Import our systems
from lib.version_control_system import (
    PRPVersionManager, ExecutionStateManager, PRPMemento,
    FileSystemObserver, MetricsObserver, create_version_control_system
)
from lib.scalability_system import (
    ScalablePRPSystem, TaskRequest, TaskResult, ComponentType, Priority,
    PRPGeneratorComponent, PRPExecutorComponent, ValidationComponent,
    ComponentFactory, PRPMediator
)
from lib.integrated_prp_system import IntegratedPRPSystem


class TestVersionControlSystem(unittest.TestCase):
    """Test suite for Issue #6: Version Control (Memento/Observer patterns)."""
    
    def setUp(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.version_manager = PRPVersionManager(storage_path=self.temp_dir)
        self.execution_manager = ExecutionStateManager(self.version_manager)
        
    def tearDown(self):
        """Clean up test environment."""
        shutil.rmtree(self.temp_dir)
    
    def test_memento_creation(self):
        """Test PRPMemento creation and serialization."""
        content = "Test PRP content"
        metadata = {"author": "test", "complexity": "simple"}
        
        memento = PRPMemento.create("test-prp", content, metadata)
        
        self.assertIsNotNone(memento.version_id)
        self.assertIsNotNone(memento.timestamp)
        self.assertEqual(memento.prp_name, "test-prp")
        self.assertEqual(memento.content, content)
        self.assertEqual(memento.metadata, metadata)
        self.assertIsNotNone(memento.checksum)
        
        # Test serialization
        memento_dict = memento.to_dict()
        restored_memento = PRPMemento.from_dict(memento_dict)
        
        self.assertEqual(memento.version_id, restored_memento.version_id)
        self.assertEqual(memento.content, restored_memento.content)
    
    def test_version_saving_and_restoration(self):
        """Test saving and restoring PRP versions."""
        content1 = "Initial PRP content"
        content2 = "Modified PRP content"
        
        # Save first version
        memento1 = self.version_manager.save_version("test-prp", content1, {"version": 1})
        self.assertIsNotNone(memento1)
        
        # Save second version
        memento2 = self.version_manager.save_version("test-prp", content2, {"version": 2})
        self.assertIsNotNone(memento2)
        self.assertNotEqual(memento1.version_id, memento2.version_id)
        
        # List versions
        versions = self.version_manager.list_versions("test-prp")
        self.assertEqual(len(versions), 2)
        self.assertEqual(versions[0]["version_id"], memento2.version_id)  # Newest first
        
        # Restore first version
        restored = self.version_manager.restore_version("test-prp", memento1.version_id)
        self.assertIsNotNone(restored)
        self.assertEqual(restored.content, content1)
    
    def test_observer_pattern(self):
        """Test Observer pattern implementation."""
        # Create mock observers
        observer1 = Mock()
        observer2 = Mock()
        
        self.version_manager.add_observer(observer1)
        self.version_manager.add_observer(observer2)
        
        # Save version should notify observers
        self.version_manager.save_version("test-prp", "content", {})
        
        # Check that both observers were notified
        observer1.notify.assert_called_once()
        observer2.notify.assert_called_once()
        
        # Check event type and data
        args1 = observer1.notify.call_args[0]
        self.assertEqual(args1[0], "version_saved")
        self.assertIn("prp_name", args1[1])
        self.assertEqual(args1[1]["prp_name"], "test-prp")
    
    def test_file_system_observer(self):
        """Test FileSystemObserver implementation."""
        log_file = Path(self.temp_dir) / "test.log"
        observer = FileSystemObserver(str(log_file))
        
        self.version_manager.add_observer(observer)
        
        # Generate some events
        self.version_manager.save_version("test-prp", "content", {})
        
        # Check log file was created and contains events
        self.assertTrue(log_file.exists())
        log_content = log_file.read_text()
        self.assertIn("version_saved", log_content)
        self.assertIn("test-prp", log_content)
    
    def test_metrics_observer(self):
        """Test MetricsObserver implementation."""
        observer = MetricsObserver()
        self.version_manager.add_observer(observer)
        
        # Generate events
        self.version_manager.save_version("test-prp", "content", {})
        memento = self.version_manager.save_version("test-prp", "content2", {})
        self.version_manager.restore_version("test-prp", memento.version_id)
        
        metrics = observer.get_metrics()
        self.assertEqual(metrics["versions_saved"], 2)
        self.assertEqual(metrics["versions_restored"], 1)
        self.assertIsNotNone(metrics["last_activity"])
    
    def test_execution_state_management(self):
        """Test execution state management."""
        execution_data = {
            "status": "success",
            "tasks_completed": 5,
            "validation_results": {"lint": "pass", "test": "pass"},
            "performance_metrics": {"execution_time": 2.5}
        }
        
        exec_id = self.execution_manager.save_execution_state("test-prp", execution_data)
        self.assertIsNotNone(exec_id)
        
        # Get execution history
        history = self.execution_manager.get_execution_history("test-prp")
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["status"], "success")
        self.assertEqual(history[0]["tasks_completed"], 5)


class TestScalabilitySystem(unittest.IsolatedAsyncioTestCase):
    """Test suite for Issue #8: Scalability (Mediator/Factory patterns)."""
    
    async def asyncSetUp(self):
        """Set up async test environment."""
        self.mediator = PRPMediator(max_workers=2)
        self.system = ScalablePRPSystem(max_workers=2)
        
    async def asyncTearDown(self):
        """Clean up async test environment."""
        if hasattr(self, 'mediator'):
            self.mediator.stop()
        if hasattr(self, 'system'):
            self.system.shutdown()
    
    async def test_component_factory(self):
        """Test ComponentFactory pattern implementation."""
        # Test registered types
        types = ComponentFactory.get_registered_types()
        self.assertIn("prp_generator", types)
        self.assertIn("prp_executor", types)
        self.assertIn("validator", types)
        
        # Test component creation
        generator = ComponentFactory.create_component(
            "prp_generator", "test_gen", self.mediator
        )
        self.assertIsNotNone(generator)
        self.assertIsInstance(generator, PRPGeneratorComponent)
        self.assertEqual(generator.component_id, "test_gen")
        
        # Test unknown type
        unknown = ComponentFactory.create_component("unknown_type", "test", self.mediator)
        self.assertIsNone(unknown)
    
    async def test_mediator_pattern(self):
        """Test PRPMediator pattern implementation."""
        # Create and register components
        generator = PRPGeneratorComponent("gen1", self.mediator)
        executor = PRPExecutorComponent("exec1", self.mediator)
        validator = ValidationComponent("val1", self.mediator)
        
        self.mediator.register_component(generator)
        self.mediator.register_component(executor)
        self.mediator.register_component(validator)
        
        # Test component registration
        self.assertEqual(len(self.mediator.components), 3)
        self.assertIn("gen1", self.mediator.components)
        
        # Test finding capable components
        found_gen = self.mediator.find_capable_component("generate_prp", ComponentType.GENERATOR)
        self.assertIsNotNone(found_gen)
        self.assertEqual(found_gen.component_id, "gen1")
        
        found_exec = self.mediator.find_capable_component("execute_prp", ComponentType.EXECUTOR)
        self.assertIsNotNone(found_exec)
        self.assertEqual(found_exec.component_id, "exec1")
    
    async def test_task_processing(self):
        """Test task submission and processing."""
        # Start mediator in background
        mediator_task = asyncio.create_task(self.mediator.start())
        
        # Create and register generator
        generator = PRPGeneratorComponent("gen1", self.mediator)
        self.mediator.register_component(generator)
        
        # Submit task
        task = TaskRequest(
            task_id="test_task_1",
            component_type=ComponentType.GENERATOR,
            operation="generate_prp",
            parameters={
                "feature_name": "test_feature",
                "environment": "python-env",
                "requirements": {}
            },
            priority=Priority.HIGH
        )
        
        task_id = await self.mediator.submit_task(task)
        self.assertEqual(task_id, "test_task_1")
        
        # Get result
        result = await self.mediator.get_result(task_id, timeout=5.0)
        self.assertIsNotNone(result)
        self.assertTrue(result.success)
        self.assertIn("prp_content", result.result)
        
        # Stop mediator
        self.mediator.stop()
        
        # Wait for mediator task to complete
        try:
            await asyncio.wait_for(mediator_task, timeout=1.0)
        except asyncio.TimeoutError:
            mediator_task.cancel()
    
    async def test_scalable_prp_system(self):
        """Test high-level ScalablePRPSystem."""
        await self.system.initialize()
        
        # Test PRP generation
        result = await self.system.generate_prp(
            "test-feature",
            "python-env",
            {"complexity": "simple"}
        )
        
        self.assertIsNotNone(result)
        self.assertTrue(result.success)
        self.assertIn("prp_content", result.result)
        
        # Test PRP execution
        exec_result = await self.system.execute_prp(
            "context-engineering/PRPs/test-feature-python-env.md",
            "python-env",
            {"validate": True}
        )
        
        self.assertIsNotNone(exec_result)
        self.assertTrue(exec_result.success)
        self.assertIn("status", exec_result.result)
        
        # Test validation
        val_result = await self.system.validate_implementation(
            "python-env",
            ["devbox run lint", "devbox run test"]
        )
        
        self.assertIsNotNone(val_result)
        self.assertTrue(val_result.success)


class TestIntegratedSystem(unittest.IsolatedAsyncioTestCase):
    """Test suite for the integrated system combining both patterns."""
    
    async def asyncSetUp(self):
        """Set up integrated test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.system = IntegratedPRPSystem(max_workers=2, storage_path=self.temp_dir)
        
    async def asyncTearDown(self):
        """Clean up integrated test environment."""
        self.system.shutdown()
        shutil.rmtree(self.temp_dir)
    
    async def test_integrated_prp_generation(self):
        """Test PRP generation with version control."""
        await self.system.initialize()
        
        result = await self.system.generate_prp_with_versioning(
            "integrated-test",
            "python-env",
            {"complexity": "medium", "features": ["api", "auth"]},
            save_versions=True
        )
        
        self.assertIsNotNone(result)
        self.assertTrue(result.success)
        
        # Check versions were saved
        versions = self.system.list_prp_versions("integrated-test-python-env")
        self.assertGreater(len(versions), 0)
        
        # Check system metrics
        status = self.system.get_system_status()
        self.assertGreater(status["performance_metrics"]["tasks_completed"], 0)
        self.assertGreater(status["performance_metrics"]["version_saves"], 0)
    
    async def test_prp_execution_with_rollback(self):
        """Test PRP execution with rollback capability."""
        await self.system.initialize()
        
        # Create a test PRP file
        test_prp_path = Path(self.temp_dir) / "test-prp.md"
        test_prp_content = """
# Test PRP

Environment: python-env

## Implementation Tasks
1. Setup environment
2. Implement feature
3. Run tests
"""
        test_prp_path.write_text(test_prp_content)
        
        # Execute with rollback
        result = await self.system.execute_prp_with_rollback(
            str(test_prp_path),
            "python-env",
            {"validate": True},
            auto_rollback=True
        )
        
        self.assertIsNotNone(result)
        self.assertTrue(result.success)
        
        # Check execution history
        history = self.system.get_execution_history("test-prp")
        self.assertGreater(len(history), 0)
    
    async def test_version_restoration(self):
        """Test version restoration functionality."""
        await self.system.initialize()
        
        # Generate multiple versions
        result1 = await self.system.generate_prp_with_versioning(
            "version-test",
            "python-env",
            {"version": 1},
            save_versions=True
        )
        
        result2 = await self.system.generate_prp_with_versioning(
            "version-test",
            "python-env", 
            {"version": 2},
            save_versions=True
        )
        
        self.assertTrue(result1.success)
        self.assertTrue(result2.success)
        
        # List versions
        versions = self.system.list_prp_versions("version-test-python-env")
        self.assertGreaterEqual(len(versions), 2)
        
        # Restore earlier version
        older_version = versions[-1]["version_id"]  # Last in list (oldest)
        restored = await self.system.restore_prp_version("version-test-python-env", older_version)
        self.assertTrue(restored)
        
        # Check metrics updated
        status = self.system.get_system_status()
        self.assertGreater(status["performance_metrics"]["version_restores"], 0)
    
    async def test_validation_with_history(self):
        """Test validation with historical comparison."""
        await self.system.initialize()
        
        result = await self.system.validate_with_history(
            "python-env",
            ["devbox run lint", "devbox run test"],
            compare_with_previous=True
        )
        
        self.assertIsNotNone(result)
        self.assertTrue(result.success)
        
        # Check validation was saved as version
        versions = self.system.list_prp_versions("validation_python-env")
        self.assertGreater(len(versions), 0)


def run_all_tests():
    """Run all test suites."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTests(loader.loadTestsFromTestCase(TestVersionControlSystem))
    suite.addTests(loader.loadTestsFromTestCase(TestScalabilitySystem))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegratedSystem))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)