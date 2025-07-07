#!/usr/bin/env python3
"""
Test Suite for PRP Builder System

Tests the Builder pattern implementation for PRP generation and abstraction.
"""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock
from datetime import datetime

# Import our PRP builder system
import sys
sys.path.append(str(Path(__file__).parent / "lib"))

from prp_builder import (
    PRPComplexity, PRPType, PRPPriority, PRPRequirement, PRPContext,
    StandardPRPBuilder, PRPDirector, create_prp_from_json
)
from environment_adapter import EnvironmentManager, EnvironmentInfo, EnvironmentType


class TestPRPRequirement:
    """Test PRP requirement functionality."""
    
    def test_prp_requirement_creation(self):
        """Test PRPRequirement creation with all fields."""
        requirement = PRPRequirement(
            id="FR-001",
            description="User can log in with email and password",
            type="functional",
            priority=PRPPriority.HIGH,
            acceptance_criteria=["Email validation", "Password strength check"],
            dependencies=["FR-002"],
            validation_rules=["Must use HTTPS"]
        )
        
        assert requirement.id == "FR-001"
        assert requirement.type == "functional"
        assert requirement.priority == PRPPriority.HIGH
        assert len(requirement.acceptance_criteria) == 2
        assert len(requirement.dependencies) == 1
        assert len(requirement.validation_rules) == 1
    
    def test_prp_requirement_defaults(self):
        """Test PRPRequirement creation with minimal fields."""
        requirement = PRPRequirement(
            id="TR-001",
            description="Database connection must be pooled",
            type="technical",
            priority=PRPPriority.MEDIUM
        )
        
        assert requirement.id == "TR-001"
        assert requirement.acceptance_criteria == []
        assert requirement.dependencies == []
        assert requirement.validation_rules == []


class TestPRPContext:
    """Test PRP context functionality."""
    
    def test_prp_context_creation(self):
        """Test PRPContext creation with required fields."""
        context = PRPContext(
            name="User Authentication",
            description="Complete user authentication system",
            type=PRPType.FEATURE,
            complexity=PRPComplexity.MEDIUM,
            priority=PRPPriority.HIGH,
            target_environment="python-env"
        )
        
        assert context.name == "User Authentication"
        assert context.type == PRPType.FEATURE
        assert context.complexity == PRPComplexity.MEDIUM
        assert context.priority == PRPPriority.HIGH
        assert context.target_environment == "python-env"
        assert context.author == "AI Assistant"
        assert isinstance(context.created_at, datetime)
    
    def test_prp_context_defaults(self):
        """Test PRPContext creation with default values."""
        context = PRPContext(
            name="Test Feature",
            description="Test description",
            type=PRPType.FEATURE,
            complexity=PRPComplexity.SIMPLE,
            priority=PRPPriority.LOW,
            target_environment="test-env"
        )
        
        assert context.requirements == []
        assert context.constraints == []
        assert context.assumptions == []
        assert context.technologies == []
        assert context.patterns == []
        assert context.architecture_style == "microservices"
        assert context.version == "1.0.0"


class TestStandardPRPBuilder:
    """Test StandardPRPBuilder functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        
        # Create mock environment
        python_env = self.temp_dir / "python-env"
        python_env.mkdir()
        (python_env / "pyproject.toml").write_text('[project]\nname = "test"')
        
        self.env_manager = EnvironmentManager(self.temp_dir)
        self.builder = StandardPRPBuilder(self.env_manager)
    
    def test_basic_info_setting(self):
        """Test setting basic PRP information."""
        result = self.builder.set_basic_info(
            "User API", 
            "REST API for user management", 
            PRPType.FEATURE
        )
        
        assert result is self.builder  # Fluent interface
        context = self.builder.get_context()
        assert context.name == "User API"
        assert context.description == "REST API for user management"
        assert context.type == PRPType.FEATURE
    
    def test_complexity_and_priority_setting(self):
        """Test setting complexity and priority."""
        self.builder.set_complexity(PRPComplexity.COMPLEX)
        self.builder.set_priority(PRPPriority.CRITICAL)
        
        context = self.builder.get_context()
        assert context.complexity == PRPComplexity.COMPLEX
        assert context.priority == PRPPriority.CRITICAL
    
    def test_environment_setting(self):
        """Test setting target environment."""
        self.builder.set_environment("python-env")
        
        context = self.builder.get_context()
        assert context.target_environment == "python-env"
        assert context.environment_info is not None
        assert "Python" in context.technologies
    
    def test_requirement_addition(self):
        """Test adding different types of requirements."""
        # Add functional requirement
        self.builder.add_functional_requirement(
            "User can register with email",
            PRPPriority.HIGH,
            ["Email validation", "Unique email check"]
        )
        
        # Add non-functional requirement
        self.builder.add_non_functional_requirement(
            "System handles 1000 concurrent users",
            PRPPriority.MEDIUM
        )
        
        # Add technical requirement
        self.builder.add_technical_requirement(
            "Use PostgreSQL database",
            PRPPriority.LOW
        )
        
        context = self.builder.get_context()
        assert len(context.requirements) == 3
        
        functional_reqs = [r for r in context.requirements if r.type == "functional"]
        assert len(functional_reqs) == 1
        assert functional_reqs[0].id == "FR-001"
        assert len(functional_reqs[0].acceptance_criteria) == 2
        
        nf_reqs = [r for r in context.requirements if r.type == "non-functional"]
        assert len(nf_reqs) == 1
        assert nf_reqs[0].id == "NFR-001"
        
        tech_reqs = [r for r in context.requirements if r.type == "technical"]
        assert len(tech_reqs) == 1
        assert tech_reqs[0].id == "TR-001"
    
    def test_constraint_and_assumption_addition(self):
        """Test adding constraints and assumptions."""
        self.builder.add_constraint("Must be backward compatible")
        self.builder.add_assumption("Database is available")
        
        context = self.builder.get_context()
        assert "Must be backward compatible" in context.constraints
        assert "Database is available" in context.assumptions
    
    def test_technology_and_pattern_addition(self):
        """Test adding technologies and patterns."""
        self.builder.add_technology("FastAPI")
        self.builder.add_technology("PostgreSQL")
        self.builder.add_pattern("Repository Pattern")
        self.builder.add_pattern("Dependency Injection")
        
        context = self.builder.get_context()
        assert "FastAPI" in context.technologies
        assert "PostgreSQL" in context.technologies
        assert "Repository Pattern" in context.patterns
        assert "Dependency Injection" in context.patterns
        
        # Test duplicate prevention
        self.builder.add_technology("FastAPI")  # Duplicate
        assert context.technologies.count("FastAPI") == 1
    
    def test_quality_attributes_setting(self):
        """Test setting quality attributes."""
        self.builder.set_quality_attributes(
            performance={"response_time_ms": 500, "throughput": 1000},
            security=["Authentication", "Authorization"],
            scalability={"max_users": 10000}
        )
        
        context = self.builder.get_context()
        assert context.performance_requirements["response_time_ms"] == 500
        assert "Authentication" in context.security_requirements
        assert context.scalability_requirements["max_users"] == 10000
    
    def test_metadata_setting(self):
        """Test setting metadata fields."""
        self.builder.set_author("Test Author")
        self.builder.set_version("2.0.0")
        self.builder.add_tag("api")
        self.builder.add_tag("authentication")
        
        context = self.builder.get_context()
        assert context.author == "Test Author"
        assert context.version == "2.0.0"
        assert "api" in context.tags
        assert "authentication" in context.tags
    
    def test_output_options_setting(self):
        """Test setting output options."""
        self.builder.set_output_options(
            format="json",
            include_examples=False,
            include_tests=True,
            include_documentation=False
        )
        
        context = self.builder.get_context()
        assert context.output_format == "json"
        assert context.include_examples is False
        assert context.include_tests is True
        assert context.include_documentation is False
    
    def test_validation_success(self):
        """Test successful validation."""
        self.builder.set_basic_info("Test API", "Test description", PRPType.FEATURE)
        self.builder.set_environment("python-env")
        self.builder.add_functional_requirement("Basic functionality")
        
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            validation_result = self.builder.validate()
            validation_errors = self.builder.get_validation_results()
            
            assert validation_result is True
            assert len(validation_errors) == 0
    
    def test_validation_failures(self):
        """Test validation failures."""
        # Create a fresh builder to test empty validation
        fresh_builder = StandardPRPBuilder(self.env_manager)
        
        assert fresh_builder.validate() is False
        validation_results = fresh_builder.get_validation_results()
        
        assert any("name is required" in result for result in validation_results)
        assert any("description is required" in result for result in validation_results)
        assert any("environment is required" in result for result in validation_results)
        assert any("requirement is needed" in result for result in validation_results)
    
    def test_validation_missing_functional_requirements(self):
        """Test validation when functional requirements are missing."""
        # Create a fresh builder to avoid cross-test contamination
        fresh_builder = StandardPRPBuilder(self.env_manager)
        fresh_builder.set_basic_info("Test", "Description", PRPType.FEATURE)
        fresh_builder.set_environment("python-env")
        fresh_builder.add_technical_requirement("Some tech requirement")
        # Add quality requirements to avoid that validation failure
        fresh_builder.set_quality_attributes(performance={"response_time_ms": 500})
        
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            validation_result = fresh_builder.validate()
            validation_results = fresh_builder.get_validation_results()
            assert validation_result is False
            assert any("functional requirement is needed" in result for result in validation_results)
    
    def test_validation_complex_prp_requirements(self):
        """Test validation for complex PRPs."""
        # Create a fresh builder to avoid cross-test contamination
        fresh_builder = StandardPRPBuilder(self.env_manager)
        fresh_builder.set_basic_info("Complex Feature", "Description", PRPType.FEATURE)
        fresh_builder.set_complexity(PRPComplexity.COMPLEX)
        # Don't set environment to avoid auto-adding technologies
        fresh_builder._context.target_environment = "python-env"  # Set manually to avoid auto-population
        fresh_builder.add_functional_requirement("Basic functionality")
        fresh_builder.add_technology("Python")  # Only one technology
        # Add quality requirements to avoid that validation failure
        fresh_builder.set_quality_attributes(performance={"response_time_ms": 500})
        
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            validation_result = fresh_builder.validate()
            validation_results = fresh_builder.get_validation_results()
            assert validation_result is False
            assert any("multiple technologies" in result for result in validation_results)
    
    def test_build_success(self):
        """Test successful PRP building."""
        self.builder.set_basic_info("User API", "User management API", PRPType.FEATURE)
        self.builder.set_environment("python-env")
        self.builder.add_functional_requirement("User registration")
        self.builder.add_technology("FastAPI")
        self.builder.add_pattern("Repository Pattern")
        
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            prp_content = self.builder.build()
            
            assert "# Product Requirements Prompt (PRP)" in prp_content
            assert "User API" in prp_content
            assert "User management API" in prp_content
            assert "User registration" in prp_content
            assert "FastAPI" in prp_content
            assert "Repository Pattern" in prp_content
    
    def test_build_validation_failure(self):
        """Test build failure when validation fails."""
        # Create invalid PRP (no requirements)
        self.builder.set_basic_info("Test", "Description", PRPType.FEATURE)
        
        try:
            self.builder.build()
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "validation failed" in str(e)


class TestPRPDirector:
    """Test PRPDirector functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        
        # Create mock environment
        python_env = self.temp_dir / "python-env"
        python_env.mkdir()
        (python_env / "pyproject.toml").write_text('[project]\nname = "test"')
        
        self.env_manager = EnvironmentManager(self.temp_dir)
        self.director = PRPDirector(self.env_manager)
    
    def test_simple_feature_prp(self):
        """Test building simple feature PRP."""
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            prp = self.director.build_simple_feature_prp(
                "User Profile",
                "Basic user profile management",
                "python-env"
            )
            
            assert "User Profile" in prp
            assert "Basic user profile management" in prp
            assert "simple" in prp.lower()
            assert "feature" in prp.lower()
            assert "Implement User Profile functionality" in prp
    
    def test_api_feature_prp(self):
        """Test building API feature PRP."""
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            prp = self.director.build_api_feature_prp(
                "User Management API",
                "Complete REST API for user management",
                "python-env"
            )
            
            assert "User Management API" in prp
            assert "REST API" in prp
            assert "authentication" in prp.lower()
            assert "500ms" in prp  # Performance requirement
            assert "Repository Pattern" in prp
            assert "Dependency Injection" in prp
    
    def test_enhancement_prp(self):
        """Test building enhancement PRP."""
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            prp = self.director.build_enhancement_prp(
                "Enhanced Logging",
                "Improve existing logging system",
                "python-env",
                "basic logging"
            )
            
            assert "Enhanced Logging" in prp
            assert "enhancement" in prp.lower()
            assert "backward compatibility" in prp.lower()
            assert "basic logging" in prp
    
    def test_bugfix_prp(self):
        """Test building bugfix PRP."""
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            prp = self.director.build_bugfix_prp(
                "Fix Login Issue",
                "Resolve login validation bug",
                "python-env",
                "Users cannot login with special characters"
            )
            
            assert "Fix Login Issue" in prp
            assert "bugfix" in prp.lower()
            assert "regression tests" in prp.lower()
            assert "Users cannot login with special characters" in prp
    
    def test_integration_prp(self):
        """Test building integration PRP."""
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            prp = self.director.build_integration_prp(
                "Payment Gateway Integration",
                "Integrate with Stripe payment system",
                "python-env",
                "Stripe API"
            )
            
            assert "Payment Gateway Integration" in prp
            assert "integration" in prp.lower()
            assert "Stripe API" in prp
            assert "Circuit Breaker" in prp
            assert "retry logic" in prp.lower()


class TestJSONConfiguration:
    """Test JSON-based PRP configuration."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        
        # Create mock environment
        python_env = self.temp_dir / "python-env"
        python_env.mkdir()
        (python_env / "pyproject.toml").write_text('[project]\nname = "test"')
        
        self.env_manager = EnvironmentManager(self.temp_dir)
    
    def test_json_prp_creation(self):
        """Test creating PRP from JSON configuration."""
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            config = {
            "name": "User Authentication System",
            "description": "Complete authentication and authorization system",
            "type": "feature",
            "complexity": "medium",
            "priority": "high",
            "environment": "python-env",
            "requirements": [
                {
                    "id": "FR-001",
                    "description": "User can register with email",
                    "type": "functional",
                    "priority": "high",
                    "acceptance_criteria": ["Email validation", "Unique email check"]
                },
                {
                    "id": "NFR-001",
                    "description": "System supports 1000 concurrent users",
                    "type": "non-functional",
                    "priority": "medium"
                }
            ],
            "technologies": ["FastAPI", "PostgreSQL", "Redis"],
            "patterns": ["Repository Pattern", "Unit of Work"],
            "quality_attributes": {
                "performance": {
                    "response_time_ms": 300,
                    "throughput": 1500
                },
                "security": ["JWT authentication", "Password hashing", "Rate limiting"],
                "scalability": {
                    "max_concurrent_users": 1000,
                    "horizontal_scaling": True
                }
            },
            "constraints": ["Must be backward compatible", "Must use existing database"],
            "assumptions": ["Database is available", "Redis is configured"],
            "author": "Development Team",
            "version": "1.2.0",
            "tags": ["authentication", "api", "security"]
        }
        
            json_config = json.dumps(config)
            prp = create_prp_from_json(json_config, self.env_manager)
            
            assert "User Authentication System" in prp
            assert "Complete authentication and authorization system" in prp
            assert "FR-001" in prp
            assert "NFR-001" in prp
            assert "Email validation" in prp
            assert "FastAPI" in prp
            assert "Repository Pattern" in prp
            assert "300" in prp  # Response time
            assert "JWT authentication" in prp
            assert "backward compatible" in prp
            assert "Development Team" in prp
            assert "1.2.0" in prp
    
    def test_minimal_json_config(self):
        """Test creating PRP from minimal JSON configuration."""
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            config = {
                "name": "Simple Feature",
                "description": "A simple feature implementation",
                "environment": "python-env",
                "requirements": [
                    {
                        "id": "FR-001",
                        "description": "Basic functionality",
                        "type": "functional"
                    }
                ],
                "quality_attributes": {
                    "performance": {"response_time_ms": 500}
                }
            }
            
            json_config = json.dumps(config)
            prp = create_prp_from_json(json_config, self.env_manager)
            
            assert "Simple Feature" in prp
            assert "A simple feature implementation" in prp


class TestBuilderPatternBenefits:
    """Test the benefits of the Builder pattern implementation."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        
        # Create multiple mock environments
        for env_name in ["python-env", "typescript-env", "rust-env"]:
            env_dir = self.temp_dir / env_name
            env_dir.mkdir()
            if env_name == "python-env":
                (env_dir / "pyproject.toml").write_text('[project]\nname = "test"')
            elif env_name == "typescript-env":
                (env_dir / "package.json").write_text('{"name": "test"}')
            elif env_name == "rust-env":
                (env_dir / "Cargo.toml").write_text('[package]\nname = "test"')
        
        self.env_manager = EnvironmentManager(self.temp_dir)
    
    def test_fluent_interface(self):
        """Test fluent interface design."""
        builder = StandardPRPBuilder(self.env_manager)
        
        # All methods should return the builder for chaining
        result = (builder
                 .set_basic_info("Test", "Description", PRPType.FEATURE)
                 .set_complexity(PRPComplexity.MEDIUM)
                 .set_environment("python-env")
                 .add_functional_requirement("Test requirement")
                 .add_technology("Python")
                 .add_pattern("MVC")
                 .set_author("Test Author"))
        
        assert result is builder
        assert builder.get_context().name == "Test"
        assert builder.get_context().complexity == PRPComplexity.MEDIUM
        assert "Python" in builder.get_context().technologies
    
    def test_reusable_configurations(self):
        """Test reusable builder configurations."""
        # Create a base configuration
        def create_base_api_builder():
            return (StandardPRPBuilder(self.env_manager)
                   .set_complexity(PRPComplexity.MEDIUM)
                   .add_pattern("Repository Pattern")
                   .add_pattern("Dependency Injection")
                   .set_quality_attributes(
                       performance={"response_time_ms": 500},
                       security=["Authentication", "Authorization"]
                   ))
        
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            # Create specific APIs using the base configuration
            user_api = (create_base_api_builder()
                       .set_basic_info("User API", "User management API", PRPType.FEATURE)
                       .set_environment("python-env")
                       .add_functional_requirement("User CRUD operations")
                       .build())
            
            product_api = (create_base_api_builder()
                          .set_basic_info("Product API", "Product catalog API", PRPType.FEATURE)
                          .set_environment("typescript-env")
                          .add_functional_requirement("Product CRUD operations")
                          .build())
        
        # Both should have common patterns but different specifics
        assert "User API" in user_api
        assert "Product API" in product_api
        assert "Repository Pattern" in user_api
        assert "Repository Pattern" in product_api
        assert "500" in user_api  # Response time
        assert "500" in product_api  # Response time
    
    def test_step_by_step_construction(self):
        """Test step-by-step PRP construction."""
        builder = StandardPRPBuilder(self.env_manager)
        
        # Step 1: Basic info
        builder.set_basic_info("E-commerce Platform", "Online shopping platform", PRPType.FEATURE)
        assert builder.get_context().name == "E-commerce Platform"
        assert not builder.validate()  # Should fail - missing environment and requirements
        
        # Step 2: Environment
        builder.set_environment("python-env")
        assert builder.get_context().target_environment == "python-env"
        assert not builder.validate()  # Should fail - missing requirements
        
        # Step 3: Requirements
        builder.add_functional_requirement("User can browse products")
        builder.add_functional_requirement("User can add products to cart")
        assert len(builder.get_context().requirements) == 2
        # Add quality requirements to avoid validation failure
        builder.set_quality_attributes(performance={"response_time_ms": 500})
        
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            assert builder.validate()  # Should pass now
        
        # Step 4: Additional details
        builder.add_technology("FastAPI")
        builder.add_technology("PostgreSQL")
        builder.set_quality_attributes(performance={"response_time_ms": 300})
        
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            # Build final PRP
            prp = builder.build()
            assert "E-commerce Platform" in prp
            assert "browse products" in prp
            assert "FastAPI" in prp
    
    def test_validation_at_each_step(self):
        """Test validation capabilities at each construction step."""
        builder = StandardPRPBuilder(self.env_manager)
        
        # Initial state should be invalid
        assert not builder.validate()
        initial_issues = builder.get_validation_results()
        assert len(initial_issues) > 0
        
        # Create a complete valid configuration
        builder.set_basic_info("Test Feature", "Test description", PRPType.FEATURE)
        builder.set_environment("python-env")
        builder.add_functional_requirement("Basic functionality")
        builder.set_quality_attributes(performance={"response_time_ms": 500})
        
        # Mock environment validation to avoid system dependencies
        with patch.object(self.env_manager, 'get_adapter') as mock_adapter, \
             patch.object(self.env_manager, 'get_environment_info') as mock_env_info:
            
            # Mock adapter
            mock_adapter_instance = MagicMock()
            mock_adapter_instance.validate_environment.return_value = []  # No validation issues
            mock_adapter.return_value = mock_adapter_instance
            
            # Mock environment info
            mock_env_info.return_value = MagicMock(
                language="Python",
                package_manager="pip"
            )
            
            # Now should be valid
            assert builder.validate()
            assert len(builder.get_validation_results()) == 0


def run_tests():
    """Run all tests."""
    print("🔧 Running PRP Builder System Tests")
    print("=" * 50)
    
    # Test PRPRequirement
    print("Testing PRPRequirement...")
    test_req = TestPRPRequirement()
    test_req.test_prp_requirement_creation()
    test_req.test_prp_requirement_defaults()
    print("✅ PRPRequirement tests passed")
    
    # Test PRPContext
    print("\nTesting PRPContext...")
    test_context = TestPRPContext()
    test_context.test_prp_context_creation()
    test_context.test_prp_context_defaults()
    print("✅ PRPContext tests passed")
    
    # Test StandardPRPBuilder
    print("\nTesting StandardPRPBuilder...")
    test_builder = TestStandardPRPBuilder()
    test_builder.setup_method()
    test_builder.test_basic_info_setting()
    test_builder.test_complexity_and_priority_setting()
    test_builder.test_environment_setting()
    test_builder.test_requirement_addition()
    test_builder.test_constraint_and_assumption_addition()
    test_builder.test_technology_and_pattern_addition()
    test_builder.test_quality_attributes_setting()
    test_builder.test_metadata_setting()
    test_builder.test_output_options_setting()
    test_builder.test_validation_success()
    test_builder.test_validation_failures()
    test_builder.test_validation_missing_functional_requirements()
    test_builder.test_validation_complex_prp_requirements()
    test_builder.test_build_success()
    test_builder.test_build_validation_failure()
    print("✅ StandardPRPBuilder tests passed")
    
    # Test PRPDirector
    print("\nTesting PRPDirector...")
    test_director = TestPRPDirector()
    test_director.setup_method()
    test_director.test_simple_feature_prp()
    test_director.test_api_feature_prp()
    test_director.test_enhancement_prp()
    test_director.test_bugfix_prp()
    test_director.test_integration_prp()
    print("✅ PRPDirector tests passed")
    
    # Test JSON Configuration
    print("\nTesting JSON Configuration...")
    test_json = TestJSONConfiguration()
    test_json.setup_method()
    test_json.test_json_prp_creation()
    test_json.test_minimal_json_config()
    print("✅ JSON Configuration tests passed")
    
    # Test Builder Pattern Benefits
    print("\nTesting Builder Pattern Benefits...")
    test_benefits = TestBuilderPatternBenefits()
    test_benefits.setup_method()
    test_benefits.test_fluent_interface()
    test_benefits.test_reusable_configurations()
    test_benefits.test_step_by_step_construction()
    test_benefits.test_validation_at_each_step()
    print("✅ Builder Pattern Benefits tests passed")
    
    print("\n🎉 All PRP Builder System tests passed!")
    return True


if __name__ == '__main__':
    try:
        success = run_tests()
        if success:
            print("\n✅ PRP Builder System is working correctly")
            exit(0)
        else:
            print("\n❌ Some tests failed")
            exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)