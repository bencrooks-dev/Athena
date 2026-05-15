# Athena for Gemini CLI

## Install

1. Clone the repo:
   ```bash
   git clone https://github.com/bencrooks-dev/athena.git ~/.gemini/athena
   ```

2. Add to your `GEMINI.md` (project root or `~/.gemini/GEMINI.md`):
   ```markdown
   ## Skills
   Load skills from ~/.gemini/athena/skills/ — each subdirectory contains a SKILL.md.
   When a task matches a skill's description, activate it using the `activate_skill` tool.
   ```

3. Restart Gemini CLI.

## Usage

Gemini CLI loads skill metadata at session start. Skills activate on demand via `activate_skill`:

```
activate_skill athena-brainstorm
```

Or describe your intent — Gemini matches against skill descriptions.

### Tool Mapping

| Claude Code | Gemini CLI Equivalent |
|-------------|----------------------|
| `Skill` tool | `activate_skill` tool |
| `Agent` subagents | Gemini's agent dispatch |
| `Read`, `Edit`, `Write` | `read_file`, `edit_file`, `write_file` |
| `Bash` | `run_shell` |
| `Glob`, `Grep` | `search_files` |

## Update

```bash
cd ~/.gemini/athena && git pull
```

## Uninstall

Remove the skills reference from `GEMINI.md` and delete the clone:
```bash
rm -rf ~/.gemini/athena
```
