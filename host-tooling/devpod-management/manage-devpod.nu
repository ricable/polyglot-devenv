#!/usr/bin/env nu

# Centralized DevPod Management Script
# Handles all DevPod operations for any environment (python, typescript, rust, go, nushell)
# Usage: nu manage-devpod.nu <command> <environment>

def main [command?: string, environment?: string] {
    # Show usage if no arguments provided
    if ($command | is-empty) {
        show usage
        return
    }
    
    if ($environment | is-empty) {
        error make {
            msg: "Environment parameter is required"
            help: "Usage: nu manage-devpod.nu <command> <environment>"
        }
    }
    let valid_environments = ["python", "typescript", "rust", "go", "nushell"]
    let valid_commands = ["provision", "connect", "start", "stop", "delete", "sync", "status", "help"]
    
    if $environment not-in $valid_environments {
        error make {
            msg: $"Invalid environment: ($environment)"
            help: $"Valid environments: ($valid_environments | str join ', ')"
        }
    }
    
    if $command not-in $valid_commands {
        error make {
            msg: $"Invalid command: ($command)"
            help: $"Valid commands: ($valid_commands | str join ', ')"
        }
    }
    
    match $command {
        "provision" => { provision $environment }
        "connect" => { connect $environment }
        "start" => { start $environment }
        "stop" => { stop $environment }
        "delete" => { delete $environment }
        "sync" => { sync $environment }
        "status" => { status $environment }
        "help" => { help_command $environment }
        _ => { error make { msg: $"Unknown command: ($command)" } }
    }
}

def provision [environment: string] {
    print $"🚀 Provisioning ($environment) DevPod workspace..."
    
    let script_path = $"../../devpod-automation/scripts/provision-($environment).sh"
    
    if not ($script_path | path exists) {
        error make {
            msg: $"Provisioning script not found: ($script_path)"
            help: "Make sure the devpod-automation scripts are properly set up"
        }
    }
    
    bash $script_path
}

def connect [environment: string] {
    print $"ℹ️  Connect to ($environment) DevPod workspace:"
    print "Each provision creates a new workspace. Use the provision command to create and connect."
    print $"Or use 'devpod list' to see existing workspaces and connect manually."
}

def start [environment: string] {
    print $"ℹ️  Start ($environment) DevPod workspace:"
    print "Use the provision command to create a new workspace or 'devpod list' to see existing ones."
    print $"Then use 'devpod start <workspace-name>' to start a specific workspace."
}

def stop [environment: string] {
    print $"🛑 Available ($environment) workspaces:"
    
    let workspaces = try {
        bash -c $"devpod list | grep polyglot-($environment)-devpod"
    } catch {
        ""
    }
    
    if ($workspaces | is-empty) {
        print $"No ($environment) workspaces found"
        print $"Run 'nu manage-devpod.nu provision ($environment)' to create one"
    } else {
        print $workspaces
        print $"Use 'devpod stop <workspace-name>' to stop a specific workspace"
    }
}

def delete [environment: string] {
    print $"🗑️  ($environment) workspaces to delete:"
    
    let workspaces = try {
        bash -c $"devpod list | grep polyglot-($environment)-devpod"
    } catch {
        ""
    }
    
    if ($workspaces | is-empty) {
        print $"No ($environment) workspaces found"
    } else {
        print $workspaces
        print $"Use 'devpod delete <workspace-name>' to delete a specific workspace"
    }
}

def sync [environment: string] {
    print $"🔄 Sync ($environment) DevPod workspace:"
    print "To sync configuration changes:"
    print "1. Update devbox.json in the dev-env directory"
    print "2. Run the provision command to rebuild the workspace with new configuration"
}

def status [environment: string] {
    print $"📊 ($environment) DevPod workspaces:"
    
    let workspaces = try {
        bash -c $"devpod list | grep polyglot-($environment)-devpod"
    } catch {
        ""
    }
    
    if ($workspaces | is-empty) {
        print $"No ($environment) workspaces found."
        print $"Run 'nu manage-devpod.nu provision ($environment)' to create one"
    } else {
        print $workspaces
    }
}

def help_command [environment: string] {
    print $"🔧 DevPod Management for ($environment)"
    print ""
    print "Available commands:"
    print "  provision  - Create and provision a new DevPod workspace"
    print "  connect    - Show connection instructions"
    print "  start      - Show workspace start instructions"
    print "  stop       - List and stop workspaces"
    print "  delete     - List and delete workspaces"
    print "  sync       - Sync configuration changes"
    print "  status     - Show workspace status"
    print "  help       - Show this help message"
    print ""
    print "Examples:"
    print $"  nu manage-devpod.nu provision ($environment)"
    print $"  nu manage-devpod.nu status ($environment)"
    print $"  nu manage-devpod.nu stop ($environment)"
    print ""
    print "Direct devpod commands:"
    print "  devpod list                    - List all workspaces"
    print "  devpod start <workspace-name>  - Start a workspace"
    print "  devpod stop <workspace-name>   - Stop a workspace"
    print "  devpod delete <workspace-name> - Delete a workspace"
}

# Show help if no arguments provided  
def "show usage" [] {
    print "DevPod Management Script"
    print "Usage: nu manage-devpod.nu <command> <environment>"
    print ""
    print "Commands: provision, connect, start, stop, delete, sync, status, help"
    print "Environments: python, typescript, rust, go, nushell"
    print ""
    print "Examples:"
    print "  nu manage-devpod.nu provision python"
    print "  nu manage-devpod.nu status typescript"
    print "  nu manage-devpod.nu help rust"
}