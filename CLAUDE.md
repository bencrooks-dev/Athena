# Athena — Claude Code Entry

You have Athena. Athena is a workflow orchestration framework with 17 skills, 6 specialized agents, smart routing, and enforced verification gates.

## Bootstrap

The `athena-init` skill is loaded automatically at session start via the `SessionStart` hook (`hooks/athena-session-start-hook.cjs`). It describes the framework, the routing flow, the instruction priority hierarchy, and the rationalization Red Flags.

If for any reason you do not see the athena-init context at session start (e.g., hooks aren't installed in this environment), invoke the `athena-init` skill manually via the `Skill` tool before any response.

## Skill access

Use the `Skill` tool to invoke any Athena skill:

| Skill | Use when |
|---|---|
| `athena-init` | Loaded at session start; sets the framework rules. |
| `athena` | Smart router — natural-language intent → correct workflow. |
| `athena-brainstorm` | Before any new feature or significant change. |
| `athena-plan` | After brainstorm; produces wave-structured plans. |
| `athena-build` | Executes a plan with per-task two-stage review + wave verification. |
| `athena-tdd` | Red → green → refactor enforcement. |
| `athena-debug` | Hypothesis-driven debugging with evidence trails. |
| `athena-review` | Standalone four-pass code review. |
| `athena-receive-review` | Incorporate review feedback rigorously. |
| `athena-verify` | Pre-ship verification gate. |
| `athena-ship` | Pre-merge readiness. |
| `athena-finish` | Merge / PR / cleanup. |
| `athena-worktree` | Isolated git worktree work. |
| `athena-forge` | Author new skills. |
| `athena-canvas` | Visual mockups during brainstorm. |
| `athena-pause` / `athena-resume` | Toggle Athena routing per project. |

## Agent dispatch (Task tool)

Athena provides six dedicated agents in `agents/`. Dispatch them via the `Task` tool. Build flow defaults:

- `athena-worker` — implementer (one per task)
- `athena-code-reviewer` — per-task spec pass, per-task quality pass, wave-level pass
- `athena-verifier` — runs full test suite per wave
- `athena-debugger` — hypothesis-driven debugging on failures
- `athena-researcher` — codebase exploration in parallel
- `athena-scout` — fast batched searches

## Tool name reference

This entry doc and all Athena skills use Claude Code tool names directly (`Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `Task`, `Skill`, `TodoWrite`). No mapping needed.

## User instructions outrank skills

The Instruction Priority in `athena-init` is: user instructions > Athena skills > defaults. If a project's own `CLAUDE.md` or a direct user request says "skip the workflow," follow the user.
