#!/usr/bin/env nu

# Resource Templates for Polyglot Development MCP Server
# Provides dynamic URI templates for resource construction

use ../common.nu *

# List all resource templates
export def list_resource_templates [] -> list {
    [
        # Documentation templates
        {
            uriTemplate: "polyglot://documentation/{section}"
            name: "Documentation Template"
            description: "Access project documentation by section (claude-md, claude-local-template, etc.)"
        }
        
        {
            uriTemplate: "polyglot://documentation/context-engineering/{topic}"
            name: "Context Engineering Documentation Template"
            description: "Access context engineering documentation by topic"
        }
        
        {
            uriTemplate: "polyglot://documentation/devbox/{environment}"
            name: "DevBox Documentation Template"
            description: "Access devbox environment documentation"
        }
        
        # Configuration templates
        {
            uriTemplate: "polyglot://config/devbox/{environment}"
            name: "DevBox Configuration Template"
            description: "Access devbox configuration by environment (python-env, typescript-env, rust-env, go-env, nushell-env)"
        }
        
        {
            uriTemplate: "polyglot://config/nushell/{config_name}"
            name: "Nushell Configuration Template"
            description: "Access nushell configuration files (common, etc.)"
        }
        
        {
            uriTemplate: "polyglot://config/claude/{config_type}"
            name: "Claude Configuration Template"
            description: "Access Claude Code configuration (hooks, etc.)"
        }
        
        # Example templates
        {
            uriTemplate: "polyglot://examples/dojo/{feature}/{component}"
            name: "CopilotKit Dojo Template"
            description: "Access CopilotKit dojo patterns by feature and component"
        }
        
        {
            uriTemplate: "polyglot://examples/prps/{prp_name}"
            name: "PRP Template"
            description: "Access generated Product Requirements Prompts by name"
        }
        
        # Script templates
        {
            uriTemplate: "polyglot://scripts/nushell/{script_name}"
            name: "Nushell Script Template"
            description: "Access nushell automation scripts by name"
        }
        
        {
            uriTemplate: "polyglot://scripts/devpod/{script_name}"
            name: "DevPod Script Template"
            description: "Access DevPod automation scripts by name"
        }
        
        # Performance templates
        {
            uriTemplate: "polyglot://performance/{metric_type}"
            name: "Performance Metrics Template"
            description: "Access performance data by type (logs, metrics, trends)"
        }
        
        # Security templates
        {
            uriTemplate: "polyglot://security/{scan_type}"
            name: "Security Scan Template"
            description: "Access security scan results by type (scan-results, compliance)"
        }
        
        # Test resource templates (from reference implementation)
        {
            uriTemplate: "test://static/resource/{id}"
            name: "Test Resource Template"
            description: "Access test resources by ID (1-100). Even IDs contain text, odd IDs contain binary data."
        }
    ]
}

# Get template by name
export def get_template_by_name [name: string] -> record {
    let templates = (list_resource_templates)
    
    for template in $templates {
        if ($template.name == $name) {
            return $template
        }
    }
    
    error make { msg: $"Template not found: ($name)" }
}

# Validate template variables
export def validate_template_variables [template: record, variables: record] -> record {
    let uri_template = $template.uriTemplate
    
    # Extract template variables (anything in curly braces)
    let template_vars = (extract_template_variables $uri_template)
    
    # Check if all required variables are provided
    let missing_variables = $template_vars | where { |var|
        not ($var in ($variables | columns))
    }
    
    # Validate variable values based on template context
    let variable_validations = $variables | columns | each { |var|
        let value = ($variables | get $var)
        
        match $var {
            "environment" => {
                if not (validate environment $value) {
                    {type: "invalid", var: $var, message: $"($var): ($value)"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "id" => {
                try {
                    let id_num = ($value | into int)
                    if ($id_num < 1) or ($id_num > 100) {
                        {type: "invalid", var: $var, message: $"($var): must be between 1-100"}
                    } else {
                        {type: "valid", var: $var}
                    }
                } catch {
                    {type: "invalid", var: $var, message: $"($var): must be a number"}
                }
            }
            "section" => {
                let valid_sections = ["claude-md", "claude-local-template"]
                if not ($value in $valid_sections) {
                    {type: "warning", var: $var, message: $"($var): ($value) may not exist"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "topic" => {
                if ($value | str length) < 1 {
                    {type: "invalid", var: $var, message: $"($var): cannot be empty"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "feature" => {
                if ($value | str length) < 1 {
                    {type: "invalid", var: $var, message: $"($var): cannot be empty"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "component" => {
                if ($value | str length) < 1 {
                    {type: "invalid", var: $var, message: $"($var): cannot be empty"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "script_name" => {
                if ($value | str length) < 1 {
                    {type: "invalid", var: $var, message: $"($var): cannot be empty"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "prp_name" => {
                if ($value | str length) < 1 {
                    {type: "invalid", var: $var, message: $"($var): cannot be empty"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "metric_type" => {
                let valid_metrics = ["logs", "metrics", "trends"]
                if not ($value in $valid_metrics) {
                    {type: "invalid", var: $var, message: $"($var): must be one of ($valid_metrics | str join ', ')"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "scan_type" => {
                let valid_scans = ["scan-results", "compliance"]
                if not ($value in $valid_scans) {
                    {type: "invalid", var: $var, message: $"($var): must be one of ($valid_scans | str join ', ')"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "config_name" => {
                let valid_configs = ["common"]
                if not ($value in $valid_configs) {
                    {type: "warning", var: $var, message: $"($var): ($value) may not exist"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            "config_type" => {
                let valid_types = ["hooks"]
                if not ($value in $valid_types) {
                    {type: "warning", var: $var, message: $"($var): ($value) may not exist"}
                } else {
                    {type: "valid", var: $var}
                }
            }
            _ => {
                {type: "valid", var: $var}
            }
        }
    }
    
    # Aggregate results
    let invalid_variables = $variable_validations | where { |v| $v.type == "invalid" } | get message
    let warnings = $variable_validations | where { |v| $v.type == "warning" } | get message
    let has_invalid = ($invalid_variables | length) > 0
    let has_missing = ($missing_variables | length) > 0
    
    {
        valid: (not $has_invalid and not $has_missing)
        missing_variables: $missing_variables
        invalid_variables: $invalid_variables
        warnings: $warnings
    }
}

# Construct URI from template and variables
export def construct_uri [template: record, variables: record] -> string {
    # Validate variables first
    let validation = (validate_template_variables $template $variables)
    
    if not $validation.valid {
        let errors = ($validation.missing_variables | append $validation.invalid_variables | str join "; ")
        error make { msg: $"Template validation failed: ($errors)" }
    }
    
    # Replace template variables
    let uri = $variables | columns | reduce --fold $template.uriTemplate { |var, acc|
        let value = ($variables | get $var)
        $acc | str replace --all $"{($var)}" $value
    }
    
    return $uri
}

# Extract template variables from URI template
def extract_template_variables [uri_template: string] -> list {
    # Simple regex-like extraction of {variable} patterns
    let parts = ($uri_template | split row "{")
    
    let variables = $parts | skip 1 | each { |part|
        if ($part | str contains "}") {
            $part | split row "}" | first
        } else {
            null
        }
    } | compact
    
    return ($variables | uniq)
}

# Get template suggestions based on partial URI
export def get_template_suggestions [partial_uri: string] -> list {
    let templates = (list_resource_templates)
    
    let suggestions = $templates | each { |template|
        let template_base = ($template.uriTemplate | split row "{" | first)
        
        if ($partial_uri | str starts-with $template_base) or ($template_base | str starts-with $partial_uri) {
            {
                template: $template
                match_score: (calculate_match_score $partial_uri $template_base)
            }
        } else {
            null
        }
    } | compact
    
    # Sort by match score (higher is better)
    return ($suggestions | sort-by match_score | reverse)
}

# Calculate match score for template suggestion
def calculate_match_score [partial_uri: string, template_base: string] -> int {
    let partial_len = ($partial_uri | str length)
    let template_len = ($template_base | str length)
    
    if ($partial_uri | str starts-with $template_base) {
        return ($template_len * 2)  # Exact prefix match gets higher score
    } else if ($template_base | str starts-with $partial_uri) {
        return $partial_len
    } else {
        return 0
    }
}

# Get available values for template variables
export def get_template_variable_values [template: record, variable: string] -> list {
    match $variable {
        "environment" => ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"]
        "section" => ["claude-md", "claude-local-template"]
        "topic" => (get_available_context_topics)
        "feature" => (get_available_dojo_features)
        "component" => (get_available_dojo_components)
        "script_name" => (get_available_scripts)
        "prp_name" => (get_available_prps)
        "metric_type" => ["logs", "metrics", "trends"]
        "scan_type" => ["scan-results", "compliance"]
        "config_name" => ["common"]
        "config_type" => ["hooks"]
        "id" => (1..100 | each { |i| $i | into string })
        _ => []
    }
}

# Get available context engineering topics
def get_available_context_topics [] -> list {
    let workspace_root = (get workspace_root)
    let docs_dir = ($workspace_root | path join "context-engineering" "docs")
    
    if ($docs_dir | path exists) {
        try {
            ls $docs_dir 
            | where type == file 
            | where name =~ "\.md$"
            | get name 
            | each { |path| $path | path basename | path parse | get stem }
        } catch {
            []
        }
    } else {
        []
    }
}

# Get available dojo features
def get_available_dojo_features [] -> list {
    let workspace_root = (get workspace_root)
    let dojo_dir = ($workspace_root | path join "context-engineering" "examples" "dojo" "src" "app")
    
    if ($dojo_dir | path exists) {
        try {
            ls $dojo_dir 
            | where type == dir 
            | where name =~ "feature$"
            | get name 
            | each { |path| $path | path basename }
        } catch {
            []
        }
    } else {
        []
    }
}

# Get available dojo components
def get_available_dojo_components [] -> list {
    let workspace_root = (get workspace_root)
    let dojo_dir = ($workspace_root | path join "context-engineering" "examples" "dojo" "src" "app")
    
    if ($dojo_dir | path exists) {
        try {
            let features = (get_available_dojo_features)
            mut components = []
            
            for feature in $features {
                let feature_dir = ($dojo_dir | path join $feature)
                let feature_components = (ls $feature_dir | where type == dir | get name | each { |path| $path | path basename })
                $components = ($components | append $feature_components)
            }
            
            return ($components | uniq)
        } catch {
            []
        }
    } else {
        []
    }
}

# Get available scripts
def get_available_scripts [] -> list {
    let workspace_root = (get workspace_root)
    
    mut scripts = []
    
    # Nushell scripts
    let nushell_scripts_dir = ($workspace_root | path join "nushell-env" "scripts")
    if ($nushell_scripts_dir | path exists) {
        let nu_scripts = (ls $nushell_scripts_dir | where type == file | where name =~ "\.nu$" | get name | each { |path| $path | path basename | path parse | get stem })
        $scripts = ($scripts | append $nu_scripts)
    }
    
    # DevPod scripts
    let devpod_scripts_dir = ($workspace_root | path join "devpod-automation" "scripts")
    if ($devpod_scripts_dir | path exists) {
        let devpod_scripts = (ls $devpod_scripts_dir | where type == file | get name | each { |path| $path | path basename })
        $scripts = ($scripts | append $devpod_scripts)
    }
    
    return ($scripts | uniq)
}

# Get available PRPs
def get_available_prps [] -> list {
    let workspace_root = (get workspace_root)
    let prps_dir = ($workspace_root | path join "context-engineering" "PRPs")
    
    if ($prps_dir | path exists) {
        try {
            ls $prps_dir 
            | where type == file 
            | where name =~ "\.md$"
            | get name 
            | each { |path| $path | path basename | path parse | get stem }
        } catch {
            []
        }
    } else {
        []
    }
}

# Generate template usage examples
export def generate_template_examples [template: record] -> list {
    let variables = (extract_template_variables $template.uriTemplate)
    
    mut examples = []
    
    # Generate example based on template type
    match $template.name {
        "Documentation Template" => {
            $examples = ($examples | append (construct_uri $template { section: "claude-md" }))
            $examples = ($examples | append (construct_uri $template { section: "claude-local-template" }))
        }
        "DevBox Configuration Template" => {
            $examples = ($examples | append (construct_uri $template { environment: "python-env" }))
            $examples = ($examples | append (construct_uri $template { environment: "typescript-env" }))
        }
        "CopilotKit Dojo Template" => {
            $examples = ($examples | append (construct_uri $template { feature: "feature", component: "agentic_chat" }))
            $examples = ($examples | append (construct_uri $template { feature: "feature", component: "generative_ui" }))
        }
        "Test Resource Template" => {
            $examples = ($examples | append (construct_uri $template { id: "1" }))
            $examples = ($examples | append (construct_uri $template { id: "42" }))
            $examples = ($examples | append (construct_uri $template { id: "100" }))
        }
        _ => {
            # Generate generic examples
            if ($variables | length) > 0 {
                mut example_vars = {}
                for var in $variables {
                    let values = (get_template_variable_values $template $var)
                    if ($values | length) > 0 {
                        $example_vars = ($example_vars | insert $var ($values | first))
                    } else {
                        $example_vars = ($example_vars | insert $var $"example_($var)")
                    }
                }
                $examples = ($examples | append (construct_uri $template $example_vars))
            }
        }
    }
    
    return $examples
}

export def main [] {
    print "MCP Resource Templates"
    
    let templates = (list_resource_templates)
    print $"Total templates: ($templates | length)"
    
    print "\nAvailable templates:"
    for template in $templates {
        let variables = (extract_template_variables $template.uriTemplate)
        let examples = (generate_template_examples $template)
        
        print $"  ($template.name):"
        print $"    Template: ($template.uriTemplate)"
        print $"    Variables: ($variables | str join ', ')"
        if ($examples | length) > 0 {
            print $"    Example: ($examples | first)"
        }
        print ""
    }
}