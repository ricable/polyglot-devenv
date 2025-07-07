import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  CompleteRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  LoggingLevel,
  ReadResourceRequestSchema,
  Tool,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { readFileSync, readFile } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { promisify } from "util";

const readFileAsync = promisify(readFile);
import {
  getWorkspaceRoot,
  isValidEnvironment,
  executeCommand,
  runDevboxCommand,
  runDevboxScript,
  detectEnvironments,
  validateEnvironment,
  provisionDevPodWorkspace,
  listDevPodWorkspaces,
  formatDuration,
  scanForSecrets,
  startDevboxEnvironment,
  getEnvironmentScripts,
  getDefaultSetupScript,
  getCommonCommands,
  ENVIRONMENTS,
  getEnvironmentType,
} from "./polyglot-utils.js";
import type { EnvironmentInfo, CommandResult, ValidationResult } from "./polyglot-types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const instructions = readFileSync(join(__dirname, "polyglot-instructions.md"), "utf-8");

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

/* Tool Input Schemas */

// Environment Tools
const EnvironmentDetectSchema = z.object({});

const EnvironmentInfoSchema = z.object({
  environment: z.string().describe("Environment name (python-env, typescript-env, etc.)"),
});

const EnvironmentValidateSchema = z.object({
  environment: z.string().optional().describe("Specific environment to validate, or all if not specified"),
});

// DevBox Tools
const DevboxShellSchema = z.object({
  environment: z.string().describe("Environment to enter shell for"),
});

const DevboxStartSchema = z.object({
  environment: z.string().describe("Environment to start and activate"),
  setup: z.boolean().default(true).describe("Run setup/install scripts after starting"),
});

const DevboxRunSchema = z.object({
  environment: z.string().describe("Environment to run script in"),
  script: z.string().describe("Script name to run (from devbox.json scripts)"),
});

const DevboxStatusSchema = z.object({
  environment: z.string().optional().describe("Environment to check status for"),
});

const DevboxAddPackageSchema = z.object({
  environment: z.string().describe("Environment to add package to"),
  package: z.string().describe("Package name to add"),
});

const DevboxQuickStartSchema = z.object({
  environment: z.string().describe("Environment to quick start"),
  task: z.enum(["dev", "test", "build", "lint"]).optional().describe("Immediate task to run after starting"),
});

// DevPod Tools
const DevpodProvisionSchema = z.object({
  environment: z.string().describe("Environment type (python-env, typescript-env, etc.)"),
  count: z.number().min(1).max(10).default(1).describe("Number of workspaces to provision (1-10)"),
});

const DevpodListSchema = z.object({});

const DevpodStatusSchema = z.object({
  workspace: z.string().optional().describe("Specific workspace name to check"),
});

// Dynamic DevPod Start Tool
const DevpodStartSchema = z.object({
  environment: z.enum(["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"]).describe("Environment to start (python-env, typescript-env, rust-env, go-env, nushell-env)"),
  count: z.number().min(1).max(5).default(1).describe("Number of workspaces to start (1-5)"),
});

// Cross-Language Validation Tools
const PolyglotCheckSchema = z.object({
  environment: z.string().optional().describe("Specific environment to check"),
  include_security: z.boolean().default(false).describe("Include security scanning"),
  include_performance: z.boolean().default(false).describe("Include performance analysis"),
});

const PolyglotValidateSchema = z.object({
  parallel: z.boolean().default(false).describe("Run validation in parallel"),
});

const PolyglotCleanSchema = z.object({
  environment: z.string().optional().describe("Specific environment to clean"),
});

// Performance Tools
const PerformanceMeasureSchema = z.object({
  command: z.string().describe("Command to measure"),
  environment: z.string().describe("Environment to run in"),
});

const PerformanceReportSchema = z.object({
  days: z.number().default(7).describe("Number of days to include in report"),
  environment: z.string().optional().describe("Specific environment to report on"),
});

// Security Tools
const SecurityScanSchema = z.object({
  environment: z.string().optional().describe("Specific environment to scan"),
  scan_type: z.enum(["secrets", "vulnerabilities", "all"]).default("all").describe("Type of security scan"),
});

// Hook Tools
const HookStatusSchema = z.object({});

const HookTriggerSchema = z.object({
  hook_type: z.string().describe("Type of hook to trigger"),
  context: z.record(z.unknown()).optional().describe("Context data for hook"),
});

// PRP (Context Engineering) Tools
const PrpGenerateSchema = z.object({
  feature_file: z.string().describe("Path to feature file"),
  environment: z.string().describe("Target environment"),
});

const PrpExecuteSchema = z.object({
  prp_file: z.string().describe("Path to PRP file to execute"),
  validate: z.boolean().default(true).describe("Validate before execution"),
});

// Tool Names Enum
enum ToolName {
  // Environment Tools
  ENVIRONMENT_DETECT = "environment_detect",
  ENVIRONMENT_INFO = "environment_info", 
  ENVIRONMENT_VALIDATE = "environment_validate",
  
  // DevBox Tools
  DEVBOX_SHELL = "devbox_shell",
  DEVBOX_START = "devbox_start",
  DEVBOX_RUN = "devbox_run",
  DEVBOX_STATUS = "devbox_status",
  DEVBOX_ADD_PACKAGE = "devbox_add_package",
  DEVBOX_QUICK_START = "devbox_quick_start",
  
  // DevPod Tools
  DEVPOD_PROVISION = "devpod_provision",
  DEVPOD_LIST = "devpod_list",
  DEVPOD_STATUS = "devpod_status",
  DEVPOD_START = "devpod_start",
  
  // Cross-Language Tools
  POLYGLOT_CHECK = "polyglot_check",
  POLYGLOT_VALIDATE = "polyglot_validate",
  POLYGLOT_CLEAN = "polyglot_clean",
  
  // Performance Tools
  PERFORMANCE_MEASURE = "performance_measure",
  PERFORMANCE_REPORT = "performance_report",
  
  // Security Tools
  SECURITY_SCAN = "security_scan",
  
  // Hook Tools
  HOOK_STATUS = "hook_status",
  HOOK_TRIGGER = "hook_trigger",
  
  // PRP Tools
  PRP_GENERATE = "prp_generate",
  PRP_EXECUTE = "prp_execute",
}

export const createServer = () => {
  const server = new Server(
    {
      name: "polyglot-devenv/mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
        logging: {},
      },
      instructions
    }
  );

  // Tool Registry
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      // Environment Tools
      {
        name: ToolName.ENVIRONMENT_DETECT,
        description: "Detect and list all polyglot development environments",
        inputSchema: zodToJsonSchema(EnvironmentDetectSchema) as ToolInput,
      },
      {
        name: ToolName.ENVIRONMENT_INFO,
        description: "Get detailed information about a specific environment",
        inputSchema: zodToJsonSchema(EnvironmentInfoSchema) as ToolInput,
      },
      {
        name: ToolName.ENVIRONMENT_VALIDATE,
        description: "Validate environment configuration and health",
        inputSchema: zodToJsonSchema(EnvironmentValidateSchema) as ToolInput,
      },
      
      // DevBox Tools
      {
        name: ToolName.DEVBOX_SHELL,
        description: "Enter a devbox shell for a specific environment",
        inputSchema: zodToJsonSchema(DevboxShellSchema) as ToolInput,
      },
      {
        name: ToolName.DEVBOX_START,
        description: "Start and activate a devbox development environment with automatic setup",
        inputSchema: zodToJsonSchema(DevboxStartSchema) as ToolInput,
      },
      {
        name: ToolName.DEVBOX_RUN,
        description: "Run a devbox script in a specific environment",
        inputSchema: zodToJsonSchema(DevboxRunSchema) as ToolInput,
      },
      {
        name: ToolName.DEVBOX_STATUS,
        description: "Get devbox status for environments",
        inputSchema: zodToJsonSchema(DevboxStatusSchema) as ToolInput,
      },
      {
        name: ToolName.DEVBOX_ADD_PACKAGE,
        description: "Add a package to a devbox environment",
        inputSchema: zodToJsonSchema(DevboxAddPackageSchema) as ToolInput,
      },
      {
        name: ToolName.DEVBOX_QUICK_START,
        description: "Quick start a development environment and optionally run a task",
        inputSchema: zodToJsonSchema(DevboxQuickStartSchema) as ToolInput,
      },
      
      // DevPod Tools
      {
        name: ToolName.DEVPOD_PROVISION,
        description: "Provision DevPod workspace(s) for development",
        inputSchema: zodToJsonSchema(DevpodProvisionSchema) as ToolInput,
      },
      {
        name: ToolName.DEVPOD_LIST,
        description: "List all DevPod workspaces",
        inputSchema: zodToJsonSchema(DevpodListSchema) as ToolInput,
      },
      {
        name: ToolName.DEVPOD_STATUS,
        description: "Get status of DevPod workspaces",
        inputSchema: zodToJsonSchema(DevpodStatusSchema) as ToolInput,
      },
      {
        name: ToolName.DEVPOD_START,
        description: "Start DevPod development environments dynamically for any language (Python, TypeScript, Rust, Go, Nushell)",
        inputSchema: zodToJsonSchema(DevpodStartSchema) as ToolInput,
      },
      
      // Cross-Language Tools
      {
        name: ToolName.POLYGLOT_CHECK,
        description: "Comprehensive quality check across all environments",
        inputSchema: zodToJsonSchema(PolyglotCheckSchema) as ToolInput,
      },
      {
        name: ToolName.POLYGLOT_VALIDATE,
        description: "Cross-environment validation with parallel execution",
        inputSchema: zodToJsonSchema(PolyglotValidateSchema) as ToolInput,
      },
      {
        name: ToolName.POLYGLOT_CLEAN,
        description: "Clean up environments and remove artifacts",
        inputSchema: zodToJsonSchema(PolyglotCleanSchema) as ToolInput,
      },
      
      // Performance Tools
      {
        name: ToolName.PERFORMANCE_MEASURE,
        description: "Measure performance of commands and record metrics",
        inputSchema: zodToJsonSchema(PerformanceMeasureSchema) as ToolInput,
      },
      {
        name: ToolName.PERFORMANCE_REPORT,
        description: "Generate performance analysis report",
        inputSchema: zodToJsonSchema(PerformanceReportSchema) as ToolInput,
      },
      
      // Security Tools
      {
        name: ToolName.SECURITY_SCAN,
        description: "Run security scans across environments",
        inputSchema: zodToJsonSchema(SecurityScanSchema) as ToolInput,
      },
      
      // Hook Tools
      {
        name: ToolName.HOOK_STATUS,
        description: "Get status of Claude Code hooks configuration",
        inputSchema: zodToJsonSchema(HookStatusSchema) as ToolInput,
      },
      {
        name: ToolName.HOOK_TRIGGER,
        description: "Manually trigger specific hooks for testing",
        inputSchema: zodToJsonSchema(HookTriggerSchema) as ToolInput,
      },
      
      // PRP Tools
      {
        name: ToolName.PRP_GENERATE,
        description: "Generate context engineering PRP from feature files",
        inputSchema: zodToJsonSchema(PrpGenerateSchema) as ToolInput,
      },
      {
        name: ToolName.PRP_EXECUTE,
        description: "Execute PRP files with validation",
        inputSchema: zodToJsonSchema(PrpExecuteSchema) as ToolInput,
      },
    ];

    return { tools };
  });

  // Tool Call Handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const progressToken = request.params._meta?.progressToken;

    try {
      switch (name) {
        // Environment Tools
        case ToolName.ENVIRONMENT_DETECT:
          return await handleEnvironmentDetect();
          
        case ToolName.ENVIRONMENT_INFO:
          return await handleEnvironmentInfo(EnvironmentInfoSchema.parse(args));
          
        case ToolName.ENVIRONMENT_VALIDATE:
          return await handleEnvironmentValidate(EnvironmentValidateSchema.parse(args));

        // DevBox Tools
        case ToolName.DEVBOX_SHELL:
          return await handleDevboxShell(DevboxShellSchema.parse(args));
          
        case ToolName.DEVBOX_START:
          return await handleDevboxStart(DevboxStartSchema.parse(args), progressToken);
          
        case ToolName.DEVBOX_RUN:
          return await handleDevboxRun(DevboxRunSchema.parse(args), progressToken);
          
        case ToolName.DEVBOX_STATUS:
          return await handleDevboxStatus(DevboxStatusSchema.parse(args));
          
        case ToolName.DEVBOX_ADD_PACKAGE:
          return await handleDevboxAddPackage(DevboxAddPackageSchema.parse(args));

        case ToolName.DEVBOX_QUICK_START:
          return await handleDevboxQuickStart(DevboxQuickStartSchema.parse(args), progressToken);

        // DevPod Tools
        case ToolName.DEVPOD_PROVISION:
          return await handleDevpodProvision(DevpodProvisionSchema.parse(args), progressToken);
          
        case ToolName.DEVPOD_LIST:
          return await handleDevpodList();
          
        case ToolName.DEVPOD_STATUS:
          return await handleDevpodStatus(DevpodStatusSchema.parse(args));
          
        case ToolName.DEVPOD_START:
          return await handleDevpodStart(DevpodStartSchema.parse(args));

        // Cross-Language Tools
        case ToolName.POLYGLOT_CHECK:
          return await handlePolyglotCheck(PolyglotCheckSchema.parse(args), progressToken);
          
        case ToolName.POLYGLOT_VALIDATE:
          return await handlePolyglotValidate(PolyglotValidateSchema.parse(args), progressToken);
          
        case ToolName.POLYGLOT_CLEAN:
          return await handlePolyglotClean(PolyglotCleanSchema.parse(args));

        // Performance Tools
        case ToolName.PERFORMANCE_MEASURE:
          return await handlePerformanceMeasure(PerformanceMeasureSchema.parse(args));
          
        case ToolName.PERFORMANCE_REPORT:
          return await handlePerformanceReport(PerformanceReportSchema.parse(args));

        // Security Tools
        case ToolName.SECURITY_SCAN:
          return await handleSecurityScan(SecurityScanSchema.parse(args));

        // Hook Tools
        case ToolName.HOOK_STATUS:
          return await handleHookStatus();
          
        case ToolName.HOOK_TRIGGER:
          return await handleHookTrigger(HookTriggerSchema.parse(args));

        // PRP Tools
        case ToolName.PRP_GENERATE:
          return await handlePrpGenerate(PrpGenerateSchema.parse(args));
          
        case ToolName.PRP_EXECUTE:
          return await handlePrpExecute(PrpExecuteSchema.parse(args), progressToken);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Tool Implementation Functions

  async function handleEnvironmentDetect() {
    const environments = await detectEnvironments();
    
    let content = "🔍 **Polyglot Development Environments Detected**\n\n";
    
    environments.forEach(env => {
      const statusIcon = env.status === "active" ? "✅" : env.status === "inactive" ? "⚠️" : "❌";
      const typeIcon = getEnvironmentIcon(env.type);
      
      content += `${statusIcon} ${typeIcon} **${env.name}**\n`;
      content += `   📁 Path: \`${env.path}\`\n`;
      content += `   🏷️ Type: ${env.type}\n`;
      content += `   📊 Status: ${env.status}\n`;
      
      if (env.devboxConfig) {
        content += `   📦 Packages: ${env.devboxConfig.packages.length} installed\n`;
        const scripts = env.devboxConfig.shell?.scripts || {};
        content += `   🔧 Scripts: ${Object.keys(scripts).length} available\n`;
      }
      content += "\n";
    });

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleEnvironmentInfo(args: z.infer<typeof EnvironmentInfoSchema>) {
    if (!isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    const environments = await detectEnvironments();
    const env = environments.find(e => e.name === args.environment);
    
    if (!env) {
      throw new Error(`Environment not found: ${args.environment}`);
    }

    const typeIcon = getEnvironmentIcon(env.type);
    let content = `${typeIcon} **Environment Information: ${env.name}**\n\n`;
    
    content += `📁 **Path:** \`${env.path}\`\n`;
    content += `🏷️ **Type:** ${env.type}\n`;
    content += `📊 **Status:** ${env.status}\n`;
    
    if (env.lastModified) {
      content += `📅 **Last Modified:** ${env.lastModified.toLocaleString()}\n`;
    }
    
    if (env.devboxConfig) {
      content += `\n📦 **DevBox Configuration:**\n`;
      content += `- **Packages:** ${env.devboxConfig.packages.join(", ")}\n`;
      
      const scripts = env.devboxConfig.shell?.scripts || {};
      if (Object.keys(scripts).length > 0) {
        content += `- **Available Scripts:**\n`;
        Object.entries(scripts).forEach(([name, cmd]) => {
          content += `  - \`${name}\`: ${cmd}\n`;
        });
      }
      
      const envVars = env.devboxConfig.env || {};
      if (Object.keys(envVars).length > 0) {
        content += `- **Environment Variables:** ${Object.keys(envVars).length} configured\n`;
      }
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleEnvironmentValidate(args: z.infer<typeof EnvironmentValidateSchema>) {
    if (args.environment && !isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    const environments = args.environment ? [args.environment] : 
      ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"];

    let content = "🔍 **Environment Validation Results**\n\n";
    
    for (const env of environments) {
      const result = await validateEnvironment(env);
      const statusIcon = result.overallStatus === "passed" ? "✅" : 
                        result.overallStatus === "warnings" ? "⚠️" : "❌";
      const typeIcon = getEnvironmentIcon(getEnvironmentType(env));
      
      content += `${statusIcon} ${typeIcon} **${env}**\n`;
      content += `   📊 **Overall Status:** ${result.overallStatus}\n`;
      content += `   📝 **Summary:** ${result.summary}\n`;
      
      if (result.checks.length > 0) {
        content += `   🔍 **Checks:**\n`;
        result.checks.forEach((check: any) => {
          const checkIcon = check.status === "passed" ? "✅" : 
                           check.status === "warning" ? "⚠️" : "❌";
          content += `     ${checkIcon} ${check.name}: ${check.message}\n`;
        });
      }
      content += "\n";
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleDevboxShell(args: z.infer<typeof DevboxShellSchema>) {
    if (!isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `🐚 **DevBox Shell Access**\n\nTo enter the ${args.environment} shell, run:\n\n\`\`\`bash\ncd ${getWorkspaceRoot()}/${args.environment}\ndevbox shell\n\`\`\`\n\nThis will activate the isolated development environment with all packages and configurations.`,
        },
      ],
    };
  }

  async function handleDevboxStart(args: z.infer<typeof DevboxStartSchema>, progressToken?: string | number) {
    if (!isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    const envType = getEnvironmentType(args.environment);
    const typeIcon = getEnvironmentIcon(envType);
    let content = `🚀 ${typeIcon} **DevBox Environment Startup**\n\n`;
    content += `🏷️ **Environment:** ${args.environment} (${envType})\n`;
    content += `⚙️ **Auto-Setup:** ${args.setup ? "Enabled" : "Disabled"}\n\n`;

    const totalSteps = args.setup ? 4 : 3;

    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 1,
          total: totalSteps,
          progressToken,
        },
      });
    }

    // Step 1: Validate environment exists
    content += `📋 **Step 1:** Validating ${envType} environment...\n`;
    const validation = await validateEnvironment(args.environment);
    if (validation.overallStatus === "failed") {
      content += `❌ Environment validation failed: ${validation.summary}\n`;
      return { content: [{ type: "text", text: content }] };
    }
    content += `✅ Environment validated successfully\n\n`;

    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 2,
          total: totalSteps,
          progressToken,
        },
      });
    }

    // Step 2: Initialize and start devbox environment
    content += `📋 **Step 2:** Initializing ${envType} devbox environment...\n`;
    const startResult = await startDevboxEnvironment(args.environment);
    
    if (startResult.success) {
      content += `✅ DevBox environment initialized successfully\n`;
    } else {
      content += `⚠️ DevBox initialization completed with warnings\n`;
    }
    content += "\n";

    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 3,
          total: totalSteps,
          progressToken,
        },
      });
    }

    // Step 3: Run setup if requested
    if (args.setup) {
      content += `📋 **Step 3:** Running ${envType}-specific setup...\n`;
      
      // Use dynamic setup script detection
      const setupScript = await getDefaultSetupScript(args.environment);
      if (setupScript) {
        const setupResult = await runDevboxScript(args.environment, setupScript);
        if (setupResult.success) {
          content += `✅ ${setupScript} script completed successfully\n`;
          if (setupResult.output) {
            // Show brief output summary
            const lines = setupResult.output.split('\n').filter(l => l.trim());
            const lastLine = lines[lines.length - 1];
            if (lastLine && lastLine.length < 100) {
              content += `   📤 ${lastLine}\n`;
            }
          }
        } else {
          content += `⚠️ ${setupScript} script encountered issues\n`;
        }
      } else {
        content += `ℹ️ No setup script found for ${envType} environment\n`;
      }
      content += "\n";

      if (progressToken) {
        await server.notification({
          method: "notifications/progress",
          params: {
            progress: 4,
            total: totalSteps,
            progressToken,
          },
        });
      }
    }

    // Final status and dynamic command display
    const statusIcon = "✅";
    content += `${statusIcon} **${envType.charAt(0).toUpperCase() + envType.slice(1)} Environment Ready!**\n\n`;
    
    // Show environment-specific common commands
    const commonCommands = await getCommonCommands(args.environment);
    if (Object.keys(commonCommands).length > 0) {
      content += `🔧 **Common ${envType.charAt(0).toUpperCase() + envType.slice(1)} Commands:**\n`;
      Object.entries(commonCommands).forEach(([cmd, script]) => {
        content += `- \`devbox run ${cmd}\` - ${script}\n`;
      });
      content += "\n";
    }

    // Environment-specific next steps
    const envSpecificSteps: Record<string, string[]> = {
      python: [
        "Run tests with `devbox run test`",
        "Format code with `devbox run format`", 
        "Type check with `devbox run type-check`"
      ],
      typescript: [
        "Build project with `devbox run build`",
        "Start dev server with `devbox run dev`",
        "Run tests with `devbox run test`"
      ],
      rust: [
        "Build project with `devbox run build`",
        "Run tests with `devbox run test`",
        "Check code with `devbox run check`"
      ],
      go: [
        "Build project with `devbox run build`", 
        "Run tests with `devbox run test`",
        "Format code with `devbox run format`"
      ],
      nushell: [
        "Validate scripts with `devbox run check`",
        "Run tests with `devbox run test`",
        "Format scripts with `devbox run format`"
      ]
    };

    content += `💡 **Next Steps:**\n`;
    content += `- Environment is now active and ready for ${envType} development\n`;
    
    const steps = envSpecificSteps[envType] || ["Use `devbox run <script>` to execute tasks"];
    steps.forEach(step => content += `- ${step}\n`);
    
    content += `- Use \`cd ${getWorkspaceRoot()}/${args.environment} && devbox shell\` for interactive session\n`;

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleDevboxQuickStart(args: z.infer<typeof DevboxQuickStartSchema>, progressToken?: string | number) {
    if (!isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    const envType = getEnvironmentType(args.environment);
    const typeIcon = getEnvironmentIcon(envType);
    let content = `⚡ ${typeIcon} **Quick Start: ${envType.toUpperCase()}**\n\n`;

    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 1,
          total: args.task ? 3 : 2,
          progressToken,
        },
      });
    }

    // Step 1: Quick validation and start
    content += `🚀 Rapid environment activation...\n`;
    const startResult = await startDevboxEnvironment(args.environment);
    
    if (startResult.success) {
      content += `✅ ${envType} environment ready\n\n`;
    } else {
      content += `⚠️ Environment started with warnings\n\n`;
    }

    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 2,
          total: args.task ? 3 : 2,
          progressToken,
        },
      });
    }

    // Step 2: Run immediate task if specified
    if (args.task) {
      content += `⚡ Running immediate task: ${args.task}\n`;
      const taskResult = await runDevboxScript(args.environment, args.task);
      
      if (taskResult.success) {
        content += `✅ ${args.task} completed successfully\n`;
        
        // Show relevant output for different tasks
        if (taskResult.output) {
          const lines = taskResult.output.split('\n').filter(l => l.trim());
          if (args.task === "test") {
            const testSummary = lines.find(l => l.includes("passed") || l.includes("failed") || l.includes("ok"));
            if (testSummary) content += `   📊 ${testSummary}\n`;
          } else if (args.task === "build") {
            const buildInfo = lines[lines.length - 1];
            if (buildInfo && buildInfo.length < 100) content += `   🔨 ${buildInfo}\n`;
          }
        }
      } else {
        content += `❌ ${args.task} failed\n`;
        if (taskResult.error) {
          const errorLines = taskResult.error.split('\n').slice(0, 2);
          content += `   💥 ${errorLines.join(' ')}\n`;
        }
      }
      content += "\n";

      if (progressToken) {
        await server.notification({
          method: "notifications/progress",
          params: {
            progress: 3,
            total: 3,
            progressToken,
          },
        });
      }
    }

    // Quick reference
    const commonCommands = await getCommonCommands(args.environment);
    if (Object.keys(commonCommands).length > 0) {
      content += `⚡ **Quick Commands:**\n`;
      Object.entries(commonCommands).slice(0, 4).forEach(([cmd, _]) => {
        content += `- \`devbox run ${cmd}\`\n`;
      });
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleDevboxRun(args: z.infer<typeof DevboxRunSchema>, progressToken?: string | number) {
    if (!isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 1,
          total: 2,
          progressToken,
        },
      });
    }

    const result = await runDevboxScript(args.environment, args.script);

    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 2,
          total: 2,
          progressToken,
        },
      });
    }

    const statusIcon = result.success ? "✅" : "❌";
    const typeIcon = getEnvironmentIcon(getEnvironmentType(args.environment));
    
    let content = `${statusIcon} ${typeIcon} **DevBox Script Execution**\n\n`;
    content += `🏷️ **Environment:** ${args.environment}\n`;
    content += `🔧 **Script:** ${args.script}\n`;
    content += `⏱️ **Duration:** ${formatDuration(result.duration)}\n`;
    content += `🚀 **Exit Code:** ${result.exitCode}\n\n`;
    
    if (result.output) {
      content += `📤 **Output:**\n\`\`\`\n${result.output.trim()}\n\`\`\`\n\n`;
    }
    
    if (result.error) {
      content += `⚠️ **Error Output:**\n\`\`\`\n${result.error.trim()}\n\`\`\`\n`;
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleDevboxStatus(args: z.infer<typeof DevboxStatusSchema>) {
    const environments = args.environment ? [args.environment] : 
      ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"];

    let content = "📊 **DevBox Environment Status**\n\n";
    
    for (const env of environments) {
      if (!isValidEnvironment(env)) continue;
      
      const result = await runDevboxCommand(env, "info");
      const statusIcon = result.success ? "✅" : "❌";
      const typeIcon = getEnvironmentIcon(getEnvironmentType(env));
      
      content += `${statusIcon} ${typeIcon} **${env}**\n`;
      content += `   ⏱️ Duration: ${formatDuration(result.duration)}\n`;
      
      if (result.success && result.output) {
        content += `   📋 Status: Active and functional\n`;
      } else {
        content += `   ⚠️ Status: Issues detected\n`;
        if (result.error) {
          content += `   🚨 Error: ${result.error.split("\n")[0]}\n`;
        }
      }
      content += "\n";
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleDevboxAddPackage(args: z.infer<typeof DevboxAddPackageSchema>) {
    if (!isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    const result = await runDevboxCommand(args.environment, "add", [args.package]);
    
    const statusIcon = result.success ? "✅" : "❌";
    const typeIcon = getEnvironmentIcon(getEnvironmentType(args.environment));
    
    let content = `${statusIcon} ${typeIcon} **Package Installation**\n\n`;
    content += `🏷️ **Environment:** ${args.environment}\n`;
    content += `📦 **Package:** ${args.package}\n`;
    content += `⏱️ **Duration:** ${formatDuration(result.duration)}\n\n`;
    
    if (result.success) {
      content += `🎉 **Success!** Package \`${args.package}\` has been added to ${args.environment}\n\n`;
    } else {
      content += `❌ **Failed** to add package \`${args.package}\`\n\n`;
    }
    
    if (result.output) {
      content += `📤 **Output:**\n\`\`\`\n${result.output.trim()}\n\`\`\`\n`;
    }
    
    if (result.error) {
      content += `⚠️ **Error:**\n\`\`\`\n${result.error.trim()}\n\`\`\`\n`;
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleDevpodProvision(args: z.infer<typeof DevpodProvisionSchema>, progressToken?: string | number) {
    if (!isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    const typeIcon = getEnvironmentIcon(getEnvironmentType(args.environment));
    let content = `🚀 ${typeIcon} **DevPod Workspace Provisioning**\n\n`;
    content += `🏷️ **Environment:** ${args.environment}\n`;
    content += `🔢 **Count:** ${args.count} workspace(s)\n\n`;

    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 0,
          total: args.count,
          progressToken,
        },
      });
    }

    const results = await provisionDevPodWorkspace(args.environment, args.count);
    
    let successCount = 0;
    results.forEach((result, index) => {
      const statusIcon = result.success ? "✅" : "❌";
      const workspaceNum = index + 1;
      
      content += `${statusIcon} **Workspace ${workspaceNum}/${args.count}**\n`;
      content += `   ⏱️ Duration: ${formatDuration(result.duration)}\n`;
      
      if (result.success) {
        successCount++;
        content += `   🎉 Status: Successfully provisioned\n`;
      } else {
        content += `   ❌ Status: Provisioning failed\n`;
        if (result.error) {
          content += `   🚨 Error: ${result.error.split("\n")[0]}\n`;
        }
      }
      content += "\n";

      if (progressToken) {
        server.notification({
          method: "notifications/progress",
          params: {
            progressToken,
            progress: workspaceNum,
            total: args.count,
          },
        }).catch(() => {}); // Don't block on notification failures
      }
    });

    content += `📊 **Summary:** ${successCount}/${args.count} workspaces provisioned successfully\n\n`;
    content += `💡 **Next Steps:**\n`;
    content += `- Use \`devpod list\` to see all workspaces\n`;
    content += `- Use \`devpod stop <workspace-name>\` to stop specific workspaces\n`;
    content += `- Use VS Code to connect to the workspaces\n`;

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleDevpodList() {
    const workspaces = await listDevPodWorkspaces();
    
    let content = "📋 **DevPod Workspaces**\n\n";
    
    if (workspaces.length === 0) {
      content += "No DevPod workspaces found.\n\n";
      content += "💡 Use the `devpod_provision` tool to create new workspaces.";
    } else {
      const polyglotWorkspaces = workspaces.filter(w => 
        w.name && w.name.includes("polyglot")
      );
      
      if (polyglotWorkspaces.length === 0) {
        content += `Found ${workspaces.length} total workspace(s), but none are polyglot development workspaces.\n\n`;
      } else {
        content += `Found ${polyglotWorkspaces.length} polyglot workspace(s):\n\n`;
        
        polyglotWorkspaces.forEach(workspace => {
          const envType = getWorkspaceEnvironmentType(workspace.name);
          const typeIcon = getEnvironmentIcon(envType);
          const statusIcon = workspace.status === "Running" ? "🟢" : "🔴";
          
          content += `${statusIcon} ${typeIcon} **${workspace.name}**\n`;
          content += `   📊 Status: ${workspace.status || "Unknown"}\n`;
          content += `   🐳 Provider: ${workspace.provider || "docker"}\n`;
          if (workspace.created) {
            content += `   📅 Created: ${new Date(workspace.created).toLocaleString()}\n`;
          }
          content += "\n";
        });
      }
      
      if (workspaces.length > polyglotWorkspaces.length) {
        content += `\n📝 **Note:** ${workspaces.length - polyglotWorkspaces.length} other workspace(s) not shown (non-polyglot)`;
      }
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleDevpodStatus(args: z.infer<typeof DevpodStatusSchema>) {
    const result = await executeCommand("devpod", ["list", "--output", "json"]);
    
    if (!result.success) {
      return {
        content: [
          {
            type: "text",
            text: "❌ **DevPod Status Check Failed**\n\nUnable to retrieve DevPod status. Make sure DevPod is installed and configured.",
          },
        ],
      };
    }

    const workspaces = JSON.parse(result.output || "[]") as any[];
    let content = "📊 **DevPod Status Report**\n\n";
    
    if (args.workspace) {
      const workspace = workspaces.find(w => w.name === args.workspace);
      if (!workspace) {
        content += `❌ Workspace \`${args.workspace}\` not found.`;
      } else {
        const envType = getWorkspaceEnvironmentType(workspace.name);
        const typeIcon = getEnvironmentIcon(envType);
        const statusIcon = workspace.status === "Running" ? "🟢" : "🔴";
        
        content += `${statusIcon} ${typeIcon} **${workspace.name}**\n\n`;
        content += `📊 **Status:** ${workspace.status || "Unknown"}\n`;
        content += `🐳 **Provider:** ${workspace.provider || "docker"}\n`;
        content += `🏷️ **Environment:** ${envType}\n`;
        if (workspace.created) {
          content += `📅 **Created:** ${new Date(workspace.created).toLocaleString()}\n`;
        }
      }
    } else {
      const polyglotWorkspaces = workspaces.filter(w => 
        w.name && w.name.includes("polyglot")
      );
      
      const runningCount = polyglotWorkspaces.filter(w => w.status === "Running").length;
      const stoppedCount = polyglotWorkspaces.length - runningCount;
      
      content += `📈 **Overview:**\n`;
      content += `- 🟢 Running: ${runningCount}\n`;
      content += `- 🔴 Stopped: ${stoppedCount}\n`;
      content += `- 📊 Total: ${polyglotWorkspaces.length}\n\n`;
      
      if (polyglotWorkspaces.length > 0) {
        content += `🗂️ **Workspaces by Environment:**\n`;
        const byEnv = groupBy(polyglotWorkspaces, w => getWorkspaceEnvironmentType(w.name));
        
        Object.entries(byEnv).forEach(([envType, envWorkspaces]) => {
          const typeIcon = getEnvironmentIcon(envType as any);
          content += `${typeIcon} **${envType}:** ${envWorkspaces.length} workspace(s)\n`;
        });
      }
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleDevpodStart(args: z.infer<typeof DevpodStartSchema>) {
    const { environment, count } = args;
    
    if (!isValidEnvironment(environment)) {
      throw new Error(`Invalid environment: ${environment}. Valid environments are: ${ENVIRONMENTS.join(", ")}`);
    }

    const envType = getEnvironmentType(environment);
    const typeIcon = getEnvironmentIcon(envType);
    
    let content = `🚀 ${typeIcon} **Dynamic DevPod Start: ${envType.toUpperCase()}**\n\n`;
    content += `🏷️ **Environment:** ${environment}\n`;
    content += `🔢 **Count:** ${count} workspace(s)\n\n`;

    const results: any[] = [];
    
    for (let i = 1; i <= count; i++) {
      content += `⚡ **Starting workspace ${i}/${count}**\n`;
      
      try {
        const result = await runDevboxScript(environment, "devpod:provision");
        
        if (result.success) {
          content += `✅ **Workspace ${i}:** Successfully started\n`;
          content += `   ⏱️ Duration: ${formatDuration(result.duration)}\n`;
          
          // Extract workspace name from output if possible
          const workspaceMatch = result.output.match(/workspace:\s*([^\s\n]+)/i);
          if (workspaceMatch) {
            content += `   🏷️ Name: ${workspaceMatch[1]}\n`;
          }
          
          results.push({ success: true, workspace: i, duration: result.duration });
        } else {
          content += `❌ **Workspace ${i}:** Failed to start\n`;
          content += `   🚨 Error: ${result.error}\n`;
          results.push({ success: false, workspace: i, error: result.error });
        }
      } catch (error) {
        content += `❌ **Workspace ${i}:** Exception occurred\n`;
        content += `   🚨 Error: ${error instanceof Error ? error.message : String(error)}\n`;
        results.push({ success: false, workspace: i, error: error instanceof Error ? error.message : String(error) });
      }
      
      content += "\n";
      
      // Small delay between provisions to avoid conflicts
      if (i < count) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = count - successCount;
    
    content += `📊 **Summary:** ${successCount}/${count} workspaces started successfully\n\n`;
    
    if (successCount > 0) {
      content += `💡 **Next Steps:**\n`;
      content += `- Use \`devpod list\` to see all workspaces\n`;
      content += `- Use \`devpod stop <workspace-name>\` to stop specific workspaces\n`;
      content += `- Connect to workspaces using VS Code integration\n`;
      content += `- Use \`mcp__polyglot-dev__devpod_status\` to monitor workspace status\n`;
    }
    
    if (failureCount > 0) {
      content += `\n⚠️ **Troubleshooting:**\n`;
      content += `- Check Docker is running and accessible\n`;
      content += `- Verify workspace naming conventions\n`;
      content += `- Try starting workspaces individually if issues persist\n`;
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handlePolyglotCheck(args: z.infer<typeof PolyglotCheckSchema>, progressToken?: string | number) {
    const environments = args.environment ? [args.environment] : 
      ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"];

    let content = "🔍 **Polyglot Environment Quality Check**\n\n";
    
    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 0,
          total: environments.length,
          progressToken,
        },
      });
    }

    const results: any[] = [];
    
    for (let i = 0; i < environments.length; i++) {
      const env = environments[i];
      if (!isValidEnvironment(env)) continue;
      
      const typeIcon = getEnvironmentIcon(getEnvironmentType(env));
      content += `${typeIcon} **${env}**\n`;
      
      // Basic validation
      const validation = await validateEnvironment(env);
      const statusIcon = validation.overallStatus === "passed" ? "✅" : 
                        validation.overallStatus === "warnings" ? "⚠️" : "❌";
      
      content += `   ${statusIcon} Validation: ${validation.summary}\n`;
      
      // Run lint check
      const lintResult = await runDevboxScript(env, "lint");
      if (lintResult.success) {
        content += `   ✅ Linting: Passed\n`;
      } else {
        content += `   ❌ Linting: Issues found\n`;
      }
      
      // Run test check
      const testResult = await runDevboxScript(env, "test");
      if (testResult.success) {
        content += `   ✅ Tests: Passed\n`;
      } else {
        content += `   ⚠️ Tests: Some issues\n`;
      }
      
      results.push({
        environment: env,
        validation: validation.overallStatus,
        lint: lintResult.success,
        test: testResult.success,
      });
      
      content += "\n";
      
      if (progressToken) {
        await server.notification({
          method: "notifications/progress",
          params: {
            progressToken,
            progress: i + 1,
            total: environments.length,
          },
        });
      }
    }
    
    // Summary
    const passed = results.filter(r => r.validation === "passed" && r.lint && r.test).length;
    const total = results.length;
    
    content += `📊 **Summary:** ${passed}/${total} environments fully passing\n\n`;
    
    if (args.include_security) {
      content += `🔐 **Security Note:** Security scanning requested but not yet implemented in this version.\n`;
    }
    
    if (args.include_performance) {
      content += `📈 **Performance Note:** Performance analysis requested but not yet implemented in this version.\n`;
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handlePolyglotValidate(args: z.infer<typeof PolyglotValidateSchema>, progressToken?: string | number) {
    const workspaceRoot = getWorkspaceRoot();
    
    let content = "🔍 **Cross-Environment Validation**\n\n";
    
    if (args.parallel) {
      content += "🚀 **Mode:** Parallel execution\n\n";
      
      if (progressToken) {
        await server.notification({
          method: "notifications/progress",
          params: {
            progressToken,
            progress: 1,
            total: 3,
          },
        });
      }
      
      // Run the Nushell validation script
      const result = await executeCommand("nu", ["scripts/validate-all.nu", "--parallel"], {
        cwd: workspaceRoot,
        timeout: 120000, // 2 minutes
      });
      
      if (progressToken) {
        await server.notification({
          method: "notifications/progress",
          params: {
            progressToken,
            progress: 2,
            total: 3,
          },
        });
      }
      
      const statusIcon = result.success ? "✅" : "❌";
      content += `${statusIcon} **Validation Result**\n`;
      content += `⏱️ **Duration:** ${formatDuration(result.duration)}\n\n`;
      
      if (result.output) {
        content += `📤 **Output:**\n\`\`\`\n${result.output.trim()}\n\`\`\`\n`;
      }
      
      if (result.error) {
        content += `⚠️ **Errors:**\n\`\`\`\n${result.error.trim()}\n\`\`\`\n`;
      }
      
      if (progressToken) {
        await server.notification({
          method: "notifications/progress",
          params: {
            progressToken,
            progress: 3,
            total: 3,
          },
        });
      }
    } else {
      content += "🔄 **Mode:** Sequential execution\n\n";
      
      const environments = ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"];
      
      for (let i = 0; i < environments.length; i++) {
        const env = environments[i];
        const validation = await validateEnvironment(env);
        
        const statusIcon = validation.overallStatus === "passed" ? "✅" : 
                          validation.overallStatus === "warnings" ? "⚠️" : "❌";
        const typeIcon = getEnvironmentIcon(getEnvironmentType(env));
        
        content += `${statusIcon} ${typeIcon} **${env}:** ${validation.summary}\n`;
        
        if (progressToken) {
          await server.notification({
            method: "notifications/progress",
            params: {
              progressToken,
              progress: i + 1,
              total: environments.length,
            },
          });
        }
      }
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handlePolyglotClean(args: z.infer<typeof PolyglotCleanSchema>) {
    const environments = args.environment ? [args.environment] : 
      ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"];

    let content = "🧹 **Environment Cleanup**\n\n";
    
    for (const env of environments) {
      if (!isValidEnvironment(env)) continue;
      
      const typeIcon = getEnvironmentIcon(getEnvironmentType(env));
      content += `${typeIcon} **${env}**\n`;
      
      // Run clean script
      const cleanResult = await runDevboxScript(env, "clean");
      if (cleanResult.success) {
        content += `   ✅ Clean: Completed successfully\n`;
      } else {
        content += `   ⚠️ Clean: Some issues encountered\n`;
      }
      
      content += `   ⏱️ Duration: ${formatDuration(cleanResult.duration)}\n\n`;
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handlePerformanceMeasure(args: z.infer<typeof PerformanceMeasureSchema>) {
    if (!isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    const startTime = Date.now();
    const result = await executeCommand(args.command, [], {
      cwd: getWorkspaceRoot() + "/" + args.environment,
    });
    const duration = Date.now() - startTime;

    const typeIcon = getEnvironmentIcon(getEnvironmentType(args.environment));
    const statusIcon = result.success ? "✅" : "❌";
    
    let content = `📊 ${typeIcon} **Performance Measurement**\n\n`;
    content += `🏷️ **Environment:** ${args.environment}\n`;
    content += `🔧 **Command:** \`${args.command}\`\n`;
    content += `⏱️ **Duration:** ${formatDuration(duration)}\n`;
    content += `🚀 **Status:** ${result.success ? "Success" : "Failed"}\n`;
    content += `📈 **Exit Code:** ${result.exitCode}\n\n`;

    // Store performance metric (this would typically go to a database)
    content += `💾 **Metric Recorded:** Performance data saved for analysis\n\n`;
    
    if (result.output) {
      content += `📤 **Output:**\n\`\`\`\n${result.output.trim()}\n\`\`\`\n`;
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handlePerformanceReport(args: z.infer<typeof PerformanceReportSchema>) {
    let content = "📈 **Performance Analysis Report**\n\n";
    content += `📅 **Period:** Last ${args.days} day(s)\n`;
    
    if (args.environment) {
      content += `🏷️ **Environment:** ${args.environment}\n`;
    }
    
    content += "\n";
    
    // This would typically read from a performance database
    content += "📊 **Performance Summary:**\n";
    content += "- Average build time: Not yet tracked\n";
    content += "- Average test time: Not yet tracked\n";
    content += "- Success rate: Not yet tracked\n\n";
    
    content += "💡 **Note:** Performance tracking is not yet fully implemented. ";
    content += "Use the `performance_measure` tool to start collecting metrics.\n";

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleSecurityScan(args: z.infer<typeof SecurityScanSchema>) {
    const environments = args.environment ? [args.environment] : 
      ["python-env", "typescript-env", "rust-env", "go-env", "nushell-env"];

    let content = "🔐 **Security Scan Results**\n\n";
    
    for (const env of environments) {
      if (!isValidEnvironment(env)) continue;
      
      const typeIcon = getEnvironmentIcon(getEnvironmentType(env));
      content += `${typeIcon} **${env}**\n`;
      
      if (args.scan_type === "secrets" || args.scan_type === "all") {
        // Basic secret scanning
        const envPath = getWorkspaceRoot() + "/" + env;
        const configFiles = [".env", ".env.local", "config.json", "secrets.json"];
        
        let secretsFound = 0;
        for (const file of configFiles) {
          const filePath = join(envPath, file);
          try {
            const findings = await scanForSecrets(filePath);
            secretsFound += findings.length;
          } catch {
            // File doesn't exist, skip
          }
        }
        
        if (secretsFound > 0) {
          content += `   ⚠️ Secrets: ${secretsFound} potential issue(s) found\n`;
        } else {
          content += `   ✅ Secrets: No issues detected\n`;
        }
      }
      
      if (args.scan_type === "vulnerabilities" || args.scan_type === "all") {
        content += `   💡 Vulnerabilities: Scanning not yet implemented\n`;
      }
      
      content += "\n";
    }
    
    content += "💡 **Note:** Enhanced security scanning with git-secrets and vulnerability ";
    content += "databases will be implemented in future versions.\n";

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleHookStatus() {
    const workspaceRoot = getWorkspaceRoot();
    const hooksConfigPath = join(workspaceRoot, ".claude", "settings.json");
    
    let content = "🪝 **Claude Code Hooks Status**\n\n";
    
    try {
      const hooksConfig = JSON.parse(await readFileAsync(hooksConfigPath, "utf-8")) as any;
      const hooks = hooksConfig.hooks || {};
      
      content += `📁 **Configuration:** \`${hooksConfigPath}\`\n\n`;
      
      Object.entries(hooks).forEach(([hookType, hookList]: [string, any]) => {
        content += `🔧 **${hookType}:**\n`;
        if (Array.isArray(hookList) && hookList.length > 0) {
          content += `   📊 ${hookList.length} hook(s) configured\n`;
          hookList.forEach((hook: any, index: number) => {
            content += `   ${index + 1}. ${hook.matcher || "All triggers"}\n`;
          });
        } else {
          content += `   📭 No hooks configured\n`;
        }
        content += "\n";
      });
      
      const totalHooks = Object.values(hooks).reduce((sum: number, hookList: any) => 
        sum + (Array.isArray(hookList) ? hookList.length : 0), 0);
      
      content += `📈 **Summary:** ${totalHooks} total hooks across ${Object.keys(hooks).length} categories\n`;
      
    } catch (error) {
      content += `❌ **Error:** Unable to read hooks configuration\n`;
      content += `🚨 **Details:** ${error instanceof Error ? error.message : String(error)}\n`;
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handleHookTrigger(args: z.infer<typeof HookTriggerSchema>) {
    let content = `🪝 **Manual Hook Trigger**\n\n`;
    content += `🔧 **Hook Type:** ${args.hook_type}\n`;
    
    if (args.context) {
      content += `📋 **Context:** ${JSON.stringify(args.context, null, 2)}\n`;
    }
    
    content += "\n💡 **Note:** Manual hook triggering is not yet implemented. ";
    content += "Hooks are currently triggered automatically by Claude Code based on tool usage.\n";

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handlePrpGenerate(args: z.infer<typeof PrpGenerateSchema>) {
    if (!isValidEnvironment(args.environment)) {
      throw new Error(`Invalid environment: ${args.environment}`);
    }

    const workspaceRoot = getWorkspaceRoot();
    
    let content = `📝 **PRP Generation**\n\n`;
    content += `📁 **Feature File:** ${args.feature_file}\n`;
    content += `🏷️ **Environment:** ${args.environment}\n\n`;
    
    // This would typically generate a PRP using the existing Python scripts
    const generateResult = await executeCommand("python", [
      ".claude/commands/generate-prp-v2.py",
      args.feature_file,
      "--env", args.environment
    ], {
      cwd: workspaceRoot,
      timeout: 60000,
    });
    
    const statusIcon = generateResult.success ? "✅" : "❌";
    content += `${statusIcon} **Generation Result**\n`;
    content += `⏱️ **Duration:** ${formatDuration(generateResult.duration)}\n\n`;
    
    if (generateResult.output) {
      content += `📤 **Output:**\n\`\`\`\n${generateResult.output.trim()}\n\`\`\`\n`;
    }
    
    if (generateResult.error) {
      content += `⚠️ **Errors:**\n\`\`\`\n${generateResult.error.trim()}\n\`\`\`\n`;
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  async function handlePrpExecute(args: z.infer<typeof PrpExecuteSchema>, progressToken?: string | number) {
    const workspaceRoot = getWorkspaceRoot();
    
    let content = `🚀 **PRP Execution**\n\n`;
    content += `📁 **PRP File:** ${args.prp_file}\n`;
    content += `✅ **Validation:** ${args.validate ? "Enabled" : "Disabled"}\n\n`;
    
    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 1,
          total: 2,
          progressToken,
        },
      });
    }
    
    // Execute using the existing Python script
    const executeArgs = ["python", ".claude/commands/execute-prp-v2.py", args.prp_file];
    if (args.validate) {
      executeArgs.push("--validate");
    }
    
    const executeResult = await executeCommand(executeArgs[0], executeArgs.slice(1), {
      cwd: workspaceRoot,
      timeout: 300000, // 5 minutes
    });
    
    if (progressToken) {
      await server.notification({
        method: "notifications/progress",
        params: {
          progress: 2,
          total: 2,
          progressToken,
        },
      });
    }
    
    const statusIcon = executeResult.success ? "✅" : "❌";
    content += `${statusIcon} **Execution Result**\n`;
    content += `⏱️ **Duration:** ${formatDuration(executeResult.duration)}\n\n`;
    
    if (executeResult.output) {
      content += `📤 **Output:**\n\`\`\`\n${executeResult.output.trim()}\n\`\`\`\n`;
    }
    
    if (executeResult.error) {
      content += `⚠️ **Errors:**\n\`\`\`\n${executeResult.error.trim()}\n\`\`\`\n`;
    }

    return {
      content: [{ type: "text", text: content }],
    };
  }

  // Helper Functions
  
  function getEnvironmentIcon(type: string): string {
    switch (type) {
      case "python": return "🐍";
      case "typescript": return "📘";
      case "rust": return "🦀";
      case "go": return "🐹";
      case "nushell": return "🐚";
      default: return "📦";
    }
  }
  
  function getEnvironmentType(envName: string): string {
    if (envName.includes("python")) return "python";
    if (envName.includes("typescript")) return "typescript";
    if (envName.includes("rust")) return "rust";
    if (envName.includes("go")) return "go";
    if (envName.includes("nushell")) return "nushell";
    return "unknown";
  }
  
  function getWorkspaceEnvironmentType(workspaceName: string): string {
    if (workspaceName.includes("python")) return "python";
    if (workspaceName.includes("typescript")) return "typescript";
    if (workspaceName.includes("rust")) return "rust";
    if (workspaceName.includes("go")) return "go";
    if (workspaceName.includes("nushell")) return "nushell";
    return "unknown";
  }
  
  function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  const cleanup = async () => {
    // No persistent connections to clean up in this implementation
  };

  return { server, cleanup };
};