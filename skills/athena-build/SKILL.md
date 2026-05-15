---
name: athena-build
description: Execute an implementation plan using the coordinator pattern — per task, dispatch implementer → spec-reviewer → code-quality-reviewer; per wave, synthesize and verify. Parallel where independent, sequential where dependent. Use when you have a plan ready to execute.
---

# Athena Build — Executor

You are a build coordinator. You execute implementation plans using the coordinator pattern:

```
Per task:   implementer → spec-reviewer → code-quality-reviewer
Per wave:   gather task reports → synthesize → verify (full test suite)
```

Independent tasks within a wave run **in parallel** (each task's full trio runs concurrently). Dependent tasks run sequentially after their prerequisites.

## Continuous Execution — Do Not Check In Between Tasks

Once the user says "build" (or `/athena-build` is invoked), execute the plan end-to-end without pausing for "should I continue?" prompts between tasks or waves. The user asked you to execute the plan; execute it.

**The only legitimate stop conditions:**

1. `BLOCKED` status from a worker that you cannot resolve via re-dispatch.
2. 3 failed fix attempts on the same wave (see Recovery Playbooks).
3. Genuine ambiguity that prevents any forward motion.
4. All tasks complete.

Progress summaries between tasks are not stop points — they're noise. Move to the next dispatch. If the user wants you to pause, they will say so.

## Finding the Plan

1. Check if a plan was just created in this conversation (from `/athena-plan`)
2. If not, look for plan files in `docs/plans/` — use the most recent by filename date prefix (`YYYY-MM-DD-`)
3. If multiple plans share the same date, prefer the one without a `-v2`/`-v3` suffix (latest version)
4. If no plan exists, tell the user: "No plan found. Run `/athena-plan` first to design the implementation."

## Execution Process

### Per Task — Three-Stage Trio

For every task in a wave, run these three stages **in sequence**, on the same task:

```
1. Dispatch implementer (athena-worker, with implementer-prompt.md)
       ↓ task report with Status
2. Status routing (see Status Protocol below)
       ↓ if DONE / DONE_WITH_CONCERNS → continue
3. Dispatch spec-reviewer (athena-code-reviewer, with spec-reviewer-prompt.md)
       ↓ verdict: PASS | FIXES_NEEDED
       ↓ if FIXES_NEEDED → re-dispatch implementer to fix spec gaps → re-review
       ↓ if PASS → continue
4. Dispatch code-quality-reviewer (athena-code-reviewer, with code-quality-reviewer-prompt.md)
       ↓ verdict: APPROVED | FIXES_NEEDED
       ↓ if FIXES_NEEDED → re-dispatch implementer to fix → re-review
       ↓ if APPROVED → task done
```

**Why per-task review** (vs only wave-level review): catches gaps while the implementer's context is fresh and the diff is small. Wave-level review is still run after the wave for integration concerns, but it's not the primary feedback loop.

**Re-review caps:** spec-reviewer and code-quality-reviewer each get up to 2 fix attempts. If still failing after 2, escalate the task to `BLOCKED` and apply the Recovery Playbooks.

### Per Wave — Synthesize and Verify

After every task in the wave has completed its trio:

**1. Synthesize**
- Review what the wave built as a whole.
- Check: do the pieces integrate correctly?
- Check: are there conflicts between parallel changes that the per-task reviewers couldn't see?
- If integration issues exist, dispatch a `athena-worker` to resolve them, then re-verify.

**2. Verify (athena-verifier)**
- Run the verification step from the plan (usually the full test suite).
- All tests pass → next wave.
- Tests fail → diagnose which task broke things, dispatch fix worker → re-verify.
- **Max 3 fix attempts per wave.** After 3, stop and trigger the "Wave Stuck" recovery playbook.

**3. Update State** — merge pattern (see `hooks/athena-state.cjs` reference impl):

1. Read existing `.athena-state.json` (or `{}` if missing)
2. Deep-merge only your fields into the existing object
3. Write the merged result back — **never replace the entire file**

Merge these fields:
```json
{
  "phase": "build",
  "plan": "docs/plans/YYYY-MM-DD-feature-name.md",
  "wave": { "current": 2, "total": 3 },
  "tasks": { "completed": 5, "total": 8 },
  "lastVerification": { "timestamp": "2025-01-15T10:30:00Z", "result": "PASS", "tests": 24 },
  "paused": false
}
```

**4. Report (single-line, no prompts)**

```
Wave [n] complete: [tasks completed] tasks, [tests] tests passing → starting wave [n+1]
```

### After All Waves

1. Run final verification from the plan.
2. Dispatch a final `athena-code-reviewer` for the entire implementation (full four-pass review across all wave outputs).
3. Produce a summary:

```
Athena Build Complete
══════════════════════
Plan:       docs/plans/<filename>.md
Waves:      [n] waves executed
Tasks:      [n] tasks completed
Tests:      [n] passing
Files:      [n] created, [n] modified
Commits:    [n] commits

Ready for: /athena-review or /athena-ship
```

4. **Log to Engram** (if available): Call `engram_log_session` to record the build context:
```
engram_log_session({
  topics: [
    "<feature area> implementation",
    "<tech/patterns used> (e.g., REST API, WebSocket, database migration)",
    "<key architectural decisions made during build>"
  ]
})
```
Extract topics from the plan and build outcome — focus on feature area and technology patterns, not individual file names.

5. **Merge** these fields into `.athena-state.json`:
```json
{
  "phase": "build-complete",
  "plan": "docs/plans/<filename>.md",
  "wave": { "current": 3, "total": 3 },
  "tasks": { "completed": 8, "total": 8 },
  "lastVerification": { "timestamp": "...", "result": "PASS", "tests": 24 }
}
```

## Status Protocol — Handler Logic

Every `athena-worker` returns exactly one of four statuses (see `agents/athena-worker.md`). Handle each:

### `DONE`
Proceed directly to spec-reviewer.

### `DONE_WITH_CONCERNS`
Read the concerns. Decide:
- **Correctness / scope concern** (e.g., "I had to assume X about Y") → address it before review: either provide the missing context and re-dispatch the worker, or note the concern in your synthesis for the wave-level reviewer.
- **Observation** (e.g., "this file is getting large", "consider extracting this") → record in your wave notes, proceed to spec-reviewer.

Never ignore a concern. The implementer surfaced it because the local context made them uncertain — that's a signal.

### `NEEDS_CONTEXT`
The worker can't proceed without information you didn't provide. Steps:
1. Read what they say they need.
2. If it's available (a referenced file, a related task's output, plan section they missed) — provide it and re-dispatch the same worker with same model.
3. If it's not available — escalate: ask the user, or dispatch a `athena-researcher` to find it, then re-dispatch.
4. Do NOT increase model strength on `NEEDS_CONTEXT` — that's a context problem, not a reasoning problem.

### `BLOCKED`
The worker reports the task cannot be completed as specified. Diagnose:
1. **Context problem in disguise** (worker says BLOCKED but really meant NEEDS_CONTEXT) → provide context, re-dispatch with same model.
2. **Reasoning problem** (task requires more capability than the worker's model) → re-dispatch with a more capable model (see Model Tier below).
3. **Task too large** → split it into 2-3 smaller pieces, dispatch each.
4. **Plan is wrong** → stop. Report to the user. Suggest `/athena-plan` to redesign this wave's tasks. Do NOT silently revise the plan yourself.

**Never** ignore a `BLOCKED`. **Never** force a same-model re-dispatch on `BLOCKED` without changing something.

## Model Tier Selection

Dispatch the **least powerful** model that can handle each role. This conserves cost and speeds the wave.

### Task complexity signals → model

| Signals | Model tier |
|---|---|
| 1-2 files, complete spec in plan, mechanical (CRUD, plumbing, boilerplate, renames) | **Cheap** (e.g., Haiku) |
| Multiple files, integration concerns, light judgment, ambiguity in plan | **Standard** (e.g., Sonnet) |
| Architecture, design judgment, broad codebase rewiring, reviewer roles, debugging hard failures | **Most capable** (e.g., Opus) |

### Per-role defaults

| Role | Default tier | Why |
|---|---|---|
| `athena-worker` (implementer) | **Cheap** for clear mechanical tasks; **Standard** for integration | Most plan tasks should be cheap if the plan is well-specified. |
| `athena-code-reviewer` (spec pass) | **Standard** | Reading code and matching to spec — light judgment. |
| `athena-code-reviewer` (quality pass) | **Standard** | Pattern matching against quality heuristics. |
| `athena-code-reviewer` (final wave/build pass) | **Most capable** | Full audit catches integration issues; worth the cost once at the end. |
| `athena-debugger` | **Most capable** | Hypothesis-driven debugging benefits most from reasoning. |
| `athena-verifier` | **Cheap** | Just runs commands and reports — no judgment required. |
| `athena-researcher` | **Standard** | Reads and summarizes — moderate judgment. |
| `athena-scout` | **Cheap** | Find-and-report only. |

**Escalation rule:** if a `BLOCKED` came back because the worker couldn't reason through the task, re-dispatch one tier up. If a `NEEDS_CONTEXT` came back, do NOT escalate the model — provide the missing context.

## Agent Fleet

Athena provides dedicated agents for each role. Use the Agent tool to dispatch them. The prompt files in this directory (`implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`) are the per-task templates; substitute the `{{PLACEHOLDERS}}` before dispatch.

### athena-worker (Implementer)
Dispatched per task with `implementer-prompt.md`. Reports with one of four status codes.

**Dispatch template (inline summary — use `implementer-prompt.md` for the full body):**
```
You are an athena-worker. Task: [name]
Plan: [path]    Wave: [N/total]    Task: [k/total]
Files: [list]
Steps:
[paste task steps verbatim from plan]
Test command: [command]
Commit message: [message]
Integration context: Other tasks in this wave are building [brief].
Report with one of: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED.
```

### athena-code-reviewer (Per-Task Spec Pass)
Dispatched after every successful implementer report. Uses `spec-reviewer-prompt.md`. Spec compliance only — no quality complaints.

### athena-code-reviewer (Per-Task Quality Pass)
Dispatched after spec pass returns PASS. Uses `code-quality-reviewer-prompt.md`. Passes 2-4 (correctness, security, quality).

### athena-code-reviewer (Wave/Final Pass)
Dispatched between waves (integration check) and after all waves (final audit). Full four-pass review.

**Dispatch template (final pass):**
```
You are an athena-code-reviewer. Final review for build.
Spec/Plan: [paste relevant requirements]
Files changed: [list across all waves]
Run all four passes: spec compliance, correctness, security, quality.
```

### athena-debugger (Fix Agent)
Dispatched when workers report failures the per-task review couldn't resolve, or wave verification finds regressions.

```
You are an athena-debugger. Investigate this failure from wave [N]:
Error: [message / failing test]
Context: [which task, what files changed]
Diagnose root cause, fix minimally, run full test suite.
```

### athena-verifier (Test Gate)
Dispatched after each wave and before shipping. Cheap model, just runs commands.

```
You are an athena-verifier. Verify wave [N]:
Test command: [command]
Previous wave results: [X passing, Y failing]
Run fresh, report with evidence. Flag any regressions.
```

### athena-researcher (Context Gathering)
Dispatched when a worker reports `NEEDS_CONTEXT` that requires codebase exploration to resolve.

```
You are an athena-researcher. Investigate:
Question: [what to find out]
Scope: [where to look]
Report architecture, key files, patterns, gaps.
```

### athena-scout (Fast Search)
Dispatched in batches for rapid parallel searches. Lightest agent — find and report.

```
You are an athena-scout. Find:
Query: [what to search for]
Scope: [where to look]
Report top matches with file:line locations.
```

## Wave Execution Diagram

```
Wave N
  │
  ├── Task k=1 ──→ implementer → [status?] → spec-rev → quality-rev → committed ─┐
  ├── Task k=2 ──→ implementer → [status?] → spec-rev → quality-rev → committed ─┤
  ├── Task k=3 ──→ implementer → [status?] → spec-rev → quality-rev → committed ─┤
  │   (parallel for independent tasks; sequential for dependents)                ↓
  ├── Wave synthesis (integration check across all task diffs)
  ├── athena-verifier (full test suite for the wave)
  │     │
  │     ├── PASS  → Wave N+1
  │     └── FAIL  → athena-debugger (max 3 attempts) → re-verify
  │                       └── 3 attempts exhausted → Wave Stuck playbook
```

## Recovery Playbooks

When things go wrong mid-pipeline, follow these playbooks instead of abandoning the build.

### Per-Task Review Stuck (2 Spec or Quality Re-Reviews Failed)

The implementer keeps producing diffs that fail review even after fixes.

1. **Stop the task** — do not loop more than 2 re-reviews.
2. **Re-dispatch the implementer with the next model tier up** (Standard → Most capable).
3. **Provide the reviewer's findings as part of the new prompt.**
4. **If still failing after the upgraded attempt:** mark the task `BLOCKED`, escalate to the user with the review history.

### After 3 Failed Wave Fix Attempts (Wave Stuck)

The wave has failed verification 3 times and automated fixes haven't worked.

1. **Stop the build** — do not attempt a 4th fix.
2. **Report the situation** with full context:
   ```
   Wave [N] STUCK — 3 fix attempts exhausted
   ═══════════════════════════════════════════
   Failing tests:  [list]
   Attempted fixes: [summary of each attempt and why it failed]
   Root cause:     [best understanding so far]

   Options:
     1. /athena-debug — Deep investigation of the root cause
     2. Replan — The plan may have a design flaw. Run /athena-plan to redesign this wave
     3. Skip wave — Mark tasks as blocked, proceed to next wave (if independent)
     4. Abort — Stop the build entirely, keep completed waves
   ```
3. **Merge `"phase": "build-stuck"`** + the failure details into `.athena-state.json`.
4. **Wait for user decision** — never auto-recover after 3 failures.

### Agent Timeout / No Response

1. **Wait up to 5 minutes** — complex tasks (large refactors, full test suites) can take time.
2. **If still no response after 5 minutes:** the agent is likely stuck.
3. **Cancel and retry once** with simplified scope.
4. **If retry hangs:** split the task into 2-3 smaller pieces, dispatch those instead.
5. **Report to user:** "Agent for task [N] timed out. I've split it and retrying."
6. **3 agents fail on the same task:** mark `BLOCKED`, escalate.

### Agent Reports `BLOCKED`

See **Status Protocol → BLOCKED** above for the four-way diagnosis (context vs reasoning vs size vs plan-flaw).

### State File Corruption

`.athena-state.json` is invalid JSON.

1. `readState()` returns `{}` on corrupt files and backs up to `.athena-state.corrupt.json`.
2. **Reconstruct from git:** `git log --oneline` to find completed tasks via plan-ID/wave/task suffixes in commit messages.
3. **Read the plan file** — confirm which tasks are committed.
4. **Write fresh state** with the reconstructed values.
5. **Resume from the last verified wave** — never skip verification you can't confirm.

### Context Compression Recovery

If the conversation context was compressed mid-build and wave state is unclear:

1. **Read `.athena-state.json`** — source of truth.
2. **Check `paused`** — if true, do not resume. Tell the user: "Athena is paused. Run `/athena-resume` first."
3. **Read the plan file** + `git log --oneline` to confirm what's already committed.
4. **Reconcile** state + git + plan to determine wave/task position.
5. **Resume from the last verified wave** — never skip verification because it "probably passed before compression."

## Rules

- **Continuous execution.** No "should I continue?" prompts between tasks or waves. Stop only on the four legitimate conditions.
- **Status protocol is enforced.** Every worker report must end with `DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED`. Reject reports that don't.
- **Per-task review is mandatory.** Spec-review every task; quality-review every task. Don't skip to wave-level review.
- **Never skip wave verification** — tests must pass before next wave.
- **Never proceed past a `BLOCKED`** — diagnose and re-dispatch, or escalate.
- **Never modify the plan** — execute what's written. If the plan is wrong, stop and tell the user.
- **Parallel when possible** — independent tasks (and their per-task trios) in the same wave MUST run in parallel.
- **Atomic commits** — each task gets its own commit, suffixed `[plan:<id>] [wave:<n>/task:<k>]`.
- **Model-tier discipline** — start at the cheapest tier that can handle the task; escalate only on `BLOCKED` for reasoning reasons.
- **Evidence-based verification** — `athena-verifier` must show test output, not just "tests pass".
