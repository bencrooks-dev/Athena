# Copilot CLI Tool Mapping

Athena skills use Claude Code tool names. When you see these in a skill, use your Copilot CLI equivalent:

| Skill references | Copilot CLI equivalent |
|---|---|
| `Read` (file reading) | `view` |
| `Write` (file creation) | `create` |
| `Edit` (file editing) | `edit` |
| `Bash` (run commands) | `bash` |
| `Grep` (search file content) | `grep` |
| `Glob` (search files by name) | `glob` |
| `Skill` tool (invoke a skill) | `skill` |
| `WebFetch` | `web_fetch` |
| `Task` tool (dispatch subagent) | `task` with `agent_type: "general-purpose"` |
| Multiple `Task` calls (parallel) | Multiple `task` calls in one turn |
| Task status/output | `read_agent`, `list_agents` |
| `TodoWrite` (task tracking) | `sql` with built-in `todos` table |
| `WebSearch` | No equivalent — `web_fetch` with a search engine URL |

## Async shell sessions

Copilot CLI supports persistent async shells that have no Claude Code equivalent:

| Tool | Purpose |
|---|---|
| `bash` with `async: true` | Start a long-running command in the background |
| `write_bash` | Send input to a running async session |
| `read_bash` | Read output from an async session |
| `stop_bash` | Terminate an async session |
| `list_bash` | List all active shell sessions |

Athena's `athena-verifier` and `athena-debugger` can benefit from `async: true` when running long test suites.

## Subagent dispatch

Athena's build flow dispatches subagents through `athena-build`'s coordinator pattern. On Copilot CLI, use `task` with the per-role prompt template:

- `athena-worker` (implementer) → `task` with the filled `skills/athena-build/implementer-prompt.md`
- `athena-code-reviewer` (spec pass) → `task` with `spec-reviewer-prompt.md`
- `athena-code-reviewer` (quality pass) → `task` with `code-quality-reviewer-prompt.md`
- `athena-code-reviewer` (wave/final) → `task` with the agent file `agents/athena-code-reviewer.md`

Dispatch multiple independent `task` calls in one turn for parallel waves.

## Additional Copilot CLI tools

| Tool | Purpose |
|---|---|
| `store_memory` | Persist facts about the codebase across sessions |
| `report_intent` | Update the UI status line |
| `sql` | Query the session's SQLite (todos, metadata) |
| GitHub MCP tools (`github-mcp-server-*`) | Native GitHub API (issues, PRs, code search) |
