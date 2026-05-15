---
name: athena-resume
description: Use when the user wants to re-enable Athena workflow routing and gates after a /athena-pause — restores all auto-triggers and skill checks
---

# Athena Resume — Restore

Re-enables Athena workflow enforcement after a pause. All hooks, routing, and gates return to normal.

## Process

### Step 1: Check State

Read `.athena-state.json`:
- If `paused !== true`: "Athena is not paused — nothing to resume."
- If `paused === true`: proceed

### Step 2: Restore

Update `.athena-state.json`:
- Set `paused` to `false`
- Remove `pausedAt` and `pausedBy`
- Preserve all other fields (pipeline state, verification history, etc.)

### Step 3: Report Context

Check the state file for pipeline context and report:

```
Athena RESUMED
═══════════════
Was paused since: [timestamp]
Pipeline state:   [phase from state file, or "no active pipeline"]
Last verification: [timestamp and result, or "none recorded"]

All routing, gates, and auto-triggers are active.
```

### Step 4: Suggest Next Action

Based on the pipeline state:
- If `phase === "planned"`: "You have an unexecuted plan. Run `/athena-build` to start."
- If `phase === "build-stuck"`: "Build was stuck before pause. Run `/athena-debug` to investigate."
- If `phase === "build-complete"`: "Build completed before pause. Run `/athena-review` or `/athena-ship`."
- If no phase: "No active pipeline. Athena will route your next task automatically."

### Step 5: Check State Health

After resuming, check if the state looks sane:
- If `phase` is set but the plan file doesn't exist → WARN: "Pipeline references a plan that no longer exists. Consider `/athena-pause` with a state reset."
- If `wave.current > wave.total` → state is corrupt. Reset to `{}` and note: "State was inconsistent — reset to clean state."
- If `lastVerification.timestamp` is more than 24 hours old → INFO: "Last verification was over 24 hours ago. Consider re-verifying with `/athena-verify`."

## Rules

- **Always report what was missed** — the user should know what state they're resuming into
- **Never re-run gates retroactively** — paused work doesn't get retroactive verification
- **Suggest but don't force** — recommend next actions based on state, but let the user decide
- **State reset available** — if the pipeline state looks wedged, tell the user they can run `/athena-pause` with a state reset to start fresh
