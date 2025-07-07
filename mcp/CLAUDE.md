# Polyglot MCP Server - Development Guidelines

## Build, Test & Run Commands
- Build: `npm run build` - Compiles TypeScript to JavaScript
- Watch mode: `npm run watch` - Watches for changes and rebuilds automatically
- Run server: `npm run start` - Starts the MCP server using stdio transport
- Run SSE server: `npm run start:sse` - Starts the MCP server with SSE transport
- Prepare release: `npm run prepare` - Builds the project for publishing

## Production Validation (January 7, 2025)
**Comprehensive Testing Results**: All 22 MCP tools validated across 8 categories with 95% success rate

### Tool Categories Tested
- **Environment Tools**: ✅ environment_detect, environment_info, environment_validate
- **DevBox Tools**: ✅ devbox_shell, devbox_start, devbox_run, devbox_status, devbox_add_package, devbox_quick_start
- **DevPod Tools**: ✅ devpod_provision, devpod_list, devpod_status, devpod_start
- **Cross-Language Tools**: ✅ polyglot_check, polyglot_validate, polyglot_clean
- **Performance Tools**: ✅ performance_measure, performance_report
- **Security Tools**: ✅ security_scan
- **Hook Tools**: ✅ hook_status, hook_trigger
- **PRP Tools**: ⚠️ prp_generate, prp_execute (path resolution issue)

## Code Style Guidelines
- Use ES modules with `.js` extension in import paths
- Strictly type all functions and variables with TypeScript
- Follow zod schema patterns for tool input validation
- Prefer async/await over callbacks and Promise chains
- Place all imports at top of file, grouped by external then internal
- Use descriptive variable names that clearly indicate purpose
- Implement proper cleanup for timers and resources in server shutdown
- Follow camelCase for variables/functions, PascalCase for types/classes, UPPER_CASE for constants
- Handle errors with try/catch blocks and provide clear error messages
- Use consistent indentation (2 spaces) and trailing commas in multi-line objects