#!/usr/bin/env node

/**
 * Athena State Helper
 *
 * Shared module for reading and merging .athena-state.json.
 * All hooks and skills should use this to avoid overwriting each other's fields.
 *
 * Usage (from hooks):
 *   const { readState, mergeState, isPaused } = require('./athena-state.cjs');
 *   const state = readState();           // returns {} if missing/corrupt
 *   mergeState({ phase: 'planned' });    // reads, deep-merges, writes atomically
 *   if (isPaused()) process.exit(0);     // convenience check
 *
 * Usage (from skills — instruct Claude to follow this pattern):
 *   1. Read .athena-state.json (or {} if missing)
 *   2. Deep-merge your fields into the existing object
 *   3. Write the merged result back
 *   4. Never replace the file with only your fields
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = '.athena-state.json';
const BURST_FILE = '.athena-edit-burst.json';

/**
 * Resolve the state file path. Uses provided dir or cwd.
 */
function statePath(dir) {
  return path.join(dir || process.cwd(), STATE_FILE);
}

/**
 * Resolve the edit burst file path.
 */
function burstPath(dir) {
  return path.join(dir || process.cwd(), BURST_FILE);
}

/**
 * Read .athena-state.json. Returns {} on missing/corrupt file.
 * If the file exists but is corrupt (invalid JSON), backs it up
 * to .athena-state.corrupt.json before returning {}.
 * Never throws.
 */
function readState(dir) {
  try {
    const fp = statePath(dir);
    if (!fs.existsSync(fp)) return {};
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    // File exists but is corrupt — back it up for debugging
    try {
      const fp = statePath(dir);
      const backupFp = fp.replace('.json', '.corrupt.json');
      if (fs.existsSync(fp)) {
        fs.copyFileSync(fp, backupFp);
        console.error(`[Athena] State file corrupt — backed up to ${path.basename(backupFp)} and reset to {}`);
      }
    } catch { /* backup failed — non-critical */ }
    return {};
  }
}

/**
 * Read .athena-edit-burst.json. Returns {} on missing/corrupt.
 * Never throws.
 */
function readBurst(dir) {
  try {
    const fp = burstPath(dir);
    if (!fs.existsSync(fp)) return {};
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Deep merge source into target (1 level deep for nested objects).
 * - Top-level keys from source overwrite target
 * - If both source[key] and target[key] are plain objects, they are shallow-merged
 * - null values in source delete the key from the result
 *
 * This is intentionally simple — state is flat or 1-level nested.
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined) {
      delete result[key];
    } else if (
      typeof value === 'object' && !Array.isArray(value) &&
      typeof result[key] === 'object' && !Array.isArray(result[key]) &&
      result[key] !== null
    ) {
      result[key] = { ...result[key], ...value };
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Merge fields into .athena-state.json atomically.
 * Reads existing state, deep-merges new fields, writes back.
 * Creates the file if it doesn't exist.
 *
 * @param {object} fields - Fields to merge into state
 * @param {string} [dir] - Project directory (defaults to cwd)
 * @returns {object} The merged state that was written
 */
function mergeState(fields, dir) {
  const existing = readState(dir);
  const merged = deepMerge(existing, fields);
  const fp = statePath(dir);
  // Atomic write: write to temp file, then rename (prevents corruption on crash)
  const tmpFp = fp + '.tmp';
  fs.writeFileSync(tmpFp, JSON.stringify(merged, null, 2) + '\n');
  fs.renameSync(tmpFp, fp);
  return merged;
}

/**
 * Reset .athena-state.json to a clean initial state.
 * Preserves the backup of the old state for debugging.
 *
 * @param {string} [dir] - Project directory (defaults to cwd)
 * @returns {object} The fresh state that was written
 */
function resetState(dir) {
  const fp = statePath(dir);
  const existing = readState(dir);
  // Back up current state before resetting
  if (Object.keys(existing).length > 0) {
    try {
      const backupFp = fp.replace('.json', '.pre-reset.json');
      fs.writeFileSync(backupFp, JSON.stringify(existing, null, 2) + '\n');
    } catch { /* backup failed — non-critical */ }
  }
  const fresh = {};
  fs.writeFileSync(fp, JSON.stringify(fresh, null, 2) + '\n');
  return fresh;
}

/**
 * Merge fields into .athena-edit-burst.json.
 *
 * @param {object} fields - Fields to merge
 * @param {string} [dir] - Project directory
 * @returns {object} The merged burst state
 */
function mergeBurst(fields, dir) {
  const existing = readBurst(dir);
  const merged = { ...existing, ...fields };
  const fp = burstPath(dir);
  // Atomic write for burst file too
  const tmpFp = fp + '.tmp';
  fs.writeFileSync(tmpFp, JSON.stringify(merged, null, 2) + '\n');
  fs.renameSync(tmpFp, fp);
  return merged;
}

/**
 * Check if Athena is paused.
 */
function isPaused(dir) {
  return readState(dir).paused === true;
}

module.exports = {
  readState,
  readBurst,
  mergeState,
  mergeBurst,
  resetState,
  deepMerge,
  isPaused,
  statePath,
  burstPath,
  STATE_FILE,
  BURST_FILE,
};
