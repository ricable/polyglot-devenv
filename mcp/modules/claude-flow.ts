import { z } from "zod";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { executeCommand, getWorkspaceRoot, isValidEnvironment, createErrorResult, createSuccessResult, validateToolExecution } from "../polyglot-utils.js";
import type { CommandResult } from "../polyglot-types.js";

// Claude-Flow Tool Schemas
export const ClaudeFlowInitSchema = z.object({
  environment: z.string().describe("Environment to initialize Claude-Flow in"),
  force: z.boolean().default(false).describe("Force re-initialization if already exists"),
});

export const ClaudeFlowWizardSchema = z.object({
  environment: z.string().describe("Environment to run hive-mind wizard in"),
  interactive: z.boolean().default(true).describe("Run in interactive mode"),
});

export const ClaudeFlowStartSchema = z.object({
  environment: z.string().describe("Environment to start Claude-Flow daemon in"),
  background: z.boolean().default(true).describe("Run in background mode"),
});

export const ClaudeFlowStopSchema = z.object({
  environment: z.string().describe("Environment to stop Claude-Flow daemon in"),
  force: z.boolean().default(false).describe("Force stop all processes"),
});

export const ClaudeFlowStatusSchema = z.object({
  environment: z.string().optional().describe("Specific environment to check, or all if not specified"),
  detailed: z.boolean().default(false).describe("Include detailed status information"),
});

export const ClaudeFlowMonitorSchema = z.object({
  environment: z.string().describe("Environment to monitor"),
  duration: z.number().optional().describe("Duration to monitor in seconds"),
  interval: z.number().default(5).describe("Update interval in seconds"),
});

export const ClaudeFlowSpawnSchema = z.object({
  environment: z.string().describe("Environment to spawn agent in"),
  task: z.string().describe("Task description for AI agent"),
  context: z.record(z.any()).optional().describe("Additional context for task"),
  claude: z.boolean().default(true).describe("Use Claude AI agent"),
});

export const ClaudeFlowLogsSchema = z.object({
  environment: z.string().describe("Environment to get logs from"),
  lines: z.number().default(50).describe("Number of log lines to retrieve"),
  follow: z.boolean().default(false).describe("Follow log output in real-time"),
});

export const ClaudeFlowHiveMindSchema = z.object({
  environment: z.string().describe("Environment for hive-mind coordination"),
  command: z.enum(["spawn", "status", "list", "coordinate"]).describe("Hive-mind command"),
  agents: z.array(z.string()).optional().describe("Agent IDs for coordination"),
  task: z.string().optional().describe("Task for agent spawning"),
});

export const ClaudeFlowTerminalMgmtSchema = z.object({
  environment: z.string().describe("Environment for terminal management"),
  action: z.enum(["list", "create", "attach", "detach", "kill"]).describe("Terminal management action"),
  terminal_id: z.string().optional().describe("Terminal ID for specific actions"),
  command: z.string().optional().describe("Command to run in new terminal"),
});

// Claude-Flow Tool Definitions
export const claudeFlowTools: Tool[] = [
  {
    name: "claude_flow_init",
    description: "Initialize Claude-Flow system in specified environment",
    inputSchema: zodToJsonSchema(ClaudeFlowInitSchema) as any,
  },
  {
    name: "claude_flow_wizard",
    description: "Run Claude-Flow hive-mind wizard for interactive setup",
    inputSchema: zodToJsonSchema(ClaudeFlowWizardSchema) as any,
  },
  {
    name: "claude_flow_start",
    description: "Start Claude-Flow daemon in specified environment",
    inputSchema: zodToJsonSchema(ClaudeFlowStartSchema) as any,
  },
  {
    name: "claude_flow_stop",
    description: "Stop Claude-Flow daemon in specified environment",
    inputSchema: zodToJsonSchema(ClaudeFlowStopSchema) as any,
  },
  {
    name: "claude_flow_status",
    description: "Check Claude-Flow system status across environments",
    inputSchema: zodToJsonSchema(ClaudeFlowStatusSchema) as any,
  },
  {
    name: "claude_flow_monitor",
    description: "Monitor Claude-Flow real-time activity and metrics",
    inputSchema: zodToJsonSchema(ClaudeFlowMonitorSchema) as any,
  },
  {
    name: "claude_flow_spawn",
    description: "Spawn AI agents with context-aware tasks",
    inputSchema: zodToJsonSchema(ClaudeFlowSpawnSchema) as any,
  },
  {
    name: "claude_flow_logs",
    description: "Access Claude-Flow log files for debugging",
    inputSchema: zodToJsonSchema(ClaudeFlowLogsSchema) as any,
  },
  {
    name: "claude_flow_hive_mind",
    description: "Multi-agent coordination and task distribution",
    inputSchema: zodToJsonSchema(ClaudeFlowHiveMindSchema) as any,
  },
  {
    name: "claude_flow_terminal_mgmt",
    description: "Terminal session management and coordination",
    inputSchema: zodToJsonSchema(ClaudeFlowTerminalMgmtSchema) as any,
  },
];

// Claude-Flow Validation Utilities
async function validateClaudeFlowEnvironment(environment: string): Promise<CommandResult | null> {
  // Basic environment validation
  const basicValidation = await validateToolExecution("claude_flow", environment);
  if (basicValidation) return basicValidation;

  // With npx, we don't need to check for global installation
  // npx will automatically download and run claude-flow@alpha if not available
  return null; // Validation passed
}

async function executeClaudeFlowCommand(environment: string, command: string): Promise<CommandResult> {
  // Validate environment first
  const validation = await validateClaudeFlowEnvironment(environment);
  if (validation) return validation;

  const workspaceRoot = getWorkspaceRoot();
  const envPath = `${workspaceRoot}/${environment}`;
  
  try {
    // Execute npx claude-flow@alpha commands directly in the environment directory
    const result = await executeCommand(`cd ${envPath} && ${command}`);
    return result;
  } catch (error) {
    return createErrorResult(
      `Failed to execute Claude-Flow command: ${error instanceof Error ? error.message : String(error)}`,
      { metadata: { toolName: "claude_flow", operation: "command-execution" } }
    );
  }
}

// Claude-Flow Tool Handlers
export async function handleClaudeFlowInit(args: z.infer<typeof ClaudeFlowInitSchema>): Promise<CommandResult> {
  const { environment, force } = args;
  
  if (!isValidEnvironment(environment)) {
    return createErrorResult(`Invalid environment: ${environment}`);
  }

  const command = force 
    ? `npx --yes claude-flow@alpha init --force`
    : `npx --yes claude-flow@alpha init`;
  
  const result = await executeClaudeFlowCommand(environment, command);
  
  if (result.success) {
    return createSuccessResult(
      result.output || `Claude-Flow initialized in ${environment}`,
      { duration: result.duration, metadata: { toolName: "claude_flow_init", environment } }
    );
  }
  
  return result;
}

export async function handleClaudeFlowWizard(args: z.infer<typeof ClaudeFlowWizardSchema>): Promise<CommandResult> {
  const { environment, interactive } = args;
  
  if (!isValidEnvironment(environment)) {
    return createErrorResult(`Invalid environment: ${environment}`);
  }

  const command = interactive
    ? `npx --yes claude-flow@alpha hive-mind wizard`
    : `npx --yes claude-flow@alpha hive-mind wizard --no-interactive`;
  
  const result = await executeClaudeFlowCommand(environment, command);
  
  if (result.success) {
    return createSuccessResult(
      result.output || `Claude-Flow wizard completed in ${environment}`,
      { duration: result.duration, metadata: { toolName: "claude_flow_wizard", environment } }
    );
  }
  
  return result;
}

export async function handleClaudeFlowStart(args: z.infer<typeof ClaudeFlowStartSchema>): Promise<CommandResult> {
  const { environment, background } = args;
  
  if (!isValidEnvironment(environment)) {
    return createErrorResult(`Invalid environment: ${environment}`);
  }

  const command = background
    ? `npx --yes claude-flow@alpha start --daemon`
    : `npx --yes claude-flow@alpha start`;
  
  const result = await executeClaudeFlowCommand(environment, command);
  
  if (result.success) {
    return createSuccessResult(
      result.output || `Claude-Flow started in ${environment}`,
      { duration: result.duration, metadata: { toolName: "claude_flow_start", environment } }
    );
  }
  
  return result;
}

export async function handleClaudeFlowStop(args: z.infer<typeof ClaudeFlowStopSchema>): Promise<CommandResult> {
  const { environment, force } = args;
  
  if (!isValidEnvironment(environment)) {
    return createErrorResult(`Invalid environment: ${environment}`);
  }

  const command = force
    ? `npx --yes claude-flow@alpha stop --force`
    : `npx --yes claude-flow@alpha stop`;
  
  const result = await executeClaudeFlowCommand(environment, command);
  
  if (result.success) {
    return createSuccessResult(
      result.output || `Claude-Flow stopped in ${environment}`,
      { duration: result.duration, metadata: { toolName: "claude_flow_stop", environment } }
    );
  }
  
  return result;
}

export async function handleClaudeFlowStatus(args: z.infer<typeof ClaudeFlowStatusSchema>): Promise<CommandResult> {
  const { environment, detailed } = args;
  
  try {
    if (environment) {
      if (!isValidEnvironment(environment)) {
        return createErrorResult(`Invalid environment: ${environment}`);
      }

      const command = detailed
        ? `npx --yes claude-flow@alpha status --detailed`
        : `npx --yes claude-flow@alpha status`;
      
      const result = await executeClaudeFlowCommand(environment, command);
      
      if (result.success) {
        return createSuccessResult(
          result.output || `Claude-Flow status for ${environment}`,
          { duration: result.duration, metadata: { toolName: "claude_flow_status", environment } }
        );
      }
      
      return result;
    } else {
      // Get status for all environments
      const environments = ["dev-env/python", "dev-env/typescript", "dev-env/rust", "dev-env/go", "dev-env/nushell"];
      const results = [];
      
      for (const env of environments) {
        const command = detailed
          ? `npx --yes claude-flow@alpha status --detailed`
          : `npx --yes claude-flow@alpha status`;
        
        try {
          const result = await executeClaudeFlowCommand(env, command);
          results.push(`${env}: ${result.success ? 'Running' : 'Stopped'}`);
        } catch {
          results.push(`${env}: Unknown`);
        }
      }
      
      return createSuccessResult(
        results.join('\n'),
        { metadata: { toolName: "claude_flow_status", operation: "all-environments" } }
      );
    }
  } catch (error) {
    return createErrorResult(
      `Failed to get Claude-Flow status: ${error instanceof Error ? error.message : String(error)}`,
      { metadata: { toolName: "claude_flow_status", operation: "status-check" } }
    );
  }
}

export async function handleClaudeFlowMonitor(args: z.infer<typeof ClaudeFlowMonitorSchema>): Promise<CommandResult> {
  const { environment, duration, interval } = args;
  
  if (!isValidEnvironment(environment)) {
    return createErrorResult(`Invalid environment: ${environment}`);
  }

  let command = `npx --yes claude-flow@alpha monitor --interval ${interval}`;
  if (duration) {
    command += ` --duration ${duration}`;
  }
  
  const result = await executeClaudeFlowCommand(environment, command);
  
  if (result.success) {
    return createSuccessResult(
      result.output || `Monitoring Claude-Flow in ${environment}`,
      { duration: result.duration, metadata: { toolName: "claude_flow_monitor", environment } }
    );
  }
  
  return result;
}

export async function handleClaudeFlowSpawn(args: z.infer<typeof ClaudeFlowSpawnSchema>): Promise<CommandResult> {
  const { environment, task, context, claude } = args;
  
  if (!isValidEnvironment(environment)) {
    return {
      success: false,
      output: "",
      error: `Invalid environment: ${environment}`,
      exitCode: 1,
      duration: 0,
      timestamp: new Date(),
    };
  }

  const workspaceRoot = getWorkspaceRoot();
  const envPath = `${workspaceRoot}/${environment}`;
  
  try {
    let command = `cd ${envPath} && npx claude-flow@alpha hive-mind spawn "${task}"`;
    if (claude) {
      command += " --claude";
    }
    if (context) {
      command += ` --context '${JSON.stringify(context)}'`;
    }
    
    const result = await executeCommand(command);
    
    return {
      success: result.success,
      output: result.output || `Agent spawned in ${environment} with task: ${task}`,
      error: result.error,
      exitCode: result.success ? 0 : 1,
      duration: 0,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: `Failed to spawn Claude-Flow agent: ${error instanceof Error ? error.message : String(error)}`,
      exitCode: 1,
      duration: 0,
      timestamp: new Date(),
    };
  }
}

export async function handleClaudeFlowLogs(args: z.infer<typeof ClaudeFlowLogsSchema>): Promise<CommandResult> {
  const { environment, lines, follow } = args;
  
  if (!isValidEnvironment(environment)) {
    return createErrorResult(`Invalid environment: ${environment}`);
  }

  let command = `npx --yes claude-flow@alpha logs --lines ${lines}`;
  if (follow) {
    command += " --follow";
  }
  
  const result = await executeClaudeFlowCommand(environment, command);
  
  if (result.success) {
    return createSuccessResult(
      result.output || `Claude-Flow logs from ${environment}`,
      { duration: result.duration, metadata: { toolName: "claude_flow_logs", environment } }
    );
  }
  
  return result;
}

export async function handleClaudeFlowHiveMind(args: z.infer<typeof ClaudeFlowHiveMindSchema>): Promise<CommandResult> {
  const { environment, command, agents, task } = args;
  
  if (!isValidEnvironment(environment)) {
    return {
      success: false,
      output: "",
      error: `Invalid environment: ${environment}`,
      exitCode: 1,
      duration: 0,
      timestamp: new Date(),
    };
  }

  const workspaceRoot = getWorkspaceRoot();
  const envPath = `${workspaceRoot}/${environment}`;
  
  try {
    let cmd = `cd ${envPath} && npx claude-flow@alpha hive-mind ${command}`;
    
    if (command === "spawn" && task) {
      cmd += ` "${task}" --claude`;
    }
    if (agents && agents.length > 0) {
      cmd += ` --agents ${agents.join(",")}`;
    }
    
    const result = await executeCommand(cmd);
    
    return {
      success: result.success,
      output: result.output || `Hive-mind ${command} completed in ${environment}`,
      error: result.error,
      exitCode: result.success ? 0 : 1,
      duration: 0,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: `Failed to execute hive-mind command: ${error instanceof Error ? error.message : String(error)}`,
      exitCode: 1,
      duration: 0,
      timestamp: new Date(),
    };
  }
}

export async function handleClaudeFlowTerminalMgmt(args: z.infer<typeof ClaudeFlowTerminalMgmtSchema>): Promise<CommandResult> {
  const { environment, action, terminal_id, command } = args;
  
  if (!isValidEnvironment(environment)) {
    return createErrorResult(`Invalid environment: ${environment}`);
  }

  let cmd = `npx --yes claude-flow@alpha terminal ${action}`;
  
  if (terminal_id) {
    cmd += ` --id ${terminal_id}`;
  }
  if (command && action === "create") {
    cmd += ` --command "${command}"`;
  }
  
  const result = await executeClaudeFlowCommand(environment, cmd);
  
  if (result.success) {
    return createSuccessResult(
      result.output || `Terminal ${action} completed in ${environment}`,
      { duration: result.duration, metadata: { toolName: "claude_flow_terminal_mgmt", environment } }
    );
  }
  
  return result;
}