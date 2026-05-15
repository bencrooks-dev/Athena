# Spec Document Reviewer

Verify a spec is complete, consistent, and ready for implementation planning. Used by `/athena-brainstorm` during Phase 5 (Save) as a self-review pass.

## When to Use

After writing a spec to `docs/athena/specs/`. Run this review before asking the user to approve.

## Review Dimensions

| Category | What to Look For | Severity |
|----------|-----------------|----------|
| **Completeness** | TODOs, TBDs, placeholders, "fill in later", incomplete sections, missing error handling | BLOCKING |
| **Consistency** | Internal contradictions, conflicting requirements, architecture that doesn't match feature descriptions | BLOCKING |
| **Clarity** | Requirements ambiguous enough to cause two different implementations, undefined terms, vague success criteria | BLOCKING |
| **Scope** | Multiple independent subsystems crammed into one spec (needs decomposition), scope creep from original request | BLOCKING |
| **YAGNI** | Features not requested, over-engineered solutions, speculative abstractions, "nice to have" additions | WARNING |
| **Testability** | Requirements that can't be verified, missing acceptance criteria, no clear pass/fail conditions | WARNING |
| **Interface contracts** | Missing API definitions, unclear data flow between components, unspecified error responses | BLOCKING |
| **Migration/Rollback** | No rollback plan for risky changes, no migration path for data changes, no feature flag strategy for gradual rollout | WARNING |

## Calibration

**Flag these:** Missing sections, contradictions, ambiguous requirements that would cause wrong implementations, undefined interfaces between components.

**Don't flag these:** Minor wording preferences, stylistic choices, level-of-detail variance between sections, implementation details that belong in the plan (not the spec).

The goal is catching problems that would waste implementation time — not enforcing a writing style.

## Output Format

```
Spec Review
═══════════
Status: [APPROVED / ISSUES FOUND]

Issues:
  [BLOCKING] Section "X" — [description of issue and impact]
  [BLOCKING] Section "Y" contradicts section "Z" — [specifics]
  [WARNING]  Section "W" — [description]

Recommendations (non-blocking):
  - Consider [suggestion]
  - [Advisory note]
```

**APPROVED:** Zero BLOCKING issues. Warnings are noted but don't prevent proceeding.
**ISSUES FOUND:** One or more BLOCKING issues. Fix before proceeding to `/athena-plan`.

## Integration

Called automatically during `/athena-brainstorm` Phase 5 self-review. Can also be invoked standalone on any spec document:

> "Review the spec at docs/athena/specs/2026-04-01-auth-design.md"
