---
name: athena-forge
description: Use when creating new Athena skills, editing existing skills, or building skills for any Claude Code plugin — guides skill authoring with TDD validation
---

# Athena Forge — Skill Smith

You create and refine Claude Code skills. Every skill follows TDD: test first, write minimal, refactor until bulletproof.

## The Iron Law

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

Write skill before testing? Delete it. Start over. No exceptions.

## Skill Format

Every Athena skill is a `SKILL.md` file in its own directory:

```
skills/
  skill-name/
    SKILL.md              # Main content (required)
    supporting-file.*     # Only if needed (heavy reference, tools)
```

### SKILL.md Template

```markdown
---
name: skill-name
description: Use when [specific triggering conditions — symptoms, situations, contexts]
---

# Skill Name — Role Title

[1-2 sentence core principle. What does this skill enforce?]

## Process

### Phase/Step 1: [Name]
[Steps with code blocks, gates, output formats]

### Phase/Step 2: [Name]
[Continue...]

## Rules
- [Enforced constraints]

## Anti-Patterns (NEVER)
- [What NOT to do and why]
```

### Frontmatter Rules

- **`name`**: Letters, numbers, hyphens only. Verb-first: `athena-build` not `build-athena`
- **`description`**: Starts with "Use when..." — describe TRIGGERING CONDITIONS only, not the workflow
  - BAD: "Systematic debugging with hypothesis tracking and checkpoints"
  - GOOD: "Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes"
  - **Why:** If description summarizes the workflow, Claude shortcuts to the description instead of reading the full skill

### Athena Style Guide

Athena skills share these patterns:

| Element | Convention |
|---------|-----------|
| Title | `# Name — Role` (e.g., "Athena Debug — Investigator") |
| Phases | `### Phase N: Name` or `### Step N: Name` |
| Gates | `**GATE:**` before critical decision points |
| Output | ASCII box templates with exact format |
| Rules | Bullet list of enforced constraints |
| Anti-Patterns | `## Anti-Patterns (NEVER)` with what + why |
| Code | Complete and runnable, never pseudocode |
| File paths | Always exact (`src/config.yaml` not "the config file") |

## TDD Cycle for Skills

### RED: Baseline Test

1. Write 2-3 **pressure scenarios** — situations where an agent might skip or shortcut the behavior your skill enforces
2. Run scenarios with a subagent **WITHOUT** the skill
3. Document exactly what went wrong:
   - What choices did the agent make?
   - What rationalizations did it use? (capture verbatim)
   - Which pressures triggered violations?

### GREEN: Write Minimal Skill

1. Write the skill addressing **those specific failures** — not hypothetical ones
2. Run the same scenarios WITH the skill loaded
3. Agent should now comply

**GATE:** If the agent still violates, the skill isn't clear enough. Revise before proceeding.

### REFACTOR: Close Loopholes

1. Look for new rationalizations the agent found
2. Add explicit counters in a rationalization table:

```markdown
| Excuse | Reality |
|--------|---------|
| "Too simple to need this" | Simple tasks are where shortcuts cause the most waste |
| "I'll do it after" | After = never. The gate is absolute. |
```

3. Add a **Red Flags** section listing thoughts that mean "stop, you're rationalizing"
4. Re-test until the skill is bulletproof

## Router Integration

If your new skill is a core Athena workflow, add it to the `/athena` router:

1. Add a row to the routing table with intent, skill name, and trigger words
2. Add the skill to the menu display
3. Add context awareness rules (e.g., "if X state exists, route here")

## Skill Types and Testing Approach

| Type | Examples | Test With |
|------|----------|-----------|
| **Discipline** (rules) | TDD, verification gates | Pressure scenarios — time, sunk cost, exhaustion |
| **Technique** (how-to) | Debugging, planning | Application scenarios — can agent apply it? |
| **Pattern** (mental model) | Architecture, design | Recognition scenarios — when to apply / not apply? |
| **Reference** (docs) | API guides, syntax | Retrieval scenarios — can agent find the right info? |

## Quality Checklist

- [ ] Frontmatter has `name` and `description` (description starts with "Use when...")
- [ ] Description has triggering conditions only, no workflow summary
- [ ] RED phase completed — baseline failures documented
- [ ] GREEN phase completed — skill addresses specific failures
- [ ] REFACTOR phase completed — loopholes closed
- [ ] Code examples are complete and runnable
- [ ] No TBD, TODO, or placeholders
- [ ] Follows Athena style (gates, rules, anti-patterns sections)
- [ ] Committed to git

## Persuasion Principles

When writing discipline-enforcing skills, apply research-backed persuasion techniques to make them rationalization-resistant. See `persuasion-principles.md` in this skill's directory for the complete guide.

**Quick reference:**
- **Discipline skills** → Authority + Commitment + Social Proof (bright-line rules, rationalization tables)
- **Technique skills** → Moderate Authority + Unity (collaborative framing)
- **Reference skills** → Clarity only (no persuasion needed)

## Anti-Patterns (NEVER)

- **Writing skill before testing** — you don't know what to teach if you haven't seen the failure
- **Multi-language examples** — one excellent example beats five mediocre ones
- **Narrative storytelling** — "In session X we found..." is not reusable. Teach the pattern.
- **Summarizing workflow in description** — Claude shortcuts descriptions, skips the full skill
- **Batching multiple skills without testing each** — deploy and test one at a time
- **500+ line skills** — if it's that long, split into skill + reference file
