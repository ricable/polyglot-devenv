Directory structure:
└── zxdxjtu-claudecode-rule2hook/
    ├── README.md
    ├── CHANGELOG.md
    ├── CLAUDE.md
    ├── CODE_OF_CONDUCT.md
    ├── CONTRIBUTING.md
    ├── LICENSE
    ├── quick-test.sh
    ├── QUICKSTART.md
    ├── SECURITY.md
    ├── test-cases.md
    ├── test-rules.txt
    ├── validate-hooks.py
    ├── examples/
    │   └── sample_rules.md
    ├── .claude/
    │   └── commands/
    │       └── rule2hook.md
    └── .github/
        ├── ISSUE_TEMPLATE/
        │   ├── bug_report.md
        │   └── feature_request.md
        └── workflows/
            └── test.yml


Files Content:

================================================
FILE: README.md
================================================
# claudecode-rule2hook 🪝

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-blue.svg)](https://docs.anthropic.com/en/docs/claude-code)

Convert natural language project rules into Claude Code hooks automatically! Write rules in plain English, and let Claude transform them into powerful automation hooks.

## ✨ Features

- 🎯 **Natural Language Processing** - Write rules in plain English
- 🔄 **Automatic Hook Generation** - Converts rules to proper hook configurations
- 🧠 **Smart Detection** - Intelligently identifies events, tools, and commands
- 📝 **CLAUDE.md Integration** - Reads from existing project memory files
- 🛡️ **Safe Configuration** - Backs up existing hooks before applying changes
- 🚀 **Zero Dependencies** - Works directly with Claude Code

## 📦 Installation

### Option 1: Project-Specific Installation (Recommended)

To use the rule2hook command in your own project:

```bash
# 1. Clone this repository
git clone https://github.com/zxdxjtu/claudecode-rule2hook.git

# 2. Copy the command to your project
mkdir -p your-project/.claude/commands
cp claudecode-rule2hook/.claude/commands/rule2hook.md your-project/.claude/commands/

# 3. Use in your project
cd your-project
# Now /project:rule2hook is available when using Claude Code in this directory
```

### Option 2: Global Installation

To make the command available in all projects:

```bash
# Clone the repository
git clone https://github.com/zxdxjtu/claudecode-rule2hook.git

# Copy to global Claude commands directory
mkdir -p ~/.claude/commands
cp claudecode-rule2hook/.claude/commands/rule2hook.md ~/.claude/commands/

# Now /rule2hook is available globally (without /project: prefix)
```

### Option 3: Use Directly in This Repository

```bash
# Clone and use directly
git clone https://github.com/zxdxjtu/claudecode-rule2hook.git
cd claudecode-rule2hook

# The /project:rule2hook command is available in this directory only
```

### How it works

Claude Code discovers slash commands by scanning:
1. `~/.claude/commands/` for global commands (accessible as `/commandname`)
2. `.claude/commands/` in the current project for project-specific commands (accessible as `/project:commandname`)

**Important**: You must be in the correct directory when using Claude Code for the commands to be available.

## 🚀 Quick Start

After installation, in Claude Code, type:

```bash
# If using project-specific installation (Option 1)
/project:rule2hook "Format Python files with black after editing"

# If using global installation (Option 2)
/rule2hook "Format Python files with black after editing"

# Convert rules from CLAUDE.md
/project:rule2hook  # or /rule2hook if global

# Convert multiple rules
/project:rule2hook "Run tests after editing, Format code before committing"
```

## 📚 How It Works

1. **Input** - Provide rules as text or let Claude read from CLAUDE.md
2. **Analysis** - Claude analyzes rules to determine:
   - Trigger events (before/after actions)
   - Target tools (Edit, Write, Bash, etc.)
   - Commands to execute
3. **Generation** - Creates proper hook configurations
4. **Application** - Saves hooks to `~/.claude/hooks.json`

## 🎯 Examples

### Example 1: Code Formatting

**Input:**
```
Format Python files with black after editing
```

**Generated Hook:**
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|MultiEdit|Write",
      "hooks": [{
        "type": "command",
        "command": "black ."
      }]
    }]
  }
}
```

### Example 2: Git Workflow

**Input:**
```
Run git status when finishing a task
```

**Generated Hook:**
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "git status"
      }]
    }]
  }
}
```

## 📋 Supported Rule Patterns

- **Formatting**: `"Format [language] files after editing"`
- **Testing**: `"Run tests when modifying test files"`
- **Git**: `"Execute git [command] when [event]"`
- **Validation**: `"Check/Validate [something] before [action]"`
- **Notifications**: `"Alert/Notify when [condition]"`
- **Custom Commands**: Use backticks for specific commands

## 🛠️ Advanced Usage

### Reading from CLAUDE.md

Create a `CLAUDE.md` file with your project rules:

```markdown
# Project Rules

- Format Python files with black after editing
- Run tests before committing
- Check for TODO comments before pushing
```

Then run: `/project:rule2hook`

### Complex Rules

```bash
/project:rule2hook "Run 'npm run lint && npm test' after editing source files"
```

### Validation Rules

```bash
/project:rule2hook "Validate JSON schema before saving .json files"
```

## 🧪 Testing

Use the included test tools:

```bash
# Interactive testing
./quick-test.sh

# Validate generated hooks
python3 validate-hooks.py

# Test specific rules
cat test-rules.txt
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- 📢 Share your rule patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the [Claude Code](https://docs.anthropic.com/en/docs/claude-code) community
- Inspired by the need for simpler automation
- Thanks to all contributors!

## 📚 Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Slash Commands Guide](https://docs.anthropic.com/en/docs/claude-code/slash-commands)
- [Memory Management](https://docs.anthropic.com/en/docs/claude-code/memory)

## 🔗 Links

- **Issues**: [GitHub Issues](https://github.com/zxdxjtu/claudecode-rule2hook/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zxdxjtu/claudecode-rule2hook/discussions)
- **Wiki**: [Project Wiki](https://github.com/zxdxjtu/claudecode-rule2hook/wiki)

---

<p align="center">
  Made with ❤️ by the Claude Code community
</p>

<p align="center">
  <a href="https://github.com/zxdxjtu/claudecode-rule2hook/stargazers">⭐ Star us on GitHub!</a>
</p>


================================================
FILE: CHANGELOG.md
================================================
# Changelog

All notable changes to claudecode-rule2hook will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of claudecode-rule2hook
- Natural language rule parsing
- Support for all Claude Code hook events (PreToolUse, PostToolUse, Stop, Notification)
- CLAUDE.md integration for reading project rules
- Automatic hook configuration generation
- Safe configuration merging with existing hooks
- Comprehensive test suite and validation tools
- Interactive testing script (`quick-test.sh`)
- Hook validation tool (`validate-hooks.py`)
- Example rules and test cases

### Features
- Convert plain English rules to Claude Code hooks
- Support for multiple rule patterns:
  - Code formatting rules
  - Testing and validation rules
  - Git workflow automation
  - Security checks
  - Custom command execution
- Zero dependencies - works directly with Claude Code
- Intelligent event and tool detection
- Command extraction from natural language

## [1.0.0] - TBD

### Added
- First stable release
- Complete documentation
- MIT License
- Contributing guidelines
- Code of Conduct

---

## Release Notes Format

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security vulnerability fixes


================================================
FILE: CLAUDE.md
================================================
# Project Rules

## Code Quality
- Format Python files with `black` after editing .py files
- Run `prettier --write` on JavaScript and TypeScript files after modifications
- Check for console.log statements before committing JavaScript code

## Development Workflow
- Run `git status` when finishing any task
- Execute `npm test` after modifying files in the tests/ directory
- Clear build cache when .env file is modified

## Security
- Scan for hardcoded API keys before saving configuration files
- Validate environment variables before running deployment scripts


================================================
FILE: CODE_OF_CONDUCT.md
================================================
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, religion, or sexual identity
and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming,
diverse, inclusive, and healthy community.

## Our Standards

Examples of behavior that contributes to a positive environment for our
community include:

* Demonstrating empathy and kindness toward other people
* Being respectful of differing opinions, viewpoints, and experiences
* Giving and gracefully accepting constructive feedback
* Accepting responsibility and apologizing to those affected by our mistakes,
  and learning from the experience
* Focusing on what is best not just for us as individuals, but for the
  overall community

Examples of unacceptable behavior include:

* The use of sexualized language or imagery, and sexual attention or
  advances of any kind
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or email
  address, without their explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

Community leaders have the right and responsibility to remove, edit, or reject
comments, commits, code, wiki edits, issues, and other contributions that are
not aligned to this Code of Conduct, and will communicate reasons for moderation
decisions when appropriate.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the community in public spaces.
Examples of representing our community include using an official e-mail address,
posting via an official social media account, or acting as an appointed
representative at an online or offline event.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
[INSERT CONTACT EMAIL].
All complaints will be reviewed and investigated promptly and fairly.

All community leaders are obligated to respect the privacy and security of the
reporter of any incident.

## Enforcement Guidelines

Community leaders will follow these Community Impact Guidelines in determining
the consequences for any action they deem in violation of this Code of Conduct:

### 1. Correction

**Community Impact**: Use of inappropriate language or other behavior deemed
unprofessional or unwelcome in the community.

**Consequence**: A private, written warning from community leaders, providing
clarity around the nature of the violation and an explanation of why the
behavior was inappropriate. A public apology may be requested.

### 2. Warning

**Community Impact**: A violation through a single incident or series
of actions.

**Consequence**: A warning with consequences for continued behavior. No
interaction with the people involved, including unsolicited interaction with
those enforcing the Code of Conduct, for a specified period of time. This
includes avoiding interactions in community spaces as well as external channels
like social media. Violating these terms may lead to a temporary or
permanent ban.

### 3. Temporary Ban

**Community Impact**: A serious violation of community standards, including
sustained inappropriate behavior.

**Consequence**: A temporary ban from any sort of interaction or public
communication with the community for a specified period of time. No public or
private interaction with the people involved, including unsolicited interaction
with those enforcing the Code of Conduct, is allowed during this period.
Violating these terms may lead to a permanent ban.

### 4. Permanent Ban

**Community Impact**: Demonstrating a pattern of violation of community
standards, including sustained inappropriate behavior,  harassment of an
individual, or aggression toward or disparagement of classes of individuals.

**Consequence**: A permanent ban from any sort of public interaction within
the community.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.0, available at
https://www.contributor-covenant.org/version/2/0/code_of_conduct.html.

Community Impact Guidelines were inspired by [Mozilla's code of conduct
enforcement ladder](https://github.com/mozilla/diversity).

[homepage]: https://www.contributor-covenant.org

For answers to common questions about this code of conduct, see the FAQ at
https://www.contributor-covenant.org/faq. Translations are available at
https://www.contributor-covenant.org/translations.


================================================
FILE: CONTRIBUTING.md
================================================
# Contributing to claudecode-rule2hook

First off, thank you for considering contributing to claudecode-rule2hook! 🎉

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🎯 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include your Claude Code version**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples of how it would work**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin? You can start by looking through these issues:

- Issues labeled `good first issue`
- Issues labeled `help wanted`

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Ensure your code follows the existing style
4. Update documentation as needed
5. Issue that pull request!

## 📝 Contribution Guidelines

### Improving the Slash Command

The core of claudecode-rule2hook is the prompt in `.claude/commands/rule2hook.md`. When improving it:

1. **Test thoroughly** - Ensure your changes work with various rule patterns
2. **Maintain clarity** - The prompt should be clear and unambiguous
3. **Add examples** - If adding new functionality, include examples
4. **Document changes** - Update README.md if behavior changes

### Adding Test Cases

New test cases are always welcome! Add them to:

- `test-cases.md` - For detailed test scenarios
- `test-rules.txt` - For quick test rules
- `examples/sample_rules.md` - For user-facing examples

### Improving Documentation

- Keep language clear and concise
- Add examples where helpful
- Ensure code blocks are properly formatted
- Update table of contents if adding sections

## 🔧 Development Process

1. **Create an issue** - Discuss your idea first
2. **Fork & branch** - Create a feature branch
3. **Make changes** - Follow the guidelines above
4. **Test** - Ensure everything works as expected
5. **Document** - Update relevant documentation
6. **Pull request** - Submit your PR with a clear description

### Branch Naming

- `feature/` - For new features
- `fix/` - For bug fixes
- `docs/` - For documentation updates
- `test/` - For test additions

Example: `feature/support-yaml-config`

## 📋 Checklist

Before submitting your PR, ensure:

- [ ] The slash command works correctly
- [ ] Documentation is updated if needed
- [ ] Test cases are added for new functionality
- [ ] Examples are provided for new features
- [ ] The PR description clearly describes changes

## 💡 Tips for Contributors

### Understanding the Architecture

claudecode-rule2hook is intentionally simple:

1. User invokes `/project:rule2hook`
2. Claude receives the prompt from `rule2hook.md`
3. Claude analyzes rules and generates hooks
4. Claude saves configuration to `~/.claude/hooks.json`

No external dependencies or complex logic needed!

### Testing Your Changes

1. Clone your fork locally
2. Make changes to `.claude/commands/rule2hook.md`
3. Test with various rule inputs
4. Verify generated hooks work correctly

### Common Patterns

When adding support for new rule patterns:

1. Add detection logic to the prompt
2. Include examples in the prompt
3. Add test cases
4. Update documentation

## 🙏 Recognition

Contributors will be recognized in:

- The project README
- Release notes
- Special thanks section

## 💬 Questions?

Feel free to:

- Open an issue for discussion
- Start a GitHub Discussion
- Reach out to maintainers

Thank you for helping make claudecode-rule2hook better! 🚀


================================================
FILE: LICENSE
================================================
MIT License

Copyright (c) 2024 rule2hook contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


================================================
FILE: quick-test.sh
================================================
#!/bin/bash

echo "🧪 claudecode-rule2hook Quick Test Script"
echo "=========================="
echo ""
echo "This script will help you test the rule2hook command"
echo ""

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_rule() {
    local rule="$1"
    local test_name="$2"
    
    echo -e "${YELLOW}Test:${NC} $test_name"
    echo -e "${YELLOW}Rule:${NC} $rule"
    echo ""
    echo "Please execute in Claude Code:"
    echo -e "${GREEN}/project:rule2hook \"$rule\"${NC}"
    echo ""
    echo "Press Enter to continue to next test..."
    read
    echo "---"
    echo ""
}

# Start testing
echo "Preparation:"
echo "1. Ensure you are in Claude Code"
echo "2. Ensure current directory is project directory"
echo "3. Be ready to copy and paste commands"
echo ""
echo "Press Enter to start testing..."
read

# Backup existing hooks
if [ -f ~/.claude/hooks.json ]; then
    cp ~/.claude/hooks.json ~/.claude/hooks.json.test_backup
    echo -e "${GREEN}✓${NC} Backed up existing hooks to ~/.claude/hooks.json.test_backup"
fi

# Test 1
test_rule "Format Python files with black after editing" "Python Formatting Rule"

# Check results
echo "Check generated hooks:"
echo -e "${GREEN}cat ~/.claude/hooks.json${NC}"
echo ""
echo "Press Enter to continue..."
read

# Test 2
test_rule "Run git status when finishing a task" "Git Workflow Rule"

# Test 3
test_rule "Check for TODO comments before committing" "Code Check Rule"

# Test 4 - Read from CLAUDE.md
echo -e "${YELLOW}Test:${NC} Read rules from CLAUDE.md"
echo "Please execute in Claude Code:"
echo -e "${GREEN}/project:rule2hook${NC}"
echo ""
echo "Press Enter to continue..."
read

# Test 5 - Complex command
test_rule "Run 'npm run lint && npm run test' after editing source files" "Complex Command Rule"

# Show final results
echo "📊 Testing complete!"
echo ""
echo "View final hooks configuration:"
echo -e "${GREEN}cat ~/.claude/hooks.json | python -m json.tool${NC}"
echo ""

# Ask if restore
echo "Restore original hooks? (y/n)"
read restore
if [ "$restore" = "y" ]; then
    if [ -f ~/.claude/hooks.json.test_backup ]; then
        cp ~/.claude/hooks.json.test_backup ~/.claude/hooks.json
        echo -e "${GREEN}✓${NC} Restored original hooks"
    fi
fi

echo ""
echo "✨ Test script completed!"


================================================
FILE: QUICKSTART.md
================================================
# Quick Start 🚀

## 1. Install the Command

Choose your installation method:

```bash
# Project-specific (recommended)
mkdir -p .claude/commands
cp path/to/claudecode-rule2hook/.claude/commands/rule2hook.md .claude/commands/

# OR Global installation
mkdir -p ~/.claude/commands  
cp path/to/claudecode-rule2hook/.claude/commands/rule2hook.md ~/.claude/commands/
```

## 2. Try It Now!

In Claude Code, type:

```
# Project-specific command
/project:rule2hook "Format Python files after editing"

# OR if globally installed
/rule2hook "Format Python files after editing"
```

Claude will:
1. Analyze your rule
2. Generate a hook configuration
3. Save it to `~/.claude/hooks.json`
4. Show you what was configured

## 3. Use Your CLAUDE.md

If you have rules in CLAUDE.md, just type:

```
/project:rule2hook  # or /rule2hook if global
```

## 4. Common Rules

```
# Use the appropriate command format based on your installation
/project:rule2hook "Run black on Python files after editing"
/project:rule2hook "Execute git status when finishing tasks"
/project:rule2hook "Run tests after modifying test files"
/project:rule2hook "Check for TODO comments before committing"

# OR if globally installed
/rule2hook "Run black on Python files after editing"
# etc.
```

## 5. Check Results

See your configured hooks:
```
cat ~/.claude/hooks.json
```

That's it! Your rules are now active hooks in Claude Code. 🎉


================================================
FILE: SECURITY.md
================================================
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of claudecode-rule2hook seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:
- Create a public GitHub issue for security vulnerabilities
- Post about it publicly before it's fixed

### Please DO:
- Email us at [INSERT SECURITY EMAIL]
- Include the word "SECURITY" in the subject line
- Provide detailed steps to reproduce the issue
- Allow us reasonable time to fix the issue before disclosure

### What to expect:
- Acknowledgment of your report within 48 hours
- Regular updates on our progress
- Credit in the fix announcement (if desired)

## Security Considerations

### Hook Execution
- Hooks run with full user permissions
- Always review generated hooks before applying
- Be cautious with rules that execute shell commands

### Best Practices
1. **Review Generated Hooks**: Always inspect the generated `hooks.json` before using
2. **Backup Configuration**: The tool automatically backs up existing hooks
3. **Test First**: Use the validation tools to verify hook configurations
4. **Limit Scope**: Be specific in your rules to avoid unintended matches

### Safe Usage Tips
- Don't blindly trust rules from untrusted sources
- Regularly review your active hooks
- Use specific tool matchers to limit hook scope
- Test hooks in a safe environment first

## Hook Security Guidelines

When writing rules that will become hooks:

1. **Avoid Sensitive Data**: Don't include passwords, tokens, or keys in rules
2. **Use Absolute Paths**: Be explicit about file locations
3. **Validate Input**: For complex commands, add validation
4. **Limit Permissions**: Run commands with minimal required permissions

## Audit Trail

claudecode-rule2hook maintains backups of previous configurations in:
```
~/.claude/hook-backups/
```

This allows you to:
- Review changes over time
- Restore previous configurations
- Audit hook modifications

Thank you for helping keep claudecode-rule2hook secure!


================================================
FILE: test-cases.md
================================================
# claudecode-rule2hook Test Cases

## Test Preparation

```bash
# 1. Ensure current directory is project directory
pwd  # Should display /Users/jessica/Desktop/repo/claude-hook-demo

# 2. Check if Slash Command is ready
ls -la .claude/commands/rule2hook.md

# 3. Backup existing hooks (if any)
cp ~/.claude/hooks.json ~/.claude/hooks.json.backup 2>/dev/null || echo "No existing hooks"
```

## Test Case 1: Single Formatting Rule

**Input Command:**
```
/project:rule2hook "Format Python files with black after editing"
```

**Expected Result:**
- Claude should generate configuration with PostToolUse hook
- Matcher should include "Edit|MultiEdit|Write"
- Command should be "black ."

## Test Case 2: Git Workflow Rule

**Input Command:**
```
/project:rule2hook "Run git status when finishing a task"
```

**Expected Result:**
- Should generate Stop event hook
- No matcher needed (applies to all tools)
- Command should be "git status"

## Test Case 3: Multiple Rules

**Input Command:**
```
/project:rule2hook "Run prettier on JavaScript files after saving, Check for console.log before committing"
```

**Expected Result:**
- Should generate two hooks
- First: PostToolUse + prettier
- Second: PreToolUse + check console.log

## Test Case 4: Read from CLAUDE.md

**Preparation:**
```bash
# Ensure CLAUDE.md exists and contains rules
cat CLAUDE.md
```

**Input Command:**
```
/project:rule2hook
```

**Expected Result:**
- Claude should read and analyze all rules in CLAUDE.md
- Generate corresponding hook for each rule

## Test Case 5: Validation Rule

**Input Command:**
```
/project:rule2hook "Validate JSON files before saving them"
```

**Expected Result:**
- Should generate PreToolUse hook
- Matcher should target Write or Edit
- Command might include JSON validation logic

## Test Case 6: Test Hook

**Input Command:**
```
/project:rule2hook "Run npm test after modifying files in tests directory"
```

**Expected Result:**
- PostToolUse hook
- Might include path checking logic
- Command: "npm test"

## Verification Steps

### 1. Check Generated Configuration

```bash
# View generated hooks
cat ~/.claude/hooks.json | jq .

# If jq is not available, use:
cat ~/.claude/hooks.json
```

### 2. Test if Hook is Working

```bash
# Create a test file to trigger hook
echo "# Test file" > test.py

# Edit file (should trigger formatting hook)
echo "def test(): pass" >> test.py

# Complete task (should trigger git status)
# In Claude Code say "I'm done with the task"
```

### 3. Verify Merge Functionality

```bash
# Run another rule, check if merging works correctly
/project:rule2hook "Send notification when deploying"

# Verify original hooks are preserved
cat ~/.claude/hooks.json
```

## Edge Case Testing

### Test Case 7: Ambiguous Rule

**Input Command:**
```
/project:rule2hook "Make sure code is clean"
```

**Expected:** Claude should attempt to interpret and generate reasonable hook

### Test Case 8: Complex Command

**Input Command:**
```
/project:rule2hook "Run 'npm run build && npm test' after changing source files"
```

**Expected:** Correctly handle complex command with &&

### Test Case 9: Special Characters

**Input Command:**
```
/project:rule2hook "Check for patterns like TODO: or FIXME: before committing"
```

**Expected:** Correctly handle special characters and regex patterns

## Cleanup

```bash
# Restore original hooks (if needed)
cp ~/.claude/hooks.json.backup ~/.claude/hooks.json 2>/dev/null || echo "No backup to restore"

# Or clear hooks
echo '{"hooks": {}}' > ~/.claude/hooks.json
```

## Test Record Template

```markdown
### Test Case X: [Name]
- **Execution Time**: 2024-XX-XX
- **Input**: `/project:rule2hook "..."`
- **Actual Output**:
  ```json
  [Paste generated configuration]
  ```
- **Result**: ✅ Pass / ❌ Fail
- **Notes**: [Any observed issues or highlights]
```


================================================
FILE: test-rules.txt
================================================
# Test Rule Collection - For Quick Testing

## Basic Rules
Format Python files with black after editing
Run git status when finishing a task
Check for TODO comments before committing

## File Type Specific Rules
Format JavaScript files with prettier after saving .js files
Run eslint --fix on TypeScript files before saving
Validate JSON schema when editing .json files

## Testing Related Rules
Run pytest when modifying test_*.py files
Execute npm test after changing files in __tests__ directory
Run unit tests before pushing to remote

## Security Rules
Scan for API keys before saving configuration files
Check for hardcoded passwords in code before committing
Validate environment variables before running deployment scripts

## Notification Rules
Send Slack notification when pushing to main branch
Alert team when modifying database migrations
Log all changes to critical system files

## Complex Command Rules
Run "npm run lint && npm run test" after editing source files
Execute "black . && flake8 && pytest" before committing Python code
Check file size and run "prettier --write" if less than 1000 lines

## Conditional Rules
Format only if file extension is .py or .js
Run tests only if changes affect src/ directory
Deploy only after all tests pass

## Workflow Rules
Create backup before overwriting important files
Clear cache after modifying configuration
Restart server when .env file changes


================================================
FILE: validate-hooks.py
================================================
#!/usr/bin/env python3
"""
Validate the generated hooks.json file
"""

import json
import sys
from pathlib import Path


def validate_hooks_file(file_path):
    """Validate hooks.json file"""
    print(f"🔍 Validating file: {file_path}")
    print("-" * 50)
    
    # Check if file exists
    if not file_path.exists():
        print("❌ File does not exist")
        return False
    
    # Read and parse JSON
    try:
        with open(file_path, 'r') as f:
            config = json.load(f)
        print("✅ JSON format is valid")
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        return False
    
    # Validate structure
    if not isinstance(config, dict):
        print("❌ Root element must be an object")
        return False
    
    if "hooks" not in config:
        print("❌ Missing 'hooks' key")
        return False
    
    hooks = config["hooks"]
    if not isinstance(hooks, dict):
        print("❌ 'hooks' must be an object")
        return False
    
    # Validate each event type
    valid_events = {"PreToolUse", "PostToolUse", "Stop", "Notification"}
    hook_count = 0
    
    for event, event_hooks in hooks.items():
        if event not in valid_events:
            print(f"⚠️  Unknown event type: {event}")
        
        if not isinstance(event_hooks, list):
            print(f"❌ Value of {event} must be an array")
            return False
        
        print(f"\n📌 {event} ({len(event_hooks)} configurations)")
        
        for i, hook_group in enumerate(event_hooks):
            if not isinstance(hook_group, dict):
                print(f"  ❌ Configuration {i+1} must be an object")
                continue
            
            # Check matcher (optional)
            matcher = hook_group.get("matcher", "")
            if matcher:
                print(f"  Matcher: {matcher}")
            
            # Check hooks array
            if "hooks" not in hook_group:
                print(f"  ❌ Configuration {i+1} missing 'hooks' array")
                continue
            
            hook_list = hook_group["hooks"]
            if not isinstance(hook_list, list):
                print(f"  ❌ 'hooks' must be an array")
                continue
            
            for j, hook in enumerate(hook_list):
                if not isinstance(hook, dict):
                    print(f"    ❌ Hook {j+1} must be an object")
                    continue
                
                # Validate hook type and command
                hook_type = hook.get("type")
                command = hook.get("command")
                
                if hook_type != "command":
                    print(f"    ⚠️  Hook {j+1} type: {hook_type} (expected: command)")
                
                if not command:
                    print(f"    ❌ Hook {j+1} missing command")
                else:
                    print(f"    ✅ Command: {command[:50]}{'...' if len(command) > 50 else ''}")
                    hook_count += 1
    
    print(f"\n📊 Total: {hook_count} hooks")
    print("✅ Validation passed" if hook_count > 0 else "⚠️  No valid hooks found")
    
    return True


def display_hooks_summary(file_path):
    """Display hooks summary"""
    with open(file_path, 'r') as f:
        config = json.load(f)
    
    print("\n📋 Hooks Summary")
    print("=" * 50)
    
    for event, event_hooks in config.get("hooks", {}).items():
        print(f"\n{event}:")
        for hook_group in event_hooks:
            matcher = hook_group.get("matcher", "All tools")
            for hook in hook_group.get("hooks", []):
                command = hook.get("command", "")
                print(f"  [{matcher}] → {command}")


if __name__ == "__main__":
    # Default to check user's hooks.json
    hooks_file = Path.home() / ".claude" / "hooks.json"
    
    # Can also specify other files
    if len(sys.argv) > 1:
        hooks_file = Path(sys.argv[1])
    
    if validate_hooks_file(hooks_file):
        display_hooks_summary(hooks_file)
    else:
        print("\n❌ Validation failed")
        sys.exit(1)


================================================
FILE: examples/sample_rules.md
================================================
# Sample Project Rules

These are example rules that can be converted to Claude Code hooks using the claudecode-rule2hook command.

## Code Quality Rules

- Format Python code with `black` after editing .py files
- Format JavaScript/TypeScript with `prettier --write` after editing .js/.ts files
- Run `eslint --fix` on JavaScript files before saving
- Check for console.log statements before committing

## Git Workflow Rules

- Run `git status` when finishing a task
- Create a git commit message template when committing
- Prevent commits to main branch
- Run `git diff --cached` before confirming a commit

## Testing Rules

- Run unit tests after modifying files in the tests/ directory
- Run `pytest -xvs` when editing test_*.py files
- Validate JSON schema when saving .json files
- Check API endpoints after modifying routes

## Security Rules

- Scan for hardcoded secrets before any file write
- Prevent writing files containing API keys or passwords
- Check file permissions after creating scripts
- Validate environment variables before running commands

## Development Workflow

- Update requirements.txt after installing new packages
- Regenerate documentation after modifying docstrings
- Clear cache when modifying configuration files
- Restart development server after changing .env file

## Notification Rules

- Send Slack notification when deployment scripts are run
- Log all database migrations to audit file
- Alert when modifying production configuration
- Notify team when critical files are changed

## Custom Script Examples

- Run custom build process: `npm run build && npm test`
- Execute multi-step validation: Check syntax, run tests, then lint
- Conditional formatting: Format only if file size < 1000 lines
- Chain operations: Format, test, then commit if all pass


================================================
FILE: .claude/commands/rule2hook.md
================================================
# Task: Convert Project Rules to Claude Code Hooks

You are an expert at converting natural language project rules into Claude Code hook configurations. Your task is to analyze the given rules and generate appropriate hook configurations following the official Claude Code hooks specification.

## Instructions

1. If rules are provided as arguments, analyze those rules
2. If no arguments are provided, read and analyze the CLAUDE.md file from these locations:
   - `./CLAUDE.md` (project memory)
   - `./CLAUDE.local.md` (local project memory)  
   - `~/.claude/CLAUDE.md` (user memory)

3. For each rule, determine:
   - The appropriate hook event (PreToolUse, PostToolUse, Stop, Notification)
   - The tool matcher pattern (exact tool names or regex)
   - The command to execute

4. Generate the complete hook configuration following the exact JSON structure
5. Save it to `~/.claude/hooks.json` (merge with existing hooks if present)
6. Provide a summary of what was configured

## Hook Events

### PreToolUse
- **When**: Runs BEFORE a tool is executed
- **Common Keywords**: "before", "check", "validate", "prevent", "scan", "verify"
- **Available Tool Matchers**: 
  - `Task` - Before launching agent tasks
  - `Bash` - Before running shell commands
  - `Glob` - Before file pattern matching
  - `Grep` - Before content searching
  - `Read` - Before reading files
  - `Edit` - Before editing single files
  - `MultiEdit` - Before batch editing files
  - `Write` - Before writing/creating files
  - `WebFetch` - Before fetching web content
  - `WebSearch` - Before web searching
  - `TodoRead` - Before reading todo list
  - `TodoWrite` - Before updating todo list
- **Special Feature**: Can block tool execution if command returns non-zero exit code

### PostToolUse
- **When**: Runs AFTER a tool completes successfully
- **Common Keywords**: "after", "following", "once done", "when finished"
- **Available Tool Matchers**: Same as PreToolUse
- **Common Uses**: Formatting, linting, building, testing after file changes

### Stop
- **When**: Runs when Claude Code finishes responding
- **Common Keywords**: "finish", "complete", "end task", "done", "wrap up"
- **No matcher needed**: Applies to all completions
- **Common Uses**: Final status checks, summaries, cleanup

### Notification
- **When**: Runs when Claude Code sends notifications
- **Common Keywords**: "notify", "alert", "inform", "message"
- **Special**: Rarely used for rule conversion

## Hook Configuration Structure

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolName|AnotherTool|Pattern.*",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here"
          }
        ]
      }
    ]
  }
}
```

## Matcher Patterns

- **Exact match**: `"Edit"` - matches only Edit tool
- **Multiple tools**: `"Edit|MultiEdit|Write"` - matches any of these
- **Regex patterns**: `".*Edit"` - matches Edit and MultiEdit
- **All tools**: Omit matcher field entirely

## Examples with Analysis

### Example 1: Python Formatting
**Rule**: "Format Python files with black after editing"
**Analysis**: 
- Keyword "after" → PostToolUse
- "editing" → Edit|MultiEdit|Write tools
- "Python files" → command should target .py files

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|MultiEdit|Write",
      "hooks": [{
        "type": "command",
        "command": "black . --quiet 2>/dev/null || true"
      }]
    }]
  }
}
```

### Example 2: Git Status Check
**Rule**: "Run git status when finishing a task"
**Analysis**:
- "finishing" → Stop event
- No specific tool mentioned → no matcher needed

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "git status"
      }]
    }]
  }
}
```

### Example 3: Security Scan
**Rule**: "Check for hardcoded secrets before saving any file"
**Analysis**:
- "before" → PreToolUse
- "saving any file" → Write|Edit|MultiEdit

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "git secrets --scan 2>/dev/null || echo 'No secrets found'"
      }]
    }]
  }
}
```

### Example 4: Test Runner
**Rule**: "Run npm test after modifying files in tests/ directory"
**Analysis**:
- "after modifying" → PostToolUse
- "files" → Edit|MultiEdit|Write
- Note: Path filtering happens in the command, not the matcher

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|MultiEdit|Write",
      "hooks": [{
        "type": "command",
        "command": "npm test 2>/dev/null || echo 'Tests need attention'"
      }]
    }]
  }
}
```

### Example 5: Command Logging
**Rule**: "Log all bash commands before execution"
**Analysis**:
- "before execution" → PreToolUse
- "bash commands" → Bash tool specifically

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "echo \"[$(date)] Executing bash command\" >> ~/.claude/command.log"
      }]
    }]
  }
}
```

## Best Practices for Command Generation

1. **Error Handling**: Add `|| true` or `2>/dev/null` to prevent hook failures from blocking Claude
2. **Quiet Mode**: Use quiet flags (--quiet, -q) when available
3. **Path Safety**: Use relative paths or check existence
4. **Performance**: Keep commands fast to avoid slowing down Claude
5. **Logging**: Redirect verbose output to avoid cluttering Claude's interface

## Common Rule Patterns

- "Format [language] files after editing" → PostToolUse + Edit|MultiEdit|Write
- "Run [command] before committing" → PreToolUse + Bash (when git commit detected)
- "Check for [pattern] before saving" → PreToolUse + Write|Edit|MultiEdit
- "Execute [command] when done" → Stop event
- "Validate [something] before running commands" → PreToolUse + Bash
- "Clear cache after modifying config" → PostToolUse + Edit|MultiEdit|Write
- "Notify when [condition]" → Usually PostToolUse with specific matcher

## Important Notes

1. Always merge with existing hooks - don't overwrite
2. Test commands work before adding to hooks
3. Consider performance impact of hooks
4. Use specific matchers when possible to avoid unnecessary executions
5. Commands run with full user permissions - be careful with destructive operations

## User Input
$ARGUMENTS


================================================
FILE: .github/ISSUE_TEMPLATE/bug_report.md
================================================
---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. Enter rule '...'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Generated Hook**
If applicable, paste the generated hook configuration:
```json
// Paste hook configuration here
```

**Environment:**
 - OS: [e.g. macOS, Linux, Windows]
 - Claude Code Version: [e.g. 0.3.0]
 - Shell: [e.g. bash, zsh]

**Additional context**
Add any other context about the problem here.


================================================
FILE: .github/ISSUE_TEMPLATE/feature_request.md
================================================
---
name: Feature request
about: Suggest an idea for rule2hook
title: ''
labels: enhancement
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Example Rule**
Provide an example of the rule pattern you'd like to support:
```
"Your example rule here"
```

**Expected Hook Output**
What hook configuration should be generated:
```json
{
  "hooks": {
    // Expected configuration
  }
}
```

**Additional context**
Add any other context or screenshots about the feature request here.


================================================
FILE: .github/workflows/test.yml
================================================
name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Validate JSON in examples
      run: |
        python -m json.tool .claude/commands/rule2hook.md > /dev/null || echo "Not a JSON file, skipping validation"
        
    - name: Check file permissions
      run: |
        test -x quick-test.sh || (echo "quick-test.sh is not executable" && exit 1)
        test -x validate-hooks.py || (echo "validate-hooks.py is not executable" && exit 1)
    
    - name: Validate hook examples
      run: |
        echo '{"hooks": {}}' > test_hooks.json
        python3 validate-hooks.py test_hooks.json

