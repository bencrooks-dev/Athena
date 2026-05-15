---
name: athena-verify
description: Standalone verification gate — runs before claiming work is complete, fixed, or passing. Evidence before assertions, always. Use mid-conversation when about to say "done" or "fixed", not just at ship time.
---

# Athena Verify — Gatekeeper

Standalone verification that fires **before you claim work is complete** — mid-conversation, not just at ship time. This is the difference between "I think it works" and "here's proof it works."

## When This Fires

You MUST invoke this skill before:
- Saying "done", "fixed", "complete", "working", "passing", or "ready"
- Committing code after a fix or feature
- Telling the user a task is finished
- Moving to the next task in a plan

You do NOT need this for:
- Reading files, exploring code, gathering context
- Asking clarifying questions
- Mid-implementation progress updates ("halfway through")

## Verification Protocol

### Step 1: Identify Claims

What are you about to claim? Write them out explicitly:
- "Tests pass" → which tests? All or specific?
- "Bug is fixed" → what was the bug? What proves it's gone?
- "Feature works" → what behavior proves it works?
- "Code is correct" → what would incorrect look like?

### Step 2: Gather Evidence

For EACH claim, run the command that proves it:

| Claim | Evidence Required |
|-------|-------------------|
| Tests pass | Run full test suite, show output with pass count |
| Bug is fixed | Run the reproduction case, show it no longer fails |
| Feature works | Run the feature's happy path AND an edge case |
| Code compiles/lints | Run the build/lint command, show clean output |
| No regressions | Run full test suite, not just the new tests |

**Rules for evidence:**
- Run commands FRESH — never cite cached results or earlier output
- Show the FULL output — don't summarize "tests pass" without the actual output
- Check exit codes — a command that prints errors but exits 0 is not passing
- If no automated test exists, tell the user what to verify manually

### Step 3: Verify Evidence

Read the output carefully. Check for:
- Hidden failures (warnings treated as passes)
- Partial passes ("23/24 tests pass" is NOT passing)
- Flaky results (if something passed but looked suspicious, run it again)
- Wrong test suite (did you run the right tests for what changed?)

### Step 4: Record & Report

Update `.athena-state.json` using the **merge pattern** — read existing state, deep-merge only `lastVerification`, write back. Never replace the entire file. See `hooks/athena-state.cjs` for reference.

```json
{
  "lastVerification": {
    "timestamp": "2025-01-15T10:30:00Z",
    "result": "PASS",
    "claims": ["Tests pass (24/24)", "Bug fix verified with regression protocol"],
    "tests": 24
  }
}
```

Then report:

```
Verification
════════════
[PASS] <claim> — <evidence summary>
[PASS] <claim> — <evidence summary>
[FAIL] <claim> — <what went wrong>

Verdict: VERIFIED ✓ / NOT VERIFIED ✗
```

Only after ALL claims show PASS may you tell the user the work is done.

## Regression Verification (for bug fixes)

When fixing a bug, standard verification isn't enough. Use the regression protocol:

1. **Write the fix**
2. **Run tests** → must PASS
3. **Revert the fix** → run tests → must FAIL (proves the test catches the bug)
4. **Restore the fix** → run tests → must PASS
5. Now you have proof the fix works AND the test detects its absence

Skip this only if the user explicitly says to.

## The Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I just ran the tests a minute ago" | Code changed since then. Run again. |
| "It's obvious the fix works" | Obvious bugs ship every day. Verify. |
| "It's just a config change" | Config changes break prod more than code changes. Verify. |
| "The user can test it" | Your job is evidence, not delegation. Verify what you can. |
| "There aren't any tests for this" | Then say so explicitly — don't pretend it's verified. |
| "I already verified in my head" | Your head doesn't run tests. The terminal does. |

## Rules

- **Evidence before assertions** — never say "done" without proof
- **Fresh runs only** — cached results are stale results
- **Full output** — don't hide failures behind summaries
- **Explicit unknowns** — if you can't verify something, say so clearly
- **This is NOT athena-ship** — ship is for pre-merge/pre-PR. This is for mid-work verification. Both matter, at different times.
