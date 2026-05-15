#!/usr/bin/env node

/**
 * Athena Init Enforcement Hook (PreToolUse)
 *
 * Fires BEFORE the first tool call in a turn to check whether an Athena
 * skill was considered. This backs up athena-init's prompt-based enforcement
 * with a hard hook — survives context compression.
 *
 * Only nudges once per conversation turn to avoid noise.
 */

const { isPaused, readState, mergeState } = require('./athena-state.cjs');

const toolName = process.env.CLAUDE_TOOL_NAME || '';
const toolInput = process.env.CLAUDE_TOOL_INPUT || '';

// Check for paused state
if (isPaused()) {
  process.exit(0);
}

// Only trigger on action tools (Edit, Write, Bash) — not on Read/Glob/Grep (exploration is fine)
const actionTools = ['Edit', 'Write', 'Bash'];
if (!actionTools.includes(toolName)) {
  process.exit(0);
}

// Check if an Athena skill was already invoked in this turn
// We use timestamps in state to avoid nudging more than once per 60 seconds
try {
  const state = readState();
  const now = Date.now();
  const lastInitNudge = state._lastInitNudge || 0;
  const lastSkillInvoke = state._lastSkillInvoke || 0;

  // If a skill was invoked within the last 60 seconds, no nudge needed
  if ((now - lastSkillInvoke) < 60000) {
    process.exit(0);
  }

  // If we already nudged within the last 60 seconds, don't repeat
  if ((now - lastInitNudge) < 60000) {
    process.exit(0);
  }

  // Skip nudge for Bash commands that are clearly exploration (git status, ls, etc.)
  let inputStr = '';
  try {
    const parsed = JSON.parse(toolInput);
    inputStr = (typeof parsed === 'object' && parsed !== null) ? (parsed.command || '') : String(parsed);
  } catch { inputStr = toolInput; }
  const explorationCommands = /^(git\s+(status|log|diff|show|branch)|ls|pwd|cat|head|tail|echo|which|type|npm\s+list)/i;
  if (toolName === 'Bash' && explorationCommands.test(inputStr.trim())) {
    process.exit(0);
  }

  // Nudge: action tool used without a recent skill invocation
  mergeState({ _lastInitNudge: now });

  console.log(JSON.stringify({
    type: 'ASSISTANT_MESSAGE',
    message: '[Athena Init] Action detected without an Athena skill check. Consider whether /athena should route this task before proceeding.'
  }));
  process.exit(0);
} catch {
  // Non-critical — if state file can't be written, skip gracefully
  process.exit(0);
}
