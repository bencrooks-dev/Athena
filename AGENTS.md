# Athena — Agent Entry (Codex, Factory Droid, generic AGENTS.md readers)

You have Athena. Athena is a workflow orchestration framework with 17 skills, 6 specialized agents, smart routing, and enforced verification gates.

## Bootstrap

At session start, load the `athena-init` content from `skills/athena-init/SKILL.md` and treat it as a system-level instruction set. It describes the routing flow, instruction priority hierarchy, and rationalization Red Flags.

On harnesses that auto-load `AGENTS.md` (Codex, Factory Droid), this file is read at session start. On harnesses that don't, your platform's plugin manifest should arrange equivalent loading.

## Skill access

Use your platform's skill mechanism to invoke Athena skills:

| Skill | Use when |
|---|---|
| `athena-init` | Sets the framework rules. Load first. |
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

## Agent dispatch

Athena provides six dedicated agents in `agents/`. On your harness, dispatch them via whatever subagent mechanism you have (Codex: `spawn_agent` / `wait_agent`; Gemini: `@generalist`; etc.). See `skills/athena-init/references/` for the tool-name and dispatch-mechanism mapping for your platform.

Build flow defaults:

- `athena-worker` — implementer (one per task in a wave)
- `athena-code-reviewer` — per-task spec pass, per-task quality pass, wave-level pass
- `athena-verifier` — runs full test suite per wave
- `athena-debugger` — hypothesis-driven debugging on failures
- `athena-researcher` — codebase exploration in parallel
- `athena-scout` — fast batched searches

## Tool name reference

Athena skills use Claude Code tool names internally (`Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `Task`, `Skill`, `TodoWrite`). For platform-specific equivalents see:

- `skills/athena-init/references/codex-tools.md`
- `skills/athena-init/references/copilot-tools.md`
- `skills/athena-init/references/gemini-tools.md`
- `skills/athena-init/references/opencode-tools.md`

## User instructions outrank skills

The Instruction Priority in `athena-init` is: user instructions > Athena skills > defaults. If a project's own AGENTS.md or a direct user request says "skip the workflow," follow the user.
