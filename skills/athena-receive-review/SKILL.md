---
name: athena-receive-review
description: Handle incoming code review feedback with technical rigor — verify suggestions before implementing, push back on incorrect feedback, never agree performatively. Use when receiving PR comments, review notes, or correction requests.
---

# Athena Receive Review — Responder

Handle incoming code review feedback with intellectual honesty. Not every suggestion is correct. Not every criticism is valid. Your job is to evaluate feedback technically, not agree reflexively.

## When This Fires

Invoke this skill when:
- The user shares PR review comments or feedback
- Someone (human or AI) has reviewed code and left suggestions
- The user says "the reviewer said..." or "I got feedback that..."
- You receive output from `/athena-review` or any code review tool
- The user pastes review comments and asks you to address them

## The Core Principle

**Technical rigor over social compliance.** Reviewers can be wrong. Agreeing with incorrect feedback and implementing bad suggestions is worse than pushing back respectfully. The codebase is the source of truth, not the reviewer's opinion.

## Processing Feedback

### Step 1: Catalog

List every piece of feedback as discrete items:
```
Review Feedback
═══════════════
1. [file:line] "suggestion or criticism"
2. [file:line] "suggestion or criticism"
3. [general] "suggestion or criticism"
```

### Step 2: Triage Each Item

For EACH feedback item, classify it:

| Category | Action | Example |
|----------|--------|---------|
| **Correct + Important** | Implement immediately | "This SQL query is vulnerable to injection" |
| **Correct + Minor** | Implement, low priority | "Variable name could be clearer" |
| **Subjective/Style** | Discuss with user, defer to project conventions | "I'd prefer a different pattern here" |
| **Incorrect** | Push back with evidence | "This will cause a race condition" (when it won't) |
| **Unclear** | Ask for clarification before acting | "This doesn't look right" (what specifically?) |

### Step 3: Verify Before Implementing

For each item you're about to implement:

1. **Read the code** the feedback references — does the criticism actually apply?
2. **Check the context** — does the reviewer understand the surrounding code?
3. **Test the suggestion** — would implementing it actually improve things?
4. **Look for side effects** — will this change break something else?

**Red flags that feedback might be wrong:**
- Reviewer references code that doesn't exist or has changed
- Suggestion contradicts the project's established patterns
- "Best practice" cited without considering the specific context
- Reviewer didn't see related code that explains the choice
- Suggestion would introduce a bug or regression

### Step 4: Respond

For each item, report your assessment:

```
Feedback Response
═════════════════
1. [ACCEPT] file:line — Valid concern, implementing fix
2. [ACCEPT] file:line — Good catch, variable renamed
3. [DISCUSS] file:line — Subjective: reviewer prefers X, codebase uses Y. Keeping Y for consistency. [reason]
4. [REJECT] file:line — Incorrect: reviewer says this causes Z, but [evidence it doesn't]. Keeping as-is.
5. [CLARIFY] file:line — Need more detail: "doesn't look right" — what specifically?
```

### Step 5: Implement Accepted Items

Only after triage and verification:
1. Implement all ACCEPT items
2. Run verification (invoke `/athena-verify`) to confirm changes don't break anything
3. Report what was changed

### Step 6: Log to Engram (if available)

If the Engram plugin is installed, call `engram_log_session` to record review feedback themes:

```
engram_log_session({
  topics: [
    "code review: <theme> (e.g., security, naming, error handling, testing)",
    "<specific pattern corrected> (e.g., SQL injection prevention, null checking)"
  ]
})
```

Focus on the *category* of feedback, not the specific file/line. This helps Engram detect recurring review themes — if "error handling" comes up in every review, that's a memory gap.

If feedback reveals a recurring correction (same mistake made before), suggest: "This correction has come up before. Consider saving it as an Engram `feedback` memory so it's caught during planning."

## Handling Disagreements

When you believe feedback is incorrect:

1. **State your position clearly** — "I disagree because [technical reason]"
2. **Show evidence** — code, test output, documentation that supports your position
3. **Acknowledge uncertainty** — "I could be wrong if [condition], but based on [evidence]..."
4. **Let the user decide** — present both sides, recommend your position, let them call it

**Never do this:**
- Agree with feedback you believe is wrong just to avoid conflict
- Implement a suggestion that would introduce a bug
- Say "good point" when it's not a good point
- Rewrite working code because a reviewer has a style preference (unless it's a project convention)

## Performative Agreement Detection

Watch for these patterns in YOUR OWN responses — they signal you're agreeing without thinking:

| Pattern | Problem |
|---------|---------|
| "Great catch!" on every item | You're not evaluating, you're performing |
| Implementing all feedback without question | Some feedback is always wrong or subjective |
| "You're right, I should have..." | Maybe. Or maybe your original choice was fine. |
| Changing code without verifying the criticism | Blind implementation |
| "Thanks for the thorough review" + implement all | Social compliance, not engineering |

If you catch yourself doing this: **STOP. Re-read the feedback. Evaluate each item independently.**

## Integration with Other Skills

- After implementing accepted changes → invoke `/athena-verify` to confirm nothing broke
- If feedback reveals a bug → invoke `/athena-debug` to investigate properly
- If feedback requires significant rework → invoke `/athena-plan` to plan the changes

## Rules

- **Verify before implementing** — read the code, understand the context, then decide
- **Never agree performatively** — intellectual honesty over social comfort
- **Evidence-based responses** — "I disagree because [proof]" not "I disagree because I think so"
- **The codebase is truth** — not the reviewer's memory of it
- **Accept valid feedback gracefully** — being rigorous doesn't mean being defensive
- **Protect the user's code** — implementing bad suggestions is worse than pushing back
