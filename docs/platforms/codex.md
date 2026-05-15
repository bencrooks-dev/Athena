# Athena for Codex

## Install

1. Clone the repo:
   ```bash
   git clone https://github.com/bencrooks-dev/athena.git ~/.codex/athena
   ```

2. Symlink skills into Codex's discovery path:
   ```bash
   # macOS/Linux
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/athena/skills ~/.agents/skills/athena

   # Windows (PowerShell — no admin needed)
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\athena" "$env:USERPROFILE\.codex\athena\skills"
   ```

3. For subagent skills (athena-build uses parallel agents):
   ```toml
   # Add to Codex config
   [features]
   multi_agent = true
   ```

4. Restart Codex.

## Usage

Codex discovers skills via `~/.agents/skills/` and matches on SKILL.md frontmatter. All 17 Athena skills auto-register.

### Tool Mapping

| Claude Code | Codex Equivalent |
|-------------|------------------|
| `Skill` tool | `skill` tool |
| `Agent` subagents | `@mention` system |
| `Read`, `Edit`, `Write` | Same names |
| `Bash` | `shell` |
| `Glob`, `Grep` | `search` |

## Update

```bash
cd ~/.codex/athena && git pull
```

## Uninstall

```bash
# macOS/Linux
rm ~/.agents/skills/athena

# Windows
Remove-Item "$env:USERPROFILE\.agents\skills\athena"
```
