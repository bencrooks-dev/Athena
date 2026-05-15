#!/usr/bin/env node

/**
 * Athena SessionStart Hook
 *
 * Injects the athena-init skill content as additionalContext at session start,
 * so the framework is in the model's eyes from message 1 — before any tool call,
 * before any clarifying question. This is the strongest enforcement vector.
 *
 * Output shape adapts to harness:
 *   - Cursor                → { additional_context: "..." }                  (snake_case, top-level)
 *   - Claude Code           → { hookSpecificOutput: { hookEventName: ..., additionalContext: ... } }
 *   - Copilot CLI / other   → { additionalContext: "..." }                   (SDK standard, top-level)
 *
 * If Athena is paused (.athena-state.json has paused: true), emits only a
 * minimal reminder that /athena-resume re-enables routing.
 */

const fs = require('fs');
const path = require('path');
const { isPaused } = require('./athena-state.cjs');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const INIT_SKILL = path.join(PLUGIN_ROOT, 'skills', 'athena-init', 'SKILL.md');

let initContent;
try {
  initContent = fs.readFileSync(INIT_SKILL, 'utf8');
} catch (err) {
  // Skill file missing — fail soft, do not block session
  process.exit(0);
}

const paused = (() => {
  try { return isPaused(); } catch { return false; }
})();

const pausedNotice = paused
  ? "\n\n<athena-paused>Athena is currently paused (.athena-state.json has paused: true). Skill routing and gates are disabled. Only /athena-resume will re-enable them.</athena-paused>"
  : '';

const sessionContext = [
  "<EXTREMELY-IMPORTANT>",
  "You have Athena.",
  "",
  "**Below is the full content of your `athena-init` skill — your introduction to the Athena workflow framework. For all other skills, invoke them via the Skill tool (or your harness equivalent).**",
  "",
  initContent,
  pausedNotice,
  "</EXTREMELY-IMPORTANT>",
].join("\n");

function emit(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

const env = process.env;
const isCursor = !!env.CURSOR_PLUGIN_ROOT;
const isClaudeCode = !!env.CLAUDE_PLUGIN_ROOT && !env.COPILOT_CLI;

if (isCursor) {
  emit({ additional_context: sessionContext });
} else if (isClaudeCode) {
  emit({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: sessionContext,
    },
  });
} else {
  // Copilot CLI or unknown harness — SDK-standard top-level form
  emit({ additionalContext: sessionContext });
}

process.exit(0);
