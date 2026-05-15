# Gemini CLI Tool Mapping

Athena skills use Claude Code tool names. When you see these in a skill, use your Gemini CLI equivalent:

| Skill references | Gemini CLI equivalent |
|---|---|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_file` |
| `Edit` (file editing) | `replace` |
| `Bash` (run commands) | `run_shell_command` |
| `Grep` (search file content) | `grep_search` |
| `Glob` (search files by name) | `glob` |
| `TodoWrite` (task tracking) | `write_todos` |
| `Skill` tool (invoke a skill) | `activate_skill` |
| `WebSearch` | `google_web_search` |
| `WebFetch` | `web_fetch` |
| `Task` tool (dispatch subagent) | `@agent-name` (see Subagent Support below) |

## Subagent Support

Gemini CLI supports subagents natively via the `@` syntax. The built-in `@generalist` agent has access to all tools and follows the prompt you provide.

### Athena roles → Gemini dispatch

When an Athena skill says to dispatch a named agent type, use `@generalist` with the full prompt template:

| Athena role | Gemini CLI dispatch |
|---|---|
| `athena-worker` (implementer) | `@generalist` with filled `skills/athena-build/implementer-prompt.md` |
| `athena-code-reviewer` (spec pass) | `@generalist` with filled `spec-reviewer-prompt.md` |
| `athena-code-reviewer` (quality pass) | `@generalist` with filled `code-quality-reviewer-prompt.md` |
| `athena-code-reviewer` (wave/final) | `@code-reviewer` (bundled) or `@generalist` with `agents/athena-code-reviewer.md` |
| `athena-verifier` | `@generalist` with a "run tests, report results" prompt |
| `athena-debugger` | `@generalist` with `agents/athena-debugger.md` |
| `athena-researcher` / `athena-scout` | `@generalist` with the agent's prompt body |

### Prompt filling

Athena prompt templates use `{{PLACEHOLDERS}}` like `{{TASK_NAME}}`, `{{PLAN_PATH}}`, `{{TASK_TEXT}}`. Fill every placeholder before dispatch; the prompt body itself contains the agent's role, criteria, and expected output format — `@generalist` follows it.

### Parallel dispatch

Gemini CLI supports parallel subagent dispatch. When `athena-build` calls for parallel workers in a wave, request all of those `@generalist` tasks together in the same prompt. Keep dependent tasks sequential, but do not serialize independent subagent tasks just to preserve a simpler history.

## Additional Gemini CLI tools

| Tool | Purpose |
|---|---|
| `list_directory` | List files and subdirectories |
| `save_memory` | Persist facts to GEMINI.md across sessions |
| `ask_user` | Request structured input from the user |
| `tracker_create_task` | Rich task management (alternative to `write_todos`) |
