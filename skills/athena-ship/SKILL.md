---
name: athena-ship
description: Pre-ship verification and merge preparation — runs full test suite, checks for uncommitted changes, validates branch state, creates PR or merges. Use when work is complete and ready to ship.
---

# Athena Ship — Launcher

Pre-ship verification gate. Nothing ships without passing every check.

## Pipeline State Check

Before running the checklist, read `.athena-state.json` if it exists:
- If the file exists but contains invalid JSON, WARN: "Pipeline state file is corrupt. Continuing with ship checks, but pipeline tracking may be incomplete. Run `/athena-pause` with a state reset after shipping."
- If `lastVerification.result === "PASS"` and timestamp is within the last 10 minutes, note it but still re-verify (ship is the final gate — trust but verify)
- If `phase === "build-stuck"`, WARN: "Build was stuck at wave [N]. Are you sure you want to ship incomplete work?"
- If `paused === true`, WARN: "Athena is paused. Resume with /athena-resume before shipping."

## Pre-Ship Checklist

Run these checks in order. Stop at first FAIL.

### 1. Tests Pass
Run the project's full test suite. Find the test command from:
- `package.json` scripts (`npm test`)
- `pytest.ini` / `setup.cfg` / `pyproject.toml`
- `Makefile`
- Ask the user if unclear

**GATE:** All tests must pass. If any fail → STOP. Tell the user which tests failed. Do not proceed.

### 2. Clean Working Directory
Run `git status`. Check for:
- Uncommitted changes → WARNING: "You have uncommitted changes. Commit or stash before shipping."
- Untracked files that should be committed → WARNING: list them

### 3. Branch State
- What branch are we on?
- Is it up to date with the remote? (`git fetch && git status`)
- If behind remote → WARNING: "Branch is behind remote. Pull before shipping."
- If behind base branch (main/master) → WARNING: "Branch is behind base. Consider rebasing."

### 4. No Debug Artifacts
Search changed files for:
- `console.log` / `print()` debugging statements (that weren't there before)
- `TODO` / `FIXME` / `HACK` comments in newly added code
- Commented-out code blocks
- WARNING for each found (not blocking, but flag it)

### 5. Plan Completion (if plan exists)
If a plan file exists in `docs/plans/`:
- Check all tasks are marked complete (`- [x]`)
- FAIL if any tasks are incomplete

### 6. Summary

```
Ship Checklist
══════════════
[PASS] Tests: 24/24 passing
[PASS] Clean working directory
[PASS] Branch up to date
[WARN] 1 console.log in src/utils.js:42
[PASS] Plan: 5/5 tasks complete

Result: READY TO SHIP (1 warning)
```

After the checklist completes, update `.athena-state.json` using the **merge pattern** — read existing, deep-merge these fields, write back. Never replace the entire file. See `hooks/athena-state.cjs` for reference.
```json
{
  "phase": "ship-verified",
  "lastVerification": { "timestamp": "...", "result": "PASS", "tests": 24 },
  "shipChecklist": { "tests": "PASS", "clean": "PASS", "branch": "PASS", "artifacts": "WARN", "plan": "PASS" }
}
```

## Ship Options

If all checks pass (warnings are OK), present:

```
Ready to ship. Choose:
  1. Create PR → I'll draft a PR with summary of changes
  2. Merge → Merge directly into base branch (if on a feature branch)
  3. Push only → Push to remote, no PR
  4. Abort → Don't ship yet
```

### If PR chosen:
1. Push branch to remote if not already pushed
2. Generate PR title (short, <70 chars) and body:
   - Summary: 2-3 bullet points of what changed
   - Test plan: how to verify
   - Link to plan doc if one exists
3. Create the PR using `gh pr create` or the GitHub MCP tool

### If Merge chosen:
1. Check the current branch — if on main/master, WARN: "You're on the main branch. Merging into main from main is a no-op. Did you mean to create a PR instead?" and stop.
2. Identify the base branch (main or master)
3. Merge the current feature branch into the base branch (`git checkout <base> && git merge <feature>`)
4. Push the base branch to remote
5. Report the result

### If Push chosen:
1. Push to remote
2. Report the push result

## The Verification Gate

**Evidence before claims, always.** Every check must produce visible output. "Should be fine" is not verification.

For each check:
1. **IDENTIFY** — what command proves this claim?
2. **RUN** — execute the full command fresh (not from cache/memory)
3. **READ** — read full output, check exit code, count failures
4. **VERIFY** — output confirms the claim
5. **ONLY THEN** — mark PASS or FAIL

Skipping any step = making claims without evidence.

## Regression Verification

When fixing a bug as part of shipping:
1. Write the fix
2. Run tests → PASS
3. **Revert the fix** → run tests → MUST FAIL (proves the test catches the bug)
4. **Restore the fix** → run tests → PASS
5. Now you have proof the fix works AND the test detects its absence

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "Tests were failing before I started" | Then fix them or document the known failures. Don't ship on top of broken tests. |
| "It's just a small change" | Small changes cause big outages. Run the checks. |
| "I already ran tests earlier" | Earlier ≠ now. Code changed since then. Run again. |
| "The warnings are fine" | Read each warning. Decide consciously. Don't dismiss by reflex. |
| "I'll fix the TODO after shipping" | TODOs after shipping = TODOs forever. Fix now or remove. |

## Rules

- **Tests MUST pass** — no exceptions, no "they were failing before"
- **Never force push** — always regular push. If it fails, tell the user why.
- **Never push to main/master directly** — warn if on main branch
- **Warnings don't block** — only FAIL blocks shipping
- **Fresh verification only** — never trust cached results or previous runs
- **Evidence before claims** — show the output, then make the claim
