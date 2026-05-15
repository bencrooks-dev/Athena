---
name: athena-pause
description: Use when the user wants to temporarily disable Athena workflow routing and gates — pauses all auto-triggers and skill checks until /athena-resume is invoked
---

# Athena Pause — Circuit Breaker

Temporarily disables all Athena workflow enforcement. Hooks stop firing, athena-init stops routing, gates stop blocking. Use when the user needs to do quick ad-hoc work without ceremony.

## Process

### Step 1: Confirm

Ask once:
> "Pausing Athena — skill routing, verification gates, and auto-triggers will be disabled. Resume with `/athena-resume`. Pause now?"

If the user confirms (or invoked `/athena-pause` directly), proceed.

### Step 2: Update State

Write to `.athena-state.json` in the project root:

```json
{
  "paused": true,
  "pausedAt": "2025-01-15T10:30:00Z",
  "pausedBy": "user"
}
```

Preserve any existing fields in the state file — only set `paused`, `pausedAt`, and `pausedBy`.

### Step 3: Report

```
Athena PAUSED
══════════════
Disabled: skill routing, verification gates, auto-trigger hooks
Resume:   /athena-resume
```

## What Gets Disabled

- **athena-init** — stops checking for matching skills before responses
- **Auto-trigger hooks** — PostToolUse and PreToolUse hooks exit early when paused
- **athena-ship gates** — warns about paused state but doesn't hard-block
- **Edit burst tracking** — stops counting edits

## What Stays Active

- **Skills invoked directly** — if the user explicitly calls `/athena-verify`, it still works
- **State file** — `.athena-state.json` continues tracking (so resume knows where you left off)
- **Git operations** — nothing changes about git behavior

## State Reset

If the user asks to reset Athena state (e.g., "reset athena", "clear athena state", "start fresh"), or if state appears wedged (stuck in a phase that no longer applies):

1. **Confirm:** "This will clear all pipeline state (phase, wave progress, verification history). Proceed?"
2. **Back up** the current state to `.athena-state.pre-reset.json`
3. **Write** a fresh `.athena-state.json` with only `{}` (or `{ "paused": true }` if also pausing)
4. **Delete** `.athena-edit-burst.json` if it exists
5. **Report:**
   ```
   Athena State RESET
   ════════════════════
   Previous state backed up to .athena-state.pre-reset.json
   Pipeline:  cleared
   Phase:     none
   Ready for: /athena-plan or /athena-brainstorm
   ```

## Rules

- **Always confirm before pausing** — even if the user seems sure
- **Never auto-pause** — only the user can trigger this
- **Preserve existing state** — don't wipe pipeline progress when pausing (unless explicit reset requested)
- **Remind about resume** — always mention `/athena-resume` in the confirmation
