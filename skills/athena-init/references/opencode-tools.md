# OpenCode Tool Mapping

Athena skills use Claude Code tool names. When you see these in a skill, use your OpenCode equivalent:

| Skill references | OpenCode equivalent |
|---|---|
| `Read`, `Write`, `Edit` (file ops) | Use your native file tools |
| `Bash` (run commands) | Use your native shell tool |
| `Grep`, `Glob` (search) | Use your native search tools |
| `TodoWrite` (task tracking) | `todowrite` |
| `Skill` tool (invoke a skill) | OpenCode's native `skill` tool |
| `Task` tool (dispatch subagent) | OpenCode's `@mention` subagent system |
| `WebFetch`, `WebSearch` | Your native web tools |

## Subagent dispatch via @mention

OpenCode uses the `@mention` syntax to dispatch subagents. For Athena's build flow:

| Athena role | OpenCode dispatch |
|---|---|
| `athena-worker` (implementer) | `@generalist` with filled `skills/athena-build/implementer-prompt.md` |
| `athena-code-reviewer` (spec pass) | `@generalist` with filled `spec-reviewer-prompt.md` |
| `athena-code-reviewer` (quality pass) | `@generalist` with filled `code-quality-reviewer-prompt.md` |
| `athena-code-reviewer` (wave/final) | `@generalist` with `agents/athena-code-reviewer.md` |
| `athena-verifier` | `@generalist` with a "run tests, report" prompt |
| `athena-debugger` | `@generalist` with `agents/athena-debugger.md` |

### Parallel dispatch

When `athena-build` calls for parallel workers in a wave, mention multiple agents in the same turn. OpenCode dispatches them concurrently.

## Bootstrap

The `.opencode/plugins/athena.js` plugin injects `athena-init` SKILL.md as the session's bootstrap system context. You do NOT need to manually load `athena-init` — it is already active when you receive your first message. Subsequent skills load on demand via the `skill` tool.

## Skills discovery

The OpenCode plugin auto-registers Athena's `./skills/` directory. To list:

```
use skill tool to list skills
```

To load:

```
use skill tool to load athena/athena-brainstorm
use skill tool to load athena/athena-build
```
