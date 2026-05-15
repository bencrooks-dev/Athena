#!/usr/bin/env node

/**
 * Athena Auto-Trigger Hook (PostToolUse)
 *
 * Fires after tool execution to detect when Athena skills should activate:
 * - athena-verify: when tests pass and agent may claim "done"
 * - athena-receive-review: when PR review feedback enters the conversation
 * - athena-debug: when merge conflicts are detected
 * - athena-tdd: when a new source file is created without a test
 * - athena-build: when a plan file is read or detected
 * - edit burst: when 15+ edits happen without a commit (configurable via editBurstThreshold)
 *
 * Returns ASSISTANT_MESSAGE to nudge Claude toward the right skill.
 */

const { isPaused, readState, readBurst, mergeBurst } = require('./athena-state.cjs');

const toolName = process.env.CLAUDE_TOOL_NAME || '';
const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
const toolOutput = process.env.CLAUDE_TOOL_OUTPUT || '';

let input = '';
try { input = JSON.parse(toolInput) || ''; } catch { input = toolInput; }

let output = '';
try { output = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput); } catch { output = ''; }

const lowerOutput = output.toLowerCase();
// Extract the actual command string for Bash, or file_path for Read/Write/Edit
const commandStr = (typeof input === 'object' && input !== null) ? (input.command || '') : (typeof input === 'string' ? input : '');
const filePathStr = (typeof input === 'object' && input !== null) ? (input.file_path || '') : (typeof input === 'string' ? input : '');
const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
const lowerInput = inputStr.toLowerCase();

// Check for paused state — skip all triggers if Athena is paused
if (isPaused()) {
  process.exit(0);
}

function emit(message) {
  console.log(JSON.stringify({ type: 'ASSISTANT_MESSAGE', message }));
  process.exit(0);
}

// --- 1. Verification trigger ---
// After test runs that pass, remind to verify before claiming done
const testCommands = [
  'pytest', 'npm test', 'npm run test', 'jest', 'mocha', 'vitest',
  'cargo test', 'go test', 'python -m pytest', 'npx vitest',
  'npx jest', 'make test', 'bundle exec rspec', 'dotnet test',
  'php artisan test', 'phpunit', 'mix test', 'swift test'
];

if (toolName === 'Bash') {
  const isTestRun = testCommands.some(cmd => {
    // Match the command at start or after && / ; / | — avoid substring false positives
    const pattern = new RegExp('(^|&&|;|\\|)\\s*' + cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return pattern.test(commandStr);
  });

  // Use regex patterns to avoid false positives from test names
  // like "test_error_handling" or "0 errors"
  const failurePatterns = [
    /\bfail(ed|ure|ing|s)?\b/i,       // "FAILED", "failures", "failing" — but not "failover"
    /[1-9]\d*\s+(error|failure)/i,     // "3 errors", "1 failure" — but not "0 errors"
    /\berror:/i,                        // "Error:" as a label
    /\bErrors?\s*=/i,                   // "Errors=" counter
    /\bnot\s+ok\b/i,                   // TAP format
    /\bpanic\b/i,                      // Go panics
    /\bTraceback\b/,                   // Python tracebacks
    /exit\s+code\s+[1-9]/i            // Non-zero exit codes
  ];
  const hasFailures = failurePatterns.some(p => p.test(output));

  if (isTestRun && !hasFailures) {
    emit('[Athena] Tests passed. Before claiming done, invoke /athena-verify to run the full verification protocol.');
  }
}

// --- 2. Review feedback trigger (tightened) ---
// Only fire when BOTH: (a) reading PR-specific content AND (b) output contains review-specific language
if (toolName === 'Bash') {
  const isPRCommand = /gh\s+pr\s+(review|checks|diff|view|comment)/.test(commandStr) ||
                      /gh\s+api\s+repos\/.*\/pulls\/.*\/(comments|reviews)/.test(commandStr);

  const reviewLanguage = [
    'requested changes', 'changes requested', 'approve with comments',
    'nit:', 'suggestion:', 'consider changing', 'lgtm', 'looks good to me'
  ];
  const hasReviewLanguage = reviewLanguage.some(p => lowerOutput.includes(p));

  if (isPRCommand && hasReviewLanguage) {
    emit('[Athena] Review feedback detected. Invoke /athena-receive-review to process feedback with technical rigor.');
  }
}

// --- 3. Merge conflict trigger ---
if (toolName === 'Bash') {
  const mergeConflictSignals = [
    'merge conflict', 'conflict (content)', 'both modified',
    'unmerged paths', 'fix conflicts and then commit'
  ];
  const hasConflict = mergeConflictSignals.some(s => lowerOutput.includes(s));

  if (hasConflict) {
    emit('[Athena] Merge conflicts detected. Consider /athena-debug to investigate systematically before resolving.');
  }
}

// --- 4. New source file without test trigger ---
if (toolName === 'Write') {
  const filePath = filePathStr;
  const srcExtensions = /\.(ts|tsx|js|jsx|py|rs|go|java|rb|swift|kt|cs)$/i;
  const isTestFile = /(test|spec|_test|_spec)\./i.test(filePath) || /\/(tests?|__tests__|spec)\//i.test(filePath);

  if (srcExtensions.test(filePath) && !isTestFile) {
    emit('[Athena] New source file created. Consider /athena-tdd to ensure tests are written first (red-green-refactor).');
  }
}

// --- 5. Plan file detection trigger ---
if (toolName === 'Read') {
  const filePath = filePathStr;
  const isPlanFile = /docs\/plans\/.*\.md$/i.test(filePath);

  if (isPlanFile) {
    emit('[Athena] Plan file detected. Use /athena-build to execute this plan with coordinated agents and verification gates.');
  }
}

// --- 6. Edit burst detection ---
// Tracked in a separate file to avoid race conditions with .athena-state.json
// Threshold is configurable via .athena-state.json { editBurstThreshold: N } (default: 15)
if (toolName === 'Edit' || toolName === 'Write') {
  try {
    const burst = readBurst();
    const state = readState();
    const now = Date.now();
    const lastEdit = burst.lastEdit || 0;
    const editCount = burst.count || 0;
    const lastNudge = burst.lastNudge || 0;
    const threshold = state.editBurstThreshold || 15;

    // Reset counter if more than 5 minutes since last edit
    const withinBurst = (now - lastEdit) < 300000;
    const newCount = withinBurst ? editCount + 1 : 1;

    mergeBurst({ lastEdit: now, count: newCount, lastNudge });

    // Nudge after threshold edits without a commit, but only once per burst
    if (newCount >= threshold && (now - lastNudge) > 600000) {
      mergeBurst({ lastNudge: now });
      emit(`[Athena] ${threshold}+ file edits without a commit. Consider /athena-verify to check your work, or commit your progress.`);
    }
  } catch { /* burst file issues — non-critical, skip */ }
}

// Exit cleanly if no trigger matched
process.exit(0);
