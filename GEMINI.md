# Athena — Gemini CLI Entry

You have Athena. Athena is a workflow orchestration framework with 17 skills, 6 specialized agents, smart routing, and enforced verification gates.

## Bootstrap

This `GEMINI.md` is loaded at session start by Gemini CLI (declared in `gemini-extension.json` as `contextFileName: "GEMINI.md"`). It serves as your introduction to Athena.

**Your first action in any new session:** activate the `athena-init` skill via `activate_skill`. That skill defines the routing flow, the instruction priority hierarchy, and the rationalization Red Flags. Treat it as system-level.

## Skill access — Gemini CLI

Gemini CLI activates skills via the `activate_skill` tool. Skill metadata is loaded at session start; the full content activates on demand.

| Skill | Use when |
|---|---|
| `athena-init` | Activate first. Sets framework rules. |
| `athena` | Smart router. |
| `athena-brainstorm` | Before any new feature. |
| `athena-plan` | After brainstorm; produces wave-structured plans. |
| `athena-build` | Execute a plan. |
| `athena-tdd` | Red → green → refactor enforcement. |
| `athena-debug` | Hypothesis-driven debugging. |
| `athena-review` / `athena-receive-review` | Code review (give / receive). |
| `athena-verify` / `athena-ship` / `athena-finish` | Verification & shipping. |
| `athena-worktree` | Isolated git worktree work. |
| `athena-forge` | Author new skills. |
| `athena-canvas` | Visual mockups during brainstorm. |
| `athena-pause` / `athena-resume` | Toggle Athena routing. |

## Agent dispatch — Gemini CLI

Athena's six agents (`agents/athena-*.md`) describe behavior, not platform-bound implementations. On Gemini CLI, dispatch them via the `@` syntax with the appropriate prompt template.

**For build flow:** use the per-role prompt templates in `skills/athena-build/`:

| Athena role | Gemini CLI dispatch |
|---|---|
| `athena-worker` (implementer) | `@generalist` with the filled `implementer-prompt.md` template |
| `athena-code-reviewer` (spec pass) | `@generalist` with the filled `spec-reviewer-prompt.md` |
| `athena-code-reviewer` (quality pass) | `@generalist` with the filled `code-quality-reviewer-prompt.md` |
| `athena-code-reviewer` (wave/final) | `@code-reviewer` (bundled) or `@generalist` with the full prompt |
| `athena-verifier` | `@generalist` with a "run tests, report results" prompt |
| `athena-debugger` | `@generalist` with a debugging prompt |
| `athena-researcher` / `athena-scout` | `@generalist` with research/search prompt |

### Parallel dispatch

Gemini CLI supports parallel subagent dispatch. When an athena skill (e.g., `athena-build`) calls for parallel workers in a wave, request all of them together in one turn. Sequential only for dependent tasks.

## Tool name reference

Athena skills use Claude Code tool names. For Gemini CLI equivalents see `skills/athena-init/references/gemini-tools.md`. Common mappings:

| Athena skill says | Gemini CLI |
|---|---|
| `Read` | `read_file` |
| `Write` | `write_file` |
| `Edit` | `replace` |
| `Bash` | `run_shell_command` |
| `Grep` | `grep_search` |
| `Glob` | `glob` |
| `TodoWrite` | `write_todos` |
| `Skill` tool | `activate_skill` |
| `Task` tool | `@agent-name` |
| `WebSearch` | `google_web_search` |
| `WebFetch` | `web_fetch` |

## User instructions outrank skills

Instruction Priority: user instructions > Athena skills > defaults. If a project's GEMINI.md or a direct user request says "skip the workflow," follow the user.
