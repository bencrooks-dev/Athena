# Athena vs Superpowers — Full Comparison

A detailed, data-driven comparison between [Athena](https://github.com/bencrooks-dev/athena) and [Obra Superpowers](https://github.com/obra/superpowers), two Claude Code workflow plugins that share the same core philosophy (TDD, plan-before-build, verify-before-ship) but differ significantly in architecture, efficiency, and execution model.

---

## Overview

| | **Athena** | **Superpowers** |
|---|---|---|
| Skills | 17 | 14 |
| Agents | 6 (scout, worker, debugger, reviewer, verifier, researcher) | 1 (code-reviewer) |
| Hooks | 3 (init, state, lifecycle) | 2 (session-start, config) |
| Platforms | 6 (Claude Code, Cursor, Codex, Copilot, Gemini, OpenCode) | 6 (Claude Code, Cursor, Codex, Copilot, Gemini, OpenCode) |
| Architecture | Coordinator pattern with parallel agent dispatch | Single-agent sequential execution |
| State tracking | `.athena-state.json` with wave progress | None |

---

## Feature Comparison

### Planning

| | **Athena** | **Superpowers** |
|---|---|---|
| Wave/dependency structure | Explicit waves with parallel/sequential marking | No wave concept — sequential task list |
| File structure phase | Dedicated phase before tasks | Same approach |
| TDD per task | Yes, with actual code blocks | Yes, same approach |
| Self-review | 3-pass (spec coverage, placeholder scan, type consistency) | Same 3 checks |
| Plan ID + commit tracing | Yes (`[plan:name] [wave:1/task:2]`) | No |
| State tracking | `.athena-state.json` with wave progress | None |

**Edge: Athena.** The wave structure and parallel execution model is a real differentiator. Superpowers plans are flat task lists. Athena plans encode which tasks can run simultaneously and which depend on others.

### Brainstorming

| | **Athena** | **Superpowers** |
|---|---|---|
| Scale assessment | 4-tier (tiny/small/medium/large) | Yes, similar |
| Questions one at a time | Yes | Yes |
| 2-3 approaches with tradeoffs | Yes, comparison table | Yes |
| Visual canvas | Yes (`/athena-canvas`) | Yes (browser companion) |
| Spec self-review | 8-dimension review with BLOCKING/WARNING | Inline review, less structured |
| Memory integration | Yes (Engram — checks past feedback/corrections) | No |
| Rationalization table | Yes — guards against skipping | No |

**Edge: Athena, narrowly.** The 8-dimension spec review and memory integration (checking past mistakes before designing) are meaningful. The core brainstorming flow is nearly identical.

### Debugging

| | **Athena** | **Superpowers** |
|---|---|---|
| Scientific method | Observe, hypothesize, predict, test, conclude | Same 4-phase approach |
| Multiple ranked hypotheses | 2-3 with confirm/reject tracking | Hypothesis testing |
| Checkpoint/rollback | Explicit git stash checkpoints | Not mentioned |
| Recovery playbooks | 4 playbooks (stuck, timeout, flaky, regression) | "3 failures -> question architecture" |
| Multi-component tracing | Dedicated section with boundary logging | Same boundary logging |
| Flaky bug handling | Dedicated section | Not detailed |
| Pattern logging | Yes (Engram session logging) | No |
| Rationalization table | 6 anti-pattern guards | Warning signs list |

**Edge: Athena.** The recovery playbooks are the big differentiator. When all hypotheses fail, Athena has structured escalation paths. Superpowers says "stop and question architecture." Athena also tracks debugging history so recurring patterns get caught.

### Code Generation (Build/Execute)

| | **Athena** | **Superpowers** |
|---|---|---|
| Parallel agent dispatch | Yes — 6 specialized agents per wave | No — sequential, single agent |
| Agent types | Worker, reviewer, debugger, verifier, researcher, scout | Code reviewer only |
| Verification gates | Between every wave | After each task |
| Auto-recovery | 3 fix attempts -> debugger -> escalate | Stop and ask |
| State persistence | `.athena-state.json` survives context compression | None |
| Recovery from interruption | Reads state + git log, resumes from last verified wave | Re-read plan, re-execute |

**Edge: Athena, decisively.** Athena dispatches multiple workers in parallel, has specialized agents for different failure modes, and maintains state across context compression. Superpowers runs tasks one at a time in a single thread.

### Unique to Athena

- `/athena-canvas` — zero-dependency visual mockups and wireframes
- `/athena-pause` and `/athena-resume` — workflow control
- `/athena-forge` — skill authoring with TDD validation
- Auto-routing via `/athena` — detects task type, picks the right skill
- 6 specialized agents vs 1
- Pipeline state tracking with recovery playbooks
- Engram memory integration across all skills

### Unique to Superpowers

- 6-platform support (Claude Code, Cursor, Codex, Copilot, Gemini, OpenCode)
- ~130k GitHub stars and large contributor community
- `writing-skills` — extensive skill authoring guide (1,547 lines)

---

## Token Efficiency

This is where the difference is most measurable. Every time a skill is invoked, its full prompt is injected into the context window. Larger prompts mean less room for actual code reasoning.

### Total Skill Sizes

| Metric | Athena | Superpowers | Difference |
|---|---|---|---|
| Total skills | 17 | 14 | Athena has 3 more |
| Total lines | 2,682 | ~4,341 | **Superpowers is 62% larger** |
| Avg lines/skill | 158 | 310 | **Superpowers 96% more per skill** |
| Estimated tokens | ~35K | ~57K | ~22K more for Superpowers |

**Athena delivers 21% more skills in 38% less total token budget.**

### Per-Skill Breakdown (Athena)

| Skill | Lines |
|---|---|
| athena-tdd | 382 |
| athena-build | 291 |
| athena-plan | 231 |
| athena-debug | 207 |
| athena-canvas | 189 |
| athena-finish | 179 |
| athena-forge | 158 |
| athena-ship | 147 |
| athena-receive-review | 144 |
| athena-brainstorm | 132 |
| athena-worktree | 130 |
| athena-verify | 117 |
| athena (router) | 89 |
| athena-review | 80 |
| athena-pause | 78 |
| athena-init | 69 |
| athena-resume | 59 |
| **Total** | **2,682** |

### Per-Skill Breakdown (Superpowers)

| Skill | Lines |
|---|---|
| writing-skills | 1,547 |
| test-driven-development | 565 |
| systematic-debugging | 408 |
| brainstorming | 343 |
| subagent-driven-development | 342 |
| using-git-worktrees | 328 |
| writing-plans | 287 |
| finishing-a-development-branch | 259 |
| receiving-code-review | 247 |
| dispatching-parallel-agents | 247 |
| requesting-code-review | 191 |
| using-superpowers | 174 |
| verification-before-completion | 160 |
| executing-plans | 78 |
| **Total** | **~4,341** |

### Apples-to-Apples: Equivalent Skills

| Function | Athena | Superpowers | Superpowers overhead |
|---|---|---|---|
| Planning | 231 | 287 | +24% |
| Brainstorming | 132 | 343 | +160% |
| Debugging | 207 | 408 | +97% |
| TDD | 382 | 565 | +48% |
| Build/Execute | 291 | 420 | +44% |
| Code Review | 80 | 191 | +139% |
| Worktrees | 130 | 328 | +152% |
| Verification | 117 | 160 | +37% |
| **Average** | | | **+88%** |

**Superpowers uses ~88% more tokens per equivalent skill on average.**

### Why Superpowers Is Larger

It's not because it does more — it's because it spends tokens justifying its own rules. For example, the TDD skill (565 lines) includes ~150 lines of rationalization tables and essays arguing why TDD matters ("I'll write tests after" -> here's why that's wrong, "Too simple to test" -> here's why that's wrong, etc.). Athena's TDD skill covers the same methodology in 382 lines by stating rules and moving on.

The biggest outlier is `writing-skills` at 1,547 lines — that single skill is 58% the size of Athena's entire plugin.

### Real-World Impact

In a full build session (brainstorm -> plan -> build -> review -> ship), cumulative skill prompt injection:

- **Athena:** ~10-12K tokens across skill invocations
- **Superpowers:** ~18-22K tokens across skill invocations

That's 8-10K tokens of context window recovered by Athena — context that goes toward reasoning about your actual code instead of re-reading why TDD is important.

---

## Summary

| Dimension | Winner | Margin |
|---|---|---|
| Planning | Athena | Wave parallelism, plan IDs, state tracking |
| Brainstorming | Athena (narrow) | 8-dim spec review, memory integration |
| Debugging | Athena | Recovery playbooks, pattern logging |
| Code generation | Athena | 6 parallel agents vs 1 sequential |
| Token efficiency | Athena | ~40-60% less total, ~2x per skill |
| Platform support | Tie | Both support 6 platforms |
| Community adoption | Superpowers | ~130k stars, 28 contributors |

Athena is the more capable and more efficient plugin. Superpowers has massive community adoption. The core philosophy is identical — the difference is in execution machinery and prompt engineering discipline.

---

*Comparison: Athena v2.3.0 vs Superpowers at commit HEAD on main, May 2026.*
