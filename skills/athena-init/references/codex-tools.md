# Codex Tool Mapping

Athena skills use Claude Code tool names. When you see these in a skill, use your Codex equivalent:

| Skill references | Codex equivalent |
|---|---|
| `Read`, `Write`, `Edit` (file ops) | Use your native file tools |
| `Bash` (run commands) | Use your native shell tool |
| `Grep`, `Glob` (search) | Use your native search tools |
| `Skill` tool (invoke a skill) | Skills load natively — follow the loaded instructions |
| `Task` tool (dispatch subagent) | `spawn_agent` (see Subagent Dispatch below) |
| Multiple `Task` calls (parallel) | Multiple `spawn_agent` calls in the same turn |
| Task returns result | `wait_agent` |
| Task completes automatically | `close_agent` to free the slot |
| `TodoWrite` (task tracking) | `update_plan` |
| `WebFetch` | Use Codex's native fetch tool |
| `WebSearch` | No direct equivalent — use fetch with a search engine URL |

## Subagent Dispatch — Multi-Agent Support

Athena's build flow (`athena-build`) and several other skills dispatch subagents. On Codex, enable multi-agent support in `~/.codex/config.toml`:

```toml
[features]
multi_agent = true
```

This enables `spawn_agent` / `wait_agent` / `close_agent`, which Athena skills use for:

- `athena-worker` (implementer, one per task in a wave)
- `athena-code-reviewer` (per-task spec pass, per-task quality pass, wave-level pass)
- `athena-verifier`, `athena-debugger`, `athena-researcher`, `athena-scout`

### Prompt templates

For per-task two-stage review (in `athena-build`), use these prompt templates as the body of each `spawn_agent` call:

- `skills/athena-build/implementer-prompt.md`
- `skills/athena-build/spec-reviewer-prompt.md`
- `skills/athena-build/code-quality-reviewer-prompt.md`

Fill the `{{PLACEHOLDERS}}` before dispatch.

### Legacy note

Codex builds before `rust-v0.115.0` exposed spawned-agent waiting as `wait`. Current Codex uses `wait_agent` for spawned agents.

## Environment Detection

Athena's `athena-worktree` and `athena-finish` skills detect their git environment with read-only commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

If `GIT_DIR != GIT_COMMON`, you are inside a worktree — adjust paths accordingly.
