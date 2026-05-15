# Athena for OpenCode

## Install

Add to your `opencode.json` (global or project-level):

```json
{
  "plugin": ["athena@git+https://github.com/bencrooks-dev/athena.git"]
}
```

Restart OpenCode. Skills auto-register.

## Manual Install (Alternative)

1. Clone:
   ```bash
   git clone https://github.com/bencrooks-dev/athena.git ~/.config/opencode/athena
   ```

2. Symlink skills:
   ```bash
   # macOS/Linux
   mkdir -p ~/.config/opencode/skills
   ln -s ~/.config/opencode/athena/skills ~/.config/opencode/skills/athena

   # Windows
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\skills"
   cmd /c mklink /J "$env:USERPROFILE\.config\opencode\skills\athena" "$env:USERPROFILE\.config\opencode\athena\skills"
   ```

3. Restart OpenCode.

## Usage

List skills:
```
use skill tool to list skills
```

Load a skill:
```
use skill tool to load athena/athena-brainstorm
```

### Tool Mapping

| Claude Code | OpenCode Equivalent |
|-------------|---------------------|
| `Skill` tool | `skill` tool |
| `Agent` subagents | `@mention` system |
| `Read`, `Edit`, `Write` | Native file tools |
| `Bash` | `shell` |

## Update

Plugin mode: automatic on restart.
Manual mode: `cd ~/.config/opencode/athena && git pull`

## Uninstall

Plugin mode: remove the line from `opencode.json`.
Manual mode:
```bash
rm ~/.config/opencode/skills/athena
```
