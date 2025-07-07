# MCP DevBox Start Tool Test

## New Tool Added: `devbox_start`

**Purpose**: Start and activate a devbox development environment with automatic setup

**Schema**:
```typescript
const DevboxStartSchema = z.object({
  environment: z.string().describe("Environment to start and activate"),
  setup: z.boolean().default(true).describe("Run setup/install scripts after starting"),
});
```

**Tool Registration**:
```typescript
{
  name: ToolName.DEVBOX_START,
  description: "Start and activate a devbox development environment with automatic setup",
  inputSchema: zodToJsonSchema(DevboxStartSchema) as ToolInput,
}
```

**Implementation Features**:
1. ✅ Environment validation
2. ✅ Progress tracking with notifications  
3. ✅ Automatic setup/install script execution
4. ✅ Available commands display
5. ✅ Error handling and fallbacks
6. ✅ Next steps guidance

**Usage Example**:
```json
{
  "name": "mcp__polyglot-dev__devbox_start",
  "arguments": {
    "environment": "python-env",
    "setup": true
  }
}
```

This tool will:
- Validate the environment exists and is configured
- Start the devbox environment  
- Run setup/install scripts automatically
- Display available commands and next steps
- Provide progress feedback during the process

The tool enhances the existing MCP server by providing an **actionable** way to start development environments rather than just instructions.