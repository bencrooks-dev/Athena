const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  readState,
  readBurst,
  mergeState,
  mergeBurst,
  deepMerge,
  isPaused,
  statePath,
  burstPath,
} = require('../hooks/athena-state.cjs');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'athena-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ─── deepMerge ───────────────────────────────────────────────

describe('deepMerge', () => {
  it('merges top-level keys', () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
    assert.deepEqual(result, { a: 1, b: 3, c: 4 });
  });

  it('shallow-merges nested objects (1 level)', () => {
    const result = deepMerge(
      { wave: { current: 1, total: 3 }, phase: 'build' },
      { wave: { current: 2 } }
    );
    assert.deepEqual(result, { wave: { current: 2, total: 3 }, phase: 'build' });
  });

  it('overwrites nested object with primitive', () => {
    const result = deepMerge({ wave: { current: 1 } }, { wave: 'done' });
    assert.deepEqual(result, { wave: 'done' });
  });

  it('overwrites primitive with nested object', () => {
    const result = deepMerge({ wave: 'done' }, { wave: { current: 1 } });
    assert.deepEqual(result, { wave: { current: 1 } });
  });

  it('deletes keys with null values', () => {
    const result = deepMerge({ a: 1, b: 2, c: 3 }, { b: null });
    assert.deepEqual(result, { a: 1, c: 3 });
  });

  it('deletes keys with undefined values', () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: undefined });
    assert.deepEqual(result, { a: 1 });
  });

  it('does not mutate original objects', () => {
    const target = { a: 1 };
    const source = { b: 2 };
    deepMerge(target, source);
    assert.deepEqual(target, { a: 1 });
    assert.deepEqual(source, { b: 2 });
  });

  it('handles arrays as values (replaces, does not merge)', () => {
    const result = deepMerge({ items: [1, 2] }, { items: [3, 4, 5] });
    assert.deepEqual(result, { items: [3, 4, 5] });
  });

  it('handles empty source', () => {
    const result = deepMerge({ a: 1 }, {});
    assert.deepEqual(result, { a: 1 });
  });

  it('handles empty target', () => {
    const result = deepMerge({}, { a: 1 });
    assert.deepEqual(result, { a: 1 });
  });
});

// ─── readState / mergeState ──────────────────────────────────

describe('readState', () => {
  it('returns {} when file does not exist', () => {
    assert.deepEqual(readState(tmpDir), {});
  });

  it('returns parsed JSON when file exists', () => {
    fs.writeFileSync(path.join(tmpDir, '.athena-state.json'), '{"phase":"build"}');
    assert.deepEqual(readState(tmpDir), { phase: 'build' });
  });

  it('returns {} on corrupt JSON', () => {
    fs.writeFileSync(path.join(tmpDir, '.athena-state.json'), '{corrupt');
    assert.deepEqual(readState(tmpDir), {});
  });
});

describe('mergeState', () => {
  it('creates file if missing', () => {
    mergeState({ phase: 'planned' }, tmpDir);
    const result = JSON.parse(fs.readFileSync(path.join(tmpDir, '.athena-state.json'), 'utf8'));
    assert.equal(result.phase, 'planned');
  });

  it('merges into existing state without overwriting', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.athena-state.json'),
      JSON.stringify({ phase: 'build', paused: false, planId: 'plan:auth' })
    );
    mergeState({ phase: 'build-complete', wave: { current: 3 } }, tmpDir);
    const result = JSON.parse(fs.readFileSync(path.join(tmpDir, '.athena-state.json'), 'utf8'));
    assert.equal(result.phase, 'build-complete');
    assert.equal(result.paused, false);
    assert.equal(result.planId, 'plan:auth');
    assert.deepEqual(result.wave, { current: 3 });
  });

  it('preserves fields from other skills', () => {
    // Simulate athena-plan writing state
    mergeState({ phase: 'planned', planId: 'plan:auth', plan: 'docs/plans/auth.md' }, tmpDir);
    // Simulate athena-build updating
    mergeState({ phase: 'build', wave: { current: 1, total: 3 } }, tmpDir);
    // Simulate athena-verify recording
    mergeState({ lastVerification: { result: 'PASS', tests: 24 } }, tmpDir);

    const result = readState(tmpDir);
    assert.equal(result.phase, 'build');
    assert.equal(result.planId, 'plan:auth');
    assert.equal(result.plan, 'docs/plans/auth.md');
    assert.deepEqual(result.wave, { current: 1, total: 3 });
    assert.equal(result.lastVerification.result, 'PASS');
  });

  it('can delete fields with null', () => {
    mergeState({ phase: 'paused', pausedAt: '2025-01-15', pausedBy: 'user' }, tmpDir);
    mergeState({ paused: false, pausedAt: null, pausedBy: null }, tmpDir);
    const result = readState(tmpDir);
    assert.equal(result.paused, false);
    assert.equal(result.pausedAt, undefined);
    assert.equal(result.pausedBy, undefined);
  });

  it('returns the merged state', () => {
    const result = mergeState({ phase: 'test' }, tmpDir);
    assert.equal(result.phase, 'test');
  });

  it('handles concurrent-ish writes (last writer wins, no data loss)', () => {
    mergeState({ phase: 'build', wave: { current: 1 } }, tmpDir);
    // Two "concurrent" merges to different fields
    const state1 = readState(tmpDir);
    const state2 = readState(tmpDir);
    // Writer 1 updates wave
    mergeState({ wave: { current: 2 } }, tmpDir);
    // Writer 2 updates verification — reads fresh state internally
    mergeState({ lastVerification: { result: 'PASS' } }, tmpDir);
    const final = readState(tmpDir);
    assert.equal(final.phase, 'build');
    assert.equal(final.wave.current, 2);
    assert.equal(final.lastVerification.result, 'PASS');
  });
});

// ─── readBurst / mergeBurst ──────────────────────────────────

describe('readBurst', () => {
  it('returns {} when file does not exist', () => {
    assert.deepEqual(readBurst(tmpDir), {});
  });

  it('returns parsed JSON when file exists', () => {
    fs.writeFileSync(path.join(tmpDir, '.athena-edit-burst.json'), '{"count":5}');
    assert.deepEqual(readBurst(tmpDir), { count: 5 });
  });
});

describe('mergeBurst', () => {
  it('creates file if missing', () => {
    mergeBurst({ count: 1, lastEdit: 123 }, tmpDir);
    const result = JSON.parse(fs.readFileSync(path.join(tmpDir, '.athena-edit-burst.json'), 'utf8'));
    assert.equal(result.count, 1);
  });

  it('merges into existing burst state', () => {
    mergeBurst({ count: 5, lastEdit: 100, lastNudge: 0 }, tmpDir);
    mergeBurst({ count: 6, lastEdit: 200 }, tmpDir);
    const result = readBurst(tmpDir);
    assert.equal(result.count, 6);
    assert.equal(result.lastEdit, 200);
    assert.equal(result.lastNudge, 0);
  });
});

// ─── isPaused ────────────────────────────────────────────────

describe('isPaused', () => {
  it('returns false when no state file', () => {
    assert.equal(isPaused(tmpDir), false);
  });

  it('returns false when paused is false', () => {
    fs.writeFileSync(path.join(tmpDir, '.athena-state.json'), '{"paused":false}');
    assert.equal(isPaused(tmpDir), false);
  });

  it('returns true when paused is true', () => {
    fs.writeFileSync(path.join(tmpDir, '.athena-state.json'), '{"paused":true}');
    assert.equal(isPaused(tmpDir), true);
  });

  it('returns false when paused field is missing', () => {
    fs.writeFileSync(path.join(tmpDir, '.athena-state.json'), '{"phase":"build"}');
    assert.equal(isPaused(tmpDir), false);
  });

  it('returns false on corrupt file', () => {
    fs.writeFileSync(path.join(tmpDir, '.athena-state.json'), 'not json');
    assert.equal(isPaused(tmpDir), false);
  });
});
