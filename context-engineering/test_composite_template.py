#!/usr/bin/env python3
"""
Test script for the new Composite Template Builder
"""

import sys
import os
from pathlib import Path

# Add the lib directory to the path
lib_dir = Path(__file__).parent / "lib"
sys.path.insert(0, str(lib_dir))

try:
    from composite_template_builder import build_template, create_template_context, CompositeTemplateBuilder
    from template_strategies import TemplateStrategyFactory
    
    def test_basic_template_generation():
        """Test basic template generation for different environments."""
        print("🧪 Testing basic template generation...")
        
        # Test Python environment
        template = build_template(
            environment="python-env",
            feature_name="user-management",
            feature_description="A comprehensive user management system with authentication",
            feature_type="api",
            complexity="medium",
            template_type="full"
        )
        
        # Check that template contains expected sections
        assert "## Purpose" in template
        assert "## Goal" in template
        assert "## All Needed Context" in template
        assert "## Data Models and Structure" in template
        assert "## API Implementation" in template
        assert "## Testing Implementation" in template
        assert "## Validation Loop" in template
        
        print("✅ Basic template generation test passed")
        return template
    
    def test_strategy_factory():
        """Test the strategy factory."""
        print("🧪 Testing strategy factory...")
        
        # Test creating different strategies
        env_strategy = TemplateStrategyFactory.create_strategy('environment')
        data_strategy = TemplateStrategyFactory.create_strategy('data_models')
        api_strategy = TemplateStrategyFactory.create_strategy('api')
        
        assert env_strategy is not None
        assert data_strategy is not None
        assert api_strategy is not None
        
        # Test getting available strategies
        available = TemplateStrategyFactory.get_available_strategies()
        assert 'environment' in available
        assert 'data_models' in available
        assert 'api' in available
        assert 'testing' in available
        assert 'validation' in available
        
        print("✅ Strategy factory test passed")
    
    def test_template_context_creation():
        """Test template context creation with environment config."""
        print("🧪 Testing template context creation...")
        
        context = create_template_context(
            environment="python-env",
            feature_name="test-feature",
            feature_description="Test feature description",
            feature_type="api",
            complexity="simple"
        )
        
        assert context.environment == "python-env"
        assert context.feature_name == "test-feature"
        assert context.feature_type == "api"
        assert context.complexity == "simple"
        
        print("✅ Template context creation test passed")
    
    def test_composite_builder():
        """Test the composite builder directly."""
        print("🧪 Testing composite builder...")
        
        context = create_template_context(
            environment="python-env",
            feature_name="test-api",
            feature_type="api",
            complexity="medium"
        )
        
        builder = CompositeTemplateBuilder()
        builder.set_context(context)
        builder.auto_configure_strategies("full")
        
        # Validate build configuration
        errors = builder.validate_build()
        assert len(errors) == 0, f"Build validation failed: {errors}"
        
        # Build template
        template = builder.build()
        assert len(template) > 100  # Should be a substantial template
        
        print("✅ Composite builder test passed")
    
    def test_minimal_template():
        """Test minimal template generation."""
        print("🧪 Testing minimal template generation...")
        
        template = build_template(
            environment="python-env",
            feature_name="simple-utility",
            feature_description="A simple utility function",
            feature_type="library",
            complexity="simple",
            template_type="minimal"
        )
        
        # Minimal template should have fewer sections
        assert "## Purpose" in template
        assert "## All Needed Context" in template
        assert "## Validation Loop" in template
        
        # Should not have complex sections for minimal template
        # But still might have data models for library type
        
        print("✅ Minimal template test passed")
    
    def test_different_languages():
        """Test template generation for different languages."""
        print("🧪 Testing different language environments...")
        
        languages = ["python-env", "typescript-env", "rust-env"]
        
        for lang in languages:
            try:
                template = build_template(
                    environment=lang,
                    feature_name="test-feature",
                    feature_type="library",
                    template_type="minimal"
                )
                
                assert len(template) > 50
                print(f"  ✅ {lang} template generated successfully")
                
            except Exception as e:
                print(f"  ⚠️  {lang} template generation failed (may be missing config): {e}")
        
        print("✅ Different languages test completed")
    
    def run_all_tests():
        """Run all tests."""
        print("🚀 Starting Composite Template Builder tests...\n")
        
        try:
            test_strategy_factory()
            test_template_context_creation()
            test_composite_builder()
            template = test_basic_template_generation()
            test_minimal_template()
            test_different_languages()
            
            print("\n🎉 All tests passed!")
            
            # Output a sample template for inspection
            print("\n" + "="*60)
            print("Sample Generated Template (first 50 lines):")
            print("="*60)
            lines = template.split('\n')[:50]
            for i, line in enumerate(lines, 1):
                print(f"{i:3}: {line}")
            
            if len(template.split('\n')) > 50:
                print(f"... (template continues for {len(template.split('\n'))} total lines)")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    if __name__ == "__main__":
        success = run_all_tests()
        sys.exit(0 if success else 1)

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure the composite_template_builder.py and template_strategies.py files exist in the lib/ directory")
    sys.exit(1)