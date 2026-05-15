const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK_PATH = path.resolve(__dirname, '../hooks/athena-init-hook.cjs');
let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'athena-init-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/**
 * Run the init hook as a subprocess with given env vars.
 */
function runHook(env) {
  try {
    const stdout = execFileSync('node', [HOOK_PATH], {
      env: { ...process.env, ...env },
      cwd: tmpDir,
      encoding: 'utf8',
      timeout: 5000,
    });
    return { stdout: stdout.trim(), exitCode: 0 };
  } catch (e) {
    return { stdout: (e.stdout || '').trim(), exitCode: e.status };
  }
}

function parseMessage(stdout) {
  if (!stdout) return null;
  try { return JSON.parse(stdout); } catch { return null; }
}

// ─── Basic Triggering ───────────────────────────────────────

describe('Init hook: basic triggering', () => {
  it('fires on Edit tool (action tool)', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Edit',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts', old_string: 'a', new_string: 'b' }),
    });
    const msg = parseMessage(stdout);
    assert.ok(msg, 'should nudge on Edit');
    assert.ok(msg.message.includes('[Athena Init]'));
  });

  it('fires on Write tool', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Write',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/new.ts', content: '...' }),
    });
    const msg = parseMessage(stdout);
    assert.ok(msg, 'should nudge on Write');
  });

  it('fires on Bash action command', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Bash',
      CLAUDE_TOOL_INPUT: JSON.stringify({ command: 'npm run build' }),
    });
    const msg = parseMessage(stdout);
    assert.ok(msg, 'should nudge on Bash action');
  });
});

// ─── Non-Action Tools ───────────────────────────────────────

describe('Init hook: non-action tools (should not fire)', () => {
  it('does NOT fire on Read tool', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Read',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null, 'Read is exploration, should not nudge');
  });

  it('does NOT fire on Glob tool', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Glob',
      CLAUDE_TOOL_INPUT: JSON.stringify({ pattern: '**/*.ts' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null);
  });

  it('does NOT fire on Grep tool', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Grep',
      CLAUDE_TOOL_INPUT: JSON.stringify({ pattern: 'function' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null);
  });
});

// ─── Exploration Commands ───────────────────────────────────

describe('Init hook: exploration Bash commands (should not fire)', () => {
  it('does NOT fire on git status', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Bash',
      CLAUDE_TOOL_INPUT: JSON.stringify({ command: 'git status' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null, 'git status is exploration');
  });

  it('does NOT fire on git log', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Bash',
      CLAUDE_TOOL_INPUT: JSON.stringify({ command: 'git log --oneline -5' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null);
  });

  it('does NOT fire on git diff', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Bash',
      CLAUDE_TOOL_INPUT: JSON.stringify({ command: 'git diff HEAD~1' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null);
  });

  it('does NOT fire on ls', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Bash',
      CLAUDE_TOOL_INPUT: JSON.stringify({ command: 'ls -la src/' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null);
  });

  it('does NOT fire on pwd', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Bash',
      CLAUDE_TOOL_INPUT: JSON.stringify({ command: 'pwd' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null);
  });

  it('does NOT fire on npm list', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Bash',
      CLAUDE_TOOL_INPUT: JSON.stringify({ command: 'npm list --depth=0' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null);
  });
});

// ─── Paused State ───────────────────────────────────────────

describe('Init hook: paused state', () => {
  it('does NOT fire when Athena is paused', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.athena-state.json'),
      JSON.stringify({ paused: true })
    );
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Edit',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts', old_string: 'a', new_string: 'b' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null, 'should not fire when paused');
  });

  it('fires when paused is false', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.athena-state.json'),
      JSON.stringify({ paused: false })
    );
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Edit',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts', old_string: 'a', new_string: 'b' }),
    });
    const msg = parseMessage(stdout);
    assert.ok(msg, 'should fire when not paused');
  });
});

// ─── Rate Limiting ──────────────────────────────────────────

describe('Init hook: rate limiting', () => {
  it('does NOT fire if nudged within last 60 seconds', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.athena-state.json'),
      JSON.stringify({ _lastInitNudge: Date.now() - 30000 }) // 30s ago
    );
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Edit',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts', old_string: 'a', new_string: 'b' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null, 'should not re-nudge within 60s');
  });

  it('fires if last nudge was more than 60 seconds ago', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.athena-state.json'),
      JSON.stringify({ _lastInitNudge: Date.now() - 120000 }) // 2 min ago
    );
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Edit',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts', old_string: 'a', new_string: 'b' }),
    });
    const msg = parseMessage(stdout);
    assert.ok(msg, 'should fire after 60s cooldown');
  });

  it('does NOT fire if a skill was invoked within last 60 seconds', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.athena-state.json'),
      JSON.stringify({ _lastSkillInvoke: Date.now() - 10000 }) // 10s ago
    );
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Edit',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts', old_string: 'a', new_string: 'b' }),
    });
    const msg = parseMessage(stdout);
    assert.equal(msg, null, 'skill was recently invoked — no nudge needed');
  });

  it('updates _lastInitNudge in state file when it fires', () => {
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Edit',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts', old_string: 'a', new_string: 'b' }),
    });
    const msg = parseMessage(stdout);
    assert.ok(msg, 'should fire');

    // Verify state was updated
    const state = JSON.parse(fs.readFileSync(path.join(tmpDir, '.athena-state.json'), 'utf8'));
    assert.ok(state._lastInitNudge, 'should have written _lastInitNudge');
    assert.ok(Date.now() - state._lastInitNudge < 5000, 'timestamp should be recent');
  });

  it('preserves existing state fields when writing nudge timestamp', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.athena-state.json'),
      JSON.stringify({ phase: 'build', planId: 'plan:auth', wave: { current: 2 } })
    );
    const { stdout } = runHook({
      CLAUDE_TOOL_NAME: 'Edit',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts', old_string: 'a', new_string: 'b' }),
    });

    const state = JSON.parse(fs.readFileSync(path.join(tmpDir, '.athena-state.json'), 'utf8'));
    assert.equal(state.phase, 'build', 'phase should be preserved');
    assert.equal(state.planId, 'plan:auth', 'planId should be preserved');
    assert.deepEqual(state.wave, { current: 2 }, 'wave should be preserved');
    assert.ok(state._lastInitNudge, '_lastInitNudge should be added');
  });
});

// ─── Edge Cases ─────────────────────────────────────────────

describe('Init hook: edge cases', () => {
  it('handles missing env vars gracefully', () => {
    const { exitCode } = runHook({});
    assert.equal(exitCode, 0, 'should exit cleanly');
  });

  it('handles malformed JSON input', () => {
    const { exitCode } = runHook({
      CLAUDE_TOOL_NAME: 'Bash',
      CLAUDE_TOOL_INPUT: 'not json at all',
    });
    assert.equal(exitCode, 0, 'should exit cleanly on bad JSON');
  });

  it('handles corrupt state file', () => {
    fs.writeFileSync(path.join(tmpDir, '.athena-state.json'), '{corrupt');
    const { exitCode } = runHook({
      CLAUDE_TOOL_NAME: 'Edit',
      CLAUDE_TOOL_INPUT: JSON.stringify({ file_path: '/src/auth.ts', old_string: 'a', new_string: 'b' }),
    });
    // Should either fire or exit cleanly, but never crash
    assert.equal(exitCode, 0);
  });
});
