---
name: athena-finish
description: Use when implementation is complete and you need to merge, create a PR, keep, or discard a branch — handles integration and cleanup after development work
---

# Athena Finish — Closer

You complete development branches by verifying, integrating, and cleaning up. Pipeline-aware — if `/athena-ship` already ran its checks, don't repeat them.

## Process

### Step 1: Verify State

Check if athena-ship has already validated this branch:

```bash
# Check for recent ship verification
git log --oneline -5  # Look for ship-related commits or passing state
```

**If athena-ship already passed:** Skip to Step 3 (trust the gate).
**If not:** Run the test suite now.

```bash
# Run project-appropriate tests
pytest / npm test / cargo test / go test ./...
```

**GATE:** If tests fail, stop. Report failures. Do not proceed.

### Step 2: Determine Base Branch

```bash
# Detect base branch
git merge-base HEAD main 2>/dev/null && echo "main" || \
git merge-base HEAD master 2>/dev/null && echo "master"
```

If ambiguous, ask: "This branch split from `main` — correct?"

### Step 3: Present Options

Show exactly these 4 options — concise, no explanation needed:

```
Branch ready. What would you like to do?

1. Merge to <base-branch> locally
2. Push and create a Pull Request
3. Keep branch as-is (handle later)
4. Discard this work

Which option?
```

### Step 4: Execute

#### Option 1: Merge Locally

```bash
git checkout <base-branch>
git pull origin <base-branch>
git merge <feature-branch>
# Verify tests on merged result
<test-command>
# If passing:
git branch -d <feature-branch>
```

Then: Step 5 (cleanup).

#### Option 2: Push and Create PR

```bash
git push -u origin <feature-branch>

gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
- <what changed, 2-3 bullets>

## Verification
- [ ] Tests passing
- [ ] <additional checks>
EOF
)"
```

Report the PR URL. Then: Step 5 (cleanup worktree only).

#### Option 3: Keep As-Is

Report: "Keeping branch `<name>` at `<path>`. No cleanup."

Done. No further steps.

#### Option 4: Discard

**GATE:** Require explicit confirmation before destroying work.

```
This will permanently delete:
  Branch: <name>
  Commits: <list>
  Worktree: <path> (if applicable)

Type 'discard' to confirm.
```

Wait for exact confirmation. Then:

```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Step 5 (cleanup).

### Step 5: Cleanup

**Worktree cleanup** (Options 1, 2, 4 only):

```bash
# Check if we're in a worktree
worktree_path=$(git worktree list | grep "<feature-branch>" | awk '{print $1}')

if [ -n "$worktree_path" ]; then
    cd "$(git rev-parse --show-toplevel)"
    git worktree remove "$worktree_path"
fi

# Prune any stale entries
git worktree prune
```

**Report final state:**

```
Done.
  Action:    <merged/PR created/discarded>
  Branch:    <deleted/pushed/kept>
  Worktree:  <removed/kept/n/a>
  <PR URL if Option 2>
```

## Quick Reference

| Option | Merge | Push | Keep Worktree | Delete Branch |
|--------|-------|------|---------------|---------------|
| 1. Merge | Yes | No | No | Yes (safe) |
| 2. PR | No | Yes | No | No |
| 3. Keep | No | No | Yes | No |
| 4. Discard | No | No | No | Yes (force) |

## Integration

**Called after:**
- `/athena-ship` — ship verifies, finish integrates
- `/athena-build` — build completes, finish wraps up
- Any completed feature work

**Pairs with:**
- `/athena-worktree` — cleans up worktrees created by that skill
- `/athena-ship` — trusts ship's verification gates, doesn't re-run

## Rules

- **Never proceed with failing tests** — the gate is absolute
- **Never delete work without typed confirmation** — "discard" must be explicit
- **Trust athena-ship's gates** — don't re-run checks that already passed
- **Always clean up worktrees** — except Option 3 (keep)
- **Always report final state** — user should know exactly what happened

## Anti-Patterns (NEVER)

- Merging without verifying tests on the merged result — merge can introduce conflicts
- Force-pushing without explicit user request — destructive and irreversible
- Cleaning up worktrees for Option 3 — user explicitly chose to keep it
- Skipping the discard confirmation — accidentally deleting work is catastrophic
- Re-running full test suite when athena-ship just passed — wasteful, trust the pipeline
