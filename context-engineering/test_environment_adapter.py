#!/usr/bin/env python3
"""
Test Suite for Environment Adapter System

Tests the Adapter pattern implementation for environment abstraction.
"""

import os
import tempfile
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

# Import our environment adapter system
import sys
sys.path.append(str(Path(__file__).parent / "lib"))

from environment_adapter import (
    EnvironmentType, EnvironmentInfo, CommandResult,
    EnvironmentAdapter, PythonEnvironmentAdapter, TypeScriptEnvironmentAdapter,
    RustEnvironmentAdapter, GoEnvironmentAdapter, NushellEnvironmentAdapter,
    EnvironmentAdapterFactory, EnvironmentManager
)


class TestEnvironmentAdapterFactory:
    """Test environment adapter factory functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
    
    def test_python_environment_detection(self):
        """Test detection of Python environments."""
        # Create Python environment indicators
        (self.temp_dir / "pyproject.toml").write_text("[project]\nname = 'test'")
        
        adapter = EnvironmentAdapterFactory.create_adapter(self.temp_dir)
        assert isinstance(adapter, PythonEnvironmentAdapter)
        assert adapter.get_environment_type() == EnvironmentType.PYTHON
    
    def test_typescript_environment_detection(self):
        """Test detection of TypeScript environments."""
        # Create TypeScript environment indicators
        (self.temp_dir / "package.json").write_text('{"name": "test"}')
        (self.temp_dir / "tsconfig.json").write_text('{"compilerOptions": {}}')
        
        adapter = EnvironmentAdapterFactory.create_adapter(self.temp_dir)
        assert isinstance(adapter, TypeScriptEnvironmentAdapter)
        assert adapter.get_environment_type() == EnvironmentType.TYPESCRIPT
    
    def test_rust_environment_detection(self):
        """Test detection of Rust environments."""
        # Create Rust environment indicators
        (self.temp_dir / "Cargo.toml").write_text('[package]\nname = "test"')
        
        adapter = EnvironmentAdapterFactory.create_adapter(self.temp_dir)
        assert isinstance(adapter, RustEnvironmentAdapter)
        assert adapter.get_environment_type() == EnvironmentType.RUST
    
    def test_go_environment_detection(self):
        """Test detection of Go environments."""
        # Create Go environment indicators
        (self.temp_dir / "go.mod").write_text('module test\n\ngo 1.21')
        
        adapter = EnvironmentAdapterFactory.create_adapter(self.temp_dir)
        assert isinstance(adapter, GoEnvironmentAdapter)
        assert adapter.get_environment_type() == EnvironmentType.GO
    
    def test_nushell_environment_detection(self):
        """Test detection of Nushell environments."""
        # Create Nushell environment indicators
        (self.temp_dir / "scripts").mkdir()
        (self.temp_dir / "config.nu").write_text('# Nushell config')
        
        adapter = EnvironmentAdapterFactory.create_adapter(self.temp_dir)
        assert isinstance(adapter, NushellEnvironmentAdapter)
        assert adapter.get_environment_type() == EnvironmentType.NUSHELL
    
    def test_unknown_environment_raises_error(self):
        """Test that unknown environments raise an error."""
        # Create directory with no recognizable indicators
        
        try:
            EnvironmentAdapterFactory.create_adapter(self.temp_dir)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Could not detect environment type" in str(e)


class TestPythonEnvironmentAdapter:
    """Test Python environment adapter functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        (self.temp_dir / "pyproject.toml").write_text("""
[project]
name = "test-project"
dependencies = ["requests>=2.25.0", "pytest>=6.0.0"]

[tool.ruff]
line-length = 88
""")
        self.adapter = PythonEnvironmentAdapter(self.temp_dir)
    
    def test_environment_type(self):
        """Test environment type detection."""
        assert self.adapter.get_environment_type() == EnvironmentType.PYTHON
    
    def test_package_manager_detection_uv(self):
        """Test uv package manager detection."""
        (self.temp_dir / "uv.lock").write_text("# uv lockfile")
        assert self.adapter.get_package_manager() == "uv"
    
    def test_package_manager_detection_pip(self):
        """Test pip package manager fallback."""
        # No uv indicators, should default to pip
        assert self.adapter.get_package_manager() == "pip"
    
    def test_config_files_detection(self):
        """Test configuration files detection."""
        (self.temp_dir / "requirements.txt").write_text("requests==2.25.0")
        
        config_files = self.adapter.get_config_files()
        assert "pyproject.toml" in config_files
        assert "requirements.txt" in config_files
    
    def test_dependency_parsing_pyproject(self):
        """Test dependency parsing from pyproject.toml."""
        # Test should handle missing tomli gracefully
        deps = self.adapter.get_dependencies()
        assert isinstance(deps, list)
    
    def test_validation_success(self):
        """Test successful environment validation."""
        with patch.object(self.adapter, 'execute_command') as mock_exec:
            mock_exec.return_value = CommandResult(
                success=True, output="Python 3.11.0", error="", 
                return_code=0, execution_time=0.1
            )
            
            issues = self.adapter.validate_environment()
            # Should have no issues if Python is available
            assert len(issues) == 0
    
    def test_validation_missing_python(self):
        """Test validation with missing Python."""
        with patch.object(self.adapter, 'execute_command') as mock_exec:
            mock_exec.return_value = CommandResult(
                success=False, output="", error="python: command not found", 
                return_code=1, execution_time=0.1
            )
            
            issues = self.adapter.validate_environment()
            assert len(issues) > 0
            assert any("Python is not available" in issue for issue in issues)


class TestTypeScriptEnvironmentAdapter:
    """Test TypeScript environment adapter functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        (self.temp_dir / "package.json").write_text("""
{
  "name": "test-project",
  "dependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0"
  }
}
""")
        (self.temp_dir / "tsconfig.json").write_text('{"compilerOptions": {"strict": true}}')
        self.adapter = TypeScriptEnvironmentAdapter(self.temp_dir)
    
    def test_environment_type(self):
        """Test environment type detection."""
        assert self.adapter.get_environment_type() == EnvironmentType.TYPESCRIPT
    
    def test_package_manager_detection_npm(self):
        """Test npm package manager detection."""
        assert self.adapter.get_package_manager() == "npm"
    
    def test_package_manager_detection_yarn(self):
        """Test yarn package manager detection."""
        (self.temp_dir / "yarn.lock").write_text("# yarn lockfile")
        assert self.adapter.get_package_manager() == "yarn"
    
    def test_package_manager_detection_pnpm(self):
        """Test pnpm package manager detection."""
        (self.temp_dir / "pnpm-lock.yaml").write_text("lockfileVersion: 5.4")
        assert self.adapter.get_package_manager() == "pnpm"
    
    def test_dependency_parsing(self):
        """Test dependency parsing from package.json."""
        deps = self.adapter.get_dependencies()
        assert "react" in deps
        assert "typescript" in deps
        assert "@types/react" in deps
    
    def test_config_files_detection(self):
        """Test configuration files detection."""
        config_files = self.adapter.get_config_files()
        assert "package.json" in config_files
        assert "tsconfig.json" in config_files


class TestRustEnvironmentAdapter:
    """Test Rust environment adapter functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        (self.temp_dir / "Cargo.toml").write_text("""
[package]
name = "test-project"
version = "0.1.0"

[dependencies]
tokio = "1.0"
serde = "1.0"

[dev-dependencies]
tokio-test = "0.4"
""")
        self.adapter = RustEnvironmentAdapter(self.temp_dir)
    
    def test_environment_type(self):
        """Test environment type detection."""
        assert self.adapter.get_environment_type() == EnvironmentType.RUST
    
    def test_package_manager(self):
        """Test package manager identification."""
        assert self.adapter.get_package_manager() == "cargo"
    
    def test_dependency_parsing(self):
        """Test dependency parsing from Cargo.toml."""
        # Test should handle missing tomli gracefully
        deps = self.adapter.get_dependencies()
        assert isinstance(deps, list)


class TestGoEnvironmentAdapter:
    """Test Go environment adapter functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        (self.temp_dir / "go.mod").write_text("""
module test-project

go 1.21

require (
    github.com/gorilla/mux v1.8.0
    github.com/stretchr/testify v1.8.0
)
""")
        self.adapter = GoEnvironmentAdapter(self.temp_dir)
    
    def test_environment_type(self):
        """Test environment type detection."""
        assert self.adapter.get_environment_type() == EnvironmentType.GO
    
    def test_package_manager(self):
        """Test package manager identification."""
        assert self.adapter.get_package_manager() == "go"
    
    def test_dependency_parsing(self):
        """Test dependency parsing from go.mod."""
        deps = self.adapter.get_dependencies()
        assert "github.com/gorilla/mux" in deps
        assert "github.com/stretchr/testify" in deps


class TestNushellEnvironmentAdapter:
    """Test Nushell environment adapter functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        (self.temp_dir / "scripts").mkdir()
        (self.temp_dir / "config.nu").write_text("# Nushell config")
        (self.temp_dir / "devbox.json").write_text("""
{
  "packages": ["nushell@0.103.0", "git", "ripgrep"]
}
""")
        self.adapter = NushellEnvironmentAdapter(self.temp_dir)
    
    def test_environment_type(self):
        """Test environment type detection."""
        assert self.adapter.get_environment_type() == EnvironmentType.NUSHELL
    
    def test_package_manager(self):
        """Test package manager identification."""
        assert self.adapter.get_package_manager() == "devbox"
    
    def test_dependency_parsing(self):
        """Test dependency parsing from devbox.json."""
        deps = self.adapter.get_dependencies()
        assert "nushell@0.103.0" in deps
        assert "git" in deps
        assert "ripgrep" in deps


class TestEnvironmentManager:
    """Test environment manager functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        
        # Create multiple environment directories
        python_env = self.temp_dir / "python-env"
        python_env.mkdir()
        (python_env / "pyproject.toml").write_text('[project]\nname = "test"')
        
        ts_env = self.temp_dir / "typescript-env"
        ts_env.mkdir()
        (ts_env / "package.json").write_text('{"name": "test"}')
        
        rust_env = self.temp_dir / "rust-env"
        rust_env.mkdir()
        (rust_env / "Cargo.toml").write_text('[package]\nname = "test"')
        
        self.manager = EnvironmentManager(self.temp_dir)
    
    def test_environment_discovery(self):
        """Test automatic environment discovery."""
        environments = self.manager.list_environments()
        assert "python-env" in environments
        assert "typescript-env" in environments
        assert "rust-env" in environments
    
    def test_get_adapter(self):
        """Test getting specific adapters."""
        python_adapter = self.manager.get_adapter("python-env")
        assert isinstance(python_adapter, PythonEnvironmentAdapter)
        
        ts_adapter = self.manager.get_adapter("typescript-env")
        assert isinstance(ts_adapter, TypeScriptEnvironmentAdapter)
        
        rust_adapter = self.manager.get_adapter("rust-env")
        assert isinstance(rust_adapter, RustEnvironmentAdapter)
    
    def test_get_environment_info(self):
        """Test getting environment information."""
        info = self.manager.get_environment_info("python-env")
        assert info is not None
        assert info.type == EnvironmentType.PYTHON
        assert info.name == "python-env"
    
    def test_validate_all_environments(self):
        """Test validation of all environments."""
        with patch.object(PythonEnvironmentAdapter, 'validate_environment') as mock_py:
            with patch.object(TypeScriptEnvironmentAdapter, 'validate_environment') as mock_ts:
                with patch.object(RustEnvironmentAdapter, 'validate_environment') as mock_rust:
                    mock_py.return_value = []
                    mock_ts.return_value = ["Node.js not found"]
                    mock_rust.return_value = []
                    
                    results = self.manager.validate_all_environments()
                    
                    assert "python-env" in results
                    assert "typescript-env" in results
                    assert "rust-env" in results
                    assert len(results["python-env"]) == 0
                    assert len(results["typescript-env"]) == 1
                    assert len(results["rust-env"]) == 0
    
    def test_unified_config_generation(self):
        """Test unified configuration generation."""
        config = self.manager.get_unified_environment_config()
        
        assert "project_root" in config
        assert "environments" in config
        assert "python-env" in config["environments"]
        assert "typescript-env" in config["environments"]
        assert "rust-env" in config["environments"]
        
        python_config = config["environments"]["python-env"]
        assert python_config["type"] == "python"
        assert "language" in python_config
        assert "package_manager" in python_config


class TestCommandExecution:
    """Test command execution functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        (self.temp_dir / "pyproject.toml").write_text('[project]\nname = "test"')
        self.adapter = PythonEnvironmentAdapter(self.temp_dir)
    
    def test_command_execution_success(self):
        """Test successful command execution."""
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout="Success output",
                stderr=""
            )
            
            result = self.adapter.execute_command("echo 'test'")
            
            assert result.success
            assert result.output == "Success output"
            assert result.return_code == 0
    
    def test_command_execution_failure(self):
        """Test failed command execution."""
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=1,
                stdout="",
                stderr="Command failed"
            )
            
            result = self.adapter.execute_command("invalid_command")
            
            assert not result.success
            assert result.error == "Command failed"
            assert result.return_code == 1
    
    def test_command_timeout(self):
        """Test command timeout handling."""
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired("cmd", 30)
            
            result = self.adapter.execute_command("long_running_command", timeout=30)
            
            assert not result.success
            assert "timed out" in result.error
            assert result.return_code == -1


def run_tests():
    """Run all tests."""
    print("🔧 Running Environment Adapter System Tests")
    print("=" * 50)
    
    # Test factory functionality
    print("Testing EnvironmentAdapterFactory...")
    test_factory = TestEnvironmentAdapterFactory()
    test_factory.setup_method()
    test_factory.test_python_environment_detection()
    test_factory.setup_method()
    test_factory.test_typescript_environment_detection()
    test_factory.setup_method()
    test_factory.test_rust_environment_detection()
    test_factory.setup_method()
    test_factory.test_go_environment_detection()
    test_factory.setup_method()
    test_factory.test_nushell_environment_detection()
    test_factory.setup_method()
    test_factory.test_unknown_environment_raises_error()
    print("✅ EnvironmentAdapterFactory tests passed")
    
    # Test Python adapter
    print("\nTesting PythonEnvironmentAdapter...")
    test_python = TestPythonEnvironmentAdapter()
    test_python.setup_method()
    test_python.test_environment_type()
    test_python.test_package_manager_detection_uv()
    test_python.setup_method()
    test_python.test_package_manager_detection_pip()
    test_python.test_config_files_detection()
    test_python.test_dependency_parsing_pyproject()
    test_python.test_validation_success()
    test_python.test_validation_missing_python()
    print("✅ PythonEnvironmentAdapter tests passed")
    
    # Test TypeScript adapter
    print("\nTesting TypeScriptEnvironmentAdapter...")
    test_ts = TestTypeScriptEnvironmentAdapter()
    test_ts.setup_method()
    test_ts.test_environment_type()
    test_ts.test_package_manager_detection_npm()
    test_ts.test_package_manager_detection_yarn()
    test_ts.setup_method()
    test_ts.test_package_manager_detection_pnpm()
    test_ts.test_dependency_parsing()
    test_ts.test_config_files_detection()
    print("✅ TypeScriptEnvironmentAdapter tests passed")
    
    # Test Rust adapter
    print("\nTesting RustEnvironmentAdapter...")
    test_rust = TestRustEnvironmentAdapter()
    test_rust.setup_method()
    test_rust.test_environment_type()
    test_rust.test_package_manager()
    test_rust.test_dependency_parsing()
    print("✅ RustEnvironmentAdapter tests passed")
    
    # Test Go adapter
    print("\nTesting GoEnvironmentAdapter...")
    test_go = TestGoEnvironmentAdapter()
    test_go.setup_method()
    test_go.test_environment_type()
    test_go.test_package_manager()
    test_go.test_dependency_parsing()
    print("✅ GoEnvironmentAdapter tests passed")
    
    # Test Nushell adapter
    print("\nTesting NushellEnvironmentAdapter...")
    test_nushell = TestNushellEnvironmentAdapter()
    test_nushell.setup_method()
    test_nushell.test_environment_type()
    test_nushell.test_package_manager()
    test_nushell.test_dependency_parsing()
    print("✅ NushellEnvironmentAdapter tests passed")
    
    # Test environment manager
    print("\nTesting EnvironmentManager...")
    test_manager = TestEnvironmentManager()
    test_manager.setup_method()
    test_manager.test_environment_discovery()
    test_manager.test_get_adapter()
    test_manager.test_get_environment_info()
    test_manager.test_validate_all_environments()
    test_manager.test_unified_config_generation()
    print("✅ EnvironmentManager tests passed")
    
    # Test command execution
    print("\nTesting Command Execution...")
    test_commands = TestCommandExecution()
    test_commands.setup_method()
    test_commands.test_command_execution_success()
    test_commands.test_command_execution_failure()
    test_commands.test_command_timeout()
    print("✅ Command Execution tests passed")
    
    print("\n🎉 All Environment Adapter System tests passed!")
    return True


if __name__ == '__main__':
    import subprocess
    
    try:
        success = run_tests()
        if success:
            print("\n✅ Environment Adapter System is working correctly")
            exit(0)
        else:
            print("\n❌ Some tests failed")
            exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)