# Installing Athena for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Node.js (for the session-start bootstrap hook)

## Installation

Add Athena to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["athena@git+https://github.com/bencrooks-dev/athena.git"]
}
```

Restart OpenCode. The plugin registers all Athena skills and injects the
`athena-init` bootstrap context at session start (via system-prompt transform).

Verify by asking: *"Tell me about your Athena workflows."*

OpenCode uses its own plugin install. If you also use Claude Code, Codex,
Cursor, or Gemini CLI, install Athena separately for each one — see the
top-level `README.md`.

## Usage

Use OpenCode's native `skill` tool:

```
use skill tool to list skills
use skill tool to load athena/athena-brainstorm
use skill tool to load athena/athena-build
```

## What the OpenCode plugin does

`.opencode/plugins/athena.js` performs three things on session start:

1. Registers the `./skills/` directory so OpenCode discovers all Athena skills.
2. Reads `skills/athena-init/SKILL.md` and injects it as the session's
   bootstrap context (the strongest enforcement vector — framework is in the
   model's eyes from message 1).
3. Adds an OpenCode-specific tool-name reference so skills written against
   Claude Code tool names map cleanly to OpenCode equivalents.

