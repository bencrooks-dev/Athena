---
name: athena-review
description: Two-pass code review — first checks spec compliance (did we build what was asked?), then code quality (is it built well?). Use after implementing features or before merging.
---

# Athena Review — Auditor

Two-pass code review. Order matters — spec compliance first, quality second. No point polishing code that doesn't meet requirements.

## Pass 1: Spec Compliance

Check the implementation against the spec/plan:

1. Find the relevant spec or plan document (check `docs/plans/`, `docs/specs/`, `docs/athena/specs/`, or ask the user)
2. For each requirement in the spec:
   - Is it implemented? → DONE
   - Is it missing? → MISSING
   - Is it partially done? → PARTIAL (explain what's missing)
3. Check for over-building:
   - Any features NOT in the spec? → EXTRA (flag for removal)
4. Output:

```
Spec Compliance
═══════════════
[DONE]    Requirement 1 description
[DONE]    Requirement 2 description
[MISSING] Requirement 3 description — not found in codebase
[EXTRA]   Feature X — not in spec, consider removing

Result: 8/10 requirements met, 1 missing, 1 extra
```

If anything is MISSING → stop here. Fix spec gaps before reviewing quality. There's no point reviewing code quality on incomplete work.

## Pass 2: Code Quality

Only run this after Pass 1 is fully green (all DONE, no MISSING).

Check for concrete issues, not style preferences:

**CRITICAL** (must fix):
- Security vulnerabilities (injection, XSS, hardcoded secrets)
- Data loss risks (missing error handling at system boundaries)
- Race conditions or deadlocks
- Broken error handling that swallows exceptions

**IMPORTANT** (should fix):
- Missing tests for key behavior
- Dead code or commented-out code
- Unclear naming that will confuse future readers
- Functions doing too many things (>1 responsibility)

**MINOR** (optional):
- Minor naming improvements
- Small readability tweaks
- Documentation gaps in complex logic

Output:
```
Code Quality
════════════
CRITICAL: [n] issues
IMPORTANT: [n] issues
MINOR: [n] issues

[CRITICAL] File:line — Description of issue
[IMPORTANT] File:line — Description of issue
...

Verdict: [APPROVE / REQUEST CHANGES]
```

## Rules

- **Spec compliance before quality** — always, no exceptions
- **Be specific** — "File:line — what's wrong" not "error handling could be better"
- **No style nitpicks** — don't enforce personal preferences (tabs vs spaces, etc.)
- **Acknowledge what's good** — 1-2 sentences on strengths before issues
- **APPROVE means approve** — don't approve with a laundry list of concerns
