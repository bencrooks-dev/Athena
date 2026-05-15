<p align="center">
  <img src="athena-logo.png" alt="Athena" width="420">
</p>

<p align="center"><strong>Workflow orchestrator for AI coding agents.</strong><br>
Active multi-agent coordination with enforced discipline — not passive prompts.</p>

<p align="center">
  Supported harnesses: <strong>Claude Code · Cursor · Codex · Gemini CLI · OpenCode · Copilot CLI</strong>
</p>

---

## What's Different

Most workflow plugins inject text that *suggests* what to do. Athena *enforces* it:

- **SessionStart bootstrap** — `athena-init` is injected as additional context at session boot (Claude Code, Cursor, OpenCode), or loaded as a context file (Gemini CLI, Codex). The framework is in the model's eyes from message 1.
- **Per-task two-stage review** — every task runs `implementer → spec-reviewer → code-quality-reviewer`. Catches gaps while the diff is small.
- **Status-code protocol** — workers report exactly one of `DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED`. The coordinator branches on it; no silent failures.
- **Model-tier dispatch** — cheap for mechanical implementers, standard for integration, most-capable for design/debug. Cost-aware by default.
- **Continuous execution** — no "should I continue?" check-ins between tasks. Stops only on unresolvable BLOCKED, 3 failed wave fixes, genuine ambiguity, or all done.
- **Wave verification gates** — full test suite per wave, max 3 fix attempts, then "wave stuck" playbook.
- **Pipeline state tracking** — `.athena-state.json` survives context compression; atomic write-to-temp-then-rename; corruption auto-backed-up and reset.
- **Scientific debugging** — hypotheses tracked, evidence required, no guess-and-check.
- **Enforced TDD** — test must fail before implementing, pass before refactoring.
- **Recovery playbooks** — actionable next steps when gates fail.
- **Pause/resume/reset** — disable Athena temporarily, re-enable without losing state.

## Install

### Claude Code

```bash
claude plugin marketplace add bencrooks-dev/athena
claude plugin install athena
```

Then install the auto-trigger hooks (recommended):

```bash
node hooks/install.cjs
```

This wires three hooks into `~/.claude/settings.json`:
- **SessionStart** — injects `athena-init` as additionalContext at session boot (the strongest enforcement vector)
- **PostToolUse** — nudges toward the right skill after tests pass, review feedback, merge conflicts, new source files, plan reads, and edit bursts
- **PreToolUse** — backs up `athena-init`'s "check before acting" rule on action tools (Edit/Write/Bash)

All three hooks respect `/athena-pause` — they exit early when Athena is paused.

Declarative alternative: Claude Code also reads `hooks/hooks.json` from the plugin root, which wires the same three hooks via `${CLAUDE_PLUGIN_ROOT}`.

### Cursor

```bash
git clone https://github.com/bencrooks-dev/athena.git ~/.cursor/athena
mkdir -p ~/.cursor/skills
ln -s ~/.cursor/athena/skills ~/.cursor/skills/athena
```

Restart Cursor. Skills are discovered via SKILL.md frontmatter; `hooks/hooks-cursor.json` wires SessionStart, PreToolUse, and PostToolUse. Full Windows/PowerShell instructions, update, and uninstall: see [`docs/platforms/cursor.md`](docs/platforms/cursor.md).

### Codex (CLI and App)

```bash
git clone https://github.com/bencrooks-dev/athena.git ~/.codex/athena
mkdir -p ~/.agents/skills
ln -s ~/.codex/athena/skills ~/.agents/skills/athena
```

Enable multi-agent support in `~/.codex/config.toml` so Athena's build flow can dispatch subagents:

```toml
[features]
multi_agent = true
```

Full reference: [`docs/platforms/codex.md`](docs/platforms/codex.md). Tool-name mapping: `skills/athena-init/references/codex-tools.md`.

### Gemini CLI

Gemini reads `gemini-extension.json` at the repo root, which points at `GEMINI.md` as the session-load context file. Activate `athena-init` first via `activate_skill`; subsequent skills load on demand.

See `skills/athena-init/references/gemini-tools.md` for the tool-name mapping (`@generalist` for subagent dispatch).

### OpenCode

Add Athena to the `plugin` array in your `opencode.json`:

```json
{
  "plugin": ["athena@git+https://github.com/bencrooks-dev/athena.git"]
}
```

Restart OpenCode. The plugin (`.opencode/plugins/athena.js`) auto-registers the skills directory and injects `athena-init` as the session bootstrap context. See `.opencode/INSTALL.md` for details.

### GitHub Copilot CLI

Copilot CLI auto-loads `AGENTS.md`. See `skills/athena-init/references/copilot-tools.md` for the tool-name mapping (`task` for subagent dispatch, async shells for long-running test suites).

## Commands

### `/athena` — Smart Router

Detects what you need from natural language and routes to the right workflow. Just describe what you're doing:

- "I want to build a..." → routes to `/athena-brainstorm`
- "plan out the auth system" → routes to `/athena-plan`
- "build it" → routes to `/athena-build`
- "this is broken" → routes to `/athena-debug`
- "review the code" → routes to `/athena-review`
- "add tests" → routes to `/athena-tdd`
- "I think it's done" → routes to `/athena-verify`
- "the reviewer said..." → routes to `/athena-receive-review`
- "let's ship" → routes to `/athena-ship`
- "merge it" / "create a PR" → routes to `/athena-finish`
- "I need an isolated branch" → routes to `/athena-worktree`
- "create a new skill" → routes to `/athena-forge`
- "pause athena" → routes to `/athena-pause`
- "resume athena" → routes to `/athena-resume`

**State-aware:** If `.athena-state.json` exists, the router uses pipeline phase to inform routing (e.g., routes to `/athena-build` when a plan exists, or to `/athena-ship` when build is complete).

### `/athena-brainstorm` — Designer

Scale-aware idea exploration. Turns ideas into validated designs through focused conversation:

- **Tiny tasks** (config change) → 1 question, verbal approval, done in 2 minutes
- **Small tasks** (new function) → 2-3 questions, verbal design
- **Medium tasks** (new module) → 3-5 questions, written spec saved to file
- **Large tasks** (new system) → full exploration, decomposition, sectioned spec

Hard gate: no code until design is approved. But the design scales to the task — no 500-word spec for a config change.

### `/athena-plan` — Architect

Explores requirements, proposes approaches, and generates structured plans with:

- **Wave-based task structure** — which tasks are parallel vs sequential
- **Dependency graphs** — which tasks block which
- **Complete code in every step** — no placeholders
- **Plan IDs and commit tracing** — every commit links back to its plan and task (`[plan:feature-name] [wave:1/task:2]`)
- **Version management** — replanning archives old versions with `-vN` suffixes
- **Built to feed `/athena-build`** — the plan format is designed for automated execution

### `/athena-build` — Executor

Executes plans using the coordinator pattern:

```
Wave 1 ──→ [Agent A] ──→ Synthesize ──→ Verify ──→ Wave 2
           [Agent B] ──↗                   ↓
           [Agent C] ──↗              Tests pass?
                                      No → Fix → Re-verify
                                      Yes → Next wave
```

- Parallel agents for independent tasks within each wave
- Synthesis step reviews all results for integration issues
- Verification gate: tests must pass before next wave
- Maximum 3 fix attempts per wave, then escalates to you
- **Agent timeout handling** — if an agent doesn't respond in 5 minutes, retries with simplified scope, then splits the task
- **Pipeline state tracking** — updates `.athena-state.json` after each wave (survives context compression)
- **Recovery playbooks** — actionable next steps for stuck waves, blocked agents, agent timeouts, state corruption, and context compression

### `/athena-debug` — Investigator

Scientific method debugging:

```
Observe → Hypothesize → Predict → Test → Conclude → Fix → Verify
```

- 2-3 ranked hypotheses with evidence
- Predictions tested experimentally before acting
- Checkpoints before fixes (rollback if fix fails)
- Anti-patterns blocked: no shotgun debugging, no cargo cult fixes
- **Recovery playbooks** — guidance for all-hypotheses-rejected, fix-causes-regression, and flaky-bug scenarios
- **State update** — records debug outcome in `.athena-state.json` (clears `build-stuck` on success)

### `/athena-review` — Auditor

Two-pass review (order matters):

**Pass 1 — Spec Compliance:** Did we build what was asked?
```
[DONE]    User authentication
[DONE]    Password hashing
[MISSING] Rate limiting — not found in codebase
```
Fix all MISSING items before Pass 2.

**Pass 2 — Code Quality:** Is it built well?
```
[CRITICAL] src/auth.js:42 — SQL injection in query
[IMPORTANT] src/auth.js:78 — Missing test for error path
```

### `/athena-tdd` — Test Driver

Enforced red-green-refactor with gates:

| Phase | Gate |
|-------|------|
| RED | Write test → must FAIL |
| GREEN | Write code → test must PASS |
| REFACTOR | Clean up → all tests must still PASS |

Cannot proceed to GREEN without a failing test. Cannot refactor without passing tests. No shortcuts.

### `/athena-verify` — Gatekeeper

Standalone mid-work verification — fires before you claim anything is done, not just at ship time:

```
Verification
════════════
[PASS] Tests: 24/24 passing — full suite output shown
[PASS] Bug fixed — reproduction case no longer fails
[FAIL] Feature works — edge case returns wrong result

Verdict: NOT VERIFIED ✗
```

Includes regression verification protocol: fix → pass → revert → fail → restore → pass. Records results in `.athena-state.json` so other skills know verification ran.

### `/athena-receive-review` — Responder

Handles incoming code review feedback with technical rigor — not performative agreement:

```
Feedback Response
═════════════════
1. [ACCEPT] src/auth.js:42 — Valid: SQL injection, implementing fix
2. [REJECT] src/auth.js:78 — Incorrect: reviewer missed the null check on line 76
3. [DISCUSS] src/utils.js:15 — Subjective: codebase uses pattern Y, not X
4. [CLARIFY] src/api.js:90 — "Doesn't look right" — what specifically?
```

Verifies each suggestion before implementing. Pushes back on incorrect feedback with evidence. Detects performative agreement patterns in its own responses.

### `/athena-ship` — Launcher

Pre-ship verification gate:

```
Ship Checklist
══════════════
[PASS] Tests: 24/24 passing
[PASS] Clean working directory
[PASS] Branch up to date
[WARN] 1 console.log in src/utils.js:42
[PASS] Plan: 5/5 tasks complete

Result: READY TO SHIP
```

Checks pipeline state before running — warns if build was stuck or Athena is paused. Then choose: create PR, merge locally, push only, or abort.

### `/athena-finish` — Closer

Completes development branches after ship verification passes:

```
Branch ready. What would you like to do?

1. Merge to main locally
2. Push and create a Pull Request
3. Keep branch as-is (handle later)
4. Discard this work
```

Pipeline-aware — trusts `/athena-ship`'s verification gates, won't re-run checks. Handles worktree cleanup automatically.

### `/athena-worktree` — Isolator

Creates isolated git worktrees for parallel development:

- **Smart defaults** — uses `.worktrees/` by default, no questions needed
- **Safety checks** — verifies gitignore (including `.athena-state.json`), runs baseline tests
- **Auto-setup** — detects project type, installs dependencies
- **Cross-platform** — works on Windows and Unix
- **Pipeline integration** — `/athena-finish` cleans up worktrees automatically

### `/athena-forge` — Skill Smith

Creates and refines Claude Code skills using TDD:

```
RED    — Run pressure scenarios without skill, document failures
GREEN  — Write minimal skill addressing those specific failures
REFACTOR — Close loopholes, add rationalization table, re-test
```

Includes the exact Athena SKILL.md template, frontmatter rules, style guide, and quality checklist. One skill at a time — deploy and test before writing the next.

### `/athena-canvas` — Visualizer

Zero-dependency visual brainstorming. Creates self-contained HTML files during `/athena-brainstorm` for mockups, wireframes, and layout comparisons:

- **No server required** — just HTML files the user opens in their browser
- **Dark theme, interactive** — click-to-select options, responsive layout
- **Per-question decision** — only used when visuals help, not every question
- **Fully offline** — no CDN, no network, works anywhere

### `/athena-pause` — Circuit Breaker

Temporarily disables all Athena workflow enforcement:

- Hooks stop firing, routing stops, gates stop blocking
- Pipeline state is preserved — nothing is lost
- Resume with `/athena-resume` when ready
- Use for quick ad-hoc work that doesn't need ceremony

### `/athena-resume` — Restore

Re-enables Athena after a pause:

- Reports how long Athena was paused
- Shows current pipeline state (so you know where you left off)
- Suggests next action based on phase (e.g., "build completed — run `/athena-ship`")
- All routing, gates, and hooks reactivate immediately

### `/athena-init` — Guardian

Auto-activation bootstrapper that ensures Athena skills are considered before every action:

- Routes through `/athena` on every user message
- Rationalization table blocks common excuses for skipping skill checks
- Backed by PreToolUse hook for enforcement that survives context compression
- State-aware — respects paused state, reads pipeline phase

## Pipeline State

Athena tracks pipeline state in `.athena-state.json` at the project root. This file:

- **Survives context compression** — skills read it to reconstruct where they are mid-session
- **Enables state-aware routing** — the router knows whether you're mid-build, post-verify, or stuck
- **Prevents redundant work** — `/athena-ship` knows when `/athena-verify` already ran
- **Supports pause/resume** — state is preserved across pauses

```json
{
  "phase": "build-complete",
  "plan": "docs/plans/2025-01-15-user-auth-flow.md",
  "planId": "plan:user-auth-flow",
  "wave": { "current": 3, "total": 3 },
  "tasks": { "completed": 8, "total": 8 },
  "lastVerification": { "timestamp": "2025-01-15T10:30:00Z", "result": "PASS", "tests": 24 },
  "paused": false
}
```

Add `.athena-state.json`, `.athena-edit-burst.json`, and `.athena-state.*.json` to your `.gitignore` — these are internal state files.

### State Recovery

If `.athena-state.json` becomes corrupt (e.g., partial write due to crash):
- The state helper auto-detects corruption, backs up to `.athena-state.corrupt.json`, and returns `{}`
- All writes use atomic temp-file-then-rename to prevent corruption
- To manually reset: run `/athena-pause` and request a state reset — backs up current state and starts fresh
- To restore from backup: copy `.athena-state.pre-reset.json` back to `.athena-state.json`

### Configurable Settings

You can tune Athena behavior via fields in `.athena-state.json`:

| Field | Default | Description |
|-------|---------|-------------|
| `editBurstThreshold` | 15 | Number of edits without a commit before nudge fires |

## Multi-Platform Support

Athena works on all major AI coding tools:

| Platform | Install Guide |
|----------|---------------|
| **Claude Code** | `claude plugin marketplace add bencrooks-dev/athena` |
| **Cursor** | [docs/platforms/cursor.md](docs/platforms/cursor.md) |
| **Codex** | [docs/platforms/codex.md](docs/platforms/codex.md) |
| **Gemini CLI** | [docs/platforms/gemini.md](docs/platforms/gemini.md) |
| **OpenCode** | [docs/platforms/opencode.md](docs/platforms/opencode.md) |

All guides include Windows + macOS/Linux instructions and tool mapping tables.

## Agent Fleet

Athena ships dedicated agent definitions for parallel execution — not just "use the Agent tool", but purpose-built agents with specific roles, tools, and output formats:

| Agent | Role | Dispatched By |
|-------|------|---------------|
| `athena-worker` | Writes code (plan tasks or freeform), tests, commits | `/athena-build`, direct dispatch |
| `athena-code-reviewer` | Four-pass review (spec, correctness, security, quality) | `/athena-build` (between waves), `/athena-review`, `/athena-ship` |
| `athena-debugger` | Investigates and fixes bugs using scientific method | `/athena-debug`, `/athena-build` (fix attempts) |
| `athena-verifier` | Runs test suite, reports with evidence | `/athena-build`, `/athena-ship` |
| `athena-researcher` | Explores codebase, maps architecture | `/athena-plan`, `/athena-brainstorm` |
| `athena-scout` | Fast parallel search, finds files/patterns | Any skill needing broad search |

Build execution dispatches workers in parallel per wave, with reviewer and verifier gates between waves:

```
Wave N
  ├── athena-workers (parallel, one per task)
  ├── athena-code-reviewer (four-pass audit)
  ├── athena-verifier (runs full test suite)
  └── All green? → Wave N+1
```

## Architecture

Athena is a skills plugin with auto-trigger hooks and persistent pipeline state. Skills are SKILL.md files, agents are markdown definitions in `agents/`. Install is instant, runs everywhere.

### Auto-Trigger Hooks

Athena includes two hook types that automatically enforce workflows:

**PostToolUse** (6 triggers):
- After tests pass → reminds to run `/athena-verify` before claiming done
- When PR review feedback detected → nudges toward `/athena-receive-review`
- When merge conflicts detected → nudges toward `/athena-debug`
- When new source file created → nudges toward `/athena-tdd`
- When plan file read → nudges toward `/athena-build`
- After 15+ edits without a commit → nudges verification (configurable via `editBurstThreshold`)

**PreToolUse** (init enforcement):
- Before action tools (Edit/Write/Bash) → checks that an Athena skill was considered
- Rate-limited to once per 60 seconds to avoid noise
- Skips exploration commands (git status, ls, etc.)

Both hooks respect `/athena-pause` — they exit early when Athena is paused.

Install hooks: `node hooks/install.cjs`

The installer backs up your existing `settings.json` before modifying it and preserves any non-Athena hooks already configured.

## Engram Integration

If [Engram](https://github.com/bencrooks-dev/engram) (memory optimization plugin) is installed, Athena uses it to create a feedback loop: workflows produce learnings, learnings improve future workflows.

### Session Logging (workflows → memory)

Three Athena skills log structured topics to Engram after completion:

| Skill | What Gets Logged |
|-------|-----------------|
| `/athena-debug` | Bug category, root cause pattern, affected component |
| `/athena-build` | Feature area, technology patterns, architectural decisions |
| `/athena-receive-review` | Review feedback themes, recurring corrections |

This feeds Engram's `engram_session_coverage` analysis — over time it surfaces patterns like "you've debugged auth 4 times but have no memory about common auth failures." Non-obvious root causes and recurring corrections also nudge toward `/engram-suggest` for memory capture.

### Memory-Aware Planning (memory → workflows)

`/athena-plan` calls `engram_simulate_relevance` during Phase 1 (context gathering) to check what memories exist for the task:

- **`feedback` memories are critical** — past corrections override default planning instincts. If a feedback memory says "don't mock the database", the planner won't propose mocked DB tests.
- **`user` memories** inform how to pitch proposals (simple vs complex preferences)
- **`project`/`reference` memories** provide context about ongoing work and external resources

Low-confidence matches are silently ignored. High-confidence matches are factored into proposals without announcement.

Both integrations are conditional — they only fire if Engram is installed.

## License

MIT
