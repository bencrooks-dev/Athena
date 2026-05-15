# Persuasion Principles for Skill Writing

Research-backed techniques for writing skills that agents actually follow. Based on Meincke et al. (2025) — N=28,000 AI conversations showed persuasion techniques doubled compliance (33% to 72%, p < .001).

## Why This Matters

Skills are instructions for future AI agents. Agents rationalize, find loopholes, and skip steps under pressure — just like humans. These principles make skills resistant to rationalization.

## The Seven Principles

### 1. Authority
**How:** Imperative language — "YOU MUST", "NEVER", "ALWAYS". Non-negotiable framing. Iron Laws.
**Use for:** Discipline-enforcing skills (TDD, verification, safety-critical processes).
**Example:** "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST" — not "consider writing tests first."

### 2. Commitment
**How:** Require announcements ("I'm using athena-debug to investigate"), force explicit choices, use tracking (task lists, cycle counts).
**Use for:** Multi-step processes where agents might skip ahead.
**Example:** "Show the test code AND the failure output before proceeding" — creates a checkpoint the agent commits to.

### 3. Scarcity
**How:** Time-bound requirements, sequential dependencies. "Run this FRESH, not from cache."
**Use for:** Verification gates, time-sensitive workflows.
**Example:** "Earlier ≠ now. Code changed since then. Run again." — makes stale evidence feel urgent.

### 4. Social Proof
**How:** Universal patterns — "Every time", "Always", failure modes from real incidents.
**Use for:** Documenting universal practices, warning about common failures.
**Example:** "From 24 failures: undefined functions shipped, requirements missed" — concrete social proof that skipping hurts.

### 5. Unity
**How:** Collaborative language — "we", shared goals, team framing.
**Use for:** Collaborative workflows, non-hierarchical practices.
**Example:** "We follow the scientific method" — frames the process as shared identity, not imposed rule.

### 6. Reciprocity
**How:** Provide value before asking for compliance.
**Use sparingly.** Rarely needed in skills — agents don't have emotional reciprocity needs.

### 7. Liking
**DON'T USE** for compliance. Friendly framing conflicts with honest feedback and hard gates. Save warmth for user interaction, not rule enforcement.

## Combining Principles by Skill Type

| Skill Type | Primary | Secondary | Avoid |
|------------|---------|-----------|-------|
| **Discipline** (TDD, verification) | Authority + Commitment | Social Proof | Liking, Reciprocity |
| **Technique** (debugging, planning) | Moderate Authority | Unity | Heavy authority |
| **Collaborative** (review, brainstorming) | Unity + Commitment | Social Proof | Authority, Liking |
| **Reference** (docs, APIs) | Clarity only | — | All persuasion (just be clear) |

## Practical Patterns

### Bright-Line Rules
Clear, non-negotiable boundaries that eliminate judgment calls:
- "Write code before test? Delete it. Start over."
- "Tests fail? STOP. Do not proceed."

**Why they work:** Removes the decision space where rationalization lives. No judgment = no loophole.

### Rationalization Tables
Pre-empt every excuse the agent might use:

```markdown
| Excuse | Reality |
|--------|---------|
| "Too simple" | Simple things break. Test takes 30 seconds. |
```

**Why they work:** When the agent starts rationalizing, it encounters its own excuse already countered. Short-circuits the rationalization.

### Red Flag Lists
Name the thoughts that signal rule-breaking in progress:

```markdown
If you're thinking this, STOP:
- "Just this once"
- "It's about the spirit, not the ritual"
- "This is different because..."
```

**Why they work:** Makes the agent self-aware of its own rationalization patterns. Recognition triggers the rule.

### Implementation Intentions
Specific if-then plans that create automatic behavior:
- "If tests fail → STOP" (not "consider whether to continue")
- "If 3 fixes fail → question the architecture" (not "try harder")

**Why they work:** Pre-loaded decisions execute faster than real-time judgment under pressure.

## The Ethical Test

Before using any persuasion technique in a skill, ask:

> "Would this technique serve the user's genuine interests if they fully understood how it works?"

If yes → use it. If no → it's manipulation, not persuasion. Don't use it.

## How to Apply

When writing or editing an Athena skill with `/athena-forge`:
1. Identify the skill type (discipline/technique/collaborative/reference)
2. Select the appropriate principle combination from the table above
3. Apply bright-line rules for critical gates
4. Add rationalization tables for discipline-enforcing skills
5. Add red flag lists for skills where agents commonly skip steps
6. Test with pressure scenarios (see `/athena-forge` TDD cycle)
