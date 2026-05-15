---
name: athena-worktree
description: Use when starting feature work that needs isolation, before executing plans in parallel, or when working on multiple branches simultaneously — creates and manages git worktrees
---

# Athena Worktree — Isolator

You create isolated git worktrees for safe parallel development. Fast defaults, minimal ceremony, works on Windows and Unix.

## Process

### Step 1: Pick Location

Use this priority order — stop at the first match:

1. **Existing directory?** Check for `.worktrees/` or `worktrees/` in project root. If found, use it.
2. **CLAUDE.md preference?** Check for worktree directory preference. If found, use it.
3. **Default:** Create `.worktrees/` in project root (hidden, clean).

No questions needed — the defaults are good.

### Step 2: Verify Ignored

**GATE:** For project-local directories, verify the worktree directory is git-ignored before proceeding.

```bash
git check-ignore -q .worktrees 2>/dev/null
```

**If NOT ignored:** Add to `.gitignore` and commit immediately. Then proceed.

**Why:** Prevents accidentally committing worktree contents to the repository.

Also verify that `.athena-state.json` and `.athena-edit-burst.json` are git-ignored (these are Athena internal state files that should not be committed).

### Step 3: Create Worktree

```bash
# Get project name for context
project=$(basename "$(git rev-parse --show-toplevel)")

# Create worktree with new branch
git worktree add ".worktrees/$BRANCH_NAME" -b "$BRANCH_NAME"
cd ".worktrees/$BRANCH_NAME"
```

**Branch naming:** Use descriptive names — `feature/auth`, `fix/rate-limit`, `refactor/config`. Match the project's existing convention if one exists.

### Step 4: Setup Environment

Auto-detect and run the appropriate setup:

| File Found | Command |
|-----------|---------|
| `package.json` | `npm install` |
| `requirements.txt` | `pip install -r requirements.txt` |
| `pyproject.toml` | `pip install -e .` or `poetry install` |
| `Cargo.toml` | `cargo build` |
| `go.mod` | `go mod download` |
| None | Skip setup |

### Step 5: Verify Baseline

Run the project's test suite to confirm the worktree starts clean:

```bash
# Use project-appropriate command
pytest / npm test / cargo test / go test ./...
```

**If tests fail:** Report failures. Ask whether to proceed or investigate.
**If tests pass:** Report ready.

### Step 6: Report

```
Worktree ready
  Path:   <full-path>
  Branch: <branch-name>
  Tests:  <N> passing, 0 failures
  Ready to implement <feature-name>
```

## Managing Worktrees

### List Active Worktrees

```bash
git worktree list
```

### Remove a Worktree

```bash
# After merging or discarding the branch
git worktree remove .worktrees/<branch-name>
git branch -d <branch-name>  # or -D to force
```

### Prune Stale Entries

```bash
git worktree prune
```

## Integration with Athena Pipeline

- **athena-build** can use worktrees for wave isolation (one worktree per wave)
- **athena-finish** cleans up worktrees after merge/discard
- **athena-plan** may recommend worktree creation for complex plans

## Platform Notes

**Windows:** Git worktrees work natively. Use forward slashes in paths. Symlinks may require Developer Mode enabled.

**CI/CD:** Worktrees share the same `.git` directory — don't run parallel CI jobs in the same repository without separate clones.

## Rules

- **Always verify ignored** before creating project-local worktrees
- **Always run baseline tests** before starting work
- **Never proceed silently** when tests fail — report and ask
- **Clean up after yourself** — remove worktrees when done

## Anti-Patterns (NEVER)

- Creating worktrees without checking gitignore — pollutes git status
- Skipping baseline tests — can't tell new bugs from old
- Leaving stale worktrees accumulating — run `git worktree prune` periodically
- Hardcoding Unix paths — use forward slashes and platform-aware commands
