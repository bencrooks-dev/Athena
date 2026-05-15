# Athena for Cursor

## Install

1. Clone the repo:
   ```bash
   git clone https://github.com/bencrooks-dev/athena.git ~/.cursor/athena
   ```

2. Add skills to Cursor's discovery path:
   ```bash
   # macOS/Linux
   mkdir -p ~/.cursor/skills
   ln -s ~/.cursor/athena/skills ~/.cursor/skills/athena

   # Windows (PowerShell — no admin needed)
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cursor\skills"
   cmd /c mklink /J "$env:USERPROFILE\.cursor\skills\athena" "$env:USERPROFILE\.cursor\athena\skills"
   ```

3. Restart Cursor.

## Usage

Skills are discovered automatically via frontmatter. Use them by name:
- "use athena-brainstorm" or describe your intent — the router picks the right skill
- All 17 Athena skills are available

### Tool Mapping

Athena skills reference Claude Code tool names. In Cursor:

| Claude Code | Cursor Equivalent |
|-------------|-------------------|
| `Skill` tool | `skill` tool |
| `Agent` subagents | Cursor's agent dispatch |
| `Read`, `Edit`, `Write` | Same names |
| `Bash` | `terminal` / `shell` |
| `Glob`, `Grep` | `search` / `find` |

## Update

```bash
cd ~/.cursor/athena && git pull
```

## Uninstall

```bash
# macOS/Linux
rm ~/.cursor/skills/athena

# Windows
Remove-Item "$env:USERPROFILE\.cursor\skills\athena"
```
