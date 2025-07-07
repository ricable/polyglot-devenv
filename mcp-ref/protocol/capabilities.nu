#!/usr/bin/env nu

# MCP Server Capabilities Definition
# Defines all capabilities supported by the Polyglot Development MCP Server

use ../common.nu *

# Get complete server capabilities
export def get_server_capabilities [] -> record {
    {
        # Prompts capability
        prompts: {}
        
        # Resources capability with subscriptions and change notifications
        resources: {
            subscribe: true
            listChanged: true
        }
        
        # Tools capability  
        tools: {}
        
        # Logging capability
        logging: {}
        
        # Completions capability
        completions: {}
        
        # Experimental capabilities
        experimental: {
            # Sampling capability for LLM integration
            sampling: {}
        }
    }
}

# Check if a capability is supported
export def capability_supported [capability: string] -> bool {
    let capabilities = (get_server_capabilities)
    $capability in ($capabilities | columns)
}

# Get capability details
export def get_capability_details [capability: string] -> record {
    let capabilities = (get_server_capabilities)
    
    if (capability_supported $capability) {
        $capabilities | get $capability
    } else {
        {}
    }
}

# Validate client capabilities
export def validate_client_capabilities [client_caps: record] -> record {
    mut validation_result = {
        valid: true
        warnings: []
        errors: []
    }
    
    # Check for required capabilities
    if not ("roots" in ($client_caps | columns)) {
        $validation_result.warnings = ($validation_result.warnings | append "Client does not support roots capability")
    }
    
    # Check for recommended capabilities
    if not ("sampling" in ($client_caps | columns)) {
        $validation_result.warnings = ($validation_result.warnings | append "Client does not support sampling capability - advanced LLM features will be limited")
    }
    
    return $validation_result
}

# Get supported resource features
export def get_resource_features [] -> record {
    {
        pagination: true
        subscriptions: true
        templates: true
        binary_content: true
        text_content: true
        auto_updates: true
        change_notifications: true
        max_resources: 1000
        page_size: 10
    }
}

# Get supported tool features
export def get_tool_features [] -> record {
    {
        progress_notifications: true
        schema_validation: true
        async_execution: true
        long_running_operations: true
        binary_responses: true
        multi_modal_responses: true
        resource_references: true
        annotations: true
    }
}

# Get supported prompt features
export def get_prompt_features [] -> record {
    {
        arguments: true
        multi_turn: true
        resource_embedding: true
        image_content: true
        complex_arguments: true
        argument_validation: true
        completion_support: true
    }
}

# Get supported logging features
export def get_logging_features [] -> record {
    {
        levels: $MCP_LOG_LEVELS
        real_time_filtering: true
        structured_logging: true
        stderr_notifications: true
        automatic_logging: true
        log_rotation: false  # Not implemented yet
    }
}

# Get completions configuration
export def get_completions_config [] -> record {
    {
        # Environment completions
        environments: ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"]
        
        # Tool command completions
        commands: [
            "format", "lint", "test", "build", "clean", "install", "run",
            "setup", "validate", "deploy", "watch", "check", "sync"
        ]
        
        # Log level completions
        log_levels: $MCP_LOG_LEVELS
        
        # Resource ID ranges
        resource_ids: (1..100 | each { |i| $i | into string })
        
        # DevPod operations
        devpod_ops: [
            "provision", "list", "stop", "delete", "connect", "sync", "status"
        ]
        
        # Performance metrics
        performance_metrics: [
            "cpu", "memory", "disk", "network", "build_time", "test_time"
        ]
        
        # Security scan types
        security_scans: [
            "secrets", "vulnerabilities", "dependencies", "compliance"
        ]
        
        # File types for analysis
        file_types: [
            ".py", ".ts", ".js", ".rs", ".go", ".nu", ".md", ".json", ".yaml"
        ]
    }
}

# Get transport capabilities
export def get_transport_capabilities [] -> record {
    {
        stdio: {
            supported: true
            description: "Standard input/output transport for local communication"
            features: ["real_time", "bidirectional", "low_latency"]
        }
        
        sse: {
            supported: true
            description: "Server-Sent Events transport for web integration"
            features: ["web_compatible", "unidirectional", "reconnectable"]
        }
        
        streamable_http: {
            supported: true
            description: "Streamable HTTP transport for modern web applications"
            features: ["streaming", "http_compatible", "web_standard"]
        }
    }
}

# Get performance characteristics
export def get_performance_characteristics [] -> record {
    {
        max_concurrent_requests: 10
        request_timeout_seconds: 300
        resource_update_interval_seconds: 10
        log_notification_interval_seconds: 20
        stderr_notification_interval_seconds: 30
        max_progress_steps: 100
        max_resource_size_bytes: (10 * 1024 * 1024)  # 10MB
        max_response_time_ms: 5000
    }
}

# Get security features
export def get_security_features [] -> record {
    {
        input_validation: true
        schema_enforcement: true
        path_traversal_protection: true
        command_injection_protection: true
        environment_isolation: true
        secure_file_access: true
        audit_logging: true
        rate_limiting: false  # Not implemented yet
    }
}

# Get integration features
export def get_integration_features [] -> record {
    {
        devbox: {
            supported: true
            environments: ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"]
            features: ["isolation", "reproducibility", "package_management"]
        }
        
        nushell: {
            supported: true
            version: "0.103.0+"
            features: ["scripting", "automation", "data_processing", "cross_platform"]
        }
        
        context_engineering: {
            supported: true
            features: ["prp_generation", "dojo_integration", "pattern_extraction"]
        }
        
        devpod: {
            supported: true
            features: ["containerization", "multi_workspace", "vscode_integration"]
        }
        
        performance_monitoring: {
            supported: true
            features: ["real_time_metrics", "analytics", "optimization"]
        }
        
        security_scanning: {
            supported: true
            features: ["secret_detection", "vulnerability_assessment", "compliance"]
        }
    }
}

# Export comprehensive capability summary
export def get_full_capability_summary [] -> record {
    {
        server_info: {
            name: "polyglot-dev"
            version: "1.0.0"
            description: "Comprehensive MCP server for polyglot development environment"
            protocol_version: $MCP_PROTOCOL_VERSION
        }
        
        capabilities: (get_server_capabilities)
        features: {
            resources: (get_resource_features)
            tools: (get_tool_features)
            prompts: (get_prompt_features)
            logging: (get_logging_features)
            security: (get_security_features)
        }
        
        completions: (get_completions_config)
        transports: (get_transport_capabilities)
        performance: (get_performance_characteristics)
        integrations: (get_integration_features)
        
        limits: {
            max_resources: 1000
            max_tools: 50
            max_prompts: 20
            max_concurrent_operations: 10
            max_subscription_count: 100
        }
    }
}

# Utility function to check feature availability
export def feature_available [category: string, feature: string] -> bool {
    let features = match $category {
        "resources" => (get_resource_features)
        "tools" => (get_tool_features)
        "prompts" => (get_prompt_features)
        "logging" => (get_logging_features)
        "security" => (get_security_features)
        _ => {}
    }
    
    if ($feature in ($features | columns)) {
        $features | get $feature
    } else {
        false
    }
}

export def main [] {
    print "MCP Server Capabilities Module"
    print "Defines all capabilities and features supported by the server"
    
    let summary = (get_full_capability_summary)
    print $"Server: ($summary.server_info.name) v($summary.server_info.version)"
    print $"Protocol: ($summary.server_info.protocol_version)"
    print $"Capabilities: ($summary.capabilities | columns | str join ', ')"
}